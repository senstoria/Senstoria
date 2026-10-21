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
  times_worn?: number;
  is_favorite?: boolean;
  deleted_at?: string | null;
}

export interface WearLogState {
  id: string;
  user_id?: string;
  bottle_id: string;
  perfume_id: string;
  worn_on: string; // ISO date string YYYY-MM-DD or ISO timestamp
  sprays_count?: number; // default 3-4 sprays (~0.4 - 0.5ml)
  ml_decremented?: number;
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
  is_public?: boolean;
  likes_count?: number;
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

export interface WaitlistState {
  id: string;
  user_id?: string;
  email: string;
  perfume_id: string;
  perfume_name?: string;
  brand?: string;
  size_ml: 2 | 5 | 10;
  willingness: 'yes' | 'maybe' | 'no';
  fair_price_idr: number;
  whatsapp_number?: string;
  notification_pref?: 'whatsapp' | 'email' | 'both';
  status: 'pending_confirm' | 'active' | 'withdrawn' | 'notified';
  created_at: string;
}

export interface SampleOrderState {
  id: string;
  order_number: string;
  user_id?: string;
  perfume_id: string;
  perfume_name: string;
  brand: string;
  size_ml: 2 | 5 | 10;
  sample_price_idr: number;
  shipping_courier: 'jne' | 'sicepat' | 'gosend';
  shipping_cost_idr: number;
  total_idr: number;
  recipient_name: string;
  whatsapp_number: string;
  shipping_address: string;
  payment_method: 'qris' | 'bca_va' | 'gopay';
  status: 'confirmed_simulation';
  flag_used: 'try_it_first_ordering';
  created_at: string;
}

/**
 * Calculates a fair suggested decant price based on perfume price per ml and vial packaging fees (TRY-01).
 */
export function calculateFairSamplePrice(pricePerMl: number, sizeMl: 2 | 5 | 10): number {
  const packagingFee = sizeMl === 2 ? 12000 : sizeMl === 5 ? 18000 : 25000;
  const rawPrice = (pricePerMl * sizeMl) + packagingFee;
  return Math.ceil(rawPrice / 1000) * 1000;
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

  return {
    totalLibraryBottles: currentlyWearing.length, // Total Library Bottles excludes finished and wishlist (BR-01, §6.1)
    currentlyWearingCount: currentlyWearing.length,
    memoriesCount: memories.length,
    favoritesCount: favorites.length,
    totalCollectionValueIdr: totalValue,
    pricedBottlesCount: pricedBottles.length,
    totalWearsCount: activeWears.length,
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
 * Computes Scent DNA breakdown from user's active and favorite bottles.
 * Weights scents by ownership and wear frequency.
 */
export function computeScentDna(
  bottles: BottleState[],
  perfumes: {
    id: string;
    primary_family: string;
    secondary_family?: string;
    top_notes: string;
    heart_notes: string;
    base_notes: string;
    heat_suitability: number;
    concentration: string;
  }[]
): ScentDnaProfile {
  const activeBottles = bottles.filter(b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed' || b.status === 'finished'));

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
    const wearMultiplier = 1 + (bottle.times_worn || 0) * 0.15 + (bottle.is_favorite ? 0.5 : 0);
    totalWeight += wearMultiplier;
    totalMl += bottle.remaining_ml || 0;

    const pct = calculateRemainingPercentage(bottle);
    if (pct !== null) totalRemainingPct += pct;

    // Concentrations
    const conc = perfume.concentration || 'EDP';
    concentrationCounts[conc] = (concentrationCounts[conc] || 0) + 1;

    // Family matching
    const primary = perfume.primary_family.toLowerCase();
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
    if (perfume.heat_suitability >= 4) tropicalOutdoorScore += wearMultiplier;
    if (perfume.heat_suitability >= 3) officeAcScore += wearMultiplier;
    if (perfume.heat_suitability <= 3 || primary.includes('amber') || primary.includes('gourmand') || primary.includes('wood')) {
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

  // Fallback defaults if user has no bottles yet
  if (totalWeight === 0 || validBottlesCount === 0) {
    familyWeights['Woody'] = 40;
    familyWeights['Floral'] = 30;
    familyWeights['Fresh'] = 20;
    familyWeights['Ambery'] = 10;
    totalWeight = 100;
  }

  const rawBreakdown = Object.entries(familyWeights)
    .filter(([_, weight]) => weight > 0)
    .map(([family, weight]) => ({
      family,
      percentage: Math.round((weight / totalWeight) * 100),
      count: Math.round(weight)
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Normalize percentages so sum equals 100
  const sumPct = rawBreakdown.reduce((acc, curr) => acc + curr.percentage, 0);
  if (sumPct > 0 && sumPct !== 100 && rawBreakdown.length > 0) {
    rawBreakdown[0].percentage += (100 - sumPct);
  }

  const dominantFamily = rawBreakdown[0]?.family || 'Woody';

  const topNotes = Object.entries(noteFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([note, count]) => ({ note, count }));

  const tropicalOutdoorPct = totalWeight > 0 ? Math.min(100, Math.round((tropicalOutdoorScore / totalWeight) * 100)) : 65;
  const officeAcPct = totalWeight > 0 ? Math.min(100, Math.round((officeAcScore / totalWeight) * 100)) : 80;
  const eveningRainPct = totalWeight > 0 ? Math.min(100, Math.round((eveningRainScore / totalWeight) * 100)) : 70;

  const concentrationBreakdown = Object.entries(concentrationCounts).map(([concentration, count]) => ({
    concentration,
    count
  }));

  const avgRemaining = validBottlesCount > 0 ? Math.round(totalRemainingPct / validBottlesCount) : 62;

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
 * Computes diary statistics including compliments, most worn perfume, and active streak.
 */
export function computeDiaryStats(wearLogs: WearLogState[], stories: StoryState[] = []): DiaryStats {
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
    if (wear.worn_on) {
      datesSet.add(wear.worn_on.split('T')[0]);
    }
  }

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

  return {
    totalWears: activeWears.length,
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
