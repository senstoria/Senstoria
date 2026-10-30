import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateMatchScore,
  DEFAULT_QUIZ_ANSWERS,
  DERIVED_ATTRIBUTE_CAP,
  readSavedQuizAnswers,
  ScentQuizAnswers
} from './scentScoring.ts';
import { SEED_PERFUMES, PUBLISHED_PERFUMES, SeedPerfume } from '../data/seedPerfumes.ts';
import { formatScoreOutOfFive, translations, fmt } from './i18n.ts';
import {
  computeCatalogFacetCounts,
  perfumeMatchesFamily,
  computeCommunityReviewAggregate,
  ReviewState
} from './derivedCalculations.ts';

// Minimal verified-style perfume; overrides set the fields under test.
function makePerfume(overrides: Partial<SeedPerfume>): SeedPerfume {
  return {
    id: 'prf_test_1',
    slug: 'test-perfume',
    name: 'Test Perfume',
    brand: 'Test Brand',
    concentration: 'EDP',
    gender_label: 'feminine',
    primary_family: 'Floral',
    origin: 'ID',
    market_tier: 'indie',
    reference_price_idr: 300000,
    reference_price_size_ml: 50,
    price_is_sample: false,
    top_notes: 'Rose, Jasmine',
    heart_notes: 'Peony',
    base_notes: 'Musk, Amber',
    heat_suitability: 4,
    longevity_expected_band: '6-8h',
    projection_expected: 2,
    description_id: 'Parfum tes.',
    description_en: 'Test perfume.',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: '',
    data_status: 'published',
    source_official_url: 'https://example.test/products/test',
    source_checked_date: '2026-10-30',
    verified_by: '',
    ...overrides
  };
}

const FULL_ANSWERS: ScentQuizAnswers = {
  preferredFamilies: ['Floral'],
  climateSetting: 'outdoor_hot',
  occasionSetting: 'daily_office',
  longevityExpectation: 'moderate',
  genderPreference: 'feminine',
  budgetTier: 'mid',
  avoidNotesOrTraits: ['none']
};

describe('Sprint 3: D-06 calibration', () => {
  it('applies shrinkage when only some dimensions are scored (partial quiz)', () => {
    // Only notesFamily + budget active: W = 25 + 10 = 35 -> factor 0.87.
    const partial: ScentQuizAnswers = {
      preferredFamilies: ['Floral'],
      climateSetting: 'flexible',
      occasionSetting: 'flexible',
      longevityExpectation: 'not_sure',
      genderPreference: 'any',
      budgetTier: 'mid',
      avoidNotesOrTraits: ['none']
    };
    const result = calculateMatchScore(makePerfume({}), partial);
    const sumPoints = result.breakdownRows.reduce((a, r) => a + r.points, 0);
    const adj = result.adjustment ? result.adjustment.points : 0;
    assert.strictEqual(sumPoints + adj, result.matchScore);
    assert.ok(result.adjustment !== null, 'partial quiz must carry a shrinkage adjustment');
    assert.ok(result.adjustment!.points < 0, 'shrinkage adjustment is negative');
    assert.match(result.adjustment!.reasonEn, /shrinkage/);
    assert.ok(result.matchScore < result.rawPreAdjustmentScore, 'shrunk score below raw score');
  });

  it('does not shrink the all-skipped versatility run (W = 100, factor 1)', () => {
    const result = calculateMatchScore(makePerfume({}), DEFAULT_QUIZ_ANSWERS);
    assert.strictEqual(result.matchScore, result.rawPreAdjustmentScore);
    assert.strictEqual(result.adjustment, null);
  });

  it('caps derived climate and longevity fits at 0.85', () => {
    // Outdoor-hot heat>=4 would be 0.94 uncapped; moderate 6-8h would be 0.94.
    const result = calculateMatchScore(makePerfume({}), FULL_ANSWERS);
    const climate = result.breakdownRows.find(r => r.key === 'climate')!;
    const longevity = result.breakdownRows.find(r => r.key === 'longevity')!;
    assert.strictEqual(climate.fit, DERIVED_ATTRIBUTE_CAP);
    assert.strictEqual(longevity.fit, DERIVED_ATTRIBUTE_CAP);
  });

  it('caps every skip-quiz versatility estimate at 0.85', () => {
    // Uncapped versatility raw for this perfume would be 84.5 -> 85;
    // with the 0.86 estimates capped to 0.85 it is 84.05 -> 84.
    const maxVersatility = makePerfume({
      primary_family: 'Fresh',
      heat_suitability: 4,
      longevity_expected_band: '6-8h',
      projection_expected: 2,
      gender_label: 'unisex',
      reference_price_idr: 500000
    });
    const result = calculateMatchScore(maxVersatility, DEFAULT_QUIZ_ANSWERS);
    assert.strictEqual(result.matchScore, 84);
  });

  it('keeps ceiling 96 and conflict cap 79 with the new pipeline', () => {
    const conflict: ScentQuizAnswers = { ...FULL_ANSWERS, genderPreference: 'masculine' };
    const masculine = makePerfume({ gender_label: 'masculine' });
    // masculine vs feminine preference conflicts; use a feminine perfume instead
    const feminine = makePerfume({ gender_label: 'feminine' });
    void masculine;
    const res = calculateMatchScore(feminine, conflict);
    assert.ok(res.matchScore <= 79);
    assert.ok(res.adjustment !== null);
  });
});

