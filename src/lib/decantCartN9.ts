// Fase N9 (B2 + E1 + P4): logika murni Keranjang decant — tanpa DOM, bisa
// diuji node:test.
//
// Keranjang ini PERNYATAAN NIAT, bukan transaksi (keputusan founder P4,
// 28 Nov 2026 12:28 WIB): tanpa harga, tanpa checkout, tanpa pembayaran,
// tanpa total, tanpa stok, tanpa countdown. Satu-satunya yang disimpan:
// parfum + ukuran decant (5/10 ml) + jumlah (1–4, sheet F2).
// Tidak membaca waitlist_entries (hash-locked admin-only) dan tidak
// menyentuh firestore.rules.
import type { SeedPerfume } from '../data/seedPerfumes.ts';

/** Ukuran decant yang ditawarkan (founder: HANYA 5 ml & 10 ml). */
export const DECANT_CART_SIZES = [5, 10] as const;

export type DecantCartSizeMl = (typeof DECANT_CART_SIZES)[number];

/** Jumlah per baris di keranjang (sheet F2: 1–4). */
export const DECANT_CART_QUANTITIES = [1, 2, 3, 4] as const;

/** Kunci localStorage keranjang decant (tamu). */
export const DECANT_CART_KEY = 'senstoria_decant_cart_v1';

export interface DecantCartItem {
  /** Id parfum katalog (published) — bukan id dummy, bukan id Firestore. */
  perfumeId: string;
  /** Ukuran decant, hanya 5 atau 10 ml. */
  sizeMl: DecantCartSizeMl;
  /** Jumlah, selalu 1–4 (F2). */
  quantity: number;
}

export type DecantCart = DecantCartItem[];

/** Identitas satu baris keranjang: parfum + ukuran. */
export function cartItemKey(perfumeId: string, sizeMl: number): string {
  return `${perfumeId}:${sizeMl}`;
}

function isValidSize(sizeMl: unknown): sizeMl is DecantCartSizeMl {
  return sizeMl === 5 || sizeMl === 10;
}

function clampQuantity(q: unknown): number {
  const n = typeof q === 'number' && Number.isFinite(q) ? Math.floor(q) : 1;
  return Math.min(4, Math.max(1, n));
}

/**
 * Validasi keranjang dari storage: baris yang parfumnya tidak dikenal,
 * ukurannya bukan 5/10 ml, atau bentuknya rusak dibuang — tidak pernah
 * menampilkan parfum karangan. Duplikat (parfum + ukuran sama) digabung.
 */
export function parseDecantCart(raw: unknown, knownPerfumeIds: Set<string> | string[]): DecantCartItem[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(knownPerfumeIds);
  const merged = new Map<string, DecantCartItem>();
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const { perfumeId, sizeMl, quantity } = entry as Record<string, unknown>;
    if (typeof perfumeId !== 'string' || !known.has(perfumeId)) continue;
    if (!isValidSize(sizeMl)) continue;
    const key = cartItemKey(perfumeId, sizeMl);
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = Math.min(4, existing.quantity + clampQuantity(quantity));
    } else {
      merged.set(key, { perfumeId, sizeMl, quantity: clampQuantity(quantity) });
    }
  }
  return [...merged.values()];
}

/** Jumlah total unit di keranjang (dipakai badge tombol Keranjang). */
export function cartUnitCount(items: DecantCart): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Jumlah baris berbeda di keranjang. */
export function cartLineCount(items: DecantCart): number {
  return items.length;
}

/**
 * Tambah ke keranjang: baris (parfum + ukuran) yang sama digabung
 * (jumlah dijumlah, dibatasi 4 — F2); baris baru ditambah di akhir.
 * Tidak pernah mengubah harga/stok — tidak ada harga/stok di sini.
 */
export function addToDecantCart(items: DecantCart, perfumeId: string, sizeMl: DecantCartSizeMl, quantity: number): DecantCart {
  const qty = clampQuantity(quantity);
  const key = cartItemKey(perfumeId, sizeMl);
  const existing = items.find(item => cartItemKey(item.perfumeId, item.sizeMl) === key);
  if (existing) {
    return items.map(item =>
      cartItemKey(item.perfumeId, item.sizeMl) === key
        ? { ...item, quantity: Math.min(4, item.quantity + qty) }
        : item,
    );
  }
  return [...items, { perfumeId, sizeMl, quantity: qty }];
}

/** Ubah jumlah satu baris (sheet F2); jumlah selalu dijaga 1–4. */
export function setDecantCartQuantity(items: DecantCart, perfumeId: string, sizeMl: DecantCartSizeMl, quantity: number): DecantCart {
  const key = cartItemKey(perfumeId, sizeMl);
  return items.map(item =>
    cartItemKey(item.perfumeId, item.sizeMl) === key
      ? { ...item, quantity: clampQuantity(quantity) }
      : item,
  );
}

/** Hapus satu baris dari keranjang ("Hapus" di sheet F2). */
export function removeFromDecantCart(items: DecantCart, perfumeId: string, sizeMl: DecantCartSizeMl): DecantCart {
  const key = cartItemKey(perfumeId, sizeMl);
  return items.filter(item => cartItemKey(item.perfumeId, item.sizeMl) !== key);
}

/** Jumlah satu baris, 0 bila baris belum ada di keranjang. */
export function cartQuantityFor(items: DecantCart, perfumeId: string, sizeMl: DecantCartSizeMl): number {
  return items.find(item => item.perfumeId === perfumeId && item.sizeMl === sizeMl)?.quantity ?? 0;
}

/**
 * Parfum untuk tiap baris keranjang, sesuai urutan baris; baris yang
 * parfumnya tidak lagi published dibuang (tidak pernah menampilkan
 * parfum karangan).
 */
export function resolveDecantCartPerfumes(items: DecantCart, perfumes: SeedPerfume[]): Array<{ item: DecantCartItem; perfume: SeedPerfume }> {
  const byId = new Map(perfumes.map(p => [p.id, p]));
  const out: Array<{ item: DecantCartItem; perfume: SeedPerfume }> = [];
  for (const item of items) {
    const perfume = byId.get(item.perfumeId);
    if (perfume) out.push({ item, perfume });
  }
  return out;
}

export interface CartStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): CartStorageLike | null {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch {
    return null;
  }
  return null;
}

/** Muat keranjang dari storage (tamu); rusak/tidak dikenal → []. */
export function loadDecantCart(storage: CartStorageLike | null = defaultStorage(), knownPerfumeIds: Set<string> | string[]): DecantCart {
  if (!storage) return [];
  try {
    const raw = storage.getItem(DECANT_CART_KEY);
    if (!raw) return [];
    return parseDecantCart(JSON.parse(raw), knownPerfumeIds);
  } catch {
    return [];
  }
}

/** Simpan keranjang ke storage (tamu). */
export function saveDecantCart(items: DecantCart, storage: CartStorageLike | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(DECANT_CART_KEY, JSON.stringify(items));
  } catch {
    // Storage penuh/tidak tersedia — keranjang tetap hidup di memori sesi.
  }
}
