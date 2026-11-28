// ═══════════════════════════════════════════════════════════════════════════
// P1 Admin v1 — Katalog Firestore /perfumes.
//
// Keputusan Q1 (founder, 28 Nov 2026 21:54 WIB): file seed BUKAN LAGI sumber
// kebenaran katalog. Sumber kebenaran adalah koleksi Firestore `/perfumes`;
// `seedPerfumes.ts` hanya sumber migrasi satu kali. Publish jadi tombol di
// admin (lihat AdminDashboardView), bukan lagi lewat kode + PR.
//
// Aturan yang ditegakkan file ini (Spek Admin v1 §3, §5; review A1–A3):
//  1. Setiap tulis admin menunggu konfirmasi server (await) SEBELUM pemanggil
//     menampilkan toast sukses. Tidak ada toast optimistis di jalur ini.
//  2. Field kosong tetap kosong — tidak ada default fabrikasi (tanpa gender
//     'unisex', longevity '6-8h', projection 3, deskripsi template, atau URL
//     pencarian marketplace sebagai offer). Yang tidak diketahui disimpan
//     sebagai 'unknown'/0/'' sesuai tipenya, dan UI menampilkannya sebagai
//     "belum ada data", bukan sebagai fakta.
//  3. Hapus bersifat soft-delete (data_status 'deleted' + deletedAt) dulu;
//     hard-delete hanya aksi kedua yang tercatat (belum ada di v1).
//  4. Longevity TIDAK pernah ditulis dari form: longevity_expected_band
//     hanya dipertahankan dari data lama; angka longevity resmi datang dari
//     agregasi review customer (ambang n>=5), bukan dari klaim/estimasi.
//
// RANCANGAN TRANSISI PRA-MIGRASI (baca sebelum mengubah!):
//  Sebelum founder menjalankan migrasi (docs/admin-catalog-migration-
//  runbook.md), koleksi /perfumes masih kosong. Bila katalog publik langsung
//  membaca Firestore saja, produksi akan kosong. Karena itu App.tsx memakai
//  strategi berikut — JUJUR, bukan fallback diam-diam:
//   - Saat muat, App membandingkan isi /perfumes dengan seed. Bila SEMUA id
//     seed sudah ada di Firestore, migrasi dianggap selesai dan seed TIDAK
//     dipakai sama sekali (sumber 'firestore').
//   - Bila /perfumes kosong atau belum lengkap, App MENGGABUNGKAN seed +
//     dokumen Firestore (dokumen Firestore menang per id) dan menandai
//     sumbernya 'seed-pre-migration'. Penanda ini TAMPIL di tab katalog
//     admin (banner + jumlah baris yang sudah termigrasi) dan dicatat di
//     runbook. Katalog publik tetap berfungsi pra-migrasi, tapi tidak ada
//     yang bisa mengira datanya berasal dari Firestore.
//   - Setelah migrasi terverifikasi, matikan jalur seed: ubah
//     SEED_FALLBACK_ENABLED di bawah menjadi false (lewat PR). Setelah itu
//     /perfumes kosong berarti katalog kosong + keadaan error yang jujur,
//     bukan seed yang menyamar.
//  Peringatan: JANGAN membuat parfum baru di admin sebelum migrasi (atau
//  jalankan migrasi lagi setelahnya — migrasi idempotent dan melewati
//  dokumen yang sudah ada), karena tulis admin ke Firestore yang belum
//  lengkap akan membuat hitungan "migrasi belum lengkap" bertambah.
// ═══════════════════════════════════════════════════════════════════════════

import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import { SEED_PERFUMES, type SeedPerfume } from '../data/seedPerfumes.ts';

/** Status katalog di Firestore. Alur: draft → review → published; unpublish kembali ke draft. */
export type CatalogStatus = 'draft' | 'review' | 'published' | 'deleted';

/** Dari mana katalog yang sedang ditampilkan berasal (label jujur, lihat header file). */
export type CatalogSource = 'loading' | 'firestore' | 'seed-pre-migration' | 'error';

/**
 * Kill-switch jalur seed. TRUE selama masa transisi pra-migrasi.
 * Setelah migrasi terverifikasi (runbook §5), ubah menjadi false lewat PR:
 * seed berhenti dipakai dan /perfumes kosong berarti katalog kosong.
 */