describe('Sprint 3: occasion tags + NoData honesty', () => {
  it('scores a tagged occasion 0.92 and an untagged occasion 0.45', () => {
    const tagged = makePerfume({ occasion_tags: ['formal'] });
    const formal = calculateMatchScore(tagged, { ...FULL_ANSWERS, occasionSetting: 'formal_evening' });
    const office = calculateMatchScore(tagged, { ...FULL_ANSWERS, occasionSetting: 'daily_office' });
    const formalRow = formal.breakdownRows.find(r => r.key === 'occasion')!;
    const officeRow = office.breakdownRows.find(r => r.key === 'occasion')!;
    assert.strictEqual(formalRow.fit, 0.92);
    assert.strictEqual(formalRow.isNoData, false);
    assert.strictEqual(officeRow.fit, 0.45);
    assert.strictEqual(officeRow.isNoData, false);
  });

  it('scores NoData (never guessed) when occasion tags are absent', () => {
    const untagged = makePerfume({ occasion_tags: undefined });
    const result = calculateMatchScore(untagged, { ...FULL_ANSWERS, occasionSetting: 'daily_office' });
    const row = result.breakdownRows.find(r => r.key === 'occasion')!;
    assert.strictEqual(row.isNoData, true);
    assert.strictEqual(row.fit, null);
    assert.strictEqual(row.points, 0);
  });

  it('scores NoData for unknown heat, longevity band, and gender label', () => {
    const unknown = makePerfume({
      heat_suitability: undefined,
      longevity_expected_band: 'unknown',
      gender_label: 'unknown'
    });
    const result = calculateMatchScore(unknown, FULL_ANSWERS);
    for (const key of ['climate', 'longevity', 'gender'] as const) {
      const row = result.breakdownRows.find(r => r.key === key)!;
      assert.strictEqual(row.isNoData, true, `${key} must be NoData`);
      assert.strictEqual(row.fit, null);
    }
    // The remaining scored dimensions still produce a valid total.
    const sumPoints = result.breakdownRows.reduce((a, r) => a + r.points, 0);
    const adj = result.adjustment ? result.adjustment.points : 0;
    assert.strictEqual(sumPoints + adj, result.matchScore);
  });
});

