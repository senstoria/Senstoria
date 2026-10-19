import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  RotateCcw, 
  Heart, 
  Layers, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  SlidersHorizontal,
  ChevronRight,
  Droplet,
  Compass,
  Star,
  Share2,
  Bookmark,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { 
  ScentQuizAnswers, 
  DEFAULT_QUIZ_ANSWERS, 
  calculateMatchScore, 
  rankRecommendations, 
  ScoredRecommendation 
} from '../lib/scentScoring.ts';
import { Locale, formatCurrency } from '../lib/i18n.ts';

interface ScentFinderViewProps {
  perfumes: SeedPerfume[];
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
  // Current step 1 to 7, or 'results'
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [expandedRunnerUpId, setExpandedRunnerUpId] = useState<string | null>(null);
  const [copiedProfile, setCopiedProfile] = useState<boolean>(false);
  const [savedProfile, setSavedProfile] = useState<boolean>(false);
  const [answers, setAnswers] = useState<ScentQuizAnswers>(() => {
    try {
      const saved = localStorage.getItem('senstoria_quiz_answers');
      return saved ? JSON.parse(saved) : DEFAULT_QUIZ_ANSWERS;
    } catch {
      return DEFAULT_QUIZ_ANSWERS;
    }
  });

  // Filter local only toggle in results
  const [filterLocalOnly, setFilterLocalOnly] = useState<boolean>(false);
  const [aiRephrasingLoading, setAiRephrasingLoading] = useState<boolean>(false);
  const [topMatchAiCurated, setTopMatchAiCurated] = useState<{ why_fits: string; possible_mismatch: string; source: string } | null>(null);