export const SEED_FALLBACK_ENABLED = true;

/**
 * Dokumen katalog di /perfumes. Semua field SeedPerfume dipertahankan agar
 * komponen publik (CatalogView, Detail, Finder, Compare) tetap bisa membaca
 * lewat toSeedPerfume() tanpa perubahan; ditambah field admin v1.
 *
 * Pengecualian terhadap SeedPerfume:
 * - data_status memakai CatalogStatus ('review'/'deleted' bukan bagian
 *   DataStatus seed).
 * - market_tier opsional: tidak ada nilai 'unknown' di kosakata tier, dan
 *   tier DITAMPILKAN publik (Detail/Compare), jadi nilai yang tidak
 *   diketahui TIDAK BOLEH ditebak — form wajib memilih tier saat simpan
 *   (lihat validatePerfumeForSave). toSeedPerfume hanya memakai fallback
 *   'indie' sebagai penyesuai tipe untuk baris lama; baris baru selalu
 *   punya tier eksplisit.
 * - projection_expected: 0 berarti "belum ada data" (bukan klaim 0/4).
 *   Detail/Compare menampilkan 0/4 — sinyal kosong yang terlihat, bukan
 *   angka fabrikasi.
 * - season: musim pemakaian ('' bila belum ditentukan). SeedPerfume tidak
 *   punya field ini; Finder tidak memakainya di v1.
 * - photo_url/photo_verified: foto via URL + checklist verifikasi
 *   (1:1, latar putih, rounded 22px, object-cover). Upload ke Storage
 *   DITUNDA sampai keputusan Blaze — v1 hanya URL + verifikasi manual.
 */