describe('Sprint 3: skip defaults + saved answers', () => {
  it('documents the stated Flexible/Free skip defaults', () => {
    assert.deepStrictEqual(DEFAULT_QUIZ_ANSWERS.preferredFamilies, ['not_sure']);
    assert.strictEqual(DEFAULT_QUIZ_ANSWERS.climateSetting, 'flexible');
    assert.strictEqual(DEFAULT_QUIZ_ANSWERS.occasionSetting, 'flexible');
    assert.strictEqual(DEFAULT_QUIZ_ANSWERS.longevityExpectation, 'not_sure');
    assert.strictEqual(DEFAULT_QUIZ_ANSWERS.genderPreference, 'any');
    assert.strictEqual(DEFAULT_QUIZ_ANSWERS.budgetTier, 'flexible');
    assert.deepStrictEqual(DEFAULT_QUIZ_ANSWERS.avoidNotesOrTraits, ['none']);
  });

  it('readSavedQuizAnswers reports no real answers without storage', () => {
    const g = globalThis as Record<string, unknown>;
    const prev = g.localStorage;
    delete g.localStorage;
    try {
      const res = readSavedQuizAnswers();
      assert.strictEqual(res.hasRealAnswers, false);
      assert.deepStrictEqual(res.answers, DEFAULT_QUIZ_ANSWERS);
    } finally {
      if (prev !== undefined) g.localStorage = prev;
    }
  });

  it('readSavedQuizAnswers distinguishes defaults from real saved answers', () => {
    const g = globalThis as Record<string, unknown>;
    const prev = g.localStorage;
    const store = new Map<string, string>();
    g.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); }
    };
    try {
      store.set('senstoria_quiz_answers_v2', JSON.stringify(DEFAULT_QUIZ_ANSWERS));
      assert.strictEqual(readSavedQuizAnswers().hasRealAnswers, false);
      store.set('senstoria_quiz_answers_v2', JSON.stringify(FULL_ANSWERS));
      const real = readSavedQuizAnswers();
      assert.strictEqual(real.hasRealAnswers, true);
      assert.deepStrictEqual(real.answers, FULL_ANSWERS);
    } finally {
      if (prev !== undefined) g.localStorage = prev;
      else delete g.localStorage;
    }
  });
});

describe('Sprint 3: published-only catalog + facets', () => {
  it('publishes exactly the 2 officially verified rows', () => {
    assert.strictEqual(PUBLISHED_PERFUMES.length, 2);
    assert.deepStrictEqual(PUBLISHED_PERFUMES.map(p => p.id).sort(), ['prf_013', 'prf_014']);
    for (const p of PUBLISHED_PERFUMES) {
      assert.strictEqual(p.data_status, 'published');
      assert.ok(p.source_official_url && p.source_official_url.length > 0);
      assert.strictEqual(p.price_is_sample, false);
      assert.ok(p.price_checked_date);
    }
  });

  it('draft rows carry no affiliate-style link and no brand claim', () => {
    const drafts = SEED_PERFUMES.filter(p => p.data_status !== 'published');
    assert.strictEqual(drafts.length, 12);
    for (const p of drafts) {
      assert.strictEqual(p.shopee_url, '');
      assert.strictEqual(p.tokopedia_url, '');
      assert.ok(!p.brand_claims, `${p.id} draft must not carry a brand claim`);
    }
  });

  it('facet counts equal filter results for every family (published set)', () => {
    const counts = computeCatalogFacetCounts(PUBLISHED_PERFUMES);
    for (const fam of ['Fresh', 'Floral', 'Woody', 'Ambery', 'Gourmand', 'Aromatic']) {
      const filtered = PUBLISHED_PERFUMES.filter(p => perfumeMatchesFamily(p, fam));
      assert.strictEqual(counts.familyCounts[fam] ?? 0, filtered.length, `family ${fam}`);
    }
    assert.strictEqual(counts.familyCounts['Floral'], 1); // Enchantée only
    assert.strictEqual(counts.familyCounts['Woody'], 0);
  });

  it('a family-less published perfume matches no family filter', () => {
    const perfection = PUBLISHED_PERFUMES.find(p => p.id === 'prf_013')!;
    assert.strictEqual(perfection.primary_family, undefined);
    for (const fam of ['Fresh', 'Floral', 'Woody', 'Ambery', 'Gourmand', 'Aromatic']) {
      assert.strictEqual(perfumeMatchesFamily(perfection, fam), false);
    }
  });
});

describe('Sprint 3: review threshold honesty', () => {
  function review(id: string, status: ReviewState['status'], rating: number): ReviewState {
    return {
      id,
      user_id: 'usr_test',
      user_name: 'Tester',
      perfume_id: 'prf_013',
      rating,
      longevity_band: '6–8 jam',
      sillage: 'moderate',
      value_for_money: 4,
      repurchase_intent: 'maybe',
      format_used: 'full_bottle',
      title: 'Test',
      review_text: 'Test review.',
      status,
      created_at: '2026-10-30',
      helpful_count: 0
    };
  }

  it('below 5 approved reviews shows no aggregate', () => {
    const reviews = [1, 2, 3, 4].map(i => review(`r${i}`, 'approved', 5));
    const agg = computeCommunityReviewAggregate(reviews, 'prf_013', 5);
    assert.strictEqual(agg.hasEnoughReviews, false);
  });

  it('at 5 approved reviews aggregates approved reviews only', () => {
    const reviews = [
      ...[5, 5, 5, 5, 5].map((r, i) => review(`a${i}`, 'approved', r)),
      review('p1', 'pending_moderation', 1),
      review('p2', 'pending_moderation', 1)
    ];
    const agg = computeCommunityReviewAggregate(reviews, 'prf_013', 5);
    assert.strictEqual(agg.hasEnoughReviews, true);
    assert.strictEqual(agg.averageRating, 5);
    assert.strictEqual(agg.totalPublishedReviews, 5);
  });
});

