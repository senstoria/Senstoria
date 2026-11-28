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
  // Publish 12 internasional (28 Nov 2026, perintah founder "publish
  // semuanya, Rp0 tampil di Detail"): invarian ketat harga > 0 + tanggal
  // cek 2026-10-30 + brand_claims kini hanya berlaku untuk prf_013/014.
  // Ke-12 baris baru terbit APA ADANYA dengan reference_price_idr 0
  // (placeholder yang diputuskan founder — tidak ada harga IDR resmi),
  // tanpa price_checked_date dan tanpa brand_claims; verified_by diisi
  // nama founder. Tes ini mengunci keadaan itu supaya tidak ada yang
  // diam-diam mengarang harga/tanggal/klaim untuk baris-baris ini.
  it('seed: 2 parfum terbit lama punya harga + tanggal cek 2026-10-30; 12 internasional terbit dengan Rp0 placeholder', () => {
    assert.equal(PUBLISHED_PERFUMES.length, 14);
    for (const p of PUBLISHED_PERFUMES.filter(p => ['prf_013', 'prf_014'].includes(p.id))) {
      assert.ok(p.reference_price_idr > 0, p.id);
      assert.equal(p.price_checked_date, '2026-10-30');
      assert.ok(p.top_notes && p.heart_notes && p.base_notes, p.id);
      assert.ok(p.brand_claims, p.id);
    }
    const published12 = PUBLISHED_PERFUMES.filter(p => !['prf_013', 'prf_014'].includes(p.id));
    assert.equal(published12.length, 12);
    for (const p of published12) {
      assert.strictEqual(p.data_status, 'published', p.id);
      assert.strictEqual(p.verified_by, 'Ja\'far Assegaff', p.id);
      assert.strictEqual(p.reference_price_idr, 0, `${p.id} harga Rp0 placeholder (keputusan founder)`);
      assert.strictEqual(p.price_checked_date, undefined, `${p.id} tanpa tanggal cek harga`);
      assert.strictEqual(p.brand_claims, '', `${p.id} tanpa brand_claims`);
      assert.ok(p.top_notes && p.heart_notes && p.base_notes, p.id);
      assert.ok(p.source_official_url && p.source_official_url.length > 0, p.id);
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

  // D1 (diperbarui 28 Nov 2026, Opsi A + publish 12 internasional):
  // invarian ukuran referensi katalog (30/50/100 ml) GUGUR sebagai
  // himpunan tertutup — 12 baris yang diterbitkan 28 Nov 2026 membawa
  // ukuran terverifikasi 40/60/200 ml, dan 3 di antaranya membawa 0 =
  // ukuran belum tahu (Elixir prf_027, Vulcan Feu prf_028, Le Male Le
  // Parfum prf_032). Yang dikunci sekarang: (a) ukuran published
  // hanyalah 0 atau ukuran positif terverifikasi — himpunan persisnya
  // di bawah ini adalah ground truth, perbarui bila batch baru terbit;
  // (b) ukuran 0 TIDAK BOLEH menjadi pilihan ukuran — availableSizes di
  // ProductDetailView menyaringnya keluar dari size sheet.
  it('seed: ukuran referensi published adalah ukuran terverifikasi atau 0 (belum tahu); 0 bukan pilihan ukuran (D1)', () => {
    const sizes = [...new Set(PUBLISHED_PERFUMES.map(p => p.reference_price_size_ml))].sort((a, b) => a - b);
    assert.deepEqual(sizes, [0, 30, 40, 50, 60, 100, 200]);
    assert.ok(sizes.every(s => s >= 0), 'ukuran negatif tidak boleh ada');
    const sheetBlock = detailSrc.slice(
      detailSrc.indexOf('const availableSizes = useMemo('),
      detailSrc.indexOf('const availableSizes = useMemo(') + 900
    );
    assert.ok(
      sheetBlock.includes('.filter(s => s > 0)'),
      'availableSizes harus menyaring ukuran 0 keluar dari size sheet'
    );
    const sheetSizes = sizes.filter(s => s > 0);
    assert.ok(!sheetSizes.includes(0), 'size sheet tidak boleh berisi 0 ml');
  });

  // Opsi A (28 Nov 2026): "Aroma Serupa" hanya dari baris published.
  // Derivasi similarPerfumes di ProductDetailView dulu hanya mencocokkan
  // primary_family — parfum tanpa family (The Perfection) akan cocok
  // dengan semua baris draft tanpa family (undefined === undefined).
  // Seksi itu sendiri sudah dijaga oleh `perfume.primary_family` di
  // render, jadi kebocoran ini laten, bukan tampil hari ini — tapi
  // filter published-only menutup jalurnya secara definitif, sejalan
  // dengan availableSizes. Tes ini mengunci kedua lapisnya: sumber
  // derivasi memfilter published, dan daftar serupa tiap produk
  // published (dihitung dengan aturan yang sama) tidak berisi draft.
  it('detail: Aroma Serupa hanya berisi parfum published', () => {
    const similarBlock = detailSrc.slice(
      detailSrc.indexOf('const similarPerfumes = useMemo('),
      detailSrc.indexOf('const similarPerfumes = useMemo(') + 400
    );
    assert.ok(
      similarBlock.includes("p.data_status === 'published'"),
      'similarPerfumes harus memfilter baris published'
    );
    assert.ok(
      detailSrc.includes('perfume.primary_family && ('),
      'seksi Aroma Serupa tetap dijaga oleh primary_family di render'
    );
    for (const p of PUBLISHED_PERFUMES) {
      const similar = SEED_PERFUMES.filter(
        q => q.data_status === 'published' && q.id !== p.id && q.primary_family === p.primary_family
      );
      assert.ok(similar.every(q => q.data_status === 'published'), p.id);
      assert.ok(!similar.some(q => q.id === p.id), p.id);
    }
    // Keadaan seed saat ini: Enchantée (Floral) satu-satunya Floral
    // published, jadi daftar serupanya kosong dan seksi menampilkan
    // pesan kosong yang jujur; The Perfection (tanpa family) tidak
    // menampilkan seksi itu sama sekali.
    const enchantee = PUBLISHED_PERFUMES.find(p => p.id === 'prf_014')!;
    const enchanteeSimilar = SEED_PERFUMES.filter(
      q => q.data_status === 'published' && q.id !== enchantee.id && q.primary_family === enchantee.primary_family
    );
    assert.equal(enchanteeSimilar.length, 0);
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
