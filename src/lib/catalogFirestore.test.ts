// P1 Admin v1 — tes unit untuk data layer katalog Firestore (catalog.ts).
// Hanya fungsi murni yang diuji di sini (validasi + pemetaan seed ⇄ dokumen
// + gabungan transisi). Fungsi yang memanggil Firestore live
// (loadPublishedPerfumes, loadAllPerfumesForAdmin, create/update/publish/
// unpublish/delete/restore) BUTUH emulator/Firestore live dan dicatat
// BELUM TERVERIFIKASI sampai diuji di sana — jangan klaim lolos dari tes ini.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SEED_PERFUMES, type SeedPerfume } from '../data/seedPerfumes.ts';
import {
  seedToPerfumeDoc,
  toSeedPerfume,
  mergeCatalogDocs,
  isMigrationComplete,
  validatePerfumeForSave,
  validatePublish,
  PublishValidationError,
  parsePerfumeDoc,
  type PerfumeDoc,
} from './catalog.ts';
import { buildMigrationPlan } from '../../scripts/migrate-seed-to-firestore.mjs';

const makeDoc = (overrides: Partial<PerfumeDoc> & { id: string }): PerfumeDoc => ({
  id: overrides.id,
  slug: overrides.slug ?? overrides.id,
  name: overrides.name ?? 'Parfum Tes',
  brand: overrides.brand ?? 'Brand Tes',
  concentration: overrides.concentration ?? 'EDP',
  gender_label: overrides.gender_label ?? 'unknown',
  primary_family: overrides.primary_family,
  secondary_family: overrides.secondary_family,
  origin: overrides.origin ?? 'ID',
  market_tier: overrides.market_tier ?? 'indie',
  reference_price_idr: overrides.reference_price_idr ?? 100000,
  reference_price_size_ml: overrides.reference_price_size_ml ?? 50,
  price_is_sample: false,
  top_notes: overrides.top_notes ?? 'Bergamot',
  heart_notes: overrides.heart_notes ?? 'Jasmine',
  base_notes: overrides.base_notes ?? 'Sandalwood',
  longevity_expected_band: overrides.longevity_expected_band ?? 'unknown',
  projection_expected: overrides.projection_expected ?? 0,
  description_id: overrides.description_id ?? '',
  description_en: overrides.description_en ?? '',
  sample_candidate: false,
  shopee_url: '',
  tokopedia_url: '',
  data_status: overrides.data_status ?? 'draft',
  source_official_url: overrides.source_official_url,
  source_checked_date: overrides.source_checked_date,
  verified_by: overrides.verified_by,
  photo_url: overrides.photo_url,
  photo_verified: overrides.photo_verified,
});

describe('P1 katalog — pemetaan seed → dokumen (migrasi)', () => {
  it('seed berisi 36 baris: 22 draft + 14 published (baseline migrasi)', () => {
    assert.strictEqual(SEED_PERFUMES.length, 36);
    assert.strictEqual(SEED_PERFUMES.filter(p => p.data_status === 'published').length, 14);
    assert.strictEqual(SEED_PERFUMES.filter(p => p.data_status === 'draft').length, 22);
  });

  it('seedToPerfumeDoc mempertahankan id, data_status, dan verified_by', () => {
    const published = SEED_PERFUMES.filter(p => p.data_status === 'published');
    for (const seed of published) {
      const doc = seedToPerfumeDoc(seed);
      assert.strictEqual(doc.id, seed.id);
      assert.strictEqual(doc.data_status, 'published');
      assert.strictEqual(doc.verified_by, seed.verified_by);
      assert.strictEqual(doc.name, seed.name);
      assert.strictEqual(doc.brand, seed.brand);
    }
    for (const seed of SEED_PERFUMES.filter(p => p.data_status === 'draft')) {
      assert.strictEqual(seedToPerfumeDoc(seed).data_status, 'draft');
    }
  });

  it("seed 'verified' → 'review'; foto seed dipetakan ke photo_url + photo_verified", () => {
    const seed: SeedPerfume = {
      ...SEED_PERFUMES[0],
      id: 'prf_x',
      data_status: 'verified',
      image_url: 'https://brand.example/photo.jpg',
      image_checked_date: '2026-11-28',
    };
    const doc = seedToPerfumeDoc(seed);
    assert.strictEqual(doc.data_status, 'review');
    assert.strictEqual(doc.photo_url, 'https://brand.example/photo.jpg');
    assert.strictEqual(doc.photo_verified, true);
  });

  it('toSeedPerfume membalikkan pemetaan (published/review) dan membawa photo_url ke image_url', () => {
    const doc = makeDoc({ id: 'prf_y', data_status: 'review', photo_url: 'https://brand.example/p.jpg' });
    const seed = toSeedPerfume(doc);
    assert.strictEqual(seed.data_status, 'verified');
    assert.strictEqual(seed.image_url, 'https://brand.example/p.jpg');
    assert.strictEqual(toSeedPerfume(makeDoc({ id: 'prf_z', data_status: 'published' })).data_status, 'published');
  });

  it('mergeCatalogDocs: Firestore menang per id, seed mengisi yang belum termigrasi', () => {
    const seedDocs = [makeDoc({ id: 'a', name: 'Seed A' }), makeDoc({ id: 'b', name: 'Seed B' })];
    const fsDocs = [makeDoc({ id: 'b', name: 'Firestore B', data_status: 'published' })];
    const merged = mergeCatalogDocs(seedDocs, fsDocs);
    assert.strictEqual(merged.length, 2);
    assert.strictEqual(merged.find(d => d.id === 'b')?.name, 'Firestore B');
    assert.strictEqual(merged.find(d => d.id === 'a')?.name, 'Seed A');
  });

  it('isMigrationComplete: true hanya bila semua id seed ada di Firestore', () => {
    const seedDocs = [makeDoc({ id: 'a' }), makeDoc({ id: 'b' })];
    assert.strictEqual(isMigrationComplete(seedDocs, [makeDoc({ id: 'a' })]), false);
    assert.strictEqual(
      isMigrationComplete(seedDocs, [makeDoc({ id: 'a' }), makeDoc({ id: 'b' })]),
      true,
    );
    assert.strictEqual(isMigrationComplete(seedDocs, []), false);
  });

  it('parsePerfumeDoc menolak dokumen rusak (tanpa nama/brand/konsentrasi)', () => {
    assert.strictEqual(parsePerfumeDoc('x', null), null);
    assert.strictEqual(parsePerfumeDoc('x', { name: 'A' }), null);
    assert.strictEqual(parsePerfumeDoc('x', { name: 'A', brand: 'B', concentration: 'EDT' })?.id, 'x');
    assert.strictEqual(
      parsePerfumeDoc('x', { name: 'A', brand: 'B', concentration: 'Eau' }),
      null,
    );
  });
});