describe('Sprint 3: header = points + adjustment in every scenario', () => {
  const scenarios: Array<[string, ScentQuizAnswers]> = [
    ['full quiz', FULL_ANSWERS],
    ['skip quiz', DEFAULT_QUIZ_ANSWERS],
    ['2-question partial', {
      preferredFamilies: ['Woody'],
      climateSetting: 'flexible',
      occasionSetting: 'flexible',
      longevityExpectation: 'not_sure',
      genderPreference: 'any',
      budgetTier: 'premium',
      avoidNotesOrTraits: ['none']
    }]
  ];
  for (const [name, answers] of scenarios) {
    it(`${name}: header equals points + adjustment literally`, () => {
      for (const p of PUBLISHED_PERFUMES) {
        const res = calculateMatchScore(p, answers);
        const sumPoints = res.breakdownRows.reduce((a, r) => a + r.points, 0);
        const adj = res.adjustment ? res.adjustment.points : 0;
        assert.strictEqual(sumPoints + adj, res.matchScore, `${name} ${p.id}`);
        assert.ok(res.matchScore <= 96);
      }
    });
  }
});

// Patch regression tests (live-walkthrough findings, 30 Oct 2026).
// Finding 1: the public catalog count must come from the published-only
// source, never from the full seed array (14 rows incl. 12 drafts).
describe('patch: public catalog count is published-only', () => {
  it('published set is exactly the 2 founder-approved rows, no drafts', () => {
    assert.strictEqual(PUBLISHED_PERFUMES.length, 2);
    assert.deepStrictEqual(
      PUBLISHED_PERFUMES.map(p => p.id).sort(),
      ['prf_013', 'prf_014']
    );
    for (const p of PUBLISHED_PERFUMES) assert.strictEqual(p.data_status, 'published');
  });

  it('the Library picker predicate yields the same published set', () => {
    const catalogPerfumes = SEED_PERFUMES.filter(p => p.data_status === 'published');
    assert.deepStrictEqual(
      catalogPerfumes.map(p => p.id).sort(),
      PUBLISHED_PERFUMES.map(p => p.id).sort()
    );
  });

  it('full seed length differs from the published count (the old bug source)', () => {
    assert.strictEqual(SEED_PERFUMES.length, 14);
    assert.notStrictEqual(SEED_PERFUMES.length, PUBLISHED_PERFUMES.length);
  });
});

// Finding 2: the detail climate section must never render "undefined".
// Published rows legitimately omit heat_suitability (brand does not state
// it), so the display rule must map absence to a NoData label.
describe('patch: heat suitability display never renders undefined', () => {
  it('both published rows omit heat_suitability (NoData precondition)', () => {
    for (const p of PUBLISHED_PERFUMES) assert.strictEqual(p.heat_suitability, undefined);
  });

  it('formatScoreOutOfFive maps values and absence honestly', () => {
    assert.strictEqual(formatScoreOutOfFive(4, 'Tanpa data'), '4/5');
    assert.strictEqual(formatScoreOutOfFive(undefined, 'Tanpa data'), 'Tanpa data');
    assert.strictEqual(formatScoreOutOfFive(null, '–'), '–');
    assert.strictEqual(formatScoreOutOfFive(1, 'No data'), '1/5');
  });

  it('no seed row renders the string "undefined" through the display rule', () => {
    for (const p of SEED_PERFUMES) {
      const out = formatScoreOutOfFive(p.heat_suitability, 'Tanpa data');
      assert.ok(!out.includes('undefined'), `${p.id} rendered ${out}`);
    }
  });
});

