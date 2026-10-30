export interface BottleState {
  id: string;
  user_id?: string;
  perfume_id: string;
  status: 'sealed' | 'in_use' | 'finished';
  format?: 'full' | 'decant' | 'travel' | 'vial';
  size_ml: number;
  remaining_ml: number;
  ml_per_wear?: number;
  price_idr?: number;
  // Sprint 2: NO stored wear counter. Wear counts are derived ONLY from
  // wear_logs (logs win, BR-01). A `times_worn` field here would be a
  // second source of truth and must never be reintroduced.
  is_favorite?: boolean;
  deleted_at?: string | null;
}

export interface WearLogState {
  id: string;
  user_id?: string;
  bottle_id: string;
  perfume_id: string;
  worn_at: string; // ISO date string YYYY-MM-DD or ISO timestamp (canonical §5.2 name)
  sprays?: number; // canonical §5.2 name; default 3-4 sprays (~0.4 - 0.5ml)
  ml_used?: number; // canonical §5.2 name
  compliments?: number; // count of compliments received (e.g. 1)
  longevity_hours?: number; // perceived longevity e.g. 6.5
  mood?: string; // 'Percaya Diri' | 'Santai' | 'Romantis' | 'Fokus' | 'Segar' | 'Mewah'
  occasion?: string; // 'Kantor / Kerja' | 'Kencan' | 'Kasual / Nongkrong' | 'Pesta / Formal' | 'Olahraga'
  weather?: string; // 'Panas Tropis' | 'Ruang Ber-AC' | 'Hujan Sejuk' | 'Malam Hangat'
  note?: string; // 140 chars note
  client_op_id?: string;
  deleted_at?: string | null;
}

