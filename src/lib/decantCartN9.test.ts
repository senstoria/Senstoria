// Fase N9 (B2 + E1 + P4): tes logika murni Keranjang decant.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DECANT_CART_KEY,
  addToDecantCart,
  cartLineCount,
  cartQuantityFor,
  cartUnitCount,
  loadDecantCart,
  parseDecantCart,
  removeFromDecantCart,
  resolveDecantCartPerfumes,
  saveDecantCart,
  setDecantCartQuantity,
  type DecantCart,
} from './decantCartN9.ts';

const KNOWN = ['prf_013', 'prf_014'];

function memoryStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: (_key: string) => value,
    setItem: (_key: string, v: string) => {
      value = v;
    },
    peek: () => value,
  };
}

describe('Fase N9 — Keranjang decant (P4: pernyataan niat, tanpa harga/checkout)', () => {
  it('tambah baris baru: parfum + ukuran 5/10 ml + jumlah 1–4', () => {
    const cart = addToDecantCart([], 'prf_013', 5, 1);
    assert.deepEqual(cart, [{ perfumeId: 'prf_013', sizeMl: 5, quantity: 1 }]);
    assert.equal(cartUnitCount(cart), 1);
    assert.equal(cartLineCount(cart), 1);
  });

  it('baris (parfum + ukuran) yang sama digabung, jumlah dibatasi 4 (F2)', () => {
    let cart: DecantCart = [];
    cart = addToDecantCart(cart, 'prf_013', 5, 2);
    cart = addToDecantCart(cart, 'prf_013', 5, 3);
    assert.equal(cart.length, 1);
    assert.equal(cart[0].quantity, 4);
    assert.equal(cartUnitCount(cart), 4);
  });

  it('ukuran berbeda = baris berbeda; parfum berbeda = baris berbeda', () => {
    let cart: DecantCart = [];
    cart = addToDecantCart(cart, 'prf_013', 5, 1);
    cart = addToDecantCart(cart, 'prf_013', 10, 1);
    cart = addToDecantCart(cart, 'prf_014', 5, 2);
    assert.equal(cartLineCount(cart), 3);
    assert.equal(cartUnitCount(cart), 4);
  });

  it('setQuantity menjaga 1–4; removeFromDecantCart menghapus baris', () => {
    let cart: DecantCart = [{ perfumeId: 'prf_013', sizeMl: 5, quantity: 2 }];
    cart = setDecantCartQuantity(cart, 'prf_013', 5, 9);
    assert.equal(cart[0].quantity, 4);
    cart = setDecantCartQuantity(cart, 'prf_013', 5, 0);
    assert.equal(cart[0].quantity, 1);
    cart = removeFromDecantCart(cart, 'prf_013', 5);
    assert.deepEqual(cart, []);
  });

  it('parseDecantCart membuang baris rusak: parfum tak dikenal, ukuran bukan 5/10, bentuk salah', () => {
    const parsed = parseDecantCart(
      [
        { perfumeId: 'prf_013', sizeMl: 5, quantity: 2 },
        { perfumeId: 'prf_999', sizeMl: 5, quantity: 1 },
        { perfumeId: 'prf_013', sizeMl: 30, quantity: 1 },
        { perfumeId: 'prf_014', sizeMl: 10, quantity: 'banyak' },
        null,
        'bukan-objek',
      ],
      KNOWN,
    );
    assert.deepEqual(parsed, [
      { perfumeId: 'prf_013', sizeMl: 5, quantity: 2 },
      { perfumeId: 'prf_014', sizeMl: 10, quantity: 1 },
    ]);
  });

  it('parseDecantCart menggabung duplikat (parfum + ukuran sama)', () => {
    const parsed = parseDecantCart(
      [
        { perfumeId: 'prf_013', sizeMl: 5, quantity: 2 },
        { perfumeId: 'prf_013', sizeMl: 5, quantity: 3 },
      ],
      KNOWN,
    );
    assert.deepEqual(parsed, [{ perfumeId: 'prf_013', sizeMl: 5, quantity: 4 }]);
  });

  it('load/save round-trip lewat kunci localStorage senstoria_decant_cart_v1', () => {
    assert.equal(DECANT_CART_KEY, 'senstoria_decant_cart_v1');
    const storage = memoryStorage();
    saveDecantCart([{ perfumeId: 'prf_014', sizeMl: 10, quantity: 3 }], storage);
    assert.ok((storage.peek() ?? '').includes('prf_014'));
    assert.deepEqual(loadDecantCart(storage, KNOWN), [{ perfumeId: 'prf_014', sizeMl: 10, quantity: 3 }]);
    assert.deepEqual(loadDecantCart(memoryStorage('bukan-json'), KNOWN), []);
  });

  it('cartQuantityFor: 0 bila baris belum ada di keranjang', () => {
    const cart: DecantCart = [{ perfumeId: 'prf_013', sizeMl: 5, quantity: 2 }];
    assert.equal(cartQuantityFor(cart, 'prf_013', 5), 2);
    assert.equal(cartQuantityFor(cart, 'prf_013', 10), 0);
    assert.equal(cartQuantityFor(cart, 'prf_014', 5), 0);
  });

  it('resolveDecantCartPerfumes membuang baris yang parfumnya tidak lagi published', () => {
    const perfumes = [{ id: 'prf_013', brand: 'HMNS', name: 'The Perfection' }] as never;
    const resolved = resolveDecantCartPerfumes(
      [
        { perfumeId: 'prf_013', sizeMl: 5, quantity: 1 },
        { perfumeId: 'prf_014', sizeMl: 10, quantity: 1 },
      ],
      perfumes as never,
    );
    assert.equal(resolved.length, 1);
    assert.equal(resolved[0].perfume.id, 'prf_013');
  });

  it('tidak ada harga/stok/checkout di lib keranjang (di luar komentar)', () => {
    const src = readFileSync(new URL('./decantCartN9.ts', import.meta.url), 'utf8');
    // Komentar header justru MENEGASKAN larangan itu — uji hanya kode.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.ok(!/\bprice\b/i.test(code), 'lib keranjang tidak boleh menyebut harga');
    assert.ok(!/checkout/i.test(code), 'lib keranjang tidak boleh menyebut checkout');
    assert.ok(!/\bstock\b/i.test(code), 'lib keranjang tidak boleh menyebut stok');
  });

  it('App: rute /keranjang terdaftar di map fitur DAN regex parseFeaturePath', () => {
    const appSrc = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
    assert.ok(
      appSrc.includes("cart: '/keranjang'"),
      'FEATURE_ROUTE_BY_VIEW harus memuat cart → /keranjang',
    );
    assert.ok(
      appSrc.includes("keranjang: 'cart'"),
      'FEATURE_VIEW_BY_ROUTE harus memuat keranjang → cart',
    );
    // Baris regex fitur: cari lewat alternation fitur (ada beberapa
    // window.location.pathname.match lain di App — auth/legal/katalog).
    const regexSrc = appSrc.split('\n').find(l => l.includes('library|journal|finder'));
    assert.ok(
      regexSrc && regexSrc.split('|').includes('keranjang'),
      'regex parseFeaturePath harus memuat keranjang (tanpanya deep link /keranjang jatuh ke Beranda)',
    );
  });
});
