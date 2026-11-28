// Fase N13 (P11) — berbagi satu Scent Story secara opt-in dan eksplisit.
// Logika murni, tanpa DOM — bisa diuji node:test.
//
// Aturan keras (keputusan founder 28 Nov 2026):
// - Berbagi lewat tautan per cerita `/s/<token>` — penerima tidak
//   diketahui (tautan bisa diteruskan siapa saja); TIDAK ADA feed,
//   like, komentar, pengikut, atau direktori anggota (B4 ditolak).
// - Hanya Scent Story TERTULIS (min. 20 karakter, aturan yang sudah
//   ada) yang bisa dibagikan — wear log TIDAK bisa dibagikan.
// - Identitas mengikuti Visibilitas Profil G15: Privat → TANPA nama
//   (display_name null); Anggota saja / Semua orang → nama tampilan.
// - Token HARUS acak dan tidak bisa ditebak: 32 byte acak (256 bit)
//   dalam base64url — JANGAN pakai id cerita, user_id, atau urutan.
// - Pemilik bisa berhenti bagikan kapan saja (revoked) — tanpa
//   kedaluwarsa otomatis.
import type { StoryState } from './derivedCalculations.ts';
import type { ProfileVisibility } from './profileN6.ts';

/** Panjang minimum isi cerita agar bisa dibagikan (aturan yang sudah ada). */
export const MIN_SHAREABLE_STORY_CHARS = 20;

/** Entropi token: 32 byte = 256 bit, dirender base64url (43 karakter). */
export const SHARE_TOKEN_BYTES = 32;

/** Pola token yang sah: hanya karakter URL-safe, tepat 43 karakter. */
export const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Dokumen `shared_stories/{token}` — koleksi TERPISAH dari Jurnal
 * (Jurnal tetap privat). Id dokumen ADALAH token, jadi membaca lewat
 * tautan adalah satu `get` per-dokumen — tidak pernah `list` publik.
 * `display_name` null berarti nama disembunyikan (visibilitas Privat
 * saat dibagikan); nama TIDAK PERNAH ditulis ulang mengikuti perubahan
 * visibilitas belakangan — yang tampil adalah yang disetujui saat berbagi.
 */
export interface SharedStoryDoc {
  /** Token acak; juga id dokumen. */
  token: string;
  story_id: string;
  user_id: string;
  /** Nama tampilan pemilik SESUAI G15 saat dibagikan; null bila Privat. */
  display_name: string | null;
  title: string;
  body: string;
  perfume_id: string;
  perfume_brand: string;
  perfume_name: string;
  /** Tanggal cerita (YYYY-MM-DD). */
  story_date: string;
  created_at: string;
  revoked: boolean;
  revoked_at: string | null;
  report_count: number;
  reported_at: string | null;
}