// Round 2 patch: the two remaining "undefined" renderings proven live on
// preview 993a3765, plus the third site the sweep caught in the same path.
describe('patch round 2: no undefined in user-facing copy', () => {
  const FLEXIBLE_ALL: ScentQuizAnswers = {
    preferredFamilies: ['not_sure'],
    climateSetting: 'flexible',
    occasionSetting: 'flexible',
    longevityExpectation: 'not_sure',
    genderPreference: 'any',
    budgetTier: 'flexible',
    avoidNotesOrTraits: ['none']
  };
  const AMBERY: ScentQuizAnswers = {
    preferredFamilies: ['Ambery'],
    climateSetting: 'evening_cool',
    occasionSetting: 'casual_dating',
    longevityExpectation: 'light',
    genderPreference: 'any',
    budgetTier: 'budget',
    avoidNotesOrTraits: ['none']
  };
  const GOURMAND: ScentQuizAnswers = {
    preferredFamilies: ['Gourmand'],
    climateSetting: 'indoor_ac',
    occasionSetting: 'formal_evening',
    longevityExpectation: 'long',
    genderPreference: 'masculine',
    budgetTier: 'premium',
    avoidNotesOrTraits: ['none']
  };

  it('main-section heat cell never renders undefined for published rows (Defect A)', () => {
    for (const p of PUBLISHED_PERFUMES) {
      // Mirrors the ProductDetailView scorecard cell expression exactly.
      const cellId = p.heat_suitability != null ? fmt(translations.id.productDetail.heatScore, p.heat_suitability) : translations.id.productDetail.iklimTanpaData;
      const cellEn = p.heat_suitability != null ? fmt(translations.en.productDetail.heatScore, p.heat_suitability) : translations.en.productDetail.iklimTanpaData;
      assert.ok(!cellId.includes('undefined'), `${p.id} ID cell: ${cellId}`);
      assert.ok(!cellEn.includes('undefined'), `${p.id} EN cell: ${cellEn}`);
      assert.strictEqual(cellId, 'Tanpa data');
      assert.strictEqual(cellEn, 'No data');
    }
  });

  it('family-less fallback bullets are family-neutral, never undefined (Defect B)', () => {
    const perf = PUBLISHED_PERFUMES.find(p => p.id === 'prf_013')!;
    assert.strictEqual(perf.primary_family, undefined);
    for (const answers of [DEFAULT_QUIZ_ANSWERS, FLEXIBLE_ALL, AMBERY]) {
      const r = calculateMatchScore(perf, answers);
      for (const b of [...r.whyFitsBulletsId, ...r.whyFitsBulletsEn]) assert.ok(!b.includes('undefined'), b);
    }
    const skip = calculateMatchScore(perf, DEFAULT_QUIZ_ANSWERS);
    assert.ok(skip.whyFitsBulletsId.includes('Komposisi yang seimbang dan adaptif untuk berbagai kebutuhan.'));
    assert.ok(skip.whyFitsBulletsEn.includes('Balanced composition adaptable across various daily needs.'));
  });

  it('family mismatch citation names the unrecorded family, never undefined (sweep site C)', () => {
    const perf = PUBLISHED_PERFUMES.find(p => p.id === 'prf_013')!;
    const r = calculateMatchScore(perf, FULL_ANSWERS);
    const row = r.breakdownRows.find(x => x.key === 'notesFamily')!;
    assert.ok(!row.citationId.includes('undefined'), row.citationId);
    assert.ok(!row.citationEn.includes('undefined'), row.citationEn);
    assert.match(row.citationId, /keluarga yang belum tercatat/);
    assert.match(row.citationEn, /an unrecorded family/);
  });

  it('matrix: no bullet or citation contains undefined for any published row', () => {
    const sets = [FULL_ANSWERS, DEFAULT_QUIZ_ANSWERS, FLEXIBLE_ALL, AMBERY, GOURMAND];
    for (const p of PUBLISHED_PERFUMES) {
      for (const answers of sets) {
        const r = calculateMatchScore(p, answers);
        const texts = [...r.whyFitsBulletsId, ...r.whyFitsBulletsEn, ...r.breakdownRows.flatMap(row => [row.citationId, row.citationEn])];
        for (const t of texts) assert.ok(!t.includes('undefined'), `${p.id}: ${t}`);
      }
    }
  });
});