export interface PerfumeDoc extends Omit<SeedPerfume, 'data_status' | 'market_tier'> {
  data_status: CatalogStatus;
  market_tier?: SeedPerfume['market_tier'];
  /** Musim pemakaian, mis. 'spring' | 'summer' | 'autumn' | 'winter' | 'all-season'. Kosong bila belum ditentukan. */
  season?: string;
  /** URL foto produk (bukan hasil pencarian/marketplace). */
  photo_url?: string;
  /** true hanya bila keempat poin checklist foto sudah diperiksa admin. */
  photo_verified?: boolean;
  /** ISO timestamp soft-delete; null/absent berarti tidak dihapus. */
  deletedAt?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Alasan gagal, satu per field — dipakai publish agar admin tahu persis yang kurang. */
export interface ValidationReason {
  field: string;
  message: string;
}

/** Dilempar publishPerfume bila validasi publish gagal; membawa alasan PER FIELD. */
export class PublishValidationError extends Error {
  reasons: ValidationReason[];
  constructor(reasons: ValidationReason[]) {
    super(`Tidak bisa menerbitkan: ${reasons.map(r => r.message).join('; ')}`);
    this.name = 'PublishValidationError';
    this.reasons = reasons;
  }
}

const CONCENTRATIONS: ReadonlyArray<SeedPerfume['concentration']> = ['EDC', 'EDT', 'EDP', 'Parfum', 'Extrait'];
const MARKET_TIERS: ReadonlyArray<NonNullable<SeedPerfume['market_tier']>> = ['mass', 'designer', 'niche', 'indie'];

/** Hapus kunci bernilai undefined (Firestore menolak undefined) — dokumen katalog datar, shallow cukup. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function sortDocs(docs: PerfumeDoc[]): PerfumeDoc[] {
  return [...docs].sort((a, b) =>
    a.brand.localeCompare(b.brand, 'id') || a.name.localeCompare(b.name, 'id'),
  );
}

// ── Pemetaan seed ⇄ dokumen ──────────────────────────────────────────────

/**
 * Seed → dokumen Firestore. data_status seed 'verified' dipetakan ke
 * 'review' (tahap pra-terbit); 'archived' tidak ada di seed saat ini (36
 * baris: 22 draft + 14 published) dan dipetakan ke 'draft' agar tidak
 * hilang diam-diam bila muncul nanti. verified_by dan data_status
 * dipertahankan apa adanya.
 */
export function seedToPerfumeDoc(seed: SeedPerfume): PerfumeDoc {
  const data_status: CatalogStatus =
    seed.data_status === 'published' ? 'published'
    : seed.data_status === 'verified' ? 'review'
    : 'draft';
  return {
    ...seed,
    data_status,
    photo_url: seed.image_url,
    photo_verified: Boolean(seed.image_url && seed.image_checked_date),
  };
}

/**
 * Dokumen → SeedPerfume untuk komponen publik yang belum di-rewire.
 * Hanya dipakai untuk baris yang memang tampil publik (published) atau
 * pustaka lokal (semua status non-deleted); 'review' → 'verified',
 * 'deleted' → 'archived' (pemanggil wajib menyaring 'deleted' dulu).
 * market_tier yang tidak diketahui memakai fallback tipe 'indie' — lihat
 * catatan di PerfumeDoc; baris baru dari form selalu punya tier eksplisit.
 */
export function toSeedPerfume(doc: PerfumeDoc): SeedPerfume {
  const { photo_url: _photo_url, photo_verified: _photo_verified, season: _season, deletedAt: _deletedAt, created_at: _created_at, updated_at: _updated_at, ...rest } = doc;
  void _photo_url;
  void _photo_verified;
  void _season;
  void _deletedAt;
  void _created_at;
  void _updated_at;
  return {
    ...rest,
    data_status:
      doc.data_status === 'published' ? 'published'
      : doc.data_status === 'review' ? 'verified'
      : doc.data_status === 'deleted' ? 'archived'
      : 'draft',
    market_tier: doc.market_tier ?? 'indie',
    image_url: rest.image_url ?? doc.photo_url,
  };
}

/**
 * Gabung seed + dokumen Firestore: dokumen Firestore menang per id, baris
 * seed yang belum termigrasi mengisi kekosongannya. Dipakai HANYA selama
 * sumber 'seed-pre-migration' (SEED_FALLBACK_ENABLED). Setelah migrasi
 * lengkap, hasil gabungan == isi Firestore dan fungsi ini tidak dipakai.
 */
export function mergeCatalogDocs(seedDocs: PerfumeDoc[], firestoreDocs: PerfumeDoc[]): PerfumeDoc[] {
  const byId = new Map<string, PerfumeDoc>();
  for (const s of seedDocs) byId.set(s.id, s);
  for (const f of firestoreDocs) byId.set(f.id, f);
  return sortDocs([...byId.values()]);
}

/** Migrasi dianggap lengkap bila setiap id seed sudah ada di Firestore. */
export function isMigrationComplete(seedDocs: PerfumeDoc[], firestoreDocs: PerfumeDoc[]): boolean {
  if (seedDocs.length === 0) return firestoreDocs.length > 0;
  const ids = new Set(firestoreDocs.map(d => d.id));
  return seedDocs.every(s => ids.has(s.id));
}

/** Semua baris seed sebagai dokumen (dipakai App sebagai keadaan awal + fallback pra-migrasi). */
export function seedCatalogDocs(): PerfumeDoc[] {
  return sortDocs(SEED_PERFUMES.map(seedToPerfumeDoc));
}

// ── Validasi ─────────────────────────────────────────────────────────────

/**
 * Validasi simpan (buat/edit). Wajib: nama, brand, konsentrasi. market_tier
 * ikut wajib BUKAN karena spek menyebutnya, melainkan karena tier
 * DITAMPILKAN publik (Detail/Compare) tanpa nilai 'unknown' — membiarkannya
 * kosong berarti menampilkan tebakan. Gender/longevity/projection tidak
 * wajib: 'unknown'/0 adalah nilai kosong yang jujur untuk ketiganya.
 */
export function validatePerfumeForSave(doc: Partial<PerfumeDoc>): ValidationReason[] {
  const reasons: ValidationReason[] = [];
  if (!doc.name || !doc.name.trim()) {
    reasons.push({ field: 'name', message: 'Nama parfum wajib diisi.' });
  }
  if (!doc.brand || !doc.brand.trim()) {
    reasons.push({ field: 'brand', message: 'Brand wajib diisi.' });
  }
  if (!doc.concentration || !CONCENTRATIONS.includes(doc.concentration)) {
    reasons.push({ field: 'concentration', message: 'Konsentrasi wajib dipilih (EDC/EDT/EDP/Parfum/Extrait).' });
  }
  if (!doc.market_tier || !MARKET_TIERS.includes(doc.market_tier)) {
    reasons.push({ field: 'market_tier', message: 'Market tier wajib dipilih — tier tampil di halaman publik, jadi tidak boleh ditebak.' });
  }
  return reasons;
}

function isHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validasi publish (di atas validasi simpan). Syarat founder (Spek §5):
 * notes + family + sumber resmi. Alasan dikembalikan PER FIELD agar admin
 * tahu persis yang kurang — bukan satu pesan generik.
 */
export function validatePublish(doc: PerfumeDoc): ValidationReason[] {
  const reasons = validatePerfumeForSave(doc);
  if (!doc.top_notes || !doc.top_notes.trim()) {
    reasons.push({ field: 'top_notes', message: 'Top notes wajib diisi sebelum terbit.' });
  }
  if (!doc.heart_notes || !doc.heart_notes.trim()) {
    reasons.push({ field: 'heart_notes', message: 'Heart notes wajib diisi sebelum terbit.' });
  }
  if (!doc.base_notes || !doc.base_notes.trim()) {
    reasons.push({ field: 'base_notes', message: 'Base notes wajib diisi sebelum terbit.' });
  }
  if (!doc.primary_family || !doc.primary_family.trim()) {
    reasons.push({ field: 'primary_family', message: 'Family utama wajib diisi sebelum terbit.' });
  }
  if (!doc.source_official_url || !doc.source_official_url.trim()) {
    reasons.push({ field: 'source_official_url', message: 'URL sumber resmi wajib diisi sebelum terbit.' });
  } else if (!isHttpUrl(doc.source_official_url.trim())) {
    reasons.push({ field: 'source_official_url', message: 'URL sumber resmi harus berupa tautan http(s) yang valid.' });
  }
  return reasons;
}

// ── Baca ─────────────────────────────────────────────────────────────────

/** Parse satu dokumen mentah; mengembalikan null (dan warn) bila rusak, agar satu baris rusak tidak meruntuhkan seluruh katalog. */
export function parsePerfumeDoc(id: string, data: unknown): PerfumeDoc | null {
  if (!data || typeof data !== 'object') {
    console.warn(`[katalog] dokumen /perfumes/${id} kosong/rusak — dilewati.`);
    return null;
  }
  const d = data as Record<string, unknown>;
  if (typeof d.name !== 'string' || !d.name.trim()) {
    console.warn(`[katalog] dokumen /perfumes/${id} tanpa nama — dilewati.`);
    return null;
  }
  if (typeof d.brand !== 'string' || !d.brand.trim()) {
    console.warn(`[katalog] dokumen /perfumes/${id} tanpa brand — dilewati.`);
    return null;
  }
  if (typeof d.concentration !== 'string' || !CONCENTRATIONS.includes(d.concentration as SeedPerfume['concentration'])) {
    console.warn(`[katalog] dokumen /perfumes/${id} tanpa konsentrasi valid — dilewati.`);
    return null;
  }
  const status = typeof d.data_status === 'string' ? d.data_status : 'draft';
  const data_status: CatalogStatus =
    status === 'published' || status === 'review' || status === 'deleted' ? status : 'draft';
  return {
    ...(d as unknown as PerfumeDoc),
    id,
    name: d.name,
    brand: d.brand,
    concentration: d.concentration as SeedPerfume['concentration'],
    data_status,
  };
}

/**
 * Katalog publik: hanya baris published. Rules mengizinkan list publik
 * hanya untuk data_status == 'published' — query ini cocok dengan rules
 * (firestore.rules /perfumes), jadi bisa dipanggil tanpa login admin.
 */
export async function loadPublishedPerfumes(db: Firestore): Promise<PerfumeDoc[]> {
  const q = query(collection(db, 'perfumes'), where('data_status', '==', 'published'));
  const snap = await getDocs(q);
  return sortDocs(
    snap.docs
      .map(d => parsePerfumeDoc(d.id, d.data()))
      .filter((d): d is PerfumeDoc => d !== null),
  );
}

/**
 * Semua baris untuk admin (draft/review/published/deleted). Hanya admin
 * (custom claim) yang boleh list tanpa filter menurut rules.
 */
export async function loadAllPerfumesForAdmin(db: Firestore): Promise<PerfumeDoc[]> {
  const snap = await getDocs(collection(db, 'perfumes'));
  return sortDocs(
    snap.docs
      .map(d => parsePerfumeDoc(d.id, d.data()))
      .filter((d): d is PerfumeDoc => d !== null),
  );
}

// ── Tulis ────────────────────────────────────────────────────────────────
// SEMUA fungsi tulis memakai setDoc dengan dokumen LENGKAP, BUKAN updateDoc
// dan BUKAN merge:
//  - Selama masa transisi, baris seed yang diedit / diterbitkan di admin
//    mungkin BELUM ADA sebagai dokumen Firestore, dan updateDoc pada
//    dokumen yang tidak ada akan gagal. setDoc membuat (upsert) baris itu
//    secara lengkap — aman pra- maupun pasca-migrasi.
//  - Tanpa merge, field yang dikosongkan di form (undefined → dibuang
//    stripUndefined) benar-benar TERHAPUS dari dokumen — merge justru
//    akan membiarkan nilai lama diam-diam bertahan.
// Pemanggil WAJIB await dan hanya menampilkan sukses setelah await kembali.

function perfumeDocRef(db: Firestore, id: string) {
  return doc(db, 'perfumes', id);
}

async function writeFullDoc(db: Firestore, perfume: PerfumeDoc): Promise<PerfumeDoc> {
  const now = new Date().toISOString();
  const toWrite: PerfumeDoc = stripUndefined({
    ...perfume,
    updated_at: now,
    created_at: perfume.created_at ?? now,
  });
  await setDoc(perfumeDocRef(db, perfume.id), toWrite);
  return toWrite;
}

/**
 * Buat parfum baru — selalu sebagai 'draft', tidak peduli status input.
 * Id dari form dipakai bila ada (prf_xxx), kalau tidak dibuatkan baru.
 */
export async function createPerfume(db: Firestore, input: PerfumeDoc): Promise<PerfumeDoc> {
  const id = input.id && input.id.trim() ? input.id.trim() : doc(collection(db, 'perfumes')).id;
  const now = new Date().toISOString();
  const toWrite: PerfumeDoc = stripUndefined({
    ...input,
    id,
    data_status: 'draft' as const,
    created_at: now,
    updated_at: now,
  });
  await setDoc(perfumeDocRef(db, id), toWrite);
  return toWrite;
}

/** Simpan edit (status dipertahankan — edit parfum published tidak menurunkannya ke draft). */
export async function updatePerfume(db: Firestore, perfume: PerfumeDoc): Promise<PerfumeDoc> {
  return writeFullDoc(db, perfume);
}

/**
 * Terbitkan: validasi dulu (melempar PublishValidationError berisi alasan
 * PER FIELD bila gagal — TIDAK ADA tulis yang terjadi), lalu catat
 * verified_by + source_checked_date hari ini. verifiedBy adalah identitas
 * admin yang menekan tombol (email/uid dari App).
 */
export async function publishPerfume(db: Firestore, perfume: PerfumeDoc, verifiedBy: string): Promise<PerfumeDoc> {
  const reasons = validatePublish(perfume);
  if (reasons.length > 0) throw new PublishValidationError(reasons);
  return writeFullDoc(db, {
    ...perfume,
    data_status: 'published',
    verified_by: verifiedBy,
    source_checked_date: todayIsoDate(),
    published_at: perfume.published_at ?? todayIsoDate(),
  });
}

/** Tarik dari publik: kembali ke draft. verified_by/source_checked_date dipertahankan sebagai riwayat. */
export async function unpublishPerfume(db: Firestore, perfume: PerfumeDoc): Promise<PerfumeDoc> {
  return writeFullDoc(db, { ...perfume, data_status: 'draft' });
}

/** Soft-delete: arsip (data_status 'deleted' + deletedAt). BUKAN hard-delete. */
export async function deletePerfume(db: Firestore, perfume: PerfumeDoc): Promise<PerfumeDoc> {
  return writeFullDoc(db, {
    ...perfume,
    data_status: 'deleted',
    deletedAt: new Date().toISOString(),
  });
}

/** Pulihkan arsip ke status sebelumnya (dipakai tombol Urungkan setelah hapus). */
export async function restorePerfume(db: Firestore, perfume: PerfumeDoc, previousStatus: CatalogStatus): Promise<PerfumeDoc> {
  return writeFullDoc(db, {
    ...perfume,
    data_status: previousStatus === 'deleted' ? 'draft' : previousStatus,
    deletedAt: null,
  });
}
