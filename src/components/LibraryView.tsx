import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Droplet, 
  Sparkles, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Check, 
  AlertTriangle, 
  Search, 
  Archive, 
  X,
  Layers,
  ChevronRight,
  Sun,
  Wind,
  Clock,
  Info,
  RotateCcw,
  BookOpen,
  Award,
  Compass,
  Star
} from 'lucide-react';
import { 
  BottleState, 
  calculateRemainingPercentage, 
  isLowBottle, 
  computeCollectionSummary, 
  computeScentDna,
  computeSharedBottleStats,
  WearState,
  ScentStoryState,
  ReviewState
} from '../lib/derivedCalculations.ts';
import { SeedPerfume, SEED_PERFUMES } from '../data/seedPerfumes.ts';
import { Locale, formatCurrency, translations } from '../lib/i18n.ts';
import { 
  ScentDnaVisualisation, 
  countProfilePerfumes, 
  extractRankedTopNotes 
} from './ScentDnaVisualisation.tsx';

const ScentDnaRadarChart = React.lazy(() => import('./ScentDnaRadarChart.tsx'));
import { computeUserAchievements, AchievementBadge } from '../lib/achievements.ts';
import { recommendPerfumesByScentDna } from '../lib/scentDnaRecommendations.ts';
import { AchievementBadges } from './AchievementBadges.tsx';
import { usePrefersReducedMotion } from '../lib/motion.ts';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { EmptyState } from './EmptyState.tsx';
import { Bottle } from './Bottle.tsx';

export type ShelfTab = 'wearing' | 'wishlist' | 'favorites' | 'memories' | 'dna';

