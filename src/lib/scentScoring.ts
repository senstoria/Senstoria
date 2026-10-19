import { SeedPerfume } from '../data/seedPerfumes.ts';

export interface ScentQuizAnswers {
  preferredFamilies: string[]; // e.g. ['Woody', 'Fresh', 'Floral', 'Ambery', 'Gourmand', 'Aromatic'] or ['not_sure']
  climateSetting: string; // 'outdoor_hot' | 'indoor_ac' | 'evening_cool' | 'flexible'
  projectionPreference: string; // 'intimate' | 'moderate' | 'strong' | 'not_sure'
  longevityExpectation: string; // 'light' | 'moderate' | 'long' | 'not_sure'
  brandOriginPreference: string; // 'local_id' | 'global_int' | 'any'
  budgetTier: string; // 'budget' | 'mid' | 'premium' | 'flexible'
  avoidNotesOrTraits: string[]; // e.g. ['overly_sweet', 'heavy_smoke_oud', 'sharp_white_floral', 'none']
}

export interface DimensionScores {
  familyAffinity: number;
  climateFit: number;
  longevityFit: number;
  sillageFit: number;
  budgetFit: number;
  originFit: number;
}

export interface ScoredRecommendation {
  perfume: SeedPerfume;
  matchScore: number; // 0 - 100 integer
  dimensionScores: DimensionScores;
  whyFitsBulletsId: string[];
  whyFitsBulletsEn: string[];
  possibleMismatchId: string;
  possibleMismatchEn: string;
  aiExplanation?: {
    why_fits: string;
    possible_mismatch: string;
    source: string;
  };
}

export const DEFAULT_QUIZ_ANSWERS: ScentQuizAnswers = {
  preferredFamilies: ['Woody', 'Fresh'],
  climateSetting: 'indoor_ac',
  projectionPreference: 'moderate',
  longevityExpectation: 'moderate',
  brandOriginPreference: 'any',
  budgetTier: 'flexible',
  avoidNotesOrTraits: ['none']
};

/**
 * Deterministic 6-dimension scoring engine with score calibration (FIND-05).
 * Renormalizes weights when user selects "not_sure" or "flexible".
 */
