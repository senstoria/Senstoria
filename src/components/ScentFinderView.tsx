import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  RotateCcw, 
  Heart, 
  Layers, 
  ExternalLink, 
  AlertTriangle,
  Info,
  SlidersHorizontal,
  ChevronRight,
  Compass,
  Bookmark,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  PackageCheck
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { 
  ScentQuizAnswers, 
  DEFAULT_QUIZ_ANSWERS, 
  calculateMatchScore, 
  rankRecommendations, 
  findQualifiedAlternatives,
  FinderAlternative,
  ScoredRecommendation,
  DimensionBreakdownRow,
  BASE_DIMENSION_WEIGHTS
} from '../lib/scentScoring.ts';
import { CATALOG_FAMILIES, largestRemainderRound } from '../lib/derivedCalculations.ts';
import { translations, fmt, Locale, formatCurrency } from '../lib/i18n.ts';

const ScentDnaRadarChart = React.lazy(() => import('./ScentDnaRadarChart.tsx'));

interface ScentFinderViewProps {
  perfumes: SeedPerfume[];
  ownedPerfumeIds?: string[];
  wishlistIds: string[];
  compareIds: string[];
  onToggleWishlist: (perfumeId: string) => void;
  onToggleCompare: (perfumeId: string) => void;
  onOpenTryItFirst: (perfumeId: string) => void;
  onSelectPerfume: (perfumeId: string) => void;
  locale: Locale;
  onToast?: (msg: string) => void;
  userName?: string;
}

