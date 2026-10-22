import { SeedPerfume } from '../data/seedPerfumes.ts';

export type ScoredDimensionKey = 'notesFamily' | 'climate' | 'occasion' | 'longevity' | 'gender' | 'budget';

export interface ScentQuizAnswers {
  preferredFamilies: string[]; // e.g. ['Woody', 'Fresh', 'Floral', 'Ambery', 'Gourmand', 'Aromatic'] or ['not_sure']
  climateSetting: string; // 'outdoor_hot' | 'indoor_ac' | 'evening_cool' | 'flexible'
  occasionSetting: string; // 'daily_office' | 'casual_dating' | 'formal_evening' | 'outdoor_sport' | 'flexible'
  longevityExpectation: string; // 'light' | 'moderate' | 'long' | 'not_sure'
  genderPreference: string; // 'feminine' | 'masculine' | 'unisex' | 'any'
  budgetTier: string; // 'budget' | 'mid' | 'premium' | 'flexible'
  avoidNotesOrTraits: string[]; // e.g. ['overly_sweet', 'heavy_smoke_oud', 'sharp_white_floral', 'none']
  // Optional backward compatibility fields:
  projectionPreference?: string;
  brandOriginPreference?: string;
}

export interface DimensionBreakdownRow {
  key: ScoredDimensionKey;
  labelId: string;
  labelEn: string;
  weight: number; // Normalized weight (sums to 100 across active dimensions)
  fit: number | null; // 0..1 or null if no data
  points: number; // Integer points assigned via largest-remainder method
  maxPoints: number; // Rounded target weight
  isNoData: boolean;
  citationId: string;
  citationEn: string;
}

export interface ScoreAdjustment {
  points: number; // Negative integer (e.g. -2, -5, -20)
  reasonId: string;
  reasonEn: string;
}

export interface ScoredRecommendation {
  perfume: SeedPerfume;
  matchScore: number; // 0 - 96 integer, strictly capped at 96
  rawPreAdjustmentScore: number;
  breakdownRows: DimensionBreakdownRow[];
  adjustment: ScoreAdjustment | null;
  weakestDimensionKey: ScoredDimensionKey;
  whyFitsBulletsId: string[];
  whyFitsBulletsEn: string[];
  possibleMismatchId: string;
  possibleMismatchEn: string;
  // Legacy compatibility accessor
  dimensionScores: {
    familyAffinity: number;
    climateFit: number;
    occasionFit: number;
    longevityFit: number;
    genderFit: number;
    budgetFit: number;
    sillageFit: number;
    originFit: number;
  };
}

export const BASE_DIMENSION_WEIGHTS: Record<ScoredDimensionKey, number> = {
  notesFamily: 25,
  climate: 20,
  occasion: 20,
  longevity: 15,
  gender: 10,
  budget: 10
};

export const DEFAULT_QUIZ_ANSWERS: ScentQuizAnswers = {
  preferredFamilies: ['not_sure'],
  climateSetting: 'flexible',
  occasionSetting: 'flexible',
  longevityExpectation: 'not_sure',
  genderPreference: 'any',
  budgetTier: 'flexible',
  avoidNotesOrTraits: ['none']
};

/**
 * Largest-Remainder Method (Hare-Niemeyer / Hamilton).
 * Distributes integer target total points across items based on their raw floating points,
 * ensuring the sum of integer points matches targetTotal exactly.
 */
export function distributePointsByLargestRemainder(
  items: { key: ScoredDimensionKey; rawPoints: number }[],
  targetTotal: number
): Map<ScoredDimensionKey, number> {
  const result = new Map<ScoredDimensionKey, number>();
  if (items.length === 0) return result;

  const floors = items.map(item => ({
    key: item.key,
    floor: Math.floor(item.rawPoints),
    remainder: item.rawPoints - Math.floor(item.rawPoints)
  }));

  const floorSum = floors.reduce((acc, curr) => acc + curr.floor, 0);
  let diff = targetTotal - floorSum;

  // Sort descending by remainder
  floors.sort((a, b) => b.remainder - a.remainder);

  for (const f of floors) {
    if (diff > 0) {
      result.set(f.key, f.floor + 1);
      diff--;
    } else {
      result.set(f.key, f.floor);
    }
  }

  return result;
}

/**
 * Deterministic 6-dimension scoring engine with score calibration:
 * 1. Notes & Family (25)
 * 2. Climate (20)
 * 3. Occasion (20)
 * 4. Longevity (15)
 * 5. Gender (10)
 * 6. Budget (10)
 *
 * Rules:
 * - Total base weights sum to 100.
 * - Sillage and Brand Origin are NOT scored dimensions.
 * - Renormalizes weights when an answer is "not_sure", "flexible", "any", or data is missing.
 * - Largest-remainder rounding ensures breakdown rows sum to pre-adjustment score.
 * - Hard cap every displayed score at 96 (never 97-100%).
 * - Conflict rule: if any active dimension fit < 0.25, total score capped at 79.
 * - Possible mismatch is generated dynamically from the weakest scored dimension.
 * - Strictly deterministic, grounded in quiz answers and perfume metadata.
 */
