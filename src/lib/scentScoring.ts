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
  };
}


// Sprint 3: read the Finder's saved quiz answers for match % displays.
// hasRealAnswers is false when nothing was saved OR when the saved answers
// are exactly the Flexible/Free defaults (defaults are not taste, so the
// cold-start banner shows instead of default-based match %).
export function readSavedQuizAnswers(): { answers: ScentQuizAnswers; hasRealAnswers: boolean } {
  try {
    const saved = localStorage.getItem('senstoria_quiz_answers_v2');
    if (!saved) return { answers: DEFAULT_QUIZ_ANSWERS, hasRealAnswers: false };
    const parsed = JSON.parse(saved) as ScentQuizAnswers;
    const hasRealAnswers = JSON.stringify(parsed) !== JSON.stringify(DEFAULT_QUIZ_ANSWERS);
    return { answers: parsed, hasRealAnswers };
  } catch {
    return { answers: DEFAULT_QUIZ_ANSWERS, hasRealAnswers: false };
  }
}

export const BASE_DIMENSION_WEIGHTS: Record<ScoredDimensionKey, number> = {
  notesFamily: 25,
  climate: 20,
  occasion: 20,
  longevity: 15,
  gender: 10,
  budget: 10
};

// D-06 (PRD section 11.4): a fit computed from a derived attribute (curator
// estimate, brand claim, skip-quiz versatility guess) can never exceed 0.85
// until verified by >=5 real wearer reviews. Verified attributes (brand
// official notes, brand-stated family/gender/occasion tags) are uncapped.
export const DERIVED_ATTRIBUTE_CAP = 0.85;

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
        citationId: `Didominasi oleh ${perfume.primary_family ?? 'keluarga yang belum tercatat'}, berbeda dari preferensi aroma yang kamu pilih.`,
        citationEn: `Driven by ${perfume.primary_family ?? 'an unrecorded family'}, differing from your chosen families.`
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
    const heat = perfume.heat_suitability; // 1 to 5, curator estimate; undefined = brand does not state it
    let fit = 0.70;

    if (heat === undefined) {
      dimensionFits.climate = {
        fit: null,
        isNoData: true,
        citationId: 'Kecocokan iklim belum dapat dinilai: brand tidak menyatakan ketahanan panas parfum ini.',
        citationEn: 'Climate fit cannot be assessed: the brand does not state this perfume\'s heat suitability.'
      };
    } else if (answers.climateSetting === 'outdoor_hot') {
      if (heat >= 4) {
        fit = 0.94;
        dimensionFits.climate = {
          fit,
          isNoData: false,
          citationId: `Estimasi kurator tahan panas tropis (rating panas ${heat}/5), tidak memicu pusing di siang hari.`,
          citationEn: `Curator estimate for tropical heat (heat rating ${heat}/5), avoids cloying in midday sun.`
        };
        whyFitsBulletsId.push(`Estimasi kurator: cocok untuk panas terik tropis (skor kecocokan cuaca ${heat}/5).`);
        whyFitsBulletsEn.push(`Curator estimate: suited to tropical heat and humidity (heat rating ${heat}/5).`);
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

  // D-06 derived cap: climate fit comes from the curator heat estimate, so it
  // can never exceed 0.85 until verified by >=5 real wearer reviews.
  if (!dimensionFits.climate.isNoData && dimensionFits.climate.fit !== null) {
    dimensionFits.climate.fit = Math.min(dimensionFits.climate.fit, DERIVED_ATTRIBUTE_CAP);
  }

  // 3. OCCASION (Weight: 20)
  // Sprint 3 (D-06 honest calibration): occasion is scored ONLY from the
  // perfume's verified canonical occasion_tags. The old inference from
  // concentration / projection / family / heat is DELETED: a guessed
  // occasion is worse than an honest NoData. Tag -> setting mapping:
  // office/daily -> daily_office, casual/date_night -> casual_dating,
  // formal/night_out -> formal_evening, sport -> outdoor_sport.
  // A tagged setting scores 0.92 (brand-stated = verified, uncapped); an
  // untagged setting scores 0.45 (a stated model judgment on known tags,
  // not a guessed occasion); no tags at all scores NoData.
  const occ = answers.occasionSetting || 'flexible';
  const OCCASION_TAG_TO_SETTING: Record<string, string> = {
    office: 'daily_office',
    daily: 'daily_office',
    casual: 'casual_dating',
    date_night: 'casual_dating',
    formal: 'formal_evening',
    night_out: 'formal_evening',
    sport: 'outdoor_sport'
  };
  if (occ === 'flexible' || occ === 'not_sure') {
    dimensionFits.occasion = {
      fit: null,
      isNoData: true,
      citationId: 'Situasi pemakaian bebas dan serbaguna.',
      citationEn: 'Versatile occasion without fixed setting.'
    };
  } else if (!perfume.occasion_tags || perfume.occasion_tags.length === 0) {
    dimensionFits.occasion = {
      fit: null,
      isNoData: true,
      citationId: 'Brand belum menyatakan situasi pemakaian parfum ini, jadi dimensi occasion tidak dinilai (tidak ditebak).',
      citationEn: 'The brand does not state usage occasions for this perfume, so the occasion dimension is not scored (never guessed).'
    };
  } else if (perfume.occasion_tags.some(t => OCCASION_TAG_TO_SETTING[t] === occ)) {
    dimensionFits.occasion = {
      fit: 0.92,
      isNoData: false,
      citationId: 'Brand menyatakan parfum ini cocok untuk situasi ini.',
      citationEn: 'The brand states this perfume suits this occasion.'
    };
    whyFitsBulletsId.push('Brand menyatakan parfum ini cocok untuk situasi yang kamu pilih.');
    whyFitsBulletsEn.push('The brand states this perfume suits your chosen occasion.');
  } else {
    dimensionFits.occasion = {
      fit: 0.45,
      isNoData: false,
      citationId: 'Brand tidak menandai parfum ini untuk situasi ini.',
      citationEn: 'The brand does not tag this perfume for this occasion.'
    };
  }

  // 4. LONGEVITY (Weight: 15)
  if (answers.longevityExpectation === 'not_sure') {
    dimensionFits.longevity = {
      fit: null,
      isNoData: true,
      citationId: 'Ekspektasi ketahanan aroma terbuka.',
      citationEn: 'Open longevity expectation.'
    };
  } else if (perfume.longevity_expected_band === 'unknown') {
    dimensionFits.longevity = {
      fit: null,
      isNoData: true,
      citationId: 'Ketahanan parfum ini belum dinyatakan brand, jadi dimensi longevity tidak dinilai.',
      citationEn: 'This perfume\'s longevity is not stated by the brand, so the longevity dimension is not scored.'
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
          citationId: `Ketahanan 6–8 jam sangat cocok untuk jam kerja seharian.`,
          citationEn: `6-8 hour skin longevity comfortably covers your standard workday.`
        };
        whyFitsBulletsId.push(`Estimasi ketahanan 6–8 jam (klaim brand/estimasi kurator, bukan data pemakai), pas untuk aktivitas dari pagi hingga sore.`);
        whyFitsBulletsEn.push(`Estimated 6–8 hour longevity (brand claim / curator estimate, not wearer data) aligned with your daily schedule.`);
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
          citationEn: 'High concentration with brand-claimed 8+ hour staying power into the evening.'
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

  // D-06 derived cap: longevity fit comes from the expected band (a brand
  // claim / curator estimate, not wearer data), so it can never exceed 0.85
  // until verified by >=5 real wearer reviews.
  if (!dimensionFits.longevity.isNoData && dimensionFits.longevity.fit !== null) {
    dimensionFits.longevity.fit = Math.min(dimensionFits.longevity.fit, DERIVED_ATTRIBUTE_CAP);
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
  } else if (perfume.gender_label === 'unknown') {
    dimensionFits.gender = {
      fit: null,
      isNoData: true,
      citationId: 'Brand belum menyatakan label gender parfum ini, jadi dimensi gender tidak dinilai.',
      citationEn: 'The brand does not state a gender label for this perfume, so the gender dimension is not scored.'
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
      if ((perfume.primary_family || '').toLowerCase().includes('gourmand') || allNotesLower.includes('caramel') || allNotesLower.includes('sugar') || allNotesLower.includes('vanilla')) {
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
    // Produces a realistic calibrated baseline score (average ~78; all estimates capped at 0.85 per D-06)
    const heatVersatility = perfume.heat_suitability === 4 ? 0.86 : perfume.heat_suitability === 3 ? 0.82 : perfume.heat_suitability === 5 ? 0.78 : 0.65;
    const longVersatility = perfume.longevity_expected_band === '6-8h' ? 0.86 : perfume.longevity_expected_band === '4-6h' ? 0.80 : perfume.longevity_expected_band === '8h+' ? 0.82 : 0.62;
    const famVersatility = ['fresh', 'woody', 'floral', 'aromatic'].some(f => (perfume.primary_family || '').toLowerCase().includes(f)) ? 0.84 : 0.76;
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
    // D-06: every versatility estimate is derived, so cap all at 0.85.
    for (const k of dimensionKeys) {
      versatilityFits[k] = Math.min(versatilityFits[k], DERIVED_ATTRIBUTE_CAP);
    }

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

  // D-06 shrinkage (Sprint 3): shrink the raw score toward the prior mean
  // when fewer dimensions were actually scored. W = sum of base weights of
  // scored dimensions; factor = 0.80 + 0.20 * (W / 100). In the all-skipped
  // branch all 6 dimensions score via versatility, so W = 100, factor = 1.
  // Order per PRD: shrinkage, then conflict cap, ceiling, avoidance penalty.
  // The breakdown rows sum to preAdjustmentScore; the adjustment row is
  // exactly finalScore - preAdjustmentScore, so points + adjustment = total.
  const scoredWeightSum = activeKeys.length > 0 ? activeBaseWeightSum : 100;
  const shrinkageFactor = 0.80 + 0.20 * (scoredWeightSum / 100);
  const shrunkScore = Math.round(preAdjustmentScore * shrinkageFactor);
  const afterShrinkage = shrunkScore;
  const afterConflict = hasConflict && afterShrinkage > 79 ? 79 : afterShrinkage;
  const afterCeiling = afterConflict > 96 ? 96 : afterConflict;
  const afterPenalty = avoidancePenalty > 0 ? Math.max(0, afterCeiling - avoidancePenalty) : afterCeiling;
  const finalScore = afterPenalty;

  // Calculate Adjustment Row if finalScore !== preAdjustmentScore
  let adjustment: ScoreAdjustment | null = null;
  const adjustmentPoints = finalScore - preAdjustmentScore;

  if (adjustmentPoints !== 0) {
    // Each delta telescopes: shrink + conflict + ceiling + penalty = final - pre.
    const shrinkDelta = afterShrinkage - preAdjustmentScore;
    const conflictDelta = afterConflict - afterShrinkage;
    const ceilingDelta = afterCeiling - afterConflict;
    const penaltyDelta = afterPenalty - afterCeiling;
    const partsId: string[] = [];
    const partsEn: string[] = [];
    if (shrinkDelta !== 0) {
      partsId.push(`Penyusutan kalibrasi ${shrinkDelta} poin (${activeKeys.length}/6 dimensi dinilai)`);
      partsEn.push(`Calibration shrinkage ${shrinkDelta} pts (${activeKeys.length}/6 dimensions scored)`);
    }
    if (conflictDelta !== 0) {
      partsId.push(`Batas konflik ${conflictDelta} poin (dimensi < 25% → maks 79%)`);
      partsEn.push(`Conflict cap ${conflictDelta} pts (dimension < 25% → max 79%)`);
    }
    if (ceilingDelta !== 0) {
      partsId.push(`Batas kalibrasi ${ceilingDelta} poin (maks 96%)`);
      partsEn.push(`Calibration ceiling ${ceilingDelta} pts (max 96%)`);
    }
    if (penaltyDelta !== 0) {
      partsId.push(`Penalti catatan dihindari ${penaltyDelta} poin`);
      partsEn.push(`Avoidance penalty ${penaltyDelta} pts`);
    }

    adjustment = {
      points: adjustmentPoints,
      reasonId: partsId.join(' + '),
      reasonEn: partsEn.join(' + ')
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
      possibleMismatchId = `Dominasi aroma didorong oleh nuansa ${perfume.primary_family ?? 'keluarga yang belum tercatat'}${perfume.secondary_family ? ` & ${perfume.secondary_family}` : ''}, yang kurang beririsan dengan keluarga aroma pilihanmu.`;
      possibleMismatchEn = `Driven by ${perfume.primary_family ?? 'an unrecorded family'}${perfume.secondary_family ? ` & ${perfume.secondary_family}` : ''} facets, showing lower overlap with your preferred olfactive families.`;
      break;
    case 'climate':
      possibleMismatchId = `Tingkat kecocokan cuaca panas berada di skor ${perfume.heat_suitability ?? '–'}/5; ${(perfume.heat_suitability ?? 3) <= 2 ? 'kurang ideal di terik siang hari outdoor tanpa ruangan ber-AC.' : 'aroma lebih bersinar saat sore atau cuaca sejuk.'}`;
      possibleMismatchEn = `Heat suitability is rated ${perfume.heat_suitability ?? '–'}/5; ${(perfume.heat_suitability ?? 3) <= 2 ? 'may feel heavy in outdoor midday heat without AC.' : 'wears better in cooler breezes or evening settings.'}`;
      break;
    case 'occasion':
      possibleMismatchId = `Karakter konsentrasi ${perfume.concentration} dan profil sillage (${perfume.projection_expected}/4) lebih condong ke situasi ${(perfume.heat_suitability ?? 3) >= 4 ? 'santai luar ruangan' : 'malam dan momen spesial'} daripada kebutuhan utamamu.`;
      possibleMismatchEn = `Concentration ${perfume.concentration} and projection (${perfume.projection_expected}/4) lean towards different occasions than your targeted setting.`;
      break;
    case 'longevity':
      possibleMismatchId = `Estimasi ketahanan berada di rentang ${perfume.longevity_expected_band}; disarankan membawa travel decant untuk semprot ulang sore hari.`;
      possibleMismatchEn = `Estimated longevity spans ${perfume.longevity_expected_band}; keeping a pocket decant for afternoon touch-ups is recommended.`;
      break;
    case 'gender':
      possibleMismatchId = `Karakter wewangian ini dirancang dengan label ${perfume.gender_label === 'masculine' ? 'maskulin tegas' : perfume.gender_label === 'feminine' ? 'feminin manis' : 'unisex netral'}, yang mungkin berbeda dari ekspresi yang kamu tuju.`;
      possibleMismatchEn = `Formulated with a distinctly ${perfume.gender_label} expression, which may differ from your desired personal projection.`;
      break;
    case 'budget':
      possibleMismatchId = `Harga referensi Rp ${perfume.reference_price_idr.toLocaleString('id-ID')} (${perfume.reference_price_size_ml} ml) berada di luar batas tier anggaran awalmu.`;
      possibleMismatchEn = `Reference price of Rp ${perfume.reference_price_idr.toLocaleString('en-US')} (${perfume.reference_price_size_ml} ml) falls outside your selected budget tier.`;
      break;
  }

  // Fallback for Why Fits bullets if empty — family-neutral when the brand
  // does not state a family (never interpolate an undefined family).
  if (whyFitsBulletsId.length === 0) {
    if (perfume.primary_family) {
      whyFitsBulletsId.push(`Komposisi ${perfume.primary_family} yang seimbang dan adaptif untuk berbagai kebutuhan.`);
      whyFitsBulletsEn.push(`Balanced ${perfume.primary_family} composition adaptable across various daily needs.`);
    } else {
      whyFitsBulletsId.push('Komposisi yang seimbang dan adaptif untuk berbagai kebutuhan.');
      whyFitsBulletsEn.push('Balanced composition adaptable across various daily needs.');
    }
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
      detailNoteEn: `Saves Rp ${diff.toLocaleString('en-US')} compared to top match with ${lowerBudgetMatch.matchScore}% score.`
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
