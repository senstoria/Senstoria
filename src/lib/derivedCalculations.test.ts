import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  calculateRemainingPercentage, 
  isLowBottle, 
  computeCollectionSummary,
  computeScentDna,
  computeDiaryStats,
  computeReviewSummary,
  computeCommunityReviewAggregate,
  AFFILIATE_DISCLOSURE,
  largestRemainderRound,
  BottleState,
  WearLogState,
  StoryState,
  ReviewState
} from './derivedCalculations.ts';
import { 
  validateScentDnaData, 
  countProfilePerfumes, 
  extractRankedTopNotes 
} from '../components/ScentDnaVisualisation.tsx';

describe('Senstoria Derived Calculations & Invariants', () => {
  it('BR-01 & BR-02: calculates remaining percentage accurately for active bottles', () => {
    const activeBottle: BottleState = {
      id: 'b1',
      perfume_id: 'p1',
      status: 'in_use',
      size_ml: 50,
      remaining_ml: 25
    };
    assert.strictEqual(calculateRemainingPercentage(activeBottle), 50);

    // Minimum 1% when remaining > 0
    const tinyBottle: BottleState = {
      id: 'b2',
      perfume_id: 'p2',
      status: 'in_use',
      size_ml: 100,
      remaining_ml: 0.2
    };
    assert.strictEqual(calculateRemainingPercentage(tinyBottle), 1);

    // Finished bottles return null (BR-02: % never shows on finished)
    const finishedBottle: BottleState = {
      id: 'b3',
      perfume_id: 'p3',
      status: 'finished',
      size_ml: 50,
      remaining_ml: 0
    };
    assert.strictEqual(calculateRemainingPercentage(finishedBottle), null);
  });

  it('BR-02: identifies low-bottle alerts (remaining <= 20%)', () => {
    const lowBottle: BottleState = {
      id: 'b1',
      perfume_id: 'p1',
      status: 'in_use',
      size_ml: 50,
      remaining_ml: 8 // 16% <= 20%
    };
    assert.strictEqual(isLowBottle(lowBottle), true);

    const normalBottle: BottleState = {
      id: 'b2',
      perfume_id: 'p2',
      status: 'in_use',
      size_ml: 50,
      remaining_ml: 35 // 70% > 20%
    };
    assert.strictEqual(isLowBottle(normalBottle), false);
  });

  it('XC-01 & BR-05: Single Source of Truth collection summary correctly separates wears and stories', () => {
    const bottlesFixture: BottleState[] = [
      { id: 'b1', perfume_id: 'p1', status: 'in_use', size_ml: 50, remaining_ml: 25, price_idr: 300000, is_favorite: true },
      { id: 'b2', perfume_id: 'p2', status: 'sealed', size_ml: 100, remaining_ml: 100, price_idr: 500000, is_favorite: false },
      { id: 'b3', perfume_id: 'p3', status: 'finished', size_ml: 50, remaining_ml: 0, price_idr: 200000, is_favorite: true }
    ];

    const wearsFixture: WearLogState[] = [
      { id: 'w1', bottle_id: 'b1', perfume_id: 'p1', worn_at: '2026-10-15' },
      { id: 'w2', bottle_id: 'b1', perfume_id: 'p1', worn_at: '2026-10-16' },
      { id: 'w3', bottle_id: 'b2', perfume_id: 'p2', worn_at: '2026-10-17' }
    ];

    const storiesFixture: StoryState[] = [
      { id: 's1', perfume_id: 'p1', body: 'A scent story that has more than twenty characters for validation', status: 'published' },
      { id: 's2', perfume_id: 'p2', body: 'Draft story', status: 'draft' } // Draft must be excluded (BR-05)
    ];

    const summary = computeCollectionSummary(bottlesFixture, wearsFixture, storiesFixture);

    // Total Library Bottles = 2 (sealed + in_use, excludes finished b3)
    assert.strictEqual(summary.totalLibraryBottles, 2);
    assert.strictEqual(summary.currentlyWearingCount, 2);
    assert.strictEqual(summary.memoriesCount, 1);
    assert.strictEqual(summary.favoritesCount, 2);
    assert.strictEqual(summary.totalWearsCount, 3);
    assert.strictEqual(summary.totalJournalStoriesCount, 1); // Only 1 published story >= 20 chars
    // Collection value includes active bottles only (300k + 500k = 800k)
    assert.strictEqual(summary.totalCollectionValueIdr, 800000);
  });

  it('Phase 3: Scent DNA computes family distribution, top notes, and climate suitability', () => {
    // Sprint 2: no stored counter. The favorite still makes Woody
    // dominant with no wear logs; the logs-win case is covered by
    // sprint2.test.ts.
    const bottles: BottleState[] = [
      { id: 'b1', perfume_id: 'p_woody', status: 'in_use', size_ml: 50, remaining_ml: 40, is_favorite: true },
      { id: 'b2', perfume_id: 'p_floral', status: 'in_use', size_ml: 50, remaining_ml: 30, is_favorite: false }
    ];

    const perfumes = [
      {
        id: 'p_woody',
        primary_family: 'Woody',
        top_notes: 'Bergamot, Pink Pepper',
        heart_notes: 'Cedarwood, Vetiver',
        base_notes: 'Sandalwood, Amber',
        heat_suitability: 4,
        concentration: 'EDP'
      },
      {
        id: 'p_floral',
        primary_family: 'Floral',
        top_notes: 'Rose, Peony',
        heart_notes: 'Jasmine',
        base_notes: 'White Musk',
        heat_suitability: 5,
        concentration: 'EDT'
      }
    ];

    const dna = computeScentDna(bottles, perfumes);
    assert.ok(dna.familyBreakdown.length > 0);
    assert.strictEqual(dna.dominantFamily, 'Woody');
    assert.ok(dna.topNotes.some(n => n.note.includes('Bergamot') || n.note.includes('Cedarwood')));
    assert.ok(dna.climateSuitability.tropicalOutdoorPct >= 50);
    assert.ok(dna.editorialPersonaId.length > 20);
  });

  it('Phase 4: Scent Diary computes wear stats, compliments, and active streak', () => {
    const wears: WearLogState[] = [
      { id: 'w1', bottle_id: 'b1', perfume_id: 'prf_001', worn_at: '2026-10-18T10:00:00Z', compliments: 2 },
      { id: 'w2', bottle_id: 'b1', perfume_id: 'prf_001', worn_at: '2026-10-17T11:00:00Z', compliments: 1 },
      { id: 'w3', bottle_id: 'b2', perfume_id: 'prf_003', worn_at: '2026-10-16T09:00:00Z', compliments: 0 },
      { id: 'w4_deleted', bottle_id: 'b1', perfume_id: 'prf_001', worn_at: '2026-10-15T09:00:00Z', deleted_at: '2026-10-15T10:00:00Z' }
    ];

    const stories: StoryState[] = [
      { id: 's1', perfume_id: 'prf_001', body: 'Story 1 with more than 20 characters', status: 'published' }
    ];

    const stats = computeDiaryStats(wears, stories);
    assert.strictEqual(stats.totalWears, 3);
    assert.strictEqual(stats.totalCompliments, 3);
    assert.strictEqual(stats.mostWornPerfumeId, 'prf_001');
    assert.strictEqual(stats.mostWornCount, 2);
    assert.strictEqual(stats.totalStories, 1);
    assert.strictEqual(stats.activeStreakDays, 3); // 18, 17, 16 consecutive
  });

  it('Phase 4: computeReviewSummary aggregates ratings, dominant longevity, and repurchase intent', () => {
    const testReviews: ReviewState[] = [
      {
        id: 'r1',
        user_id: 'u1',
        user_name: 'User 1',
        perfume_id: 'prf_001',
        rating: 5,
        longevity_band: '6–8 jam',
        sillage: 'moderate',
        value_for_money: 5,
        repurchase_intent: 'yes_definitely',
        format_used: 'full_bottle',
        title: 'Review 1',
        review_text: 'Review text details',
        status: 'approved',
        created_at: '2026-10-18T00:00:00Z',
        helpful_count: 5
      },
      {
        id: 'r2',
        user_id: 'u2',
        user_name: 'User 2',
        perfume_id: 'prf_001',
        rating: 4,
        longevity_band: '6–8 jam',
        sillage: 'strong',
        value_for_money: 4,
        repurchase_intent: 'maybe',
        format_used: 'decant',
        title: 'Review 2',
        review_text: 'Review text details 2',
        status: 'approved',
        created_at: '2026-10-18T00:00:00Z',
        helpful_count: 2
      },
      {
        id: 'r3',
        user_id: 'u3',
        user_name: 'User 3',
        perfume_id: 'prf_001',
        rating: 1,
        longevity_band: '< 3 jam',
        sillage: 'intimate',
        value_for_money: 1,
        repurchase_intent: 'never',
        format_used: 'decant',
        title: 'Pending review',
        review_text: 'Pending review text',
        status: 'pending_moderation', // Excluded from approved aggregates
        created_at: '2026-10-18T00:00:00Z',
        helpful_count: 0
      }
    ];

    const summary = computeReviewSummary(testReviews);
    assert.strictEqual(summary.totalReviews, 2); // Excludes pending
    assert.strictEqual(summary.averageRating, 4.5);
    assert.strictEqual(summary.longevityDominantBand, '6–8 jam');
    assert.strictEqual(summary.repurchaseYesRatePct, 50); // 1 out of 2 approved
    assert.strictEqual(summary.ratingCounts[5], 1);
    assert.strictEqual(summary.ratingCounts[4], 1);
  });

  describe('Scent DNA Visualisation Data Invariants & Error Guards', () => {
    it('rejects fixture with negative family share and returns false to trigger error state', () => {
      // Deliberately broken fixture with a negative share
      const brokenFixture = [
        { family: 'Woody', percentage: -10 },
        { family: 'Floral', percentage: 110 }
      ];
      assert.strictEqual(validateScentDnaData(brokenFixture), false);
    });

    it('rejects fixture where family shares do not sum to exactly 100%', () => {
      // Sums to 90%
      const underSumFixture = [
        { family: 'Woody', percentage: 40 },
        { family: 'Floral', percentage: 30 },
        { family: 'Fresh', percentage: 20 }
      ];
      assert.strictEqual(validateScentDnaData(underSumFixture), false);

      // Sums to 105%
      const overSumFixture = [
        { family: 'Woody', percentage: 50 },
        { family: 'Floral', percentage: 30 },
        { family: 'Fresh', percentage: 25 }
      ];
      assert.strictEqual(validateScentDnaData(overSumFixture), false);
    });

    it('accepts valid fixture where shares are non-negative and sum to exactly 100%', () => {
      const validFixture = [
        { family: 'Woody', percentage: 52 },
        { family: 'Floral', percentage: 28 },
        { family: 'Fresh', percentage: 20 }
      ];
      assert.strictEqual(validateScentDnaData(validFixture), true);
    });

    it('rejects empty or malformed breakdown arrays', () => {
      assert.strictEqual(validateScentDnaData([]), false);
      assert.strictEqual(validateScentDnaData(null as any), false);
      assert.strictEqual(validateScentDnaData([{ family: 'Woody', percentage: NaN }]), false);
    });

    it('accurately counts distinct active profile perfumes for the < 3 threshold rule', () => {
      const emptyBottles: BottleState[] = [];
      assert.strictEqual(countProfilePerfumes(emptyBottles), 0);

      const twoBottles: BottleState[] = [
        { id: 'b1', perfume_id: 'p1', status: 'in_use', size_ml: 50, remaining_ml: 30 },
        { id: 'b2', perfume_id: 'p2', status: 'sealed', size_ml: 50, remaining_ml: 50 }
      ];
      assert.strictEqual(countProfilePerfumes(twoBottles), 2);
      assert.strictEqual(countProfilePerfumes(twoBottles) < 3, true);

      // Two bottles of the same perfume should count as 1 distinct perfume
      const duplicatePerfumeBottles: BottleState[] = [
        { id: 'b1', perfume_id: 'p1', status: 'in_use', size_ml: 50, remaining_ml: 30 },
        { id: 'b2', perfume_id: 'p1', status: 'sealed', size_ml: 50, remaining_ml: 50 }
      ];
      assert.strictEqual(countProfilePerfumes(duplicatePerfumeBottles), 1);

      // Three distinct perfumes reaches the threshold
      const threeBottles: BottleState[] = [
        { id: 'b1', perfume_id: 'p1', status: 'in_use', size_ml: 50, remaining_ml: 30 },
        { id: 'b2', perfume_id: 'p2', status: 'in_use', size_ml: 50, remaining_ml: 40 },
        { id: 'b3', perfume_id: 'p3', status: 'finished', size_ml: 50, remaining_ml: 0 }
      ];
      assert.strictEqual(countProfilePerfumes(threeBottles), 3);
      assert.strictEqual(countProfilePerfumes(threeBottles) >= 3, true);

      // Deleted bottles are ignored
      const withDeleted: BottleState[] = [
        { id: 'b1', perfume_id: 'p1', status: 'in_use', size_ml: 50, remaining_ml: 30 },
        { id: 'b2', perfume_id: 'p2', status: 'in_use', size_ml: 50, remaining_ml: 40 },
        { id: 'b3', perfume_id: 'p3', status: 'in_use', size_ml: 50, remaining_ml: 50, deleted_at: '2026-10-20T00:00:00Z' }
      ];
      assert.strictEqual(countProfilePerfumes(withDeleted), 2);
    });

    it('extracts ranked dominant notes across active bottles up to limit 8', () => {
      const mockBottles: BottleState[] = [
        { id: 'b1', perfume_id: 'p1', status: 'in_use', size_ml: 50, remaining_ml: 30 },
        { id: 'b2', perfume_id: 'p2', status: 'in_use', size_ml: 50, remaining_ml: 40 }
      ];
      const mockPerfumes = [
        { id: 'p1', top_notes: 'Bergamot, Mandarin', heart_notes: 'Rose, Jasmine', base_notes: 'Cedarwood, Amber' },
        { id: 'p2', top_notes: 'Bergamot, Pink Pepper', heart_notes: 'Rose, Lavender', base_notes: 'Cedarwood, Vanilla, Musk' }
      ];
      const notes = extractRankedTopNotes(mockBottles, mockPerfumes, 8);
      // Bergamot, Rose, Cedarwood appeared in both, so should rank at top
      assert.strictEqual(notes.includes('Bergamot'), true);
      assert.strictEqual(notes.includes('Rose'), true);
      assert.strictEqual(notes.includes('Cedarwood'), true);
      assert.strictEqual(notes.length <= 8, true);
    });
  });

  describe('Sprint 3: Honest Data Labelling, Review Threshold Gating & Affiliate Disclosures', () => {
    it('gates review aggregates when fewer than 5 real published reviews exist', () => {
      // 3 approved reviews for prf_001
      const reviewsUnderThreshold = [
        { id: 'r1', user_id: 'u1', user_name: 'U1', perfume_id: 'prf_001', rating: 5, status: 'approved' },
        { id: 'r2', user_id: 'u2', user_name: 'U2', perfume_id: 'prf_001', rating: 4.5, status: 'approved' },
        { id: 'r3', user_id: 'u3', user_name: 'U3', perfume_id: 'prf_001', rating: 4, status: 'approved' },
        { id: 'r4', user_id: 'u4', user_name: 'U4', perfume_id: 'prf_001', rating: 2, status: 'pending_moderation' }
      ] as unknown as ReviewState[];

      const agg = computeCommunityReviewAggregate(reviewsUnderThreshold, 'prf_001', 5);
      assert.strictEqual(agg.hasEnoughReviews, false);
      assert.strictEqual(agg.totalPublishedReviews, 3);
      assert.strictEqual(agg.averageRating, undefined);
      assert.strictEqual(agg.repurchaseYesRatePct, undefined);
      assert.strictEqual(agg.longevityDominantBand, undefined);
      assert.strictEqual(agg.sillageDominant, undefined);
    });

    it('computes community review aggregate only when 5 or more real published reviews exist', () => {
      const reviewsAtThreshold = [
        { id: 'r1', user_id: 'u1', user_name: 'U1', perfume_id: 'prf_001', rating: 5, status: 'approved', repurchase_intent: 'yes_definitely', longevity_band: '6–8 jam', sillage: 'moderate' },
        { id: 'r2', user_id: 'u2', user_name: 'U2', perfume_id: 'prf_001', rating: 5, status: 'approved', repurchase_intent: 'yes_definitely', longevity_band: '6–8 jam', sillage: 'moderate' },
        { id: 'r3', user_id: 'u3', user_name: 'U3', perfume_id: 'prf_001', rating: 4, status: 'approved', repurchase_intent: 'maybe', longevity_band: '6–8 jam', sillage: 'moderate' },
        { id: 'r4', user_id: 'u4', user_name: 'U4', perfume_id: 'prf_001', rating: 4, status: 'approved', repurchase_intent: 'maybe', longevity_band: '8–12 jam', sillage: 'strong' },
        { id: 'r5', user_id: 'u5', user_name: 'U5', perfume_id: 'prf_001', rating: 4.5, status: 'approved', repurchase_intent: 'yes_definitely', longevity_band: '6–8 jam', sillage: 'moderate' },
        { id: 'r6', user_id: 'u6', user_name: 'U6', perfume_id: 'prf_002', rating: 1, status: 'approved' } // Different perfume
      ] as unknown as ReviewState[];

      const agg = computeCommunityReviewAggregate(reviewsAtThreshold, 'prf_001', 5);
      assert.strictEqual(agg.hasEnoughReviews, true);
      assert.strictEqual(agg.totalPublishedReviews, 5);
      assert.strictEqual(agg.averageRating, 4.5);
      assert.strictEqual(agg.longevityDominantBand, '6–8 jam');
      assert.strictEqual(agg.sillageDominant, 'moderate');
      assert.strictEqual(agg.repurchaseYesRatePct, 60); // 3 of 5
    });

    it('verifies exact affiliate disclosure strings for EN and ID', () => {
      assert.strictEqual(
        AFFILIATE_DISCLOSURE.en,
        'We may earn a commission if you buy through these links. It never changes your match score.'
      );
      assert.strictEqual(
        AFFILIATE_DISCLOSURE.id,
        'Kami bisa menerima komisi jika kamu membeli lewat tautan ini. Komisi tidak memengaruhi skor kecocokanmu.'
      );
    });

    it('largestRemainderRound guarantees non-negative shares and sums to exactly 100%', () => {
      const items = [
        { family: 'Floral', weight: 63 },
        { family: 'Ambery', weight: 29 },
        { family: 'Gourmand', weight: 14 }
      ];
      const result = largestRemainderRound(items);
      const totalPct = result.reduce((s, r) => s + r.percentage, 0);
      assert.strictEqual(totalPct, 100);
      for (const r of result) {
        assert.strictEqual(r.percentage >= 0, true);
      }
    });
  });
});
