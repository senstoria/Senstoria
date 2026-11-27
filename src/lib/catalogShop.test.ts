// Fase N3 — tests for the Shop-catalog helpers (catalogShop.ts).
// Fixtures are labelled test data, never presented as real catalog rows.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import {
  parseCatalogQuery,
  serializeCatalogQuery,
  EMPTY_CATALOG_QUERY,
  DEFAULT_CATALOG_SORT,
  newestFirst,
  FAMILY_TILES,
  computeSearchSuggestions,
  honestSearchSuggestion,
  countActiveFilters,
  CatalogQueryState,
} from './catalogShop.ts';

const makePerfume = (overrides: Partial<SeedPerfume> & { id: string }): SeedPerfume => ({
  id: overrides.id,
  slug: overrides.slug ?? overrides.id,
  name: overrides.name ?? 'Test Perfume',
  brand: overrides.brand ?? 'Test Brand',
  concentration: overrides.concentration ?? 'EDP',
  release_year: overrides.release_year,
  gender_label: overrides.gender_label ?? 'unknown',
  primary_family: overrides.primary_family,
  secondary_family: overrides.secondary_family,
  origin: overrides.origin ?? 'ID',
  brand_country: overrides.brand_country,
  market_tier: overrides.market_tier ?? 'indie',
  reference_price_idr: overrides.reference_price_idr ?? 100000,
  reference_price_size_ml: overrides.reference_price_size_ml ?? 50,
  price_is_sample: false,
  top_notes: overrides.top_notes ?? 'Bergamot',
  heart_notes: overrides.heart_notes ?? 'Jasmine',
  base_notes: overrides.base_notes ?? 'Sandalwood',
  longevity_expected_band: '4-6h',
  projection_expected: 2,
  description_id: 'Deskripsi tes.',
  description_en: 'Test description.',
  sample_candidate: false,
  shopee_url: '',
  tokopedia_url: '',
  data_status: overrides.data_status ?? 'published',
  occasion_tags: overrides.occasion_tags,
});

// The two published perfumes, as fixtures (families/occasions as in seed).
const perfection = makePerfume({
  id: 'prf_013',
  slug: 'hmns-the-perfection',
  name: 'The Perfection',
  brand: 'HMNS',
  top_notes: 'Bergamot, Elemi, Indonesian Clove, Nutmeg',
  heart_notes: 'Lavender, Tagetes, Lily of the Valley, Green Pear',
  base_notes: 'Driftwood, Sandalwood, Leather, Musk',
  reference_price_size_ml: 100,
});
const enchantee = makePerfume({
  id: 'prf_014',
  slug: 'carl-claire-enchantee',
  name: 'Enchantée',
  brand: 'Carl & Claire',
  primary_family: 'Floral',
  occasion_tags: ['formal', 'casual'],
  top_notes: 'Citrus, Ginger, Peach',
  heart_notes: 'White Flowers, Jasmine, Tuberose, Heliotrope',
  base_notes: 'Ambrette, Musk, Gourmand',
  reference_price_size_ml: 30,
  gender_label: 'feminine',
});

const SFP = [
  { id: 'Amber', label: 'Ambery' },
  { id: 'Chypre', label: 'Chypre' },
  { id: 'Citrus', label: 'Citrus' },
  { id: 'Floral', label: 'Floral' },
  { id: 'Fougère', label: 'Fougère' },
  { id: 'Leather', label: 'Leather' },
  { id: 'Woody', label: 'Woody' },
];

describe('Fase N3: catalog URL state (parse/serialize)', () => {
  it('round-trips a full filter state through the query string', () => {
    const state: CatalogQueryState = {
      ...EMPTY_CATALOG_QUERY,
      q: 'floral',
      sort: 'price-asc',
      families: ['Floral', 'Woody'],
      brands: ['HMNS'],
      genders: ['feminine'],
      origins: ['Indonesia'],
      concentrations: ['EDP'],
      years: ['2020', 'before-2000'],
      occasions: ['formal'],
      reviewRate: 4,
      note: 'jasmine',
      priceMin: 100000,
      priceMax: 500000,
    };
    const parsed = parseCatalogQuery(`?${serializeCatalogQuery(state)}`);
    assert.deepStrictEqual(parsed, state);
  });

  it('serializes an empty state to an empty string (bare /catalog)', () => {
    assert.strictEqual(serializeCatalogQuery(EMPTY_CATALOG_QUERY), '');
    assert.deepStrictEqual(parseCatalogQuery(''), EMPTY_CATALOG_QUERY);
  });

  it('omits the default sort from the URL', () => {
    assert.strictEqual(
      serializeCatalogQuery({ ...EMPTY_CATALOG_QUERY, sort: DEFAULT_CATALOG_SORT }),
      ''
    );
  });

  it('drops invalid values instead of guessing', () => {
    const parsed = parseCatalogQuery(
      '?sort=bogus&family=Floral,Bogus&gender=alien&rate=9&year=abcd&pmin=-5&pmax=10&conc=EDP,XXX&occ=daily,nope'
    );
    assert.strictEqual(parsed.sort, DEFAULT_CATALOG_SORT);
    assert.deepStrictEqual(parsed.families, ['Floral']);
    assert.deepStrictEqual(parsed.genders, []);
    assert.strictEqual(parsed.reviewRate, null);
    assert.deepStrictEqual(parsed.years, []);
    assert.strictEqual(parsed.priceMin, 0);
    assert.strictEqual(parsed.priceMax, 10);
    assert.deepStrictEqual(parsed.concentrations, ['EDP']);
    assert.deepStrictEqual(parsed.occasions, ['daily']);
  });

  it('clamps a max below the min up to the min', () => {
    const parsed = parseCatalogQuery('?pmin=500000&pmax=100000');
    assert.strictEqual(parsed.priceMin, 500000);
    assert.strictEqual(parsed.priceMax, 500000);
  });

  it('dedupes list values, keeping first-seen order', () => {
    const parsed = parseCatalogQuery('?family=Floral,Woody,Floral');
    assert.deepStrictEqual(parsed.families, ['Floral', 'Woody']);
  });
});