export function calculateMatchScore(perfume: SeedPerfume, answers: ScentQuizAnswers): ScoredRecommendation {
  const baseWeights = {
    family: 0.30,
    climate: 0.20,
    longevity: 0.15,
    sillage: 0.15,
    budget: 0.10,
    origin: 0.10
  };

  const activeWeights = { ...baseWeights };
  const dimensions: DimensionScores = {
    familyAffinity: 70,
    climateFit: 70,
    longevityFit: 70,
    sillageFit: 70,
    budgetFit: 70,
    originFit: 70
  };

  const whyFitsId: string[] = [];
  const whyFitsEn: string[] = [];
  let possibleMismatchId = 'Sensitivitas aroma dapat bervariasi bergantung pada suhu kulit.';
  let possibleMismatchEn = 'Scent performance can vary based on individual skin temperature.';

  // 1. Family Affinity (30%)
  if (answers.preferredFamilies.includes('not_sure') || answers.preferredFamilies.length === 0) {
    activeWeights.family = 0;
  } else {
    const primMatch = answers.preferredFamilies.some(f => 
      f.toLowerCase() === perfume.primary_family.toLowerCase() ||
      perfume.primary_family.toLowerCase().includes(f.toLowerCase())
    );
    const secMatch = perfume.secondary_family && answers.preferredFamilies.some(f => 
      f.toLowerCase() === perfume.secondary_family?.toLowerCase() ||
      perfume.secondary_family?.toLowerCase().includes(f.toLowerCase())
    );

    if (primMatch && secMatch) {
      dimensions.familyAffinity = 100;
      whyFitsId.push(`Sesuai sempurna dengan keluarga aroma ${perfume.primary_family} dan sentuhan ${perfume.secondary_family}`);
      whyFitsEn.push(`Matches both your ${perfume.primary_family} and ${perfume.secondary_family} scent family preferences`);
    } else if (primMatch) {
      dimensions.familyAffinity = 95;
      whyFitsId.push(`Berasal dari keluarga aroma utama ${perfume.primary_family} yang kamu sukai`);
      whyFitsEn.push(`Anchored in your preferred ${perfume.primary_family} olfactive family`);
    } else if (secMatch) {
      dimensions.familyAffinity = 80;
      whyFitsId.push(`Memiliki nuansa sekunder ${perfume.secondary_family} yang kamu sukai`);
      whyFitsEn.push(`Features secondary facets of ${perfume.secondary_family} that match your profile`);
    } else {
      dimensions.familyAffinity = 35;
      possibleMismatchId = `Parfum ini didominasi oleh nuansa ${perfume.primary_family}, berbeda dari keluarga aroma pilihanmu.`;
      possibleMismatchEn = `This fragrance is driven by ${perfume.primary_family} facets, which differs from your chosen profile.`;
    }
  }

  // 2. Climate Fit (20%)
  if (answers.climateSetting === 'flexible') {
    activeWeights.climate = 0;
  } else if (answers.climateSetting === 'outdoor_hot') {
    if (perfume.heat_suitability >= 4) {
      dimensions.climateFit = 100;
      whyFitsId.push('Sangat aman di cuaca panas & terik tropis tanpa memicu aroma menyengat');
      whyFitsEn.push('Calibrated for tropical midday heat without turning cloying');
    } else if (perfume.heat_suitability === 3) {
      dimensions.climateFit = 75;
    } else {
      dimensions.climateFit = 30;
      possibleMismatchId = 'Komposisi agak padat untuk siang terik outdoor; gunakan tipis atau pakai di tempat ber-AC.';
      possibleMismatchEn = 'May feel dense in high outdoor humidity; consider light application or indoor AC wear.';
    }
  } else if (answers.climateSetting === 'indoor_ac') {
    dimensions.climateFit = (perfume.heat_suitability >= 2 && perfume.heat_suitability <= 4) ? 95 : 80;
    whyFitsId.push('Formula sangat nyaman dan anggun untuk ruang ber-AC seharian');
    whyFitsEn.push('Wears comfortably in full-day air-conditioned indoor settings');
  } else if (answers.climateSetting === 'evening_cool') {
    if (perfume.heat_suitability <= 3) {
      dimensions.climateFit = 100;
      whyFitsId.push('Notes dasar kayu, amber, dan rempahnya mekar sempurna di malam hari atau cuaca sejuk');
      whyFitsEn.push('Deep base notes bloom gracefully in cool evenings or rainy weather');
    } else {
      dimensions.climateFit = 65;
    }
  }

  // 3. Longevity Fit (15%)
  if (answers.longevityExpectation === 'not_sure') {
    activeWeights.longevity = 0;
  } else {
    const band = perfume.longevity_expected_band;
    if (answers.longevityExpectation === 'light') {
      dimensions.longevityFit = (band === '<2h' || band === '2-4h' || band === '4-6h') ? 95 : 70;
    } else if (answers.longevityExpectation === 'moderate') {
      dimensions.longevityFit = (band === '4-6h' || band === '6-8h') ? 100 : 75;
      if (band === '6-8h') {
        whyFitsId.push(`Daya tahan kulit teruji ${band}, ideal untuk rutinitas kerja seharian`);
        whyFitsEn.push(`Tested skin longevity of ${band}, well-aligned with your daily routine`);
      }
    } else if (answers.longevityExpectation === 'long') {
      dimensions.longevityFit = (band === '6-8h' || band === '8h+') ? 100 : 45;
      if (band === '8h+') {
        whyFitsId.push('Konsentrasi tinggi dengan ketahanan ekstra panjang (8+ jam)');
        whyFitsEn.push('High concentration delivering long-lasting performance (8+ hours)');
      } else if (band === '<2h' || band === '2-4h') {
        possibleMismatchId = 'Daya tahan tergolong ringan; disarankan membawa travel spray untuk re-spray sore hari.';
        possibleMismatchEn = 'Longevity is lighter; consider keeping a travel decant for afternoon touch-ups.';
      }
    }
  }

  // 4. Sillage / Projection Fit (15%)
  if (answers.projectionPreference === 'not_sure') {
    activeWeights.sillage = 0;
  } else {
    const proj = perfume.projection_expected;
    if (answers.projectionPreference === 'intimate') {
      dimensions.sillageFit = proj <= 2 ? 100 : 50;
      if (proj <= 2) {
        whyFitsId.push('Jejak aroma intim dan tenang, tidak mendistraksi rekan kerja');
        whyFitsEn.push('Intimate scent bubble that wears close to skin without overwhelming others');
      }
    } else if (answers.projectionPreference === 'moderate') {
      dimensions.sillageFit = (proj === 2 || proj === 3) ? 100 : 70;
      if (proj === 2 || proj === 3) {
        whyFitsId.push('Proyeksi radius satu jangkauan lengan yang sopan dan tercium saat bercakap-cakap');
        whyFitsEn.push('Pleasant arm-length projection suitable for polite social distance');
      }
    } else if (answers.projectionPreference === 'strong') {
      dimensions.sillageFit = proj >= 3 ? 100 : 40;
      if (proj >= 3) {
        whyFitsId.push('Meninggalkan jejak sillage tegas dan mudah dikenali saat melintas');
        whyFitsEn.push('Leaves a confident sillage trail that leaves an impression');
      }
    }
  }

  // 5. Budget Tier Fit (10%)
  if (answers.budgetTier === 'flexible') {
    activeWeights.budget = 0;
  } else {
    const price = perfume.reference_price_idr;
    if (answers.budgetTier === 'budget') {
      dimensions.budgetFit = price <= 250000 ? 100 : price <= 400000 ? 70 : 40;
    } else if (answers.budgetTier === 'mid') {
      dimensions.budgetFit = (price >= 200000 && price <= 650000) ? 100 : 65;
    } else if (answers.budgetTier === 'premium') {
      dimensions.budgetFit = price >= 500000 ? 100 : 70;
    }
  }

  // 6. Brand Origin Fit (10%)
  if (answers.brandOriginPreference === 'any') {
    activeWeights.origin = 0;
  } else if (answers.brandOriginPreference === 'local_id') {
    dimensions.originFit = perfume.origin === 'ID' ? 100 : 40;
    if (perfume.origin === 'ID') {
      whyFitsId.push('Karya artisan brand lokal Indonesia berstandar internasional');
      whyFitsEn.push('Homegrown Indonesian artisanal creation with elevated craftsmanship');
    }
  } else if (answers.brandOriginPreference === 'global_int') {
    dimensions.originFit = perfume.origin === 'INT' ? 100 : 50;
  }

  // 7. Avoidance penalty check (-20% penalty if matches an avoided trait)
  let penalty = 0;
  if (!answers.avoidNotesOrTraits.includes('none')) {
    const allNotes = `${perfume.top_notes} ${perfume.heart_notes} ${perfume.base_notes}`.toLowerCase();
    
    if (answers.avoidNotesOrTraits.includes('overly_sweet')) {
      if (perfume.primary_family.toLowerCase() === 'gourmand' || allNotes.includes('caramel') || allNotes.includes('sugar')) {
        penalty += 20;
        possibleMismatchId = 'Memiliki notes manis gourmand yang mungkin terasa terlalu pekat sesuai preferensimu.';
        possibleMismatchEn = 'Contains sweet gourmand facets that might lean richer than you prefer.';
      }
    }

    if (answers.avoidNotesOrTraits.includes('heavy_smoke_oud')) {
      if (allNotes.includes('oud') || allNotes.includes('agarwood') || allNotes.includes('smoke') || allNotes.includes('incense')) {
        penalty += 20;
        possibleMismatchId = 'Mengandung aksen dupa atau oud yang mungkin terasa terlalu pekat bagi indra penciumanmu.';
        possibleMismatchEn = 'Features incense or oud facets that may feel heavier than desired.';
      }
    }

    if (answers.avoidNotesOrTraits.includes('sharp_white_floral')) {
      if (allNotes.includes('tuberose') || allNotes.includes('jasmine') || allNotes.includes('sedap malam')) {
        penalty += 20;
        possibleMismatchId = 'Terdapat notes floral putih (tuberose/melati) yang kuat di fase awal.';
        possibleMismatchEn = 'Contains prominent white floral (tuberose/jasmine) facets in the opening.';
      }
    }
  }

  // Renormalize weights (FIND-05)
  const sumWeights = activeWeights.family + activeWeights.climate + activeWeights.longevity + activeWeights.sillage + activeWeights.budget + activeWeights.origin;

  let weightedScore = 75;
  if (sumWeights > 0) {
    const rawSum = 
      (dimensions.familyAffinity * activeWeights.family) +
      (dimensions.climateFit * activeWeights.climate) +
      (dimensions.longevityFit * activeWeights.longevity) +
      (dimensions.sillageFit * activeWeights.sillage) +
      (dimensions.budgetFit * activeWeights.budget) +
      (dimensions.originFit * activeWeights.origin);
    
    weightedScore = Math.round(rawSum / sumWeights);
  }

  // Apply penalty and clamp strictly between 0 and 100
  const finalScore = Math.min(100, Math.max(0, weightedScore - penalty));

  // Default fallback bullets if empty
  if (whyFitsId.length === 0) {
    whyFitsId.push(`Komposisi ${perfume.primary_family} yang seimbang dan fleksibel dipakai harian`);
    whyFitsEn.push(`Balanced ${perfume.primary_family} composition well-suited for versatile daily wear`);
  }

  return {
    perfume,
    matchScore: finalScore,
    dimensionScores: dimensions,
    whyFitsBulletsId: whyFitsId,
    whyFitsBulletsEn: whyFitsEn,
    possibleMismatchId,
    possibleMismatchEn
  };
}

/**
 * Computes recommendations for the catalog and sorts them by match score descending.
 */
export function rankRecommendations(
  perfumes: SeedPerfume[],
  answers: ScentQuizAnswers
): ScoredRecommendation[] {
  return perfumes
    .map(p => calculateMatchScore(p, answers))
    .sort((a, b) => b.matchScore - a.matchScore);
}
