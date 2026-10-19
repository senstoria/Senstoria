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
  ThumbsUp
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale, formatCurrency } from '../lib/i18n.ts';
import { ReviewState, StoryState, computeReviewSummary } from '../lib/derivedCalculations.ts';

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
    <div className="space-y-10">
      
      {/* ── TOP BREADCRUMB & BACK ACTION ── */}
      <div className="flex items-center justify-between border-b border-[#D9D7C9] pb-4">
        <button 
          onClick={onBackToCatalog}
          className="text-xs font-semibold text-[#5C5C5C] hover:text-black flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{locale === 'id' ? 'Kembali ke Katalog' : 'Back to Catalog'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleWishlist}
            className={`px-3 py-1.5 border text-xs font-medium flex items-center gap-1.5 transition ${
              isWishlisted ? 'border-red-600 text-red-600 bg-red-50' : 'border-[#333333] hover:bg-[#F4F3E6]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
            <span>{isWishlisted ? 'Di Wishlist' : 'Tambah Wishlist'}</span>
          </button>

          <button
            onClick={onToggleCompare}
            className={`px-3 py-1.5 border text-xs font-medium flex items-center gap-1.5 transition ${
              isCompared ? 'bg-[#333333] text-white border-[#333333]' : 'border-[#333333] hover:bg-[#F4F3E6]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isCompared ? 'Dalam Komparasi' : 'Bandingkan'}</span>
          </button>
        </div>
      </div>

      {/* ── PRODUCT HERO SPLIT ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Visual Silhouette & Authenticity */}
        <div className="md:col-span-5 bg-[#F4F3E6] border border-[#D9D7C9] p-10 flex flex-col items-center justify-center space-y-6">
          <div className="w-48 h-64 bg-white/70 border border-[#D9D7C9] flex items-center justify-center relative shadow-xs">
            <svg width="100" height="150" viewBox="0 0 60 90" fill="none" stroke="#333333" strokeWidth="1.5">
              <rect x="22" y="5" width="16" height="12" />
              <rect x="26" y="2" width="8" height="3" />
              <rect x="8" y="17" width="44" height="68" rx="2" />
              <circle cx="30" cy="50" r="14" strokeDasharray="3 3" />
            </svg>
            <span className="absolute bottom-3 left-3 text-[10px] font-mono uppercase bg-white px-2 py-0.5 border border-[#D9D7C9]">
              {perfume.origin === 'ID' ? 'Lokal Indonesia' : 'Global / Internasional'}
            </span>
          </div>

          <div className="text-center space-y-1 w-full max-w-xs border-t border-[#D9D7C9] pt-4">
            <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Data Terverifikasi Senstoria</span>
            </div>
            <p className="text-[11px] text-[#5C5C5C]">
              Bebas promosi berbayar. Kami tidak menerima bayaran untuk mengubah skor atau peringkat wewangian ini.
            </p>
          </div>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Header Metadata */}
          <div className="border-b border-[#D9D7C9] pb-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#5C5C5C]">
              <button 
                onClick={() => onFilterByBrand(perfume.brand)}
                className="font-bold text-[#1A1A1A] uppercase tracking-wider hover:underline"
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
              <span className="font-mono">{perfume.release_year}</span>
              <span>·</span>
              <span className="border border-neutral-400 px-1.5 py-0.2 text-[10px] font-mono">
                Data contoh
              </span>
            </div>

            <h1 className="font-serif text-4xl font-normal">
              {perfume.name}
            </h1>
            <p className="font-mono text-sm text-[#5C5C5C]">
              {perfume.concentration} · {perfume.reference_price_size_ml} ml
            </p>

            <p className="text-sm text-[#5C5C5C] leading-relaxed pt-1">
              {locale === 'id' ? perfume.description_id : perfume.description_en}
            </p>
          </div>

          {/* Notes Pyramid (Top / Heart / Base) - CAT-05, CAT-06 */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold">
              Piramida Aroma (Notes Pyramid) — <span className="font-normal lowercase text-[#5C5C5C]">Klik note untuk mencari aroma serupa</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 border border-[#D9D7C9] space-y-1">
                <p className="text-[10px] uppercase font-bold text-[#5C5C5C]">Top Notes</p>
                <div className="flex flex-wrap gap-1">
                  {perfume.top_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        onClick={() => onFilterByNote(c)}
                        className="hover:underline hover:text-black font-medium"
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-3 border border-[#D9D7C9] space-y-1">
                <p className="text-[10px] uppercase font-bold text-[#5C5C5C]">Heart Notes</p>
                <div className="flex flex-wrap gap-1">
                  {perfume.heart_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        onClick={() => onFilterByNote(c)}
                        className="hover:underline hover:text-black font-medium"
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-3 border border-[#D9D7C9] space-y-1">
                <p className="text-[10px] uppercase font-bold text-[#5C5C5C]">Base Notes</p>
                <div className="flex flex-wrap gap-1">
                  {perfume.base_notes.split(',').map(n => {
                    const c = n.trim();
                    return (
                      <button
                        key={c}
                        onClick={() => onFilterByNote(c)}
                        className="hover:underline hover:text-black font-medium"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-y border-[#D9D7C9] py-4">
            <div>
              <span className="block text-[10px] uppercase text-[#5C5C5C] flex items-center gap-1">
                <Clock className="w-3 h-3" /> Daya Tahan
              </span>
              <span className="font-semibold text-sm mt-0.5 block">{perfume.longevity_expected_band}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-[#5C5C5C] flex items-center gap-1">
                <Wind className="w-3 h-3" /> Proyeksi / Sillage
              </span>
              <span className="font-semibold text-sm mt-0.5 block">Tingkat {perfume.projection_expected} / 4</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-[#5C5C5C] flex items-center gap-1">
                <Sun className="w-3 h-3" /> Iklim Tropis
              </span>
              <span className="font-semibold text-sm mt-0.5 block">Kesesuaian {perfume.heat_suitability} / 5</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-[#5C5C5C]">Harga Referensi</span>
              <span className="font-semibold text-sm font-mono mt-0.5 block">
                {formatCurrency(perfume.reference_price_idr, locale)}
              </span>
              <span className="text-[10px] text-[#5C5C5C] block">Per {perfume.reference_price_size_ml}ml</span>
              <span className="text-[10px] text-emerald-800 font-bold block mt-0.5 font-mono">
                {formatCurrency(Math.round(perfume.reference_price_idr / perfume.reference_price_size_ml), locale)} / ml
              </span>
            </div>
          </div>

          {/* ── CAT-10: WHAT REAL WEARERS SAY VS BRAND CLAIMS ── */}
          <div className="space-y-3 bg-[#F4F3E6] p-5 border border-[#D9D7C9]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A1A]">
              Ulasan Pemakai Nyata vs Klaim Resmi Brand (CAT-10)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3.5 border border-[#D9D7C9] space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#8A4B14] block">
                  Klaim Resmi Brand
                </span>
                <p className="text-xs text-[#5C5C5C] italic">
                  "{perfume.brand_claims}"
                </p>
                <span className="text-[10px] text-[#5C5C5C] block">Sumber: Materi peluncuran resmi brand</span>
              </div>

              <div className="bg-white p-3.5 border border-[#D9D7C9] space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-800 block">
                  Data Pemakai Komunitas Senstoria
                </span>
                <p className="text-xs font-semibold">
                  {perfume.rating_seed_count} ulasan diverifikasi ({perfume.rating_seed} ★)
                </p>
                <div className="text-[11px] text-[#5C5C5C] space-y-0.5">
                  <p>• Ketahanan nyata kulit: {perfume.longevity_expected_band}</p>
                  <p>• 88% pemakai menyatakan aroma sesuai deskripsi</p>
                  <p>• 74% bersedia membeli botol penuh kembali</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── TROPICAL CLIMATE WEAR GUIDE (INDONESIA) ── */}
          <div className="border border-[#D9D7C9] bg-white p-4 space-y-2 text-xs">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#5C5C5C] flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>Panduan Pemakaian di Iklim Tropis Indonesia</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px] text-[#5C5C5C]">
              <div className="p-2.5 bg-[#F4F3E6]/60 border border-[#D9D7C9]/60 space-y-1">
                <p className="font-bold text-[#1A1A1A]">Outdoor / Siang Hari</p>
                <p>Gunakan 2–3 semprotan di titik nadi dada atau tengkuk agar tidak terlalu pekat saat berkeringat.</p>
              </div>
              <div className="p-2.5 bg-[#F4F3E6]/60 border border-[#D9D7C9]/60 space-y-1">
                <p className="font-bold text-[#1A1A1A]">Ruang Ber-AC / Kantor</p>
                <p>Sillage ramah ruang tertutup, aroma bertahan lembut 6–8 jam tanpa mendistraksi rekan kerja.</p>
              </div>
              <div className="p-2.5 bg-[#F4F3E6]/60 border border-[#D9D7C9]/60 space-y-1">
                <p className="font-bold text-[#1A1A1A]">Malam & Cuaca Hujan</p>
                <p>Notes dasar kayu & rempah lebih kaya dan hangat, semprotkan pada pakaian katun untuk ketahanan ekstra.</p>
              </div>
            </div>
          </div>

          {/* ── AFFILIATE OUTBOUND BUTTONS & DISCLOSURE (AFF-01, AFF-03, AFF-05) ── */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold">
              Beli Resmi Melalui Rekanan Marketplace Terpercaya:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a 
                href={`/go/${perfume.id}?platform=shopee&src=product_detail`}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="h-12 bg-[#333333] hover:bg-black text-[#FFFEF2] flex items-center justify-center gap-2 font-medium text-xs transition"
              >
                <span>Beli di Shopee Mall</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a 
                href={`/go/${perfume.id}?platform=tokopedia&src=product_detail`}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="h-12 border border-[#333333] hover:bg-[#F4F3E6] text-[#1A1A1A] flex items-center justify-center gap-2 font-medium text-xs transition"
              >
                <span>Beli di Tokopedia Official</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Secondary Action Row: Add to Library & Try It First */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setIsAddBottleModalOpen(true)}
                className="py-2.5 border border-[#333333] hover:bg-[#F4F3E6] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambahkan ke Lemariku</span>
              </button>

              <button
                onClick={onOpenTryItFirst}
                className="py-2.5 bg-[#F4F3E6] border border-[#D9D7C9] text-xs font-medium hover:bg-neutral-200 transition"
              >
                Coba Dulu (Daftar Tunggu Sampel)
              </button>
            </div>

            <p className="text-[11px] text-[#5C5C5C] italic leading-relaxed pt-1">
              Kami dapat memperoleh komisi jika kamu membeli melalui tautan di atas. Hal ini tidak memengaruhi skor kecocokan atau posisi rekomendasi kami.
            </p>
          </div>

        </div>
      </div>

      {/* ── COMMUNITY REVIEWS & SCENT STORIES SECTION (Phase 4) ── */}
      {(() => {
        const perfumeReviews = reviews.filter(r => r.perfume_id === perfume.id);
        const perfumeStories = stories.filter(s => s.perfume_id === perfume.id && s.status === 'published');
        const reviewSummary = computeReviewSummary(perfumeReviews);

        return (
          <div className="border-t border-[#D9D7C9] pt-8 space-y-6">
            
            {/* Header & Overall Summary */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D9D7C9] pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A4B14] font-bold">
                  {locale === 'id' ? 'Evaluasi Komunitas Independen (Phase 4)' : 'Community Evaluation (Phase 4)'}
                </span>
                <h3 className="font-serif text-3xl font-normal">
                  {locale === 'id' ? 'Ulasan Multi-Kriteria & Cerita Aroma' : 'Community Reviews & Scent Stories'}
                </h3>
                <p className="text-xs text-[#5C5C5C]">
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
                    className="px-3.5 py-2 bg-[#F4F3E6] hover:bg-neutral-200 border border-[#D9D7C9] text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#8A4B14]" />
                    <span>{locale === 'id' ? 'Tulis Cerita' : 'Write Story'}</span>
                  </button>
                )}

                {onOpenReviewModal && (
                  <button
                    onClick={() => onOpenReviewModal(perfume.id)}
                    className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>{locale === 'id' ? 'Tulis Ulasan Parfum Ini' : 'Write Review'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scorecard Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FFFEF2] border border-[#D9D7C9] p-4 text-xs">
              
              {/* Average Rating */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#5C5C5C] block">
                  {locale === 'id' ? 'Rata-Rata Komunitas' : 'Average Rating'}
                </span>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="font-serif text-2xl font-bold">
                    {perfumeReviews.length > 0 ? reviewSummary.averageRating.toFixed(1) : perfume.rating_seed}
                  </span>
                  <span className="text-[#5C5C5C] font-mono text-[11px]">
                    ({perfumeReviews.length > 0 ? perfumeReviews.length : perfume.rating_seed_count} ulasan)
                  </span>
                </div>
              </div>

              {/* Longevity Consensus */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#5C5C5C] block">
                  {locale === 'id' ? 'Ketahanan Nyata Kulit' : 'Skin Longevity'}
                </span>
                <p className="font-semibold text-neutral-900">
                  {perfumeReviews.length > 0 ? reviewSummary.longevityDominantBand : perfume.longevity_expected_band}
                </p>
                <span className="text-[10px] text-[#5C5C5C] block">
                  {locale === 'id' ? 'Konsensus iklim tropis' : 'Tropical climate consensus'}
                </span>
              </div>

              {/* Sillage Projection */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#5C5C5C] block">
                  {locale === 'id' ? 'Jejak Aroma (Sillage)' : 'Sillage Projection'}
                </span>
                <p className="font-semibold text-neutral-900 capitalize">
                  {perfumeReviews.length > 0 ? reviewSummary.sillageDominant : 'Moderate (Radius Lengan)'}
                </p>
                <span className="text-[10px] text-[#5C5C5C] block">
                  {locale === 'id' ? 'Ramah ruang tertutup / AC' : 'Office & indoor friendly'}
                </span>
              </div>

              {/* Repurchase Rate */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#5C5C5C] block">
                  {locale === 'id' ? 'Niat Beli Ulang' : 'Repurchase Rate'}
                </span>
                <p className="font-semibold text-emerald-800">
                  {perfumeReviews.length > 0 ? `${reviewSummary.repurchaseYesRatePct}% Pasti Beli Lagi` : '82% Pasti Beli Lagi'}
                </p>
                <span className="text-[10px] text-[#5C5C5C] block">
                  {locale === 'id' ? 'Tingkat kepuasan tinggi' : 'High satisfaction rate'}
                </span>
              </div>

            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-[#5C5C5C]">
                {locale === 'id' ? `Ulasan Pengguna (${perfumeReviews.length})` : `User Reviews (${perfumeReviews.length})`}
              </h4>

              {perfumeReviews.length === 0 ? (
                <div className="p-6 bg-white border border-[#D9D7C9] text-center space-y-2">
                  <p className="text-xs text-[#5C5C5C]">
                    {locale === 'id'
                      ? 'Belum ada ulasan terperinci untuk wewangian ini. Jadilah yang pertama memberikan ulasan!'
                      : 'No detailed reviews yet. Be the first to share your wear experience!'}
                  </p>
                  {onOpenReviewModal && (
                    <button
                      onClick={() => onOpenReviewModal(perfume.id)}
                      className="px-4 py-2 bg-[#1A1A1A] text-[#FFFEF2] text-xs font-semibold"
                    >
                      {locale === 'id' ? 'Tulis Ulasan Pertama' : 'Write First Review'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {perfumeReviews.map(r => (
                    <div key={r.id} className="bg-white border border-[#D9D7C9] p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9D7C9]/60 pb-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold">{r.user_name}</span>
                          {r.user_badge && (
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono px-1.5 py-0.2 border border-emerald-200">
                              ✓ {r.user_badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{r.rating.toFixed(1)} / 5.0</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-[#F4F3E6]/60 p-2 border border-[#D9D7C9]/60">
                        <div>
                          <span className="text-[#5C5C5C] block">Ketahanan:</span>
                          <span className="font-semibold">{r.longevity_band}</span>
                        </div>
                        <div>
                          <span className="text-[#5C5C5C] block">Sillage:</span>
                          <span className="font-semibold capitalize">{r.sillage}</span>
                        </div>
                        <div>
                          <span className="text-[#5C5C5C] block">Beli Ulang:</span>
                          <span className="font-semibold">{r.repurchase_intent === 'yes_definitely' ? 'Pasti Beli' : 'Mungkin'}</span>
                        </div>
                        <div>
                          <span className="text-[#5C5C5C] block">Format:</span>
                          <span className="font-semibold">{r.format_used === 'full_bottle' ? 'Botol Penuh' : 'Decant'}</span>
                        </div>
                      </div>

                      <h5 className="font-serif text-sm font-bold">{r.title}</h5>
                      <p className="text-xs text-[#333333] leading-relaxed">
                        {r.review_text}
                      </p>

                      {(r.pros || r.cons) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                          {r.pros && r.pros.length > 0 && (
                            <div className="text-emerald-800 space-y-0.5">
                              <span className="font-bold text-[10px] uppercase block">+ Kelebihan:</span>
                              {r.pros.map((p, i) => <p key={i}>• {p}</p>)}
                            </div>
                          )}
                          {r.cons && r.cons.length > 0 && (
                            <div className="text-rose-800 space-y-0.5">
                              <span className="font-bold text-[10px] uppercase block">- Kekurangan:</span>
                              {r.cons.map((c, i) => <p key={i}>• {c}</p>)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px] text-[#5C5C5C] pt-2 border-t border-[#D9D7C9]/60">
                        <span>{new Date(r.created_at).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-[#8A4B14]" />
                          <span>{r.helpful_count || 8} orang terbantu</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scent Stories Excerpt for this Fragrance */}
            {perfumeStories.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#5C5C5C] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#8A4B14]" />
                  <span>{locale === 'id' ? 'Cerita Memori Komunitas' : 'Community Scent Memories'}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perfumeStories.map(story => (
                    <div key={story.id} className="bg-white border border-[#D9D7C9] p-4 space-y-2">
                      <div className="flex justify-between text-[10px] text-[#5C5C5C]">
                        <span>Oleh: @{story.user_name || 'senstoria'}</span>
                        <span className="font-mono">{story.story_date}</span>
                      </div>
                      <h5 className="font-serif font-bold text-sm">{story.title}</h5>
                      <p className="text-xs text-[#5C5C5C] italic line-clamp-3 leading-relaxed">
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

      {/* ── RELATED FRAGRANCES IN SAME FAMILY (CAT-06) ── */}
      {allPerfumes && onSelectPerfume && (
        <div className="border-t border-[#D9D7C9] pt-8 space-y-4">
          <div className="flex justify-between items-baseline">
            <h3 className="font-serif text-2xl font-normal">
              {locale === 'id' ? `Aroma Serupa dalam Keluarga ${perfume.primary_family}` : `Similar Scents in ${perfume.primary_family}`}
            </h3>
            <button
              onClick={() => onFilterByFamily(perfume.primary_family)}
              className="text-xs text-[#8A4B14] hover:underline font-semibold"
            >
              {locale === 'id' ? 'Lihat Semua di Katalog →' : 'View All in Catalog →'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {allPerfumes
              .filter(p => p.id !== perfume.id && p.primary_family === perfume.primary_family)
              .slice(0, 3)
              .map(rel => (
                <div
                  key={rel.id}
                  onClick={() => onSelectPerfume(rel.id)}
                  className="bg-white border border-[#D9D7C9] p-4 space-y-2 cursor-pointer hover:border-black transition"
                >
                  <div className="flex justify-between text-[10px] text-[#5C5C5C] uppercase tracking-wider font-semibold">
                    <span>{rel.brand}</span>
                    <span className="font-mono">{rel.concentration}</span>
                  </div>
                  <h4 className="font-serif text-lg font-bold">{rel.name}</h4>
                  <p className="text-xs text-[#5C5C5C] line-clamp-1">{rel.top_notes}</p>
                  <div className="pt-2 flex justify-between items-baseline text-xs font-mono border-t border-[#D9D7C9]/60">
                    <span className="text-[#5C5C5C]">{rel.origin === 'ID' ? 'Lokal' : 'Global'}</span>
                    <span className="font-bold">{formatCurrency(rel.reference_price_idr, locale)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── ADD BOTTLE TO LIBRARY MODAL (CAB-04) ── */}
      {isAddBottleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFEF2] border border-[#333333] max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <h3 className="font-serif text-2xl font-bold">
              Tambahkan {perfume.name} ke Lemari
            </h3>
            <p className="text-xs text-[#5C5C5C]">
              Catat volume botol, sisa cairan, dan harga beli untuk menghitung statistik Scent DNA dan nilai koleksimu.
            </p>

            {bottleAddedSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-center text-emerald-800 text-xs font-semibold">
                ✓ Botol berhasil ditambahkan ke lemari koleksimu!
              </div>
            ) : (
              <form onSubmit={handleSaveBottle} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold block">Ukuran Botol (ml)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="1000"
                      value={bottleSize}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setBottleSize(val);
                        if (bottleRemaining > val) setBottleRemaining(val);
                      }}
                      className="w-full p-2 bg-white border border-[#333333] text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold block">Sisa Cairan Saat Ini (ml)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max={bottleSize}
                      step="0.5"
                      value={bottleRemaining}
                      onChange={e => setBottleRemaining(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-[#333333] text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Status Botol</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBottleStatus('in_use')}
                      className={`py-2 border text-center transition ${bottleStatus === 'in_use' ? 'border-2 border-black bg-[#F4F3E6] font-bold' : 'border-[#D9D7C9] bg-white'}`}
                    >
                      Sedang Dipakai (In Use)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBottleStatus('sealed')}
                      className={`py-2 border text-center transition ${bottleStatus === 'sealed' ? 'border-2 border-black bg-[#F4F3E6] font-bold' : 'border-[#D9D7C9] bg-white'}`}
                    >
                      Masih Tersegel (Sealed)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Harga Pembelian (Rp)</label>
                  <input 
                    type="number" 
                    value={bottlePrice}
                    onChange={e => setBottlePrice(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#333333] text-sm font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddBottleModalOpen(false)}
                    className="px-4 py-2 border border-[#333333] text-xs hover:bg-[#F4F3E6]"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-[#333333] hover:bg-black text-[#FFFEF2] text-xs font-semibold"
                  >
                    Simpan Botol
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
