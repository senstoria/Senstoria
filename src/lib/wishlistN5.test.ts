import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { translations } from './i18n';
import { SEED_PERFUMES, PUBLISHED_PERFUMES } from '../data/seedPerfumes';
import {
  WISHLIST_SIZES,
  WISHLIST_SIZE_MEMORY_KEY,
  getRememberedSize,
  loadSizeMemory,
  proRatedPrice,
  rememberSize,
  resolveWishlistPerfumes,
  saveSizeMemory,
  type SizeMemory,
  type SizeStorageLike,
} from './wishlistN5';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wishlistSrc = readFileSync(
  path.join(__dirname, '../components/WishlistView.tsx'),
  'utf-8'
);

/** Penyimpanan palsu untuk node:test (localStorage tidak tersedia di sini). */
function fakeStorage(initial: Record<string, string> = {}): SizeStorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = v; },
  };
}

describe('Fase N5 — Wishlist sebagai layar (E1–E2, P3, BR-03)', () => {
  it('WISHLIST_SIZES adalah 30/50/100 (harfiah rencana E2)', () => {
    assert.deepEqual([...WISHLIST_SIZES], [30, 50, 100]);
  });

  it('resolveWishlistPerfumes: urutan ids dipertahankan, id asing dibuang, duplikat sekali', () => {
    const [a, b] = PUBLISHED_PERFUMES;
    const out = resolveWishlistPerfumes([b.id, 'prf_tidak_ada', a.id, b.id], SEED_PERFUMES);
    assert.deepEqual(out.map(p => p.id), [b.id, a.id]);
    assert.deepEqual(resolveWishlistPerfumes([], SEED_PERFUMES), []);
  });

  it('getRememberedSize: ingatan valid dipakai; ingatan di luar 30/50/100 diabaikan', () => {
    const memory: SizeMemory = { prf_001: 50, prf_002: 75 };
    assert.equal(getRememberedSize(memory, 'prf_001', 100), 50);
    assert.equal(getRememberedSize(memory, 'prf_002', 100), 100);
    assert.equal(getRememberedSize(memory, 'prf_999', 30), 30);
    assert.equal(getRememberedSize(memory, 'prf_999', 75), 50);
  });

  it('rememberSize: tidak mengubah map lama (immutable), menimpa per parfum', () => {
    const before: SizeMemory = { prf_001: 30 };
    const after = rememberSize(before, 'prf_002', 100);
    assert.deepEqual(before, { prf_001: 30 });
    assert.deepEqual(after, { prf_001: 30, prf_002: 100 });
    assert.deepEqual(rememberSize(after, 'prf_001', 50), { prf_001: 50, prf_002: 100 });
  });

  it('proRatedPrice: harga per ml × ukuran; ukuran referensi tidak valid → harga referensi', () => {
    assert.equal(proRatedPrice(633215, 100, 50), 316608); // 633215 * 50 / 100 = 316607.5 → 316608
    assert.equal(proRatedPrice(279000, 30, 30), 279000);
    assert.equal(proRatedPrice(279000, 30, 100), 930000);
    assert.equal(proRatedPrice(100000, 0, 50), 100000);
  });

  it('load/saveSizeMemory: round-trip; JSON rusak → {}; nilai bukan angka dibuang', () => {
    const storage = fakeStorage();
    assert.deepEqual(loadSizeMemory(storage), {});
    saveSizeMemory({ prf_001: 50 }, storage);
    assert.equal(storage.data[WISHLIST_SIZE_MEMORY_KEY], '{"prf_001":50}');
    assert.deepEqual(loadSizeMemory(storage), { prf_001: 50 });
    const broken = fakeStorage({ [WISHLIST_SIZE_MEMORY_KEY]: 'bukan json' });
    assert.deepEqual(loadSizeMemory(broken), {});
    const mixed = fakeStorage({ [WISHLIST_SIZE_MEMORY_KEY]: '{"prf_001":50,"prf_002":"x","prf_003":null}' });
    assert.deepEqual(loadSizeMemory(mixed), { prf_001: 50 });
    const array = fakeStorage({ [WISHLIST_SIZE_MEMORY_KEY]: '[1,2]' });
    assert.deepEqual(loadSizeMemory(array), {});
  });

  it('i18n: kunci wishlistView ada di ID + EN, tanpa string kosong', () => {
    const keys = [
      'title', 'edit', 'done', 'backToLibrary', 'emptyTitle', 'exploreCatalog',
      'removeFromWishlist', 'sizeSheetTitle', 'sizeSheetSubtitle', 'addToLibrary',
    ] as const;
    for (const k of keys) {
      assert.ok(translations.id.wishlistView[k], `id.wishlistView.${k} kosong`);
      assert.ok(translations.en.wishlistView[k], `en.wishlistView.${k} kosong`);
    }
    assert.equal(translations.id.wishlistView.emptyTitle, 'Belum ada Wishlist.');
    assert.equal(translations.id.wishlistView.exploreCatalog, 'Jelajahi Katalog');
    assert.equal(translations.id.wishlistView.addToLibrary, 'Tambahkan ke Lemari');
    assert.ok(translations.id.libraryView.openWishlist, 'id.libraryView.openWishlist kosong');
    assert.ok(translations.en.libraryView.openWishlist, 'en.libraryView.openWishlist kosong');
  });

  it('WishlistView: memakai BottomSheetOrModal + EmptyState, hati/tombol × hitam (bg-ink), tanpa harga karangan', () => {
    assert.ok(wishlistSrc.includes('BottomSheetOrModal'), 'sheet harus memakai BottomSheetOrModal');
    assert.ok(wishlistSrc.includes('EmptyState'), 'empty state harus memakai EmptyState');
    assert.ok(wishlistSrc.includes('bg-ink'), 'tombol × mode Edit harus hitam (bg-ink)');
    assert.ok(wishlistSrc.includes('removeFromWishlist'), 'aria-label × harus dari kunci i18n');
    assert.ok(wishlistSrc.includes('resolveWishlistPerfumes'), 'daftar harus dari resolveWishlistPerfumes');
    assert.ok(!wishlistSrc.includes('Dummy'), 'tidak ada kartu dummy di layar Wishlist');
  });

  it('App: rute /wishlist terdaftar di map fitur DAN regex parseFeaturePath', () => {
    const appSrc = readFileSync(path.join(__dirname, '../App.tsx'), 'utf-8');
    assert.ok(appSrc.includes("wishlist: '/wishlist'"), 'FEATURE_ROUTE_BY_VIEW harus punya wishlist');
    assert.ok(appSrc.includes("wishlist: 'wishlist'"), 'FEATURE_VIEW_BY_ROUTE harus punya wishlist');
    assert.ok(
      /\/\^\s*\\\s*\/\s*\(library\|journal\|finder\|try-it-first\|compare\|wishlist\)/.test(appSrc),
      'regex parseFeaturePath harus memuat wishlist (tanpanya deep link /wishlist jatuh ke Beranda)'
    );
    assert.ok(appSrc.includes("view === 'wishlist'"), 'App harus me-render WishlistView saat view wishlist');
  });
});
