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
  Sparkles,
  MessageSquare,
  ThumbsUp,
  Share2,
  Copy,
  CheckCircle2,
  MessageCircle,
  X
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { translations, fmt, Locale, formatCurrency, formatScoreOutOfFive } from '../lib/i18n.ts';
import { calculateMatchScore, readSavedQuizAnswers } from '../lib/scentScoring.ts';
import { 
  ReviewState, 
  StoryState, 
  computeReviewSummary,
  computeCommunityReviewAggregate,
  AFFILIATE_DISCLOSURE
} from '../lib/derivedCalculations.ts';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { Bottle } from './Bottle.tsx';
import type { StatePreview } from '../lib/statePreview.ts';
import { useDelayedFlag } from '../lib/statePreview.ts';
import { ViewEmptyResults, ViewError, ViewNotFound, ViewSkeleton } from './StateViews.tsx';

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
  // Founder correction 16 (1 Nov 2026): same cold-start Finder button
  // as CatalogView — opens the existing Finder view, no new page.
  // Optional; App always supplies it (setView('finder')).
  onGoToFinder?: () => void;
  // True when the user already owns this perfume (non-deleted bottle
  // record). Try it First is hidden then: an owned perfume needs no sample try.
  isOwned: boolean;
  onAddBottleToLibrary: (data: { size_ml: number; remaining_ml: number; status: 'sealed' | 'in_use'; price_idr: number }) => void;
  allPerfumes?: SeedPerfume[];
  onSelectPerfume?: (id: string) => void;
  reviews?: ReviewState[];
  onOpenReviewModal?: (perfumeId: string) => void;
  onOpenStoryModal?: (perfumeId: string) => void;
  // B-07: report a clipboard-copy failure through the App toast (never
  // show "Link disalin" when the copy actually failed). Optional; App
  // always supplies it.
  onShareCopyFailed?: () => void;
  locale: Locale;
  // Tahap 2 (§4): keadaan layar lewat `?state=…` + jalan keluarnya.
  // loading → skeleton Detail; error → panel ViewError; empty → panel
  // "tidak ditemukan" (Detail tidak pernah kosong secara alami karena
  // App selalu memilih parfum pertama sebagai fallback); empty-filter →
  // panel hasil kosong untuk seksi Aroma Serupa (satu-satunya permukaan
  // mirip filter di layar ini); offline/destructive tidak berlaku.
  previewState?: StatePreview | null;
  onClearPreview?: () => void;
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
  onGoToFinder,
  isOwned,
  onAddBottleToLibrary,
  allPerfumes,
  onSelectPerfume,
  reviews = [],
  onOpenReviewModal,
  onOpenStoryModal,
  onShareCopyFailed,
  locale,
  previewState = null,
  onClearPreview,
}) => {
  // Sprint 3: saved quiz answers drive match % (cold-start banner when none)
  const [savedQuiz] = useState(readSavedQuizAnswers);
  const [isAddBottleModalOpen, setIsAddBottleModalOpen] = useState(false);
  const [bottleSize, setBottleSize] = useState<number>(perfume.reference_price_size_ml || 50);
  const [bottleRemaining, setBottleRemaining] = useState<number>(perfume.reference_price_size_ml || 50);
  const [bottleStatus, setBottleStatus] = useState<'sealed' | 'in_use'>('in_use');
  const [bottlePrice, setBottlePrice] = useState<number>(perfume.reference_price_idr || 350000);
  const [bottleAddedSuccess, setBottleAddedSuccess] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Nike Fase 3: galeri Detail (1 visual per parfum di data — foto
  // asli bila ada, ilustrasi Bottle sebagai fallback yang jujur).
  const [galleryIndex, setGalleryIndex] = useState(0);
  // Nike Fase 3: bottom sheet pemilih ukuran botol (pill outline).
  // Ukuran yang ditawarkan HANYA yang ada di data: ukuran referensi
  // yang muncul di katalog seed (30/50/100 ml), diturunkan dari
  // allPerfumes — bukan ditebak, bukan fiktif.
  const [isSizeSheetOpen, setIsSizeSheetOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number>(perfume.reference_price_size_ml || 50);
  const availableSizes = useMemo(() => {
    const sizes = new Set<number>((allPerfumes ?? [perfume]).map(p => p.reference_price_size_ml));
    return [...sizes].sort((a, b) => a - b);
  }, [allPerfumes, perfume]);

  // Ganti parfum → galeri dan pilihan ukuran kembali ke awal.
  useEffect(() => {
    setGalleryIndex(0);
    setSelectedSize(perfume.reference_price_size_ml || 50);
  }, [perfume.id, perfume.reference_price_size_ml]);

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
Kesesuaian Iklim Tropis: ${formatScoreOutOfFive(perfume.heat_suitability, 'Tanpa data')}
Ulasan & Piramida Aroma di Senstoria:`;

  // Product deep link (26 Nov 2026): the shared link is the product page,
  // never the current SPA URL (which is always the homepage — setView does
  // not touch the URL). Fallback to the perfume id for records without a
  // slug (e.g. a user-added custom perfume stored as Partial<SeedPerfume>).
  const productUrl = `${window.location.origin}/catalog/${perfume.slug || perfume.id}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${perfume.name} - ${perfume.brand} | Senstoria`,
          text: shareText,
          url: productUrl
        });
        return;
      } catch {
        // Fallback to modal if cancelled or unsupported
      }
    }
    setIsShareModalOpen(true);
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${productUrl}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // B-07: never report success when the copy actually failed.
      onShareCopyFailed?.();
    }
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

  // Tahap 0 (26 Nov 2026, B-04): parfum lain dalam keluarga yang sama,
  // dihitung sekali di sini agar seksi "Aroma Serupa" bisa menampilkan
  // pesan jujur saat daftarnya kosong (mis. Enchantée adalah satu-satunya
  // Floral di katalog 2 parfum), bukan heading di atas grid kosong.
  const similarPerfumes = useMemo(
    () => (allPerfumes ?? []).filter(p => p.id !== perfume.id && p.primary_family === perfume.primary_family).slice(0, 3),
    [allPerfumes, perfume.id, perfume.primary_family]
  );

  // Tahap 2 (§4): keadaan lewat `?state=…`. Diletakkan setelah semua
  // hook di atas, sebelum return, supaya urutan hook tidak berubah.
  // Skeleton baru muncul bila loading melebihi ~300ms (aturan §4).
  const showLoadingSkeleton = useDelayedFlag(previewState === 'loading');
  if (previewState === 'loading' && showLoadingSkeleton) {
    return <ViewSkeleton locale={locale} layout="detail" />;
  }
  if (previewState === 'error') {
    return <ViewError locale={locale} onRetry={onClearPreview ?? (() => {})} />;
  }
  if (previewState === 'empty') {
    // Kembali ke Katalog keluar dari pratinjau juga: bila ?state=empty
    // dibiarkan, Katalog akan menampilkan EmptyState-nya sendiri (0
    // parfum), bukan katalog yang sebenarnya.
    return <ViewNotFound locale={locale} onBack={() => { onClearPreview?.(); onBackToCatalog(); }} />;
  }
  if (previewState === 'empty-filter') {
    return <ViewEmptyResults locale={locale} onClear={onClearPreview ?? (() => {})} />;
  }

  return (
    <div className="space-y-12 md:space-y-16">
      
      {/* ── TOP BREADCRUMB & BACK ACTION ── */}
      {/* Tahap 0 (26 Nov 2026, B-02): di HP baris ini meluber 8px (body
          scrollWidth 398 di viewport 390; "Bagikan" terpotong 8,5px di
          tepi kanan, "Kembali ke Katalog" melipat 3 baris). Di HP
          (< lg) baris menjadi dua susun: tombol kembali di atas,
          ketiga aksi di bawah dengan lebar sama rata. Di desktop
          (lg+) tetap satu baris seperti semula. */}
      <div className="flex flex-col gap-3 border-b border-hairline pb-4 lg:flex-row lg:items-center lg:justify-between lg:gap-2">
        <button 
          onClick={onBackToCatalog}
          className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{translations[locale].productDetail.kembaliKeKatalog}</span>
        </button>

        <div className="flex items-center gap-2 max-lg:w-full">
          <button
            onClick={onToggleWishlist}
            className={`max-lg:flex-1 max-lg:justify-center min-h-[44px] px-3 py-1.5 border text-[12px] font-medium flex items-center gap-1.5 transition ${
              isWishlisted ? 'border-error text-error bg-surface' : 'border-border text-ink hover:bg-surface'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
            <span>{isWishlisted ? translations[locale].productDetail.inWishlist : translations[locale].productDetail.addWishlist}</span>
          </button>

          <button
            onClick={onToggleCompare}
            className={`max-lg:flex-1 max-lg:justify-center min-h-[44px] px-3 py-1.5 border text-[12px] font-medium flex items-center gap-1.5 transition ${
              isCompared ? 'bg-bar text-paper border-bar' : 'border-border text-ink hover:bg-surface'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isCompared ? translations[locale].productDetail.inComparison : translations[locale].productDetail.compareAction}</span>
          </button>

          <button
            onClick={handleShare}
            className="max-lg:flex-1 max-lg:justify-center min-h-[44px] px-3 py-1.5 border border-border hover:bg-surface text-[12px] text-ink font-medium flex items-center gap-1.5 transition"
            title={translations[locale].productDetail.shareScentTitle}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{translations[locale].productDetail.shareButton}</span>
          </button>
        </div>
      </div>

      {/* ── PRODUCT HERO SPLIT ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-start">
        
        {/* Left Column: Galeri Produk (Nike Fase 3) — panggung foto
            full-bleed di atas gray-100 (latar gambar produk Nike) +
            dot carousel + strip thumbnail. Data hanya punya 1 visual
            per parfum (foto asli bila terverifikasi, ilustrasi Bottle
            sebagai fallback yang jujur — tidak pernah disajikan
            sebagai foto asli), jadi galeri berisi 1 slide; struktur
            carousel tetap ada supaya siap saat foto asli bertambah. */}
        <div className="md:col-span-5 space-y-3" data-testid="detail-gallery">
          <div className="bg-gray-100 aspect-square flex items-center justify-center relative overflow-hidden">
            {perfume.image_url ? (
              <img
                src={perfume.image_url}
                alt={`${perfume.brand} ${perfume.name}`}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            ) : (
              <Bottle
                fragranceId={perfume.id}
                name={perfume.name}
                brand={perfume.brand}
                size="lg"
                showFill={false}
              />
            )}
          </div>

          {/* Dot carousel (1 dot per visual yang ada di data). */}
          <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Galeri produk">
            {[0].map(i => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={galleryIndex === i}
                aria-label={`Foto ${i + 1}`}
                onClick={() => setGalleryIndex(i)}
                className={`w-2 h-2 rounded-full transition ${galleryIndex === i ? 'bg-bar' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          {/* Strip thumbnail (1 thumbnail per visual yang ada di data). */}
          <div className="flex items-center justify-center gap-2">
            {[0].map(i => (
              <button
                key={i}
                type="button"
                aria-label={`Lihat foto ${i + 1}`}
                aria-pressed={galleryIndex === i}
                onClick={() => setGalleryIndex(i)}
                className={`w-16 h-16 bg-gray-100 border flex items-center justify-center p-1 transition ${galleryIndex === i ? 'border-bar' : 'border-hairline'}`}
              >
                {perfume.image_url ? (
                  <img
                    src={perfume.image_url}
                    alt=""
                    aria-hidden="true"
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <Bottle
                    fragranceId={perfume.id}
                    name={perfume.name}
                    brand={perfume.brand}
                    size="sm"
                    showFill={false}
                  />
                )}
              </button>
            ))}
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
              {perfume.primary_family && (<>
              <span>·</span>
              <button 
                onClick={() => onFilterByFamily(perfume.primary_family ?? '')}
                className="hover:underline"
              >
                {perfume.primary_family}
              </button>
              </>)}
              {perfume.release_year && (<>
              <span>·</span>
              <span className="font-mono tabular-nums">{perfume.release_year}</span>
              </>)}
            </div>

            <h1 className="font-display text-[32px] leading-[40px] md:text-[48px] md:leading-[56px] text-ink">
              {perfume.name}
            </h1>
            <p className="font-mono text-[14px] text-secondary tabular-nums">
              {perfume.concentration} · {perfume.reference_price_size_ml} ml
            </p>

            <p className="text-[16px] leading-[28px] text-secondary pt-3">
              {locale === 'id' ? perfume.description_id : perfume.description_en}
            </p>

            {/* Sprint 3: match % from saved quiz answers; cold-start banner replaces it */}
            {/* Nike Fase 3: kartu % match putih — angka Display md
                24px Archivo 700 tracking −4% di atas putih, bukan
                lagi kartu colour-field biru. */}
            {savedQuiz.hasRealAnswers ? (
              <div className="bg-card border border-hairline p-5 mt-2 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-bar shrink-0" aria-hidden="true" />
                <p className="display-md text-ink">
                  {fmt(translations[locale].common.matchPercent, calculateMatchScore(perfume, savedQuiz.answers).matchScore)}
                </p>
              </div>
            ) : (
              <div className="text-[12px] text-secondary bg-surface border border-hairline p-4 mt-2 flex flex-wrap items-center justify-between gap-3">
                <span>{translations[locale].common.coldStartBanner}</span>
                {onGoToFinder && (
                  <button
                    type="button"
                    onClick={onGoToFinder}
                    aria-label={translations[locale].common.finderButtonAria}
                    className="min-h-[44px] px-3 py-1.5 rounded-none border border-bar text-xs font-semibold flex items-center gap-1.5 bg-card hover:bg-surface cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{translations[locale].common.finderButton}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notes Pyramid (Top / Heart / Base) - Three-Row Visual (Requirement 7) */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <span className="label-caption block">
                {translations[locale].productDetail.piramidaAroma}
              </span>
              <h3 className="font-sans text-[18px] leading-[26px] font-medium text-ink">
                {translations[locale].productDetail.strukturKomposisiNotesTigaBaris}
              </h3>
            </div>
            
            <div className="space-y-2.5">
              {/* Row 1: Top Notes */}
              <div className="bg-card p-4 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-44 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-bar inline-block"></span>
                    <p className="text-[12px] uppercase font-bold text-ink tracking-wider">{translations[locale].productDetail.pyramidTopLabel}</p>
                  </div>
                  <span className="text-[12px] text-secondary block pt-0.5 font-mono">{translations[locale].productDetail.pyramidTopDuration}</span>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {perfume.top_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onFilterByNote(c)}
                        className="px-3 py-1.5 bg-surface border border-hairline hover:border-bar hover:bg-card text-xs font-medium text-ink transition cursor-pointer active:scale-95"
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Heart Notes */}
              <div className="bg-card p-4 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-44 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary inline-block"></span>
                    <p className="text-[12px] uppercase font-bold text-ink tracking-wider">{translations[locale].productDetail.pyramidHeartLabel}</p>
                  </div>
                  <span className="text-[12px] text-secondary block pt-0.5 font-mono">{translations[locale].productDetail.pyramidHeartDuration}</span>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {perfume.heart_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onFilterByNote(c)}
                        className="px-3 py-1.5 bg-surface border border-hairline hover:border-bar hover:bg-card text-xs font-medium text-ink transition cursor-pointer active:scale-95"
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Base Notes */}
              <div className="bg-card p-4 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-44 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-border inline-block"></span>
                    <p className="text-[12px] uppercase font-bold text-ink tracking-wider">{translations[locale].productDetail.pyramidBaseLabel}</p>
                  </div>
                  <span className="text-[12px] text-secondary block pt-0.5 font-mono">{translations[locale].productDetail.pyramidBaseDuration}</span>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {perfume.base_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onFilterByNote(c)}
                        className="px-3 py-1.5 bg-surface border border-hairline hover:border-bar hover:bg-card text-xs font-medium text-ink transition cursor-pointer active:scale-95"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-y border-hairline py-6">
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
              <span className="font-medium text-[16px] text-ink block font-mono tabular-nums">{fmt(translations[locale].productDetail.projectionLevel, perfume.projection_expected)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[12px] uppercase text-secondary flex items-center gap-1 font-medium">
                <Sun className="w-3.5 h-3.5" /> {translations[locale].productDetail.tropicalClimate}
              </span>
              <span className="font-medium text-[16px] text-ink block font-mono tabular-nums">{perfume.heat_suitability != null ? fmt(translations[locale].productDetail.heatScore, perfume.heat_suitability) : translations[locale].productDetail.iklimTanpaData}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[12px] uppercase text-secondary font-medium flex items-center gap-1.5">
                <span>{translations[locale].product.referencePrice}</span>
                {perfume.price_is_sample ? (
                  <span className="px-1.5 py-0.5 bg-surface border border-hairline text-[12px] font-sans font-normal text-secondary">
                    {translations[locale].sampleDataBadge}
                  </span>
                ) : perfume.price_checked_date ? (
                  <span className="px-1.5 py-0.5 bg-surface border border-hairline text-[12px] font-sans font-normal text-secondary">
                    {fmt(translations[locale].common.priceCheckedOn, perfume.price_checked_date)}
                  </span>
                ) : null}
              </span>
              {/* Nike Fase 3: harga tebal (20px/700, 24px di desktop)
                  ala harga tebal Nike — sebelumnya 16px/medium. */}
              <span className="font-bold text-[20px] md:text-[24px] font-mono tabular-nums text-ink block">
                {formatCurrency(perfume.reference_price_idr, locale)} <span className="font-normal text-secondary text-[12px]">({perfume.reference_price_size_ml} ml)</span>
              </span>
              <span className="text-[12px] text-secondary font-mono tabular-nums block">
                {formatCurrency(Math.round(perfume.reference_price_idr / perfume.reference_price_size_ml), locale)} / ml
              </span>
            </div>
          </div>

          {/* Real Wearers vs Official Claims */}
          <div className="space-y-5 bg-surface p-6 md:p-8 border border-hairline">
            <span className="label-caption block">
              {translations[locale].productDetail.validasiKomunitas}
            </span>
            <h3 className="font-sans text-[18px] leading-[26px] font-medium text-ink">
              {translations[locale].productDetail.ulasanPemakaiNyataVsKlaimResmiBrand}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {perfume.brand_claims ? (
                <div className="bg-paper p-4 border border-hairline space-y-2">
                  <span className="label-caption block">
                    {translations[locale].productDetail.klaimResmiBrand}
                  </span>
                  <p className="text-[14px] text-secondary italic leading-relaxed">
                    "{perfume.brand_claims}"
                  </p>
                  <span className="text-[12px] text-secondary block">
                    {translations[locale].productDetail.sumberMateriPeluncuranResmiBrand}
                  </span>
                </div>
              ) : null}

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
          <div className="border border-hairline bg-card p-6 md:p-8 space-y-4">
            <span className="label-caption flex items-center gap-1.5">
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
                className="min-h-[48px] h-12 bg-bar hover:bg-ink text-paper flex items-center justify-center gap-2 font-medium text-[14px] transition rounded-full"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-hairline pt-5 mt-2">
              <button
                onClick={() => setIsSizeSheetOpen(true)}
                className="min-h-[44px] border border-border hover:bg-surface text-[12px] font-medium text-ink flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{translations[locale].productDetail.addToWardrobe}</span>
              </button>

              {!isOwned && (
                <button
                  onClick={onOpenTryItFirst}
                  className="min-h-[44px] bg-surface border border-hairline text-[12px] font-medium text-ink hover:border-border transition"
                >
                  {translations[locale].common.tryItFirstWaitlistButton}
                </button>
              )}
            </div>

            <p className="text-[12px] text-secondary leading-relaxed pt-1">
              {AFFILIATE_DISCLOSURE[locale]}
            </p>
          </div>

        </div>
      </div>

      {/* ── MODERATED REVIEWS SECTION (Sprint 4: stories excerpt removed) ── */}
      {(() => {
        return (
          <div className="border-t border-hairline pt-10 md:pt-12 space-y-8">
            
            {/* Header & Overall Summary */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-4">
              <div className="space-y-1">
                <span className="label-caption block">
                  {translations[locale].productDetail.evaluasiKomunitasIndependen}
                </span>
                <h2 className="font-display text-ink">
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
                    className="px-4 py-2 bg-bar hover:bg-ink text-paper text-[12px] font-medium flex items-center gap-1.5 transition rounded-full"
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
                    <span className="font-display text-[24px] leading-[32px] font-normal text-ink tabular-nums">
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

            {/* Nike Fase 3: slider konsensus ketahanan — padanan slider
                "kecocokan ukuran" Nike (mis. Fits Small–Runs Large):
                penanda hitam di pita dominan dari ulasan yang sudah
                terbit. Bila ulasan belum cukup (kurang dari 5
                terpublikasi), slider tampil tanpa penanda + catatan
                jujur — tidak ada konsensus yang ditebak. Skala 5 pita
                mengikuti nilai longevity_band ulasan ('<3 jam' s.d.
                '>12 jam'). */}
            <div className="bg-card border border-hairline p-5 space-y-3" data-testid="detail-longevity-slider">
              <span className="text-[12px] font-mono uppercase text-secondary block">
                {translations[locale].productDetail.ketahananKulit}
              </span>
              {(() => {
                const bands = ['<3 jam', '3-6 jam', '6-8 jam', '8-12 jam', '>12 jam'];
                const bandLabel = (b: string) => b.replace(' jam', locale === 'id' ? ' jam' : ' h');
                const dominantIdx = reviewAggregate.hasEnoughReviews
                  ? bands.indexOf(reviewAggregate.longevityDominantBand ?? '6-8 jam')
                  : -1;
                return (
                  <>
                    <div
                      className="relative"
                      role="img"
                      aria-label={reviewAggregate.hasEnoughReviews
                        ? `${translations[locale].productDetail.ketahananKulit}: ${reviewAggregate.longevityDominantBand}`
                        : translations[locale].productDetail.ketahananKulit}
                    >
                      <div className="h-1.5 bg-gray-100 border border-hairline relative">
                        {dominantIdx >= 0 && (
                          <span
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-bar border-2 border-white shadow"
                            style={{ left: `${(dominantIdx / (bands.length - 1)) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-[12px] font-mono text-secondary">
                      {bands.map(b => (
                        <span key={b} className={dominantIdx >= 0 && bands[dominantIdx] === b ? 'text-ink font-bold' : undefined}>
                          {bandLabel(b)}
                        </span>
                      ))}
                    </div>
                    {reviewAggregate.hasEnoughReviews ? (
                      <p className="text-[12px] text-secondary">
                        {translations[locale].productDetail.konsensusIklimTropis} {reviewAggregate.longevityDominantBand}
                      </p>
                    ) : (
                      <p className="text-[12px] text-secondary">
                        {translations[locale].productDetail.belumCukupUlasan}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              <span className="label-caption block">
                {fmt(translations[locale].productDetail.ulasanPengguna0, reviewAggregate.totalPublishedReviews)}
              </span>

              {publishedReviews.length === 0 ? (
                <div className="p-8 bg-card border border-hairline text-center space-y-3">
                  <p className="text-[14px] text-secondary">
                    {translations[locale].productDetail.belumAdaUlasanTerperinciUntukWewangia}
                  </p>
                  {onOpenReviewModal && (
                    <button
                      onClick={() => onOpenReviewModal(perfume.id)}
                      className="px-5 py-2.5 bg-bar hover:bg-ink text-paper text-[12px] font-medium rounded-full"
                    >
                      {translations[locale].productDetail.tulisUlasanPertama}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {publishedReviews.map(r => (
                    <div key={r.id} className="bg-card border border-hairline p-5 space-y-3">
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
                          <span className="tabular-nums font-mono">{fmt(translations[locale].productDetail.helpfulCount, r.helpful_count ?? 0)}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        );
      })()}

      {/* ── RELATED FRAGRANCES IN SAME FAMILY ── */}
      {allPerfumes && onSelectPerfume && perfume.primary_family && (
        <div className="border-t border-hairline pt-10 md:pt-12 space-y-6">
          <div className="flex justify-between items-baseline">
            <div className="space-y-0.5">
              <span className="label-caption block">
                {translations[locale].productDetail.furtherExploration}
              </span>
              <h2 className="font-display text-ink">
                {fmt(translations[locale].productDetail.aromaSerupaDalamKeluarga0, perfume.primary_family ?? '')}
              </h2>
            </div>
            <button
              onClick={() => onFilterByFamily(perfume.primary_family ?? '')}
              className="text-[12px] text-secondary hover:text-ink underline font-medium"
            >
              {translations[locale].productDetail.lihatSemuaDiKatalog}
            </button>
          </div>

          {similarPerfumes.length === 0 ? (
            <p className="text-[14px] leading-[20px] text-secondary">
              {fmt(translations[locale].productDetail.aromaSerupaKosong0, perfume.primary_family ?? '')}
            </p>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
            {similarPerfumes
              .map(rel => (
                <div
                  key={rel.id}
                  onClick={() => onSelectPerfume(rel.id)}
                  className="bg-card border border-hairline p-5 space-y-3 cursor-pointer hover:border-bar transition flex flex-col justify-between h-full"
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
          )}
        </div>
      )}

      {/* ── BOTTOM SHEET / MODAL: ADD BOTTLE TO LIBRARY ── */}
      {/* Nike Fase 3: bottom sheet pemilih ukuran botol — pill outline
          hitam-putih ala Nike (ukuran sepatu → ukuran botol). Pilih
          ukuran → "Lanjutkan" membuka formulir tambah botol dengan
          ukuran + sisa awal terisi ukuran terpilih. */}
      <BottomSheetOrModal
        isOpen={isSizeSheetOpen}
        onClose={() => setIsSizeSheetOpen(false)}
        locale={locale}
        title={translations[locale].productDetail.chooseSizeTitle}
        subtitle={translations[locale].productDetail.chooseSizeSubtitle}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label={translations[locale].productDetail.chooseSizeTitle}>
            {availableSizes.map(size => (
              <button
                key={size}
                type="button"
                aria-pressed={selectedSize === size}
                onClick={() => setSelectedSize(size)}
                className={`min-h-[48px] px-5 rounded-full border text-[14px] font-medium transition ${selectedSize === size ? 'bg-bar text-paper border-bar' : 'border-border bg-card text-ink hover:border-bar'}`}
              >
                {size} ml
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setBottleSize(selectedSize);
              setBottleRemaining(selectedSize);
              setIsSizeSheetOpen(false);
              setIsAddBottleModalOpen(true);
            }}
            className="w-full min-h-[48px] bg-bar hover:bg-ink text-paper text-[14px] font-medium rounded-full transition"
          >
            {translations[locale].finder.continue}
          </button>
        </div>
      </BottomSheetOrModal>

      <BottomSheetOrModal
        isOpen={isAddBottleModalOpen}
        onClose={() => setIsAddBottleModalOpen(false)}
        locale={locale}
        title={fmt(translations[locale].productDetail.addBottleTitle, perfume.name)}
        subtitle={translations[locale].productDetail.addBottleSubtitle}
        maxWidth="max-w-md"
      >
        {bottleAddedSuccess ? (
          <div className="p-6 bg-surface border border-hairline text-center text-ink text-[12px] font-medium space-y-2">
            <CheckCircle2 className="w-10 h-10 text-bar mx-auto" aria-hidden="true" />
            <p className="font-display text-[24px] leading-[32px] font-normal text-ink">{translations[locale].productDetail.bottleAddedTitle}</p>
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
                className="min-h-[48px] px-6 py-2 bg-bar hover:bg-ink text-paper text-[12px] font-medium rounded-full"
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
              aria-label={translations[locale].common.closeDialog}
              className="absolute top-2 right-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-secondary hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="label-caption block">
                {translations[locale].productDetail.shareScentHeading}
              </span>
              <h3 className="font-display text-[24px] leading-[32px] font-normal mt-1 text-ink">
                {perfume.name}
              </h3>
              <p className="text-[12px] text-secondary">{perfume.brand} · {perfume.concentration}</p>
            </div>

            {/* Formatted Text Preview */}
            <div className="bg-surface border border-hairline p-4 text-[12px] space-y-1.5 font-mono text-ink">
              <p>Top: {perfume.top_notes}</p>
              <p>Heart: {perfume.heart_notes}</p>
              <p>Base: {perfume.base_notes}</p>
              <p className="text-[12px] text-secondary pt-1 tabular-nums">Iklim Tropis: {formatScoreOutOfFive(perfume.heat_suitability, translations[locale].productDetail.iklimTanpaData)}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleCopyShareLink}
                className="w-full min-h-[48px] bg-bar hover:bg-ink text-paper text-[12px] font-medium flex items-center justify-center gap-2 transition rounded-full"
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
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + productUrl)}`}
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
              className="min-h-[44px] h-11 bg-bar hover:bg-ink text-paper flex items-center justify-center gap-1.5 font-medium text-xs transition rounded-full"
            >
              <span>Shopee Mall</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a 
              href={`/go/${perfume.id}?platform=tokopedia&src=sticky_mobile`}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="min-h-[44px] h-11 border border-bar bg-card hover:bg-surface text-ink flex items-center justify-center gap-1.5 font-medium text-xs transition"
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
