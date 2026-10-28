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
  TrendingDown,
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
import { Locale, formatCurrency } from '../lib/i18n.ts';

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

  // Autosave answers to localStorage
  useEffect(() => {
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

  const handleSkipQuiz = () => {
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
        title: locale === 'id' ? 'Penikmat Kebebasan Aroma' : 'The Open Scent Explorer',
        description: locale === 'id' 
          ? 'Kamu memiliki hidung yang adaptif dan siap mengeksplorasi wewangian melintasi berbagai keluarga aroma tanpa prasangka.'
          : 'You possess an adaptable nose ready to explore across different olfactive families without prejudice.',
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
        title: locale === 'id' ? 'Penjelajah Hutan Hujan & Alam Segar' : 'The Verdant & Forest Voyager',
        description: locale === 'id'
          ? 'Keseimbangan antara kesegaran sitrus yang membangkitkan energi dan ketenangan kayu cedar serta vetiver yang bersahaja.'
          : 'Invigorating citrus freshness grounded in peaceful cedarwood and vetiver depths.',
        tags: locale === 'id' ? ['Woody-Fresh', 'Elegan Sejuk', 'Wibawa Santai'] : ['Woody-Fresh', 'Effortless', 'Refined']
      };
    }
    if (hasGourmand || hasAmbery) {
      return {
        title: locale === 'id' ? 'Pencinta Kehangatan Senja & Nuansa Manis' : 'The Twilight & Gourmand Connoisseur',
        description: locale === 'id'
          ? 'Aroma vanila, rempah eksotis, dan resin hangat memberimu rasa nyaman, intim, serta memancarkan daya pikat misterius.'
          : 'Rich vanilla, comforting spices, and warm ambery resins grant you an inviting and magnetic presence.',
        tags: locale === 'id' ? ['Intim', 'Resin & Rempah', 'Kaya Lapisan'] : ['Intimate', 'Spiced Resins', 'Rich Layers']
      };
    }
    if (hasFloral) {
      return {
        title: locale === 'id' ? 'Pencinta Harmoni Botani & Romansa Elegan' : 'The Botanical & Floral Romantic',
        description: locale === 'id'
          ? 'Kelopak mawar, melati lembut, dan peony memberimu aura anggun yang ramah, bersih, dan memikat.'
          : 'Sophisticated florals like tea roses, night jasmine, and peonies provide a timelessly graceful aura.',
        tags: locale === 'id' ? ['Floral Alami', 'Anggun', 'Segar Semerbak'] : ['Natural Floral', 'Graceful', 'Airy']
      };
    }
    if (hasAromatic) {
      return {
        title: locale === 'id' ? 'Pencari Ketenangan Herbal & Teh Kontemporer' : 'The Zen & Aromatic Purist',
        description: locale === 'id'
          ? 'Lavender, sage, teh hijau, dan rempah sejuk membantumu tetap fokus, tenang, dan jernih sepanjang hari.'
          : 'Lavender, sage, green tea, and cool herbs provide unwavering focus, serenity, and crystalline poise.',
        tags: locale === 'id' ? ['Herbal Menenangkan', 'Fokus', 'Bebas Tekanan'] : ['Calming Herbal', 'Poised', 'Crisp']
      };
    }

    return {
      title: locale === 'id' ? 'Kurator Aroma Personal' : 'The Discerning Scent Curator',
      description: locale === 'id'
        ? 'Preferensimu mencerminkan pemilihan wewangian yang selektif dan disesuaikan dengan suasana hati serta iklim Indonesia.'
        : 'Your preferences reflect a thoughtful selection tailored to mood, occasion, and tropical climate conditions.',
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
      onToast(locale === 'id' ? 'Ringkasan Taste Profile disalin ke papan klip!' : 'Taste profile copied to clipboard!');
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
        onToast(locale === 'id' ? 'Taste Profile berhasil disimpan ke profil akunmu!' : 'Taste profile saved to your account!');
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
          <span className="text-[12px] font-mono uppercase tracking-widest text-[#5c5c5c] font-medium block">
            {locale === 'id' ? 'Scent Finder 6-Dimensi' : '6-Dimension Scent Finder'}
          </span>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal">
            {locale === 'id' ? 'Menghitung Kecocokan Aromamu...' : 'Calculating Your Matches...'}
          </h2>
          <p className="text-[14px] text-[#5c5c5c]">
            {locale === 'id' 
              ? 'Mencocokkan preferensi dengan profil wewangian objektif' 
              : 'Matching preferences with objective fragrance profiles'}
          </p>
        </div>

        {/* Calm Skeleton Result Card (Hero) */}
        <div className="bg-[#fffef2] border border-[#333333] p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#d9d7c9] pb-4">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-[#d9d7c9]/60" />
              <div className="h-9 w-72 bg-[#d9d7c9]/70" />
              <div className="h-4 w-48 bg-[#d9d7c9]/40" />
            </div>
            <div className="text-right bg-[#fffef2] p-4 border border-[#d9d7c9] min-w-[150px] space-y-2">
              <div className="h-3 w-20 bg-[#d9d7c9]/50 ml-auto" />
              <div className="h-10 w-24 bg-[#d9d7c9]/70 ml-auto" />
            </div>
          </div>

          {/* Skeleton breakdown bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#fffef2] p-3.5 border border-[#d9d7c9] space-y-2">
                <div className="flex justify-between">
                  <div className="h-3.5 w-20 bg-[#d9d7c9]/50" />
                  <div className="h-3.5 w-12 bg-[#d9d7c9]/60" />
                </div>
                <div className="w-full bg-[#f4f3e6] h-1.5 border border-[#d9d7c9]" />
                <div className="h-3 w-24 bg-[#d9d7c9]/40" />
              </div>
            ))}
          </div>

          {/* Skeleton evidence blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#f4f3e6] border border-[#d9d7c9] space-y-2">
              <div className="h-4 w-36 bg-[#d9d7c9]/60" />
              <div className="space-y-1 pt-1">
                <div className="h-3 w-full bg-[#d9d7c9]/40" />
                <div className="h-3 w-4/5 bg-[#d9d7c9]/40" />
              </div>
            </div>
            <div className="p-4 bg-[#fffef2] border-2 border-[#8a8a8a] space-y-2">
              <div className="h-4 w-40 bg-[#d9d7c9]/60" />
              <div className="h-3.5 w-full bg-[#d9d7c9]/40" />
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
        <div className="bg-[#fffef2] border border-[#333333] p-8 text-center space-y-5">
          <div className="w-12 h-12 mx-auto bg-[#f4f3e6] border border-[#d9d7c9] flex items-center justify-center">
            <Compass className="w-6 h-6 text-[#333333]" />
          </div>

          <div className="space-y-2">
            <span className="text-[12px] font-mono uppercase tracking-widest text-[#5c5c5c] font-medium block">
              {locale === 'id' ? 'Kurasi Terkalibrasi (Skor < 60%)' : 'Calibrated Curation (Score < 60%)'}
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal">
              {locale === 'id' ? 'Belum Ada Kecocokan Kuat' : 'No Strong Match Yet'}
            </h2>
            <p className="text-[14px] text-[#5c5c5c] leading-relaxed max-w-lg mx-auto">
              {locale === 'id'
                ? 'Kombinasi parameter yang sangat ketat (misal preferensi anggaran hemat dengan ekspektasi ketahanan maksimal atau pantangan notes yang dominan) membatasi kandidat aroma yang memenuhi standar kurasi objektif Senstoria.'
                : 'Highly strict parameter combinations (such as strict budget bounds paired with extreme longevity expectations or multiple avoided notes) limit fragrances meeting Senstoria’s curation threshold.'}
            </p>
          </div>

          <div className="bg-[#f4f3e6] border border-[#d9d7c9] p-4 text-left text-[12px] space-y-2 max-w-md mx-auto">
            <span className="font-mono text-[12px] uppercase font-bold text-[#5c5c5c] block">
              {locale === 'id' ? 'Faktor Pembatas Teridentifikasi:' : 'Identified Limiting Factors:'}
            </span>
            <ul className="space-y-1.5 text-[#333333]">
              {answers.budgetTier === 'budget' && (
                <li className="flex items-start gap-1.5">
                  <span className="text-[#333333] font-bold">•</span>
                  <span>Anggaran &lt; Rp 250.000 membatasi ketersediaan konsentrasi Extrait/EDP tinggi.</span>
                </li>
              )}
              {answers.longevityExpectation === 'long' && (
                <li className="flex items-start gap-1.5">
                  <span className="text-[#333333] font-bold">•</span>
                  <span>Target ketahanan 8+ jam umumnya memerlukan notes dasar ambery/woody yang lebih berat.</span>
                </li>
              )}
              {answers.avoidNotesOrTraits.length > 1 && !answers.avoidNotesOrTraits.includes('none') && (
                <li className="flex items-start gap-1.5">
                  <span className="text-[#333333] font-bold">•</span>
                  <span>Beberapa catatan yang dihindari ({answers.avoidNotesOrTraits.length} filter) memicu penalti scoring.</span>
                </li>
              )}
              {!includeOwned && ownedPerfumeIds.length > 0 && (
                <li className="flex items-start gap-1.5">
                  <span className="text-[#333333] font-bold">•</span>
                  <span>{ownedPerfumeIds.length} parfum di Pustakamu saat ini dikecualikan dari hasil pencarian.</span>
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!includeOwned && ownedPerfumeIds.length > 0 && (
              <button
                onClick={() => setIncludeOwned(true)}
                className="min-h-[48px] px-5 py-2 border border-[#8a8a8a] hover:border-[#333333] text-[14px] font-medium text-[#000000]"
              >
                {locale === 'id' ? 'Sertakan Parfum yang Dimiliki' : 'Include Owned Perfumes'}
              </button>
            )}

            <button
              onClick={handleResetQuiz}
              className="min-h-[48px] px-6 py-2.5 bg-[#333333] hover:bg-black text-[#fffef2] text-[14px] font-medium flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{locale === 'id' ? 'Sesuaikan Jawaban Kuis' : 'Adjust Quiz Answers'}</span>
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
        
        {/* Top Header & Curation Method Disclosure */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d9d7c9] pb-6">
          <div className="space-y-1">
            <span className="text-[12px] uppercase tracking-widest text-[#5c5c5c] font-medium block">
              {locale === 'id' ? 'Hasil Scent Finder 6-Dimensi' : '6-Dimension Scent Finder Results'}
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal">
              {locale === 'id' ? 'Kurasi Wewangian yang Sungguh Cocok' : 'Personalized Fragrance Matches'}
            </h2>
            <p className="text-[16px] leading-[24px] text-[#5c5c5c] max-w-2xl">
              {locale === 'id'
                ? 'Dihitung secara deterministik berdasarkan pencocokan selera (taste matching) 6 dimensi objektif terhadap profil wewangian resmi. Bebas promosi berbayar.'
                : 'Calculated deterministically using objective 6-dimension taste matching against official perfume profiles. Free of commercial bias.'}
            </p>
          </div>

          {/* Controls: Owned Perfumes Toggle & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 border border-[#8a8a8a] bg-[#fffef2] cursor-pointer hover:border-[#333333] transition text-[12px] font-medium min-h-[44px]">
              <input
                type="checkbox"
                checked={includeOwned}
                onChange={e => setIncludeOwned(e.target.checked)}
                className="w-4 h-4 accent-[#333333] cursor-pointer"
              />
              <span className="text-[#000000]">{locale === 'id' ? 'Sertakan parfum yang saya miliki' : 'Include perfumes I own'}</span>
            </label>

            <button
              onClick={() => setFilterLocalOnly(prev => !prev)}
              className={`min-h-[44px] px-3.5 py-1.5 border text-[12px] font-medium transition ${
                filterLocalOnly 
                  ? 'bg-[#333333] text-[#fffef2] border-[#333333]' 
                  : 'bg-[#fffef2] border-[#8a8a8a] text-[#000000] hover:border-[#333333]'
              }`}
            >
              {filterLocalOnly 
                ? (locale === 'id' ? '✓ Hanya Brand Lokal' : '✓ Local Brands Only') 
                : (locale === 'id' ? 'Semua Asal Brand' : 'All Brand Origins')}
            </button>

            <button
              onClick={handleResetQuiz}
              className="min-h-[44px] px-3.5 py-1.5 border border-[#8a8a8a] hover:border-[#333333] text-[12px] font-medium text-[#000000] flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#333333]" />
              <span>{locale === 'id' ? 'Ubah Preferensi' : 'Retake Quiz'}</span>
            </button>
          </div>
        </div>

        {/* ── 0. TASTE PROFILE ARCHETYPE CARD (FIND-06) ── */}
        <div className="bg-[#fffef2] border border-[#d9d7c9] p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#333333] text-[#fffef2] text-[12px] font-mono px-2 py-0.5 uppercase tracking-wider font-medium">
                  {locale === 'id' ? 'Profil Selera Aroma' : 'Taste Profile Archetype'}
                </span>
                <span className="text-[12px] font-mono text-[#5c5c5c] font-semibold">
                  {userName ? `@${userName}` : (locale === 'id' ? 'Pencinta Aroma' : 'Fragrance Enthusiast')}
                </span>
              </div>
              <h3 className="font-serif text-[24px] md:text-[28px] leading-[32px] md:leading-[36px] font-normal text-[#000000]">
                {tastePersona.title}
              </h3>
              <p className="text-[14px] leading-[22px] text-[#5c5c5c] max-w-2xl">
                {tastePersona.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTasteProfile}
                className="min-h-[44px] px-3.5 py-1.5 border border-[#8a8a8a] hover:border-[#333333] text-[12px] font-medium text-[#000000] flex items-center gap-1.5 transition"
              >
                {copiedProfile ? <CheckCircle2 className="w-3.5 h-3.5 text-[#333333]" /> : <Copy className="w-3.5 h-3.5 text-[#5c5c5c]" />}
                <span>{copiedProfile ? (locale === 'id' ? 'Tersalin!' : 'Copied!') : (locale === 'id' ? 'Salin Profil' : 'Copy Profile')}</span>
              </button>
              <button
                onClick={handleSaveTasteProfile}
                className="min-h-[44px] px-3.5 py-1.5 bg-[#f4f3e6] border border-[#d9d7c9] hover:border-[#333333] text-[12px] font-medium text-[#000000] flex items-center gap-1.5 transition"
              >
                {savedProfile ? <CheckCircle2 className="w-3.5 h-3.5 text-[#333333]" /> : <Bookmark className="w-3.5 h-3.5 text-[#333333]" />}
                <span>{savedProfile ? (locale === 'id' ? 'Tersimpan!' : 'Saved!') : (locale === 'id' ? 'Simpan ke Akun' : 'Save to Profile')}</span>
              </button>
            </div>
          </div>

          {/* Persona Signature Tags */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#d9d7c9]">
            {tastePersona.tags.map((tag, idx) => (
              <span key={idx} className="bg-[#f4f3e6] text-[#000000] text-[12px] font-mono px-2.5 py-1 border border-[#d9d7c9]">
                #{tag}
              </span>
            ))}
            <span className="bg-[#fffef2] text-[#5c5c5c] text-[12px] font-mono px-2.5 py-1 border border-[#d9d7c9]">
              Iklim: {answers.climateSetting === 'outdoor_hot' ? 'Outdoor Tropis' : answers.climateSetting === 'indoor_ac' ? 'Ruang Ber-AC' : answers.climateSetting === 'evening_cool' ? 'Malam/Cuaca Dingin' : 'Fleksibel'}
            </span>
            <span className="bg-[#fffef2] text-[#5c5c5c] text-[12px] font-mono px-2.5 py-1 border border-[#d9d7c9]">
              Situasi: {answers.occasionSetting === 'daily_office' ? 'Kantor/Harian' : answers.occasionSetting === 'casual_dating' ? 'Kencan/Santai' : answers.occasionSetting === 'formal_evening' ? 'Pesta/Formal' : answers.occasionSetting === 'outdoor_sport' ? 'Olahraga' : 'Fleksibel'}
            </span>
            <span className="bg-[#fffef2] text-[#5c5c5c] text-[12px] font-mono px-2.5 py-1 border border-[#d9d7c9]">
              Ketahanan: {answers.longevityExpectation === 'light' ? '3–5 Jam' : answers.longevityExpectation === 'moderate' ? '6–8 Jam' : answers.longevityExpectation === 'long' ? '8–12+ Jam' : 'Fleksibel'}
            </span>
            <span className="bg-[#fffef2] text-[#5c5c5c] text-[12px] font-mono px-2.5 py-1 border border-[#d9d7c9]">
              Anggaran: {answers.budgetTier === 'budget' ? '< Rp 250k' : answers.budgetTier === 'mid' ? 'Rp 250k–600k' : answers.budgetTier === 'premium' ? '> Rp 600k' : 'Fleksibel'}
            </span>
          </div>
        </div>

        {/* ── 1. HERO TOP MATCH CARD ── */}
        <div className="bg-[#fffef2] border border-[#333333] p-6 md:p-8 space-y-6 relative">
          
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#d9d7c9] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#333333] text-[#fffef2] text-[12px] font-mono px-2 py-0.5 font-medium uppercase tracking-wider">
                  #1 {locale === 'id' ? 'Rekomendasi Utama' : 'Top Recommendation'}
                </span>
                <span className="text-[12px] font-mono uppercase bg-[#f4f3e6] border border-[#d9d7c9] px-2 py-0.5 text-[#000000]">
                  {topMatch.perfume.origin === 'ID' ? 'Lokal Indonesia' : 'Global / Internasional'}
                </span>
              </div>
              <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal pt-1">
                {topMatch.perfume.brand} — {topMatch.perfume.name}
              </h2>
              <p className="font-mono tabular-nums text-[12px] text-[#5c5c5c] flex flex-wrap items-center gap-1.5">
                <span>
                  {topMatch.perfume.concentration} · {topMatch.perfume.primary_family} {topMatch.perfume.secondary_family ? `/ ${topMatch.perfume.secondary_family}` : ''} · {formatCurrency(topMatch.perfume.reference_price_idr, locale)} ({topMatch.perfume.reference_price_size_ml} ml)
                </span>
                <span className="px-1.5 py-0.5 bg-[#f4f3e6] border border-[#d9d7c9] text-[10px] font-sans">
                  {locale === 'id' ? 'Data contoh' : 'Sample data'}
                </span>
              </p>
            </div>

            {/* Match Score Badge (Capped at 96) */}
            <div className="text-right bg-[#fffef2] p-4 border border-[#d9d7c9] min-w-[150px]">
              <span className="text-[12px] font-mono uppercase text-[#5c5c5c] block">
                Match Score
              </span>
              <span className="font-serif text-[40px] leading-none font-normal text-[#000000] tabular-nums">
                {topMatch.matchScore}%
              </span>
              <span className="text-[12px] text-[#000000] font-medium block pt-1">
                {topMatch.matchScore >= 90 
                  ? (locale === 'id' ? 'Kecocokan Sangat Tinggi' : 'Very High Match') 
                  : (locale === 'id' ? 'Kecocokan Bagus' : 'Good Match')}
              </span>
              <span className="text-[12px] font-mono text-[#5c5c5c] block pt-0.5">
                (Batas kalibrasi maks 96%)
              </span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* EXACT 6-DIMENSION BREAKDOWN */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] uppercase font-bold text-[#000000] tracking-wider block">
                {locale === 'id' ? 'Rincian 6 Dimensi Kecocokan (Scoring Breakdown):' : '6-Dimension Match Breakdown:'}
              </span>
              <span className="text-[12px] font-mono text-[#5c5c5c]">
                {locale === 'id' 
                  ? 'Jumlah poin dimensi sama persis dengan skor total' 
                  : 'Dimension points sum exactly to total score'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {topMatch.breakdownRows.map((row, idx) => {
                const fitDisplay = row.isNoData ? 'Tanpa Data' : row.fit !== null ? `${Math.round(row.fit * 100)}% Fit` : 'Bebas';
                const pctWidth = row.isNoData ? 50 : row.fit !== null ? Math.round(row.fit * 100) : 70;

                return (
                  <div key={row.key} className="bg-[#fffef2] p-3.5 border border-[#d9d7c9] space-y-2">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="font-semibold text-[#000000]">
                        {locale === 'id' ? row.labelId : row.labelEn}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-[#000000]">
                        {row.points} / {row.maxPoints} pts
                      </span>
                    </div>

                    {/* Mini progress bar: animates row-by-row */}
                    <div className="w-full bg-[#f4f3e6] h-1.5 overflow-hidden border border-[#d9d7c9]">
                      <div 
                        className={`h-full animate-bar-grow ${row.isNoData ? 'bg-[#8a8a8a]' : 'bg-[#333333]'}`}
                        style={{ 
                          width: `${pctWidth}%`,
                          animationDelay: `${idx * 30}ms`
                        }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-[12px] text-[#5c5c5c]">
                      <span>{fitDisplay}</span>
                      <span className="truncate max-w-[140px] italic">
                        {locale === 'id' ? row.citationId : row.citationEn}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explicit Adjustment Row */}
            {topMatch.adjustment && (
              <div className="bg-[#f4f3e6] border border-[#d9d7c9] p-3 text-[12px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#333333] shrink-0" />
                  <span className="text-[#000000]">
                    <strong>{locale === 'id' ? 'Penyesuaian Bukti Kalibrasi (Adjustment):' : 'Calibration Adjustment:'}</strong> {locale === 'id' ? topMatch.adjustment.reasonId : topMatch.adjustment.reasonEn}
                  </span>
                </div>
                <span className="font-mono tabular-nums font-bold text-[#b3261e] shrink-0">
                  {topMatch.adjustment.points} pts
                </span>
              </div>
            )}
          </div>

          {/* Notes Pyramid Snapshot */}
          <div className="bg-[#fffef2] p-4 border border-[#d9d7c9] text-[12px] space-y-1">
            <span className="text-[12px] font-bold uppercase text-[#5c5c5c] block">
              {locale === 'id' ? 'Karakter Piramida Notes:' : 'Notes Pyramid Character:'}
            </span>
            <p className="text-[#333333] leading-relaxed">
              <strong>Top:</strong> {topMatch.perfume.top_notes} · <strong>Heart:</strong> {topMatch.perfume.heart_notes} · <strong>Base:</strong> {topMatch.perfume.base_notes}
            </p>
          </div>

          {/* Dual Evidence Columns: "Why it fits" vs "Possible mismatch" (Requirement 6: clearly separated, mismatch gets its own bordered block) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Why Fits */}
            <div className="p-5 bg-[#f4f3e6] border border-[#d9d7c9] space-y-2.5">
              <span className="text-[12px] font-mono uppercase tracking-wider font-bold text-[#000000] flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#333333]" />
                <span>{locale === 'id' ? 'Mengapa Cocok Untukmu (Grounded Evidence)' : 'Why It Fits Your Profile'}</span>
              </span>

              <ul className="text-[12px] text-[#333333] space-y-1.5">
                {(locale === 'id' ? topMatch.whyFitsBulletsId : topMatch.whyFitsBulletsEn).map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#333333] font-bold">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Possible Mismatch: gets its own bordered block, never buried */}
            <div className="p-5 bg-[#fffef2] border-2 border-[#333333] space-y-2.5">
              <span className="text-[12px] font-mono uppercase tracking-wider font-bold text-[#000000] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#333333]" />
                <span>{locale === 'id' ? 'Kemungkinan Kurang Cocok (Weakest Dimension)' : 'Possible Mismatch (Weakest Dimension)'}</span>
              </span>
              
              <p className="text-[13px] text-[#000000] leading-relaxed font-medium">
                {locale === 'id' ? topMatch.possibleMismatchId : topMatch.possibleMismatchEn}
              </p>

              <p className="text-[11px] text-[#5c5c5c] pt-1 border-t border-[#d9d7c9]">
                {locale === 'id'
                  ? 'Catatan ini dihitung secara dinamis dari dimensi dengan kecocokan terendah agar kamu terhindar dari salah beli.'
                  : 'Computed dynamically from the lowest-scoring dimension to safeguard against blind-buy disappointment.'}
              </p>
            </div>

          </div>

          {/* Hero CTAs: Exactly ONE primary filled button per card! */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#d9d7c9]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onToggleWishlist(topMatch.perfume.id)}
                className={`min-h-[48px] px-4 py-2 text-[12px] font-medium flex items-center gap-1.5 border transition ${
                  wishlistIds.includes(topMatch.perfume.id)
                    ? 'bg-[#333333] border-[#333333] text-[#fffef2]'
                    : 'bg-[#fffef2] border-[#8a8a8a] text-[#000000] hover:border-[#333333]'
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlistIds.includes(topMatch.perfume.id) ? 'fill-[#fffef2]' : ''}`} />
                <span>{wishlistIds.includes(topMatch.perfume.id) ? (locale === 'id' ? 'Di Wishlist' : 'Wishlisted') : (locale === 'id' ? 'Simpan Wishlist' : 'Add to Wishlist')}</span>
              </button>

              <button
                onClick={() => onToggleCompare(topMatch.perfume.id)}
                className={`min-h-[48px] px-4 py-2 text-[12px] font-medium flex items-center gap-1.5 border transition ${
                  compareIds.includes(topMatch.perfume.id)
                    ? 'bg-[#333333] text-[#fffef2] border-[#333333]'
                    : 'bg-[#fffef2] border-[#8a8a8a] text-[#000000] hover:border-[#333333]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{compareIds.includes(topMatch.perfume.id) ? (locale === 'id' ? 'Di Komparasi' : 'Compared') : (locale === 'id' ? 'Bandingkan' : 'Compare')}</span>
              </button>

              <button
                onClick={() => onOpenTryItFirst(topMatch.perfume.id)}
                className="min-h-[48px] px-4 py-2 bg-[#fffef2] hover:border-[#333333] border border-[#8a8a8a] text-[12px] font-medium text-[#000000] transition flex items-center gap-1.5"
              >
                <PackageCheck className="w-4 h-4 text-[#333333]" />
                <span>{locale === 'id' ? 'Coba Sample Dulu' : 'Try Sample First'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onSelectPerfume(topMatch.perfume.id)}
                className="min-h-[48px] px-5 py-2 border border-[#8a8a8a] hover:border-[#333333] text-[14px] font-medium text-[#000000]"
              >
                {locale === 'id' ? 'Lihat Detail Specs' : 'View Full Specs'}
              </button>

              {/* EXACTLY ONE PRIMARY FILLED BUTTON FOR HERO CARD */}
              <a
                href={`/go/${topMatch.perfume.id}?platform=shopee&src=scent_finder_hero`}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="min-h-[48px] px-6 py-2.5 bg-[#333333] hover:bg-black text-[#fffef2] text-[14px] font-medium flex items-center gap-2 transition"
              >
                <span>{locale === 'id' ? 'Beli Resmi di Shopee Mall' : 'Buy Official on Shopee'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-[#5c5c5c] pt-2 w-full">
              {locale === 'id'
                ? 'Kami bisa menerima komisi jika kamu membeli lewat tautan ini. Komisi tidak memengaruhi skor kecocokanmu.'
                : 'We may earn a commission if you buy through these links. It never changes your match score.'}
            </p>
          </div>

        </div>

        {/* ── 2. LABELLED QUALIFIED ALTERNATIVES (Requirement 8) ── */}
        {alternatives.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-baseline border-b border-[#d9d7c9] pb-3">
              <div className="space-y-0.5">
                <span className="text-[12px] font-mono uppercase tracking-widest text-[#5c5c5c] font-medium block">
                  {locale === 'id' ? 'Alternatif Terkualifikasi' : 'Qualified Alternatives'}
                </span>
                <h3 className="font-serif text-[24px] md:text-[28px] leading-[32px] md:leading-[36px] font-normal text-[#000000]">
                  {locale === 'id' ? 'Pilihan Alternatif yang Memenuhi Standar' : 'Qualified Alternative Recommendations'}
                </h3>
              </div>
              <span className="text-[12px] text-[#5c5c5c]">
                {locale === 'id' ? 'Disesuaikan dengan preferensi belanja spesifik' : 'Tailored to shopping intent'}
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
                    className="bg-[#fffef2] border border-[#333333] p-5 space-y-4 flex flex-col justify-between h-full animate-card-enter"
                    style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="bg-[#333333] text-[#fffef2] text-[12px] font-mono px-2 py-0.5 font-medium uppercase tracking-wider">
                          {locale === 'id' ? alt.badgeLabelId : alt.badgeLabelEn}
                        </span>
                        <span className="font-mono tabular-nums text-[12px] font-bold text-[#000000]">
                          {rec.matchScore}% Match
                        </span>
                      </div>

                      <div 
                        onClick={() => onSelectPerfume(p.id)}
                        className="cursor-pointer hover:underline space-y-0.5"
                      >
                        <span className="text-[12px] uppercase tracking-wider text-[#5c5c5c] font-medium block">
                          {p.brand}
                        </span>
                        <h4 className="font-sans text-[18px] leading-[24px] font-medium text-[#000000] line-clamp-2 h-[48px]">{p.name}</h4>
                        <p className="text-[12px] font-mono tabular-nums text-[#5c5c5c] flex flex-wrap items-center gap-1.5">
                          <span>{p.concentration} · {p.primary_family} · {formatCurrency(p.reference_price_idr, locale)}</span>
                          <span className="px-1 py-0.5 bg-[#f4f3e6] border border-[#d9d7c9] text-[9px] font-sans">
                            {locale === 'id' ? 'Data contoh' : 'Sample data'}
                          </span>
                        </p>
                      </div>

                      {/* Alternative specific note */}
                      <p className="text-[12px] text-[#333333] bg-[#f4f3e6] p-2.5 border border-[#d9d7c9] leading-relaxed">
                        {locale === 'id' ? alt.detailNoteId : alt.detailNoteEn}
                      </p>

                      {/* Weakest dimension mismatch note */}
                      <p className="text-[12px] text-[#333333] border-l-2 border-[#8a8a8a] pl-2">
                        {locale === 'id' ? rec.possibleMismatchId : rec.possibleMismatchEn}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#d9d7c9] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onToggleWishlist(p.id)}
                          className={`p-2 border transition min-h-[44px] min-w-[44px] flex items-center justify-center ${isWish ? 'bg-[#333333] border-[#333333] text-[#fffef2]' : 'border-[#8a8a8a] hover:border-[#333333] text-[#000000]'}`}
                          title="Simpan Wishlist"
                        >
                          <Heart className={`w-4 h-4 ${isWish ? 'fill-[#fffef2]' : ''}`} />
                        </button>
                        <button
                          onClick={() => onToggleCompare(p.id)}
                          className={`p-2 border transition min-h-[44px] min-w-[44px] flex items-center justify-center ${isComp ? 'bg-[#333333] text-[#fffef2] border-[#333333]' : 'border-[#8a8a8a] hover:border-[#333333] text-[#000000]'}`}
                          title="Bandingkan"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenTryItFirst(p.id)}
                          className="px-3 py-1.5 bg-[#f4f3e6] hover:border-[#333333] border border-[#d9d7c9] text-[12px] font-medium text-[#000000] min-h-[44px]"
                        >
                          Sample
                        </button>
                      </div>

                      {/* Exactly ONE primary filled button per card */}
                      <button
                        onClick={() => onSelectPerfume(p.id)}
                        className="min-h-[44px] px-3.5 py-1.5 bg-[#333333] hover:bg-black text-[#fffef2] text-[12px] font-medium transition"
                      >
                        Detail Specs →
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
            <div className="flex justify-between items-baseline border-b border-[#d9d7c9] pb-3">
              <div className="space-y-0.5">
                <span className="text-[12px] font-mono uppercase tracking-widest text-[#5c5c5c] font-medium block">
                  {locale === 'id' ? 'Kurasi Alternatif' : 'Alternative Selections'}
                </span>
                <h3 className="font-serif text-[24px] md:text-[28px] leading-[32px] md:leading-[36px] font-normal text-[#000000]">
                  {locale === 'id' ? 'Koleksi Rekomendasi Teratas Lainnya' : 'Other Highly Matched Fragrances'}
                </h3>
              </div>
              <span className="text-[12px] text-[#5c5c5c]">
                {runnersUp.length} wewangian dengan skor kecocokan tinggi
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
                    className="bg-[#fffef2] border border-[#d9d7c9] p-5 space-y-3 flex flex-col justify-between hover:border-[#333333] transition h-full"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[12px] text-[#5c5c5c]">
                        <span className="font-mono tabular-nums">#{idx + 2} {locale === 'id' ? 'Pilihan' : 'Rank'}</span>
                        <div className="flex items-center gap-1 bg-[#f4f3e6] px-2 py-0.5 border border-[#d9d7c9] font-mono tabular-nums font-bold text-[#000000]">
                          <span>Match: {rec.matchScore}%</span>
                        </div>
                      </div>

                      <div 
                        onClick={() => onSelectPerfume(p.id)}
                        className="cursor-pointer hover:underline"
                      >
                        <span className="text-[12px] uppercase tracking-wider text-[#5c5c5c] font-medium block">
                          {p.brand}
                        </span>
                        <h4 className="font-sans text-[18px] leading-[24px] font-medium text-[#000000] line-clamp-2 h-[48px]">{p.name}</h4>
                      </div>

                      <p className="text-[12px] font-mono tabular-nums text-[#5c5c5c]">
                        {p.concentration} · {p.primary_family} · {formatCurrency(p.reference_price_idr, locale)}
                      </p>

                      {/* Evidence snapshot */}
                      <div className="bg-[#f4f3e6] p-2.5 border border-[#d9d7c9] text-[12px] space-y-1">
                        <p className="text-[#000000] font-medium">
                          ✓ {locale === 'id' ? rec.whyFitsBulletsId[0] : rec.whyFitsBulletsEn[0]}
                        </p>
                        <p className="text-[#5c5c5c] text-[12px] border-t border-[#d9d7c9] pt-1">
                          ℹ {locale === 'id' ? rec.possibleMismatchId : rec.possibleMismatchEn}
                        </p>
                      </div>

                      {/* Expandable 6-dimension scores summing exactly to score */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedRunnerUpId(expandedRunnerUpId === p.id ? null : p.id)}
                          className="text-[12px] font-mono text-[#000000] underline flex items-center gap-1 min-h-[36px]"
                        >
                          <span>{expandedRunnerUpId === p.id ? (locale === 'id' ? '▲ Tutup Rincian 6D' : '▲ Hide 6D Breakdown') : (locale === 'id' ? '▼ Rincian Skor 6 Dimensi' : '▼ 6D Match Breakdown')}</span>
                        </button>

                        {expandedRunnerUpId === p.id && (
                          <div className="space-y-1 pt-2 text-[12px] font-mono tabular-nums bg-[#f4f3e6] p-2.5 border border-[#d9d7c9] mt-1.5">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              {rec.breakdownRows.map(r => (
                                <div key={r.key} className="flex justify-between">
                                  <span>{r.labelId.split(' ')[0]}:</span>
                                  <span className="font-bold">{r.points}/{r.maxPoints} pts</span>
                                </div>
                              ))}
                            </div>
                            {rec.adjustment && (
                              <div className="pt-1 border-t border-[#d9d7c9] text-[#b3261e] flex justify-between">
                                <span>Penyesuaian:</span>
                                <span>{rec.adjustment.points} pts</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#d9d7c9] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onToggleWishlist(p.id)}
                          className={`p-2 border transition min-h-[44px] min-w-[44px] flex items-center justify-center ${isWish ? 'bg-[#333333] border-[#333333] text-[#fffef2]' : 'border-[#8a8a8a] hover:border-[#333333] text-[#000000]'}`}
                          title="Simpan Wishlist"
                        >
                          <Heart className={`w-4 h-4 ${isWish ? 'fill-[#fffef2]' : ''}`} />
                        </button>

                        <button
                          onClick={() => onToggleCompare(p.id)}
                          className={`p-2 border transition min-h-[44px] min-w-[44px] flex items-center justify-center ${isComp ? 'bg-[#333333] text-[#fffef2] border-[#333333]' : 'border-[#8a8a8a] hover:border-[#333333] text-[#000000]'}`}
                          title="Bandingkan"
                        >
                          <Layers className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenTryItFirst(p.id)}
                          className="px-3 py-1.5 bg-[#f4f3e6] hover:border-[#333333] border border-[#d9d7c9] text-[12px] font-medium text-[#000000] min-h-[44px]"
                        >
                          Sample
                        </button>
                      </div>

                      {/* Exactly ONE primary filled button per card */}
                      <button
                        onClick={() => onSelectPerfume(p.id)}
                        className="min-h-[44px] px-3.5 py-1.5 bg-[#333333] hover:bg-black text-[#fffef2] text-[12px] font-medium transition"
                      >
                        Detail Specs →
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
    <div className="space-y-8 max-w-2xl mx-auto pb-16">
      
      {/* Step Indicator Header */}
      <div className="space-y-3 text-center">
        <p className="text-[12px] uppercase tracking-widest text-[#5c5c5c] font-medium">
          {locale === 'id' ? `Pertanyaan ${currentStep} dari 7` : `Question ${currentStep} of 7`}
        </p>

        {/* Progress Bar (Requirement 4: thin progress line that animates to each step) */}
        <div className="w-full bg-[#d9d7c9] h-1 overflow-hidden">
          <div 
            className="bg-[#333333] h-full transition-all duration-300 ease-out" 
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
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#5c5c5c] font-medium block">
              Dimensi 1: Notes & Family (Bobot 25 Poin)
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal">
              {locale === 'id' ? 'Keluarga aroma apa yang paling menarik bagimu?' : 'Which scent families appeal to you most?'}
            </h2>
            <p className="text-[14px] text-[#5c5c5c]">
              {locale === 'id' ? 'Pilih satu atau lebih kategori, atau pilih "Tidak Yakin" untuk saran terbuka.' : 'Select one or more, or choose "Not Sure" for open exploration.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[12px]">
            {[
              { id: 'Woody', label: 'Woody (Kayu & Hutan)', desc: 'Cendana, cedarwood, vetiver hangat, tenang & berwibawa.' },
              { id: 'Fresh', label: 'Fresh / Citrus & Aquatic', desc: 'Bergamot, jeruk segar, udara laut, bersih & berenergi.' },
              { id: 'Floral', label: 'Floral (Kelopak Bunga)', desc: 'Mawar, melati, peony, anggun, romantis & ramah.' },
              { id: 'Gourmand', label: 'Gourmand (Manis Lezat)', desc: 'Vanila, karamel, kopi, almond, lezat & menggoda.' },
              { id: 'Ambery', label: 'Ambery / Oriental Rempah', desc: 'Resin ambery, kapulaga, kayu manis, hangat & eksotis.' },
              { id: 'Aromatic', label: 'Aromatic & Herbal', desc: 'Lavender, sage, mint, teh hijau, sejuk & menenangkan.' },
              { id: 'not_sure', label: 'Tidak Yakin / Bebas', desc: 'Rekomendasikan aroma terbaik tanpa batasan keluarga.' }
            ].map(item => {
              const isSelected = answers.preferredFamilies.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleFamily(item.id)}
                  className={`p-4 border cursor-pointer transition flex items-start justify-between ${
                    isSelected ? 'border-2 border-[#333333] bg-[#f4f3e6]' : 'border-[#d9d7c9] bg-[#fffef2] hover:bg-[#f4f3e6]'
                  }`}
                >
                  <div className="space-y-1 pr-3">
                    <span className="font-semibold block text-[14px] text-[#000000]">{item.label}</span>
                    <span className="text-[12px] text-[#5c5c5c] leading-relaxed block">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 border flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-[#333333] text-[#fffef2] border-[#333333]' : 'border-[#8a8a8a]'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: CLIMATE & ENVIRONMENT (Weight: 20) ── */}
      {currentStep === 2 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#5c5c5c] font-medium block">
              Dimensi 2: Iklim Tropis (Bobot 20 Poin)
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal">
              {locale === 'id' ? 'Di mana kamu paling sering memakai parfum ini?' : 'Where will you wear this fragrance most?'}
            </h2>
            <p className="text-[14px] text-[#5c5c5c]">
              {locale === 'id' ? 'Suhu dan kelembapan Indonesia sangat memengaruhi kinerja ketahanan aroma.' : 'Tropical humidity strongly dictates perfume performance.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {[
              { id: 'outdoor_hot', label: 'Outdoor / Siang Hari Panas Tropis', desc: 'Formula tahan keringat yang tidak memicu pusing di tengah terik matahari.' },
              { id: 'indoor_ac', label: 'Ruangan Ber-AC Sepanjang Hari (Kantor / Kampus)', desc: 'Suhu stabil dan sejuk, nyaman untuk aroma berjejak sedang yang sopan.' },
              { id: 'evening_cool', label: 'Malam Hari / Acara Kencan & Cuaca Dingin', desc: 'Cocok untuk aroma yang lebih manis, dalam, hangat, dan berjejak kuat.' },
              { id: 'flexible', label: 'Fleksibel / Serbaguna Segala Situasi', desc: 'Aroma adaptif yang bertransisi mulus dari pagi kantor hingga santai malam.' }
            ].map(item => {
              const isSelected = answers.climateSetting === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, climateSetting: item.id }))}
                  className={`p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-[#333333] bg-[#f4f3e6]' : 'border-[#d9d7c9] bg-[#fffef2] hover:bg-[#f4f3e6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-[#000000]">{item.label}</span>
                    <span className="text-[12px] text-[#5c5c5c]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#333333] text-[#fffef2] border-[#333333]' : 'border-[#8a8a8a]'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 3: OCCASION & SETTING (Weight: 20) ── */}
      {currentStep === 3 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#5c5c5c] font-medium block">
              Dimensi 3: Acara & Momen (Bobot 20 Poin)
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal">
              {locale === 'id' ? 'Untuk momen apa kamu mencari parfum ini?' : 'What occasion are you shopping for?'}
            </h2>
            <p className="text-[14px] text-[#5c5c5c]">
              {locale === 'id' ? 'Mencocokkan kesantunan proyeksi dan konsentrasi wewangian.' : 'Matches projection etiquette and concentration.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {[
              { id: 'daily_office', label: 'Ruang Kerja / Kantor & Kampus Harian', desc: 'Rapi, sopan, bersih, dan tidak menginvasi ruang pribadi rekan kerja.' },
              { id: 'casual_dating', label: 'Kencan, Hangout Santai & Sore/Malam', desc: 'Aroma memikat, intim, ramah, dan memancarkan daya tarik magnetis.' },
              { id: 'formal_evening', label: 'Pesta, Gala & Momen Khusus Formal', desc: 'Konsentrasi kaya, berkarakter tegas, dan memancarkan wibawa elegan.' },
              { id: 'outdoor_sport', label: 'Olahraga & Aktivitas Luar Ruangan Aktif', desc: 'Aroma berenergi segar yang tetap bersih saat bercampur dengan keringat.' },
              { id: 'flexible', label: 'Fleksibel / Serbaguna Segala Momen', desc: 'Tanpa data pembatas, cari wewangian yang adaptif di berbagai situasi.' }
            ].map(item => {
              const isSelected = (answers.occasionSetting || 'daily_office') === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, occasionSetting: item.id }))}
                  className={`p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-[#333333] bg-[#f4f3e6]' : 'border-[#d9d7c9] bg-[#fffef2] hover:bg-[#f4f3e6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-[#000000]">{item.label}</span>
                    <span className="text-[12px] text-[#5c5c5c]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#333333] text-[#fffef2] border-[#333333]' : 'border-[#8a8a8a]'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 4: LONGEVITY EXPECTATION (Weight: 15) ── */}
      {currentStep === 4 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#5c5c5c] font-medium block">
              Dimensi 4: Ketahanan Kulit (Bobot 15 Poin)
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal">
              {locale === 'id' ? 'Berapa lama ketahanan aroma yang kamu butuhkan?' : 'How long should the scent last?'}
            </h2>
            <p className="text-[14px] text-[#5c5c5c]">
              {locale === 'id' ? 'Ekspektasi realistis membantu mencocokkan konsentrasi EDT, EDP, atau Extrait.' : 'Helps match EDT, EDP, or Extrait concentrations.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {[
              { id: 'light', label: '3–5 Jam (Ringan & Cepat Berganti)', desc: 'Cocok untuk olahraga atau santai tanpa mengikat aromanya seharian.' },
              { id: 'moderate', label: '6–8 Jam (Standar Jam Kerja Seharian)', desc: 'Cukup disemprot pagi hari dan tetap tercium hingga sore pulang kantor.' },
              { id: 'long', label: '8–12+ Jam (Daya Tahan Ekstra Panjang)', desc: 'Konsentrasi pekat yang bertahan hingga malam bahkan setelah mandi.' },
              { id: 'not_sure', label: 'Tidak Yakin / Fleksibel', desc: 'Fokus pada keindahan aroma, saya bersedia semprot ulang jika perlu.' }
            ].map(item => {
              const isSelected = answers.longevityExpectation === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, longevityExpectation: item.id }))}
                  className={`p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-[#333333] bg-[#f4f3e6]' : 'border-[#d9d7c9] bg-[#fffef2] hover:bg-[#f4f3e6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-[#000000]">{item.label}</span>
                    <span className="text-[12px] text-[#5c5c5c]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#333333] text-[#fffef2] border-[#333333]' : 'border-[#8a8a8a]'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 5: GENDER EXPRESSION (Weight: 10) ── */}
      {currentStep === 5 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#5c5c5c] font-medium block">
              Dimensi 5: Ekspresi Gender (Bobot 10 Poin)
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal">
              {locale === 'id' ? 'Apa preferensi ekspresi gender untuk aroma ini?' : 'What is your gender expression preference?'}
            </h2>
            <p className="text-[14px] text-[#5c5c5c]">
              {locale === 'id' ? 'Membantu menyaring nuansa aroma maskulin, feminin, atau unisex universal.' : 'Helps focus on masculine, feminine, or universal unisex facets.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {[
              { id: 'unisex', label: 'Netral / Unisex (Aroma Universal)', desc: 'Keseimbangan modern tanpa sekat gender, luwes dipakai oleh siapa saja.' },
              { id: 'masculine', label: 'Maskulin (Aroma Tegas, Segar Kayu atau Rempah)', desc: 'Didominasi nuansa kayu, vetiver, citrus tajam, atau aromatic berwibawa.' },
              { id: 'feminine', label: 'Feminin (Aroma Manis, Bunga Anggun atau Buah)', desc: 'Didominasi kelopak mawar, melati, buah manis segar, atau vanilla lembut.' },
              { id: 'any', label: 'Bebas / Tanpa Batasan Gender', desc: 'Fokus pada keindahan komposisi aroma tanpa membatasi label gender.' }
            ].map(item => {
              const isSelected = (answers.genderPreference || 'any') === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, genderPreference: item.id }))}
                  className={`p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-[#333333] bg-[#f4f3e6]' : 'border-[#d9d7c9] bg-[#fffef2] hover:bg-[#f4f3e6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-[#000000]">{item.label}</span>
                    <span className="text-[12px] text-[#5c5c5c]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#333333] text-[#fffef2] border-[#333333]' : 'border-[#8a8a8a]'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 6: BUDGET TIER (Weight: 10) ── */}
      {currentStep === 6 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#5c5c5c] font-medium block">
              Dimensi 6: Kesesuaian Anggaran (Bobot 10 Poin)
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal">
              {locale === 'id' ? 'Berapa rentang anggaran yang kamu siapkan?' : 'What is your budget tier?'}
            </h2>
            <p className="text-[14px] text-[#5c5c5c]">
              {locale === 'id' ? 'Senstoria menampilkan harga referensi resmi per botol penuh.' : 'Official transparent reference pricing.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {[
              { id: 'budget', label: 'Terjangkau (< Rp 250.000)', desc: 'Pilihan hemat bernilai tinggi untuk pemakaian harian santai.' },
              { id: 'mid', label: 'Menengah (Rp 250.000 – Rp 600.000)', desc: 'Titik temu terpopuler kualitas artisanal lokal dan desainer entry-level.' },
              { id: 'premium', label: 'Premium / Niche (> Rp 600.000)', desc: 'Bahan baku berkualitas langka, artisan independen, dan desainer mewah.' },
              { id: 'flexible', label: 'Fleksibel / Segala Rentang Harga', desc: 'Rekomendasikan apa pun yang cocok dengan hidung dan selera saya.' }
            ].map(item => {
              const isSelected = answers.budgetTier === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, budgetTier: item.id }))}
                  className={`p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-[#333333] bg-[#f4f3e6]' : 'border-[#d9d7c9] bg-[#fffef2] hover:bg-[#f4f3e6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-[#000000]">{item.label}</span>
                    <span className="text-[12px] text-[#5c5c5c]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#333333] text-[#fffef2] border-[#333333]' : 'border-[#8a8a8a]'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 7: AVOIDANCE & DISLIKES (Penalty Check) ── */}
      {currentStep === 7 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#5c5c5c] font-medium block">
              Pantangan & Penalti Scoring (-20 Poin)
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal">
              {locale === 'id' ? 'Adakah karakteristik aroma yang ingin kamu hindari?' : 'Any notes or traits you want to avoid?'}
            </h2>
            <p className="text-[14px] text-[#5c5c5c]">
              {locale === 'id' ? 'Karakteristik yang dipilih akan diberi penalti scoring -20 poin agar kamu tidak kecewa.' : 'Selected traits receive a penalty to prevent blind-buy regret.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-[12px]">
            {[
              { id: 'overly_sweet', label: 'Terlalu Manis / Gourmand Enék', desc: 'Hindari aroma karamel atau gula tebal yang membuat pusing di cuaca panas.' },
              { id: 'heavy_smoke_oud', label: 'Asap Pekat / Dupa & Oud Berat', desc: 'Hindari aroma kayu bakar pekat, resin dupa berat, atau aroma gelap menyengat.' },
              { id: 'sharp_white_floral', label: 'Bunga Putih Tajam (Tuberose / Melati Kuat)', desc: 'Hindari aroma sedap malam atau melati yang terlalu tajam di hidung.' },
              { id: 'none', label: 'Tidak Ada Pantangan (Saya Terbuka Mencoba Semua)', desc: 'Tidak ada penalti, eksplorasi penuh seluruh spektrum wewangian.' }
            ].map(item => {
              const isSelected = answers.avoidNotesOrTraits.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleAvoid(item.id)}
                  className={`p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-[#333333] bg-[#f4f3e6]' : 'border-[#d9d7c9] bg-[#fffef2] hover:bg-[#f4f3e6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-[14px] text-[#000000]">{item.label}</span>
                    <span className="text-[12px] text-[#5c5c5c]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#333333] text-[#fffef2] border-[#333333]' : 'border-[#8a8a8a]'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-6 border-t border-[#d9d7c9]">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`min-h-[48px] px-3 text-[14px] text-[#5c5c5c] hover:text-[#000000] font-medium transition flex items-center gap-1 ${
            currentStep === 1 ? 'opacity-30 cursor-not-allowed' : ''
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'id' ? 'Kembali' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSkipQuiz}
            className="min-h-[48px] px-5 py-2 border border-[#8a8a8a] hover:border-[#333333] text-[14px] font-medium text-[#000000] transition"
          >
            {locale === 'id' ? 'Lewati Kuis & Lihat Hasil' : 'Skip Quiz & View Results'}
          </button>

          <button
            onClick={handleNext}
            className="min-h-[48px] px-6 py-2.5 bg-[#333333] hover:bg-black text-[#fffef2] text-[14px] font-medium flex items-center gap-2 transition"
          >
            <span>{currentStep === 7 ? (locale === 'id' ? 'Selesai & Hitung Rekomendasi' : 'Finish & Calculate Matches') : (locale === 'id' ? 'Pertanyaan Berikutnya' : 'Next Question')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
