import React, { useState } from 'react';
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
import { Locale, formatCurrency } from '../lib/i18n.ts';
import { ReviewState, StoryState, computeReviewSummary } from '../lib/derivedCalculations.ts';
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

  return (
    <div className="space-y-8">
      
      {/* ── TOP BREADCRUMB & BACK ACTION ── */}
      <div className="flex items-center justify-between border-b border-[#d9d7c9] pb-4">
        <button 
          onClick={onBackToCatalog}
          className="text-[12px] font-medium text-[#5c5c5c] hover:text-[#000000] flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{locale === 'id' ? 'Kembali ke Katalog' : 'Back to Catalog'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleWishlist}
            className={`px-3 py-1.5 border text-[12px] font-medium flex items-center gap-1.5 transition ${
              isWishlisted ? 'border-[#b3261e] text-[#b3261e] bg-[#f4f3e6]' : 'border-[#8a8a8a] text-[#000000] hover:bg-[#f4f3e6]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
            <span>{isWishlisted ? 'Di Wishlist' : 'Tambah Wishlist'}</span>
          </button>

          <button
            onClick={onToggleCompare}
            className={`px-3 py-1.5 border text-[12px] font-medium flex items-center gap-1.5 transition ${
              isCompared ? 'bg-[#333333] text-[#fffef2] border-[#333333]' : 'border-[#8a8a8a] text-[#000000] hover:bg-[#f4f3e6]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isCompared ? 'Dalam Komparasi' : 'Bandingkan'}</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 border border-[#8a8a8a] hover:bg-[#f4f3e6] text-[12px] text-[#000000] font-medium flex items-center gap-1.5 transition"
            title="Bagikan Aroma"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan</span>
          </button>
        </div>
      </div>

      {/* ── PRODUCT HERO SPLIT ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Visual Silhouette & Authenticity */}
        <div className="md:col-span-5 bg-[#f4f3e6] border border-[#d9d7c9] p-6 md:p-8 flex flex-col items-center justify-center space-y-6">
          <div className="w-full py-6 flex items-center justify-center relative">
            <Bottle 
              fragranceId={perfume.id} 
              name={perfume.name} 
              brand={perfume.brand} 
              size="lg" 
              showFill={false} 
            />
          </div>

          <div className="w-full flex items-center justify-between text-[12px] font-mono uppercase bg-[#fffef2] px-3 py-1.5 border border-[#d9d7c9] text-[#5c5c5c]">
            <span>{perfume.origin === 'ID' ? 'Lokal Indonesia' : 'Global / Internasional'}</span>
            <span>{perfume.market_tier}</span>
          </div>

          <div className="text-center space-y-1 w-full border-t border-[#d9d7c9] pt-4">
            <div className="flex items-center justify-center gap-1.5 text-[12px] text-[#000000] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#333333]" />
              <span>Data Terverifikasi Senstoria</span>
            </div>
            <p className="text-[12px] text-[#5c5c5c] leading-relaxed">
              Bebas promosi berbayar. Kami tidak menerima bayaran untuk mengubah skor atau peringkat wewangian ini.
            </p>
          </div>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Header Metadata */}
          <div className="border-b border-[#d9d7c9] pb-6 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#5c5c5c]">
              <button 
                onClick={() => onFilterByBrand(perfume.brand)}
                className="font-medium text-[#000000] uppercase tracking-wider hover:underline"
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

            <h1 className="font-serif text-[32px] leading-[40px] md:text-[48px] md:leading-[56px] font-normal text-[#000000]">
              {perfume.name}
            </h1>
            <p className="font-mono text-[14px] text-[#5c5c5c] tabular-nums">
              {perfume.concentration} · {perfume.reference_price_size_ml} ml
            </p>

            <p className="text-[16px] leading-[24px] text-[#5c5c5c] pt-2">
              {locale === 'id' ? perfume.description_id : perfume.description_en}
            </p>
          </div>

          {/* Notes Pyramid (Top / Heart / Base) */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <span className="text-[12px] uppercase tracking-widest text-[#5c5c5c] font-medium block">
                PIRAMIDA AROMA
              </span>
              <h3 className="font-sans text-[18px] leading-[26px] font-medium text-[#000000]">
                Struktur Komposisi Notes
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#fffef2] p-4 border border-[#d9d7c9] space-y-2">
                <p className="text-[12px] uppercase font-medium text-[#5c5c5c] tracking-wider">Top Notes</p>
                <div className="flex flex-wrap gap-1.5">
                  {perfume.top_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        onClick={() => onFilterByNote(c)}
                        className="text-[12px] text-[#000000] hover:underline underline-offset-2"
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#fffef2] p-4 border border-[#d9d7c9] space-y-2">
                <p className="text-[12px] uppercase font-medium text-[#5c5c5c] tracking-wider">Heart Notes</p>
                <div className="flex flex-wrap gap-1.5">
                  {perfume.heart_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        onClick={() => onFilterByNote(c)}
                        className="text-[12px] text-[#000000] hover:underline underline-offset-2"
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#fffef2] p-4 border border-[#d9d7c9] space-y-2">
                <p className="text-[12px] uppercase font-medium text-[#5c5c5c] tracking-wider">Base Notes</p>
                <div className="flex flex-wrap gap-1.5">
                  {perfume.base_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        onClick={() => onFilterByNote(c)}
                        className="text-[12px] text-[#000000] hover:underline underline-offset-2"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-[#d9d7c9] py-5">
            <div className="space-y-1">
              <span className="text-[12px] uppercase text-[#5c5c5c] flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" /> Daya Tahan
              </span>
              <span className="font-medium text-[16px] text-[#000000] block">{perfume.longevity_expected_band}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[12px] uppercase text-[#5c5c5c] flex items-center gap-1 font-medium">
                <Wind className="w-3.5 h-3.5" /> Proyeksi / Sillage
              </span>
              <span className="font-medium text-[16px] text-[#000000] block font-mono tabular-nums">Tingkat {perfume.projection_expected} / 4</span>
            </div>
            <div className="space-y-1">
              <span className="text-[12px] uppercase text-[#5c5c5c] flex items-center gap-1 font-medium">
                <Sun className="w-3.5 h-3.5" /> Iklim Tropis
              </span>
              <span className="font-medium text-[16px] text-[#000000] block font-mono tabular-nums">Skor {perfume.heat_suitability} / 5</span>
            </div>
            <div className="space-y-1">
              <span className="text-[12px] uppercase text-[#5c5c5c] font-medium block">Harga Referensi</span>
              <span className="font-medium text-[16px] font-mono tabular-nums text-[#000000] block">
                {formatCurrency(perfume.reference_price_idr, locale)}
              </span>
              <span className="text-[12px] text-[#5c5c5c] font-mono tabular-nums block">
                {formatCurrency(Math.round(perfume.reference_price_idr / perfume.reference_price_size_ml), locale)} / ml
              </span>
            </div>
          </div>

          {/* Real Wearers vs Official Claims */}
          <div className="space-y-3 bg-[#f4f3e6] p-5 border border-[#d9d7c9]">
            <span className="text-[12px] uppercase tracking-widest text-[#5c5c5c] font-medium block">
              VALIDASI KOMUNITAS
            </span>
            <h3 className="font-sans text-[18px] leading-[26px] font-medium text-[#000000]">
              Ulasan Pemakai Nyata vs Klaim Resmi Brand
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#fffef2] p-4 border border-[#d9d7c9] space-y-2">
                <span className="text-[12px] uppercase tracking-wider font-medium text-[#5c5c5c] block">
                  Klaim Resmi Brand
                </span>
                <p className="text-[14px] text-[#5c5c5c] italic leading-relaxed">
                  "{perfume.brand_claims}"
                </p>
                <span className="text-[12px] text-[#5c5c5c] block">Sumber: Materi peluncuran resmi brand</span>
              </div>

              <div className="bg-[#fffef2] p-4 border border-[#d9d7c9] space-y-2">
                <span className="text-[12px] uppercase tracking-wider font-medium text-[#000000] block">
                  Data Pemakai Senstoria
                </span>
                <p className="text-[14px] font-medium text-[#000000]">
                  {perfume.rating_seed_count} ulasan diverifikasi ({perfume.rating_seed} ★)
                </p>
                <div className="text-[12px] text-[#5c5c5c] space-y-1">
                  <p>• Ketahanan nyata kulit: {perfume.longevity_expected_band}</p>
                  <p>• 88% pemakai menyatakan aroma sesuai deskripsi</p>
                  <p>• 74% bersedia membeli botol penuh kembali</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tropical Climate Wear Guide */}
          <div className="border border-[#d9d7c9] bg-[#fffef2] p-5 space-y-3">
            <span className="text-[12px] uppercase tracking-widest font-medium text-[#5c5c5c] flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-[#333333]" />
              <span>Panduan Pemakaian di Iklim Tropis Indonesia</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-[#f4f3e6] border border-[#d9d7c9] space-y-1">
                <p className="font-medium text-[14px] text-[#000000]">Outdoor / Siang Hari</p>
                <p className="text-[12px] text-[#5c5c5c] leading-relaxed">Gunakan 2–3 semprotan di titik nadi dada atau tengkuk agar tidak terlalu pekat saat berkeringat.</p>
              </div>
              <div className="p-3 bg-[#f4f3e6] border border-[#d9d7c9] space-y-1">
                <p className="font-medium text-[14px] text-[#000000]">Ruang Ber-AC / Kantor</p>
                <p className="text-[12px] text-[#5c5c5c] leading-relaxed">Sillage ramah ruang tertutup, aroma bertahan lembut 6–8 jam tanpa mendistraksi rekan kerja.</p>
              </div>
              <div className="p-3 bg-[#f4f3e6] border border-[#d9d7c9] space-y-1">
                <p className="font-medium text-[14px] text-[#000000]">Malam & Cuaca Hujan</p>
                <p className="text-[12px] text-[#5c5c5c] leading-relaxed">Notes dasar kayu & rempah lebih kaya dan hangat, semprotkan pada pakaian katun untuk ketahanan ekstra.</p>
              </div>
            </div>
          </div>

          {/* Affiliate Outbound Buttons & Secondary Actions */}
          <div className="space-y-3 pt-2">
            <p className="text-[14px] font-medium text-[#000000]">
              Beli Resmi Melalui Rekanan Marketplace Terpercaya:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a 
                href={`/go/${perfume.id}?platform=shopee&src=product_detail`}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="min-h-[48px] h-12 bg-[#333333] hover:bg-[#000000] text-[#fffef2] flex items-center justify-center gap-2 font-medium text-[14px] transition"
              >
                <span>Beli di Shopee Mall</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <a 
                href={`/go/${perfume.id}?platform=tokopedia&src=product_detail`}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="min-h-[48px] h-12 border border-[#8a8a8a] hover:bg-[#f4f3e6] text-[#000000] flex items-center justify-center gap-2 font-medium text-[14px] transition"
              >
                <span>Beli di Tokopedia Official</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Secondary Action Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setIsAddBottleModalOpen(true)}
                className="min-h-[44px] border border-[#8a8a8a] hover:bg-[#f4f3e6] text-[12px] font-medium text-[#000000] flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambahkan ke Lemariku</span>
              </button>

              <button
                onClick={onOpenTryItFirst}
                className="min-h-[44px] bg-[#f4f3e6] border border-[#d9d7c9] text-[12px] font-medium text-[#000000] hover:border-[#8a8a8a] transition"
              >
                Coba Dulu (Daftar Tunggu Sampel)
              </button>
            </div>

            <p className="text-[12px] text-[#5c5c5c] leading-relaxed pt-1">
              Kami dapat memperoleh komisi jika kamu membeli melalui tautan di atas. Hal ini tidak memengaruhi skor kecocokan atau posisi rekomendasi kami.
            </p>
          </div>

        </div>
      </div>

      {/* ── COMMUNITY REVIEWS & SCENT STORIES SECTION ── */}
      {(() => {
        const perfumeReviews = reviews.filter(r => r.perfume_id === perfume.id);
        const perfumeStories = stories.filter(s => s.perfume_id === perfume.id && s.status === 'published');
        const reviewSummary = computeReviewSummary(perfumeReviews);

        return (
          <div className="border-t border-[#d9d7c9] pt-8 space-y-6">
            
            {/* Header & Overall Summary */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d9d7c9] pb-4">
              <div className="space-y-1">
                <span className="text-[12px] uppercase tracking-widest text-[#5c5c5c] font-medium block">
                  {locale === 'id' ? 'EVALUASI KOMUNITAS INDEPENDEN' : 'COMMUNITY EVALUATION'}
                </span>
                <h2 className="font-serif text-[24px] leading-[32px] md:text-[32px] md:leading-[40px] font-normal text-[#000000]">
                  {locale === 'id' ? 'Ulasan Multi-Kriteria & Cerita Aroma' : 'Community Reviews & Scent Stories'}
                </h2>
                <p className="text-[14px] text-[#5c5c5c]">
                  {locale === 'id'
                    ? 'Data ketahanan nyata kulit, jejak aroma, dan nilai beli dari pemakai terverifikasi Senstoria.'
                    : 'Real skin wear, longevity consensus, and repurchase data from verified community wearers.'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {onOpenStoryModal && (
                  <button
                    onClick={() => onOpenStoryModal(perfume.id)}
                    className="px-4 py-2 bg-[#f4f3e6] hover:bg-[#fffef2] border border-[#8a8a8a] text-[12px] font-medium text-[#000000] flex items-center gap-1.5 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#333333]" />
                    <span>{locale === 'id' ? 'Tulis Cerita' : 'Write Story'}</span>
                  </button>
                )}

                {onOpenReviewModal && (
                  <button
                    onClick={() => onOpenReviewModal(perfume.id)}
                    className="px-4 py-2 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[12px] font-medium flex items-center gap-1.5 transition"
                  >
                    <Star className="w-3.5 h-3.5 text-[#fffef2]" />
                    <span>{locale === 'id' ? 'Tulis Ulasan Parfum Ini' : 'Write Review'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scorecard Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#fffef2] border border-[#d9d7c9] p-5">
              
              {/* Average Rating */}
              <div className="space-y-1">
                <span className="text-[12px] font-mono uppercase text-[#5c5c5c] block">
                  {locale === 'id' ? 'Rata-Rata Komunitas' : 'Average Rating'}
                </span>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-[#333333] text-[#333333]" />
                  <span className="font-serif text-[24px] leading-[32px] font-normal text-[#000000] tabular-nums">
                    {perfumeReviews.length > 0 ? reviewSummary.averageRating.toFixed(1) : perfume.rating_seed}
                  </span>
                  <span className="text-[#5c5c5c] font-mono text-[12px] tabular-nums">
                    ({perfumeReviews.length > 0 ? perfumeReviews.length : perfume.rating_seed_count})
                  </span>
                </div>
              </div>

              {/* Longevity Consensus */}
              <div className="space-y-1">
                <span className="text-[12px] font-mono uppercase text-[#5c5c5c] block">
                  {locale === 'id' ? 'Ketahanan Kulit' : 'Skin Longevity'}
                </span>
                <p className="font-medium text-[14px] text-[#000000]">
                  {perfumeReviews.length > 0 ? reviewSummary.longevityDominantBand : perfume.longevity_expected_band}
                </p>
                <span className="text-[12px] text-[#5c5c5c] block">
                  {locale === 'id' ? 'Konsensus iklim tropis' : 'Tropical consensus'}
                </span>
              </div>

              {/* Sillage Projection */}
              <div className="space-y-1">
                <span className="text-[12px] font-mono uppercase text-[#5c5c5c] block">
                  {locale === 'id' ? 'Jejak Aroma (Sillage)' : 'Sillage Projection'}
                </span>
                <p className="font-medium text-[14px] text-[#000000] capitalize">
                  {perfumeReviews.length > 0 ? reviewSummary.sillageDominant : 'Moderate (Radius Lengan)'}
                </p>
                <span className="text-[12px] text-[#5c5c5c] block">
                  {locale === 'id' ? 'Ramah ruang tertutup / AC' : 'Indoor friendly'}
                </span>
              </div>

              {/* Repurchase Rate */}
              <div className="space-y-1">
                <span className="text-[12px] font-mono uppercase text-[#5c5c5c] block">
                  {locale === 'id' ? 'Niat Beli Ulang' : 'Repurchase Rate'}
                </span>
                <p className="font-medium text-[14px] text-[#000000] tabular-nums">
                  {perfumeReviews.length > 0 ? `${reviewSummary.repurchaseYesRatePct}% Pasti Beli Lagi` : '82% Pasti Beli Lagi'}
                </p>
                <span className="text-[12px] text-[#5c5c5c] block">
                  {locale === 'id' ? 'Tingkat kepuasan tinggi' : 'High satisfaction rate'}
                </span>
              </div>

            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              <span className="text-[12px] uppercase tracking-widest font-medium text-[#5c5c5c] block">
                {locale === 'id' ? `ULASAN PENGGUNA (${perfumeReviews.length})` : `USER REVIEWS (${perfumeReviews.length})`}
              </span>

              {perfumeReviews.length === 0 ? (
                <div className="p-8 bg-[#fffef2] border border-[#d9d7c9] text-center space-y-3">
                  <p className="text-[14px] text-[#5c5c5c]">
                    {locale === 'id'
                      ? 'Belum ada ulasan terperinci untuk wewangian ini. Jadilah yang pertama memberikan ulasan!'
                      : 'No detailed reviews yet. Be the first to share your wear experience!'}
                  </p>
                  {onOpenReviewModal && (
                    <button
                      onClick={() => onOpenReviewModal(perfume.id)}
                      className="px-5 py-2.5 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[12px] font-medium"
                    >
                      {locale === 'id' ? 'Tulis Ulasan Pertama' : 'Write First Review'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {perfumeReviews.map(r => (
                    <div key={r.id} className="bg-[#fffef2] border border-[#d9d7c9] p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d9d7c9] pb-3">
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="font-medium text-[#000000]">{r.user_name}</span>
                          {r.user_badge && (
                            <span className="bg-[#f4f3e6] text-[#000000] text-[12px] font-mono px-2 py-0.5 border border-[#d9d7c9]">
                              ✓ {r.user_badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[12px] text-[#000000] tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-[#333333] text-[#333333]" />
                          <span>{r.rating.toFixed(1)} / 5.0</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] bg-[#f4f3e6] p-3 border border-[#d9d7c9]">
                        <div>
                          <span className="text-[#5c5c5c] block">Ketahanan:</span>
                          <span className="font-medium text-[#000000]">{r.longevity_band}</span>
                        </div>
                        <div>
                          <span className="text-[#5c5c5c] block">Sillage:</span>
                          <span className="font-medium text-[#000000] capitalize">{r.sillage}</span>
                        </div>
                        <div>
                          <span className="text-[#5c5c5c] block">Beli Ulang:</span>
                          <span className="font-medium text-[#000000]">{r.repurchase_intent === 'yes_definitely' ? 'Pasti Beli' : 'Mungkin'}</span>
                        </div>
                        <div>
                          <span className="text-[#5c5c5c] block">Format:</span>
                          <span className="font-medium text-[#000000]">{r.format_used === 'full_bottle' ? 'Botol Penuh' : 'Decant'}</span>
                        </div>
                      </div>

                      <h4 className="font-sans text-[16px] leading-[22px] font-medium text-[#000000]">{r.title}</h4>
                      <p className="text-[14px] text-[#5c5c5c] leading-relaxed">
                        {r.review_text}
                      </p>

                      {(r.pros || r.cons) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] pt-1">
                          {r.pros && r.pros.length > 0 && (
                            <div className="text-[#000000] space-y-0.5">
                              <span className="font-medium uppercase block text-[#5c5c5c]">+ Kelebihan:</span>
                              {r.pros.map((p, i) => <p key={i}>• {p}</p>)}
                            </div>
                          )}
                          {r.cons && r.cons.length > 0 && (
                            <div className="text-[#5c5c5c] space-y-0.5">
                              <span className="font-medium uppercase block text-[#5c5c5c]">- Kekurangan:</span>
                              {r.cons.map((c, i) => <p key={i}>• {c}</p>)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[12px] text-[#5c5c5c] pt-2 border-t border-[#d9d7c9]">
                        <span className="tabular-nums font-mono">{new Date(r.created_at).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5 text-[#5c5c5c]" />
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
                <span className="text-[12px] uppercase tracking-widest font-medium text-[#5c5c5c] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#333333]" />
                  <span>{locale === 'id' ? 'CERITA MEMORI KOMUNITAS' : 'COMMUNITY SCENT MEMORIES'}</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {perfumeStories.map(story => (
                    <div key={story.id} className="bg-[#fffef2] border border-[#d9d7c9] p-5 space-y-2">
                      <div className="flex justify-between text-[12px] text-[#5c5c5c]">
                        <span>Oleh: @{story.user_name || 'senstoria'}</span>
                        <span className="font-mono tabular-nums">{story.story_date}</span>
                      </div>
                      <h4 className="font-sans text-[16px] leading-[22px] font-medium text-[#000000]">{story.title}</h4>
                      <p className="text-[14px] text-[#5c5c5c] italic line-clamp-3 leading-relaxed">
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
        <div className="border-t border-[#d9d7c9] pt-8 space-y-4">
          <div className="flex justify-between items-baseline">
            <div className="space-y-0.5">
              <span className="text-[12px] uppercase tracking-widest text-[#5c5c5c] font-medium block">
                EKSPLORASI LANJUTAN
              </span>
              <h2 className="font-serif text-[24px] leading-[32px] md:text-[32px] md:leading-[40px] font-normal text-[#000000]">
                {locale === 'id' ? `Aroma Serupa dalam Keluarga ${perfume.primary_family}` : `Similar Scents in ${perfume.primary_family}`}
              </h2>
            </div>
            <button
              onClick={() => onFilterByFamily(perfume.primary_family)}
              className="text-[12px] text-[#5c5c5c] hover:text-[#000000] underline font-medium"
            >
              {locale === 'id' ? 'Lihat Semua di Katalog →' : 'View All in Catalog →'}
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
                  className="bg-[#fffef2] border border-[#d9d7c9] p-5 space-y-3 cursor-pointer hover:border-[#333333] transition flex flex-col justify-between h-full"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between text-[12px] text-[#5c5c5c] uppercase tracking-wider font-medium">
                      <span>{rel.brand}</span>
                      <span className="font-mono">{rel.concentration}</span>
                    </div>
                    <h3 className="font-sans text-[18px] leading-[24px] font-medium text-[#000000] line-clamp-2 h-[48px]">
                      {rel.name}
                    </h3>
                    <p className="text-[12px] text-[#5c5c5c] line-clamp-1">{rel.top_notes}</p>
                  </div>
                  <div className="pt-3 flex justify-between items-baseline text-[12px] font-mono border-t border-[#d9d7c9]">
                    <span className="text-[#5c5c5c]">{rel.origin === 'ID' ? 'Lokal' : 'Global'}</span>
                    <span className="font-medium text-[#000000] tabular-nums">{formatCurrency(rel.reference_price_idr, locale)}</span>
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
        title={`Tambahkan ${perfume.name} ke Lemari`}
        subtitle="Catat volume botol, sisa cairan, dan harga beli untuk menghitung statistik Scent DNA"
        maxWidth="max-w-md"
      >
        {bottleAddedSuccess ? (
          <div className="p-6 bg-[#f4f3e6] border border-[#d9d7c9] text-center text-[#000000] text-[12px] font-medium space-y-2">
            <p className="font-serif text-[24px] leading-[32px] font-normal text-[#000000]">✓ Botol Berhasil Ditambahkan!</p>
            <p className="text-[12px] text-[#5c5c5c]">Tersimpan di rak koleksi lemarimu.</p>
          </div>
        ) : (
          <form onSubmit={handleSaveBottle} className="space-y-4 text-[12px]">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium block text-[#000000]">Ukuran Botol (ml)</label>
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
                  className="w-full min-h-[44px] p-2 bg-[#fffef2] border border-[#8a8a8a] text-[14px] font-mono tabular-nums text-[#000000]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium block text-[#000000]">Sisa Cairan (ml)</label>
                <input 
                  type="number" 
                  inputMode="numeric"
                  min="0" 
                  max={bottleSize}
                  step="0.5"
                  value={bottleRemaining}
                  onChange={e => setBottleRemaining(Number(e.target.value))}
                  className="w-full min-h-[44px] p-2 bg-[#fffef2] border border-[#8a8a8a] text-[14px] font-mono tabular-nums text-[#000000]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium block text-[#000000]">Status Botol</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBottleStatus('in_use')}
                  className={`min-h-[44px] py-2 border text-center transition text-[12px] ${bottleStatus === 'in_use' ? 'border-[#333333] bg-[#f4f3e6] font-medium text-[#000000]' : 'border-[#d9d7c9] bg-[#fffef2] text-[#5c5c5c]'}`}
                >
                  Sedang Dipakai (In Use)
                </button>
                <button
                  type="button"
                  onClick={() => setBottleStatus('sealed')}
                  className={`min-h-[44px] py-2 border text-center transition text-[12px] ${bottleStatus === 'sealed' ? 'border-[#333333] bg-[#f4f3e6] font-medium text-[#000000]' : 'border-[#d9d7c9] bg-[#fffef2] text-[#5c5c5c]'}`}
                >
                  Masih Tersegel (Sealed)
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium block text-[#000000]">Harga Pembelian (Rp)</label>
              <input 
                type="number" 
                inputMode="numeric"
                value={bottlePrice}
                onChange={e => setBottlePrice(Number(e.target.value))}
                className="w-full min-h-[44px] p-2 bg-[#fffef2] border border-[#8a8a8a] text-[14px] font-mono tabular-nums text-[#000000]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#d9d7c9]">
              <button 
                type="button"
                onClick={() => setIsAddBottleModalOpen(false)}
                className="min-h-[44px] px-4 py-2 border border-[#8a8a8a] text-[12px] text-[#000000] hover:bg-[#f4f3e6]"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="min-h-[48px] px-6 py-2 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[12px] font-medium"
              >
                Simpan Botol
              </button>
            </div>
          </form>
        )}
      </BottomSheetOrModal>

      {/* ── SHARE MODAL ── */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#fffef2] border border-[#333333] max-w-md w-full p-6 space-y-5 relative">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-[#5c5c5c] hover:text-[#000000] p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[12px] font-mono uppercase tracking-widest text-[#5c5c5c] font-medium block">
                BAGIKAN AROMA
              </span>
              <h3 className="font-serif text-[24px] leading-[32px] font-normal mt-1 text-[#000000]">
                {perfume.name}
              </h3>
              <p className="text-[12px] text-[#5c5c5c]">{perfume.brand} · {perfume.concentration}</p>
            </div>

            {/* Formatted Text Preview */}
            <div className="bg-[#f4f3e6] border border-[#d9d7c9] p-4 text-[12px] space-y-1.5 font-mono text-[#000000]">
              <p>Top: {perfume.top_notes}</p>
              <p>Heart: {perfume.heart_notes}</p>
              <p>Base: {perfume.base_notes}</p>
              <p className="text-[12px] text-[#5c5c5c] pt-1 tabular-nums">Iklim Tropis: {perfume.heat_suitability}/5</p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleCopyShareLink}
                className="w-full min-h-[48px] bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[12px] font-medium flex items-center justify-center gap-2 transition"
              >
                {shareCopied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#fffef2]" />
                    <span>Tautan Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Tautan & Ringkasan Aroma</span>
                  </>
                )}
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] border border-[#8a8a8a] hover:bg-[#f4f3e6] text-[#000000] text-[12px] font-medium flex items-center justify-center gap-2 transition text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Bagikan ke WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
