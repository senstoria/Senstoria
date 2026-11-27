import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { translations, formatCheckedDate } from './i18n';
import { SEED_PERFUMES, PUBLISHED_PERFUMES } from '../data/seedPerfumes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const detailSrc = readFileSync(
  path.join(__dirname, '../components/ProductDetailView.tsx'),
  'utf-8'
);

describe('Fase N4 — Detail (D1–D6, N-02/N-05/N-06, S6/Y5/J-12)', () => {
  // Item 10 / D5: tanggal cek harga resmi diformat dari ISO seed,
  // tanpa geser zona waktu (new Date('2026-10-30') adalah tengah
  // malam UTC — akan jadi 29 Okt di zona waktu barat).
  it('formatCheckedDate: 2026-10-30 → "30 Okt 2026" (id) / "Oct 30, 2026" (en)', () => {
    assert.equal(formatCheckedDate('2026-10-30', 'id'), '30 Okt 2026');
    assert.equal(formatCheckedDate('2026-10-30', 'en'), 'Oct 30, 2026');
    assert.equal(formatCheckedDate('2026-01-05', 'id'), '5 Jan 2026');
    assert.equal(formatCheckedDate('2026-12-25', 'en'), 'Dec 25, 2026');
  });

  it('formatCheckedDate: input bukan ISO dikembalikan apa adanya', () => {
    assert.equal(formatCheckedDate('segera', 'id'), 'segera');
    assert.equal(formatCheckedDate('', 'id'), '');
    assert.equal(formatCheckedDate('2026-13-01', 'id'), '2026-13-01');
  });

  // Seed ground truth yang dipakai accordion D5 (baris kondisional).
  it('seed: kedua parfum terbit punya harga referensi + tanggal cek 2026-10-30', () => {
    assert.equal(PUBLISHED_PERFUMES.length, 2);
    for (const p of PUBLISHED_PERFUMES) {
      assert.ok(p.reference_price_idr > 0, p.id);
      assert.equal(p.price_checked_date, '2026-10-30');
      assert.ok(p.top_notes && p.heart_notes && p.base_notes, p.id);
      assert.ok(p.brand_claims, p.id);
    }
    const perfection = PUBLISHED_PERFUMES.find(p => p.id === 'prf_013')!;
    const enchantee = PUBLISHED_PERFUMES.find(p => p.id === 'prf_014')!;
    assert.equal(perfection.reference_price_idr, 633215);
    assert.equal(perfection.reference_price_size_ml, 100);
    assert.equal(perfection.primary_family, undefined);
    assert.equal(perfection.release_year, undefined);
    assert.equal(enchantee.reference_price_idr, 279000);
    assert.equal(enchantee.reference_price_size_ml, 30);
    assert.equal(enchantee.primary_family, 'Floral');
  });

  it('seed: ukuran referensi di katalog adalah 30/50/100 ml (D1)', () => {
    const sizes = [...new Set(SEED_PERFUMES.map(p => p.reference_price_size_ml))].sort((a, b) => a - b);
    assert.deepEqual(sizes, [30, 50, 100]);
  });

  // Semua kunci i18n baru N4 ada di kedua locale dan tidak kosong.
  it('i18n: kunci N4 lengkap ID + EN', () => {
    const keys = [
      'sizeGuideTitle', 'sizeGuideSubtitle', 'sizeGuideLink',
      'sizeGuide30Title', 'sizeGuide30Desc',
      'sizeGuide50Title', 'sizeGuide50Desc',
      'sizeGuide100Title', 'sizeGuide100Desc', 'sizeGuideAvailable',
      'productDetailsTitle',
      'detailRowConcentration', 'detailRowSize', 'detailRowPrice',
      'detailRowFamily', 'detailRowOrigin', 'detailRowYear',
      'detailRowBrandClaims', 'detailWriteReview',
    ] as const;
    for (const key of keys) {
      assert.ok(
        typeof translations.id.productDetail[key] === 'string' &&
        translations.id.productDetail[key].length > 0,
        `id.${key}`
      );
      assert.ok(
        typeof translations.en.productDetail[key] === 'string' &&
        translations.en.productDetail[key].length > 0,
        `en.${key}`
      );
    }
  });

  // N-05: label wishlist dipendekkan agar baris aksi muat satu baris
  // (44px) di 390px — 'Tambah Wishlist' melipat jadi 62px.
  it('i18n: label wishlist pendek (satu baris di 390px)', () => {
    assert.equal(translations.id.productDetail.addWishlist, 'Wishlist');
    assert.equal(translations.en.productDetail.addWishlist, 'Wishlist');
  });

  // Item 7 (S6): hati wishlist hitam — tidak ada lagi text-error di Detail.
  it('S6: hati wishlist hitam, bukan merah error', () => {
    assert.ok(!detailSrc.includes('text-error'), 'text-error masih ada di ProductDetailView');
    assert.ok(detailSrc.includes('text-wishlist'), 'token wishlist tidak dipakai');
    assert.ok(detailSrc.includes('border-wishlist'), 'border wishlist tidak dipakai');
  });

  // Item 5 (N-05): baris aksi diratakan — container memakai
  // items-stretch sehingga ketiga tombol berbagi tinggi yang sama.
  it('N-05: baris aksi Detail memakai items-stretch', () => {
    assert.ok(detailSrc.includes('flex items-stretch gap-2 max-lg:w-full'));
  });

  // Item 4 (D6 — N-06): track slider hanya dirender bila ada ulasan
  // terbit; 0 ulasan → pesan jujur + CTA Tulis Ulasan.
  it('N-06: track slider disembunyikan saat 0 ulasan', () => {
    assert.ok(detailSrc.includes('reviewAggregate.totalPublishedReviews === 0'));
    assert.ok(detailSrc.includes('detailWriteReview'));
    // Track (untuk kasus 1+ ulasan) tetap ada di cabang lain.
    assert.ok(detailSrc.includes('h-1.5 bg-gray-100'));
  });

  // Item 6 (N-02): buy-bar pill disembunyikan saat footer terlihat.
  it('N-02: buy-bar pill bersyarat footer tidak terlihat', () => {
    assert.ok(detailSrc.includes('isPastMainBuy && !isFooterVisible'));
    assert.ok(detailSrc.includes("document.querySelector('footer')"));
    assert.ok(detailSrc.includes('rootMargin'));
  });

  // Item 3 (D5): accordion hanya berisi field seed yang ada.
  it('D5: accordion "Lihat Detail Produk" dengan baris kondisional', () => {
    assert.ok(detailSrc.includes('productDetailsTitle'));
    assert.ok(detailSrc.includes('data-testid="detail-product-details"'));
    assert.ok(detailSrc.includes('aria-expanded={isDetailsOpen}'));
    assert.ok(detailSrc.includes('perfume.primary_family &&'));
    assert.ok(detailSrc.includes('perfume.release_year &&'));
    assert.ok(detailSrc.includes('perfume.brand_claims &&'));
    assert.ok(detailSrc.includes('formatCheckedDate(perfume.price_checked_date'));
  });

  // Item 8 (Y5): judul seksi Detail tidak lagi memakai font-sans 18px
  // (aturan h3 di index.css memberi Fraunces 24/800).
  it('Y5: tidak ada h3 seksi Detail dengan font-sans 18px', () => {
    assert.ok(!detailSrc.includes('font-sans text-[18px] leading-[26px]'));
  });

  // Item 1 (D1): panduan ukuran botol ada dan terhubung.
  it('D1: panduan ukuran botol (30/50/100 ml) terhubung', () => {
    assert.ok(detailSrc.includes('isGuideOpen'));
    assert.ok(detailSrc.includes('sizeGuideTitle'));
    assert.ok(detailSrc.includes('sizeGuideAvailable'));
    assert.ok(detailSrc.includes('sizeGuide30Title'));
    assert.ok(detailSrc.includes('sizeGuide50Title'));
    assert.ok(detailSrc.includes('sizeGuide100Title'));
  });

  // Item 9: konsentrasi + ukuran ml sudah tampil di bawah judul (D1).
  it('D1/D5: info konsentrasi + ukuran ml tampil di header Detail', () => {
    assert.ok(detailSrc.includes('{perfume.concentration} · {perfume.reference_price_size_ml} ml'));
  });
});
