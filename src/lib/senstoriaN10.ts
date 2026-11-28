/**
 * Fase N10 — Fitur Senstoria-only berpola Nike: pure helpers.
 *
 * - Scent DNA: dominant values per dimension, derived ONLY from the user's
 *   own bottles + seed data. Climate / Occasion / Budget have NO bottle
 *   data, so they are never invented here — callers omit those rows.
 * - Finder J-04: a top-score tie is detected from the DISPLAYED ranked
 *   list and must be explained explicitly as a tie (never silently
 *   ordered). Scoring itself is untouched (scentScoring.ts).
 */

export interface DnaBottleInput {
  perfume_id: string;
  status: string;
  deleted_at?: string | null;
}

export interface DnaPerfumeInput {
  id: string;
  primary_family?: string;
  longevity_expected_band?: string;
  gender_label?: string;
}

export type DnaLongevityBand = '<2h' | '2-4h' | '4-6h' | '6-8h' | '8h+';
export type DnaGenderLabel = 'feminine' | 'masculine' | 'unisex';

export interface DnaDimensionDominants {
  /** Most common longevity band among owned bottles (null = no data). */
  longevity: DnaLongevityBand | null;
  /** Most common gender label among owned bottles (null = no data). */
  gender: DnaGenderLabel | null;
}

const ACTIVE_BOTTLE_STATUSES = new Set(['in_use', 'sealed', 'finished']);

export function isActiveDnaBottle(bottle: DnaBottleInput): boolean {
  return !bottle.deleted_at && ACTIVE_BOTTLE_STATUSES.has(bottle.status);
}

/**
 * Most common non-empty value. Deterministic tie-break: highest count,
 * then alphabetical order — the same input always yields the same winner,
 * and a tie never silently depends on bottle order.
 */
export function mostCommonValue<T extends string>(values: (T | null | undefined)[]): { value: T; count: number } | null {
  const counts = new Map<T, number>();
  for (const v of values) {
    if (v === null || v === undefined || v === '') continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  let best: { value: T; count: number } | null = null;
  for (const [value, count] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (best === null || count > best.count) best = { value, count };
  }
  return best;
}

const LONGEVITY_BANDS: ReadonlySet<string> = new Set(['<2h', '2-4h', '4-6h', '6-8h', '8h+']);
const GENDER_LABELS: ReadonlySet<string> = new Set(['feminine', 'masculine', 'unisex']);

/**
 * Dominant Longevity band + Gender label among the user's ACTIVE bottles.
 * 'unknown' bands/labels are skipped (an empty field stays empty — never
 * guessed). Climate / Occasion / Budget are intentionally absent: bottles
 * carry no data for them.
 */
export function computeDnaDimensionDominants(
  bottles: DnaBottleInput[],
  perfumes: DnaPerfumeInput[]
): DnaDimensionDominants {
  const active = bottles.filter(isActiveDnaBottle);
  const byId = new Map(perfumes.map(p => [p.id, p]));
  const bands: (DnaLongevityBand | null)[] = [];
  const genders: (DnaGenderLabel | null)[] = [];
  for (const b of active) {
    const p = byId.get(b.perfume_id);
    if (!p) continue;
    bands.push(
      p.longevity_expected_band && LONGEVITY_BANDS.has(p.longevity_expected_band)
        ? (p.longevity_expected_band as DnaLongevityBand)
        : null
    );
    genders.push(
      p.gender_label && GENDER_LABELS.has(p.gender_label)
        ? (p.gender_label as DnaGenderLabel)
        : null
    );
  }
  const longevity = mostCommonValue(bands);
  const gender = mostCommonValue(genders);
  return {
    longevity: longevity ? longevity.value : null,
    gender: gender ? gender.value : null,
  };
}

export interface FamilyShare {
  family: string;
  percentage: number;
}

/**
 * Dominant family from a family-breakdown list (highest share; ties keep
 * the list's own order, which is the fixed family order from
 * computeScentDna — never bottle order).
 */
export function dominantFamilyShare(breakdown: FamilyShare[]): FamilyShare | null {
  if (!breakdown || breakdown.length === 0) return null;
  let best = breakdown[0];
  for (const item of breakdown.slice(1)) {
    if (item.percentage > best.percentage) best = item;
  }
  return best.percentage > 0 ? best : null;
}

export interface RankedWithScore {
  matchScore: number;
}

/**
 * J-04: detect a tie at the top of the DISPLAYED ranked list. Returns the
 * two tied entries and their shared score, or null when the top score is
 * unique (or fewer than two results). The caller renders the tie as an
 * explicit tie — equal scores must never pretend a winner exists.
 */
export function findTopTie<T extends RankedWithScore>(ranked: T[]): { score: number; first: T; second: T } | null {
  if (!ranked || ranked.length < 2) return null;
  const [first, second] = ranked;
  if (first.matchScore !== second.matchScore) return null;
  return { score: first.matchScore, first, second };
}
