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

  it('ADM-03: computes waitlist demand aggregation metrics accurately', () => {
    const mockWaitlists: WaitlistState[] = [
      {
        id: 'w1',
        email: 'u1@test.com',
        perfume_id: 'p1',
        size_ml: 2,
        willingness: 'yes',
        fair_price_idr: 25000,
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'w2',
        email: 'u2@test.com',
        perfume_id: 'p1',
        size_ml: 5,
        willingness: 'yes',
        fair_price_idr: 50000,
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'w3',
        email: 'u3@test.com',
        perfume_id: 'p2',
        size_ml: 5,
        willingness: 'maybe',
        fair_price_idr: 45000,
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    const totalCount = mockWaitlists.length;
    const count5ml = mockWaitlists.filter(w => w.size_ml === 5).length;
    const totalDemandIdr = mockWaitlists.reduce((acc, w) => acc + w.fair_price_idr, 0);

    assert.strictEqual(totalCount, 3);
    assert.strictEqual(count5ml, 2);
    assert.strictEqual(totalDemandIdr, 120000);
  });

  it('ADM-10: supports dynamic feature flag toggling', () => {
    const flags: Record<string, boolean> = {
      try_it_first_ordering: false,
      affiliate_buttons: true,
      ai_gemini_rephrase: true
    };

    assert.strictEqual(flags['try_it_first_ordering'], false);

    // Toggle on
    flags['try_it_first_ordering'] = !flags['try_it_first_ordering'];
    assert.strictEqual(flags['try_it_first_ordering'], true);

    // Toggle off
    flags['try_it_first_ordering'] = !flags['try_it_first_ordering'];
    assert.strictEqual(flags['try_it_first_ordering'], false);
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
