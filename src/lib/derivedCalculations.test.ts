import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  calculateRemainingPercentage, 
  isLowBottle, 
  computeCollectionSummary,
  computeScentDna,
  computeDiaryStats,
  computeReviewSummary,
  BottleState,
  WearLogState,
  StoryState,
  ReviewState
} from './derivedCalculations.ts';

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
      { id: 'w1', bottle_id: 'b1', perfume_id: 'p1', worn_on: '2026-10-15' },
      { id: 'w2', bottle_id: 'b1', perfume_id: 'p1', worn_on: '2026-10-16' },
      { id: 'w3', bottle_id: 'b2', perfume_id: 'p2', worn_on: '2026-10-17' }
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
    const bottles: BottleState[] = [
      { id: 'b1', perfume_id: 'p_woody', status: 'in_use', size_ml: 50, remaining_ml: 40, times_worn: 10, is_favorite: true },
      { id: 'b2', perfume_id: 'p_floral', status: 'in_use', size_ml: 50, remaining_ml: 30, times_worn: 2, is_favorite: false }
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
      { id: 'w1', bottle_id: 'b1', perfume_id: 'prf_001', worn_on: '2026-10-18T10:00:00Z', compliments: 2 },
      { id: 'w2', bottle_id: 'b1', perfume_id: 'prf_001', worn_on: '2026-10-17T11:00:00Z', compliments: 1 },
      { id: 'w3', bottle_id: 'b2', perfume_id: 'prf_003', worn_on: '2026-10-16T09:00:00Z', compliments: 0 },
      { id: 'w4_deleted', bottle_id: 'b1', perfume_id: 'prf_001', worn_on: '2026-10-15T09:00:00Z', deleted_at: '2026-10-15T10:00:00Z' }
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
});
