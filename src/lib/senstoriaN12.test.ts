import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addToSalesBag,
  buildOrderNumber,
  buildOrderDoc,
  buildReceiptText,
  canBuyerCancelOrder,
  canTransitionOrder,
  computePromoDiscount,
  computeSalesTotals,
  isMidtransConfigured,
  isShippingRatesConfigured,
  isValidOrderNumber,
  isValidPostalCode,
  loadSalesBag,
  nextAdminStatuses,
  normalizePromoCode,
  parsePromoCode,
  parseSalesBag,
  parseSalesOrder,
  removeFromSalesBag,
  salesBagUnitCount,
  setSalesBagQuantity,
  validateShippingAddress,
  type NewSalesOrderDoc,
  type PromoCode,
  type SalesOrder,
} from './salesN12.ts';

/* ── Bag ── */

test('Fase N12 — parseSalesBag: baris asing/rusak dibuang, duplikat digabung (maks 4)', () => {
  const known = new Set(['prf_013', 'prf_014']);
  assert.deepEqual(parseSalesBag('bukan array', known), []);
  assert.deepEqual(
    parseSalesBag(
      [
        { perfumeId: 'prf_013', quantity: 2 },
        { perfumeId: 'prf_013', quantity: 3 }, // gabung → 4 (batas)
        { perfumeId: 'prf_999', quantity: 1 }, // tidak dikenal: buang
        { perfumeId: 'prf_014', quantity: 0 }, // 0 → clamp 1
        { quantity: 1 }, // tanpa id: buang
        null,
      ],
      known,
    ),
    [
      { perfumeId: 'prf_013', quantity: 4 },
      { perfumeId: 'prf_014', quantity: 1 },
    ],
  );
});

test('Fase N12 — add/set/remove Bag: gabung, batas 1–4, hapus', () => {
  let bag = addToSalesBag([], 'prf_013', 2);
  assert.deepEqual(bag, [{ perfumeId: 'prf_013', quantity: 2 }]);
  bag = addToSalesBag(bag, 'prf_013', 3);
  assert.deepEqual(bag, [{ perfumeId: 'prf_013', quantity: 4 }]);
  bag = addToSalesBag(bag, 'prf_014', 1);
  assert.equal(salesBagUnitCount(bag), 5);
  bag = setSalesBagQuantity(bag, 'prf_013', 9);
  assert.equal(bag.find(i => i.perfumeId === 'prf_013')?.quantity, 4);
  bag = setSalesBagQuantity(bag, 'prf_013', 0);
  assert.equal(bag.find(i => i.perfumeId === 'prf_013')?.quantity, 1);
  bag = removeFromSalesBag(bag, 'prf_014');
  assert.deepEqual(bag, [{ perfumeId: 'prf_013', quantity: 1 }]);
});

test('Fase N12 — loadSalesBag: storage rusak → []', () => {
  const storage = {
    getItem: () => '{rusak',
    setItem: () => {},
  };
  assert.deepEqual(loadSalesBag(storage, ['prf_013']), []);
  assert.deepEqual(loadSalesBag(null, ['prf_013']), []);
});

/* ── Total & pajak ── */

test('Fase N12 — computeSalesTotals: aritmetika benar, pajak termasuk (bukan tambahan)', () => {
  // F8: 10+0+0=10 — subtotal 633.215 + ongkir 0 = total 633.215.
  const t = computeSalesTotals([{ unitPriceIdr: 633215, quantity: 1 }], 0);
  assert.equal(t.subtotalIdr, 633215);
  assert.equal(t.discountIdr, 0);
  assert.equal(t.discountedSubtotalIdr, 633215);
  // Pajak termasuk = 633215 × 11/111 = 62.751,04 → 62.751.
  assert.equal(t.taxIncludedIdr, 62751);
  assert.equal(t.totalIdr, 633215);
  // Dua baris + ongkir: total = subtotal + ongkir, pajak tetap termasuk.
  const t2 = computeSalesTotals(
    [
      { unitPriceIdr: 633215, quantity: 1 },
      { unitPriceIdr: 279000, quantity: 2 },
    ],
    15000,
  );
  assert.equal(t2.subtotalIdr, 1191215);
  assert.equal(t2.taxIncludedIdr, Math.round((1191215 * 11) / 111));
  assert.equal(t2.totalIdr, 1191215 + 15000);
});

test('Fase N12 — computeSalesTotals: ongkir null → total null (tidak ditebak)', () => {
  const t = computeSalesTotals([{ unitPriceIdr: 279000, quantity: 1 }], null);
  assert.equal(t.subtotalIdr, 279000);
  assert.equal(t.deliveryIdr, null);
  assert.equal(t.totalIdr, null);
});

