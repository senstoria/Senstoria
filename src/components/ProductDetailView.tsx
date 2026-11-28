import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
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
  X,
  ChevronDown
} from 'lucide-react';
import { INITIAL_REVIEWS } from '../data/seedDiaryData.ts';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { translations, fmt, Locale, formatCurrency, formatScoreOutOfFive, formatCheckedDate } from '../lib/i18n.ts';
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

const DEMO_REVIEW_IDS = new Set(INITIAL_REVIEWS.map(review => review.id));

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
  // Fase N12 (gerbang S3): masukkan botol full-size ini ke Bag.
  // Optional; App selalu memasoknya untuk parfum published.
  onAddToBag?: () => void;
  onOpenBag: () => void;
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
  onAddToBag,
  onOpenBag,
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

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  // Ide Figma (27 Nov 2026): deskripsi dipotong 2 baris dengan toggle
  // "Read More..." / "Show Less" — toggle hanya muncul bila teksnya
  // benar-benar meluber dari potongan (diukur pada elemen hidup),
  // jadi deskripsi pendek tidak pernah menampilkan toggle yang sia-sia.
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [descNeedsToggle, setDescNeedsToggle] = useState(false);
  const [isSizeSheetOpen, setIsSizeSheetOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number>(perfume.reference_price_size_ml || 50);
  // Fase N4 (D1): panduan ukuran botol (30/50/100 ml) sebagai sheet
  // terpisah — dibuka dari tautan di bawah info konsentrasi/ukuran dan
  // dari dalam size sheet.
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  // Fase N4 (D5): accordion "Lihat Detail Produk" — tertutup default
  // (pola Nike PDP 5), hanya berisi field seed yang benar-benar ada.
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const availableSizes = useMemo(() => {
    // Opsi A (28 Nov 2026): hanya baris published yang menentukan ukuran
    // katalog. Baris draft boleh membawa ukuran terverifikasi apa pun
    // (40/60/200 ml) atau 0 (belum tahu) tanpa bocor ke sheet ini.
    const published = (allPerfumes ?? [perfume]).filter(p => p.data_status === 'published');
    // Publish 12 internasional (28 Nov 2026): 3 baris published membawa ukuran
    // 0 = belum tahu (Elixir, Le Parfum, Vulcan Feu). 0 bukan ukuran yang bisa
    // dipilih — saring keluar supaya sheet tidak menawarkan botol 0 ml.
    const sizes = new Set<number>(published.map(p => p.reference_price_size_ml).filter(s => s > 0));
    return [...sizes].sort((a, b) => a - b);
  }, [allPerfumes, perfume]);

  // Ganti parfum → galeri, pilihan ukuran, dan deskripsi kembali ke awal.
  useEffect(() => {
    setIsGalleryOpen(false);
    setSelectedSize(perfume.reference_price_size_ml || 50);
    setIsDescExpanded(false);
  }, [perfume.id, perfume.reference_price_size_ml]);

  // Ukur apakah deskripsi meluber dari potongan 2 baris — hanya saat
  // tertutup (saat terbuka, clientHeight = tinggi penuh sehingga
  // pengukuran akan selalu bilang "tidak butuh toggle").
  useEffect(() => {
    if (isDescExpanded) return;
    const el = descRef.current;
    if (el) setDescNeedsToggle(el.scrollHeight > el.clientHeight + 1);
  }, [perfume.id, locale, isDescExpanded]);

  // Requirement 8: Track when user scrolls past the main buy section on mobile
  const mainBuySectionRef = useRef<HTMLDivElement>(null);
  const [isPastMainBuy, setIsPastMainBuy] = useState(false);

  // Fase N4 (N-02): sembunyikan buy-bar pill saat footer mulai terlihat
  // — pill fixed menutupi footer saat scroll penuh. Footer dirender App
  // (selalu ada di DOM); rootMargin -170px = tinggi pill (~106px) +
  // bottom-16 (64px), jadi bar hilang tepat saat footer mencapai pill,
  // bukan saat footer baru mengintip di tepi bawah viewport.
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -170px 0px' }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

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

  const heroReviews = publishedReviews.filter(review => !DEMO_REVIEW_IDS.has(review.id));

  // Tahap 0 (26 Nov 2026, B-04): parfum lain dalam keluarga yang sama,
  // dihitung sekali di sini agar seksi "Aroma Serupa" bisa menampilkan
  // pesan jujur saat daftarnya kosong (mis. Enchantée adalah satu-satunya
  // Floral di katalog 2 parfum), bukan heading di atas grid kosong.
  // Opsi A (28 Nov 2026): hanya baris published — baris draft tidak boleh
  // muncul sebagai parfum serupa di Detail produk published, sekalipun
  // familynya sama (atau sama-sama tidak punya family).
  const similarPerfumes = useMemo(
    () => (allPerfumes ?? []).filter(p => p.data_status === 'published' && p.id !== perfume.id && p.primary_family === perfume.primary_family).slice(0, 3),
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
      
      <div className="grid gap-5 md:grid-cols-12 md:gap-x-12 md:items-start">
        <div className="grid grid-cols-[44px_1fr_44px] items-center max-md:mx-1 md:col-span-full">
          <button type="button" onClick={onBackToCatalog}
            aria-label={translations[locale].productDetail.kembaliKeKatalog}
            className="grid size-11 place-items-center text-ink">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <p className="text-center text-lg font-bold text-ink">Detail</p>
          <button type="button" onClick={onToggleWishlist} aria-pressed={isWishlisted}
            aria-label={translations[locale].productDetail.addWishlist}
            className={`grid size-11 place-items-center rounded-full border bg-white ${isWishlisted ? 'border-wishlist/20 text-wishlist' : 'border-muted/40 text-ink'}`}>
            <Heart className={`size-5 ${isWishlisted ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <div data-testid="detail-gallery"
          className="relative isolate grid aspect-square place-items-center overflow-hidden rounded-hero bg-photo max-md:mx-1 md:col-span-5">
          <span aria-hidden="true" className="display-watermark absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap uppercase">
            {perfume.primary_family || perfume.name}
          </span>
          <div className="relative flex h-[76%] w-[80%] -rotate-12 items-center justify-center">
            {perfume.image_url ? (
              <img src={perfume.image_url} alt={`${perfume.brand} ${perfume.name}`}
                className="h-full w-full object-contain" />
            ) : (
              <Bottle fragranceId={perfume.id} name={perfume.name} brand={perfume.brand}
                size="lg" className="h-full [&>svg]:h-full [&>svg]:w-auto" />
            )}
          </div>
          <button type="button" onClick={() => setIsGalleryOpen(true)} aria-haspopup="dialog"
            className="absolute bottom-3 left-1/2 flex min-h-11 -translate-x-1/2 items-center rounded-full bg-white px-5 text-xs font-semibold text-ink">
            {locale === 'id' ? 'Lihat foto' : 'View photos'}
          </button>
        </div>

        <div className="min-w-0 space-y-6 md:col-span-7">
          <div className="space-y-3 max-md:mx-1">
            <div className="label-caps flex flex-wrap items-center gap-2 text-muted">
              <button type="button" onClick={() => onFilterByBrand(perfume.brand)} className="uppercase hover:underline">
                {perfume.brand}
              </button>
              {perfume.primary_family && (
                <>
                  <span>·</span>
                  <button type="button" onClick={() => onFilterByFamily(perfume.primary_family ?? '')} className="uppercase hover:underline">
                    {perfume.primary_family}
                  </button>
                </>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-detail-title min-w-0 break-words text-ink">{perfume.name}</h1>
              <p className="text-price-detail shrink-0 text-right text-ink">
                {formatCurrency(perfume.reference_price_idr, locale)}
              </p>
            </div>
            {heroReviews.length > 0 && (
              <p className="flex items-center gap-1.5 text-sm text-ink">
                <Star className="size-4 fill-current" aria-hidden="true" />
                {(heroReviews.reduce((sum, review) => sum + review.rating, 0) / heroReviews.length).toFixed(1)}
                <span className="text-muted">({heroReviews.length} {translations[locale].productDetail.ulasan})</span>
              </p>
            )}
            <p className="font-mono text-[14px] text-secondary tabular-nums">
              {perfume.concentration} · {perfume.reference_price_size_ml} ml
            </p>

            <div className="flex items-center justify-between gap-2">
              <h2 id="detail-size-label" className="text-sm font-bold text-ink">{locale === 'id' ? 'Ukuran' : 'Size'}</h2>
              <button type="button" onClick={() => setIsGuideOpen(true)}
                className="min-h-11 text-xs font-medium text-secondary underline underline-offset-2">
                {translations[locale].productDetail.sizeGuideLink}
              </button>
            </div>
            <div className="flex gap-2" role="group" aria-labelledby="detail-size-label">
              {[30, 50, 100].map(size => {
                const available = availableSizes.includes(size);
                const selected = available && selectedSize === size;
                return (
                  <button key={size} type="button" aria-label={`${size} ml`}
                    disabled={!available} aria-pressed={selected} onClick={() => setSelectedSize(size)}
                    className={`grid size-11 place-items-center rounded-size border text-sm font-bold disabled:opacity-40 ${selected ? 'border-ink bg-ink text-white' : 'border-muted/40 bg-white text-ink'}`}>
                    {size}
                  </button>
                );
              })}
            </div>
            {onAddToBag && (
              <div className="flex items-center gap-3 pt-1">
                <a href="/bag" aria-label="Bag"
                  onClick={event => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    onOpenBag();
                  }}
                  className="grid size-14 shrink-0 place-items-center rounded-full border border-muted/40 bg-white text-ink">
                  <ShoppingBag className="size-5" aria-hidden="true" />
                </a>
                <button type="button" onClick={onAddToBag} data-testid="detail-add-to-bag"
                  className="flex h-14 flex-1 items-center justify-between gap-2 rounded-full bg-ink pl-5 pr-2 text-[15px] font-bold text-white">
                  {translations[locale].productDetail.addToBag}
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-ink" aria-hidden="true">
                    <ArrowRight className="size-5" />
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="border-b border-hairline pb-6 space-y-2">
            <p ref={descRef} className={`text-[16px] leading-[28px] text-secondary pt-3 ${isDescExpanded ? '' : 'line-clamp-2'}`}>
              {locale === 'id' ? perfume.description_id : perfume.description_en}
            </p>
            {descNeedsToggle && (
              <button
                type="button"
                onClick={() => setIsDescExpanded(v => !v)}
                aria-expanded={isDescExpanded}
                className="min-h-[44px] text-[14px] font-medium text-ink underline underline-offset-2 cursor-pointer transition active:scale-[0.97]"
              >
                {isDescExpanded ? translations[locale].productDetail.showLess : translations[locale].productDetail.readMore}
              </button>
            )}

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
              <h3 className="text-ink">
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
                        className="px-3 py-1.5 bg-surface border border-hairline hover:border-bar hover:bg-card text-xs font-medium text-ink transition cursor-pointer active:scale-[0.97]"
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
                        className="px-3 py-1.5 bg-surface border border-hairline hover:border-bar hover:bg-card text-xs font-medium text-ink transition cursor-pointer active:scale-[0.97]"
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
                        className="px-3 py-1.5 bg-surface border border-hairline hover:border-bar hover:bg-card text-xs font-medium text-ink transition cursor-pointer active:scale-[0.97]"
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
                    {/* Fase N4 (D5/J-12): tanggal dicek diformat dari ISO
                        seed ('2026-10-30' → '30 Okt 2026'), bukan
                        mentah — sesuai kutipan rencana. */}
                    {fmt(translations[locale].common.priceCheckedOn, formatCheckedDate(perfume.price_checked_date, locale))}
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

          {/* ── FASE N4 (D5): ACCORDION "LIHAT DETAIL PRODUK" (PDP 5) ── */}
          {/* Pola Nike "View Product Details": tertutup default, hanya
              berisi field seed yang benar-benar ada — tanpa Benefits
              karangan (isi Nike 5 Benefits + fabric tidak terbaca dan
              tidak dikarang). Baris dirender hanya bila field-nya ada
              (keluarga/tahun/klaim); The Perfection mis. tidak punya
              primary_family maupun release_year, jadi kedua baris itu
              tidak muncul untuknya. */}
          <div className="border border-hairline bg-card" data-testid="detail-product-details">
            <button
              type="button"
              onClick={() => setIsDetailsOpen(v => !v)}
              aria-expanded={isDetailsOpen}
              aria-controls="detail-product-details-panel"
              className="w-full min-h-[48px] flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer transition active:scale-[0.97] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
            >
              <span className="font-h3">{translations[locale].productDetail.productDetailsTitle}</span>
              <ChevronDown className={`w-5 h-5 shrink-0 text-ink transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {isDetailsOpen && (
              <dl id="detail-product-details-panel" className="border-t border-hairline px-5 py-4 space-y-3 text-[14px] leading-[22px]">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3">
                  <dt className="text-secondary shrink-0">{translations[locale].productDetail.detailRowConcentration}</dt>
                  <dd className="text-ink font-medium sm:text-right">{perfume.concentration}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3">
                  <dt className="text-secondary shrink-0">{translations[locale].productDetail.detailRowSize}</dt>
                  <dd className="text-ink font-medium sm:text-right tabular-nums">{perfume.reference_price_size_ml} ml</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3">
                  <dt className="text-secondary shrink-0">{translations[locale].productDetail.detailRowPrice}</dt>
                  <dd className="text-ink font-medium sm:text-right">
                    <span className="tabular-nums">{formatCurrency(perfume.reference_price_idr, locale)}</span>
                    {perfume.price_checked_date && (
                      <span className="block text-[12px] font-normal text-secondary">
                        {fmt(translations[locale].common.priceCheckedOn, formatCheckedDate(perfume.price_checked_date, locale))}
                      </span>
                    )}
                  </dd>
                </div>
                {perfume.primary_family && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3">
                    <dt className="text-secondary shrink-0">{translations[locale].productDetail.detailRowFamily}</dt>
                    <dd className="text-ink font-medium sm:text-right">{perfume.primary_family}</dd>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3">
                  <dt className="text-secondary shrink-0">{translations[locale].productDetail.detailRowOrigin}</dt>
                  <dd className="text-ink font-medium sm:text-right">{perfume.origin === 'ID' ? 'Lokal Indonesia' : 'Global / Internasional'}</dd>
                </div>
                {perfume.release_year && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3">
                    <dt className="text-secondary shrink-0">{translations[locale].productDetail.detailRowYear}</dt>
                    <dd className="text-ink font-medium sm:text-right tabular-nums">{perfume.release_year}</dd>
                  </div>
                )}
                {perfume.top_notes && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3">
                    <dt className="text-secondary shrink-0">{translations[locale].productDetail.pyramidTopLabel}</dt>
                    <dd className="text-ink font-medium sm:text-right">{perfume.top_notes}</dd>
                  </div>
                )}
                {perfume.heart_notes && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3">
                    <dt className="text-secondary shrink-0">{translations[locale].productDetail.pyramidHeartLabel}</dt>
                    <dd className="text-ink font-medium sm:text-right">{perfume.heart_notes}</dd>
                  </div>
                )}
                {perfume.base_notes && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3">
                    <dt className="text-secondary shrink-0">{translations[locale].productDetail.pyramidBaseLabel}</dt>
                    <dd className="text-ink font-medium sm:text-right">{perfume.base_notes}</dd>
                  </div>
                )}
                {perfume.brand_claims && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3">
                    <dt className="text-secondary shrink-0">{translations[locale].productDetail.detailRowBrandClaims}</dt>
                    <dd className="text-ink font-medium sm:text-right">
                      {perfume.brand_claims.replace(/^Klaim Brand:\s*/, '')}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Real Wearers vs Official Claims */}
          <div className="space-y-5 bg-surface p-6 md:p-8 border border-hairline">
            <span className="label-caption block">
              {translations[locale].productDetail.validasiKomunitas}
            </span>
            {/* Fase N4 (Y5): judul seksi satu suara Fraunces — class
                font-sans di h3 ini menimpa aturan h3 di index.css
                (Fraunces 24/28.8/800); tanpa override, h3 memakai
                suara display yang sama dengan h1/h2. */}
            <h3 className="text-ink">
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

          <div className="flex items-stretch gap-2">
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
          <div className="w-full flex items-center justify-between text-[12px] font-mono uppercase bg-paper px-3 py-1.5 border border-hairline text-secondary">
            <span>{perfume.origin === 'ID' ? 'Lokal Indonesia' : 'Global / Internasional'}</span>
            {perfume.release_year && <span className="tabular-nums">{perfume.release_year}</span>}
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
              {reviewAggregate.totalPublishedReviews === 0 ? (
                // Fase N4 (D6 — N-06): 0 ulasan → track disembunyikan;
                // hanya pesan jujur + CTA "Tulis Ulasan". Track kosong
                // menyiratkan skala tanpa konsensus; tidak ada yang ditebak.
                // (1–4 ulasan tetap menampilkan track tanpa penanda +
                // "Belum cukup ulasan" seperti sebelumnya.)
                <div className="space-y-3">
                  <p className="text-[14px] text-secondary">
                    {translations[locale].productDetail.belumCukupUlasan}
                  </p>
                  {onOpenReviewModal && (
                    <button
                      type="button"
                      onClick={() => onOpenReviewModal(perfume.id)}
                      className="min-h-[44px] px-5 bg-bar hover:bg-ink text-paper text-[12px] font-medium rounded-full transition"
                    >
                      {translations[locale].productDetail.detailWriteReview}
                    </button>
                  )}
                </div>
              ) : (
                (() => {
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
                })()
              )}
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

      <BottomSheetOrModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        locale={locale}
        title={locale === 'id' ? 'Galeri produk' : 'Product gallery'}
        maxWidth="max-w-lg"
      >
        {perfume.image_url ? (
          <img src={perfume.image_url} alt={`${perfume.brand} ${perfume.name}`}
            className="mx-auto max-h-[60vh] max-w-full object-contain" />
        ) : (
          <figure className="flex flex-col items-center gap-2">
            <Bottle fragranceId={perfume.id} name={perfume.name} brand={perfume.brand} size="lg" />
            <figcaption className="text-sm text-secondary">
              {locale === 'id' ? 'Ilustrasi botol' : 'Bottle illustration'}
            </figcaption>
          </figure>
        )}
      </BottomSheetOrModal>

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
            disabled={!availableSizes.includes(selectedSize)}
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
          {/* Fase N4 (D1): tautan panduan ukuran dari dalam size sheet —
              menutup sheet ini lalu membuka sheet panduan. */}
          <button
            type="button"
            onClick={() => {
              setIsSizeSheetOpen(false);
              setIsGuideOpen(true);
            }}
            className="w-full min-h-[44px] text-[12px] font-medium text-secondary underline underline-offset-2 hover:text-ink transition"
          >
            {translations[locale].productDetail.sizeGuideLink}
          </button>
        </div>
      </BottomSheetOrModal>

      {/* ── FASE N4 (D1): PANDUAN UKURAN BOTOL (30/50/100 ml) ── */}
      {/* "Size Guide" Nike → panduan ukuran botol: tiga ukuran standar
          dengan penjelasan netral (tanpa angka daya tahan / jumlah
          semprotan yang dikarang — seed tidak menyediakannya) + baris
          ukuran yang benar-benar bisa dipilih untuk parfum ini
          (availableSizes dari data katalog). */}
      <BottomSheetOrModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        locale={locale}
        title={translations[locale].productDetail.sizeGuideTitle}
        subtitle={translations[locale].productDetail.sizeGuideSubtitle}
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          {[
            { title: translations[locale].productDetail.sizeGuide30Title, desc: translations[locale].productDetail.sizeGuide30Desc },
            { title: translations[locale].productDetail.sizeGuide50Title, desc: translations[locale].productDetail.sizeGuide50Desc },
            { title: translations[locale].productDetail.sizeGuide100Title, desc: translations[locale].productDetail.sizeGuide100Desc },
          ].map(row => (
            <div key={row.title} className="bg-surface border border-hairline p-4 space-y-1">
              <p className="font-medium text-[14px] text-ink">{row.title}</p>
              <p className="text-[12px] text-secondary leading-relaxed">{row.desc}</p>
            </div>
          ))}
          <p className="text-[12px] text-secondary leading-relaxed">
            {fmt(translations[locale].productDetail.sizeGuideAvailable, `${availableSizes.join(', ')} ml`)}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsGuideOpen(false);
              setIsSizeSheetOpen(true);
            }}
            className="w-full min-h-[48px] bg-bar hover:bg-ink text-paper text-[14px] font-medium rounded-full transition"
          >
            {translations[locale].productDetail.chooseSizeTitle}
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
                <label htmlFor="detail-bottle-size" className="font-medium block text-ink">Ukuran Botol (ml)</label>
                <input 
                  type="number" 
                  inputMode="numeric"
                  min="1" 
                  max="1000"
                  value={bottleSize}
                  id="detail-bottle-size"
                  name="bottle-size"
                  onChange={e => {
                    const val = Number(e.target.value);
                    setBottleSize(val);
                    if (bottleRemaining > val) setBottleRemaining(val);
                  }}
                  className="w-full min-h-[44px] p-2 bg-paper border border-border text-[14px] font-mono tabular-nums text-ink"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="detail-bottle-remaining" className="font-medium block text-ink">Sisa Cairan (ml)</label>
                <input 
                  type="number" 
                  inputMode="numeric"
                  min="0" 
                  max={bottleSize}
                  step="0.5"
                  value={bottleRemaining}
                  id="detail-bottle-remaining"
                  name="bottle-remaining"
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
              <label htmlFor="detail-bottle-price" className="font-medium block text-ink">Harga Pembelian (Rp)</label>
              <input 
                type="number" 
                inputMode="numeric"
                value={bottlePrice}
                id="detail-bottle-price"
                name="bottle-price"
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
      {/* Fase N11 (N-01/N-07): dulu modal custom `div` tanpa role="dialog",
          tanpa focus trap, tanpa Escape. Sekarang lewat BottomSheetOrModal
          — dialog semantik + Escape + focus trap + animasi + drag. */}
      <BottomSheetOrModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        locale={locale}
        title={perfume.name}
        subtitle={`${perfume.brand} · ${perfume.concentration}`}
        maxWidth="max-w-md"
      >
        <span className="label-caption block">
          {translations[locale].productDetail.shareScentHeading}
        </span>

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
      </BottomSheetOrModal>

      {/* ── MOBILE STICKY MARKETPLACE BUY BAR (Requirement 8: sticky at bottom on mobile above nav bar once scrolled past main buy section) ── */}
      {/* Ide Figma (27 Nov 2026): bar melayang bentuk pil — lebar penuh
          dikurangi margin, radius 40, di atas tab bar (bottom-16 ≈
          60dp clearance, sama seperti sebelumnya), tombol CTA 60px
          membulat penuh. TANPA harga di dalam tombol. Baris disclosure
          afiliasi tetap di bawah tombol.
          Fase N4 (N-02): bar disembunyikan saat footer terlihat
          (isFooterVisible) — pill fixed menutupi footer saat scroll penuh. */}
      {isPastMainBuy && !isFooterVisible && (
        <div className="fixed bottom-16 left-4 right-4 z-30 bg-paper border border-bar rounded-[40px] shadow-sheet p-3 lg:hidden animate-sheet-enter">
          <div className="grid grid-cols-2 gap-2">
            <a 
              href={`/go/${perfume.id}?platform=shopee&src=sticky_mobile`}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="h-[60px] bg-bar hover:bg-ink text-paper flex items-center justify-center gap-1.5 font-medium text-xs transition rounded-full"
            >
              <span>Shopee Mall</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a 
              href={`/go/${perfume.id}?platform=tokopedia&src=sticky_mobile`}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="h-[60px] border border-bar bg-card hover:bg-surface text-ink flex items-center justify-center gap-1.5 font-medium text-xs transition rounded-full"
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