  // Autosave answers to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('senstoria_quiz_answers', JSON.stringify(answers));
    } catch {
      // Ignore storage error
    }
  }, [answers]);

  // Compute recommendations
  const ranked = rankRecommendations(perfumes, answers);
  const displayResults = filterLocalOnly ? ranked.filter(r => r.perfume.origin === 'ID') : ranked;
  const topMatch = displayResults[0];
  const runnersUp = displayResults.slice(1, 7);

  // Fetch AI rephrase for top match if available
  useEffect(() => {
    if (showResults && topMatch) {
      setAiRephrasingLoading(true);
      fetch('/api/ai/rephrase-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidence: {
            perfume_name: `${topMatch.perfume.brand} ${topMatch.perfume.name}`,
            primary_family: topMatch.perfume.primary_family,
            notes: `${topMatch.perfume.top_notes}, ${topMatch.perfume.heart_notes}, ${topMatch.perfume.base_notes}`,
            heat_suitability: topMatch.perfume.heat_suitability,
            longevity_band: topMatch.perfume.longevity_expected_band,
            matched_families: answers.preferredFamilies,
            climate_context: answers.climateSetting,
            score: topMatch.matchScore
          },
          locale
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.why_fits) {
            setTopMatchAiCurated(data);
          }
        })
        .catch(err => {
          console.warn('AI Rephrase request failed, using local grounded evidence:', err);
        })
        .finally(() => {
          setAiRephrasingLoading(false);
        });
    }
  }, [showResults, topMatch?.perfume?.id, locale]);

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleResetQuiz = () => {
    setShowResults(false);
    setCurrentStep(1);
    setTopMatchAiCurated(null);
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
    const text = `🌿 Senstoria Taste Profile (${tastePersona.title})
• Aroma: ${answers.preferredFamilies.join(', ')}
• Iklim: ${answers.climateSetting}
• Proyeksi: ${answers.projectionPreference}
• Ketahanan: ${answers.longevityExpectation}
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
  // RENDER: RESULTS DASHBOARD
  // ══════════════════════════════════════════════════════════════════════
  if (showResults && topMatch) {
    return (
      <div className="space-y-10 pb-16">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D9D7C9] pb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A4B14] font-bold">
              {locale === 'id' ? 'Hasil Scent Finder 6-Dimensi (Phase 5)' : '6-Dimension Scent Finder Results (Phase 5)'}
            </span>
            <h1 className="font-serif text-4xl font-normal">
              {locale === 'id' ? 'Kurasi Wewangian yang Sungguh Cocok' : 'Personalized Fragrance Matches'}
            </h1>
            <p className="text-xs text-[#5C5C5C] max-w-2xl leading-relaxed">
              {locale === 'id'
                ? 'Dihitung secara deterministik berdasarkan profil aroma, iklim pemakaian, ketahanan, dan batasan anggaranmu. Bebas promosi berbayar.'
                : 'Calculated deterministically based on your scent profile, climate conditions, longevity, and budget tier. Free of commercial promotion.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterLocalOnly(prev => !prev)}
              className={`px-3.5 py-2 border text-xs font-semibold transition ${
                filterLocalOnly 
                  ? 'bg-[#1A1A1A] text-[#FFFEF2] border-black' 
                  : 'bg-white border-[#D9D7C9] hover:bg-[#F4F3E6]'
              }`}
            >
              {filterLocalOnly 
                ? (locale === 'id' ? '✓ Hanya Brand Lokal' : '✓ Local Brands Only') 
                : (locale === 'id' ? 'Tampilkan Semua Brand' : 'Show All Brands')}
            </button>

            <button
              onClick={handleResetQuiz}
              className="px-4 py-2 border border-[#333333] hover:bg-[#F4F3E6] text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{locale === 'id' ? 'Ubah Preferensi' : 'Retake Quiz'}</span>
            </button>
          </div>
        </div>

        {/* ── 0. TASTE PROFILE ARCHETYPE CARD (FIND-06) ── */}
        <div className="bg-white border border-[#D9D7C9] p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#1A1A1A] text-[#FFFEF2] text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider font-semibold">
                  {locale === 'id' ? 'Profil Selera Aroma' : 'Taste Profile & Olfactive Archetype'}
                </span>
                <span className="text-[10px] font-mono text-[#8A4B14] font-bold">
                  {userName ? `@${userName}` : (locale === 'id' ? 'Pencinta Aroma' : 'Fragrance Enthusiast')}
                </span>
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-[#1A1A1A]">
                {tastePersona.title}
              </h2>
              <p className="text-xs text-[#5C5C5C] max-w-2xl leading-relaxed">
                {tastePersona.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTasteProfile}
                className="px-3.5 py-1.5 border border-[#D9D7C9] hover:bg-[#F4F3E6] text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedProfile ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5C5C5C]" />}
                <span>{copiedProfile ? (locale === 'id' ? 'Tersalin!' : 'Copied!') : (locale === 'id' ? 'Salin Profil' : 'Copy Profile')}</span>
              </button>
              <button
                onClick={handleSaveTasteProfile}
                className="px-3.5 py-1.5 bg-[#F4F3E6] border border-[#D9D7C9] hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {savedProfile ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-[#8A4B14]" />}
                <span>{savedProfile ? (locale === 'id' ? 'Tersimpan!' : 'Saved!') : (locale === 'id' ? 'Simpan ke Akun' : 'Save to Profile')}</span>
              </button>
            </div>
          </div>

          {/* Persona Signature Tags */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#D9D7C9]/60">
            {tastePersona.tags.map((tag, idx) => (
              <span key={idx} className="bg-[#F4F3E6] text-[#8A4B14] text-[11px] font-mono px-2.5 py-1 border border-[#D9D7C9]">
                #{tag}
              </span>
            ))}
            <span className="bg-white text-[#5C5C5C] text-[11px] font-mono px-2.5 py-1 border border-[#D9D7C9]">
              Iklim: {answers.climateSetting === 'outdoor_hot' ? 'Outdoor Tropis' : answers.climateSetting === 'indoor_ac' ? 'Ruangan Ber-AC' : answers.climateSetting === 'evening_cool' ? 'Malam/Cuaca Dingin' : 'Fleksibel'}
            </span>
            <span className="bg-white text-[#5C5C5C] text-[11px] font-mono px-2.5 py-1 border border-[#D9D7C9]">
              Proyeksi: {answers.projectionPreference === 'intimate' ? 'Intimate' : answers.projectionPreference === 'moderate' ? 'Moderate' : answers.projectionPreference === 'strong' ? 'Strong' : 'Fleksibel'}
            </span>
            <span className="bg-white text-[#5C5C5C] text-[11px] font-mono px-2.5 py-1 border border-[#D9D7C9]">
              Ketahanan: {answers.longevityExpectation === 'light' ? '3-5 Jam' : answers.longevityExpectation === 'moderate' ? '6-8 Jam' : answers.longevityExpectation === 'long' ? '8-12+ Jam' : 'Fleksibel'}
            </span>
            <span className="bg-white text-[#5C5C5C] text-[11px] font-mono px-2.5 py-1 border border-[#D9D7C9]">
              Anggaran: {answers.budgetTier === 'budget' ? '< Rp 250k' : answers.budgetTier === 'mid' ? 'Rp 250k-600k' : answers.budgetTier === 'premium' ? '> Rp 600k' : 'Fleksibel'}
            </span>
          </div>
        </div>

        {/* ── 1. HERO TOP MATCH CARD ── */}
        <div className="bg-[#FFFEF2] border-2 border-[#1A1A1A] p-6 md:p-8 space-y-6 shadow-md relative">
          
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D9D7C9] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#8A4B14] text-[#FFFEF2] text-[10px] font-mono px-2 py-0.5 font-bold uppercase tracking-wider">
                  #1 Rekomendasi Utama
                </span>
                <span className="text-[10px] font-mono uppercase bg-white border border-[#D9D7C9] px-2 py-0.5">
                  {topMatch.perfume.origin === 'ID' ? 'Lokal Indonesia' : 'Global / Internasional'}
                </span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-normal pt-1">
                {topMatch.perfume.brand} — {topMatch.perfume.name}
              </h2>
              <p className="font-mono text-xs text-[#5C5C5C]">
                {topMatch.perfume.concentration} · {topMatch.perfume.primary_family} {topMatch.perfume.secondary_family ? `/ ${topMatch.perfume.secondary_family}` : ''} · {formatCurrency(topMatch.perfume.reference_price_idr, locale)} ({topMatch.perfume.reference_price_size_ml} ml)
              </p>
            </div>

            {/* Huge Match Score Badge */}
            <div className="text-right bg-white p-3 border border-[#D9D7C9] min-w-[120px]">
              <span className="text-[10px] font-mono uppercase text-[#5C5C5C] block">
                Match Score
              </span>
              <span className="font-serif text-4xl font-bold text-[#8A4B14]">
                {topMatch.matchScore}%
              </span>
              <span className="text-[10px] text-emerald-800 font-semibold block">
                {topMatch.matchScore >= 90 ? 'Kecocokan Sangat Tinggi' : 'Kecocokan Bagus'}
              </span>
            </div>
          </div>

          {/* 6-Dimension Match Radar Breakdown */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#5C5C5C] tracking-wider block">
              Evaluasi 6 Dimensi Kecocokan (Scoring Breakdown):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 border border-[#D9D7C9]">
                <span className="text-[9px] uppercase text-[#5C5C5C] block">Aroma</span>
                <span className="font-mono font-bold text-[#8A4B14]">{topMatch.dimensionScores.familyAffinity}%</span>
              </div>
              <div className="bg-white p-2.5 border border-[#D9D7C9]">
                <span className="text-[9px] uppercase text-[#5C5C5C] block">Iklim Tropis</span>
                <span className="font-mono font-bold text-[#8A4B14]">{topMatch.dimensionScores.climateFit}%</span>
              </div>
              <div className="bg-white p-2.5 border border-[#D9D7C9]">
                <span className="text-[9px] uppercase text-[#5C5C5C] block">Daya Tahan</span>
                <span className="font-mono font-bold text-[#8A4B14]">{topMatch.dimensionScores.longevityFit}%</span>
              </div>
              <div className="bg-white p-2.5 border border-[#D9D7C9]">
                <span className="text-[9px] uppercase text-[#5C5C5C] block">Sillage</span>
                <span className="font-mono font-bold text-[#8A4B14]">{topMatch.dimensionScores.sillageFit}%</span>
              </div>
              <div className="bg-white p-2.5 border border-[#D9D7C9]">
                <span className="text-[9px] uppercase text-[#5C5C5C] block">Anggaran</span>
                <span className="font-mono font-bold text-[#8A4B14]">{topMatch.dimensionScores.budgetFit}%</span>
              </div>
              <div className="bg-white p-2.5 border border-[#D9D7C9]">
                <span className="text-[9px] uppercase text-[#5C5C5C] block">Asal Brand</span>
                <span className="font-mono font-bold text-[#8A4B14]">{topMatch.dimensionScores.originFit}%</span>
              </div>
            </div>
          </div>

          {/* Notes Pyramid Snapshot */}
          <div className="bg-white p-3.5 border border-[#D9D7C9] text-xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#5C5C5C] block">Karakter Notes:</span>
            <p className="text-[#333333]">
              <strong>Top:</strong> {topMatch.perfume.top_notes} · <strong>Heart:</strong> {topMatch.perfume.heart_notes} · <strong>Base:</strong> {topMatch.perfume.base_notes}
            </p>
          </div>

          {/* Dual Evidence Columns: "Why it fits" vs "Possible mismatch" (REC-05, Transparency) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Why Fits (Positive Evidence) */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-300 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Mengapa Cocok Untukmu (Grounded Evidence)</span>
              </span>
              
              {aiRephrasingLoading ? (
                <div className="text-xs text-[#5C5C5C] italic py-1">
                  Menyempurnakan kurasi personal dengan Gemini AI...
                </div>
              ) : topMatchAiCurated?.why_fits ? (
                <p className="text-xs text-emerald-950 font-serif leading-relaxed italic">
                  "{topMatchAiCurated.why_fits}"
                </p>
              ) : null}

              <ul className="text-xs text-emerald-900 space-y-1">
                {(locale === 'id' ? topMatch.whyFitsBulletsId : topMatch.whyFitsBulletsEn).map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Possible Mismatch (Anti-Disappointment Transparency) */}
            <div className="p-4 bg-amber-50/60 border border-amber-300 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Kemungkinan Kurang Cocok (Transparansi Objektif)</span>
              </span>
              
              {topMatchAiCurated?.possible_mismatch ? (
                <p className="text-xs text-amber-950 font-serif leading-relaxed italic">
                  "{topMatchAiCurated.possible_mismatch}"
                </p>
              ) : (
                <p className="text-xs text-amber-900 leading-relaxed">
                  {locale === 'id' ? topMatch.possibleMismatchId : topMatch.possibleMismatchEn}
                </p>
              )}

              <p className="text-[10px] text-[#5C5C5C] pt-1">
                Kami menyampaikan catatan ini secara jujur tanpa menyembunyikan karakteristik aroma demi menjaga kepuasan pembelianmu.
              </p>
            </div>

          </div>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D9D7C9]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleWishlist(topMatch.perfume.id)}
                className={`px-4 py-2 text-xs font-semibold flex items-center gap-1.5 border transition ${
                  wishlistIds.includes(topMatch.perfume.id)
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-white border-[#D9D7C9] hover:bg-[#F4F3E6]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${wishlistIds.includes(topMatch.perfume.id) ? 'fill-rose-600' : ''}`} />
                <span>{wishlistIds.includes(topMatch.perfume.id) ? 'Tersimpan di Wishlist' : 'Simpan Wishlist'}</span>
              </button>

              <button
                onClick={() => onToggleCompare(topMatch.perfume.id)}
                className={`px-4 py-2 text-xs font-semibold flex items-center gap-1.5 border transition ${
                  compareIds.includes(topMatch.perfume.id)
                    ? 'bg-neutral-800 text-white border-black'
                    : 'bg-white border-[#D9D7C9] hover:bg-[#F4F3E6]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{compareIds.includes(topMatch.perfume.id) ? 'Di Komparasi' : 'Bandingkan'}</span>
              </button>

              <button
                onClick={() => onOpenTryItFirst(topMatch.perfume.id)}
                className="px-4 py-2 bg-[#F4F3E6] hover:bg-neutral-200 border border-[#D9D7C9] text-xs font-semibold transition"
              >
                Coba Sample Dulu
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectPerfume(topMatch.perfume.id)}
                className="px-4 py-2 border border-[#333333] hover:bg-[#F4F3E6] text-xs font-semibold"
              >
                Lihat Detail Specs
              </button>

              <a
                href={`/go/${topMatch.perfume.id}?platform=shopee&src=scent_finder_hero`}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="px-5 py-2 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>Beli Resmi di Shopee Mall</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* ── 2. RUNNERS-UP RECOMMENDATIONS (TOP 2-6) ── */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <h3 className="font-serif text-2xl font-normal">
              {locale === 'id' ? 'Pilihan Alternatif Terbaik Lainnya' : 'Other Highly Matched Fragrances'}
            </h3>
            <span className="text-xs text-[#5C5C5C]">
              {runnersUp.length} rekomendasi dengan skor kecocokan tinggi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {runnersUp.map((rec, idx) => {
              const p = rec.perfume;
              const isWish = wishlistIds.includes(p.id);
              const isComp = compareIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  className="bg-white border border-[#D9D7C9] p-5 space-y-3 flex flex-col justify-between hover:border-black transition"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-[#5C5C5C]">
                      <span className="font-mono">#{idx + 2} Alternatif</span>
                      <div className="flex items-center gap-1 bg-[#F4F3E6] px-2 py-0.5 border border-[#D9D7C9] font-mono font-bold text-[#8A4B14]">
                        <span>Match: {rec.matchScore}%</span>
                      </div>
                    </div>

                    <div 
                      onClick={() => onSelectPerfume(p.id)}
                      className="cursor-pointer hover:underline"
                    >
                      <span className="text-[10px] uppercase tracking-wider text-[#8A4B14] font-bold block">
                        {p.brand}
                      </span>
                      <h4 className="font-serif text-xl font-bold">{p.name}</h4>
                    </div>

                    <p className="text-xs text-[#5C5C5C]">
                      {p.concentration} · {p.primary_family} · {formatCurrency(p.reference_price_idr, locale)}
                    </p>

                    {/* Why fits bullet preview */}
                    <div className="bg-[#FFFEF2] p-2.5 border border-[#D9D7C9] text-[11px] space-y-1">
                      <p className="text-emerald-900 font-medium">
                        ✓ {locale === 'id' ? rec.whyFitsBulletsId[0] : rec.whyFitsBulletsEn[0]}
                      </p>
                      <p className="text-amber-900 text-[10px]">
                        ℹ {locale === 'id' ? rec.possibleMismatchId : rec.possibleMismatchEn}
                      </p>
                    </div>
                    {/* Expandable 6-dimension scores */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setExpandedRunnerUpId(expandedRunnerUpId === p.id ? null : p.id)}
                        className="text-[10px] font-mono text-[#8A4B14] hover:underline flex items-center gap-1"
                      >
                        <span>{expandedRunnerUpId === p.id ? (locale === 'id' ? '▲ Tutup Rincian 6D' : '▲ Hide 6D Breakdown') : (locale === 'id' ? '▼ Rincian Skor 6 Dimensi' : '▼ 6D Match Breakdown')}</span>
                      </button>

                      {expandedRunnerUpId === p.id && (
                        <div className="grid grid-cols-3 gap-1 pt-2 text-[9px] font-mono bg-[#F4F3E6]/60 p-2 border border-[#D9D7C9] mt-1.5">
                          <div>Aroma: {rec.dimensionScores.familyAffinity}%</div>
                          <div>Iklim: {rec.dimensionScores.climateFit}%</div>
                          <div>Tahan: {rec.dimensionScores.longevityFit}%</div>
                          <div>Sillage: {rec.dimensionScores.sillageFit}%</div>
                          <div>Budget: {rec.dimensionScores.budgetFit}%</div>
                          <div>Asal: {rec.dimensionScores.originFit}%</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#D9D7C9]/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleWishlist(p.id)}
                        className={`p-1.5 border transition ${isWish ? 'bg-rose-50 border-rose-300 text-rose-600' : 'border-[#D9D7C9] hover:bg-[#F4F3E6]'}`}
                        title="Simpan Wishlist"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-rose-600' : ''}`} />
                      </button>

                      <button
                        onClick={() => onToggleCompare(p.id)}
                        className={`p-1.5 border transition ${isComp ? 'bg-black text-white border-black' : 'border-[#D9D7C9] hover:bg-[#F4F3E6]'}`}
                        title="Bandingkan"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onOpenTryItFirst(p.id)}
                        className="px-2 py-1 bg-[#F4F3E6] hover:bg-neutral-200 border border-[#D9D7C9] text-[10px] font-medium"
                      >
                        Sample
                      </button>
                    </div>

                    <button
                      onClick={() => onSelectPerfume(p.id)}
                      className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-[11px] font-semibold transition"
                    >
                      Detail Specs →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RENDER: 7-STEP QUESTIONNAIRE
  // ══════════════════════════════════════════════════════════════════════
  const progressPct = Math.round((currentStep / 7) * 100);

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-16">
      
      {/* Step Indicator Header */}
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-widest text-[#5C5C5C] font-semibold">
          {locale === 'id' ? `Pertanyaan ${currentStep} dari 7` : `Question ${currentStep} of 7`}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-[#E5E3D3] h-1.5 overflow-hidden">
          <div 
            className="bg-[#333333] h-full transition-all duration-300" 
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* ── STEP 1: PREFERRED SCENT FAMILIES ── */}
      {currentStep === 1 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-normal">
              {locale === 'id' ? 'Keluarga aroma apa yang paling menarik bagimu?' : 'Which scent families appeal to you most?'}
            </h2>
            <p className="text-xs text-[#5C5C5C]">
              {locale === 'id' ? 'Kamu dapat memilih lebih dari satu atau pilih "Tidak Yakin" jika ingin saran terbuka.' : 'Select one or more, or choose "Not Sure" for open exploration.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
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
                    isSelected ? 'border-2 border-black bg-[#F4F3E6]' : 'border-[#D9D7C9] bg-white hover:bg-[#F4F3E6]'
                  }`}
                >
                  <div className="space-y-1 pr-3">
                    <span className="font-semibold block">{item.label}</span>
                    <span className="text-[11px] text-[#5C5C5C] leading-relaxed block">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-black text-white border-black' : 'border-neutral-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: CLIMATE & ENVIRONMENT ── */}
      {currentStep === 2 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-normal">
              {locale === 'id' ? 'Di mana kamu paling sering memakai parfum ini?' : 'Where will you wear this fragrance most?'}
            </h2>
            <p className="text-xs text-[#5C5C5C]">
              {locale === 'id' ? 'Suhu dan kelembapan Indonesia sangat memengaruhi kinerja ketahanan aroma.' : 'Tropical humidity strongly dictates perfume performance.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {[
              { id: 'outdoor_hot', label: 'Outdoor / Siang Hari Panas Tropis', desc: 'Membutuhkan formula tahan keringat yang tidak memicu sakit kepala saat terik.' },
              { id: 'indoor_ac', label: 'Ruangan Ber-AC Sepanjang Hari (Kantor / Kampus)', desc: 'Suhu stabil dan sejuk, aman untuk sillage sedang yang ramah rekan kerja.' },
              { id: 'evening_cool', label: 'Malam Hari / Acara Kencan & Cuaca Dingin', desc: 'Cocok untuk aroma yang lebih manis, dalam, hangat, dan berjejak kuat.' },
              { id: 'flexible', label: 'Fleksibel / Serbaguna Segala Situasi', desc: 'Aroma yang bisa bertransisi mulus dari pagi kantor hingga nongkrong malam.' }
            ].map(item => {
              const isSelected = answers.climateSetting === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, climateSetting: item.id }))}
                  className={`p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-black bg-[#F4F3E6]' : 'border-[#D9D7C9] bg-white hover:bg-[#F4F3E6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-sm">{item.label}</span>
                    <span className="text-[11px] text-[#5C5C5C]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-black text-white border-black' : 'border-neutral-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 3: PROJECTION & SILLAGE ── */}
      {currentStep === 3 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-normal">
              {locale === 'id' ? 'Seberapa jauh kamu ingin aroma parfummu tercium?' : 'What projection level do you prefer?'}
            </h2>
            <p className="text-xs text-[#5C5C5C]">
              {locale === 'id' ? 'Pilih karakter sillage yang sesuai dengan kenyamanan sosialmu.' : 'Choose projection that matches your presence preference.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {[
              { id: 'intimate', label: 'Intimate / Halus Dekat Kulit', desc: 'Hanya tercium oleh dirimu sendiri dan orang yang memelukmu erat.' },
              { id: 'moderate', label: 'Moderate / Radius Satu Lengan (Paling Populer)', desc: 'Tercium sopan saat bercakap-cakap tanpa menginvasi ruang orang lain.' },
              { id: 'strong', label: 'Strong / Meninggalkan Jejak Saat Berjalan', desc: 'Proyeksi tegas yang mengisi ruangan dan meninggalkan kesan tak terlupakan.' },
              { id: 'not_sure', label: 'Tidak Yakin / Fleksibel', desc: 'Biarkan sistem memilihkan proyeksi paling ideal untuk aromamu.' }
            ].map(item => {
              const isSelected = answers.projectionPreference === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, projectionPreference: item.id }))}
                  className={`p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-black bg-[#F4F3E6]' : 'border-[#D9D7C9] bg-white hover:bg-[#F4F3E6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-sm">{item.label}</span>
                    <span className="text-[11px] text-[#5C5C5C]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-black text-white border-black' : 'border-neutral-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 4: LONGEVITY REQUIREMENT ── */}
      {currentStep === 4 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-normal">
              {locale === 'id' ? 'Berapa lama ketahanan aroma yang kamu butuhkan?' : 'How long should the scent last?'}
            </h2>
            <p className="text-xs text-[#5C5C5C]">
              {locale === 'id' ? 'Ekspektasi realistis membantu mencocokkan konsentrasi EDT, EDP, atau Extrait.' : 'Helps match EDT, EDP, or Extrait concentrations.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {[
              { id: 'light', label: '3–5 Jam (Ringan & Cepat Berganti)', desc: 'Cocok untuk olahraga atau sekadar santai tanpa mengikat seharian.' },
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
                    isSelected ? 'border-2 border-black bg-[#F4F3E6]' : 'border-[#D9D7C9] bg-white hover:bg-[#F4F3E6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-sm">{item.label}</span>
                    <span className="text-[11px] text-[#5C5C5C]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-black text-white border-black' : 'border-neutral-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 5: BRAND ORIGIN PREFERENCE ── */}
      {currentStep === 5 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-normal">
              {locale === 'id' ? 'Apakah kamu memiliki preferensi asal brand?' : 'Do you have a brand origin preference?'}
            </h2>
            <p className="text-xs text-[#5C5C5C]">
              {locale === 'id' ? 'Dukung artisan perfumery lokal Indonesia atau jelajahi desainer global.' : 'Support Indonesian local perfumery or global designers.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {[
              { id: 'local_id', label: 'Brand Lokal Indonesia (Local Pride)', desc: 'HMNS, Oullu, Carl & Claire, Alien Objects, dsb. Diformulasikan khusus untuk iklim tropis.' },
              { id: 'global_int', label: 'Brand Internasional (Desainer & Niche Global)', desc: 'Maison Margiela, Diptyque, Chanel, Tom Ford, Le Labo, dsb.' },
              { id: 'any', label: 'Semua / Bebas (Fokus pada Kualitas Aroma)', desc: 'Tampilkan perpaduan terbaik dari brand lokal maupun internasional.' }
            ].map(item => {
              const isSelected = answers.brandOriginPreference === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setAnswers(prev => ({ ...prev, brandOriginPreference: item.id }))}
                  className={`p-4 border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'border-2 border-black bg-[#F4F3E6]' : 'border-[#D9D7C9] bg-white hover:bg-[#F4F3E6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-sm">{item.label}</span>
                    <span className="text-[11px] text-[#5C5C5C]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-black text-white border-black' : 'border-neutral-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 6: BUDGET TIER ── */}
      {currentStep === 6 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-normal">
              {locale === 'id' ? 'Berapa rentang anggaran yang kamu siapkan?' : 'What is your budget tier?'}
            </h2>
            <p className="text-xs text-[#5C5C5C]">
              {locale === 'id' ? 'Senstoria menampilkan harga transparan resmi per botol penuh.' : 'Official transparent reference pricing.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
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
                    isSelected ? 'border-2 border-black bg-[#F4F3E6]' : 'border-[#D9D7C9] bg-white hover:bg-[#F4F3E6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-sm">{item.label}</span>
                    <span className="text-[11px] text-[#5C5C5C]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-black text-white border-black' : 'border-neutral-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 7: AVOIDANCE & DISLIKES ── */}
      {currentStep === 7 && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-normal">
              {locale === 'id' ? 'Adakah karakteristik aroma yang ingin kamu hindari?' : 'Any notes or traits you want to avoid?'}
            </h2>
            <p className="text-xs text-[#5C5C5C]">
              {locale === 'id' ? 'Karakteristik yang dipilih akan diberi penalti scoring -20% agar kamu tidak kecewa.' : 'Selected traits receive a penalty to prevent blind-buy regret.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
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
                    isSelected ? 'border-2 border-black bg-[#F4F3E6]' : 'border-[#D9D7C9] bg-white hover:bg-[#F4F3E6]'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold block text-sm">{item.label}</span>
                    <span className="text-[11px] text-[#5C5C5C]">{item.desc}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-black text-white border-black' : 'border-neutral-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-6 border-t border-[#D9D7C9]">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`text-xs text-[#5C5C5C] hover:text-black transition flex items-center gap-1 ${
            currentStep === 1 ? 'opacity-30 cursor-not-allowed' : ''
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResults(true)}
            className="px-4 py-2 border border-[#333333] hover:bg-[#F4F3E6] text-xs font-semibold transition"
          >
            Lewati Kuis & Lihat Hasil
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>{currentStep === 7 ? 'Selesai & Hitung Rekomendasi' : 'Pertanyaan Berikutnya'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
