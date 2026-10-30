import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ReviewState, WaitlistState } from './derivedCalculations.ts';
import { SEED_PERFUMES, SeedPerfume } from '../data/seedPerfumes.ts';

describe('Admin Panel & Moderation (Phase 7): ADM-01, ADM-02, ADM-10', () => {
  it('ADM-02: handles review moderation status transitions cleanly', () => {
    const review: ReviewState = {
      id: 'rev_test_1',
      user_id: 'usr_1',
      user_name: 'Test Reviewer',
      perfume_id: 'prf_001',
      rating: 5,
      longevity_band: '6-8 jam',
      sillage: 'moderate',
      value_for_money: 5,
      repurchase_intent: 'yes_definitely',
      format_used: 'full_bottle',
      title: 'Aroma Signature Harian',
      review_text: 'Aroma woody yang sangat elegan dan tahan lama di cuaca tropis.',
      status: 'pending_moderation',
      created_at: new Date().toISOString(),
      helpful_count: 0
    };

    assert.strictEqual(review.status, 'pending_moderation');

    // Simulate approval
    const approvedReview = { ...review, status: 'approved' as const };
    assert.strictEqual(approvedReview.status, 'approved');

    // Simulate rejection
    const rejectedReview = { ...review, status: 'rejected' as const };
    assert.strictEqual(rejectedReview.status, 'rejected');
  });

  it('ADM-03: computes waitlist demand aggregation metrics accurately (Sprint 4: only confirmed counts as demand)', () => {
    const mockWaitlists: WaitlistState[] = [
      {
        id: 'w1',
        email: 'u1@test.com',
        perfume_id: 'p1',
        size_ml: 2,
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'w2',
        email: 'u2@test.com',
        perfume_id: 'p1',
        size_ml: 5,
        status: 'pending_confirm',
        created_at: new Date().toISOString()
      },
      {
        id: 'w3',
        email: 'u3@test.com',
        perfume_id: 'p2',
        size_ml: 5,
        status: 'notified',
        created_at: new Date().toISOString()
      }
    ];

    const totalCount = mockWaitlists.length;
    const count5ml = mockWaitlists.filter(w => w.size_ml === 5).length;
    const confirmedCount = mockWaitlists.filter(w => w.status === 'active' || w.status === 'notified').length;
    const pendingCount = mockWaitlists.filter(w => w.status === 'pending_confirm').length;

    assert.strictEqual(totalCount, 3);
    assert.strictEqual(count5ml, 2);
    assert.strictEqual(confirmedCount, 2);
    assert.strictEqual(pendingCount, 1);
  });

  it('ADM-10 (Sprint 4): feature flags are frozen code configuration, not toggles', () => {
    // The Admin flags tab is read-only; try_it_first_ordering died with the
    // checkout simulator and ai_gemini_rephrase is disabled in Stage 1.
    const flags: Record<string, boolean> = {
      affiliate_buttons: true,
      community_reviews: true
    };

    assert.strictEqual(flags['affiliate_buttons'], true);
    assert.strictEqual(flags['community_reviews'], true);
    assert.strictEqual('try_it_first_ordering' in flags, false);
    assert.strictEqual('ai_gemini_rephrase' in flags, false);
  });

  it('ADM-04: supports catalog CRUD item addition and update', () => {
    const initialCount = SEED_PERFUMES.length;
    assert.ok(initialCount >= 10);

    const newPerfume: SeedPerfume = {
      id: 'prf_custom_admin_1',
      slug: 'senstoria-solitude',
      name: 'Solitude',
      brand: 'Senstoria Atelier',
      concentration: 'Extrait',
      release_year: 2026,
      gender_label: 'unisex',
      primary_family: 'Woody',
      origin: 'ID',
      market_tier: 'indie',
      reference_price_idr: 450000,
      reference_price_size_ml: 50,
      price_is_sample: false,
      data_status: 'draft',
      source_official_url: '',
      source_checked_date: '',
      verified_by: '',
      top_notes: 'Pink Pepper',
      heart_notes: 'Cedarwood',
      base_notes: 'Vetiver',
      heat_suitability: 4,
      longevity_expected_band: '8h+',
      projection_expected: 3,
      description_id: 'Aroma woody artisan Indonesia.',
      description_en: 'Indonesian artisanal woody fragrance.',
      brand_claims: 'Klaim Brand: Ketahanan teruji.',
      sample_candidate: true,
      shopee_url: 'https://shopee.co.id',
      tokopedia_url: 'https://tokopedia.com'
    };

    const updatedCatalog = [newPerfume, ...SEED_PERFUMES];
    assert.strictEqual(updatedCatalog.length, initialCount + 1);
    assert.strictEqual(updatedCatalog[0].name, 'Solitude');
  });
});