describe('Fase N3: newest-first order (C2)', () => {
  it('sorts by release_year desc and keeps seed order on ties', () => {
    const a = makePerfume({ id: 'a', release_year: 2020 });
    const b = makePerfume({ id: 'b', release_year: 2024 });
    const c = makePerfume({ id: 'c' });
    assert.deepStrictEqual(
      newestFirst([a, b, c]).map(p => p.id),
      ['b', 'a', 'c']
    );
    // Both published rows lack release_year: order is the seed order.
    assert.deepStrictEqual(
      newestFirst([perfection, enchantee]).map(p => p.id),
      ['prf_013', 'prf_014']
    );
  });
});

describe('Fase N3: family tiles (C1)', () => {
  it('defines exactly the four Shop-category tiles with N1 tints', () => {
    assert.deepStrictEqual(
      FAMILY_TILES.map(t => t.key),
      ['Woody', 'Floral', 'Fresh', 'Amber']
    );
    assert.deepStrictEqual(
      FAMILY_TILES.map(t => t.label),
      ['Woody', 'Floral', 'Fresh', 'Oriental']
    );
    for (const tile of FAMILY_TILES) {
      assert.match(
        tile.tintClass,
        /^bg-family-(mist|sage|sand|blush|lavender)$/,
        `${tile.key} must use an existing N1 tint class`
      );
    }
  });
});

describe('Fase N3: search suggestions (C3)', () => {
  const published = [perfection, enchantee];

  it('suggests matching names first', () => {
    const out = computeSearchSuggestions(published, 'ench', SFP);
    assert.deepStrictEqual(out, [
      { text: 'Enchantée', kind: 'perfume' },
    ]);
  });

  it('suggests families that have published perfumes', () => {
    const out = computeSearchSuggestions(published, 'flor', SFP);
    assert.deepStrictEqual(out, [{ text: 'Floral', kind: 'family' }]);
  });

  it('suggests note phrases from published perfumes', () => {
    const out = computeSearchSuggestions(published, 'berg', SFP);
    assert.deepStrictEqual(out, [{ text: 'Bergamot', kind: 'note' }]);
  });

  it('never suggests a family with no published perfume', () => {
    // 'woody' matches the Woody label, but no published perfume has
    // that family, so the family is not suggested — and no note or
    // name contains 'woody' either.
    assert.deepStrictEqual(
      computeSearchSuggestions(published, 'woody', SFP),
      []
    );
    assert.deepStrictEqual(
      computeSearchSuggestions(published, 'amber', SFP),
      []
    );
    assert.deepStrictEqual(
      computeSearchSuggestions(published, 'chypre', SFP),
      []
    );
  });

  it('matches note phrases by substring (wood → Driftwood, Sandalwood)', () => {
    assert.deepStrictEqual(computeSearchSuggestions(published, 'wood', SFP), [
      { text: 'Driftwood', kind: 'note' },
      { text: 'Sandalwood', kind: 'note' },
    ]);
  });

  it('returns nothing for an empty query and caps at five', () => {
    assert.deepStrictEqual(computeSearchSuggestions(published, '  ', SFP), []);
    const many = computeSearchSuggestions(published, 'a', SFP, 5);
    assert.ok(many.length <= 5);
  });

  it('honest empty-state suggestion is a term that returns results', () => {
    assert.strictEqual(honestSearchSuggestion(published, SFP), 'floral');
    assert.strictEqual(honestSearchSuggestion([], SFP), null);
  });
});

describe('Fase N3: drawer Reset count (C7)', () => {
  it('counts filter dimensions, not sort or search', () => {
    assert.strictEqual(countActiveFilters(EMPTY_CATALOG_QUERY), 0);
    assert.strictEqual(
      countActiveFilters({
        ...EMPTY_CATALOG_QUERY,
        families: ['Floral'],
        brands: ['HMNS', 'Carl & Claire'],
        priceMin: 100000,
      }),
      4
    );
    assert.strictEqual(
      countActiveFilters({ ...EMPTY_CATALOG_QUERY, q: 'x', sort: 'price-asc' }),
      0
    );
  });
});