test('Fase N12 — computeSalesTotals: promo persen dihitung dari subtotal, pajak dari harga setelah diskon', () => {
  const promo: PromoCode = { code: 'SENSTORIA10', discountType: 'percent', discountValue: 10, active: true };
  const t = computeSalesTotals([{ unitPriceIdr: 633215, quantity: 1 }], 10000, promo);
  assert.equal(t.discountIdr, 63322); // 10% dari 633.215 = 63.321,5 → 63.322
  assert.equal(t.discountedSubtotalIdr, 633215 - 63322);
  assert.equal(t.taxIncludedIdr, Math.round(((633215 - 63322) * 11) / 111));
  assert.equal(t.totalIdr, 633215 - 63322 + 10000);
});

/* ── Promo ── */

test('Fase N12 — normalizePromoCode + parsePromoCode: NIKE10 tidak istimewa, dokumen rusak → null', () => {
  assert.equal(normalizePromoCode('  senstoria10 '), 'SENSTORIA10');
  assert.equal(parsePromoCode({ code: 'NIKE10', discountType: 'percent', discountValue: 10, active: true })?.code, 'NIKE10');
  // NIKE10 hanya lolos parse sebagai data — validasi NYATA tetap ke
  // Firestore (koleksi kosong → tidak ditemukan). Tidak ada kode demo
  // yang di-hardcode sebagai valid di mana pun.
  assert.equal(parsePromoCode({ code: 'X', discountType: 'percent', discountValue: 150, active: true }), null);
  assert.equal(parsePromoCode({ code: 'X', discountType: 'bogus', discountValue: 10, active: true }), null);
  assert.equal(parsePromoCode({ code: 'X', discountType: 'fixed', discountValue: -5, active: true }), null);
  assert.equal(parsePromoCode(null), null);
});

test('Fase N12 — computePromoDiscount: fixed dibatasi subtotal, nonaktif/minimum → 0', () => {
  const fixed: PromoCode = { code: 'POTONG', discountType: 'fixed', discountValue: 500000, active: true };
  assert.equal(computePromoDiscount(279000, fixed), 279000);
  assert.equal(computePromoDiscount(633215, { ...fixed, active: false }), 0);
  assert.equal(
    computePromoDiscount(100000, { code: 'MIN', discountType: 'percent', discountValue: 10, active: true, minSubtotalIdr: 500000 }),
    0,
  );
  assert.equal(computePromoDiscount(600000, { code: 'MIN', discountType: 'percent', discountValue: 10, active: true, minSubtotalIdr: 500000 }), 60000);
});

/* ── Nomor pesanan ── */

test('Fase N12 — buildOrderNumber: deterministik, format SNS-YYYYMMDD-XXXX', () => {
  const date = new Date(2026, 10, 28); // 28 Nov 2026 (bulan 0-based)
  assert.equal(buildOrderNumber(date, 'a1b2c3d4'), 'SNS-20261128-A1B2');
  assert.equal(buildOrderNumber(date, 'a1b2c3d4'), buildOrderNumber(date, 'a1b2c3d4'));
  assert.equal(buildOrderNumber(date, 'zz'), 'SNS-20261128-ZZ00');
  assert.equal(isValidOrderNumber('SNS-20261128-A1B2'), true);
  assert.equal(isValidOrderNumber('SNS-20261128-a1b2'), false);
  assert.equal(isValidOrderNumber('ORDER-123'), false);
  assert.equal(isValidOrderNumber(''), false);
});

/* ── Alamat ── */

test('Fase N12 — isValidPostalCode: tepat 5 digit', () => {
  assert.equal(isValidPostalCode('12345'), true);
  assert.equal(isValidPostalCode(' 12345 '), true);
  assert.equal(isValidPostalCode('1234'), false);
  assert.equal(isValidPostalCode('123456'), false);
  assert.equal(isValidPostalCode('12a45'), false);
});

test('Fase N12 — validateShippingAddress: field tidak valid dilaporkan, alamat benar → []', () => {
  const good = { recipientName: 'Ja\u2019far', phone: '081234567890', address: 'Jl. Kenanga No. 12, RT 01 RW 02', city: 'Jakarta', postalCode: '12345' };
  assert.deepEqual(validateShippingAddress(good), []);
  const bad = validateShippingAddress({ recipientName: 'A', phone: '123', address: 'pendek', city: '', postalCode: '1234' });
  assert.deepEqual(bad.sort(), ['address', 'city', 'phone', 'postalCode', 'recipientName']);
});

/* ── Status pesanan ── */

test('Fase N12 — canTransitionOrder: alur Baru → Dibayar → Dikirim → Selesai / Batal', () => {
  assert.equal(canTransitionOrder('baru', 'dibayar'), true);
  assert.equal(canTransitionOrder('baru', 'batal'), true);
  assert.equal(canTransitionOrder('baru', 'dikirim'), false);
  assert.equal(canTransitionOrder('dibayar', 'dikirim'), true);
  assert.equal(canTransitionOrder('dibayar', 'baru'), false);
  assert.equal(canTransitionOrder('dikirim', 'selesai'), true);
  assert.equal(canTransitionOrder('dikirim', 'batal'), false);
  assert.equal(canTransitionOrder('selesai', 'batal'), false);
  assert.equal(canTransitionOrder('batal', 'baru'), false);
  assert.deepEqual(nextAdminStatuses('baru'), ['dibayar', 'batal']);
  assert.deepEqual(nextAdminStatuses('selesai'), []);
  assert.equal(canBuyerCancelOrder('baru'), true);
  assert.equal(canBuyerCancelOrder('dibayar'), true);
  assert.equal(canBuyerCancelOrder('dikirim'), false);
  assert.equal(canBuyerCancelOrder('selesai'), false);
});