export function ScentFinderView({
  perfumes,
  ownedPerfumeIds = [],
  wishlistIds,
  compareIds,
  onToggleWishlist,
  onToggleCompare,
  onOpenTryItFirst,
  onSelectPerfume,
  locale,
  onToast,
  userName
}: ScentFinderViewProps) {
  // Current step 1 to 7, or results
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [expandedRunnerUpId, setExpandedRunnerUpId] = useState<string | null>(null);
  const [copiedProfile, setCopiedProfile] = useState<boolean>(false);
  const [savedProfile, setSavedProfile] = useState<boolean>(false);

  // Requirement 4: Exclude owned perfumes by default; off-by-default toggle
  const [includeOwned, setIncludeOwned] = useState<boolean>(false);

  // Filter local only toggle in results
  const [filterLocalOnly, setFilterLocalOnly] = useState<boolean>(false);

  const [answers, setAnswers] = useState<ScentQuizAnswers>(() => {
    try {
      const saved = localStorage.getItem('senstoria_quiz_answers_v2');
      return saved ? JSON.parse(saved) : DEFAULT_QUIZ_ANSWERS;
    } catch {
      return DEFAULT_QUIZ_ANSWERS;
    }
  });

  // Sprint 3: label runs that use saved answers, and runs that skipped.
  // initialAnswersRef captures the answers present at mount (loaded from
  // storage, or defaults when nothing was stored).
  const initialAnswersRef = React.useRef<ScentQuizAnswers>(answers);
  const [answersWereLoaded, setAnswersWereLoaded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('senstoria_quiz_answers_v2') !== null;
    } catch {
      return false;
    }
  });
  const [skippedRun, setSkippedRun] = useState<boolean>(false);
  const suppressNextAutosaveRef = React.useRef<boolean>(false);

  // Autosave answers to localStorage (suppressed once by Start over, so the
  // deletion below is not immediately undone by the effect itself).
  useEffect(() => {
    if (suppressNextAutosaveRef.current) {
      suppressNextAutosaveRef.current = false;
      return;
    }
    try {
      localStorage.setItem('senstoria_quiz_answers_v2', JSON.stringify(answers));
    } catch {
      // Ignore storage error
    }
  }, [answers]);

  // Compute recommendations with deterministic scoring & owned exclusion
  const excludedIds = useMemo(() => {
    return includeOwned ? [] : ownedPerfumeIds;
  }, [includeOwned, ownedPerfumeIds]);

  const ranked = useMemo(() => {
    return rankRecommendations(perfumes, answers, excludedIds);
  }, [perfumes, answers, excludedIds]);

  const displayResults = useMemo(() => {
    return filterLocalOnly ? ranked.filter(r => r.perfume.origin === 'ID') : ranked;
  }, [ranked, filterLocalOnly]);

  // Sprint 3 run labels: true while the current answers are exactly the
  // ones loaded at mount (saved run) or exactly the skip defaults.
  const answersJson = JSON.stringify(answers);
  const showingSavedAnswers = answersWereLoaded && !skippedRun && answersJson === JSON.stringify(initialAnswersRef.current);
  const showingSkippedDefaults = skippedRun && answersJson === JSON.stringify(DEFAULT_QUIZ_ANSWERS);
  const runWarningText = showingSkippedDefaults
    ? translations[locale].finderView.skippedRunNote
    : translations[locale].finderView.savedAnswersWarning;

  const topMatch = displayResults[0];

  // Up to 3 qualified alternatives (Requirement 8)
  const alternatives: FinderAlternative[] = useMemo(() => {
    if (!topMatch) return [];
    return findQualifiedAlternatives(topMatch, displayResults);
  }, [topMatch, displayResults]);

  // Remaining runners-up excluding topMatch and featured alternatives
  const runnersUp = useMemo(() => {
    if (!topMatch) return [];
    const altIds = alternatives.map(a => a.recommendation.perfume.id);
    return displayResults
      .slice(1)
      .filter(r => !altIds.includes(r.perfume.id))
      .slice(0, 6);
  }, [displayResults, topMatch, alternatives]);

  // Family mix of the displayed results for the secondary radar view (D-V1).
  // Presentation-only transform of existing result data: same weighting and
  // rounding as computeScentDna (primary family 1.0, secondary 0.5,
  // largest-remainder to 100). No scoring input, no new numbers.
  const resultFamilyBreakdown = useMemo(() => {
    const familyWeights: Record<string, number> = {};
    for (const fam of CATALOG_FAMILIES) familyWeights[fam] = 0;
    for (const rec of displayResults) {
      const primary = (rec.perfume.primary_family || '').toLowerCase();
      const secondary = (rec.perfume.secondary_family || '').toLowerCase();
      for (const fam of CATALOG_FAMILIES) {
        if (primary.includes(fam.toLowerCase())) familyWeights[fam] += 1;
        if (secondary && secondary.includes(fam.toLowerCase())) familyWeights[fam] += 0.5;
      }
    }
    return largestRemainderRound(
      Object.entries(familyWeights)
        .filter(([_, weight]) => weight > 0)
        .map(([family, weight]) => ({ family, weight })),
      100
    );
  }, [displayResults]);

  const handleNext = () => {
    if (currentStep < 7) {
      setSlideDirection('forward');
      setCurrentStep(prev => prev + 1);
    } else {
      // Requirement 5: Brief calm calculating state with skeleton cards for at most real calculation time (no artificial delay, no counter)
      setIsCalculating(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsCalculating(false);
          setShowResults(true);
        });
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setSlideDirection('backward');
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleResetQuiz = () => {
    setShowResults(false);
    setIsCalculating(false);
    setCurrentStep(1);
    setSlideDirection('forward');
  };

  // Sprint 3: Start over deletes the saved answers from this device and
  // returns the quiz to step 1 with defaults. The saved taste profile
  // (senstoria_saved_taste_profile) is a separate Data Rights artifact and
  // is deleted via LegalModal, not here.
  const handleStartOver = () => {
    try {
      localStorage.removeItem('senstoria_quiz_answers_v2');
    } catch {
      // Ignore storage error
    }
    suppressNextAutosaveRef.current = true;
    setAnswers(DEFAULT_QUIZ_ANSWERS);
    setAnswersWereLoaded(false);
    setSkippedRun(false);
    setShowResults(false);
    setIsCalculating(false);
    setCurrentStep(1);
    setSlideDirection('forward');
  };

  const handleSkipQuiz = () => {
    // Sprint 3: skip ALWAYS uses the stated Flexible/Free defaults, never
    // old (possibly saved) answers. The autosave effect then persists the
    // defaults, replacing prior saved answers; re-answering stays available.
    setAnswers(DEFAULT_QUIZ_ANSWERS);
    setSkippedRun(true);
    setAnswersWereLoaded(false);
    setIsCalculating(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsCalculating(false);
        setShowResults(true);
      });
    });
  };

  // Toggle family selection (supports multi-select)
  const handleToggleFamily = (family: string) => {
    if (family === 'not_sure') {
      setAnswers(prev => ({ ...prev, preferredFamilies: ['not_sure'] }));
      return;
    }

    setAnswers(prev => {
      const filtered = prev.preferredFamilies.filter(f => f !== 'not_sure');
      if (filtered.includes(family)) {
        const next = filtered.filter(f => f !== family);
        return { ...prev, preferredFamilies: next.length > 0 ? next : ['not_sure'] };
      } else {
        return { ...prev, preferredFamilies: [...filtered, family] };
      }
    });
  };

  // Toggle avoided traits (supports multi-select)
  const handleToggleAvoid = (trait: string) => {
    if (trait === 'none') {
      setAnswers(prev => ({ ...prev, avoidNotesOrTraits: ['none'] }));
      return;
    }

    setAnswers(prev => {
      const filtered = prev.avoidNotesOrTraits.filter(t => t !== 'none');
      if (filtered.includes(trait)) {
        const next = filtered.filter(t => t !== trait);
        return { ...prev, avoidNotesOrTraits: next.length > 0 ? next : ['none'] };
      } else {
        return { ...prev, avoidNotesOrTraits: [...filtered, trait] };
      }
    });
  };

  // Compute Olfactive Archetype / Persona (FIND-06)
  const computeTastePersona = () => {
    const families = answers.preferredFamilies;
    if (families.includes('not_sure') || families.length === 0) {
      return {
        title: translations[locale].finderView.penikmatKebebasanAroma,
        description: translations[locale].finderView.kamuMemilikiHidungYangAdaptifDanSiap,
        tags: locale === 'id' ? ['Eksploratif', 'Bebas Kategori', 'Terbuka'] : ['Explorative', 'Unbound', 'Open-Minded']
      };
    }

    const hasWoody = families.includes('Woody');
    const hasFresh = families.includes('Fresh');
    const hasGourmand = families.includes('Gourmand');
    const hasAmbery = families.includes('Ambery');
    const hasFloral = families.includes('Floral');
    const hasAromatic = families.includes('Aromatic');

    if (hasWoody && hasFresh) {
      return {
        title: translations[locale].finderView.penjelajahHutanHujanAlamSegar,
        description: translations[locale].finderView.keseimbanganAntaraKesegaranSitrusYang,
        tags: locale === 'id' ? ['Woody-Fresh', 'Elegan Sejuk', 'Wibawa Santai'] : ['Woody-Fresh', 'Effortless', 'Refined']
      };
    }
    if (hasGourmand || hasAmbery) {
      return {
        title: translations[locale].finderView.pencintaKehangatanSenjaNuansaManis,
        description: translations[locale].finderView.aromaVanilaRempahEksotisDanResinHang,
        tags: locale === 'id' ? ['Intim', 'Resin & Rempah', 'Kaya Lapisan'] : ['Intimate', 'Spiced Resins', 'Rich Layers']
      };
    }
    if (hasFloral) {
      return {
        title: translations[locale].finderView.pencintaHarmoniBotaniRomansaElegan,
        description: translations[locale].finderView.kelopakMawarMelatiLembutDanPeonyMemb,
        tags: locale === 'id' ? ['Floral Alami', 'Anggun', 'Segar Semerbak'] : ['Natural Floral', 'Graceful', 'Airy']
      };
    }
    if (hasAromatic) {
      return {
        title: translations[locale].finderView.pencariKetenanganHerbalTehKontemporer,
        description: translations[locale].finderView.lavenderSageTehHijauDanRempahSejukM,
        tags: locale === 'id' ? ['Herbal Menenangkan', 'Fokus', 'Bebas Tekanan'] : ['Calming Herbal', 'Poised', 'Crisp']
      };
    }

    return {
      title: translations[locale].finderView.kuratorAromaPersonal,
      description: translations[locale].finderView.preferensimuMencerminkanPemilihanWewang,
      tags: locale === 'id' ? ['Spesifik', 'Pilihan Teruji', 'Khas'] : ['Discerning', 'Grounded', 'Signature']
    };
  };

  const tastePersona = computeTastePersona();

  const handleCopyTasteProfile = () => {
    const text = `Senstoria Taste Profile (${tastePersona.title})
• Aroma: ${answers.preferredFamilies.join(', ')}
• Iklim: ${answers.climateSetting}
• Situasi: ${answers.occasionSetting}
• Ketahanan: ${answers.longevityExpectation}
• Gender: ${answers.genderPreference}
• Anggaran: ${answers.budgetTier}
• Rekomendasi Utama: ${topMatch?.perfume.brand} ${topMatch?.perfume.name} (${topMatch?.matchScore}% Match)`;

    navigator.clipboard.writeText(text);
    setCopiedProfile(true);
    setTimeout(() => setCopiedProfile(false), 2500);
    if (onToast) {
      onToast(translations[locale].finderView.ringkasanTasteProfileDisalinKePapanK);
    }
  };

  const handleSaveTasteProfile = () => {
    try {
      localStorage.setItem('senstoria_saved_taste_profile', JSON.stringify({
        persona: tastePersona,
        answers,
        savedAt: new Date().toISOString()
      }));
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 3000);
      if (onToast) {
        onToast(translations[locale].finderView.tasteProfileBerhasilDisimpanKeProfil);
      }
    } catch {
      // ignore
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // RENDER: BRIEF CALM CALCULATING STATE (Requirement 5: at most real calculation time, no delay, no counter)
  // ══════════════════════════════════════════════════════════════════════
  if (isCalculating) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto py-8">
        <div className="text-center space-y-2">
          <span className="text-[12px] font-mono uppercase tracking-widest text-secondary font-medium block">
            {translations[locale].finderView.scentFinder6Dimensi}
          </span>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-ink font-normal">
            {translations[locale].finderView.menghitungKecocokanAromamu}
          </h2>
          <p className="text-[14px] text-secondary">
            {translations[locale].finderView.mencocokkanPreferensiDenganProfilWewan}
          </p>
        </div>

        {/* Calm Skeleton Result Card (Hero) */}
        <div className="bg-paper border border-bar p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-4">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-hairline/60" />
              <div className="h-9 w-72 bg-hairline/70" />
              <div className="h-4 w-48 bg-hairline/40" />
            </div>
            <div className="text-right bg-paper p-4 border border-hairline min-w-[150px] space-y-2">
              <div className="h-3 w-20 bg-hairline/50 ml-auto" />
              <div className="h-10 w-24 bg-hairline/70 ml-auto" />
            </div>
          </div>

          {/* Skeleton breakdown bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-paper p-3.5 border border-hairline space-y-2">
                <div className="flex justify-between">
                  <div className="h-3.5 w-20 bg-hairline/50" />
                  <div className="h-3.5 w-12 bg-hairline/60" />
                </div>
                <div className="w-full bg-surface h-1.5 border border-hairline" />
                <div className="h-3 w-24 bg-hairline/40" />
              </div>
            ))}
          </div>

          {/* Skeleton evidence blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface border border-hairline space-y-2">
              <div className="h-4 w-36 bg-hairline/60" />
              <div className="space-y-1 pt-1">
                <div className="h-3 w-full bg-hairline/40" />
                <div className="h-3 w-4/5 bg-hairline/40" />
              </div>
            </div>
            <div className="p-4 bg-paper border-2 border-border space-y-2">
              <div className="h-4 w-40 bg-hairline/60" />
              <div className="h-3.5 w-full bg-hairline/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RENDER: LOW MATCH / LIMITING FACTORS STATE (< 60%) (Requirement 7)
  // ══════════════════════════════════════════════════════════════════════
  if (showResults && (!topMatch || topMatch.matchScore < 60)) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto py-8">
        {(showingSavedAnswers || showingSkippedDefaults) && (
          <div className="bg-surface border border-hairline p-3 text-[12px] text-ink flex flex-wrap items-center justify-between gap-2">
            <span>{runWarningText}</span>
            <button onClick={handleStartOver} className="min-h-[44px] px-3 font-medium underline hover:text-bar transition">
              {translations[locale].finderView.startOver}
            </button>
          </div>
        )}
        <div className="bg-paper border border-bar p-8 text-center space-y-5">
          <div className="w-12 h-12 mx-auto bg-surface border border-hairline flex items-center justify-center">
            <Compass className="w-6 h-6 text-bar" />
          </div>

          <div className="space-y-2">
            <span className="text-[12px] font-mono uppercase tracking-widest text-secondary font-medium block">
              {translations[locale].finderView.kurasiTerkalibrasiSkor60}
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-ink font-normal">
              {translations[locale].finderView.belumAdaKecocokanKuat}
            </h2>
            <p className="text-[14px] text-secondary leading-relaxed max-w-lg mx-auto">
              {translations[locale].finderView.kombinasiParameterYangSangatKetatMisa}
            </p>
          </div>

          <div className="bg-surface border border-hairline p-4 text-left text-[12px] space-y-2 max-w-md mx-auto">
            <span className="font-mono text-[12px] uppercase font-bold text-secondary block">
              {translations[locale].finderView.faktorPembatasTeridentifikasi}
            </span>
            <ul className="space-y-1.5 text-bar">
              {answers.budgetTier === 'budget' && (
                <li className="flex items-start gap-1.5">
                  <span className="text-bar font-bold">•</span>
                  <span>{translations[locale].finderView.budgetConstraintNote}</span>
                </li>
              )}
              {answers.longevityExpectation === 'long' && (
                <li className="flex items-start gap-1.5">
                  <span className="text-bar font-bold">•</span>
                  <span>{translations[locale].finderView.longevityTip}</span>
                </li>
              )}
              {answers.avoidNotesOrTraits.length > 1 && !answers.avoidNotesOrTraits.includes('none') && (
                <li className="flex items-start gap-1.5">
                  <span className="text-bar font-bold">•</span>
                  <span>{fmt(translations[locale].finderView.avoidancePenaltyNote, answers.avoidNotesOrTraits.length)}</span>
                </li>
              )}
              {!includeOwned && ownedPerfumeIds.length > 0 && (
                <li className="flex items-start gap-1.5">
                  <span className="text-bar font-bold">•</span>
                  <span>{fmt(translations[locale].finderView.ownedExcludedNote, ownedPerfumeIds.length)}</span>
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!includeOwned && ownedPerfumeIds.length > 0 && (
              <button
                onClick={() => setIncludeOwned(true)}
                className="min-h-[48px] px-5 py-2 border border-border hover:border-bar text-[14px] font-medium text-ink"
              >
                {translations[locale].finderView.sertakanParfumYangDimiliki}
              </button>
            )}

            <button
              onClick={handleResetQuiz}
              className="min-h-[48px] px-6 py-2.5 bg-bar hover:bg-ink text-paper text-[14px] font-medium flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{translations[locale].finderView.sesuaikanJawabanKuis}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RENDER: RESULTS DASHBOARD (Top Match >= 60%)
  // ══════════════════════════════════════════════════════════════════════
  if (showResults && topMatch) {
    return (
      <div className="space-y-10 pb-16">
        {(showingSavedAnswers || showingSkippedDefaults) && (
          <div className="bg-surface border border-hairline p-3 text-[12px] text-ink flex flex-wrap items-center justify-between gap-2">
            <span>{runWarningText}</span>
            <button onClick={handleStartOver} className="min-h-[44px] px-3 font-medium underline hover:text-bar transition">
              {translations[locale].finderView.startOver}
            </button>
          </div>
        )}
        
        {/* Top Header & Curation Method Disclosure */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
          <div className="space-y-1">
            <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
              {translations[locale].finderView.hasilScentFinder6Dimensi}
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-ink font-normal">
              {translations[locale].finderView.kurasiWewangianYangSungguhCocok}
            </h2>
            <p className="text-[16px] leading-[24px] text-secondary max-w-2xl">
              {translations[locale].finderView.dihitungSecaraDeterministikBerdasarkan}
            </p>
          </div>

          {/* Controls: Owned Perfumes Toggle & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 border border-border bg-paper cursor-pointer hover:border-bar transition text-[12px] font-medium min-h-[44px]">
              <input
                type="checkbox"
                checked={includeOwned}
                onChange={e => setIncludeOwned(e.target.checked)}
                className="w-4 h-4 accent-bar cursor-pointer"
              />
              <span className="text-ink">{translations[locale].finderView.sertakanParfumYangSayaMiliki}</span>
            </label>

            <button
              onClick={() => setFilterLocalOnly(prev => !prev)}
              className={`min-h-[44px] px-3.5 py-1.5 border text-[12px] font-medium transition ${
                filterLocalOnly 
                  ? 'bg-bar text-paper border-bar' 
                  : 'bg-paper border-border text-ink hover:border-bar'
              }`}
            >
              {filterLocalOnly 
                ? (translations[locale].finderView.hanyaBrandLokal) 
                : (translations[locale].finderView.semuaAsalBrand)}
            </button>

            <button
              onClick={handleResetQuiz}
              className="min-h-[44px] px-3.5 py-1.5 border border-border hover:border-bar text-[12px] font-medium text-ink flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-bar" />
              <span>{translations[locale].finderView.ubahPreferensi}</span>
            </button>
          </div>
        </div>

        {/* ── 0. TASTE PROFILE ARCHETYPE CARD (FIND-06) ── */}
        <div className="bg-paper border border-hairline p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-bar text-paper text-[12px] font-mono px-2 py-0.5 uppercase tracking-wider font-medium">
                  {translations[locale].finderView.profilSeleraAroma}
                </span>
                <span className="text-[12px] font-mono text-secondary font-semibold">
                  {userName ? `@${userName}` : (translations[locale].finderView.pencintaAroma)}
                </span>
              </div>
              <h3 className="font-serif text-[24px] md:text-[28px] leading-[32px] md:leading-[36px] font-normal text-ink">
                {tastePersona.title}
              </h3>
              <p className="text-[14px] leading-[22px] text-secondary max-w-2xl">
                {tastePersona.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTasteProfile}
                className="min-h-[44px] px-3.5 py-1.5 border border-border hover:border-bar text-[12px] font-medium text-ink flex items-center gap-1.5 transition"
              >
                {copiedProfile ? <CheckCircle2 className="w-3.5 h-3.5 text-bar" /> : <Copy className="w-3.5 h-3.5 text-secondary" />}
                <span>{copiedProfile ? (translations[locale].finderView.tersalin) : (translations[locale].finderView.salinProfil)}</span>
              </button>
              <button
                onClick={handleSaveTasteProfile}
                className="min-h-[44px] px-3.5 py-1.5 bg-surface border border-hairline hover:border-bar text-[12px] font-medium text-ink flex items-center gap-1.5 transition"
              >
                {savedProfile ? <CheckCircle2 className="w-3.5 h-3.5 text-bar" /> : <Bookmark className="w-3.5 h-3.5 text-bar" />}
                <span>{savedProfile ? (translations[locale].finderView.tersimpan) : (translations[locale].finderView.simpanKeAkun)}</span>
              </button>
            </div>
          </div>

          {/* Persona Signature Tags */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-hairline">
            {tastePersona.tags.map((tag, idx) => (
              <span key={idx} className="bg-surface text-ink text-[12px] font-mono px-2.5 py-1 border border-hairline">
                #{tag}
              </span>
            ))}
            <span className="bg-paper text-secondary text-[12px] font-mono px-2.5 py-1 border border-hairline">
              {translations[locale].finderView.climateLabel} {answers.climateSetting === 'outdoor_hot' ? translations[locale].finderView.climateOutdoor : answers.climateSetting === 'indoor_ac' ? translations[locale].finderView.climateIndoor : answers.climateSetting === 'evening_cool' ? translations[locale].finderView.climateEvening : translations[locale].finderView.flexible}
            </span>
            <span className="bg-paper text-secondary text-[12px] font-mono px-2.5 py-1 border border-hairline">
              {translations[locale].finderView.occasionLabel} {answers.occasionSetting === 'daily_office' ? translations[locale].finderView.occasionOffice : answers.occasionSetting === 'casual_dating' ? translations[locale].finderView.occasionDating : answers.occasionSetting === 'formal_evening' ? translations[locale].finderView.occasionFormal : answers.occasionSetting === 'outdoor_sport' ? translations[locale].finderView.occasionSport : translations[locale].finderView.flexible}
            </span>
            <span className="bg-paper text-secondary text-[12px] font-mono px-2.5 py-1 border border-hairline">
              {translations[locale].finderView.longevityLabel} {answers.longevityExpectation === 'light' ? translations[locale].finderView.longevityLight : answers.longevityExpectation === 'moderate' ? translations[locale].finderView.longevityModerate : answers.longevityExpectation === 'long' ? translations[locale].finderView.longevityLong : translations[locale].finderView.flexible}
            </span>
            <span className="bg-paper text-secondary text-[12px] font-mono px-2.5 py-1 border border-hairline">
              {translations[locale].finderView.budgetLabel} {answers.budgetTier === 'budget' ? '< Rp 250k' : answers.budgetTier === 'mid' ? 'Rp 250k–600k' : answers.budgetTier === 'premium' ? '> Rp 600k' : translations[locale].finderView.flexible}
            </span>
          </div>
        </div>

        {/* ── 1. HERO TOP MATCH CARD ── */}
        {/* Desktop two-column result layout (D-V5): hero + radar sidebar side by side. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 min-w-0">
        <div className="bg-paper border border-bar p-6 md:p-8 space-y-6 relative">
          
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-bar text-paper text-[12px] font-mono px-2 py-0.5 font-medium uppercase tracking-wider">
                  #1 {translations[locale].finderView.rekomendasiUtama}
                </span>
                <span className="text-[12px] font-mono uppercase bg-surface border border-hairline px-2 py-0.5 text-ink">
                  {topMatch.perfume.origin === 'ID' ? 'Lokal Indonesia' : 'Global / Internasional'}
                </span>
              </div>
              <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-ink font-normal pt-1">
                {topMatch.perfume.brand} — {topMatch.perfume.name}
              </h2>
              <p className="font-mono tabular-nums text-[12px] text-secondary flex flex-wrap items-center gap-1.5">
                <span>
                  {topMatch.perfume.concentration}{topMatch.perfume.primary_family ? ` · ${topMatch.perfume.primary_family}${topMatch.perfume.secondary_family ? ` / ${topMatch.perfume.secondary_family}` : ''}` : ''} · {formatCurrency(topMatch.perfume.reference_price_idr, locale)} ({topMatch.perfume.reference_price_size_ml} ml)
                </span>
                {topMatch.perfume.price_is_sample ? (
                  <span className="px-1.5 py-0.5 bg-surface border border-hairline text-[12px] font-sans">
                    {translations[locale].sampleDataBadge}
                  </span>
                ) : topMatch.perfume.price_checked_date ? (
                  <span className="px-1.5 py-0.5 bg-surface border border-hairline text-[12px] font-sans">
                    {fmt(translations[locale].common.priceCheckedOn, topMatch.perfume.price_checked_date)}
                  </span>
                ) : null}
              </p>
            </div>

            {/* Match Score Badge (Capped at 96) */}
            <div className="text-right bg-paper p-4 border border-hairline min-w-[150px]">
              <span className="text-[12px] font-mono uppercase text-secondary block">
                {translations[locale].finderView.matchScore}
              </span>
              <span className="font-serif text-[40px] leading-none font-normal text-ink tabular-nums">
                {topMatch.matchScore}%
              </span>
              <span className="text-[12px] text-ink font-medium block pt-1">
                {topMatch.matchScore >= 90 
                  ? (translations[locale].finderView.kecocokanSangatTinggi) 
                  : (translations[locale].finderView.kecocokanBagus)}
              </span>
              <span className="text-[12px] font-mono text-secondary block pt-0.5">
                {translations[locale].finderView.calibrationCapNote}
              </span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* EXACT 6-DIMENSION BREAKDOWN */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] uppercase font-bold text-ink tracking-wider block">
                {translations[locale].finderView.rincian6DimensiKecocokanScoringBreakd}
              </span>
              <span className="text-[12px] font-mono text-secondary">
                {translations[locale].finderView.jumlahPoinDimensiSamaPersisDenganSko}
              </span>
            </div>

            <p className="text-[12px] text-secondary">
              {translations[locale].finderView.fitExplanation}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {topMatch.breakdownRows.map((row, idx) => {
                const fitDisplay = row.isNoData ? translations[locale].finderView.noDataFit : row.fit !== null ? `${Math.round(row.fit * 100)}% ${translations[locale].finderView.dimensionFitLabel}` : translations[locale].finderView.anyFit;
                const pctWidth = row.isNoData ? 50 : row.fit !== null ? Math.round(row.fit * 100) : 70;

                return (
                  <div key={row.key} className="bg-paper p-3.5 border border-hairline space-y-2">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="font-semibold text-ink">
                        {locale === 'id' ? row.labelId : row.labelEn}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-ink">
                        {row.points} / {row.maxPoints} pts
                      </span>
                    </div>

                    {/* Mini progress bar: animates row-by-row */}
                    <div className="w-full bg-surface h-1.5 overflow-hidden border border-hairline">
                      <div 
                        className={`h-full animate-bar-grow ${row.isNoData ? 'bg-border' : 'bg-bar'}`}
                        style={{ 
                          width: `${pctWidth}%`,
                          animationDelay: `${idx * 30}ms`
                        }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-[12px] text-secondary">
                      <span>{fitDisplay}</span>
                      <span className="truncate max-w-[140px] italic">
                        {locale === 'id' ? row.citationId : row.citationEn}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explicit Adjustment Row: always rendered so points + adjustment = total literally */}
            <div className="bg-surface border border-hairline p-3 text-[12px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-bar shrink-0" />
                <span className="text-ink">
                  <strong>{translations[locale].finderView.penyesuaianBuktiKalibrasiAdjustment}</strong>{' '}
                  {topMatch.adjustment ? (locale === 'id' ? topMatch.adjustment.reasonId : topMatch.adjustment.reasonEn) : translations[locale].finderView.noAdjustmentNote}
                </span>
              </div>
              <span className="font-mono tabular-nums font-bold text-error shrink-0">
                {topMatch.adjustment ? topMatch.adjustment.points : 0} pts
              </span>
            </div>
          </div>

          {/* Notes Pyramid Snapshot */}
          <div className="bg-paper p-4 border border-hairline text-[12px] space-y-1">
            <span className="text-[12px] font-bold uppercase text-secondary block">
              {translations[locale].finderView.karakterPiramidaNotes}
            </span>
            <p className="text-bar leading-relaxed">
              <strong>{translations[locale].finderView.pyramidTopShort}</strong> {topMatch.perfume.top_notes} · <strong>{translations[locale].finderView.pyramidHeartShort}</strong> {topMatch.perfume.heart_notes} · <strong>{translations[locale].finderView.pyramidBaseShort}</strong> {topMatch.perfume.base_notes}
            </p>
          </div>

          {/* Dual Evidence Columns: "Why it fits" vs "Possible mismatch" (Requirement 6: clearly separated, mismatch gets its own bordered block) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Why Fits */}
            <div className="p-5 bg-surface border border-hairline space-y-2.5">
              <span className="text-[12px] font-mono uppercase tracking-wider font-bold text-ink flex items-center gap-1.5">
                <Check className="w-4 h-4 text-bar" />
                <span>{translations[locale].finderView.mengapaCocokUntukmuGroundedEvidence}</span>
              </span>

              <ul className="text-[12px] text-bar space-y-1.5">
                {(locale === 'id' ? topMatch.whyFitsBulletsId : topMatch.whyFitsBulletsEn).map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-bar font-bold">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Possible Mismatch: gets its own bordered block, never buried */}
            <div className="p-5 bg-paper border-2 border-bar space-y-2.5">
              <span className="text-[12px] font-mono uppercase tracking-wider font-bold text-ink flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-bar" />
                <span>{translations[locale].finderView.kemungkinanKurangCocokWeakestDimension}</span>
              </span>
              
              <p className="text-[13px] text-ink leading-relaxed font-medium">
                {locale === 'id' ? topMatch.possibleMismatchId : topMatch.possibleMismatchEn}
              </p>

              <p className="text-[12px] text-secondary pt-1 border-t border-hairline">
                {translations[locale].finderView.catatanIniDihitungSecaraDinamisDariD}
              </p>
            </div>

          </div>

          {/* Hero CTAs: Exactly ONE primary filled button per card! */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-hairline">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onToggleWishlist(topMatch.perfume.id)}
                className={`min-h-[48px] px-4 py-2 text-[12px] font-medium flex items-center gap-1.5 border transition ${
                  wishlistIds.includes(topMatch.perfume.id)
                    ? 'bg-bar border-bar text-paper'
                    : 'bg-paper border-border text-ink hover:border-bar'
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlistIds.includes(topMatch.perfume.id) ? 'fill-paper' : ''}`} />
                <span>{wishlistIds.includes(topMatch.perfume.id) ? (translations[locale].finderView.diWishlist) : (translations[locale].finderView.simpanWishlist)}</span>
              </button>

              <button
                onClick={() => onToggleCompare(topMatch.perfume.id)}
                className={`min-h-[48px] px-4 py-2 text-[12px] font-medium flex items-center gap-1.5 border transition ${
                  compareIds.includes(topMatch.perfume.id)
                    ? 'bg-bar text-paper border-bar'
                    : 'bg-paper border-border text-ink hover:border-bar'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{compareIds.includes(topMatch.perfume.id) ? (translations[locale].finderView.diKomparasi) : (translations[locale].productDetail.compareAction)}</span>
              </button>

              <button
                onClick={() => onOpenTryItFirst(topMatch.perfume.id)}
                className="min-h-[48px] px-4 py-2 bg-paper hover:border-bar border border-border text-[12px] font-medium text-ink transition flex items-center gap-1.5"
              >
                <PackageCheck className="w-4 h-4 text-bar" />
                <span>{translations[locale].finderView.cobaSampleDulu}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onSelectPerfume(topMatch.perfume.id)}
                className="min-h-[48px] px-5 py-2 border border-border hover:border-bar text-[14px] font-medium text-ink"
              >
                {translations[locale].finderView.lihatDetailSpecs}
              </button>

              {/* EXACTLY ONE PRIMARY FILLED BUTTON FOR HERO CARD */}
              <a
                href={`/go/${topMatch.perfume.id}?platform=shopee&src=scent_finder_hero`}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="min-h-[48px] px-6 py-2.5 bg-bar hover:bg-ink text-paper text-[14px] font-medium flex items-center gap-2 transition"
              >
                <span>{translations[locale].finderView.beliResmiDiShopeeMall}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[12px] text-secondary pt-2 w-full">
              {translations[locale].buySheet.kamiBisaMenerimaKomisiJikaKamuMembel}
            </p>
          </div>

        </div>
          </div>

          {/* ── Secondary radar view of the displayed results (D-V1, founder option c) ── */}
          {resultFamilyBreakdown.length > 0 && (
            <aside className="lg:col-span-5 min-w-0 bg-paper border border-hairline p-6 space-y-3" aria-labelledby="finder-radar-heading">
              <div className="space-y-1">
                <h3 id="finder-radar-heading" className="font-serif text-[24px] leading-[32px] font-normal text-ink">
                  {translations[locale].scentDna.petaPoligonRadarPandanganSekunder}
                </h3>
                <p className="text-[14px] leading-[22px] text-secondary">
                  {translations[locale].finderView.radarCaption}
                </p>
              </div>
              <React.Suspense fallback={
                <div className="h-[260px] flex items-center justify-center font-mono text-xs text-secondary">
                  {translations[locale].finderView.loadingRadar}
                </div>
              }>
                <ScentDnaRadarChart familyBreakdown={resultFamilyBreakdown} height={260} />
              </React.Suspense>
              <p className="text-[12px] font-mono text-secondary">
                {translations[locale].scentDna.radarStyleCaption}
              </p>
            </aside>
          )}
        </div>

        {/* ── 2. LABELLED QUALIFIED ALTERNATIVES (Requirement 8) ── */}
        {alternatives.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-baseline border-b border-hairline pb-3">
              <div className="space-y-0.5">
                <span className="text-[12px] font-mono uppercase tracking-widest text-secondary font-medium block">
                  {translations[locale].finderView.alternatifTerkualifikasi}
                </span>
                <h3 className="font-serif text-[24px] md:text-[28px] leading-[32px] md:leading-[36px] font-normal text-ink">
                  {translations[locale].finderView.pilihanAlternatifYangMemenuhiStandar}
                </h3>
              </div>
              <span className="text-[12px] text-secondary">
                {translations[locale].finderView.disesuaikanDenganPreferensiBelanjaSpes}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {alternatives.map((alt, idx) => {
                const p = alt.recommendation.perfume;
                const rec = alt.recommendation;
                const isWish = wishlistIds.includes(p.id);
                const isComp = compareIds.includes(p.id);

                return (
                  <div 
                    key={alt.type + idx}
                    className="bg-paper border border-bar p-5 space-y-4 flex flex-col justify-between h-full animate-card-enter"
                    style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="bg-bar text-paper text-[12px] font-mono px-2 py-0.5 font-medium uppercase tracking-wider">
                          {locale === 'id' ? alt.badgeLabelId : alt.badgeLabelEn}
                        </span>
                        <span className="font-mono tabular-nums text-[12px] font-bold text-ink">
                          {rec.matchScore}% Match
                        </span>
                      </div>

                      <div 
                        onClick={() => onSelectPerfume(p.id)}
                        className="cursor-pointer hover:underline space-y-0.5"
                      >
                        <span className="text-[12px] uppercase tracking-wider text-secondary font-medium block">
                          {p.brand}
                        </span>
                        <h4 className="font-sans text-[18px] leading-[24px] font-medium text-ink line-clamp-2 h-[48px]">{p.name}</h4>
                        <p className="text-[12px] font-mono tabular-nums text-secondary flex flex-wrap items-center gap-1.5">
                          <span>{p.concentration} · {p.primary_family} · {formatCurrency(p.reference_price_idr, locale)}</span>
                          <span className="px-1 py-0.5 bg-surface border border-hairline text-[12px] font-sans">
                            {translations[locale].sampleDataBadge}
                          </span>
                        </p>
                      </div>

                      {/* Alternative specific note */}
                      <p className="text-[12px] text-bar bg-surface p-2.5 border border-hairline leading-relaxed">
                        {locale === 'id' ? alt.detailNoteId : alt.detailNoteEn}
                      </p>

                      {/* Weakest dimension mismatch note */}
                      <p className="text-[12px] text-bar border-l-2 border-border pl-2">
                        {locale === 'id' ? rec.possibleMismatchId : rec.possibleMismatchEn}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-hairline flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onToggleWishlist(p.id)}
                          className={`p-2 border transition min-h-[44px] min-w-[44px] flex items-center justify-center ${isWish ? 'bg-bar border-bar text-paper' : 'border-border hover:border-bar text-ink'}`}
                          title={translations[locale].finderView.saveWishlistTitle}
                        >
                          <Heart className={`w-4 h-4 ${isWish ? 'fill-paper' : ''}`} />
                        </button>
                        <button
                          onClick={() => onToggleCompare(p.id)}
                          className={`p-2 border transition min-h-[44px] min-w-[44px] flex items-center justify-center ${isComp ? 'bg-bar text-paper border-bar' : 'border-border hover:border-bar text-ink'}`}
                          title={translations[locale].productDetail.compareAction}
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenTryItFirst(p.id)}
                          className="px-3 py-1.5 bg-surface hover:border-bar border border-hairline text-[12px] font-medium text-ink min-h-[44px]"
                        >
                          {translations[locale].finderView.cobaSampleDulu}
                        </button>
                      </div>

                      {/* Exactly ONE primary filled button per card */}
                      <button
                        onClick={() => onSelectPerfume(p.id)}
                        className="min-h-[44px] px-3.5 py-1.5 bg-bar hover:bg-ink text-paper text-[12px] font-medium transition"
                      >
                        {translations[locale].finderView.detailSpecs}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3. OTHER HIGHLY MATCHED FRAGRANCES (RUNNERS-UP) ── */}
        {runnersUp.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-baseline border-b border-hairline pb-3">
              <div className="space-y-0.5">
                <span className="text-[12px] font-mono uppercase tracking-widest text-secondary font-medium block">
                  {translations[locale].finderView.kurasiAlternatif}
                </span>
                <h3 className="font-serif text-[24px] md:text-[28px] leading-[32px] md:leading-[36px] font-normal text-ink">
                  {translations[locale].finderView.koleksiRekomendasiTeratasLainnya}
                </h3>
              </div>
              <span className="text-[12px] text-secondary">
                {fmt(translations[locale].finderView.runnersUpCount, runnersUp.length)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {runnersUp.map((rec, idx) => {
                const p = rec.perfume;
                const isWish = wishlistIds.includes(p.id);
                const isComp = compareIds.includes(p.id);

                return (
                  <div
                    key={p.id}
                    className="bg-paper border border-hairline p-5 space-y-3 flex flex-col justify-between hover:border-bar transition h-full"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[12px] text-secondary">
                        <span className="font-mono tabular-nums">#{idx + 2} {translations[locale].finderView.pilihan}</span>
                        <div className="flex items-center gap-1 bg-surface px-2 py-0.5 border border-hairline font-mono tabular-nums font-bold text-ink">
                          <span>Match: {rec.matchScore}%</span>
                        </div>
                      </div>

                      <div 
                        onClick={() => onSelectPerfume(p.id)}
                        className="cursor-pointer hover:underline"
                      >
                        <span className="text-[12px] uppercase tracking-wider text-secondary font-medium block">
                          {p.brand}
                        </span>
                        <h4 className="font-sans text-[18px] leading-[24px] font-medium text-ink line-clamp-2 h-[48px]">{p.name}</h4>
                      </div>

                      <p className="text-[12px] font-mono tabular-nums text-secondary">
                        {p.concentration} · {p.primary_family} · {formatCurrency(p.reference_price_idr, locale)}
                      </p>

                      {/* Evidence snapshot */}
                      <div className="bg-surface p-2.5 border border-hairline text-[12px] space-y-1">
                        <p className="text-ink font-medium">
                          ✓ {locale === 'id' ? rec.whyFitsBulletsId[0] : rec.whyFitsBulletsEn[0]}
                        </p>
                        <p className="text-secondary text-[12px] border-t border-hairline pt-1">
                          ℹ {locale === 'id' ? rec.possibleMismatchId : rec.possibleMismatchEn}
                        </p>
                      </div>

                      {/* Expandable 6-dimension scores summing exactly to score */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedRunnerUpId(expandedRunnerUpId === p.id ? null : p.id)}
                          className="text-[12px] font-mono text-ink underline flex items-center gap-1 min-h-[44px]"
                        >
                          <span>{expandedRunnerUpId === p.id ? (translations[locale].finderView.tutupRincian6d) : (translations[locale].finderView.rincianSkor6Dimensi)}</span>
                        </button>

                        {expandedRunnerUpId === p.id && (
                          <div className="space-y-1 pt-2 text-[12px] font-mono tabular-nums bg-surface p-2.5 border border-hairline mt-1.5">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              {rec.breakdownRows.map(r => (
                                <div key={r.key} className="flex justify-between">
                                  <span>{r.labelId.split(' ')[0]}:</span>
                                  <span className="font-bold">{r.points}/{r.maxPoints} pts</span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-1 border-t border-hairline text-error flex justify-between">
                              <span>{translations[locale].finderView.adjustmentLabel}</span>
                              <span>{rec.adjustment ? rec.adjustment.points : 0} pts</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-hairline flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onToggleWishlist(p.id)}
                          className={`p-2 border transition min-h-[44px] min-w-[44px] flex items-center justify-center ${isWish ? 'bg-bar border-bar text-paper' : 'border-border hover:border-bar text-ink'}`}
                          title={translations[locale].finderView.saveWishlistTitle}
                        >
                          <Heart className={`w-4 h-4 ${isWish ? 'fill-paper' : ''}`} />
                        </button>

                        <button
                          onClick={() => onToggleCompare(p.id)}
                          className={`p-2 border transition min-h-[44px] min-w-[44px] flex items-center justify-center ${isComp ? 'bg-bar text-paper border-bar' : 'border-border hover:border-bar text-ink'}`}
                          title={translations[locale].productDetail.compareAction}
                        >
                          <Layers className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenTryItFirst(p.id)}
                          className="px-3 py-1.5 bg-surface hover:border-bar border border-hairline text-[12px] font-medium text-ink min-h-[44px]"
                        >
                          {translations[locale].finderView.cobaSampleDulu}
                        </button>
                      </div>

                      {/* Exactly ONE primary filled button per card */}
                      <button
                        onClick={() => onSelectPerfume(p.id)}
                        className="min-h-[44px] px-3.5 py-1.5 bg-bar hover:bg-ink text-paper text-[12px] font-medium transition"
                      >
                        {translations[locale].finderView.detailSpecs}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RENDER: 7-STEP QUESTIONNAIRE (Refreshed for Exact 6 Scored Dimensions)
  // ══════════════════════════════════════════════════════════════════════
  const progressPct = Math.round((currentStep / 7) * 100);

  return (
    <div className="space-y-8 max-w-2xl lg:max-w-5xl mx-auto pb-16">
      
      {/* Step Indicator Header */}
      <div className="space-y-3 text-center">
        <p className="text-[12px] uppercase tracking-widest text-secondary font-medium">
          {fmt(translations[locale].finderView.pertanyaan0Dari7, currentStep)}
        </p>

        {/* Progress Bar (Requirement 4: thin progress line that animates to each step) */}
        <div className="w-full bg-hairline h-1 overflow-hidden">
          <div 
            className="bg-bar h-full transition-all duration-300 ease-out" 
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* ── QUESTION STEP CONTAINER (Requirement 4: Slides forward/backward 180ms per motion system, disabled by reduced-motion) ── */}
      <div 
        key={currentStep} 
        className={slideDirection === 'forward' ? 'animate-quiz-forward' : 'animate-quiz-backward'}
      >
        {/* ── STEP 1: PREFERRED SCENT FAMILIES (Weight: 25) ── */}
        {currentStep === 1 && (
        <div className="space-y-5 lg:grid lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:items-start">
          <div className="space-y-1 text-center lg:text-left lg:pt-2">
            <span className="text-[12px] font-mono uppercase tracking-wider text-secondary font-medium block">
              {translations[locale].finderQuiz.steps[0].kicker}
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-ink font-normal">
              {translations[locale].finderView.keluargaAromaApaYangPalingMenarikBag}
            </h2>
            <p className="text-[14px] text-secondary">
              {translations[locale].finderView.pilihSatuAtauLebihKategoriAtauPilih}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[12px]">
            {translations[locale].finderQuiz.steps[0].options.map(item => {
              const isSelected = answers.preferredFamilies.includes(item.id);
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleToggleFamily(item.id)}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 border cursor-pointer transition flex items-start justify-between ${
                    isSelected ? 'border-2 border-bar bg-surface' : 'border-hairline bg-paper hover:bg-surface'
                  }`}
                >
                  <div className="space-y-1 pr-3">
                    <span className="font-semibold block text-[14px] text-ink">{item.label}</span>
                    <span className="text-[12px] text-secondary leading-relaxed block">{item.desc}</span>
                  </div>
                  <div aria-hidden="true" className={`w-5 h-5 border flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-bar text-paper border-bar' : 'border-border'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: CLIMATE & ENVIRONMENT (Weight: 20) ── */}
      {currentStep === 2 && (
        <div className="space-y-5 lg:grid lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:items-start">
          <div className="space-y-1 text-center lg:text-left lg:pt-2">
            <span className="text-[12px] font-mono uppercase tracking-wider text-secondary font-medium block">
              {translations[locale].finderQuiz.steps[1].kicker}
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-ink font-normal">
              {translations[locale].finderView.diManaKamuPalingSeringMemakaiParfum}
            </h2>
            <p className="text-[14px] text-secondary">
              {translations[locale].finderView.suhuDanKelembapanIndonesiaSangatMemen}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {translations[locale].finderQuiz.steps[1].options.map(item => {
              const isSelected = answers.climateSetting === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, climateSetting: item.id }))}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-bar bg-surface' : 'border-hairline bg-paper hover:bg-surface'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-ink">{item.label}</span>
                    <span className="text-[12px] text-secondary">{item.desc}</span>
                  </div>
                  <div aria-hidden="true" className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-bar text-paper border-bar' : 'border-border'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 3: OCCASION & SETTING (Weight: 20) ── */}
      {currentStep === 3 && (
        <div className="space-y-5 lg:grid lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:items-start">
          <div className="space-y-1 text-center lg:text-left lg:pt-2">
            <span className="text-[12px] font-mono uppercase tracking-wider text-secondary font-medium block">
              {translations[locale].finderQuiz.steps[2].kicker}
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-ink font-normal">
              {translations[locale].finderView.untukMomenApaKamuMencariParfumIni}
            </h2>
            <p className="text-[14px] text-secondary">
              {translations[locale].finderView.mencocokkanKesantunanProyeksiDanKonsen}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {translations[locale].finderQuiz.steps[2].options.map(item => {
              const isSelected = (answers.occasionSetting || 'daily_office') === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, occasionSetting: item.id }))}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-bar bg-surface' : 'border-hairline bg-paper hover:bg-surface'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-ink">{item.label}</span>
                    <span className="text-[12px] text-secondary">{item.desc}</span>
                  </div>
                  <div aria-hidden="true" className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-bar text-paper border-bar' : 'border-border'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 4: LONGEVITY EXPECTATION (Weight: 15) ── */}
      {currentStep === 4 && (
        <div className="space-y-5 lg:grid lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:items-start">
          <div className="space-y-1 text-center lg:text-left lg:pt-2">
            <span className="text-[12px] font-mono uppercase tracking-wider text-secondary font-medium block">
              {translations[locale].finderQuiz.steps[3].kicker}
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-ink font-normal">
              {translations[locale].finderView.berapaLamaKetahananAromaYangKamuButu}
            </h2>
            <p className="text-[14px] text-secondary">
              {translations[locale].finderView.ekspektasiRealistisMembantuMencocokkan}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {translations[locale].finderQuiz.steps[3].options.map(item => {
              const isSelected = answers.longevityExpectation === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, longevityExpectation: item.id }))}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-bar bg-surface' : 'border-hairline bg-paper hover:bg-surface'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-ink">{item.label}</span>
                    <span className="text-[12px] text-secondary">{item.desc}</span>
                  </div>
                  <div aria-hidden="true" className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-bar text-paper border-bar' : 'border-border'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 5: GENDER EXPRESSION (Weight: 10) ── */}
      {currentStep === 5 && (
        <div className="space-y-5 lg:grid lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:items-start">
          <div className="space-y-1 text-center lg:text-left lg:pt-2">
            <span className="text-[12px] font-mono uppercase tracking-wider text-secondary font-medium block">
              {translations[locale].finderQuiz.steps[4].kicker}
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-ink font-normal">
              {translations[locale].finderView.apaPreferensiEkspresiGenderUntukAroma}
            </h2>
            <p className="text-[14px] text-secondary">
              {translations[locale].finderView.membantuMenyaringNuansaAromaMaskulinF}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {translations[locale].finderQuiz.steps[4].options.map(item => {
              const isSelected = (answers.genderPreference || 'any') === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, genderPreference: item.id }))}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-bar bg-surface' : 'border-hairline bg-paper hover:bg-surface'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-ink">{item.label}</span>
                    <span className="text-[12px] text-secondary">{item.desc}</span>
                  </div>
                  <div aria-hidden="true" className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-bar text-paper border-bar' : 'border-border'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 6: BUDGET TIER (Weight: 10) ── */}
      {currentStep === 6 && (
        <div className="space-y-5 lg:grid lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:items-start">
          <div className="space-y-1 text-center lg:text-left lg:pt-2">
            <span className="text-[12px] font-mono uppercase tracking-wider text-secondary font-medium block">
              {translations[locale].finderQuiz.steps[5].kicker}
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-ink font-normal">
              {translations[locale].finderView.berapaRentangAnggaranYangKamuSiapkan}
            </h2>
            <p className="text-[14px] text-secondary">
              {translations[locale].finderView.senstoriaMenampilkanHargaReferensiResm}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {translations[locale].finderQuiz.steps[5].options.map(item => {
              const isSelected = answers.budgetTier === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, budgetTier: item.id }))}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-bar bg-surface' : 'border-hairline bg-paper hover:bg-surface'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-ink">{item.label}</span>
                    <span className="text-[12px] text-secondary">{item.desc}</span>
                  </div>
                  <div aria-hidden="true" className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-bar text-paper border-bar' : 'border-border'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 7: AVOIDANCE & DISLIKES (Penalty Check) ── */}
      {currentStep === 7 && (
        <div className="space-y-5 lg:grid lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:items-start">
          <div className="space-y-1 text-center lg:text-left lg:pt-2">
            <span className="text-[12px] font-mono uppercase tracking-wider text-secondary font-medium block">
              {translations[locale].finderQuiz.steps[6].kicker}
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-ink font-normal">
              {translations[locale].finderView.adakahKarakteristikAromaYangInginKamu}
            </h2>
            <p className="text-[14px] text-secondary">
              {translations[locale].finderView.karakteristikYangDipilihAkanDiberiPen}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {translations[locale].finderQuiz.steps[6].options.map(item => {
              const isSelected = answers.avoidNotesOrTraits.includes(item.id);
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleToggleAvoid(item.id)}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-bar bg-surface' : 'border-hairline bg-paper hover:bg-surface'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-ink">{item.label}</span>
                    <span className="text-[12px] text-secondary">{item.desc}</span>
                  </div>
                  <div aria-hidden="true" className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-bar text-paper border-bar' : 'border-border'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      </div>

      {/* Sprint 3: label when the quiz is running on loaded saved answers */}
      {showingSavedAnswers && (
        <div className="bg-surface border border-hairline p-3 text-[12px] text-ink flex flex-wrap items-center justify-between gap-2">
          <span>{translations[locale].finderView.savedAnswersNote}</span>
          <button onClick={handleStartOver} className="min-h-[44px] px-3 font-medium underline hover:text-bar transition">
            {translations[locale].finderView.startOver}
          </button>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-6 border-t border-hairline">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`min-h-[48px] px-3 text-[14px] text-secondary hover:text-ink font-medium transition flex items-center gap-1 ${
            currentStep === 1 ? 'opacity-30 cursor-not-allowed' : ''
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{translations[locale].finder.back}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSkipQuiz}
            className="min-h-[48px] px-5 py-2 border border-border hover:border-bar text-[14px] font-medium text-ink transition"
          >
            {translations[locale].finderView.lewatiKuisLihatHasil}
          </button>

          <button
            onClick={handleNext}
            className="min-h-[48px] px-6 py-2.5 bg-bar hover:bg-ink text-paper text-[14px] font-medium flex items-center gap-2 transition"
          >
            <span>{currentStep === 7 ? (translations[locale].finderView.selesaiHitungRekomendasi) : (translations[locale].finderView.pertanyaanBerikutnya)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