interface LibraryViewProps {
  bottles: BottleState[];
  wishlistIds: string[];
  perfumes: SeedPerfume[];
  onLogWear: (bottleId: string) => void;
  onSelectPerfume: (id: string) => void;
  onOpenTryItFirst: (id: string) => void;
  onAddBottle: (bottleData: Omit<BottleState, 'id'>, customPerfume?: Partial<SeedPerfume>) => void;
  onUpdateBottle: (bottleId: string, updates: Partial<BottleState>) => void;
  onDeleteBottle: (bottleId: string) => void;
  onRemoveWishlist: (perfumeId: string) => void;
  onNavigateToDiary?: () => void;
  onNavigateToCatalog?: () => void;
  wearLogs?: WearState[];
  stories?: ScentStoryState[];
  reviews?: ReviewState[];
  locale: Locale;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  bottles,
  wishlistIds,
  perfumes,
  onLogWear,
  onSelectPerfume,
  onOpenTryItFirst,
  onAddBottle,
  onUpdateBottle,
  onDeleteBottle,
  onRemoveWishlist,
  onNavigateToDiary,
  onNavigateToCatalog,
  wearLogs = [],
  stories = [],
  reviews = [],
  locale
}) => {
  const t = translations[locale];
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeTab, setActiveTab] = useState<ShelfTab>('wearing');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'catalog' | 'custom'>('catalog');
  const [removingWishlistId, setRemovingWishlistId] = useState<string | null>(null);

  const handleRemoveWishlistWithFade = (perfumeId: string) => {
    if (prefersReducedMotion) {
      onRemoveWishlist(perfumeId);
    } else {
      setRemovingWishlistId(perfumeId);
      setTimeout(() => {
        onRemoveWishlist(perfumeId);
        setRemovingWishlistId(null);
      }, 180);
    }
  };

  // Add bottle form states
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(perfumes[0]?.id || '');
  const [bottleSize, setBottleSize] = useState<number>(50);
  const [bottleRemaining, setBottleRemaining] = useState<number>(50);
  const [bottleStatus, setBottleStatus] = useState<'in_use' | 'sealed'>('in_use');
  const [bottlePrice, setBottlePrice] = useState<number>(350000);
  const [bottleIsFavorite, setBottleIsFavorite] = useState<boolean>(false);

  // Custom perfume form states
  const [customBrand, setCustomBrand] = useState('');
  const [customName, setCustomName] = useState('');
  const [customConcentration, setCustomConcentration] = useState<'EDP' | 'EDT' | 'Extrait' | 'EDC'>('EDP');
  const [customFamily, setCustomFamily] = useState('Woody');
  const [customTopNotes, setCustomTopNotes] = useState('');

  // Edit bottle modal state
  const [editingBottle, setEditingBottle] = useState<BottleState | null>(null);
  const [editRemainingMl, setEditRemainingMl] = useState<number>(0);
  const [editIsFavorite, setEditIsFavorite] = useState<boolean>(false);

  // Derived Single Source of Truth
  const summary = computeCollectionSummary(bottles);
  const sharedBottleStats = useMemo(() => computeSharedBottleStats(bottles, perfumes), [bottles, perfumes]);
  const scentDna = sharedBottleStats.scentDna;
  const profilePerfumesCount = useMemo(() => countProfilePerfumes(bottles), [bottles]);
  const rankedTopNotes = useMemo(() => extractRankedTopNotes(bottles, perfumes, 8), [bottles, perfumes]);

  // Active Shelves filtering
  const currentlyWearingBottles = bottles.filter(b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed'));
  const favoriteBottles = bottles.filter(b => !b.deleted_at && b.is_favorite && b.status !== 'finished');
  const memoryBottles = bottles.filter(b => !b.deleted_at && b.status === 'finished');
  const wishlistPerfumes = wishlistIds
    .map(id => perfumes.find(p => p.id === id))
    .filter((p): p is SeedPerfume => Boolean(p));

  // Catalog suggestions based on user's Scent DNA
  const dnaRecommendedPerfumes = useMemo(() => {
    const ownedIds = new Set(bottles.filter(b => !b.deleted_at).map(b => b.perfume_id));
    return perfumes
      .filter(p => !ownedIds.has(p.id))
      .filter(p => p.primary_family.toLowerCase() === scentDna.dominantFamily.toLowerCase() || 
                   scentDna.topNotes.some(n => (p.top_notes + ' ' + p.heart_notes).toLowerCase().includes(n.note.toLowerCase())))
      .slice(0, 3);
  }, [bottles, perfumes, scentDna]);

  // Duplicate detection for custom perfume ("Did you mean...?")
  const detectedCatalogDuplicate = useMemo(() => {
    if (!customName.trim() || customName.length < 3) return null;
    const query = customName.toLowerCase().trim();
    return perfumes.find(p => 
      p.name.toLowerCase().includes(query) || 
      query.includes(p.name.toLowerCase()) ||
      (customBrand && p.brand.toLowerCase().includes(customBrand.toLowerCase()) && p.name.toLowerCase().includes(query))
    );
  }, [customName, customBrand, perfumes]);

  // Filter catalog selection options for Add Modal
  const filteredCatalogOptions = useMemo(() => {
    if (!catalogSearch.trim()) return perfumes.slice(0, 10);
    const q = catalogSearch.toLowerCase().trim();
    return perfumes.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }, [perfumes, catalogSearch]);

  const handleSelectCatalogPerfume = (p: SeedPerfume) => {
    setSelectedCatalogId(p.id);
    setBottleSize(p.reference_price_size_ml || 50);
    setBottleRemaining(p.reference_price_size_ml || 50);
    setBottlePrice(p.reference_price_idr || 350000);
  };

  const handleSaveAddBottle = (e: React.FormEvent) => {
    e.preventDefault();
    if (addMode === 'catalog') {
      const selectedP = perfumes.find(p => p.id === selectedCatalogId) || perfumes[0];
      onAddBottle({
        perfume_id: selectedP.id,
        status: bottleStatus,
        format: bottleSize <= 10 ? 'decant' : 'full',
        size_ml: Number(bottleSize),
        remaining_ml: Number(bottleRemaining),
        ml_per_wear: 0.5,
        price_idr: Number(bottlePrice),
        times_worn: 0,
        is_favorite: bottleIsFavorite
      });
    } else {
      // Manual custom perfume
      const generatedId = 'custom_' + Math.random().toString(36).substring(2, 8);
      const customPerfumeObj: Partial<SeedPerfume> = {
        id: generatedId,
        slug: `${customBrand.toLowerCase().replace(/\s+/g, '-')}-${customName.toLowerCase().replace(/\s+/g, '-')}`,
        name: customName || 'Custom Fragrance',
        brand: customBrand || 'Private / Bespoke',
        concentration: customConcentration,
        primary_family: customFamily,
        top_notes: customTopNotes || 'Citrus, Woods',
        heart_notes: 'Spices, Florals',
        base_notes: 'Musk, Amber',
        origin: 'ID',
        reference_price_idr: Number(bottlePrice),
        reference_price_size_ml: Number(bottleSize),
        heat_suitability: 4
      };

      onAddBottle({
        perfume_id: generatedId,
        status: bottleStatus,
        format: bottleSize <= 10 ? 'decant' : 'full',
        size_ml: Number(bottleSize),
        remaining_ml: Number(bottleRemaining),
        ml_per_wear: 0.5,
        price_idr: Number(bottlePrice),
        times_worn: 0,
        is_favorite: bottleIsFavorite
      }, customPerfumeObj);
    }

    setIsAddModalOpen(false);
    // Reset inputs
    setCatalogSearch('');
    setCustomBrand('');
    setCustomName('');
    setCustomTopNotes('');
  };

  const handleOpenEdit = (bottle: BottleState) => {
    setEditingBottle(bottle);
    setEditRemainingMl(bottle.remaining_ml);
    setEditIsFavorite(Boolean(bottle.is_favorite));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBottle) return;

    const newRemaining = Number(editRemainingMl);
    const newStatus = newRemaining === 0 ? 'finished' : editingBottle.status;

    onUpdateBottle(editingBottle.id, {
      remaining_ml: newRemaining,
      is_favorite: editIsFavorite,
      status: newStatus
    });

    setEditingBottle(null);
  };

  const handleMarkAsFinished = (bottle: BottleState) => {
    onUpdateBottle(bottle.id, {
      status: 'finished',
      remaining_ml: 0
    });
  };

  return (
    <div className="space-y-8">
      
      {/* ── TOP SHELF BANNER & HEADER (Standardized Pattern) ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d9d7c9] pb-4">
        <div className="space-y-1">
          <span className="text-[12px] uppercase tracking-widest text-[#5c5c5c] font-medium block">
            {locale === 'id' ? 'KOLEKSI PRIBADI' : 'PERSONAL SHELF & WARDROBE'}
          </span>
          <h2 className="font-serif text-[24px] leading-[32px] md:text-[32px] md:leading-[40px] text-[#000000] font-normal">
            {locale === 'id' ? 'Lemari Wewangian & Scent DNA' : 'Fragrance Library & Scent DNA'}
          </h2>
          <p className="text-[14px] leading-[20px] text-[#5c5c5c] font-mono">
            {summary.currentlyWearingCount} {locale === 'id' ? 'botol aktif' : 'active bottles'} · {summary.favoritesCount} {locale === 'id' ? 'favorit' : 'favorites'} · {locale === 'id' ? 'Valuasi Koleksi' : 'Total Value'}: {formatCurrency(summary.totalCollectionValueIdr, locale)}
          </p>
        </div>

        {/* Action: Add bottle to shelf */}
        <button
          type="button"
          onClick={() => {
            setAddMode('catalog');
            setIsAddModalOpen(true);
          }}
          className="min-h-[44px] px-4 py-2 bg-[#333333] hover:bg-black text-[#fffef2] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{locale === 'id' ? 'Tambah Botol ke Lemari' : 'Add Bottle to Shelf'}</span>
        </button>
      </div>

      {/* ── 4 RAK (FOUR SHELVES) + SCENT DNA NAVIGATION TABS (Sticky & thumb-friendly) ── */}
      <div className="sticky top-0 z-20 bg-[#fffef2]/95 backdrop-blur-xs py-2 border-b border-[#d9d7c9] flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        
        {/* Rak 1: Sedang Dipakai (In Use) */}
        <button
          type="button"
          onClick={() => setActiveTab('wearing')}
          className={`min-h-[44px] px-4 py-2.5 whitespace-nowrap transition font-medium flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
            activeTab === 'wearing'
              ? 'bg-[#333333] text-[#fffef2]'
              : 'bg-white border border-[#d9d7c9] text-[#5c5c5c] hover:border-black hover:text-black'
          }`}
        >
          <span>{locale === 'id' ? 'Sedang Dipakai' : 'Currently Wearing'}</span>
          <span className="font-mono text-[12px] opacity-80">({currentlyWearingBottles.length})</span>
        </button>

        {/* Rak 2: Ingin Dicoba (Wishlist) */}
        <button
          type="button"
          onClick={() => setActiveTab('wishlist')}
          className={`min-h-[44px] px-4 py-2.5 whitespace-nowrap transition font-medium flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
            activeTab === 'wishlist'
              ? 'bg-[#333333] text-[#fffef2]'
              : 'bg-white border border-[#d9d7c9] text-[#5c5c5c] hover:border-black hover:text-black'
          }`}
        >
          <span>{locale === 'id' ? 'Ingin Dicoba (Wishlist)' : 'Want to Try'}</span>
          <span className="font-mono text-[12px] opacity-80">({wishlistPerfumes.length})</span>
        </button>

        {/* Rak 3: Favorit */}
        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`min-h-[44px] px-4 py-2.5 whitespace-nowrap transition font-medium flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
            activeTab === 'favorites'
              ? 'bg-[#333333] text-[#fffef2]'
              : 'bg-white border border-[#d9d7c9] text-[#5c5c5c] hover:border-black hover:text-black'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>{locale === 'id' ? 'Favorit' : 'Favorites'}</span>
          <span className="font-mono text-[12px] opacity-80">({favoriteBottles.length})</span>
        </button>

        {/* Rak 4: Kenangan (Finished & Memories) */}
        <button
          type="button"
          onClick={() => setActiveTab('memories')}
          className={`min-h-[44px] px-4 py-2.5 whitespace-nowrap transition font-medium flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
            activeTab === 'memories'
              ? 'bg-[#333333] text-[#fffef2]'
              : 'bg-white border border-[#d9d7c9] text-[#5c5c5c] hover:border-black hover:text-black'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>{locale === 'id' ? 'Kenangan & Botol Habis' : 'Memories & Empties'}</span>
          <span className="font-mono text-[12px] opacity-80">({memoryBottles.length})</span>
        </button>

        {/* Dashboard: Scent DNA */}
        <button
          onClick={() => setActiveTab('dna')}
          className={`min-h-[44px] px-4 py-2.5 whitespace-nowrap transition font-medium flex items-center gap-2 active:scale-[0.98] cursor-pointer ${
            activeTab === 'dna'
              ? 'bg-[#333333] text-[#fffef2]'
              : 'bg-white border border-[#d9d7c9] text-[#5c5c5c] hover:border-black hover:text-black'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{locale === 'id' ? 'Dashboard Scent DNA' : 'Scent DNA Analysis'}</span>
        </button>

      </div>

      {/* Cross-fade wrapper for active tab changes */}
      <div key={activeTab} className="animate-screen-enter">
      {/* ══════════════ TAB 1: SEDANG DIPAKAI (CURRENTLY WEARING) ══════════════ */}
      {activeTab === 'wearing' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-baseline gap-2">
            <p className="text-xs text-[#5C5C5C]">
              {locale === 'id' 
                ? 'Botol aktif yang saat ini tersedia di meja rias atau lemari aromamu. Klik "Catat Semprot" untuk melacak pengurangan volume secara otomatis.' 
                : 'Active bottles in your current fragrance rotation. Tap "Log Wear" to automatically track bottle level depletion.'}
            </p>
            {onNavigateToDiary && (
              <button
                onClick={onNavigateToDiary}
                className="text-xs text-[#8A4B14] hover:underline font-semibold flex items-center gap-1 shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{locale === 'id' ? 'Buka Buku Harian & Cerita →' : 'Open Scent Diary & Journal →'}</span>
              </button>
            )}
          </div>

          {currentlyWearingBottles.length === 0 ? (
            <EmptyState
              title={t.emptyStates.libraryWearingTitle}
              body={t.emptyStates.libraryWearingBody}
              ctaLabel={t.emptyStates.libraryWearingCta}
              onCtaClick={() => onNavigateToCatalog ? onNavigateToCatalog() : setIsAddModalOpen(true)}
              iconType="shelf"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-stretch">
              {currentlyWearingBottles.map((bottle, idx) => {
                const perfume = perfumes.find(p => p.id === bottle.perfume_id) || {
                  id: bottle.perfume_id,
                  name: 'Custom Fragrance',
                  brand: 'Private Perfume',
                  concentration: 'EDP' as const,
                  top_notes: 'Custom notes',
                  primary_family: 'Bespoke',
                  reference_price_idr: bottle.price_idr || 0,
                  reference_price_size_ml: bottle.size_ml
                };

                const rawPct = calculateRemainingPercentage(bottle);
                const percentage = rawPct ?? 0;
                const low = isLowBottle(bottle);

                return (
                  <div 
                    key={`${activeTab}-${bottle.id}`} 
                    className="bg-white p-5 border border-[#d9d7c9] flex flex-col justify-between h-full space-y-4 hover:border-black transition-colors animate-card-enter"
                    style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                  >
                    {/* Top Thumbnail & Action Badges */}
                    <div className="space-y-3">
                      <div 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="h-56 bg-[#f4f3e6] border border-[#d9d7c9] flex items-center justify-center relative cursor-pointer group p-4"
                      >
                        <Bottle
                          fragranceId={perfume.id}
                          name={perfume.name}
                          brand={perfume.brand}
                          size="md"
                          showFill={true}
                          fillPercentage={rawPct ?? undefined}
                        />

                        {/* Favorite button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBottle(bottle.id, { is_favorite: !bottle.is_favorite });
                          }}
                          className="absolute top-2 right-2 p-2 bg-white border border-[#d9d7c9] hover:bg-[#f4f3e6] text-[#333333] transition toggle-icon cursor-pointer active:scale-95"
                          title="Toggle Favorite"
                          aria-label="Simpan ke favorit"
                        >
                          <Heart className={`w-3.5 h-3.5 ${bottle.is_favorite ? 'fill-[#333333] text-[#333333]' : 'text-[#5c5c5c]'}`} />
                        </button>

                        {/* Calm Low Bottle Alert Tag */}
                        {low && (
                          <span className="absolute top-2 left-2 text-[12px] font-mono font-medium border border-[#333333] bg-white text-[#000000] px-2 py-0.5">
                            {locale === 'id' ? 'Menipis (≤20%)' : 'Low (≤20%)'}
                          </span>
                        )}

                        <span className="absolute bottom-2 left-2 text-[12px] font-mono px-2 py-0.5 bg-white border border-[#d9d7c9] text-[#5c5c5c]">
                          {bottle.times_worn || 0}x {locale === 'id' ? 'dipakai' : 'worn'}
                        </span>
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex justify-between items-baseline text-xs text-[#5c5c5c]">
                          <span className="font-semibold uppercase tracking-wider">{perfume.brand}</span>
                          <span className="font-mono text-xs">{perfume.concentration}</span>
                        </div>

                        <h3 
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="text-[18px] leading-[24px] font-medium text-[#000000] mt-1 cursor-pointer hover:underline line-clamp-2 h-[48px]"
                        >
                          {perfume.name}
                        </h3>

                        <p className="text-[14px] leading-[20px] text-[#5c5c5c] mt-1 line-clamp-1">
                          {perfume.top_notes}
                        </p>
                      </div>

                      {/* Fill Level Progress Bar (BR-02 & Calm Motion: 200ms transform scaleX) */}
                      <div className="space-y-1.5 pt-2 border-t border-[#d9d7c9]">
                        <div className="w-full bg-[#f4f3e6] border border-[#d9d7c9] h-2 overflow-hidden">
                          <div 
                            className="h-full w-full origin-left transition-transform duration-200 ease-out bg-[#333333]" 
                            style={{ 
                              transform: `scaleX(${Math.max(0, Math.min(1, percentage / 100))})`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[12px] font-mono text-[#5c5c5c] tabular-nums">
                          <span>{percentage}% {t.home.remainingText}</span>
                          <span>{bottle.remaining_ml} / {bottle.size_ml} ml</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action CTAs — EXACTLY ONE primary button */}
                    <div className="space-y-2 pt-3 border-t border-[#d9d7c9]">
                      <button 
                        type="button"
                        onClick={() => onLogWear(bottle.id)} 
                        className="w-full min-h-[48px] py-3 bg-[#333333] hover:bg-black text-[#fffef2] text-xs font-semibold transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Droplet className="w-4 h-4" />
                        <span>{t.home.logWearAction}</span>
                      </button>

                      {low && (
                        <button 
                          type="button"
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="w-full min-h-[44px] py-2 border border-[#333333] text-[#000000] text-xs font-semibold hover:bg-[#f4f3e6] transition text-center cursor-pointer active:scale-[0.98]"
                        >
                          {t.home.buyAgain}
                        </button>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 text-[#5c5c5c]">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(bottle)}
                          className="hover:text-black flex items-center gap-1 text-[12px] cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{locale === 'id' ? 'Edit Volume' : 'Edit volume'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkAsFinished(bottle)}
                          className="hover:text-black flex items-center gap-1 text-[12px] cursor-pointer"
                        >
                          <Archive className="w-3 h-3" />
                          <span>{locale === 'id' ? 'Tandai Habis' : 'Mark as finished'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB 2: INGIN DICOBA (WISHLIST) ══════════════ */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <p className="text-[14px] leading-[20px] text-[#5c5c5c]">
            {locale === 'id' 
              ? 'Wewangian yang menarik minatmu dan ingin kamu coba atau miliki di masa mendatang. Item wishlist belum dimiliki dan tidak dihitung sebagai botol koleksi.' 
              : 'Fragrances you have bookmarked to test, sample, or purchase in the future. Wishlist items are not owned and do not count as collection bottles.'}
          </p>

          {wishlistPerfumes.length === 0 ? (
            <EmptyState
              title={t.emptyStates.libraryWishlistTitle}
              body={t.emptyStates.libraryWishlistBody}
              ctaLabel={t.emptyStates.libraryWishlistCta}
              onCtaClick={() => onNavigateToCatalog ? onNavigateToCatalog() : undefined}
              iconType="shelf"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-stretch">
              {wishlistPerfumes.map((perfume, idx) => (
                <div 
                  key={`${activeTab}-${perfume.id}`} 
                  className={`bg-white p-5 border border-[#d9d7c9] flex flex-col justify-between h-full space-y-4 hover:border-black transition-opacity duration-150 ease-out animate-card-enter ${
                    removingWishlistId === perfume.id ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                >
                  <div className="space-y-3">
                    <div 
                      onClick={() => onSelectPerfume(perfume.id)}
                      className="h-48 bg-[#f4f3e6] border border-[#d9d7c9] flex items-center justify-center relative cursor-pointer p-3"
                    >
                      <Bottle
                        fragranceId={perfume.id}
                        name={perfume.name}
                        brand={perfume.brand}
                        size="sm"
                        showFill={false}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWishlistWithFade(perfume.id);
                        }}
                        className="absolute top-2 right-2 p-2 bg-white border border-[#d9d7c9] text-black hover:bg-[#f4f3e6] active:scale-95 transition cursor-pointer"
                        title={locale === 'id' ? 'Hapus dari wishlist' : 'Remove from wishlist'}
                        aria-label="Hapus dari wishlist"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <span className="text-xs uppercase font-medium text-[#5c5c5c] block tracking-wider">
                        {perfume.brand} · {perfume.concentration}
                      </span>
                      <h3 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="text-[18px] leading-[24px] font-medium text-[#000000] mt-1 cursor-pointer hover:underline line-clamp-2 h-[48px]"
                      >
                        {perfume.name}
                      </h3>
                      <p className="text-[14px] leading-[20px] text-[#5c5c5c] mt-1 line-clamp-1">{perfume.top_notes}</p>
                    </div>

                    <div className="text-xs font-mono font-bold pt-2 border-t border-[#d9d7c9] tabular-nums">
                      {formatCurrency(perfume.reference_price_idr, locale)} ({perfume.reference_price_size_ml}ml)
                    </div>
                  </div>

                  {/* Actions: Exactly ONE primary button */}
                  <div className="space-y-2 pt-3 border-t border-[#d9d7c9]">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectCatalogPerfume(perfume);
                        setBottleStatus('in_use');
                        setAddMode('catalog');
                        setIsAddModalOpen(true);
                      }}
                      className="w-full min-h-[48px] py-3 bg-[#333333] hover:bg-black text-[#fffef2] text-xs font-semibold transition cursor-pointer"
                    >
                      {locale === 'id' ? 'Sudah Punya (Pindah ke Lemari)' : 'Add to Collection'}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenTryItFirst(perfume.id)}
                        className="min-h-[44px] py-2 border border-[#333333] hover:bg-[#f4f3e6] text-xs font-medium text-[#000000] cursor-pointer"
                      >
                        {locale === 'id' ? 'Coba Dulu' : 'Try First'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="min-h-[44px] py-2 border border-[#8a8a8a] text-center text-xs font-medium hover:bg-[#f4f3e6] text-[#333333] cursor-pointer"
                      >
                        {locale === 'id' ? 'Lihat Detail' : 'View Detail'}
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB 3: FAVORIT ══════════════ */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          <p className="text-xs text-[#5C5C5C]">
            {locale === 'id' 
              ? 'Wewangian yang menjadi identitas khas dan signature scent terbaik dalam rotasimu.' 
              : 'Fragrances marked as your signature favourites, carrying higher weight in your Scent DNA.'}
          </p>

          {favoriteBottles.length === 0 ? (
            <EmptyState
              title={t.emptyStates.libraryFavoritesTitle}
              body={t.emptyStates.libraryFavoritesBody}
              ctaLabel={t.emptyStates.libraryFavoritesCta}
              onCtaClick={() => setActiveTab('wearing')}
              iconType="shelf"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-stretch">
              {favoriteBottles.map((bottle, idx) => {
                const perfume = perfumes.find(p => p.id === bottle.perfume_id);
                if (!perfume) return null;

                return (
                  <div 
                    key={`${activeTab}-${bottle.id}`} 
                    className="bg-white p-5 border border-[#d9d7c9] flex flex-col justify-between h-full space-y-4 hover:border-black transition-colors animate-card-enter"
                    style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                  >
                    <div className="space-y-3">
                      <div 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="h-48 bg-[#f4f3e6] border border-[#d9d7c9] flex items-center justify-center relative cursor-pointer p-3"
                      >
                        <Bottle fragranceId={perfume.id} name={perfume.name} brand={perfume.brand} size="sm" showFill={false} />
                        <span className="absolute top-2 right-2 text-black bg-white border border-[#d9d7c9] p-1.5 toggle-icon" aria-label="Favorit">
                          <Heart className="w-3.5 h-3.5 fill-current" />
                        </span>
                      </div>

                      <div>
                        <span className="text-xs uppercase font-medium text-[#5c5c5c] block tracking-wider">{perfume.brand}</span>
                        <h3 
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="text-[18px] leading-[24px] font-medium text-[#000000] mt-1 cursor-pointer hover:underline line-clamp-2 h-[48px]"
                        >
                          {perfume.name}
                        </h3>
                      </div>

                      {/* "Why I love it" text on Favorites renders in serif italic like a note in a diary */}
                      {(() => {
                        const relStory = stories.find(s => s.perfume_id === perfume.id);
                        const relWear = wearLogs.find(w => w.perfume_id === perfume.id && w.note);
                        const noteText = relStory?.body || relWear?.note || (locale === 'id' ? 'Aroma khas yang selalu memberi rasa tenang dan percaya diri setiap hari.' : 'A signature companion that brings effortless presence and calm throughout the day.');
                        return (
                          <div className="bg-[#f4f3e6] p-3 border-l-2 border-[#333333] space-y-1">
                            <span className="text-[12px] uppercase tracking-wider text-[#5c5c5c] font-medium block">
                              {locale === 'id' ? 'Catatan diary' : 'Why I love it'}
                            </span>
                            <p className="font-serif italic text-[14px] leading-[20px] text-[#333333]">
                              “{noteText.length > 120 ? `${noteText.slice(0, 120)}…` : noteText}”
                            </p>
                          </div>
                        );
                      })()}

                      {/* Rule 2: NO fill bar or remaining % on Favorites shelf */}
                      <div className="flex justify-between items-baseline text-xs text-[#5c5c5c] pt-2 border-t border-[#d9d7c9]">
                        <span className="font-mono">{perfume.primary_family} · {perfume.concentration}</span>
                        <span className="font-mono text-xs">
                          {bottle.times_worn || 0}x {locale === 'id' ? 'dipakai' : 'worn'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onLogWear(bottle.id)}
                      className="w-full min-h-[48px] py-3 bg-[#333333] hover:bg-black text-[#fffef2] text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
                    >
                      {t.home.logWearAction}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB 4: KENANGAN & BOTOL HABIS ══════════════ */}
      {activeTab === 'memories' && (
        <div className="space-y-6">
          <p className="text-[14px] leading-[20px] text-[#5c5c5c]">
            {locale === 'id' 
              ? 'Arsip botol yang telah kosong atau aroma masa lalu yang memiliki kenangan emosional berharga.' 
              : 'Emptied bottles and archived fragrance memories preserving your personal olfactory journey.'}
          </p>

          {memoryBottles.length === 0 ? (
            <EmptyState
              title={t.emptyStates.libraryMemoriesTitle}
              body={t.emptyStates.libraryMemoriesBody}
              ctaLabel={t.emptyStates.libraryMemoriesCta}
              onCtaClick={() => onNavigateToCatalog ? onNavigateToCatalog() : undefined}
              iconType="shelf"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-stretch">
              {memoryBottles.map((bottle, idx) => {
                const perfume = perfumes.find(p => p.id === bottle.perfume_id);
                if (!perfume) return null;

                return (
                  <div 
                    key={`${activeTab}-${bottle.id}`} 
                    className="bg-white p-5 border border-[#d9d7c9] flex flex-col justify-between h-full space-y-4 hover:border-black transition-colors animate-card-enter"
                    style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                  >
                    <div className="space-y-3">
                      <div 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="h-48 bg-[#f4f3e6] border border-[#d9d7c9] flex items-center justify-center relative cursor-pointer p-3 opacity-60"
                      >
                        <Bottle fragranceId={perfume.id} name={perfume.name} brand={perfume.brand} size="sm" showFill={false} />
                        <span className="absolute top-2 right-2 text-xs font-mono px-2 py-0.5 bg-white border border-[#d9d7c9] text-[#5c5c5c]">
                          {locale === 'id' ? 'Habis (0 ml)' : 'Empty (0 ml)'}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs uppercase font-medium text-[#5c5c5c] block tracking-wider">{perfume.brand}</span>
                        <h3 
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="text-[18px] leading-[24px] font-medium line-through text-[#5c5c5c] mt-1 cursor-pointer hover:underline line-clamp-2 h-[48px]"
                        >
                          {perfume.name}
                        </h3>
                      </div>

                      <p className="text-[14px] leading-[20px] text-[#5c5c5c]">
                        {locale === 'id' 
                          ? `Telah disemprot sebanyak ${bottle.times_worn || 0} kali selama menemani aktivitasmu.` 
                          : `Worn ${bottle.times_worn || 0} times throughout your fragrance journey.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectPerfume(perfume.id)}
                      className="w-full min-h-[44px] py-2 border border-[#333333] hover:bg-[#f4f3e6] text-[#000000] text-xs font-medium cursor-pointer"
                    >
                      {locale === 'id' ? 'Lihat Detail' : 'View Detail'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB 5: DASHBOARD SCENT DNA ══════════════ */}
      {activeTab === 'dna' && (
        profilePerfumesCount < 3 ? (
          <div className="bg-white p-6 md:p-8 border border-[#D9D7C9]">
            <EmptyState
              title={locale === 'id' ? 'Profil Scent DNA Membutuhkan Minimal 3 Parfum' : 'Scent DNA Requires at Least 3 Fragrances'}
              body={locale === 'id' 
                ? 'Tambahkan minimal 3 parfum ke lemarimu untuk membentuk profil dan analisis DNA aroma personal.' 
                : 'Add at least 3 fragrances to your library to generate an accurate personal olfactory taste profile.'}
              ctaLabel={locale === 'id' ? 'Jelajahi Katalog' : 'Browse Catalog'}
              onCtaClick={() => onNavigateToCatalog ? onNavigateToCatalog() : undefined}
              iconType="shelf"
            />
          </div>
        ) : (
          <div className="space-y-8 bg-white p-6 md:p-8 border border-[#D9D7C9]">
            
            {/* Header Persona */}
            <div className="border-b border-[#D9D7C9] pb-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8A4B14]">
                <Sparkles className="w-4 h-4" />
                <span>{locale === 'id' ? 'Profil DNA Aroma Pribadi' : 'Personal Scent DNA Profile'}</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-normal text-[#1A1A1A]">
                {locale === 'id' ? `Karakter Utama: ${scentDna.dominantFamily} Devotee` : `Primary Accord: ${scentDna.dominantFamily} Devotee`}
              </h2>
              <p className="text-sm text-[#5C5C5C] leading-relaxed max-w-3xl italic">
                "{locale === 'id' ? scentDna.editorialPersonaId : scentDna.editorialPersonaEn}"
              </p>
            </div>

            {/* Grid Metrics & Family Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Left: Olfactive Family Breakdown + Secondary Radar Chart + Data Table Toggle + Top 8 Notes */}
              <div className="md:col-span-7">
                <ScentDnaVisualisation
                  familyBreakdown={scentDna.familyBreakdown}
                  perfumesCount={profilePerfumesCount}
                  topNotes={rankedTopNotes}
                  locale={locale}
                  isDashboard={true}
                  renderRadar={() => (
                    <React.Suspense fallback={
                      <div className="h-[260px] flex items-center justify-center font-mono text-xs text-[#5c5c5c]">
                        {locale === 'id' ? 'Memuat visualisasi radar...' : 'Loading radar visualization...'}
                      </div>
                    }>
                      <ScentDnaRadarChart familyBreakdown={scentDna.familyBreakdown} height={260} />
                    </React.Suspense>
                  )}
                  onNavigateToCatalog={onNavigateToCatalog}
                />
              </div>

              {/* Right: Climate Suitability & Stats */}
              <div className="md:col-span-5 bg-[#f4f3e6] p-6 border border-[#d9d7c9] space-y-5">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-[#000000]">
                  {locale === 'id' ? 'Kesesuaian Iklim Tropis Indonesia' : 'Indonesian Tropical Climate Suitability'}
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="flex items-center gap-1 font-medium text-[#000000]">
                        <Sun className="w-3.5 h-3.5 text-[#333333]" /> {locale === 'id' ? 'Siang Terik Outdoor Tropis' : 'Tropical Daytime Outdoor'}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-[#000000]">{scentDna.climateSuitability.tropicalOutdoorPct}%</span>
                    </div>
                    <div className="w-full bg-[#fffef2] h-2 overflow-hidden border border-[#d9d7c9]">
                      <div className="bg-[#333333] h-full animate-bar-grow" style={{ width: `${scentDna.climateSuitability.tropicalOutdoorPct}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="flex items-center gap-1 font-medium text-[#000000]">
                        <Wind className="w-3.5 h-3.5 text-[#5c5c5c]" /> {locale === 'id' ? 'Ruang Ber-AC Seharian (Kantor)' : 'All-Day Air-Conditioned Office'}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-[#000000]">{scentDna.climateSuitability.officeAcPct}%</span>
                    </div>
                    <div className="w-full bg-[#fffef2] h-2 overflow-hidden border border-[#d9d7c9]">
                      <div className="bg-[#5c5c5c] h-full animate-bar-grow" style={{ width: `${scentDna.climateSuitability.officeAcPct}%`, animationDelay: '30ms' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="flex items-center gap-1 font-medium text-[#000000]">
                        <Clock className="w-3.5 h-3.5 text-[#5c5c5c]" /> {locale === 'id' ? 'Malam Hari & Cuaca Hujan' : 'Evenings & Rain'}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-[#000000]">{scentDna.climateSuitability.eveningRainPct}%</span>
                    </div>
                    <div className="w-full bg-[#fffef2] h-2 overflow-hidden border border-[#d9d7c9]">
                      <div className="bg-[#333333] h-full animate-bar-grow" style={{ width: `${scentDna.climateSuitability.eveningRainPct}%`, animationDelay: '60ms' }}></div>
                    </div>
                  </div>
                </div>

                {/* Wardrobe Summary Card */}
                <div className="pt-4 border-t border-[#d9d7c9] space-y-2 text-[12px] leading-[16px]">
                  <div className="flex justify-between">
                    <span className="text-[#5c5c5c]">{locale === 'id' ? 'Total Volume Tersisa:' : 'Total Volume Remaining:'}</span>
                    <span className="font-mono tabular-nums font-bold">{scentDna.totalVolumeMl} ml</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5c5c5c]">{locale === 'id' ? 'Rata-rata Sisa Isi Botol:' : 'Average Bottle Fill:'}</span>
                    <span className="font-mono tabular-nums font-bold">{scentDna.averageRemainingPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5c5c5c]">{locale === 'id' ? 'Total Nilai Koleksi:' : 'Total Collection Value:'}</span>
                    <span className="font-mono tabular-nums font-bold">{formatCurrency(summary.totalCollectionValueIdr, locale)}</span>
                  </div>
                </div>

              </div>

            </div>

          {/* ── REKOMENDASI PARFUM BERDASARKAN SCENT DNA ── */}
          {dnaRecommendedPerfumes.length > 0 && (
            <div className="pt-6 border-t border-[#d9d7c9] space-y-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-[12px] uppercase tracking-wider font-semibold text-[#000000] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#333333]" />
                    <span>Rekomendasi Parfum Kurasi Khusus Scent DNA Kamu</span>
                  </h3>
                  <p className="text-[12px] text-[#5c5c5c]">
                    Dipilih dari katalog karena selaras dengan aroma {scentDna.dominantFamily} dan piramida notes favoritmu
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                {dnaRecommendedPerfumes.map(rec => (
                  <div 
                    key={rec.id}
                    className="bg-[#f4f3e6]/60 border border-[#d9d7c9] p-4 flex flex-col justify-between space-y-3 hover:border-[#333333] transition h-full"
                  >
                    <div>
                      <div className="flex justify-between text-[12px] font-mono text-[#5c5c5c]">
                        <span>COCOK DENGAN DNA</span>
                        <span className="uppercase">{rec.origin}</span>
                      </div>
                      <h4 
                        onClick={() => onSelectPerfume(rec.id)}
                        className="font-sans text-[18px] leading-[24px] font-medium text-[#000000] mt-1 cursor-pointer hover:underline line-clamp-2"
                      >
                        {rec.name}
                      </h4>
                      <p className="text-[12px] text-[#5c5c5c] font-mono">{rec.brand} · {rec.concentration}</p>
                      <p className="text-[12px] leading-[18px] text-[#333333] mt-1.5 line-clamp-2">
                        {rec.top_notes}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#d9d7c9] flex items-center justify-between">
                      <span className="text-[12px] font-mono tabular-nums font-semibold text-[#000000]">{formatCurrency(rec.reference_price_idr, locale)}</span>
                      <button
                        onClick={() => onSelectPerfume(rec.id)}
                        className="text-[12px] text-[#000000] hover:underline font-semibold"
                      >
                        Buka Detail →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PENCAPAIAN KOLEKTOR (ACHIEVEMENT BADGES SYSTEM) ── */}
          <div className="pt-6 border-t border-[#d9d7c9] space-y-4">
            <div className="flex justify-between items-baseline">
              <div>
                <h3 className="text-[12px] uppercase tracking-wider font-semibold text-[#000000] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#333333]" />
                  <span>Lencana Pencapaian Kolektor (Collector Achievements)</span>
                </h3>
                <p className="text-[12px] text-[#5c5c5c]">
                  Lencana apresiasi berdasarkan jumlah koleksi, pencatatan semprot, dan kontribusi ulasanmu
                </p>
              </div>
              <span className="text-[12px] font-mono tabular-nums text-[#5c5c5c]">
                {computeUserAchievements({
                  bottleCount: sharedBottleStats.totalLibraryBottles,
                  wearLogCount: sharedBottleStats.totalWearsCount,
                  reviewCount: 2,
                  storyCount: 1,
                  quizCompleted: true
                }).filter(b => b.isUnlocked).length} / 5 Lencana Terbuka
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
              {computeUserAchievements({
                bottleCount: sharedBottleStats.totalLibraryBottles,
                wearLogCount: sharedBottleStats.totalWearsCount,
                reviewCount: 2,
                storyCount: 1,
                quizCompleted: true
              }).map(badge => (
                <div 
                  key={badge.id}
                  className={`p-3.5 border transition h-full flex flex-col justify-between ${
                    badge.isUnlocked 
                      ? 'bg-[#fffef2] border-[#333333]' 
                      : 'bg-[#f4f3e6]/40 border-[#d9d7c9] opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 border shrink-0 ${
                      badge.isUnlocked 
                        ? 'bg-[#333333] text-[#fffef2] border-[#333333]' 
                        : 'bg-[#f4f3e6] text-[#5c5c5c] border-[#d9d7c9]'
                    }`}>
                      <Award className="w-4 h-4" />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-sans font-medium text-[14px] leading-[20px] text-[#000000] truncate">
                          {locale === 'id' ? badge.titleId : badge.titleEn}
                        </h4>
                        <span className="text-[12px] font-mono uppercase px-1.5 py-0.5 border bg-[#f4f3e6] border-[#d9d7c9] text-[#333333]">
                          {badge.tier}
                        </span>
                      </div>

                      <p className="text-[12px] leading-[18px] text-[#5c5c5c] line-clamp-2">
                        {locale === 'id' ? badge.descriptionId : badge.descriptionEn}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[12px] font-mono tabular-nums">
                        <span className={badge.isUnlocked ? 'text-[#000000] font-semibold' : 'text-[#5c5c5c]'}>
                          {badge.isUnlocked ? '✓ Terbuka' : `Progres: ${badge.progress}/${badge.maxProgress}`}
                        </span>
                        {badge.unlockedAt && (
                          <span className="text-[#5c5c5c]">{badge.unlockedAt}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          </div>
        )
      )}
      </div>

      {/* ── BOTTOM SHEET / MODAL: TAMBAH BOTOL KE LEMARI (CAB-04 & CUSTOM DUPLICATE GUARD) ── */}
      <BottomSheetOrModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={locale === 'id' ? 'Tambah Parfum ke Lemarimu' : 'Add Perfume to Library'}
        subtitle={locale === 'id' ? 'Kurasi koleksi botol parfum personalmu' : 'Add fragrance to your personal shelf'}
        maxWidth="max-w-lg"
      >
        {/* Mode Selector: Cari di Katalog vs Input Manual */}
        <div className="grid grid-cols-2 border border-[#333333] text-center text-[12px] p-0.5 bg-[#f4f3e6]">
          <button
            type="button"
            onClick={() => setAddMode('catalog')}
            className={`min-h-[44px] py-2 font-semibold transition ${addMode === 'catalog' ? 'bg-[#333333] text-[#fffef2]' : 'text-[#5c5c5c] hover:text-black'}`}
          >
            {locale === 'id' ? `Pilih dari Katalog (${perfumes.length} Kurasi)` : `Select from Catalog (${perfumes.length} Curated)`}
          </button>
          <button
            type="button"
            onClick={() => setAddMode('custom')}
            className={`min-h-[44px] py-2 font-semibold transition ${addMode === 'custom' ? 'bg-[#333333] text-[#fffef2]' : 'text-[#5c5c5c] hover:text-black'}`}
          >
            Tambah Manual (Custom / Privat)
          </button>
        </div>

        <form onSubmit={handleSaveAddBottle} className="space-y-4 text-[12px]">
          {/* MODE 1: PILIH DARI KATALOG */}
          {addMode === 'catalog' ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold block text-[#000000]">Cari Parfum di Katalog</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#5c5c5c] absolute left-3 top-3 pointer-events-none" />
                  <input 
                    type="text"
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    placeholder="Ketik nama atau brand (cth: HMNS, Oullu)..."
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-[#fffef2] border border-[#8a8a8a] text-[14px] text-[#000000] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Candidates List */}
              <div className="max-h-40 overflow-y-auto divide-y divide-[#d9d7c9] border border-[#d9d7c9] bg-[#fffef2]">
                {filteredCatalogOptions.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => handleSelectCatalogPerfume(p)}
                    className={`p-3 min-h-[44px] flex justify-between items-center cursor-pointer transition ${
                      selectedCatalogId === p.id ? 'bg-[#f4f3e6] font-bold border-l-4 border-l-[#333333]' : 'hover:bg-[#f4f3e6]'
                    }`}
                  >
                    <div>
                      <span className="text-[12px] uppercase text-[#5c5c5c]">{p.brand}</span>
                      <p className="text-[14px] font-sans font-medium text-[#000000]">{p.name}</p>
                    </div>
                    <span className="font-mono tabular-nums text-[12px] text-[#5c5c5c]">{p.concentration} · {p.reference_price_size_ml}ml</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* MODE 2: INPUT MANUAL DENGAN DUPLICATE DETECTION ("DID YOU MEAN...?") */
            <div className="space-y-3 bg-[#f4f3e6] p-4 border border-[#d9d7c9]">
              <div className="space-y-1">
                <label className="font-semibold block text-[#000000]">Nama Brand</label>
                <input 
                  type="text"
                  value={customBrand}
                  onChange={e => setCustomBrand(e.target.value)}
                  placeholder="Contoh: Le Labo, HMNS, atau Artisan Lokal"
                  className="w-full min-h-[44px] p-2 bg-[#fffef2] border border-[#8a8a8a] text-[14px] text-[#000000]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-[#000000]">Nama Varian Parfum</label>
                <input 
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Contoh: Santal 33, Orgasm, Vanilla Mist"
                  className="w-full min-h-[44px] p-2 bg-[#fffef2] border border-[#8a8a8a] text-[14px] text-[#000000]"
                  required
                />
              </div>

              {/* Duplicate Detection Alert */}
              {detectedCatalogDuplicate && (
                <div className="p-3 bg-[#f4f3e6] border border-[#8a8a8a] text-[#000000] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[12px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#333333]" />
                    <span>Apakah maksudmu: {detectedCatalogDuplicate.brand} — {detectedCatalogDuplicate.name}?</span>
                  </div>
                  <p className="text-[12px] text-[#5c5c5c]">
                    Parfum ini sudah ada di katalog kurasi kami dengan data notes terverifikasi.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectCatalogPerfume(detectedCatalogDuplicate);
                      setAddMode('catalog');
                    }}
                    className="min-h-[44px] text-[12px] font-bold underline text-[#000000] mt-1 flex items-center"
                  >
                    Pilih Data Kurasi Katalog Saja →
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold block text-[#000000]">Konsentrasi</label>
                  <select 
                    value={customConcentration}
                    onChange={e => setCustomConcentration(e.target.value as any)}
                    className="w-full min-h-[44px] p-2 bg-[#fffef2] border border-[#8a8a8a] text-[14px] text-[#000000]"
                  >
                    <option value="EDP">EDP</option>
                    <option value="EDT">EDT</option>
                    <option value="Extrait">Extrait de Parfum</option>
                    <option value="EDC">EDC</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold block text-[#000000]">Keluarga Aroma</label>
                  <select 
                    value={customFamily}
                    onChange={e => setCustomFamily(e.target.value)}
                    className="w-full min-h-[44px] p-2 bg-[#fffef2] border border-[#8a8a8a] text-[14px] text-[#000000]"
                  >
                    <option value="Woody">Woody</option>
                    <option value="Floral">Floral</option>
                    <option value="Fresh">Fresh</option>
                    <option value="Ambery">Ambery</option>
                    <option value="Gourmand">Gourmand</option>
                    <option value="Aromatic">Aromatic</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* COMMON BOTTLE QUANTITY & PRICE DETAILS */}
          <div className="space-y-3 pt-2 border-t border-[#d9d7c9]">
            {/* Big tappable size chips (2 / 5 / 10 / 30 / 50 / 75 / 100 ml) */}
            <div className="space-y-1.5">
              <label className="font-semibold block text-[#000000] text-[12px] uppercase tracking-wider">
                {locale === 'id' ? 'Pilih Ukuran Botol (ml)' : 'Select Bottle Size (ml)'}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {[2, 5, 10, 30, 50, 75, 100].map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      setBottleSize(sz);
                      setBottleRemaining(sz);
                    }}
                    className={`min-h-[44px] py-2 px-1 text-center text-xs font-mono font-medium border transition cursor-pointer active:scale-95 ${
                      bottleSize === sz
                        ? 'bg-[#333333] text-[#fffef2] border-[#333333]'
                        : 'bg-white text-[#000000] border-[#d9d7c9] hover:border-black'
                    }`}
                  >
                    {sz} ml
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold block text-[#000000] text-xs">{locale === 'id' ? 'Ukuran Penuh (ml)' : 'Full Size (ml)'}</label>
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
                  required
                />
              </div>

            <div className="space-y-1">
              <label className="font-semibold block text-[#000000]">Sisa Cairan Saat Ini (ml)</label>
              <input 
                type="number" 
                inputMode="numeric"
                min="0" 
                max={bottleSize}
                step="0.5"
                value={bottleRemaining}
                onChange={e => setBottleRemaining(Number(e.target.value))}
                className="w-full min-h-[44px] p-2 bg-[#fffef2] border border-[#8a8a8a] text-[14px] font-mono tabular-nums text-[#000000]"
                required
              />
            </div>
          </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold block text-[#000000]">Harga Pembelian (Rp)</label>
              <input 
                type="number" 
                inputMode="numeric"
                value={bottlePrice}
                onChange={e => setBottlePrice(Number(e.target.value))}
                className="w-full min-h-[44px] p-2 bg-[#fffef2] border border-[#8a8a8a] text-[14px] font-mono tabular-nums text-[#000000]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold block text-[#000000]">Status Awal</label>
              <select 
                value={bottleStatus}
                onChange={e => setBottleStatus(e.target.value as any)}
                className="w-full min-h-[44px] p-2 bg-[#fffef2] border border-[#8a8a8a] text-[14px] text-[#000000]"
              >
                <option value="in_use">Sedang Dipakai (In Use)</option>
                <option value="sealed">Masih Tersegel (Sealed)</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1 min-h-[44px]">
            <input 
              type="checkbox"
              checked={bottleIsFavorite}
              onChange={e => setBottleIsFavorite(e.target.checked)}
              className="accent-[#333333] w-4 h-4"
            />
            <span className="font-medium text-[12px] text-[#000000]">Tandai sebagai Parfum Favorit</span>
          </label>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#d9d7c9]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="min-h-[48px] px-4 py-2 border border-[#8a8a8a] hover:border-[#333333] text-[14px] font-medium text-[#000000]"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-6 py-2 bg-[#333333] hover:bg-black text-[#fffef2] text-[14px] font-medium"
            >
              Simpan Botol ke Lemari
            </button>
          </div>
        </form>
      </BottomSheetOrModal>

      {/* ── BOTTOM SHEET / MODAL: UPDATE LEVEL (REMAINING ML) & EDIT BOTOL ── */}
      <BottomSheetOrModal
        isOpen={Boolean(editingBottle)}
        onClose={() => setEditingBottle(null)}
        title={locale === 'id' ? 'Edit Volume & Sisa Botol' : 'Update Bottle Level'}
        subtitle={locale === 'id' ? 'Perbarui sisa volume cairan botol parfum' : 'Adjust remaining volume in ml'}
        maxWidth="max-w-sm"
      >
        {editingBottle && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-[12px]">
            <div className="space-y-1.5">
              <label className="font-semibold block text-[#000000]">Sisa Cairan Saat Ini (ml)</label>
              <input 
                type="number"
                inputMode="numeric"
                min="0"
                max={editingBottle.size_ml}
                step="0.5"
                value={editRemainingMl}
                onChange={e => setEditRemainingMl(Number(e.target.value))}
                className="w-full min-h-[44px] p-2.5 bg-[#fffef2] border border-[#8a8a8a] font-mono tabular-nums text-[14px] text-[#000000]"
                required
              />
              <div className="flex justify-between items-center text-[12px] text-[#5c5c5c]">
                <span>Ukuran Penuh: {editingBottle.size_ml} ml</span>
                <span className="font-mono tabular-nums">
                  {editingBottle.size_ml > 0 ? Math.round((editRemainingMl / editingBottle.size_ml) * 100) : 0}% tersisa
                </span>
              </div>
            </div>

            {/* Quick Adjust Buttons in Thumb Zone (Min 44px tap targets) */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[-5, -1, 1, 5].map(delta => (
                <button
                  type="button"
                  key={delta}
                  onClick={() => {
                    setEditRemainingMl(prev => Math.min(editingBottle.size_ml, Math.max(0, Number((prev + delta).toFixed(1)))));
                  }}
                  className="min-h-[44px] bg-[#f4f3e6] border border-[#d9d7c9] hover:border-[#333333] text-[12px] font-mono tabular-nums font-bold text-[#000000]"
                >
                  {delta > 0 ? `+${delta}ml` : `${delta}ml`}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 min-h-[44px]">
              <input 
                type="checkbox"
                checked={editIsFavorite}
                onChange={e => setEditIsFavorite(e.target.checked)}
                className="accent-[#333333] w-4 h-4"
              />
              <span className="font-medium text-[12px] text-[#000000]">Jadikan Parfum Favorit</span>
            </label>

            <div className="flex justify-between items-center pt-3 border-t border-[#d9d7c9]">
              <button
                type="button"
                onClick={() => {
                  onDeleteBottle(editingBottle.id);
                  setEditingBottle(null);
                }}
                className="min-h-[48px] text-[#b3261e] hover:underline flex items-center gap-1 text-[12px] font-medium px-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Botol</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBottle(null)}
                  className="min-h-[48px] px-3 py-1.5 border border-[#8a8a8a] hover:border-[#333333] text-[14px] font-medium text-[#000000]"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] px-5 py-1.5 bg-[#333333] text-[#fffef2] hover:bg-black font-medium text-[14px]"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </form>
        )}
      </BottomSheetOrModal>

    </div>
  );
};
