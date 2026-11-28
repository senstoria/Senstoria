// Fase N5 (E1–E2): logika murni layar Wishlist — tanpa DOM, bisa diuji node:test.
import type { SeedPerfume } from '../data/seedPerfumes.ts';

/** Ukuran botol standar yang ditawarkan sheet Wishlist (E2, harfiah rencana). */
export const WISHLIST_SIZES = [30, 50, 100] as const;

export type WishlistSize = (typeof WISHLIST_SIZES)[number];

/** Kunci localStorage untuk ukuran terakhir yang dipilih, per parfum (E2). */
export const WISHLIST_SIZE_MEMORY_KEY = 'senstoria_wishlist_size_by_perfume';

export type SizeMemory = Record<string, number>;

/**
 * Parfum wishlist sesuai urutan ids; id yang tidak ada di katalog dibuang
 * (tidak pernah menampilkan parfum karangan), duplikat id hanya sekali.
 */
export function resolveWishlistPerfumes(ids: string[], perfumes: SeedPerfume[]): SeedPerfume[] {
  const byId = new Map(perfumes.map(p => [p.id, p]));
  const out: SeedPerfume[] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}

/**
 * Ukuran awal sheet: ingatan per parfum bila masih ditawarkan; kalau tidak,
 * fallback (harga referensi parfum) bila ditawarkan; kalau tidak, 50 ml.
 */
export function getRememberedSize(memory: SizeMemory, perfumeId: string, fallback: number): number {
  const sizes = WISHLIST_SIZES as readonly number[];
  const remembered = memory[perfumeId];
  if (typeof remembered === 'number' && sizes.includes(remembered)) return remembered;
  if (sizes.includes(fallback)) return fallback;
  return 50;
}

export function rememberSize(memory: SizeMemory, perfumeId: string, size: number): SizeMemory {
  return { ...memory, [perfumeId]: size };
}

/**
 * Harga pro-rata dari harga referensi (harga per ml × ukuran yang dipilih).
 * Dipakai saat "Tambahkan ke Lemari" dari Wishlist menambah botol langsung
 * tanpa form harga — pengguna bisa mengoreksi harga botol di Lemari.
 * Bila ukuran referensi tidak valid, harga referensi dipakai apa adanya.
 */
export function proRatedPrice(referencePriceIdr: number, referenceSizeMl: number, sizeMl: number): number {
  if (!referenceSizeMl || referenceSizeMl <= 0) return Math.round(referencePriceIdr);
  return Math.round((referencePriceIdr * sizeMl) / referenceSizeMl);
}

export interface SizeStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): SizeStorageLike | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // localStorage tidak tersedia (mis. node:test) — pemanggil memakai
    // penyimpanan injeksi atau menerima map kosong.
  }
  return null;
}

/** Baca ingatan ukuran; data rusak/asing diabaikan (kembali {}), bukan crash. */
export function loadSizeMemory(storage: SizeStorageLike | null = defaultStorage()): SizeMemory {
  if (!storage) return {};
  try {
    const raw = storage.getItem(WISHLIST_SIZE_MEMORY_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: SizeMemory = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveSizeMemory(memory: SizeMemory, storage: SizeStorageLike | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(WISHLIST_SIZE_MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // Penyimpanan penuh/diblokir — ukuran tetap berlaku untuk sesi ini.
  }
}
