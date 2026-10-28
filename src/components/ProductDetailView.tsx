import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Heart, 
  Layers, 
  Plus, 
  Check, 
  ShieldCheck, 
  Clock, 
  Wind, 
  Sun, 
  Info,
  Calendar,
  AlertTriangle,
  Star,
  BookOpen,
  MessageSquare,
  ThumbsUp,
  Share2,
  Copy,
  CheckCircle2,
  MessageCircle,
  X
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { translations, fmt, Locale, formatCurrency } from '../lib/i18n.ts';
import { 
  ReviewState, 
  StoryState, 
  computeReviewSummary,
  computeCommunityReviewAggregate,
  AFFILIATE_DISCLOSURE
} from '../lib/derivedCalculations.ts';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { Bottle } from './Bottle.tsx';

interface ProductDetailViewProps {
  perfume: SeedPerfume;
  onBackToCatalog: () => void;
  onFilterByNote: (note: string) => void;
  onFilterByBrand: (brand: string) => void;
  onFilterByFamily: (family: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  isCompared: boolean;
  onToggleCompare: () => void;
  onOpenTryItFirst: () => void;
  onAddBottleToLibrary: (data: { size_ml: number; remaining_ml: number; status: 'sealed' | 'in_use'; price_idr: number }) => void;
  allPerfumes?: SeedPerfume[];
  onSelectPerfume?: (id: string) => void;
  reviews?: ReviewState[];
  stories?: StoryState[];
  onOpenReviewModal?: (perfumeId: string) => void;
  onOpenStoryModal?: (perfumeId: string) => void;
  locale: Locale;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  perfume,
  onBackToCatalog,
  onFilterByNote,
  onFilterByBrand,
  onFilterByFamily,
  isWishlisted,
  isCompared,
  onToggleWishlist,
  onToggleCompare,
  onOpenTryItFirst,
  onAddBottleToLibrary,
  allPerfumes,
  onSelectPerfume,
  reviews = [],
  stories = [],
  onOpenReviewModal,
  onOpenStoryModal,
  locale
}) => {
  const [isAddBottleModalOpen, setIsAddBottleModalOpen] = useState(false);
  const [bottleSize, setBottleSize] = useState<number>(perfume.reference_price_size_ml || 50);
  const [bottleRemaining, setBottleRemaining] = useState<number>(perfume.reference_price_size_ml || 50);
  const [bottleStatus, setBottleStatus] = useState<'sealed' | 'in_use'>('in_use');
  const [bottlePrice, setBottlePrice] = useState<number>(perfume.reference_price_idr || 350000);
  const [bottleAddedSuccess, setBottleAddedSuccess] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Requirement 8: Track when user scrolls past the main buy section on mobile
  const mainBuySectionRef = useRef<HTMLDivElement>(null);
  const [isPastMainBuy, setIsPastMainBuy] = useState(false);

  useEffect(() => {
    const el = mainBuySectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPastMainBuy(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const shareText = `Temukan aroma ini di Senstoria: ${perfume.name} oleh ${perfume.brand} (${perfume.concentration})
Top Notes: ${perfume.top_notes}
Heart Notes: ${perfume.heart_notes}
Base Notes: ${perfume.base_notes}
Kesesuaian Iklim Tropis: ${perfume.heat_suitability}/5
Ulasan & Piramida Aroma di Senstoria:`;

  const handleShare = async () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${perfume.name} - ${perfume.brand} | Senstoria`,
          text: shareText,
          url: currentUrl
        });
        return;
      } catch {
        // Fallback to modal if cancelled or unsupported
      }
    }
    setIsShareModalOpen(true);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleSaveBottle = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBottleToLibrary({
      size_ml: Number(bottleSize),
      remaining_ml: Number(bottleRemaining),
      status: bottleStatus,
      price_idr: Number(bottlePrice)
    });
    setBottleAddedSuccess(true);
    setTimeout(() => {
      setBottleAddedSuccess(false);
      setIsAddBottleModalOpen(false);
    }, 1500);
  };

  const reviewAggregate = useMemo(
    () => computeCommunityReviewAggregate(reviews, perfume.id, 5),
    [reviews, perfume.id]
  );
  const publishedReviews = useMemo(
    () => reviews.filter(r => r.perfume_id === perfume.id && r.status === 'approved'),
    [reviews, perfume.id]
  );

  return (
    <div className="space-y-8">
      
      {/* ── TOP BREADCRUMB & BACK ACTION ── */}
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <button 
          onClick={onBackToCatalog}
          className="text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{translations[locale].productDetail.kembaliKeKatalog}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleWishlist}
            className={`px-3 py-1.5 border text-[12px] font-medium flex items-center gap-1.5 transition ${
              isWishlisted ? 'border-error text-error bg-surface' : 'border-border text-ink hover:bg-surface'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
            <span>{isWishlisted ? translations[locale].productDetail.inWishlist : translations[locale].productDetail.addWishlist}</span>
          </button>

          <button
            onClick={onToggleCompare}
            className={`px-3 py-1.5 border text-[12px] font-medium flex items-center gap-1.5 transition ${
              isCompared ? 'bg-bar text-paper border-bar' : 'border-border text-ink hover:bg-surface'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isCompared ? translations[locale].productDetail.inComparison : translations[locale].productDetail.compareAction}</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 border border-border hover:bg-surface text-[12px] text-ink font-medium flex items-center gap-1.5 transition"
            title={translations[locale].productDetail.shareScentTitle}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan</span>
          </button>
        </div>
      </div>

      {/* ── PRODUCT HERO SPLIT ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Visual Silhouette & Authenticity */}
        <div className="md:col-span-5 bg-surface border border-hairline p-6 md:p-8 flex flex-col items-center justify-center space-y-6">
          <div className="w-full py-6 flex items-center justify-center relative">
            <Bottle 
              fragranceId={perfume.id} 
              name={perfume.name} 
              brand={perfume.brand} 
              size="lg" 
              showFill={false} 
            />
          </div>

          <div className="w-full flex items-center justify-between text-[12px] font-mono uppercase bg-paper px-3 py-1.5 border border-hairline text-secondary">
            <span>{perfume.origin === 'ID' ? 'Lokal Indonesia' : 'Global / Internasional'}</span>
            <span>{perfume.market_tier}</span>
          </div>

          <div className="text-center space-y-1 w-full border-t border-hairline pt-4">
            <div className="flex items-center justify-center gap-1.5 text-[12px] text-ink font-medium">
              <ShieldCheck className="w-4 h-4 text-bar" />
              <span>{translations[locale].productDetail.kurasiIndependenSenstoria}</span>
            </div>
            <p className="text-[12px] text-secondary leading-relaxed">
              {translations[locale].productDetail.promoFreeNote}
            </p>
          </div>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Header Metadata */}
          <div className="border-b border-hairline pb-6 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-secondary">
              <button 
                onClick={() => onFilterByBrand(perfume.brand)}
                className="font-medium text-ink uppercase tracking-wider hover:underline"
              >
                {perfume.brand}
              </button>
              <span>·</span>
              <button 
                onClick={() => onFilterByFamily(perfume.primary_family)}
                className="hover:underline"
              >
                {perfume.primary_family}
              </button>
              <span>·</span>
              <span className="font-mono tabular-nums">{perfume.release_year}</span>
            </div>

            <h1 className="font-serif text-[32px] leading-[40px] md:text-[48px] md:leading-[56px] font-normal text-ink">
              {perfume.name}
            </h1>
            <p className="font-mono text-[14px] text-secondary tabular-nums">
              {perfume.concentration} · {perfume.reference_price_size_ml} ml
            </p>

            <p className="text-[16px] leading-[24px] text-secondary pt-2">
              {locale === 'id' ? perfume.description_id : perfume.description_en}
            </p>
          </div>

          {/* Notes Pyramid (Top / Heart / Base) - Three-Row Visual (Requirement 7) */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
                {translations[locale].productDetail.piramidaAroma}
              </span>
              <h3 className="font-sans text-[18px] leading-[26px] font-medium text-ink">
                {translations[locale].productDetail.strukturKomposisiNotesTigaBaris}
              </h3>
            </div>
            
            <div className="space-y-2.5">
              {/* Row 1: Top Notes */}
              <div className="bg-paper p-4 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-44 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-bar inline-block"></span>
                    <p className="text-[12px] uppercase font-bold text-ink tracking-wider">Top Notes</p>
                  </div>
                  <span className="text-[12px] text-secondary block pt-0.5 font-mono">0 – 15 menit (Kesan Awal)</span>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {perfume.top_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onFilterByNote(c)}
                        className="px-3 py-1.5 bg-surface border border-hairline hover:border-bar hover:bg-white text-xs font-medium text-ink transition cursor-pointer active:scale-95"
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Heart Notes */}
              <div className="bg-paper p-4 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-44 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary inline-block"></span>
                    <p className="text-[12px] uppercase font-bold text-ink tracking-wider">Heart Notes</p>
                  </div>
                  <span className="text-[12px] text-secondary block pt-0.5 font-mono">15 menit – 3 jam (Karakter Utama)</span>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {perfume.heart_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onFilterByNote(c)}
                        className="px-3 py-1.5 bg-surface border border-hairline hover:border-bar hover:bg-white text-xs font-medium text-ink transition cursor-pointer active:scale-95"
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Base Notes */}
              <div className="bg-paper p-4 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-44 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-border inline-block"></span>
                    <p className="text-[12px] uppercase font-bold text-ink tracking-wider">Base Notes</p>
                  </div>
                  <span className="text-[12px] text-secondary block pt-0.5 font-mono">3+ jam (Jejak Ketahanan)</span>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {perfume.base_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onFilterByNote(c)}
                        className="px-3 py-1.5 bg-surface border border-hairline hover:border-bar hover:bg-white text-xs font-medium text-ink transition cursor-pointer active:scale-95"
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-hairline py-5">
            <div className="space-y-1">
              <span className="text-[12px] uppercase text-secondary flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" /> {translations[locale].productDetail.durabilityLabel}
              </span>
              <span className="font-medium text-[16px] text-ink block">{perfume.longevity_expected_band}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[12px] uppercase text-secondary flex items-center gap-1 font-medium">
                <Wind className="w-3.5 h-3.5" /> {translations[locale].productDetail.projectionLabel}
              </span>
              <span className="font-medium text-[16px] text-ink block font-mono tabular-nums">Tingkat {perfume.projection_expected} / 4</span>
            </div>
            <div className="space-y-1">
              <span className="text-[12px] uppercase text-secondary flex items-center gap-1 font-medium">
                <Sun className="w-3.5 h-3.5" /> {translations[locale].productDetail.tropicalClimate}
              </span>
              <span className="font-medium text-[16px] text-ink block font-mono tabular-nums">{fmt(translations[locale].productDetail.heatScore, perfume.heat_suitability)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[12px] uppercase text-secondary font-medium flex items-center gap-1.5">
                <span>{translations[locale].product.referencePrice}</span>
                <span className="px-1.5 py-0.5 bg-surface border border-hairline text-[12px] font-sans font-normal text-secondary">
                  {translations[locale].sampleDataBadge}
                </span>
              </span>
              <span className="font-medium text-[16px] font-mono tabular-nums text-ink block">
                {formatCurrency(perfume.reference_price_idr, locale)}
              </span>
              <span className="text-[12px] text-secondary font-mono tabular-nums block">
                {formatCurrency(Math.round(perfume.reference_price_idr / perfume.reference_price_size_ml), locale)} / ml
              </span>
            </div>
          </div>

          {/* Real Wearers vs Official Claims */}
          <div className="space-y-3 bg-surface p-5 border border-hairline">
            <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
              {translations[locale].productDetail.validasiKomunitas}
            </span>
            <h3 className="font-sans text-[18px] leading-[26px] font-medium text-ink">
              {translations[locale].productDetail.ulasanPemakaiNyataVsKlaimResmiBrand}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-paper p-4 border border-hairline space-y-2">
                <span className="text-[12px] uppercase tracking-wider font-medium text-secondary block">
                  {translations[locale].productDetail.klaimResmiBrand}
                </span>
                <p className="text-[14px] text-secondary italic leading-relaxed">
                  "{perfume.brand_claims}"
                </p>
                <span className="text-[12px] text-secondary block">
                  {translations[locale].productDetail.sumberMateriPeluncuranResmiBrand}
                </span>
              </div>

              <div className="bg-paper p-4 border border-hairline space-y-2">
                <span className="text-[12px] uppercase tracking-wider font-medium text-ink block">
                  {translations[locale].productDetail.dataPemakaiSenstoria}
                </span>
                {reviewAggregate.hasEnoughReviews ? (
                  <>
                    <p className="text-[14px] font-medium text-ink">
                      {reviewAggregate.totalPublishedReviews} {translations[locale].productDetail.ulasanKomunitas} ({reviewAggregate.averageRating?.toFixed(1)} ★)
                    </p>
                    <div className="text-[12px] text-secondary space-y-1">
                      <p>• {translations[locale].productDetail.ketahananNyataKulit} {reviewAggregate.longevityDominantBand}</p>
                      <p>• {translations[locale].productDetail.proyeksiAroma} {reviewAggregate.sillageDominant}</p>
                      <p>• {reviewAggregate.repurchaseYesRatePct}% {translations[locale].productDetail.bersediaMembeliBotolPenuhKembali}</p>
                    </div>
                  </>
                ) : (
                  <div className="py-1 space-y-1">
                    <p className="text-[14px] font-medium text-secondary">
                      {translations[locale].productDetail.belumCukupUlasan}
                    </p>
                    <p className="text-[12px] text-secondary leading-relaxed">
                      {translations[locale].productDetail.memerlukanMinimal5UlasanTerpublikasiU}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tropical Climate Wear Guide */}
          <div className="border border-hairline bg-paper p-5 space-y-3">
            <span className="text-[12px] uppercase tracking-widest font-medium text-secondary flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-bar" />
              <span>{translations[locale].productDetail.tropicalGuideHeading}</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-surface border border-hairline space-y-1">
                <p className="font-medium text-[14px] text-ink">{translations[locale].productDetail.climateOutdoor}</p>
                <p className="text-[12px] text-secondary leading-relaxed">{translations[locale].productDetail.climateOutdoorTip}</p>
              </div>
              <div className="p-3 bg-surface border border-hairline space-y-1">
                <p className="font-medium text-[14px] text-ink">{translations[locale].productDetail.climateOffice}</p>
                <p className="text-[12px] text-secondary leading-relaxed">{translations[locale].productDetail.climateOfficeTip}</p>
              </div>
              <div className="p-3 bg-surface border border-hairline space-y-1">
                <p className="font-medium text-[14px] text-ink">{translations[locale].productDetail.climateNight}</p>
                <p className="text-[12px] text-secondary leading-relaxed">{translations[locale].productDetail.climateNightTip}</p>
              </div>
            </div>
          </div>

          {/* Affiliate Outbound Buttons & Secondary Actions */}
          <div ref={mainBuySectionRef} className="space-y-3 pt-2">
            <p className="text-[14px] font-medium text-ink">
              {translations[locale].productDetail.buyViaPartners}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a 
                href={`/go/${perfume.id}?platform=shopee&src=product_detail`}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="min-h-[48px] h-12 bg-bar hover:bg-ink text-paper flex items-center justify-center gap-2 font-medium text-[14px] transition"
              >
                <span>{translations[locale].productDetail.buyShopeeMall}</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <a 
                href={`/go/${perfume.id}?platform=tokopedia&src=product_detail`}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="min-h-[48px] h-12 border border-border hover:bg-surface text-ink flex items-center justify-center gap-2 font-medium text-[14px] transition"
              >
                <span>{translations[locale].productDetail.buyTokopediaOfficial}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Secondary Action Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setIsAddBottleModalOpen(true)}
                className="min-h-[44px] border border-border hover:bg-surface text-[12px] font-medium text-ink flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{translations[locale].productDetail.addToWardrobe}</span>
              </button>

              <button
                onClick={onOpenTryItFirst}
                className="min-h-[44px] bg-surface border border-hairline text-[12px] font-medium text-ink hover:border-border transition"
              >
                Coba Dulu (Daftar Tunggu Sampel)
              </button>
            </div>

            <p className="text-[12px] text-secondary leading-relaxed pt-1">
              {AFFILIATE_DISCLOSURE[locale]}
            </p>
          </div>

        </div>
      </div>

      {/* ── COMMUNITY REVIEWS & SCENT STORIES SECTION ── */}
      {(() => {
        const perfumeStories = stories.filter(s => s.perfume_id === perfume.id && s.status === 'published');

        return (
          <div className="border-t border-hairline pt-8 space-y-6">
            
            {/* Header & Overall Summary */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-4">
              <div className="space-y-1">
                <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
                  {translations[locale].productDetail.evaluasiKomunitasIndependen}
                </span>
                <h2 className="font-serif text-[24px] leading-[32px] md:text-[32px] md:leading-[40px] font-normal text-ink">
                  {translations[locale].productDetail.ulasanMultiKriteriaCeritaAroma}
                </h2>
                <p className="text-[14px] text-secondary">
                  {translations[locale].productDetail.dataKetahananNyataKulitJejakAromaDan}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {onOpenStoryModal && (
                  <button
                    onClick={() => onOpenStoryModal(perfume.id)}
                    className="px-4 py-2 bg-surface hover:bg-paper border border-border text-[12px] font-medium text-ink flex items-center gap-1.5 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-bar" />
                    <span>{translations[locale].productDetail.tulisCerita}</span>
                  </button>
                )}

                {onOpenReviewModal && (
                  <button
                    onClick={() => onOpenReviewModal(perfume.id)}
                    className="px-4 py-2 bg-bar hover:bg-ink text-paper text-[12px] font-medium flex items-center gap-1.5 transition"
                  >
                    <Star className="w-3.5 h-3.5 text-paper" />
                    <span>{translations[locale].productDetail.tulisUlasanParfumIni}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scorecard Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-paper border border-hairline p-5">
              
              {/* Average Rating */}
              <div className="space-y-1">
                <span className="text-[12px] font-mono uppercase text-secondary block">
                  {translations[locale].productDetail.rataRataKomunitas}
                </span>
                {reviewAggregate.hasEnoughReviews ? (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-bar text-bar" />
                    <span className="font-serif text-[24px] leading-[32px] font-normal text-ink tabular-nums">
                      {reviewAggregate.averageRating?.toFixed(1)}
                    </span>
                    <span className="text-secondary font-mono text-[12px] tabular-nums">
                      ({reviewAggregate.totalPublishedReviews})
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-[13px] font-medium text-secondary block">
                      {translations[locale].productDetail.belumCukupUlasan}
                    </span>
                    <span className="text-[12px] text-secondary font-mono block">
                      ({reviewAggregate.totalPublishedReviews} {translations[locale].productDetail.ulasan})
                    </span>
                  </div>
                )}
              </div>

              {/* Longevity Consensus */}
              <div className="space-y-1">
                <span className="text-[12px] font-mono uppercase text-secondary block">
                  {translations[locale].productDetail.ketahananKulit}
                </span>
                {reviewAggregate.hasEnoughReviews ? (
                  <>
                    <p className="font-medium text-[14px] text-ink">
                      {reviewAggregate.longevityDominantBand}
                    </p>
                    <span className="text-[12px] text-secondary block">
                      {translations[locale].productDetail.konsensusIklimTropis}
                    </span>
                  </>
                ) : (
                  <p className="text-[13px] text-secondary">
                    {translations[locale].productDetail.belumCukupUlasan}
                  </p>
                )}
              </div>

              {/* Sillage Projection */}
              <div className="space-y-1">
                <span className="text-[12px] font-mono uppercase text-secondary block">
                  {translations[locale].productDetail.jejakAromaSillage}
                </span>
                {reviewAggregate.hasEnoughReviews ? (
                  <>
                    <p className="font-medium text-[14px] text-ink capitalize">
                      {reviewAggregate.sillageDominant}
                    </p>
                    <span className="text-[12px] text-secondary block">
                      {translations[locale].productDetail.ramahRuangTertutupAc}
                    </span>
                  </>
                ) : (
                  <p className="text-[13px] text-secondary">
                    {translations[locale].productDetail.belumCukupUlasan}
                  </p>
                )}
              </div>

              {/* Repurchase Rate */}
              <div className="space-y-1">
                <span className="text-[12px] font-mono uppercase text-secondary block">
                  {translations[locale].productDetail.niatBeliUlang}
                </span>
                {reviewAggregate.hasEnoughReviews ? (
                  <>
                    <p className="font-medium text-[14px] text-ink tabular-nums">
                      {reviewAggregate.repurchaseYesRatePct}% {translations[locale].productDetail.pastiBeliLagi}
                    </p>
                    <span className="text-[12px] text-secondary block">
                      {translations[locale].productDetail.tingkatKepuasanTinggi}
                    </span>
                  </>
                ) : (
                  <p className="text-[13px] text-secondary">
                    {translations[locale].productDetail.belumCukupUlasan}
                  </p>
                )}
              </div>

            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              <span className="text-[12px] uppercase tracking-widest font-medium text-secondary block">
                {fmt(translations[locale].productDetail.ulasanPengguna0, reviewAggregate.totalPublishedReviews)}
              </span>

              {publishedReviews.length === 0 ? (
                <div className="p-8 bg-paper border border-hairline text-center space-y-3">
                  <p className="text-[14px] text-secondary">
                    {translations[locale].productDetail.belumAdaUlasanTerperinciUntukWewangia}
                  </p>
                  {onOpenReviewModal && (
                    <button
                      onClick={() => onOpenReviewModal(perfume.id)}
                      className="px-5 py-2.5 bg-bar hover:bg-ink text-paper text-[12px] font-medium"
                    >
                      {translations[locale].productDetail.tulisUlasanPertama}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {publishedReviews.map(r => (
                    <div key={r.id} className="bg-paper border border-hairline p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="font-medium text-ink">{r.user_name}</span>
                          {r.user_badge && (
                            <span className="bg-surface text-ink text-[12px] font-mono px-2 py-0.5 border border-hairline">
                              ✓ {r.user_badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[12px] text-ink tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-bar text-bar" />
                          <span>{r.rating.toFixed(1)} / 5.0</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] bg-surface p-3 border border-hairline">
                        <div>
                          <span className="text-secondary block">{translations[locale].admin.reviewLongevity}</span>
                          <span className="font-medium text-ink">{r.longevity_band}</span>
                        </div>
                        <div>
                          <span className="text-secondary block">{translations[locale].productDetail.reviewSillageLabel}</span>
                          <span className="font-medium text-ink capitalize">{r.sillage}</span>
                        </div>
                        <div>
                          <span className="text-secondary block">{translations[locale].productDetail.repurchaseLabel}</span>
                          <span className="font-medium text-ink">{r.repurchase_intent === 'yes_definitely' ? translations[locale].productDetail.repurchaseYes : translations[locale].productDetail.repurchaseMaybe}</span>
                        </div>
                        <div>
                          <span className="text-secondary block">{translations[locale].productDetail.formatLabel}</span>
                          <span className="font-medium text-ink">{r.format_used === 'full_bottle' ? translations[locale].productDetail.fullBottle : translations[locale].productDetail.decantFormat}</span>
                        </div>
                      </div>

                      <h4 className="font-sans text-[16px] leading-[22px] font-medium text-ink">{r.title}</h4>
                      <p className="text-[14px] text-secondary leading-relaxed">
                        {r.review_text}
                      </p>

                      {(r.pros || r.cons) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] pt-1">
                          {r.pros && r.pros.length > 0 && (
                            <div className="text-ink space-y-0.5">
                              <span className="font-medium uppercase block text-secondary">{translations[locale].productDetail.prosLabel}</span>
                              {r.pros.map((p: string, i: number) => <p key={i}>• {p}</p>)}
                            </div>
                          )}
                          {r.cons && r.cons.length > 0 && (
                            <div className="text-secondary space-y-0.5">
                              <span className="font-medium uppercase block text-secondary">{translations[locale].productDetail.consLabel}</span>
                              {r.cons.map((c: string, i: number) => <p key={i}>• {c}</p>)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[12px] text-secondary pt-2 border-t border-hairline">
                        <span className="tabular-nums font-mono">{new Date(r.created_at).toLocaleDateString(translations[locale].app.idId, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5 text-secondary" />
                          <span className="tabular-nums font-mono">{r.helpful_count || 8} orang terbantu</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scent Stories Excerpt for this Fragrance */}
            {perfumeStories.length > 0 && (
              <div className="space-y-4 pt-2">
                <span className="text-[12px] uppercase tracking-widest font-medium text-secondary flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-bar" />
                  <span>{translations[locale].productDetail.ceritaMemoriKomunitas}</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {perfumeStories.map(story => (
                    <div key={story.id} className="bg-paper border border-hairline p-5 space-y-2">
                      <div className="flex justify-between text-[12px] text-secondary">
                        <span>{fmt(translations[locale].productDetail.storyBy, story.user_name || 'senstoria')}</span>
                        <span className="font-mono tabular-nums">{story.story_date}</span>
                      </div>
                      <h4 className="font-sans text-[16px] leading-[22px] font-medium text-ink">{story.title}</h4>
                      <p className="text-[14px] text-secondary italic line-clamp-3 leading-relaxed">
                        "{story.body}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        );
      })()}

      {/* ── RELATED FRAGRANCES IN SAME FAMILY ── */}
      {allPerfumes && onSelectPerfume && (
        <div className="border-t border-hairline pt-8 space-y-4">
          <div className="flex justify-between items-baseline">
            <div className="space-y-0.5">
              <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
                {translations[locale].productDetail.furtherExploration}
              </span>
              <h2 className="font-serif text-[24px] leading-[32px] md:text-[32px] md:leading-[40px] font-normal text-ink">
                {fmt(translations[locale].productDetail.aromaSerupaDalamKeluarga0, perfume.primary_family)}
              </h2>
            </div>
            <button
              onClick={() => onFilterByFamily(perfume.primary_family)}
              className="text-[12px] text-secondary hover:text-ink underline font-medium"
            >
              {translations[locale].productDetail.lihatSemuaDiKatalog}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
            {allPerfumes
              .filter(p => p.id !== perfume.id && p.primary_family === perfume.primary_family)
              .slice(0, 3)
              .map(rel => (
                <div
                  key={rel.id}
                  onClick={() => onSelectPerfume(rel.id)}
                  className="bg-paper border border-hairline p-5 space-y-3 cursor-pointer hover:border-bar transition flex flex-col justify-between h-full"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between text-[12px] text-secondary uppercase tracking-wider font-medium">
                      <span>{rel.brand}</span>
                      <span className="font-mono">{rel.concentration}</span>
                    </div>
                    <h3 className="font-sans text-[18px] leading-[24px] font-medium text-ink line-clamp-2 h-[48px]">
                      {rel.name}
                    </h3>
                    <p className="text-[12px] text-secondary line-clamp-1">{rel.top_notes}</p>
                  </div>
                  <div className="pt-3 flex justify-between items-baseline text-[12px] font-mono border-t border-hairline">
                    <span className="text-secondary">{rel.origin === 'ID' ? 'Lokal' : 'Global'}</span>
                    <span className="font-medium text-ink tabular-nums">{formatCurrency(rel.reference_price_idr, locale)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── BOTTOM SHEET / MODAL: ADD BOTTLE TO LIBRARY ── */}
      <BottomSheetOrModal
        isOpen={isAddBottleModalOpen}
        onClose={() => setIsAddBottleModalOpen(false)}
        title={fmt(translations[locale].productDetail.addBottleTitle, perfume.name)}
        subtitle={translations[locale].productDetail.addBottleSubtitle}
        maxWidth="max-w-md"
      >
        {bottleAddedSuccess ? (
          <div className="p-6 bg-surface border border-hairline text-center text-ink text-[12px] font-medium space-y-2">
            <p className="font-serif text-[24px] leading-[32px] font-normal text-ink">{translations[locale].productDetail.bottleAddedTitle}</p>
            <p className="text-[12px] text-secondary">{translations[locale].productDetail.bottleAddedBody}</p>
          </div>
        ) : (
          <form onSubmit={handleSaveBottle} className="space-y-4 text-[12px]">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium block text-ink">Ukuran Botol (ml)</label>
                <input 
                  type="number" 
                  inputMode="numeric"
                  min="1" 
                  max="1000"
                  value={bottleSize}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setBottleSize(val);
                    if (bottleRemaining > val) setBottleRemaining(val);
                  }}
                  className="w-full min-h-[44px] p-2 bg-paper border border-border text-[14px] font-mono tabular-nums text-ink"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium block text-ink">Sisa Cairan (ml)</label>
                <input 
                  type="number" 
                  inputMode="numeric"
                  min="0" 
                  max={bottleSize}
                  step="0.5"
                  value={bottleRemaining}
                  onChange={e => setBottleRemaining(Number(e.target.value))}
                  className="w-full min-h-[44px] p-2 bg-paper border border-border text-[14px] font-mono tabular-nums text-ink"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium block text-ink">{translations[locale].productDetail.bottleStatusLabel}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBottleStatus('in_use')}
                  className={`min-h-[44px] py-2 border text-center transition text-[12px] ${bottleStatus === 'in_use' ? 'border-bar bg-surface font-medium text-ink' : 'border-hairline bg-paper text-secondary'}`}
                >
                  Sedang Dipakai (In Use)
                </button>
                <button
                  type="button"
                  onClick={() => setBottleStatus('sealed')}
                  className={`min-h-[44px] py-2 border text-center transition text-[12px] ${bottleStatus === 'sealed' ? 'border-bar bg-surface font-medium text-ink' : 'border-hairline bg-paper text-secondary'}`}
                >
                  Masih Tersegel (Sealed)
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium block text-ink">Harga Pembelian (Rp)</label>
              <input 
                type="number" 
                inputMode="numeric"
                value={bottlePrice}
                onChange={e => setBottlePrice(Number(e.target.value))}
                className="w-full min-h-[44px] p-2 bg-paper border border-border text-[14px] font-mono tabular-nums text-ink"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-hairline">
              <button 
                type="button"
                onClick={() => setIsAddBottleModalOpen(false)}
                className="min-h-[44px] px-4 py-2 border border-border text-[12px] text-ink hover:bg-surface"
              >
                {translations[locale].review.batal}
              </button>
              <button 
                type="submit"
                className="min-h-[48px] px-6 py-2 bg-bar hover:bg-ink text-paper text-[12px] font-medium"
              >
                {translations[locale].productDetail.saveBottle}
              </button>
            </div>
          </form>
        )}
      </BottomSheetOrModal>

      {/* ── SHARE MODAL ── */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4">
          <div className="bg-paper border border-bar max-w-md w-full p-6 space-y-5 relative">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-secondary hover:text-ink p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[12px] font-mono uppercase tracking-widest text-secondary font-medium block">
                {translations[locale].productDetail.shareScentHeading}
              </span>
              <h3 className="font-serif text-[24px] leading-[32px] font-normal mt-1 text-ink">
                {perfume.name}
              </h3>
              <p className="text-[12px] text-secondary">{perfume.brand} · {perfume.concentration}</p>
            </div>

            {/* Formatted Text Preview */}
            <div className="bg-surface border border-hairline p-4 text-[12px] space-y-1.5 font-mono text-ink">
              <p>Top: {perfume.top_notes}</p>
              <p>Heart: {perfume.heart_notes}</p>
              <p>Base: {perfume.base_notes}</p>
              <p className="text-[12px] text-secondary pt-1 tabular-nums">Iklim Tropis: {perfume.heat_suitability}/5</p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleCopyShareLink}
                className="w-full min-h-[48px] bg-bar hover:bg-ink text-paper text-[12px] font-medium flex items-center justify-center gap-2 transition"
              >
                {shareCopied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-paper" />
                    <span>{translations[locale].productDetail.linkCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{translations[locale].productDetail.copyLinkSummary}</span>
                  </>
                )}
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] border border-border hover:bg-surface text-ink text-[12px] font-medium flex items-center justify-center gap-2 transition text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{translations[locale].productDetail.shareWhatsApp}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE STICKY MARKETPLACE BUY BAR (Requirement 8: sticky at bottom on mobile above nav bar once scrolled past main buy section) ── */}
      {isPastMainBuy && (
        <div className="fixed bottom-16 left-0 right-0 z-30 bg-paper border-t border-bar p-3 lg:hidden animate-sheet-enter">
          <div className="grid grid-cols-2 gap-2">
            <a 
              href={`/go/${perfume.id}?platform=shopee&src=sticky_mobile`}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="min-h-[44px] h-11 bg-bar hover:bg-ink text-paper flex items-center justify-center gap-1.5 font-medium text-xs transition"
            >
              <span>Shopee Mall</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a 
              href={`/go/${perfume.id}?platform=tokopedia&src=sticky_mobile`}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="min-h-[44px] h-11 border border-bar bg-white hover:bg-surface text-ink flex items-center justify-center gap-1.5 font-medium text-xs transition"
            >
              <span>Tokopedia Official</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Affiliate disclosure line kept directly under the buttons in the sticky bar too */}
          <p className="text-[12px] text-secondary text-center pt-1.5 leading-tight">
            {AFFILIATE_DISCLOSURE[locale]}
          </p>
        </div>
      )}

    </div>
  );
};