/** 32 byte acak → base64url tanpa padding (43 karakter). */
export function generateShareToken(randomBytes?: (n: number) => Uint8Array): string {
  let bytes: Uint8Array;
  if (randomBytes) {
    bytes = randomBytes(SHARE_TOKEN_BYTES);
  } else if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    bytes = globalThis.crypto.getRandomValues(new Uint8Array(SHARE_TOKEN_BYTES));
  } else {
    // Fallback lingkungan tanpa WebCrypto (bukan produksi): tetap
    // URL-safe 43 karakter, tapi dicatat — bukan sumber entropi utama.
    bytes = new Uint8Array(SHARE_TOKEN_BYTES);
    for (let i = 0; i < SHARE_TOKEN_BYTES; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // btoa tersedia di browser dan Node 16+; ganti padding '=' (tidak ada
  // di base64url) dan karakter '+'/'/' menjadi '-'/'_'.
  const base64 = typeof btoa === 'function'
    ? btoa(binary)
    : Buffer.from(binary, 'binary').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isShareToken(value: unknown): value is string {
  return typeof value === 'string' && SHARE_TOKEN_PATTERN.test(value);
}

/**
 * Apakah cerita ini boleh dibagikan: Scent Story TERTULIS yang sudah
 * dipublikasikan, isi >= 20 karakter, dan tidak dihapus. Draft,
 * cerita pendek, dan wear log (bukan StoryState) tidak pernah lolos.
 */
export function isShareableStory(story: StoryState | null | undefined): boolean {
  if (!story) return false;
  if (story.status !== 'published') return false;
  if (story.deleted_at) return false;
  return story.body.trim().length >= MIN_SHAREABLE_STORY_CHARS;
}

/**
 * Nama yang tampil di halaman berbagi, mengikuti G15 SAAT dibagikan.
 * Privat → null (nama TIDAK PERNAH tampil). Anggota saja / Semua
 * orang → nama tampilan pemilik (null bila nama kosong — jangan
 * tampilkan string kosong atau placeholder tebakan).
 */
export function resolveSharedDisplayName(
  visibility: ProfileVisibility,
  nickname: string | null | undefined,
): string | null {
  if (visibility === 'private') return null;
  const name = (nickname ?? '').trim();
  return name ? name : null;
}

/** Tautan publik satu cerita. `origin` dari window.location.origin. */
export function sharedStoryUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/s/${token}`;
}

/**
 * Parse path `/s/<segmen>` → segmen mentah, atau null bila bukan
 * tautan berbagi. Segmen yang bentuknya BUKAN token sah tetap
 * dikembalikan (bukan null): halaman berbagi yang menanganinya
 * dengan panel "tidak ditemukan" yang jujur — JANGAN PERNAH diam-diam
 * menampilkan Beranda untuk tautan /s/ yang rusak.
 */
export function parseSharedStoryPath(pathname: string): string | null {
  const m = pathname.match(/^\/s\/([A-Za-z0-9_-]+)\/?$/);
  if (!m) return null;
  return m[1];
}

/**
 * Bangun dokumen shared_stories dari satu Scent Story milik sendiri.
 * Token dibuat baru di sini (atau dipakai dari `token` bila pemanggil
 * sudah membuatnya — JANGAN pernah memakai id cerita sebagai token).
 * display_name diputuskan SEKALI di sini dari G15; perubahan
 * visibilitas belakangan tidak mengubah tautan yang sudah dibagikan.
 */
export function buildSharedStoryDoc(input: {
  story: StoryState;
  userId: string;
  visibility: ProfileVisibility;
  nickname: string | null | undefined;
  perfumeBrand: string;
  perfumeName: string;
  token?: string;
  nowIso?: string;
}): SharedStoryDoc {
  const { story, userId, visibility, nickname, perfumeBrand, perfumeName } = input;
  const token = input.token && isShareToken(input.token) ? input.token : generateShareToken();
  const now = input.nowIso ?? new Date().toISOString();
  return {
    token,
    story_id: story.id,
    user_id: userId,
    display_name: resolveSharedDisplayName(visibility, nickname),
    title: story.title ?? '',
    body: story.body,
    perfume_id: story.perfume_id,
    perfume_brand: perfumeBrand,
    perfume_name: perfumeName,
    story_date: story.story_date ?? now.slice(0, 10),
    created_at: now,
    revoked: false,
    revoked_at: null,
    report_count: 0,
    reported_at: null,
  };
}

/**
 * Parse defensif satu dokumen Firestore menjadi SharedStoryDoc.
 * Dokumen rusak (token tidak cocok dengan id, isi < 20 karakter,
 * field wajib bukan string) dibuang → null. Jangan pernah menampilkan
 * dokumen setengah jadi sebagai cerita yang dibagikan.
 */
export function parseSharedStory(raw: unknown): SharedStoryDoc | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  const id = typeof d.id === 'string' ? d.id : null;
  const token = typeof d.token === 'string' ? d.token : null;
  if (!token || !isShareToken(token)) return null;
  if (id !== null && id !== token) return null;
  if (typeof d.story_id !== 'string' || !d.story_id) return null;
  if (typeof d.user_id !== 'string' || !d.user_id) return null;
  if (d.display_name !== null && typeof d.display_name !== 'string') return null;
  if (typeof d.body !== 'string' || d.body.trim().length < MIN_SHAREABLE_STORY_CHARS) return null;
  if (typeof d.perfume_id !== 'string' || !d.perfume_id) return null;
  if (typeof d.perfume_brand !== 'string' || typeof d.perfume_name !== 'string') return null;
  if (typeof d.story_date !== 'string' || typeof d.created_at !== 'string') return null;
  if (typeof d.revoked !== 'boolean') return null;
  if (typeof d.report_count !== 'number' || d.report_count < 0) return null;
  return {
    token,
    story_id: d.story_id,
    user_id: d.user_id,
    display_name: d.display_name as string | null,
    title: typeof d.title === 'string' ? d.title : '',
    body: d.body,
    perfume_id: d.perfume_id,
    perfume_brand: d.perfume_brand,
    perfume_name: d.perfume_name,
    story_date: d.story_date,
    created_at: d.created_at,
    revoked: d.revoked,
    revoked_at: typeof d.revoked_at === 'string' ? d.revoked_at : null,
    report_count: d.report_count,
    reported_at: typeof d.reported_at === 'string' ? d.reported_at : null,
  };
}