/* ── Dokumen pesanan ── */

const baseOrderInput = {
  orderNumber: 'SNS-20261128-A1B2',
  userId: 'uid_123',
  buyerEmail: 'pembeli@contoh.id',
  items: [
    { perfume_id: 'prf_013', brand: 'HMNS', name: 'The Perfection', size_ml: 100, unit_price_idr: 633215, quantity: 1, line_total_idr: 633215 },
  ],
  totals: {
    subtotalIdr: 633215,
    discountIdr: 0,
    discountedSubtotalIdr: 633215,
    taxIncludedIdr: 62751,
    deliveryIdr: 15000,
    totalIdr: 648215,
  },
  promoCode: null,
  shipping: {
    recipient_name: 'Ja\u2019far',
    phone: '081234567890',
    address: 'Jl. Kenanga No. 12',
    city: 'Jakarta',
    postal_code: '12345',
    courier: 'jne' as const,
    method: 'standard' as const,
    estimated_days_min: 2,
    estimated_days_max: 5,
  },
  billingSameAsShipping: true,
  nowIso: '2026-11-28T08:00:00.000Z',
};

test('Fase N12 — buildOrderDoc: pesanan Baru, Midtrans, total benar; ongkir null → null', () => {
  const doc = buildOrderDoc(baseOrderInput) as NewSalesOrderDoc;
  assert.equal(doc.status, 'baru');
  assert.equal(doc.payment_provider, 'midtrans');
  assert.equal(doc.total_idr, 648215);
  assert.equal(doc.tax_included_idr, 62751);
  assert.equal(doc.midtrans_transaction_id, null);
  assert.equal(doc.tracking_number, null);
  // Tanpa ongkir nyata, pesanan tidak boleh dibuat.
  const noDelivery = buildOrderDoc({
    ...baseOrderInput,
    totals: { ...baseOrderInput.totals, deliveryIdr: null, totalIdr: null },
  });
  assert.equal(noDelivery, null);
  // Tanpa item, pesanan tidak boleh dibuat.
  assert.equal(buildOrderDoc({ ...baseOrderInput, items: [] }), null);
  // Nomor pesanan tidak valid → null.
  assert.equal(buildOrderDoc({ ...baseOrderInput, orderNumber: 'ORDER-1' }), null);
});

test('Fase N12 — parseSalesOrder: dokumen lengkap lolos, rusak → null', () => {
  const doc = buildOrderDoc(baseOrderInput) as NewSalesOrderDoc;
  const full: SalesOrder = { ...doc, id: 'a1b2c3d4' };
  assert.deepEqual(parseSalesOrder(full), full);
  assert.equal(parseSalesOrder({ ...full, status: 'terkirim' }), null);
  assert.equal(parseSalesOrder({ ...full, order_number: 'X' }), null);
  assert.equal(parseSalesOrder({ ...full, items: [] }), null);
  assert.equal(parseSalesOrder({ ...full, total_idr: -1 }), null);
  assert.equal(parseSalesOrder({ ...full, payment_provider: 'tunai' }), null);
  assert.equal(parseSalesOrder(null), null);
});

/* ── Gate ── */

test('Fase N12 — gate Midtrans & ongkir: kunci/endpoint tidak ada → tidak terkonfigurasi', () => {
  assert.equal(isMidtransConfigured(undefined, undefined), false);
  assert.equal(isMidtransConfigured('key_123', undefined), false); // key saja tidak cukup
  assert.equal(isMidtransConfigured(undefined, 'https://contoh.id/token'), false);
  assert.equal(isMidtransConfigured('key_123', 'https://contoh.id/token'), true);
  assert.equal(isShippingRatesConfigured(undefined), false);
  assert.equal(isShippingRatesConfigured(''), false);
  assert.equal(isShippingRatesConfigured('https://contoh.id/rates'), true);
});

/* ── Struk ── */

test('Fase N12 — buildReceiptText: satu nomor pesanan, rincian beraritmetika benar', () => {
  const doc = buildOrderDoc(baseOrderInput) as NewSalesOrderDoc;
  const order: SalesOrder = { ...doc, id: 'a1b2c3d4' };
  const text = buildReceiptText(order, 'id');
  assert.ok(text.includes('SNS-20261128-A1B2'));
  assert.ok(text.includes('HMNS The Perfection'));
  assert.ok(text.includes('633.215'));
  assert.ok(text.includes('648.215')); // total = 633.215 + 15.000
  assert.ok(text.includes('Retur hanya untuk barang rusak/salah, 7 hari sejak diterima.'));
  const en = buildReceiptText(order, 'en');
  assert.ok(en.includes('Returns only for damaged/wrong items, within 7 days of delivery.'));
});