describe('P1 katalog — rencana migrasi (idempotent)', () => {
  it('tanpa dokumen yang ada: semua 36 dibuat; yang sudah ada dilewati; --force menimpa', () => {
    const fresh = buildMigrationPlan(SEED_PERFUMES, new Set());
    assert.strictEqual(fresh.filter(p => p.action === 'create').length, 36);
    const existing = new Set(['prf_001', 'prf_002']);
    const rerun = buildMigrationPlan(SEED_PERFUMES, existing);
    assert.strictEqual(rerun.filter(p => p.action === 'skip').length, 2);
    assert.strictEqual(rerun.filter(p => p.action === 'create').length, 34);
    const forced = buildMigrationPlan(SEED_PERFUMES, existing, true);
    assert.strictEqual(forced.filter(p => p.action === 'overwrite').length, 2);
    assert.strictEqual(forced.filter(p => p.action === 'create').length, 34);
  });
});

describe('P1 katalog — validasi simpan', () => {
  it('nama, brand, konsentrasi, market_tier wajib — alasan per field', () => {
    const reasons = validatePerfumeForSave({});
    const fields = reasons.map(r => r.field);
    assert.ok(fields.includes('name'));
    assert.ok(fields.includes('brand'));
    assert.ok(fields.includes('concentration'));
    assert.ok(fields.includes('market_tier'));
    assert.strictEqual(reasons.length, 4);
  });

  it('dokumen lengkap lolos validasi simpan; field kosong yang jujur (unknown/0) diizinkan', () => {
    const doc = makeDoc({ id: 'ok', gender_label: 'unknown', projection_expected: 0 });
    assert.deepStrictEqual(validatePerfumeForSave(doc), []);
  });

  it('konsentrasi di luar kosakata ditolak', () => {
    const reasons = validatePerfumeForSave(
      makeDoc({ id: 'bad', concentration: 'Eau' as PerfumeDoc['concentration'] }),
    );
    assert.ok(reasons.some(r => r.field === 'concentration'));
  });
});

describe('P1 katalog — validasi publish (alasan PER FIELD)', () => {
  const publishable = () =>
    makeDoc({
      id: 'pub',
      data_status: 'review',
      primary_family: 'Woody',
      top_notes: 'Bergamot',
      heart_notes: 'Jasmine',
      base_notes: 'Sandalwood',
      source_official_url: 'https://brand.example/perfume',
    });

  it('dokumen lengkap lolos publish', () => {
    assert.deepStrictEqual(validatePublish(publishable()), []);
  });

  it('publish gagal bila notes / family / sumber resmi kosong — satu alasan per field', () => {
    const doc = makeDoc({
      id: 'nope',
      data_status: 'draft',
      primary_family: undefined,
      top_notes: '',
      heart_notes: '',
      base_notes: '',
      source_official_url: undefined,
    });
    const reasons = validatePublish(doc);
    const fields = reasons.map(r => r.field);
    assert.ok(fields.includes('top_notes'));
    assert.ok(fields.includes('heart_notes'));
    assert.ok(fields.includes('base_notes'));
    assert.ok(fields.includes('primary_family'));
    assert.ok(fields.includes('source_official_url'));
    // Alasan simpan (nama/brand/konsentrasi/tier) tidak muncul untuk dokumen lengkap.
    assert.ok(!fields.includes('name'));
    assert.ok(!fields.includes('brand'));
  });

  it('URL sumber bukan http(s) ditolak dengan alasan field-nya sendiri', () => {
    const doc = publishable();
    doc.source_official_url = 'shopee.co.id/search?keyword=x';
    const reasons = validatePublish(doc);
    assert.strictEqual(reasons.length, 1);
    assert.strictEqual(reasons[0].field, 'source_official_url');
  });

  it('PublishValidationError membawa reasons untuk ditampilkan per field di admin', () => {
    const err = new PublishValidationError([{ field: 'top_notes', message: 'Top notes wajib diisi sebelum terbit.' }]);
    assert.ok(err instanceof Error);
    assert.strictEqual(err.reasons[0].field, 'top_notes');
    assert.match(err.message, /Top notes/);
  });
});