export interface StoryState {
  id: string;
  user_id?: string;
  user_name?: string;
  perfume_id: string;
  wear_log_id?: string;
  title?: string;
  body: string;
  mood?: string;
  occasion?: string;
  weather?: string;
  tags?: string[];
  story_date?: string; // YYYY-MM-DD
  status: 'draft' | 'published';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ReviewState {
  id: string;
  user_id: string;
  user_name: string;
  user_badge?: string; // 'Verified Owner' | 'Fragrance Enthusiast'
  perfume_id: string;
  rating: number; // 1-5
  longevity_band: string; // '<3 jam' | '3-6 jam' | '6-8 jam' | '8-12 jam' | '>12 jam'
  sillage: 'intimate' | 'moderate' | 'strong' | 'enormous';
  value_for_money: number; // 1-5
  repurchase_intent: 'yes_definitely' | 'maybe' | 'unlikely' | 'never';
  format_used: 'full_bottle' | 'decant' | 'sample_vial';
  title: string;
  review_text: string;
  pros?: string[];
  cons?: string[];
  status: 'approved' | 'pending_moderation' | 'flagged' | 'rejected';
  created_at: string;
  helpful_count: number;
}

export interface DiaryStats {
  totalWears: number;
  totalCompliments: number;
  totalStories: number;
  mostWornPerfumeId: string | null;
  mostWornCount: number;
  dominantMood: string | null;
  dominantOccasion: string | null;
  activeStreakDays: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  longevityDominantBand: string;
  sillageDominant: string;
  repurchaseYesRatePct: number;
  ratingCounts: Record<number, number>;
}

/**
 * Sprint 4 — client-side shape of a waitlist backend entry (server fields
 * token_hash / token_expires_at never leave the Function). Written ONLY by
 * the waitlist Cloud Function; the client never writes this collection
 * (rules deny it). Status vocabulary: pending_confirm until the email link
 * is clicked, then active; notified once a batch opens; withdrawn on opt-out.
 * No price fields: D-04 (Q13 undecided).
 */
export interface WaitlistState {
  id: string;
  email: string;
  perfume_id: string;
  perfume_name?: string;
  brand?: string;
  size_ml: 2 | 5 | 10;
  whatsapp_number?: string;
  notification_pref?: 'whatsapp' | 'email' | 'both';
  status: 'pending_confirm' | 'active' | 'withdrawn' | 'notified';
  created_at: string;
  confirmed_at?: string;
}




export interface CollectionSummary {
  totalLibraryBottles: number;
  currentlyWearingCount: number;
  memoriesCount: number;
  favoritesCount: number;
  totalCollectionValueIdr: number;
  pricedBottlesCount: number;
  totalWearsCount: number;
  totalJournalStoriesCount: number;
  lowBottleAlertsCount: number;
}

/**
 * Calculates remaining percentage strictly for Currently Wearing bottles (BR-01, BR-02).
 * Returns null if the bottle is finished or if status is not eligible.
 */
/**
 * Sprint 2: single conversion from sprays to ml for the detail wear
 * sheet (0.12 ml per spray, the sheet's long-standing factor). The
 * 1-tap logger instead uses the bottle's own ml_per_wear (default 0.5).
 * Centralized here so no view recomputes wear volume inline.
 */
export function mlForSprays(sprays: number): number {
  return Number(((sprays || 3) * 0.12).toFixed(1)) || 0.5;
}

export function calculateRemainingPercentage(bottle: BottleState): number | null {
  if (bottle.status === 'finished') return null;
  if (bottle.size_ml <= 0) return 0;
  
  const pct = Math.round((bottle.remaining_ml / bottle.size_ml) * 100);
  if (bottle.remaining_ml > 0 && pct === 0) return 1; // minimum 1% while remaining > 0
  return Math.min(100, Math.max(0, pct));
}

/**
 * Checks if a bottle triggers the low-bottle threshold (<= 20% remaining).
 */
export function isLowBottle(bottle: BottleState, thresholdPct = 20): boolean {
  if (bottle.status !== 'in_use' && bottle.status !== 'sealed') return false;
  const pct = calculateRemainingPercentage(bottle);
  return pct !== null && pct > 0 && pct <= thresholdPct;
}

/**
 * Computes all derived values for the user's collection in one single place (XC-01).
 * UI components must call this function and never calculate counts or valuations themselves.
 */
export function computeCollectionSummary(
  bottles: BottleState[],
  wears: WearLogState[] = [],
  stories: StoryState[] = []
): CollectionSummary {
  const activeBottles = bottles.filter(b => !b.deleted_at);

  const currentlyWearing = activeBottles.filter(b => b.status === 'sealed' || b.status === 'in_use');
  const memories = activeBottles.filter(b => b.status === 'finished');
  const favorites = activeBottles.filter(b => b.is_favorite);

  const pricedBottles = currentlyWearing.filter(b => typeof b.price_idr === 'number' && b.price_idr > 0);
  const totalValue = pricedBottles.reduce((sum, b) => sum + (b.price_idr || 0), 0);

  const activeWears = wears.filter(w => !w.deleted_at);
  const publishedStories = stories.filter(s => !s.deleted_at && s.status === 'published' && s.body.trim().length >= 20);

  const lowBottles = currentlyWearing.filter(b => isLowBottle(b));

  // Sprint 2 (logs win): total wears is the count of wear-log events.
  // There is no stored counter anymore; never fall back to bottle records.
  const totalWearsCount = activeWears.length;

  return {
    totalLibraryBottles: currentlyWearing.length, // Total Library Bottles excludes finished and wishlist (BR-01, §6.1)
    currentlyWearingCount: currentlyWearing.length,
    memoriesCount: memories.length,
    favoritesCount: favorites.length,
    totalCollectionValueIdr: totalValue,
    pricedBottlesCount: pricedBottles.length,
    totalWearsCount,
    totalJournalStoriesCount: publishedStories.length,
    lowBottleAlertsCount: lowBottles.length
  };
}

export interface ScentDnaProfile {
  familyBreakdown: { family: string; percentage: number; count: number }[];
  familyPercentages: Record<string, number>;
  dominantFamily: string;
  topNotes: { note: string; count: number }[];
  climateSuitability: {
    tropicalOutdoorPct: number;
    officeAcPct: number;
    eveningRainPct: number;
  };
  concentrationBreakdown: { concentration: string; count: number }[];
  averageRemainingPct: number;
  totalVolumeMl: number;
  editorialPersonaId: string;
  editorialPersonaEn: string;
}

export type ScentStoryState = StoryState;
export type WearState = WearLogState;
export type ScentDnaSummary = ScentDnaProfile;

/**
 * Distributes percentage shares strictly using the largest-remainder method (Hamilton/Hare-Niemeyer).
 * Guarantees:
 * 1. Every percentage share is strictly >= 0 (no negative values ever).
 * 2. Sum of all percentage shares equals exactly targetSum (default 100).
 */
export function largestRemainderRound(
  items: { family: string; weight: number }[],
  targetSum = 100
): { family: string; percentage: number; count: number }[] {
  // Ensure strictly non-negative weights
  const valid = items.filter(item => typeof item.weight === 'number' && !isNaN(item.weight) && item.weight > 0);
  if (valid.length === 0) return [];

  const totalWeight = valid.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return [];

  // Compute exact floating percentage, floor, and remainder
  const withRaw = valid.map(item => {
    const rawPct = (item.weight / totalWeight) * targetSum;
    const floored = Math.floor(rawPct);
    const remainder = rawPct - floored;
    return {
      family: item.family,
      count: Math.round(item.weight),
      weight: item.weight,
      rawPct,
      floored,
      remainder
    };
  });

  const currentFlooredSum = withRaw.reduce((sum, item) => sum + item.floored, 0);
  const remainderToDistribute = Math.round(targetSum - currentFlooredSum);

  // Sort descending by remainder; stable tie-break by rawPct descending, then family name
  const sortedByRemainder = [...withRaw].sort((a, b) => {
    if (Math.abs(b.remainder - a.remainder) > 0.000001) {
      return b.remainder - a.remainder;
    }
    if (Math.abs(b.rawPct - a.rawPct) > 0.000001) {
      return b.rawPct - a.rawPct;
    }
    return a.family.localeCompare(b.family);
  });

  const extraFamilies = new Set<string>();
  for (let i = 0; i < remainderToDistribute && i < sortedByRemainder.length; i++) {
    extraFamilies.add(sortedByRemainder[i].family);
  }

  const result = withRaw
    .map(item => {
      const finalPct = Math.max(0, item.floored + (extraFamilies.has(item.family) ? 1 : 0));
      return {
        family: item.family,
        percentage: finalPct,
        count: item.count
      };
    })
    .filter(item => item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  // Guarantee exact sum without ever creating negative numbers
  const finalSum = result.reduce((sum, item) => sum + item.percentage, 0);
  if (finalSum !== targetSum && result.length > 0) {
    const diff = targetSum - finalSum;
    result[0].percentage = Math.max(0, result[0].percentage + diff);
  }

  return result;
}

/**
 * Checks whether a perfume matches an olfactive family (case-insensitive substring of primary or secondary family).
 */
export function perfumeMatchesFamily(
  perfume: { primary_family?: string; secondary_family?: string },
  family: string
): boolean {
  if (!family) return false;
  const fam = family.toLowerCase().trim();
  const primary = (perfume.primary_family || '').toLowerCase();
  const secondary = (perfume.secondary_family || '').toLowerCase();
  return primary.includes(fam) || secondary.includes(fam);
}

export interface CatalogFacetCounts {
  familyCounts: Record<string, number>;
  originCounts: Record<string, number>;
  tierCounts: Record<string, number>;
  concentrationCounts: Record<string, number>;
  brandCounts: Record<string, number>;
}

export const CATALOG_FAMILIES = ['Fresh', 'Floral', 'Woody', 'Ambery', 'Gourmand', 'Aromatic'];

/**
 * Computes catalog facet counts derived strictly from the displayed perfume list.
 */
export function computeCatalogFacetCounts(
  perfumes: {
    id: string;
    brand: string;
    primary_family?: string;
    secondary_family?: string;
    origin: string;
    market_tier: string;
    concentration: string;
  }[]
): CatalogFacetCounts {
  const familyCounts: Record<string, number> = {};
  for (const fam of CATALOG_FAMILIES) {
    familyCounts[fam] = perfumes.filter(p => perfumeMatchesFamily(p, fam)).length;
  }

  const originCounts: Record<string, number> = {};
  const tierCounts: Record<string, number> = {};
  const concentrationCounts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};

  for (const p of perfumes) {
    if (p.origin) originCounts[p.origin] = (originCounts[p.origin] || 0) + 1;
    if (p.market_tier) tierCounts[p.market_tier] = (tierCounts[p.market_tier] || 0) + 1;
    if (p.concentration) concentrationCounts[p.concentration] = (concentrationCounts[p.concentration] || 0) + 1;
    if (p.brand) brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
  }

  return {
    familyCounts,
    originCounts,
    tierCounts,
    concentrationCounts,
    brandCounts
  };
}

export interface SharedBottleDerivedValues {
  totalLibraryBottles: number;
  collectionValueIdr: number;
  totalRemainingVolumeMl: number;
  totalWearsCount: number;
  perBottleTimesWorn: Record<string, number>;
  perPerfumeTimesWorn: Record<string, number>;
  mostWorn: {
    bottleId: string | null;
    perfumeId: string | null;
    perfumeName: string | null;
    brand: string | null;
    count: number;
  };
  scentDna: ScentDnaProfile;
  facetCounts: CatalogFacetCounts;
}

/**
 * Computes Scent DNA breakdown from user's active and favorite bottles.
 * Weights scents by ownership and wear frequency, where wear frequency
 * comes ONLY from wear_logs (Sprint 2, logs win). `wearLogs` defaults to
 * [] (no wear weighting) — callers that have logs must pass them.
 */
export function computeScentDna(
  bottles: BottleState[],
  perfumes: {
    id: string;
    primary_family?: string;
    secondary_family?: string;
    top_notes: string;
    heart_notes: string;
    base_notes: string;
    heat_suitability?: number;
    concentration: string;
  }[],
  wearLogs: WearLogState[] = []
): ScentDnaProfile {
  const activeBottles = bottles.filter(b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed' || b.status === 'finished'));

  // Sprint 2: per-bottle wear counts derived from wear-log events only.
  const wearsPerBottle: Record<string, number> = {};
  for (const w of wearLogs) {
    if (w.deleted_at) continue;
    wearsPerBottle[w.bottle_id] = (wearsPerBottle[w.bottle_id] || 0) + 1;
  }

  const familyWeights: Record<string, number> = {
    Woody: 0,
    Floral: 0,
    Fresh: 0,
    Ambery: 0,
    Gourmand: 0,
    Aromatic: 0
  };

  const noteFrequency: Record<string, number> = {};
  const concentrationCounts: Record<string, number> = {};
  let totalWeight = 0;
  let tropicalOutdoorScore = 0;
  let officeAcScore = 0;
  let eveningRainScore = 0;
  let totalRemainingPct = 0;
  let totalMl = 0;
  let validBottlesCount = 0;

  for (const bottle of activeBottles) {
    const perfume = perfumes.find(p => p.id === bottle.perfume_id);
    if (!perfume) continue;

    validBottlesCount++;
    const wearMultiplier = 1 + (wearsPerBottle[bottle.id] || 0) * 0.15 + (bottle.is_favorite ? 0.5 : 0);
    totalWeight += wearMultiplier;
    totalMl += bottle.remaining_ml || 0;

    const pct = calculateRemainingPercentage(bottle);
    if (pct !== null) totalRemainingPct += pct;

    // Concentrations
    const conc = perfume.concentration || 'EDP';
    concentrationCounts[conc] = (concentrationCounts[conc] || 0) + 1;

    // Family matching
    const primary = (perfume.primary_family || '').toLowerCase();
    for (const fam of Object.keys(familyWeights)) {
      if (primary.includes(fam.toLowerCase())) {
        familyWeights[fam] += wearMultiplier;
      }
    }
    if (perfume.secondary_family) {
      const secondary = perfume.secondary_family.toLowerCase();
      for (const fam of Object.keys(familyWeights)) {
        if (secondary.includes(fam.toLowerCase())) {
          familyWeights[fam] += wearMultiplier * 0.5;
        }
      }
    }

    // Climate scores
    if ((perfume.heat_suitability ?? 0) >= 4) tropicalOutdoorScore += wearMultiplier;
    if ((perfume.heat_suitability ?? 0) >= 3) officeAcScore += wearMultiplier;
    if ((perfume.heat_suitability ?? 0) <= 3 || primary.includes('amber') || primary.includes('gourmand') || primary.includes('wood')) {
      eveningRainScore += wearMultiplier;
    }

    // Notes frequency extraction
    const allNotes = `${perfume.top_notes}, ${perfume.heart_notes}, ${perfume.base_notes}`
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 2);

    for (const note of allNotes) {
      noteFrequency[note] = (noteFrequency[note] || 0) + 1;
    }
  }


  // Sprint 7: NO fabricated DNA for empty collections (F-08 closure).
  // The old code returned Woody 40 / Floral 30 / Fresh 20 / Ambery 10 with
  // climate 65/80/70 and average-remaining 62 for a user with no bottles.
  // An empty collection has no scent DNA: the honest profile is empty and
  // every caller renders the <3-perfume empty state from perfumesCount.
  if (totalWeight === 0 || validBottlesCount === 0) {
    return {
      familyBreakdown: [],
      familyPercentages: {},
      dominantFamily: '',
      topNotes: [],
      climateSuitability: { tropicalOutdoorPct: 0, officeAcPct: 0, eveningRainPct: 0 },
      concentrationBreakdown: [],
      averageRemainingPct: 0,
      totalVolumeMl: 0,
      editorialPersonaId: '',
      editorialPersonaEn: '',
    };
  }

  const itemsToRound = Object.entries(familyWeights)
    .filter(([_, weight]) => weight > 0)
    .map(([family, weight]) => ({ family, weight }));

  const rawBreakdown = largestRemainderRound(itemsToRound, 100);

  const dominantFamily = rawBreakdown[0]?.family || 'Woody';

  const topNotes = Object.entries(noteFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([note, count]) => ({ note, count }));

  const tropicalOutdoorPct = totalWeight > 0 ? Math.min(100, Math.round((tropicalOutdoorScore / totalWeight) * 100)) : 0;
  const officeAcPct = totalWeight > 0 ? Math.min(100, Math.round((officeAcScore / totalWeight) * 100)) : 0;
  const eveningRainPct = totalWeight > 0 ? Math.min(100, Math.round((eveningRainScore / totalWeight) * 100)) : 0;

  const concentrationBreakdown = Object.entries(concentrationCounts).map(([concentration, count]) => ({
    concentration,
    count
  }));

  const avgRemaining = validBottlesCount > 0 ? Math.round(totalRemainingPct / validBottlesCount) : 0;

  // Editorial persona descriptions
  let personaId = `Koleksimu berpusat pada pesona ${dominantFamily} dengan sentuhan notes alami yang hangat dan berkarakter. Kamu menghargai kehangatan yang tidak menyengat, cocok untuk iklim tropis maupun kenyamanan ruang ber-AC seharian.`;
  let personaEn = `Your collection is anchored in ${dominantFamily} accords with sophisticated natural undertones. You gravitate towards calm, grounded fragrances that wear gracefully across tropical daytime heat and air-conditioned evenings.`;

  if (dominantFamily === 'Fresh') {
    personaId = 'Aura aromamu cerah, energik, dan bersih. Kamu menyukai kesegaran citrus, aquatic, dan green notes yang menyegarkan pikiran di bawah terik khatulistiwa.';
    personaEn = 'Your olfactory profile is crisp, energetic, and luminous. You favor revitalizing citrus, aquatic, and verdant facets that thrive effortlessly under the tropical sun.';
  } else if (dominantFamily === 'Floral') {
    personaId = 'Kamu memiliki selera romantis dan elegan. Komposisi kelopak bunga segar dengan dasar musk halus memberikan kesan ramah, anggun, dan memikat tanpa berlebihan.';
    personaEn = 'You gravitate toward timeless elegance and romantic grace. Luminous floral bouquets grounded by tender musks evoke approachable charm and enduring poise.';
  } else if (dominantFamily === 'Ambery' || dominantFamily === 'Gourmand') {
    personaId = 'Koleksimu memancarkan kehangatan intim, manis, dan misterius. Kamu menyukai vanilla kaya, resin ambery, dan rempah yang menciptakan jejak sillage tak terlupakan.';
    personaEn = 'Your scent wardrobe radiates rich intimacy, sweet warmth, and quiet magnetism. You favor indulgent vanilla, golden resins, and spicy undertones that leave a memorable sillage.';
  }

  const familyPercentages: Record<string, number> = {};
  for (const item of rawBreakdown) {
    familyPercentages[item.family] = item.percentage;
  }

  return {
    familyBreakdown: rawBreakdown,
    familyPercentages,
    dominantFamily,
    topNotes,
    climateSuitability: {
      tropicalOutdoorPct,
      officeAcPct,
      eveningRainPct
    },
    concentrationBreakdown,
    averageRemainingPct: avgRemaining,
    totalVolumeMl: Math.round(totalMl),
    editorialPersonaId: personaId,
    editorialPersonaEn: personaEn
  };
}

export const calculateScentDna = computeScentDna;

/**
 * Shared derived-values module computing collection statistics strictly from bottle records only.
 * Home, Library, Journal, Catalog, and Scent DNA dashboard read from this module.
 */
export function computeSharedBottleStats(
  bottles: BottleState[],
  perfumes: {
    id: string;
    name?: string;
    brand?: string;
    primary_family?: string;
    secondary_family?: string;
    top_notes: string;
    heart_notes: string;
    base_notes: string;
    heat_suitability?: number;
    concentration: string;
    origin?: string;
    market_tier?: string;
  }[] = [],
  wearLogs: WearLogState[] = []
): SharedBottleDerivedValues {
  const activeBottles = bottles.filter(b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed'));
  const allCollectionBottles = bottles.filter(b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed' || b.status === 'finished'));

  const totalLibraryBottles = activeBottles.length;

  const pricedBottles = activeBottles.filter(b => typeof b.price_idr === 'number' && b.price_idr > 0);
  const collectionValueIdr = pricedBottles.reduce((sum, b) => sum + (b.price_idr || 0), 0);

  const totalRemainingVolumeMl = Math.round(activeBottles.reduce((sum, b) => sum + (b.remaining_ml || 0), 0));

  // Sprint 2 (logs win): per-bottle and per-perfume times-worn are counted
  // from wear-log events ONLY. Bottles without logs count 0.
  const activeWears = wearLogs.filter(w => !w.deleted_at);
  const perBottleTimesWorn: Record<string, number> = {};
  const perPerfumeTimesWorn: Record<string, number> = {};
  let totalWearsCount = 0;

  for (const b of allCollectionBottles) {
    perBottleTimesWorn[b.id] = 0;
    perPerfumeTimesWorn[b.perfume_id] = perPerfumeTimesWorn[b.perfume_id] || 0;
  }
  for (const w of activeWears) {
    if (perBottleTimesWorn[w.bottle_id] === undefined) perBottleTimesWorn[w.bottle_id] = 0;
    perBottleTimesWorn[w.bottle_id] += 1;
    perPerfumeTimesWorn[w.perfume_id] = (perPerfumeTimesWorn[w.perfume_id] || 0) + 1;
    totalWearsCount += 1;
  }

  // Most-worn bottle strictly from wear-log counts.
  let mostWornBottle: BottleState | null = null;
  let maxWears = 0;

  for (const b of allCollectionBottles) {
    const wears = perBottleTimesWorn[b.id] || 0;
    if (wears > maxWears) {
      maxWears = wears;
      mostWornBottle = b;
    }
  }

  if (!mostWornBottle && allCollectionBottles.length > 0) {
    mostWornBottle = allCollectionBottles[0];
    maxWears = 0;
  }

  const mostWornPerfume = mostWornBottle ? perfumes.find(p => p.id === mostWornBottle?.perfume_id) : null;

  const mostWorn = {
    bottleId: mostWornBottle?.id || null,
    perfumeId: mostWornBottle?.perfume_id || null,
    perfumeName: mostWornPerfume?.name || null,
    brand: mostWornPerfume?.brand || null,
    count: maxWears
  };

  const scentDna = computeScentDna(bottles, perfumes, wearLogs);
  const facetCounts = computeCatalogFacetCounts(perfumes as any);

  return {
    totalLibraryBottles,
    collectionValueIdr,
    totalRemainingVolumeMl,
    totalWearsCount,
    perBottleTimesWorn,
    perPerfumeTimesWorn,
    mostWorn,
    scentDna,
    facetCounts
  };
}

/**
 * Computes diary statistics including compliments, most worn perfume, and active streak.
 */
export function computeDiaryStats(
  wearLogs: WearLogState[],
  stories: StoryState[] = []
): DiaryStats {
  const activeWears = wearLogs.filter(w => !w.deleted_at);
  const publishedStories = stories.filter(s => !s.deleted_at && s.status === 'published');

  let totalCompliments = 0;
  const perfumeCounts: Record<string, number> = {};
  const moodCounts: Record<string, number> = {};
  const occasionCounts: Record<string, number> = {};
  const datesSet = new Set<string>();

  for (const wear of activeWears) {
    if (wear.compliments) {
      totalCompliments += wear.compliments;
    }
    perfumeCounts[wear.perfume_id] = (perfumeCounts[wear.perfume_id] || 0) + 1;
    if (wear.mood) {
      moodCounts[wear.mood] = (moodCounts[wear.mood] || 0) + 1;
    }
    if (wear.occasion) {
      occasionCounts[wear.occasion] = (occasionCounts[wear.occasion] || 0) + 1;
    }
    if (wear.worn_at) {
      datesSet.add(wear.worn_at.split('T')[0]);
    }
  }

  // Sprint 2 (logs win): most-worn comes ONLY from wear-log events.
  let mostWornPerfumeId: string | null = null;
  let mostWornCount = 0;

  for (const [id, count] of Object.entries(perfumeCounts)) {
    if (count > mostWornCount) {
      mostWornCount = count;
      mostWornPerfumeId = id;
    }
  }

  let dominantMood: string | null = null;
  let maxMoodCount = 0;
  for (const [mood, count] of Object.entries(moodCounts)) {
    if (count > maxMoodCount) {
      maxMoodCount = count;
      dominantMood = mood;
    }
  }

  let dominantOccasion: string | null = null;
  let maxOccasionCount = 0;
  for (const [occ, count] of Object.entries(occasionCounts)) {
    if (count > maxOccasionCount) {
      maxOccasionCount = count;
      dominantOccasion = occ;
    }
  }

  // Calculate streak based on consecutive dates
  const sortedDates = Array.from(datesSet).sort().reverse();
  let streak = 0;
  if (sortedDates.length > 0) {
    streak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const d1 = new Date(sortedDates[i]);
      const d2 = new Date(sortedDates[i + 1]);
      const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Sprint 2 (logs win): total wears is the count of wear-log events.
  const bottleWearsTotal = activeWears.length;

  return {
    totalWears: bottleWearsTotal,
    totalCompliments,
    totalStories: publishedStories.length,
    mostWornPerfumeId,
    mostWornCount,
    dominantMood,
    dominantOccasion,
    activeStreakDays: streak
  };
}

/**
 * Computes multi-criteria review summary for a given fragrance.
 */
export function computeReviewSummary(reviews: ReviewState[]): ReviewSummary {
  const approvedReviews = reviews.filter(r => r.status === 'approved');
  if (approvedReviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      longevityDominantBand: '6-8 jam',
      sillageDominant: 'moderate',
      repurchaseYesRatePct: 0,
      ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  let repurchaseYes = 0;
  const longevityBands: Record<string, number> = {};
  const sillageCounts: Record<string, number> = {};

  for (const r of approvedReviews) {
    const roundedRating = Math.min(5, Math.max(1, Math.round(r.rating)));
    ratingCounts[roundedRating] = (ratingCounts[roundedRating] || 0) + 1;
    totalRating += r.rating;

    if (r.repurchase_intent === 'yes_definitely') {
      repurchaseYes++;
    }

    if (r.longevity_band) {
      longevityBands[r.longevity_band] = (longevityBands[r.longevity_band] || 0) + 1;
    }

    if (r.sillage) {
      sillageCounts[r.sillage] = (sillageCounts[r.sillage] || 0) + 1;
    }
  }

  let longevityDominantBand = '6-8 jam';
  let maxLong = 0;
  for (const [band, count] of Object.entries(longevityBands)) {
    if (count > maxLong) {
      maxLong = count;
      longevityDominantBand = band;
    }
  }

  let sillageDominant = 'moderate';
  let maxSil = 0;
  for (const [sil, count] of Object.entries(sillageCounts)) {
    if (count > maxSil) {
      maxSil = count;
      sillageDominant = sil;
    }
  }

  return {
    averageRating: Number((totalRating / approvedReviews.length).toFixed(1)),
    totalReviews: approvedReviews.length,
    longevityDominantBand,
    sillageDominant,
    repurchaseYesRatePct: Math.round((repurchaseYes / approvedReviews.length) * 100),
    ratingCounts
  };
}

export interface CommunityReviewAggregate {
  hasEnoughReviews: boolean; // strictly true ONLY when approved real reviews >= minThreshold (default 5)
  totalPublishedReviews: number;
  averageRating?: number;
  longevityDominantBand?: string;
  sillageDominant?: string;
  repurchaseYesRatePct?: number;
}

/**
 * Computes community review aggregates for a perfume.
 * Enforces requirement:
 * Show a community aggregate (average, percentages, wearers-vs-claims numbers)
 * only when there are at least 5 real published reviews for that perfume.
 * Below that, show 'Not enough reviews yet / Belum cukup ulasan' with no numbers.
 */
export function computeCommunityReviewAggregate(
  reviews: ReviewState[],
  perfumeId: string,
  minReviewThreshold = 5
): CommunityReviewAggregate {
  const published = reviews.filter(r => r.perfume_id === perfumeId && r.status === 'approved');
  const total = published.length;

  if (total < minReviewThreshold) {
    return {
      hasEnoughReviews: false,
      totalPublishedReviews: total
    };
  }

  const summary = computeReviewSummary(published);
  return {
    hasEnoughReviews: true,
    totalPublishedReviews: total,
    averageRating: summary.averageRating,
    longevityDominantBand: summary.longevityDominantBand,
    sillageDominant: summary.sillageDominant,
    repurchaseYesRatePct: summary.repurchaseYesRatePct
  };
}

export const AFFILIATE_DISCLOSURE = {
  en: 'We may earn a commission if you buy through these links. It never changes your match score.',
  id: 'Kami bisa menerima komisi jika kamu membeli lewat tautan ini. Komisi tidak memengaruhi skor kecocokanmu.'
} as const;