export function calculateMatchScore(
  perfume: SeedPerfume,
  answers: ScentQuizAnswers
): ScoredRecommendation {
  const dimensionFits: Record<ScoredDimensionKey, { fit: number | null; isNoData: boolean; citationId: string; citationEn: string }> = {
    notesFamily: { fit: null, isNoData: false, citationId: '', citationEn: '' },
    climate: { fit: null, isNoData: false, citationId: '', citationEn: '' },
    occasion: { fit: null, isNoData: false, citationId: '', citationEn: '' },
    longevity: { fit: null, isNoData: false, citationId: '', citationEn: '' },
    gender: { fit: null, isNoData: false, citationId: '', citationEn: '' },
    budget: { fit: null, isNoData: false, citationId: '', citationEn: '' }
  };

  const whyFitsBulletsId: string[] = [];
  const whyFitsBulletsEn: string[] = [];

  // 1. NOTES & FAMILY (Weight: 25)
  if (
    !answers.preferredFamilies ||
    answers.preferredFamilies.includes('not_sure') ||
    answers.preferredFamilies.length === 0
  ) {
    dimensionFits.notesFamily = {
      fit: null,
      isNoData: true,
      citationId: 'Eksplorasi terbuka tanpa batasan keluarga aroma.',
      citationEn: 'Open scent family preference without constraints.'
    };
  } else {
    const primFamily = (perfume.primary_family || '').toLowerCase();
    const secFamily = (perfume.secondary_family || '').toLowerCase();
    const allNotesLower = `${perfume.top_notes} ${perfume.heart_notes} ${perfume.base_notes}`.toLowerCase();

    const matchesPrim = answers.preferredFamilies.some(f => primFamily.includes(f.toLowerCase()));
    const matchesSec = secFamily.length > 0 && answers.preferredFamilies.some(f => secFamily.includes(f.toLowerCase()));
    
    // Check note overlap
    let noteOverlap = false;
    for (const f of answers.preferredFamilies) {
      const fl = f.toLowerCase();
      if (fl === 'woody' && (allNotesLower.includes('cedar') || allNotesLower.includes('sandalwood') || allNotesLower.includes('vetiver') || allNotesLower.includes('kayu'))) noteOverlap = true;
      if (fl === 'fresh' && (allNotesLower.includes('bergamot') || allNotesLower.includes('citrus') || allNotesLower.includes('lemon') || allNotesLower.includes('mandarin') || allNotesLower.includes('aquatic') || allNotesLower.includes('laut'))) noteOverlap = true;
      if (fl === 'floral' && (allNotesLower.includes('rose') || allNotesLower.includes('jasmine') || allNotesLower.includes('peony') || allNotesLower.includes('bunga') || allNotesLower.includes('mawar'))) noteOverlap = true;
      if (fl === 'gourmand' && (allNotesLower.includes('vanilla') || allNotesLower.includes('caramel') || allNotesLower.includes('coffee') || allNotesLower.includes('tonka') || allNotesLower.includes('manis'))) noteOverlap = true;
      if (fl === 'ambery' && (allNotesLower.includes('amber') || allNotesLower.includes('cardamom') || allNotesLower.includes('cinnamon') || allNotesLower.includes('rempah'))) noteOverlap = true;
      if (fl === 'aromatic' && (allNotesLower.includes('lavender') || allNotesLower.includes('sage') || allNotesLower.includes('mint') || allNotesLower.includes('tea') || allNotesLower.includes('teh'))) noteOverlap = true;
    }

    let fit = 0.20; // Default mismatch fit (< 0.25 triggers conflict rule)
    if (matchesPrim && matchesSec) {
      fit = 0.96;
      dimensionFits.notesFamily = {
        fit,
        isNoData: false,
        citationId: `Memadukan keluarga ${perfume.primary_family} dan ${perfume.secondary_family} yang sangat kamu sukai.`,
        citationEn: `Combines ${perfume.primary_family} and ${perfume.secondary_family} families matching your taste.`
      };
      whyFitsBulletsId.push(`Sesuai sempurna dengan keluarga aroma pilihan: ${perfume.primary_family} / ${perfume.secondary_family}.`);
      whyFitsBulletsEn.push(`Matches your preferred scent families: ${perfume.primary_family} / ${perfume.secondary_family}.`);
    } else if (matchesPrim) {
      fit = 0.90;
      dimensionFits.notesFamily = {
        fit,
        isNoData: false,
        citationId: `Karakter utama berakar pada keluarga ${perfume.primary_family} pilihanmu.`,
        citationEn: `Primary character is rooted in your chosen ${perfume.primary_family} family.`
      };
      whyFitsBulletsId.push(`Berasal dari keluarga aroma utama ${perfume.primary_family} yang kamu cari.`);
      whyFitsBulletsEn.push(`Rooted in your primary preferred ${perfume.primary_family} scent family.`);
    } else if (matchesSec) {
      fit = 0.80;
      dimensionFits.notesFamily = {
        fit,
        isNoData: false,
        citationId: `Menghadirkan sentuhan sekunder ${perfume.secondary_family} yang kamu sukai.`,
        citationEn: `Features secondary facets of ${perfume.secondary_family} aligned with your taste.`
      };
      whyFitsBulletsId.push(`Menampilkan nuansa sekunder ${perfume.secondary_family} yang sesuai seleramu.`);
      whyFitsBulletsEn.push(`Carries secondary ${perfume.secondary_family} notes you enjoy.`);
    } else if (noteOverlap) {
      fit = 0.60;
      dimensionFits.notesFamily = {
        fit,
        isNoData: false,
        citationId: `Memiliki irisan notes piramida (${perfume.top_notes.split(',')[0]}) yang berdekatan dengan seleramu.`,
        citationEn: `Shares note pyramid facets (${perfume.top_notes.split(',')[0]}) close to your preference.`
      };
    } else {
      fit = 0.20;
      dimensionFits.notesFamily = {
        fit,
        isNoData: false,
        citationId: `Didominasi oleh ${perfume.primary_family}, berbeda dari preferensi aroma yang kamu pilih.`,
        citationEn: `Driven by ${perfume.primary_family}, differing from your chosen families.`
      };
    }
  }

  // 2. CLIMATE (Weight: 20)
  if (answers.climateSetting === 'flexible') {
    dimensionFits.climate = {
      fit: null,
      isNoData: true,
      citationId: 'Pengaturan iklim fleksibel untuk berbagai kondisi.',
      citationEn: 'Flexible climate setting across diverse conditions.'
    };
  } else {
    const heat = perfume.heat_suitability; // 1 to 5
    let fit = 0.70;

    if (answers.climateSetting === 'outdoor_hot') {
      if (heat >= 4) {
        fit = 0.94;
        dimensionFits.climate = {
          fit,
          isNoData: false,
          citationId: `Formula teruji tahan panas tropis (rating panas ${heat}/5), tidak memicu pusing di siang hari.`,
          citationEn: `Tested for tropical heat (heat rating ${heat}/5), avoids cloying in midday sun.`
        };
        whyFitsBulletsId.push(`Formula tahan panas terik tropis (skor kecocokan cuaca ${heat}/5).`);
        whyFitsBulletsEn.push(`Calibrated for tropical heat and humidity (heat rating ${heat}/5).`);
      } else if (heat === 3) {
        fit = 0.70;
        dimensionFits.climate = {
          fit,
          isNoData: false,
          citationId: `Kecocokan cuaca panas berada di level sedang (${heat}/5); aman bila disemprot tipis.`,
          citationEn: `Moderate heat suitability (${heat}/5); best applied lightly outdoors.`
        };
      } else {
        fit = 0.20; // Conflict rule trigger
        dimensionFits.climate = {
          fit,
          isNoData: false,
          citationId: `Kepadatan aroma agak pekat (rating panas ${heat}/5) untuk aktivitas siang terik luar ruangan.`,
          citationEn: `Scent density (${heat}/5) is heavy for outdoor midday tropical heat.`
        };
      }
    } else if (answers.climateSetting === 'indoor_ac') {
      if (heat >= 2 && heat <= 4) {
        fit = 0.92;
        dimensionFits.climate = {
          fit,
          isNoData: false,
          citationId: 'Sangat stabil dan nyaman menyebar di ruang kantor atau kampus ber-AC.',
          citationEn: 'Exceptionally stable and pleasing in air-conditioned office or indoor settings.'
        };
        whyFitsBulletsId.push('Sangat nyaman dan berwibawa untuk ruangan ber-AC sepanjang hari.');
        whyFitsBulletsEn.push('Wears comfortably in full-day air-conditioned indoor environments.');
      } else if (heat === 5) {
        fit = 0.85;
        dimensionFits.climate = { fit, isNoData: false, citationId: 'Segar dan bersih di ruangan dingin.', citationEn: 'Crisp and fresh indoors.' };
      } else {
        fit = 0.75;
        dimensionFits.climate = { fit, isNoData: false, citationId: 'Aroma hangat bertahan baik di suhu sejuk AC.', citationEn: 'Warm notes perform well in cool AC temps.' };
      }
    } else if (answers.climateSetting === 'evening_cool') {
      if (heat <= 3) {
        fit = 0.94;
        dimensionFits.climate = {
          fit,
          isNoData: false,
          citationId: 'Notes dasar mekar sempurna di udara malam atau saat hujan sejuk.',
          citationEn: 'Base notes bloom gracefully during evening breezes and cool temperatures.'
        };
        whyFitsBulletsId.push('Karakter notes mekar anggun dan hangat pada malam hari.');
        whyFitsBulletsEn.push('Base notes bloom gracefully in evening and cool temperatures.');
      } else if (heat === 4) {
        fit = 0.70;
        dimensionFits.climate = { fit, isNoData: false, citationId: 'Lebih condong ke aroma siang daripada malam.', citationEn: 'Leans more daytime than evening.' };
      } else {
        fit = 0.45;
        dimensionFits.climate = { fit, isNoData: false, citationId: 'Aroma sangat ringan untuk suasana malam formal.', citationEn: 'Light composition for evening occasions.' };
      }
    }
  }

  // 3. OCCASION (Weight: 20)
  const occ = answers.occasionSetting || 'flexible';
  if (occ === 'flexible' || occ === 'not_sure') {
    dimensionFits.occasion = {
      fit: null,
      isNoData: true,
      citationId: 'Situasi pemakaian bebas dan serbaguna.',
      citationEn: 'Versatile occasion without fixed setting.'
    };
  } else {
    let fit = 0.75;
    const isEdpOrExtrait = perfume.concentration === 'EDP' || perfume.concentration === 'Extrait' || perfume.concentration === 'Parfum';
    const isLightEdcEdt = perfume.concentration === 'EDC' || perfume.concentration === 'EDT';
    const proj = perfume.projection_expected;

    if (occ === 'daily_office') {
      if (perfume.heat_suitability >= 3 && proj <= 3) {
        fit = 0.92;
        dimensionFits.occasion = {
          fit,
          isNoData: false,
          citationId: 'Proyeksi santun dan rapi, sangat sopan untuk ruang kerja profesional.',
          citationEn: 'Polite and refined projection, well-suited for workplace etiquette.'
        };
        whyFitsBulletsId.push('Jejak aroma sopan dan ramah untuk rekan kerja di kantor seharian.');
        whyFitsBulletsEn.push('Polite scent bubble appropriate for daily professional workplaces.');
      } else if (proj >= 4) {
        fit = 0.40;
        dimensionFits.occasion = {
          fit,
          isNoData: false,
          citationId: 'Proyeksi sangat kuat, berisiko mengganggu rekan kerja jika disemprot terlalu banyak.',
          citationEn: 'Very strong projection may overwhelm close colleagues if over-sprayed.'
        };
      } else {
        fit = 0.75;
        dimensionFits.occasion = { fit, isNoData: false, citationId: 'Cukup fleksibel untuk rutinitas harian.', citationEn: 'Adaptable for daily routine.' };
      }
    } else if (occ === 'casual_dating') {
      const isWarmOrSensual = perfume.primary_family.includes('Amber') || perfume.primary_family.includes('Gourmand') || perfume.primary_family.includes('Floral') || (perfume.secondary_family && (perfume.secondary_family.includes('Amber') || perfume.secondary_family.includes('Gourmand')));
      if (isWarmOrSensual && proj >= 2) {
        fit = 0.92;
        dimensionFits.occasion = {
          fit,
          isNoData: false,
          citationId: 'Nuansa hangat dan memikat, menciptakan daya tarik intim saat kencan atau santai malam.',
          citationEn: 'Inviting and alluring facets that create intimate magnetism for dates and evenings.'
        };
        whyFitsBulletsId.push('Menciptakan aura hangat dan memikat untuk kencan maupun acara santai.');
        whyFitsBulletsEn.push('Creates an alluring, warm presence tailored for dates and social evenings.');
      } else {
        fit = 0.70;
        dimensionFits.occasion = { fit, isNoData: false, citationId: 'Karakter aroma bersih namun lebih bernuansa kasual santai.', citationEn: 'Clean scent leaning more casually relaxed.' };
      }
    } else if (occ === 'formal_evening') {
      if (isEdpOrExtrait && proj >= 2) {
        fit = 0.92;
        dimensionFits.occasion = {
          fit,
          isNoData: false,
          citationId: 'Konsentrasi kaya dan berkelas untuk acara formal atau pesta malam.',
          citationEn: 'Rich, elevated concentration fitting formal gatherings and evening events.'
        };
        whyFitsBulletsId.push('Konsentrasi kaya dan berkelas untuk acara resmi atau pesta malam.');
        whyFitsBulletsEn.push('Elevated profile matching formal celebrations and special events.');
      } else if (isLightEdcEdt) {
        fit = 0.45;
        dimensionFits.occasion = {
          fit,
          isNoData: false,
          citationId: 'Format ringan yang kurang meninggalkan jejak mendalam di acara formal malam.',
          citationEn: 'Lighter format that may fade faster in formal evening venues.'
        };
      } else {
        fit = 0.70;
        dimensionFits.occasion = { fit, isNoData: false, citationId: 'Cukup anggun untuk acara semi-formal.', citationEn: 'Graceful for semi-formal events.' };
      }
    } else if (occ === 'outdoor_sport') {
      if (perfume.heat_suitability >= 4 && (perfume.primary_family.includes('Fresh') || perfume.primary_family.includes('Aromatic'))) {
        fit = 0.92;
        dimensionFits.occasion = {
          fit,
          isNoData: false,
          citationId: 'Kesegaran energik yang tetap bersih dan menyegarkan saat berolahraga.',
          citationEn: 'Energizing freshness that remains clean and crisp during active physical exertion.'
        };
        whyFitsBulletsId.push('Aroma segar berenergi yang menyatu harmonis dengan keringat saat aktif.');
        whyFitsBulletsEn.push('Energizing notes that wear cleanly during physical activities.');
      } else if (perfume.primary_family.includes('Gourmand') || perfume.primary_family.includes('Oud')) {
        fit = 0.20; // Conflict rule
        dimensionFits.occasion = {
          fit,
          isNoData: false,
          citationId: 'Aroma pekat manis yang berpotensi memicu rasa enek saat berolahraga.',
          citationEn: 'Sweet dense aroma that can feel cloying during athletic workout.'
        };
      } else {
        fit = 0.65;
        dimensionFits.occasion = { fit, isNoData: false, citationId: 'Dapat dipakai olahraga dengan semprotan tipis.', citationEn: 'Usable for casual workouts with light sprays.' };
      }
    }
  }

  // 4. LONGEVITY (Weight: 15)
  if (answers.longevityExpectation === 'not_sure') {
    dimensionFits.longevity = {
      fit: null,
      isNoData: true,
      citationId: 'Ekspektasi ketahanan aroma terbuka.',
      citationEn: 'Open longevity expectation.'
    };
  } else {
    const band = perfume.longevity_expected_band;
    let fit = 0.75;

    if (answers.longevityExpectation === 'light') {
      if (band === '<2h' || band === '2-4h' || band === '4-6h') {
        fit = 0.92;
        dimensionFits.longevity = { fit, isNoData: false, citationId: `Durasi ${band} ideal untuk pemakaian santai tanpa mengikat.`, citationEn: `Longevity ${band} fits quick or casual transitions.` };
      } else {
        fit = 0.70;
        dimensionFits.longevity = { fit, isNoData: false, citationId: `Ketahanan ${band} sedikit lebih tahan lama dari yang dicari.`, citationEn: `Longevity ${band} lasts somewhat longer than requested.` };
      }
    } else if (answers.longevityExpectation === 'moderate') {
      if (band === '6-8h') {
        fit = 0.94;
        dimensionFits.longevity = {
          fit,
          isNoData: false,
          citationId: `Daya tahan kulit 6-8 jam sangat cocok untuk jam kerja seharian.`,
          citationEn: `6-8 hour skin longevity comfortably covers your standard workday.`
        };
        whyFitsBulletsId.push(`Daya tahan kulit 6–8 jam teruji, pas untuk aktivitas dari pagi hingga sore.`);
        whyFitsBulletsEn.push(`Tested 6–8 hour skin longevity aligned with your daily schedule.`);
      } else if (band === '4-6h' || band === '8h+') {
        fit = 0.80;
        dimensionFits.longevity = { fit, isNoData: false, citationId: `Ketahanan ${band} mendekati durasi yang diinginkan.`, citationEn: `Longevity ${band} aligns closely with daily needs.` };
      } else {
        fit = 0.20; // Conflict rule trigger (<2h or 2-4h vs moderate)
        dimensionFits.longevity = {
          fit,
          isNoData: false,
          citationId: `Ketahanan tergolong singkat (${band}); perlu membawa travel decant untuk semprot ulang.`,
          citationEn: `Longevity is shorter (${band}); reapplication decant will be needed.`
        };
      }
    } else if (answers.longevityExpectation === 'long') {
      if (band === '8h+') {
        fit = 0.94;
        dimensionFits.longevity = {
          fit,
          isNoData: false,
          citationId: 'Konsentrasi ekstra dengan performa tahan lama 8+ jam hingga malam.',
          citationEn: 'High concentration with proven 8+ hour staying power into the evening.'
        };
        whyFitsBulletsId.push('Konsentrasi tinggi dengan ketahanan ekstra panjang (8+ jam).');
        whyFitsBulletsEn.push('High concentration delivering long-lasting staying power (8+ hours).');
      } else if (band === '6-8h') {
        fit = 0.80;
        dimensionFits.longevity = { fit, isNoData: false, citationId: 'Ketahanan 6-8 jam bertahan baik hingga sore.', citationEn: 'Solid 6-8 hour endurance.' };
      } else {
        fit = 0.20; // Conflict rule trigger
        dimensionFits.longevity = {
          fit,
          isNoData: false,
          citationId: `Ketahanan (${band}) tidak memenuhi target tahan seharian penuh tanpa semprot ulang.`,
          citationEn: `Performance (${band}) does not meet your full-day longevity target.`
        };
      }
    }
  }

  // 5. GENDER (Weight: 10)
  const gPref = answers.genderPreference || 'any';
  if (gPref === 'any' || gPref === 'not_sure') {
    dimensionFits.gender = {
      fit: null,
      isNoData: true,
      citationId: 'Bebas ekspresi gender tanpa sekat kategorisasi.',
      citationEn: 'Unrestricted gender expression.'
    };
  } else {
    const label = perfume.gender_label; // 'feminine' | 'masculine' | 'unisex'
    let fit = 0.60;

    if (gPref === 'unisex') {
      if (label === 'unisex') {
        fit = 0.92;
        dimensionFits.gender = { fit, isNoData: false, citationId: 'Komposisi unisex universal yang luwes dipakai siapa pun.', citationEn: 'Universal unisex balance wearable by anyone.' };
        whyFitsBulletsId.push('Profil aroma unisex universal yang elegan tanpa sekat gender.');
        whyFitsBulletsEn.push('Universal unisex profile offering versatile gender-neutral appeal.');
      } else {
        fit = 0.60;
        dimensionFits.gender = { fit, isNoData: false, citationId: `Profil resmi berlabel ${label}, namun tetap bisa dipakai lintas gender.`, citationEn: `Officially labeled ${label}, yet wearable across genders.` };
      }
    } else if (gPref === 'feminine') {
      if (label === 'feminine') {
        fit = 0.92;
        dimensionFits.gender = { fit, isNoData: false, citationId: 'Dirancang dengan keanggunan profil feminin yang kamu cari.', citationEn: 'Formulated with feminine grace aligned with your preference.' };
        whyFitsBulletsId.push('Karakter aroma feminin yang anggun dan selaras dengan gayamu.');
        whyFitsBulletsEn.push('Graceful feminine profile that matches your style.');
      } else if (label === 'unisex') {
        fit = 0.85;
        dimensionFits.gender = { fit, isNoData: false, citationId: 'Profil unisex dengan nuansa manis-floral yang nyaman.', citationEn: 'Unisex profile with pleasant soft touches.' };
      } else {
        fit = 0.20; // Conflict rule trigger (< 0.25)
        dimensionFits.gender = { fit, isNoData: false, citationId: 'Profil wewangian ini condong tegas maskulin.', citationEn: 'This perfume leans distinctly masculine.' };
      }
    } else if (gPref === 'masculine') {
      if (label === 'masculine') {
        fit = 0.92;
        dimensionFits.gender = { fit, isNoData: false, citationId: 'Membawa karakter tegas maskulin sesuai yang kamu inginkan.', citationEn: 'Confident masculine profile meeting your expectation.' };
        whyFitsBulletsId.push('Menampilkan karakter tegas maskulin yang bersih dan berwibawa.');
        whyFitsBulletsEn.push('Confident masculine profile delivering clean authority.');
      } else if (label === 'unisex') {
        fit = 0.85;
        dimensionFits.gender = { fit, isNoData: false, citationId: 'Profil unisex dengan sentuhan kayu dan rempah yang cocok.', citationEn: 'Unisex profile with well-grounded woody notes.' };
      } else {
        fit = 0.20; // Conflict rule trigger (< 0.25)
        dimensionFits.gender = { fit, isNoData: false, citationId: 'Profil wewangian ini condong feminin dan manis bunga.', citationEn: 'This perfume leans predominantly feminine.' };
      }
    }
  }

  // 6. BUDGET (Weight: 10)
  if (answers.budgetTier === 'flexible') {
    dimensionFits.budget = {
      fit: null,
      isNoData: true,
      citationId: 'Rentang anggaran fleksibel.',
      citationEn: 'Flexible budget across all tiers.'
    };
  } else {
    const price = perfume.reference_price_idr;
    let fit = 0.70;

    if (answers.budgetTier === 'budget') { // < 250k
      if (price <= 250000) {
        fit = 0.92;
        dimensionFits.budget = {
          fit,
          isNoData: false,
          citationId: `Harga referensi Rp ${price.toLocaleString('id-ID')} masuk dalam anggaran hemat (< Rp 250.000).`,
          citationEn: `Reference price fits within your budget tier (< Rp 250,000).`
        };
        whyFitsBulletsId.push(`Harga resmi sangat terjangkau (di bawah Rp 250.000).`);
        whyFitsBulletsEn.push(`Official price is friendly and within your budget (< Rp 250,000).`);
      } else if (price <= 350000) {
        fit = 0.70;
        dimensionFits.budget = { fit, isNoData: false, citationId: 'Sedikit di atas anggaran awal namun memberikan nilai tinggi.', citationEn: 'Slightly above initial budget but offers high value.' };
      } else {
        fit = 0.15; // Conflict rule trigger (< 0.25)
        dimensionFits.budget = { fit, isNoData: false, citationId: `Harga referensi Rp ${price.toLocaleString('id-ID')} melampaui tier anggaran hematmu.`, citationEn: `Price exceeds your budget threshold.` };
      }
    } else if (answers.budgetTier === 'mid') { // 250k - 600k
      if (price >= 200000 && price <= 650000) {
        fit = 0.92;
        dimensionFits.budget = {
          fit,
          isNoData: false,
          citationId: `Harga referensi Rp ${price.toLocaleString('id-ID')} pas di rentang menengah (Rp 250k–600k).`,
          citationEn: `Reference price fits squarely in mid-tier range (Rp 250k–600k).`
        };
        whyFitsBulletsId.push(`Harga referensi seimbang di tier menengah (Rp 250.000 – Rp 600.000).`);
        whyFitsBulletsEn.push(`Well-balanced pricing in your targeted mid-tier range.`);
      } else if (price < 200000) {
        fit = 0.85;
        dimensionFits.budget = { fit, isNoData: false, citationId: 'Lebih ekonomis dari tier anggaran menengah.', citationEn: 'More economical than mid-tier.' };
      } else {
        fit = 0.40;
        dimensionFits.budget = { fit, isNoData: false, citationId: 'Berada di atas batas menengah.', citationEn: 'Above mid-tier threshold.' };
      }
    } else if (answers.budgetTier === 'premium') { // > 600k
      if (price >= 600000) {
        fit = 0.92;
        dimensionFits.budget = { fit, isNoData: false, citationId: 'Kategori premium dengan formulasi artisan/desainer berbobot.', citationEn: 'Premium category with refined ingredients.' };
        whyFitsBulletsId.push('Formula artisan bernilai tinggi pada kategori premium.');
        whyFitsBulletsEn.push('Elevated formulation matching premium expectations.');
      } else if (price >= 400000) {
        fit = 0.75;
        dimensionFits.budget = { fit, isNoData: false, citationId: 'Kategori semi-premium berkualitas tinggi.', citationEn: 'High quality semi-premium value.' };
      } else {
        fit = 0.60;
        dimensionFits.budget = { fit, isNoData: false, citationId: 'Harga lebih terjangkau dari ekspektasi premium.', citationEn: 'Priced lower than typical premium tier.' };
      }
    }
  }

  // 7. AVOIDANCE PENALTY CHECK (-20 pts if matches an avoided trait)
  let avoidancePenalty = 0;
  let avoidanceReasonId = '';
  let avoidanceReasonEn = '';
  if (answers.avoidNotesOrTraits && !answers.avoidNotesOrTraits.includes('none')) {
    const allNotesLower = `${perfume.top_notes} ${perfume.heart_notes} ${perfume.base_notes}`.toLowerCase();
    
    if (answers.avoidNotesOrTraits.includes('overly_sweet')) {
      if (perfume.primary_family.toLowerCase().includes('gourmand') || allNotesLower.includes('caramel') || allNotesLower.includes('sugar') || allNotesLower.includes('vanilla')) {
        avoidancePenalty += 20;
        avoidanceReasonId = 'Mengandung notes manis gourmand yang ingin kamu hindari.';
        avoidanceReasonEn = 'Contains sweet gourmand notes you prefer to avoid.';
      }
    }

    if (answers.avoidNotesOrTraits.includes('heavy_smoke_oud')) {
      if (allNotesLower.includes('oud') || allNotesLower.includes('agarwood') || allNotesLower.includes('smoke') || allNotesLower.includes('incense') || allNotesLower.includes('dupa')) {
        avoidancePenalty += 20;
        avoidanceReasonId = 'Mengandung aksen oud atau dupa yang ingin kamu hindari.';
        avoidanceReasonEn = 'Features incense or oud facets you prefer to avoid.';
      }
    }

    if (answers.avoidNotesOrTraits.includes('sharp_white_floral')) {
      if (allNotesLower.includes('tuberose') || allNotesLower.includes('jasmine') || allNotesLower.includes('sedap malam') || allNotesLower.includes('melati')) {
        avoidancePenalty += 20;
        avoidanceReasonId = 'Terdapat notes floral putih tajam (tuberose/melati) yang ingin kamu hindari.';
        avoidanceReasonEn = 'Contains prominent white floral notes you prefer to avoid.';
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // WEIGHT RENORMALIZATION & LARGEST-REMAINDER POINTS ALLOCATION
  // ══════════════════════════════════════════════════════════════════════
  const dimensionKeys: ScoredDimensionKey[] = ['notesFamily', 'climate', 'occasion', 'longevity', 'gender', 'budget'];
  const activeKeys = dimensionKeys.filter(k => !dimensionFits[k].isNoData && dimensionFits[k].fit !== null);
  const activeBaseWeightSum = activeKeys.reduce((acc, k) => acc + BASE_DIMENSION_WEIGHTS[k], 0);

  const normalizedWeights: Record<ScoredDimensionKey, number> = {
    notesFamily: 0,
    climate: 0,
    occasion: 0,
    longevity: 0,
    gender: 0,
    budget: 0
  };

  const rawPointsPerDimension: Record<ScoredDimensionKey, number> = {
    notesFamily: 0,
    climate: 0,
    occasion: 0,
    longevity: 0,
    gender: 0,
    budget: 0
  };

  let rawTotalScore = 0;

  if (activeBaseWeightSum > 0) {
    for (const k of activeKeys) {
      const weight = (BASE_DIMENSION_WEIGHTS[k] / activeBaseWeightSum) * 100;
      normalizedWeights[k] = Number(weight.toFixed(2));
      const fit = dimensionFits[k].fit ?? 0.75;
      const pts = fit * weight;
      rawPointsPerDimension[k] = pts;
      rawTotalScore += pts;
    }
  } else {
    // Open / skipped quiz mode: evaluate universal versatile wearability
    // Produces a realistic calibrated baseline score between 68 and 85 (average ~78)
    const heatVersatility = perfume.heat_suitability === 4 ? 0.86 : perfume.heat_suitability === 3 ? 0.82 : perfume.heat_suitability === 5 ? 0.78 : 0.65;
    const longVersatility = perfume.longevity_expected_band === '6-8h' ? 0.86 : perfume.longevity_expected_band === '4-6h' ? 0.80 : perfume.longevity_expected_band === '8h+' ? 0.82 : 0.62;
    const famVersatility = ['fresh', 'woody', 'floral', 'aromatic'].some(f => perfume.primary_family.toLowerCase().includes(f)) ? 0.84 : 0.76;
    const occVersatility = perfume.projection_expected === 2 || perfume.projection_expected === 3 ? 0.84 : 0.72;
    const genVersatility = perfume.gender_label === 'unisex' ? 0.86 : 0.78;
    const budVersatility = perfume.reference_price_idr <= 400000 ? 0.86 : perfume.reference_price_idr <= 700000 ? 0.80 : 0.70;

    const versatilityFits: Record<ScoredDimensionKey, number> = {
      notesFamily: famVersatility,
      climate: heatVersatility,
      occasion: occVersatility,
      longevity: longVersatility,
      gender: genVersatility,
      budget: budVersatility
    };

    for (const k of dimensionKeys) {
      normalizedWeights[k] = BASE_DIMENSION_WEIGHTS[k];
      const pts = versatilityFits[k] * BASE_DIMENSION_WEIGHTS[k];
      rawPointsPerDimension[k] = pts;
      rawTotalScore += pts;
    }
  }

  const preAdjustmentScore = Math.round(rawTotalScore);

  // Allocate integer points via Largest-Remainder Method to sum EXACTLY to preAdjustmentScore
  const itemsForRounding = (activeBaseWeightSum > 0 ? activeKeys : dimensionKeys).map(k => ({
    key: k,
    rawPoints: rawPointsPerDimension[k]
  }));
  const pointsMap = distributePointsByLargestRemainder(itemsForRounding, preAdjustmentScore);

  // ══════════════════════════════════════════════════════════════════════
  // CALIBRATION & CONFLICT RULES
  // ══════════════════════════════════════════════════════════════════════
  let hasConflict = false;
  let lowestFit = 1.0;
  let weakestDimensionKey: ScoredDimensionKey = 'notesFamily';

  if (activeKeys.length > 0) {
    for (const k of activeKeys) {
      const f = dimensionFits[k].fit;
      if (f !== null) {
        if (f < lowestFit) {
          lowestFit = f;
          weakestDimensionKey = k;
        }
        if (f < 0.25) {
          hasConflict = true;
        }
      }
    }
  } else {
    // If all skipped / open, determine weakest dimension by relative raw points
    let minPts = 999;
    for (const k of dimensionKeys) {
      const p = rawPointsPerDimension[k];
      if (p < minPts) {
        minPts = p;
        weakestDimensionKey = k;
      }
    }
  }

  // Determine final score after caps and penalties
  let finalScore = preAdjustmentScore;

  // Conflict Rule: if any active fit < 0.25, total may not exceed 79
  if (hasConflict && finalScore > 79) {
    finalScore = 79;
  }

  // Calibration Rule: hard cap every displayed score at 96
  if (finalScore > 96) {
    finalScore = 96;
  }

  // Avoidance penalty
  if (avoidancePenalty > 0) {
    finalScore = Math.max(0, finalScore - avoidancePenalty);
  }

  // Calculate Adjustment Row if finalScore !== preAdjustmentScore
  let adjustment: ScoreAdjustment | null = null;
  const adjustmentPoints = finalScore - preAdjustmentScore;

  if (adjustmentPoints !== 0) {
    let reasonId = '';
    let reasonEn = '';

    if (avoidancePenalty > 0 && hasConflict) {
      reasonId = `Penalti catatan dihindari (-${avoidancePenalty} poin) dan batas konflik dimensi (< 25%).`;
      reasonEn = `Avoidance penalty (-${avoidancePenalty} pts) and dimension conflict cap (< 25%).`;
    } else if (avoidancePenalty > 0) {
      reasonId = `Penalti catatan yang dihindari (${avoidanceReasonId || `-${avoidancePenalty} poin`}).`;
      reasonEn = `Avoidance penalty for disliked facet (${avoidanceReasonEn || `-${avoidancePenalty} pts`}).`;
    } else if (hasConflict && preAdjustmentScore > 79) {
      reasonId = 'Penyesuaian batas konflik: terdapat dimensi yang tidak sesuai (< 25%, dibatasi maks 79%).';
      reasonEn = 'Dimension conflict cap: contains a facet below 25% fit (capped at max 79%).';
    } else if (preAdjustmentScore > 96) {
      reasonId = 'Batas kalibrasi sistem: skor kecocokan maksimum dibatasi 96%.';
      reasonEn = 'System calibration ceiling: maximum match score capped at 96%.';
    } else {
      reasonId = 'Penyesuaian bukti kalibrasi skor.';
      reasonEn = 'Evidence-shrinkage calibration adjustment.';
    }

    adjustment = {
      points: adjustmentPoints,
      reasonId,
      reasonEn
    };
  }

  // Build 6 Breakdown Rows
  const dimensionLabels: Record<ScoredDimensionKey, { id: string; en: string }> = {
    notesFamily: { id: 'Notes & Karakter Aroma', en: 'Notes & Family' },
    climate: { id: 'Iklim Tropis', en: 'Climate' },
    occasion: { id: 'Acara & Momen', en: 'Occasion' },
    longevity: { id: 'Ketahanan Kulit', en: 'Longevity' },
    gender: { id: 'Ekspresi Gender', en: 'Gender' },
    budget: { id: 'Kesesuaian Anggaran', en: 'Budget' }
  };

  const breakdownRows: DimensionBreakdownRow[] = dimensionKeys.map(key => {
    const isNoData = dimensionFits[key].isNoData;
    const fit = dimensionFits[key].fit;
    const weight = isNoData ? BASE_DIMENSION_WEIGHTS[key] : (normalizedWeights[key] || BASE_DIMENSION_WEIGHTS[key]);
    const points = pointsMap.get(key) || 0;

    return {
      key,
      labelId: dimensionLabels[key].id,
      labelEn: dimensionLabels[key].en,
      weight: Math.round(weight),
      fit,
      points,
      maxPoints: Math.round(weight),
      isNoData,
      citationId: dimensionFits[key].citationId || 'Standar versatilitas aroma harian.',
      citationEn: dimensionFits[key].citationEn || 'Standard daily versatile profile.'
    };
  });

  // ══════════════════════════════════════════════════════════════════════
  // GENERATE DYNAMIC "POSSIBLE MISMATCH" (From Weakest Dimension - Never Generic!)
  // ══════════════════════════════════════════════════════════════════════
  let possibleMismatchId = '';
  let possibleMismatchEn = '';

  switch (weakestDimensionKey) {
    case 'notesFamily':
      possibleMismatchId = `Dominasi aroma didorong oleh nuansa ${perfume.primary_family}${perfume.secondary_family ? ` & ${perfume.secondary_family}` : ''}, yang kurang beririsan dengan keluarga aroma pilihanmu.`;
      possibleMismatchEn = `Driven by ${perfume.primary_family}${perfume.secondary_family ? ` & ${perfume.secondary_family}` : ''} facets, showing lower overlap with your preferred olfactive families.`;
      break;
    case 'climate':
      possibleMismatchId = `Tingkat kecocokan cuaca panas berada di skor ${perfume.heat_suitability}/5; ${perfume.heat_suitability <= 2 ? 'kurang ideal di terik siang hari outdoor tanpa ruangan ber-AC.' : 'aroma lebih bersinar saat sore atau cuaca sejuk.'}`;
      possibleMismatchEn = `Heat suitability is rated ${perfume.heat_suitability}/5; ${perfume.heat_suitability <= 2 ? 'may feel heavy in outdoor midday heat without AC.' : 'wears better in cooler breezes or evening settings.'}`;
      break;
    case 'occasion':
      possibleMismatchId = `Karakter konsentrasi ${perfume.concentration} dan profil sillage (${perfume.projection_expected}/4) lebih condong ke situasi ${perfume.heat_suitability >= 4 ? 'santai luar ruangan' : 'malam dan momen spesial'} daripada kebutuhan utamamu.`;
      possibleMismatchEn = `Concentration ${perfume.concentration} and projection (${perfume.projection_expected}/4) lean towards different occasions than your targeted setting.`;
      break;
    case 'longevity':
      possibleMismatchId = `Daya tahan kulit teruji berada di rentang ${perfume.longevity_expected_band}; disarankan membawa travel decant untuk semprot ulang sore hari.`;
      possibleMismatchEn = `Tested skin longevity spans ${perfume.longevity_expected_band}; keeping a pocket decant for afternoon touch-ups is recommended.`;
      break;
    case 'gender':
      possibleMismatchId = `Karakter wewangian ini dirancang dengan label ${perfume.gender_label === 'masculine' ? 'maskulin tegas' : perfume.gender_label === 'feminine' ? 'feminin manis' : 'unisex netral'}, yang mungkin berbeda dari ekspresi yang kamu tuju.`;
      possibleMismatchEn = `Formulated with a distinctly ${perfume.gender_label} expression, which may differ from your desired personal projection.`;
      break;
    case 'budget':
      possibleMismatchId = `Harga referensi Rp ${perfume.reference_price_idr.toLocaleString('id-ID')} (${perfume.reference_price_size_ml} ml) berada di luar batas tier anggaran awalmu.`;
      possibleMismatchEn = `Reference price of Rp ${perfume.reference_price_idr.toLocaleString('id-ID')} (${perfume.reference_price_size_ml} ml) falls outside your selected budget tier.`;
      break;
  }

  // Fallback for Why Fits bullets if empty
  if (whyFitsBulletsId.length === 0) {
    whyFitsBulletsId.push(`Komposisi ${perfume.primary_family} yang seimbang dan adaptif untuk berbagai kebutuhan.`);
    whyFitsBulletsEn.push(`Balanced ${perfume.primary_family} composition adaptable across various daily needs.`);
  }

  return {
    perfume,
    matchScore: finalScore,
    rawPreAdjustmentScore: preAdjustmentScore,
    breakdownRows,
    adjustment,
    weakestDimensionKey,
    whyFitsBulletsId,
    whyFitsBulletsEn,
    possibleMismatchId,
    possibleMismatchEn,
    dimensionScores: {
      familyAffinity: Math.round((dimensionFits.notesFamily.fit ?? 0.75) * 100),
      climateFit: Math.round((dimensionFits.climate.fit ?? 0.75) * 100),
      occasionFit: Math.round((dimensionFits.occasion.fit ?? 0.75) * 100),
      longevityFit: Math.round((dimensionFits.longevity.fit ?? 0.75) * 100),
      genderFit: Math.round((dimensionFits.gender.fit ?? 0.75) * 100),
      budgetFit: Math.round((dimensionFits.budget.fit ?? 0.75) * 100),
      sillageFit: 70, // Non-scored legacy
      originFit: perfume.origin === 'ID' ? 100 : 50 // Non-scored legacy
    }
  };
}

/**
 * Computes recommendations across perfumes, sorted descending by matchScore.
 * Optionally filters out owned perfumes when excludePerfumeIds is provided.
 */
export function rankRecommendations(
  perfumes: SeedPerfume[],
  answers: ScentQuizAnswers,
  excludePerfumeIds: string[] = []
): ScoredRecommendation[] {
  const candidates = excludePerfumeIds.length > 0
    ? perfumes.filter(p => !excludePerfumeIds.includes(p.id))
    : perfumes;

  return candidates
    .map(p => calculateMatchScore(p, answers))
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Finds up to 3 qualified alternatives (Requirement 8):
 * 1. "Lower budget" (cheaper reference price than top result, matchScore >= 60)
 * 2. "Local alternative" (origin === 'ID' if top is INT, or origin === 'INT' if top is ID, matchScore >= 60)
 * 3. "Stretch pick" (higher budget or niche/indie profile, matchScore >= 60)
 */
export interface FinderAlternative {
  type: 'lower_budget' | 'local_alt' | 'stretch_pick';
  badgeLabelId: string;
  badgeLabelEn: string;
  recommendation: ScoredRecommendation;
  detailNoteId: string;
  detailNoteEn: string;
}

export function findQualifiedAlternatives(
  topRecommendation: ScoredRecommendation,
  allRanked: ScoredRecommendation[]
): FinderAlternative[] {
  const alternatives: FinderAlternative[] = [];
  const top = topRecommendation.perfume;
  const otherRanked = allRanked.filter(r => r.perfume.id !== top.id && r.matchScore >= 60);

  // 1. Lower budget alternative (cheaper than top result)
  const lowerBudgetMatch = otherRanked.find(r => r.perfume.reference_price_idr < top.reference_price_idr);
  if (lowerBudgetMatch) {
    const diff = top.reference_price_idr - lowerBudgetMatch.perfume.reference_price_idr;
    alternatives.push({
      type: 'lower_budget',
      badgeLabelId: 'Pilihan Lebih Hemat',
      badgeLabelEn: 'Lower Budget Option',
      recommendation: lowerBudgetMatch,
      detailNoteId: `Lebih hemat Rp ${diff.toLocaleString('id-ID')} dibanding pilihan utama, tetap dengan skor kecocokan ${lowerBudgetMatch.matchScore}%.`,
      detailNoteEn: `Saves Rp ${diff.toLocaleString('id-ID')} compared to top match with ${lowerBudgetMatch.matchScore}% score.`
    });
  }

  // 2. Local alternative (origin === 'ID' if top is INT, or origin === 'INT' if top is ID)
  const targetOrigin = top.origin === 'ID' ? 'INT' : 'ID';
  const originMatch = otherRanked.find(r => 
    r.perfume.origin === targetOrigin && 
    r.perfume.id !== lowerBudgetMatch?.perfume.id
  );
  if (originMatch) {
    const isLocal = targetOrigin === 'ID';
    alternatives.push({
      type: 'local_alt',
      badgeLabelId: isLocal ? 'Alternatif Brand Lokal' : 'Alternatif Desainer Global',
      badgeLabelEn: isLocal ? 'Local Pride Alternative' : 'Global Designer Alternative',
      recommendation: originMatch,
      detailNoteId: isLocal
        ? `Karya artisan Indonesia dengan ketahanan iklim tropis prima (skor ${originMatch.matchScore}%).`
        : `Pilihan desainer internasional ternama dengan skor kecocokan ${originMatch.matchScore}%.`,
      detailNoteEn: isLocal
        ? `Indonesian artisanal creation calibrated for tropical humidity (${originMatch.matchScore}% match).`
        : `International designer pick matching your taste profile (${originMatch.matchScore}% match).`
    });
  }

  // 3. Stretch pick (higher budget or niche craft)
  const stretchMatch = otherRanked.find(r => 
    r.perfume.id !== top.id &&
    r.perfume.id !== lowerBudgetMatch?.perfume.id &&
    r.perfume.id !== originMatch?.perfume.id &&
    (r.perfume.reference_price_idr > top.reference_price_idr || r.perfume.market_tier === 'niche')
  );
  if (stretchMatch) {
    alternatives.push({
      type: 'stretch_pick',
      badgeLabelId: 'Pilihan Tingkat Lanjut (Stretch Pick)',
      badgeLabelEn: 'Stretch Pick (Elevated Craft)',
      recommendation: stretchMatch,
      detailNoteId: `Komposisi lebih kompleks dan kaya dimensi (skor kecocokan ${stretchMatch.matchScore}%).`,
      detailNoteEn: `Rich, complex composition offering an elevated olfactive experience (${stretchMatch.matchScore}% match).`
    });
  }

  return alternatives.slice(0, 3);
}
