/**
 * Sprint 2 — /go redirect logic (pure, no firebase imports).
 *
 * This module is the whole decision surface of the /go Cloud Function.
 * It is unit-tested directly (see goLogic.test.ts); functions/src/index.ts
 * is only a thin wrapper that wires it to Firestore and HTTP.
 *
 * Guarantees:
 * - Platform must be shopee or tokopedia; anything else is an honest 400.
 *   There is no silent default platform.
 * - `src` must be on the allowlist; unknown sources are rejected (400),
 *   never logged as if legitimate.
 * - Unknown perfume ids AND drafts are both an honest 404. Drafts have
 *   no affiliate links, so they are treated exactly like unknown ids.
 * - The redirect target comes from `perfume_offers` offer data and must
 *   pass the domain allowlist. If there is no offer (or the offer URL
 *   fails validation), the fallback is the official marketplace SEARCH
 *   page with the perfume NAME as keyword (plan §5.6 default) — never a
 *   search URL with the id as keyword, and the row logs offer_missing.
 * - One `affiliate_clicks` row per redirect, server timestamp, NO PII:
 *   the row contains no user id, no email, no IP, no user agent.
 * - Until the founder's affiliate registration completes (D-08), the
 *   redirect still goes to the correct product page with disclosure and
 *   logging running — without claiming any commission that does not exist.
 *   Affiliate links are data (offer per perfume per platform), never
 *   hard-coded in seed or in code.
 */
export type Platform = 'shopee' | 'tokopedia';

export interface PerfumeRecord {
  id: string;
  name: string;
  data_status: string;
}

export interface OfferRecord {
  perfume_id: string;
  platform: string;
  offer_url: string;
}

export interface AffiliateClickRow {
  click_id: string;
  perfume_id: string;
  src: string;
  platform: Platform;
  destination_url: string;
  offer_missing: boolean;
  created_at: string;
}

export interface GoDataStore {
  getPerfume(id: string): Promise<PerfumeRecord | null>;
  getOffer(perfumeId: string, platform: Platform): Promise<OfferRecord | null>;
  writeClick(row: AffiliateClickRow): Promise<void>;
}

/** Every `src` value the client actually sends, plus the legacy default. */
export const ALLOWED_SRCS = [
  'compare',
  'product_detail',
  'repurchase_sheet',
  'scent_finder_hero',
  'sticky_mobile',
  'catalog_card',
] as const;

export const ALLOWED_OFFER_DOMAINS = ['shopee.co.id', 'tokopedia.com', 'www.tokopedia.com', 'shope.ee'];

export function marketplaceSearchUrl(platform: Platform, perfumeName: string): string {
  if (platform === 'shopee') {
    return `https://shopee.co.id/search?keyword=${encodeURIComponent(perfumeName)}`;
  }
  return `https://www.tokopedia.com/search?q=${encodeURIComponent(perfumeName)}`;
}

export function isAllowedOfferUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_OFFER_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export interface GoOutcome {
  status: 302 | 400 | 404;
  location?: string;
  body?: string;
  clickRow?: AffiliateClickRow;
}

export function newClickId(nowMs: number, randomPart: string): string {
  return `clk_${nowMs.toString(36)}${randomPart}`;
}

export async function resolveGo(
  params: { perfumeId: string; platform: string | null | undefined; src: string | null | undefined },
  store: GoDataStore,
  now: () => Date = () => new Date()
): Promise<GoOutcome> {
  const { perfumeId, platform, src } = params;
  if (platform !== 'shopee' && platform !== 'tokopedia') {
    return { status: 400, body: 'Unknown or missing platform. Expected shopee or tokopedia.' };
  }
  if (!src || !(ALLOWED_SRCS as readonly string[]).includes(src)) {
    return { status: 400, body: 'Unknown or missing src.' };
  }
  const perfume = await store.getPerfume(perfumeId);
  if (!perfume || perfume.data_status !== 'published') {
    return { status: 404, body: 'Unknown perfume.' };
  }
  const offer = await store.getOffer(perfumeId, platform);
  const offerValid = offer !== null && isAllowedOfferUrl(offer.offer_url);
  const destination = offerValid ? offer.offer_url : marketplaceSearchUrl(platform, perfume.name);
  const timestamp = now();
  const clickRow: AffiliateClickRow = {
    click_id: newClickId(timestamp.getTime(), Math.random().toString(36).substring(2, 6)),
    perfume_id: perfumeId,
    src,
    platform,
    destination_url: destination,
    offer_missing: !offerValid,
    created_at: timestamp.toISOString(),
  };
  // Logging failure must not break the user's redirect, but it is never
  // silent: the wrapper logs it to the Function logs (server-side).
  await store.writeClick(clickRow);
  return { status: 302, location: destination, clickRow };
}

/**
 * Basic per-IP token bucket (in-memory, per Function instance). This is
 * abuse friction, not production-grade rate limiting — a production
 * deployment that needs strict limits should use Cloud Armor or Redis.
 */
export class InMemoryRateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefillMs: number }>();

  constructor(
    private maxTokens = 30,
    private windowMs = 60_000
  ) {}

  allow(key: string, nowMs = Date.now()): boolean {
    const bucket = this.buckets.get(key);
    if (!bucket) {
      this.buckets.set(key, { tokens: this.maxTokens - 1, lastRefillMs: nowMs });
      return true;
    }
    if (nowMs - bucket.lastRefillMs >= this.windowMs) {
      bucket.tokens = this.maxTokens;
      bucket.lastRefillMs = nowMs;
    }
    if (bucket.tokens <= 0) return false;
    bucket.tokens -= 1;
    return true;
  }
}
