import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  resolveGo,
  marketplaceSearchUrl,
  isAllowedOfferUrl,
  InMemoryRateLimiter,
  type GoDataStore,
  type PerfumeRecord,
  type OfferRecord,
  type AffiliateClickRow,
} from './goLogic.js';

function fakeStore(): GoDataStore & { clicks: AffiliateClickRow[] } {
  const perfumes: Record<string, PerfumeRecord> = {
    prf_001: { id: 'prf_001', name: 'HMNS Orgasm', data_status: 'published' },
    prf_002: { id: 'prf_002', name: 'Oullu Arcanum', data_status: 'published' },
    prf_009: { id: 'prf_009', name: 'Draft Perfume', data_status: 'draft' },
  };
  const offers: Record<string, OfferRecord> = {
    'prf_001:shopee': {
      perfume_id: 'prf_001',
      platform: 'shopee',
      offer_url: 'https://shopee.co.id/hmns-orgasm-i.123.456',
    },
    'prf_002:tokopedia': {
      perfume_id: 'prf_002',
      platform: 'tokopedia',
      offer_url: 'https://evil.example.com/phish',
    },
  };
  const clicks: AffiliateClickRow[] = [];
  return {
    clicks,
    async getPerfume(id) {
      return perfumes[id] ?? null;
    },
    async getOffer(perfumeId, platform) {
      return offers[`${perfumeId}:${platform}`] ?? null;
    },
    async writeClick(row) {
      clicks.push(row);
    },
  };
}

const FIXED_NOW = () => new Date('2026-10-30T06:00:00.000Z');

describe('Sprint 2: /go redirect logic', () => {
  it('valid offer redirects 302 to the offer URL and writes exactly one PII-free row', async () => {
    const store = fakeStore();
    const out = await resolveGo({ perfumeId: 'prf_001', platform: 'shopee', src: 'repurchase_sheet' }, store, FIXED_NOW);
    assert.strictEqual(out.status, 302);
    assert.strictEqual(out.location, 'https://shopee.co.id/hmns-orgasm-i.123.456');
    assert.strictEqual(store.clicks.length, 1);
    const row = store.clicks[0];
    assert.strictEqual(row.perfume_id, 'prf_001');
    assert.strictEqual(row.platform, 'shopee');
    assert.strictEqual(row.src, 'repurchase_sheet');
    assert.strictEqual(row.destination_url, 'https://shopee.co.id/hmns-orgasm-i.123.456');
    assert.strictEqual(row.offer_missing, false);
    assert.strictEqual(row.created_at, '2026-10-30T06:00:00.000Z');
    // No PII: the row must not contain any user-identifying key.
    const keys = Object.keys(row);
    assert.ok(!keys.includes('user_id'));
    assert.ok(!keys.includes('email'));
    assert.ok(!keys.includes('ip'));
    assert.ok(!keys.includes('user_agent'));
    assert.deepStrictEqual(
      keys.sort(),
      ['click_id', 'created_at', 'destination_url', 'offer_missing', 'perfume_id', 'platform', 'src']
    );
  });

  it('no offer falls back to the marketplace search page with the perfume NAME and logs offer_missing', async () => {
    const store = fakeStore();
    const out = await resolveGo({ perfumeId: 'prf_001', platform: 'tokopedia', src: 'catalog_card' }, store, FIXED_NOW);
    assert.strictEqual(out.status, 302);
    assert.strictEqual(out.location, marketplaceSearchUrl('tokopedia', 'HMNS Orgasm'));
    assert.ok(out.location?.includes('HMNS%20Orgasm'));
    assert.ok(!out.location?.includes('prf_001'));
    assert.strictEqual(store.clicks.length, 1);
    assert.strictEqual(store.clicks[0].offer_missing, true);
  });

  it('an offer URL outside the domain allowlist falls back to search (never redirects off-allowlist)', async () => {
    const store = fakeStore();
    const out = await resolveGo({ perfumeId: 'prf_002', platform: 'tokopedia', src: 'product_detail' }, store, FIXED_NOW);
    assert.strictEqual(out.status, 302);
    assert.ok(out.location?.startsWith('https://www.tokopedia.com/search'));
    assert.strictEqual(store.clicks[0].offer_missing, true);
  });

  it('unknown perfume is an honest 404 with no click row', async () => {
    const store = fakeStore();
    const out = await resolveGo({ perfumeId: 'prf_999', platform: 'shopee', src: 'compare' }, store, FIXED_NOW);
    assert.strictEqual(out.status, 404);
    assert.strictEqual(store.clicks.length, 0);
  });

  it('draft perfume is treated exactly like unknown (404, no row, no affiliate link)', async () => {
    const store = fakeStore();
    const out = await resolveGo({ perfumeId: 'prf_009', platform: 'shopee', src: 'compare' }, store, FIXED_NOW);
    assert.strictEqual(out.status, 404);
    assert.strictEqual(store.clicks.length, 0);
  });

  it('unknown src is rejected (400) with no click row', async () => {
    const store = fakeStore();
    const out = await resolveGo({ perfumeId: 'prf_001', platform: 'shopee', src: 'hacker_src' }, store, FIXED_NOW);
    assert.strictEqual(out.status, 400);
    assert.strictEqual(store.clicks.length, 0);
  });

  it('missing or invalid platform is rejected (400) with no silent default', async () => {
    const store = fakeStore();
    const missing = await resolveGo({ perfumeId: 'prf_001', platform: null, src: 'compare' }, store, FIXED_NOW);
    assert.strictEqual(missing.status, 400);
    const invalid = await resolveGo({ perfumeId: 'prf_001', platform: 'lazada', src: 'compare' }, store, FIXED_NOW);
    assert.strictEqual(invalid.status, 400);
    assert.strictEqual(store.clicks.length, 0);
  });

  it('offer URL validation only allows https on the allowlist', () => {
    assert.strictEqual(isAllowedOfferUrl('https://shopee.co.id/x'), true);
    assert.strictEqual(isAllowedOfferUrl('https://www.tokopedia.com/x'), true);
    assert.strictEqual(isAllowedOfferUrl('https://shope.ee/x'), true);
    assert.strictEqual(isAllowedOfferUrl('http://shopee.co.id/x'), false);
    assert.strictEqual(isAllowedOfferUrl('https://evil.example.com/x'), false);
    assert.strictEqual(isAllowedOfferUrl('not a url'), false);
  });

  it('rate limiter allows 30 per minute per IP, then denies until refill', () => {
    const limiter = new InMemoryRateLimiter(30, 60_000);
    for (let i = 0; i < 30; i++) assert.strictEqual(limiter.allow('1.2.3.4', 1000), true);
    assert.strictEqual(limiter.allow('1.2.3.4', 1000), false);
    assert.strictEqual(limiter.allow('5.6.7.8', 1000), true);
    assert.strictEqual(limiter.allow('1.2.3.4', 1000 + 60_000), true);
  });
});
