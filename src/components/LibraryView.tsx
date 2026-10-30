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
import { Locale, formatCurrency, translations, fmt } from '../lib/i18n.ts';
import { 
  ScentDnaVisualisation, 
  countProfilePerfumes, 
  extractRankedTopNotes 
} from './ScentDnaVisualisation.tsx';

import { computeUserAchievements, AchievementBadge } from '../lib/achievements.ts';
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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-4">
        <div className="space-y-1">
          <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
            {translations[locale].libraryView.koleksiPribadi}
          </span>
          <h2 className="font-serif text-[24px] leading-[32px] md:text-[32px] md:leading-[40px] text-ink font-normal">
            {translations[locale].libraryView.lemariWewangianScentDna}
          </h2>
          <p className="text-[14px] leading-[20px] text-secondary font-mono">
            {summary.currentlyWearingCount} {translations[locale].libraryView.botolAktif} · {summary.favoritesCount} {translations[locale].libraryView.favorit} · {translations[locale].libraryView.valuasiKoleksi}: {formatCurrency(summary.totalCollectionValueIdr, locale)}
          </p>
        </div>

        {/* Action: Add bottle to shelf */}
        <button
          type="button"
          onClick={() => {
            setAddMode('catalog');
            setIsAddModalOpen(true);
          }}
          className="min-h-[44px] px-4 py-2 bg-bar hover:bg-ink text-paper text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{translations[locale].libraryView.tambahBotolKeLemari}</span>
        </button>
      </div>

      {/* ── 4 RAK (FOUR SHELVES) + SCENT DNA NAVIGATION TABS (Sticky & thumb-friendly) ── */}
      <div className="sticky top-0 z-20 bg-paper/95 backdrop-blur-xs py-2 border-b border-hairline flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        
        {/* Rak 1: Sedang Dipakai (In Use) */}
        <button
          type="button"
          onClick={() => setActiveTab('wearing')}
          className={`min-h-[44px] px-3 sm:px-4 py-2.5 whitespace-nowrap shrink-0 transition font-medium flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
            activeTab === 'wearing'
              ? 'bg-bar text-paper'
              : 'bg-white border border-hairline text-secondary hover:border-ink hover:text-ink'
          }`}
        >
          <span>{translations[locale].libraryView.sedangDipakai}</span>
          <span className="font-mono text-[12px] opacity-80">({currentlyWearingBottles.length})</span>
        </button>

        {/* Rak 2: Ingin Dicoba (Wishlist) */}
        <button
          type="button"
          onClick={() => setActiveTab('wishlist')}
          className={`min-h-[44px] px-3 sm:px-4 py-2.5 whitespace-nowrap shrink-0 transition font-medium flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
            activeTab === 'wishlist'
              ? 'bg-bar text-paper'
              : 'bg-white border border-hairline text-secondary hover:border-ink hover:text-ink'
          }`}
        >
          <span>{translations[locale].libraryView.inginDicobaWishlist}</span>
          <span className="font-mono text-[12px] opacity-80">({wishlistPerfumes.length})</span>
        </button>

        {/* Rak 3: Favorit */}
        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`min-h-[44px] px-3 sm:px-4 py-2.5 whitespace-nowrap shrink-0 transition font-medium flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
            activeTab === 'favorites'
              ? 'bg-bar text-paper'
              : 'bg-white border border-hairline text-secondary hover:border-ink hover:text-ink'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>{translations[locale].libraryView.favorit2}</span>
          <span className="font-mono text-[12px] opacity-80">({favoriteBottles.length})</span>
        </button>

        {/* Rak 4: Kenangan (Finished & Memories) */}
        <button
          type="button"
          onClick={() => setActiveTab('memories')}
          className={`min-h-[44px] px-3 sm:px-4 py-2.5 whitespace-nowrap shrink-0 transition font-medium flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
            activeTab === 'memories'
              ? 'bg-bar text-paper'
              : 'bg-white border border-hairline text-secondary hover:border-ink hover:text-ink'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>{translations[locale].libraryView.kenanganBotolHabis}</span>
          <span className="font-mono text-[12px] opacity-80">({memoryBottles.length})</span>
        </button>

        {/* Dashboard: Scent DNA */}
        <button
          onClick={() => setActiveTab('dna')}
          className={`min-h-[44px] px-3 sm:px-4 py-2.5 whitespace-nowrap shrink-0 transition font-medium flex items-center gap-2 active:scale-[0.98] cursor-pointer ${
            activeTab === 'dna'
              ? 'bg-bar text-paper'
              : 'bg-white border border-hairline text-secondary hover:border-ink hover:text-ink'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{translations[locale].libraryView.dashboardScentDna}</span>
        </button>

      </div>

      {/* Cross-fade wrapper for active tab changes */}
      <div key={activeTab} className="animate-screen-enter">
      {/* ══════════════ TAB 1: SEDANG DIPAKAI (CURRENTLY WEARING) ══════════════ */}
      {activeTab === 'wearing' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-baseline gap-2">
            <p className="text-xs text-secondary">
              {translations[locale].libraryView.botolAktifYangSaatIniTersediaDiMeja}
            </p>
            {onNavigateToDiary && (
              <button
                onClick={onNavigateToDiary}
                className="text-xs text-accent hover:underline font-semibold flex items-center gap-1 shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{translations[locale].libraryView.bukaBukuHarianCerita}</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 desktop:grid-cols-4 gap-6 items-stretch">
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
                    className="bg-white p-5 border border-hairline flex flex-col justify-between h-full space-y-4 hover:border-ink transition-colors animate-card-enter"
                    style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                  >
                    {/* Top Thumbnail & Action Badges */}
                    <div className="space-y-3">
                      <div 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="h-56 bg-surface border border-hairline flex items-center justify-center relative cursor-pointer group p-4"
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
                          className="absolute top-2 right-2 p-2 bg-white border border-hairline hover:bg-surface text-bar transition toggle-icon cursor-pointer active:scale-95"
                          title={translations[locale].libraryView.favoriteToggleTitle}
                          aria-label={translations[locale].libraryView.saveToFavoriteAria}
                        >
                          <Heart className={`w-3.5 h-3.5 ${bottle.is_favorite ? 'fill-bar text-bar' : 'text-secondary'}`} />
                        </button>

                        {/* Calm Low Bottle Alert Tag */}
                        {low && (
                          <span className="absolute top-2 left-2 text-[12px] font-mono font-medium border border-bar bg-white text-ink px-2 py-0.5">
                            {translations[locale].libraryView.menipis20}
                          </span>
                        )}

                        <span className="absolute bottom-2 left-2 text-[12px] font-mono px-2 py-0.5 bg-white border border-hairline text-secondary">
                          {bottle.times_worn || 0}x {translations[locale].libraryView.dipakai}
                        </span>
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex justify-between items-baseline text-xs text-secondary">
                          <span className="font-semibold uppercase tracking-wider">{perfume.brand}</span>
                          <span className="font-mono text-xs">{perfume.concentration}</span>
                        </div>

                        <h3 
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="text-[18px] leading-[24px] font-medium text-ink mt-1 cursor-pointer hover:underline line-clamp-2 h-[48px]"
                        >
                          {perfume.name}
                        </h3>

                        <p className="text-[14px] leading-[20px] text-secondary mt-1 line-clamp-1">
                          {perfume.top_notes}
                        </p>
                      </div>

                      {/* Fill Level Progress Bar (BR-02 & Calm Motion: 200ms transform scaleX) */}
                      <div className="space-y-1.5 pt-2 border-t border-hairline">
                        <div className="w-full bg-surface border border-hairline h-2 overflow-hidden">
                          <div 
                            className="h-full w-full origin-left transition-transform duration-200 ease-out bg-bar" 
                            style={{ 
                              transform: `scaleX(${Math.max(0, Math.min(1, percentage / 100))})`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[12px] font-mono text-secondary tabular-nums">
                          <span>{percentage}% {t.home.remainingText}</span>
                          <span>{bottle.remaining_ml} / {bottle.size_ml} ml</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action CTAs — EXACTLY ONE primary button */}
                    <div className="space-y-2 pt-3 border-t border-hairline">
                      <button 
                        type="button"
                        onClick={() => onLogWear(bottle.id)} 
                        className="w-full min-h-[48px] py-3 bg-bar hover:bg-ink text-paper text-xs font-semibold transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Droplet className="w-4 h-4" />
                        <span>{t.home.logWearAction}</span>
                      </button>

                      {low && (
                        <button 
                          type="button"
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="w-full min-h-[44px] py-2 border border-bar text-ink text-xs font-semibold hover:bg-surface transition text-center cursor-pointer active:scale-[0.98]"
                        >
                          {t.home.buyAgain}
                        </button>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 text-secondary">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(bottle)}
                          className="hover:text-ink flex items-center gap-1 text-[12px] cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{translations[locale].libraryView.editVolume}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkAsFinished(bottle)}
                          className="hover:text-ink flex items-center gap-1 text-[12px] cursor-pointer"
                        >
                          <Archive className="w-3 h-3" />
                          <span>{translations[locale].home.markAsFinished}</span>
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
          <p className="text-[14px] leading-[20px] text-secondary">
            {translations[locale].libraryView.wewangianYangMenarikMinatmuDanInginK}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 desktop:grid-cols-4 gap-6 items-stretch">
              {wishlistPerfumes.map((perfume, idx) => (
                <div 
                  key={`${activeTab}-${perfume.id}`} 
                  className={`bg-white p-5 border border-hairline flex flex-col justify-between h-full space-y-4 hover:border-ink transition-opacity duration-150 ease-out animate-card-enter ${
                    removingWishlistId === perfume.id ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                >
                  <div className="space-y-3">
                    <div 
                      onClick={() => onSelectPerfume(perfume.id)}
                      className="h-48 bg-surface border border-hairline flex items-center justify-center relative cursor-pointer p-3"
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
                        className="absolute top-2 right-2 p-2 bg-white border border-hairline text-ink hover:bg-surface active:scale-95 transition cursor-pointer"
                        title={translations[locale].libraryView.hapusDariWishlist}
                        aria-label={translations[locale].libraryView.hapusDariWishlist}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <span className="text-xs uppercase font-medium text-secondary block tracking-wider">
                        {perfume.brand} · {perfume.concentration}
                      </span>
                      <h3 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="text-[18px] leading-[24px] font-medium text-ink mt-1 cursor-pointer hover:underline line-clamp-2 h-[48px]"
                      >
                        {perfume.name}
                      </h3>
                      <p className="text-[14px] leading-[20px] text-secondary mt-1 line-clamp-1">{perfume.top_notes}</p>
                    </div>

                    <div className="text-xs font-mono font-bold pt-2 border-t border-hairline tabular-nums">
                      {formatCurrency(perfume.reference_price_idr, locale)} ({perfume.reference_price_size_ml}ml)
                    </div>
                  </div>

                  {/* Actions: Exactly ONE primary button */}
                  <div className="space-y-2 pt-3 border-t border-hairline">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectCatalogPerfume(perfume);
                        setBottleStatus('in_use');
                        setAddMode('catalog');
                        setIsAddModalOpen(true);
                      }}
                      className="w-full min-h-[48px] py-3 bg-bar hover:bg-ink text-paper text-xs font-semibold transition cursor-pointer"
                    >
                      {translations[locale].libraryView.sudahPunyaPindahKeLemari}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenTryItFirst(perfume.id)}
                        className="min-h-[44px] py-2 border border-bar hover:bg-surface text-xs font-medium text-ink cursor-pointer"
                      >
                        {translations[locale].libraryView.cobaDulu}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="min-h-[44px] py-2 border border-border text-center text-xs font-medium hover:bg-surface text-bar cursor-pointer"
                      >
                        {translations[locale].libraryView.lihatDetail}
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
          <p className="text-xs text-secondary">
            {translations[locale].libraryView.wewangianYangMenjadiIdentitasKhasDan}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 desktop:grid-cols-4 gap-6 items-stretch">
              {favoriteBottles.map((bottle, idx) => {
                const perfume = perfumes.find(p => p.id === bottle.perfume_id);
                if (!perfume) return null;

                return (
                  <div 
                    key={`${activeTab}-${bottle.id}`} 
                    className="bg-white p-5 border border-hairline flex flex-col justify-between h-full space-y-4 hover:border-ink transition-colors animate-card-enter"
                    style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                  >
                    <div className="space-y-3">
                      <div 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="h-48 bg-surface border border-hairline flex items-center justify-center relative cursor-pointer p-3"
                      >
                        <Bottle fragranceId={perfume.id} name={perfume.name} brand={perfume.brand} size="sm" showFill={false} />
                        <span className="absolute top-2 right-2 text-ink bg-white border border-hairline p-1.5 toggle-icon" aria-label={translations[locale].libraryView.favoriteBadgeAria}>
                          <Heart className="w-3.5 h-3.5 fill-current" />
                        </span>
                      </div>

                      <div>
                        <span className="text-xs uppercase font-medium text-secondary block tracking-wider">{perfume.brand}</span>
                        <h3 
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="text-[18px] leading-[24px] font-medium text-ink mt-1 cursor-pointer hover:underline line-clamp-2 h-[48px]"
                        >
                          {perfume.name}
                        </h3>
                      </div>

                      {/* "Why I love it" text on Favorites renders in serif italic like a note in a diary */}
                      {(() => {
                        const relStory = stories.find(s => s.perfume_id === perfume.id);
                        const relWear = wearLogs.find(w => w.perfume_id === perfume.id && w.note);
                        const noteText = relStory?.body || relWear?.note || (translations[locale].libraryView.aromaKhasYangSelaluMemberiRasaTenang);
                        return (
                          <div className="bg-surface p-3 border-l-2 border-bar space-y-1">
                            <span className="text-[12px] uppercase tracking-wider text-secondary font-medium block">
                              {translations[locale].libraryView.catatanDiary}
                            </span>
                            <p className="font-serif italic text-[14px] leading-[20px] text-bar">
                              “{noteText.length > 120 ? `${noteText.slice(0, 120)}…` : noteText}”
                            </p>
                          </div>
                        );
                      })()}

                      {/* Rule 2: NO fill bar or remaining % on Favorites shelf */}
                      <div className="flex justify-between items-baseline text-xs text-secondary pt-2 border-t border-hairline">
                        <span className="font-mono">{perfume.primary_family} · {perfume.concentration}</span>
                        <span className="font-mono text-xs">
                          {bottle.times_worn || 0}x {translations[locale].libraryView.dipakai}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onLogWear(bottle.id)}
                      className="w-full min-h-[48px] py-3 bg-bar hover:bg-ink text-paper text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
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
          <p className="text-[14px] leading-[20px] text-secondary">
            {translations[locale].libraryView.arsipBotolYangTelahKosongAtauAromaM}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 desktop:grid-cols-4 gap-6 items-stretch">
              {memoryBottles.map((bottle, idx) => {
                const perfume = perfumes.find(p => p.id === bottle.perfume_id);
                if (!perfume) return null;

                return (
                  <div 
                    key={`${activeTab}-${bottle.id}`} 
                    className="bg-white p-5 border border-hairline flex flex-col justify-between h-full space-y-4 hover:border-ink transition-colors animate-card-enter"
                    style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                  >
                    <div className="space-y-3">
                      <div 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="h-48 bg-surface border border-hairline flex items-center justify-center relative cursor-pointer p-3 opacity-60"
                      >
                        <Bottle fragranceId={perfume.id} name={perfume.name} brand={perfume.brand} size="sm" showFill={false} />
                        <span className="absolute top-2 right-2 text-xs font-mono px-2 py-0.5 bg-white border border-hairline text-secondary">
                          {translations[locale].libraryView.habis0Ml}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs uppercase font-medium text-secondary block tracking-wider">{perfume.brand}</span>
                        <h3 
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="text-[18px] leading-[24px] font-medium line-through text-secondary mt-1 cursor-pointer hover:underline line-clamp-2 h-[48px]"
                        >
                          {perfume.name}
                        </h3>
                      </div>

                      <p className="text-[14px] leading-[20px] text-secondary">
                        {fmt(translations[locale].libraryView.telahDisemprotSebanyak0KaliSelamaMen, bottle.times_worn || 0)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectPerfume(perfume.id)}
                      className="w-full min-h-[44px] py-2 border border-bar hover:bg-surface text-ink text-xs font-medium cursor-pointer"
                    >
                      {translations[locale].libraryView.lihatDetail}
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
          <div className="bg-white p-6 md:p-8 border border-hairline">
            <EmptyState
              title={translations[locale].libraryView.profilScentDnaMembutuhkanMinimal3Par}
              body={translations[locale].libraryView.tambahkanMinimal3ParfumKeLemarimuUnt}
              ctaLabel={translations[locale].emptyStates.libraryWishlistCta}
              onCtaClick={() => onNavigateToCatalog ? onNavigateToCatalog() : undefined}
              iconType="shelf"
            />
          </div>
        ) : (
          <div className="space-y-8 bg-white p-6 md:p-8 border border-hairline">
            
            {/* Header Persona */}
            <div className="border-b border-hairline pb-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
                <Sparkles className="w-4 h-4" />
                <span>{translations[locale].libraryView.profilDnaAromaPribadi}</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-normal text-bar">
                {fmt(translations[locale].libraryView.karakterUtama0Devotee, scentDna.dominantFamily)}
              </h2>
              <p className="text-sm text-secondary leading-relaxed max-w-3xl italic">
                "{locale === 'id' ? scentDna.editorialPersonaId : scentDna.editorialPersonaEn}"
              </p>
            </div>

            {/* Grid Metrics & Family Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Left: Olfactive Family Breakdown + Data Table Toggle + Top 8 Notes (bars only; radar moved to Finder results per D-V1 option c) */}
              <div className="md:col-span-7">
                <ScentDnaVisualisation
                  familyBreakdown={scentDna.familyBreakdown}
                  perfumesCount={profilePerfumesCount}
                  topNotes={rankedTopNotes}
                  locale={locale}
                  isDashboard={true}
                  onNavigateToCatalog={onNavigateToCatalog}
                />
              </div>

              {/* Right: Climate Suitability & Stats */}
              <div className="md:col-span-5 bg-surface p-6 border border-hairline space-y-5">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-ink">
                  {translations[locale].libraryView.kesesuaianIklimTropisIndonesia}
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="flex items-center gap-1 font-medium text-ink">
                        <Sun className="w-3.5 h-3.5 text-bar" /> {translations[locale].libraryView.siangTerikOutdoorTropis}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-ink">{scentDna.climateSuitability.tropicalOutdoorPct}%</span>
                    </div>
                    <div className="w-full bg-paper h-2 overflow-hidden border border-hairline">
                      <div className="bg-bar h-full animate-bar-grow" style={{ width: `${scentDna.climateSuitability.tropicalOutdoorPct}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="flex items-center gap-1 font-medium text-ink">
                        <Wind className="w-3.5 h-3.5 text-secondary" /> {translations[locale].libraryView.ruangBerAcSeharianKantor}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-ink">{scentDna.climateSuitability.officeAcPct}%</span>
                    </div>
                    <div className="w-full bg-paper h-2 overflow-hidden border border-hairline">
                      <div className="bg-secondary h-full animate-bar-grow" style={{ width: `${scentDna.climateSuitability.officeAcPct}%`, animationDelay: '30ms' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="flex items-center gap-1 font-medium text-ink">
                        <Clock className="w-3.5 h-3.5 text-secondary" /> {translations[locale].libraryView.malamHariCuacaHujan}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-ink">{scentDna.climateSuitability.eveningRainPct}%</span>
                    </div>
                    <div className="w-full bg-paper h-2 overflow-hidden border border-hairline">
                      <div className="bg-bar h-full animate-bar-grow" style={{ width: `${scentDna.climateSuitability.eveningRainPct}%`, animationDelay: '60ms' }}></div>
                    </div>
                  </div>
                </div>

                {/* Wardrobe Summary Card */}
                <div className="pt-4 border-t border-hairline space-y-2 text-[12px] leading-[16px]">
                  <div className="flex justify-between">
                    <span className="text-secondary">{translations[locale].libraryView.totalVolumeTersisa}</span>
                    <span className="font-mono tabular-nums font-bold">{scentDna.totalVolumeMl} ml</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">{translations[locale].libraryView.rataRataSisaIsiBotol}</span>
                    <span className="font-mono tabular-nums font-bold">{scentDna.averageRemainingPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">{translations[locale].libraryView.totalNilaiKoleksi}</span>
                    <span className="font-mono tabular-nums font-bold">{formatCurrency(summary.totalCollectionValueIdr, locale)}</span>
                  </div>
                </div>

              </div>

            </div>

          {/* ── REKOMENDASI PARFUM BERDASARKAN SCENT DNA ── */}
          {dnaRecommendedPerfumes.length > 0 && (
            <div className="pt-6 border-t border-hairline space-y-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-[12px] uppercase tracking-wider font-semibold text-ink flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-bar" />
                    <span>{translations[locale].libraryView.dnaRecsHeading}</span>
                  </h3>
                  <p className="text-[12px] text-secondary">
                    {fmt(translations[locale].libraryView.dnaRecsSubtitle, scentDna.dominantFamily)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                {dnaRecommendedPerfumes.map(rec => (
                  <div 
                    key={rec.id}
                    className="bg-surface/60 border border-hairline p-4 flex flex-col justify-between space-y-3 hover:border-bar transition h-full"
                  >
                    <div>
                      <div className="flex justify-between text-[12px] font-mono text-secondary">
                        <span>{translations[locale].libraryView.dnaMatchBadge}</span>
                        <span className="uppercase">{rec.origin}</span>
                      </div>
                      <h4 
                        onClick={() => onSelectPerfume(rec.id)}
                        className="font-sans text-[18px] leading-[24px] font-medium text-ink mt-1 cursor-pointer hover:underline line-clamp-2"
                      >
                        {rec.name}
                      </h4>
                      <p className="text-[12px] text-secondary font-mono">{rec.brand} · {rec.concentration}</p>
                      <p className="text-[12px] leading-[18px] text-bar mt-1.5 line-clamp-2">
                        {rec.top_notes}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-hairline flex items-center justify-between">
                      <span className="text-[12px] font-mono tabular-nums font-semibold text-ink">{formatCurrency(rec.reference_price_idr, locale)}</span>
                      <button
                        onClick={() => onSelectPerfume(rec.id)}
                        className="text-[12px] text-ink hover:underline font-semibold"
                      >
                        {translations[locale].libraryView.openDetails}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PENCAPAIAN KOLEKTOR (ACHIEVEMENT BADGES SYSTEM) ── */}
          <div className="pt-6 border-t border-hairline space-y-4">
            <div className="flex justify-between items-baseline">
              <div>
                <h3 className="text-[12px] uppercase tracking-wider font-semibold text-ink flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-bar" />
                  <span>Lencana Pencapaian Kolektor (Collector Achievements)</span>
                </h3>
                <p className="text-[12px] text-secondary">
                  {translations[locale].libraryView.badgesDesc}
                </p>
              </div>
              <span className="text-[12px] font-mono tabular-nums text-secondary">
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
                      ? 'bg-paper border-bar' 
                      : 'bg-surface/40 border-hairline opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 border shrink-0 ${
                      badge.isUnlocked 
                        ? 'bg-bar text-paper border-bar' 
                        : 'bg-surface text-secondary border-hairline'
                    }`}>
                      <Award className="w-4 h-4" />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-sans font-medium text-[14px] leading-[20px] text-ink truncate">
                          {locale === 'id' ? badge.titleId : badge.titleEn}
                        </h4>
                        <span className="text-[12px] font-mono uppercase px-1.5 py-0.5 border bg-surface border-hairline text-bar">
                          {badge.tier}
                        </span>
                      </div>

                      <p className="text-[12px] leading-[18px] text-secondary line-clamp-2">
                        {locale === 'id' ? badge.descriptionId : badge.descriptionEn}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[12px] font-mono tabular-nums">
                        <span className={badge.isUnlocked ? 'text-ink font-semibold' : 'text-secondary'}>
                          {badge.isUnlocked ? translations[locale].libraryView.unlockedBadge : fmt(translations[locale].libraryView.progressLabel, badge.progress, badge.maxProgress)}
                        </span>
                        {badge.unlockedAt && (
                          <span className="text-secondary">{badge.unlockedAt}</span>
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
        locale={locale}
        title={translations[locale].libraryView.tambahParfumKeLemarimu}
        subtitle={translations[locale].libraryView.kurasiKoleksiBotolParfumPersonalmu}
        maxWidth="max-w-lg"
      >
        {/* Mode Selector: Cari di Katalog vs Input Manual */}
        <div className="grid grid-cols-2 border border-bar text-center text-[12px] p-0.5 bg-surface">
          <button
            type="button"
            onClick={() => setAddMode('catalog')}
            className={`min-h-[44px] py-2 font-semibold transition ${addMode === 'catalog' ? 'bg-bar text-paper' : 'text-secondary hover:text-ink'}`}
          >
            {fmt(translations[locale].libraryView.pilihDariKatalog0Kurasi, perfumes.length)}
          </button>
          <button
            type="button"
            onClick={() => setAddMode('custom')}
            className={`min-h-[44px] py-2 font-semibold transition ${addMode === 'custom' ? 'bg-bar text-paper' : 'text-secondary hover:text-ink'}`}
          >
            Tambah Manual (Custom / Privat)
          </button>
        </div>

        <form onSubmit={handleSaveAddBottle} className="space-y-4 text-[12px]">
          {/* MODE 1: PILIH DARI KATALOG */}
          {addMode === 'catalog' ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold block text-ink">{translations[locale].libraryView.searchCatalogLabel}</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-secondary absolute left-3 top-3 pointer-events-none" />
                  <input 
                    type="text"
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    placeholder={translations[locale].libraryView.searchPlaceholder}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-paper border border-border text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>
              </div>

              {/* Candidates List */}
              <div className="max-h-40 overflow-y-auto divide-y divide-hairline border border-hairline bg-paper">
                {filteredCatalogOptions.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => handleSelectCatalogPerfume(p)}
                    className={`p-3 min-h-[44px] flex justify-between items-center cursor-pointer transition ${
                      selectedCatalogId === p.id ? 'bg-surface font-bold border-l-4 border-l-bar' : 'hover:bg-surface'
                    }`}
                  >
                    <div>
                      <span className="text-[12px] uppercase text-secondary">{p.brand}</span>
                      <p className="text-[14px] font-sans font-medium text-ink">{p.name}</p>
                    </div>
                    <span className="font-mono tabular-nums text-[12px] text-secondary">{p.concentration} · {p.reference_price_size_ml}ml</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* MODE 2: INPUT MANUAL DENGAN DUPLICATE DETECTION ("DID YOU MEAN...?") */
            <div className="space-y-3 bg-surface p-4 border border-hairline">
              <div className="space-y-1">
                <label className="font-semibold block text-ink">{translations[locale].libraryView.brandNameLabel}</label>
                <input 
                  type="text"
                  value={customBrand}
                  onChange={e => setCustomBrand(e.target.value)}
                  placeholder={translations[locale].libraryView.brandExamplePlaceholder}
                  className="w-full min-h-[44px] p-2 bg-paper border border-border text-[14px] text-ink"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-ink">{translations[locale].libraryView.variantNameLabel}</label>
                <input 
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder={translations[locale].libraryView.variantExamplePlaceholder}
                  className="w-full min-h-[44px] p-2 bg-paper border border-border text-[14px] text-ink"
                  required
                />
              </div>

              {/* Duplicate Detection Alert */}
              {detectedCatalogDuplicate && (
                <div className="p-3 bg-surface border border-border text-ink space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[12px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-bar" />
                    <span>Apakah maksudmu: {detectedCatalogDuplicate.brand} — {detectedCatalogDuplicate.name}?</span>
                  </div>
                  <p className="text-[12px] text-secondary">
                    {translations[locale].libraryView.duplicateNotice}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectCatalogPerfume(detectedCatalogDuplicate);
                      setAddMode('catalog');
                    }}
                    className="min-h-[44px] text-[12px] font-bold underline text-ink mt-1 flex items-center"
                  >
                    {translations[locale].libraryView.chooseCatalogData}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold block text-ink">Konsentrasi</label>
                  <select 
                    value={customConcentration}
                    onChange={e => setCustomConcentration(e.target.value as any)}
                    className="w-full min-h-[44px] p-2 bg-paper border border-border text-[14px] text-ink"
                  >
                    <option value="EDP">EDP</option>
                    <option value="EDT">EDT</option>
                    <option value="Extrait">Extrait de Parfum</option>
                    <option value="EDC">EDC</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold block text-ink">{translations[locale].catalogView.familyHeading}</label>
                  <select 
                    value={customFamily}
                    onChange={e => setCustomFamily(e.target.value)}
                    className="w-full min-h-[44px] p-2 bg-paper border border-border text-[14px] text-ink"
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
          <div className="space-y-3 pt-2 border-t border-hairline">
            {/* Big tappable size chips (2 / 5 / 10 / 30 / 50 / 75 / 100 ml) */}
            <div className="space-y-1.5">
              <label className="font-semibold block text-ink text-[12px] uppercase tracking-wider">
                {translations[locale].libraryView.pilihUkuranBotolMl}
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
                        ? 'bg-bar text-paper border-bar'
                        : 'bg-white text-ink border-hairline hover:border-ink'
                    }`}
                  >
                    {sz} ml
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold block text-ink text-xs">{translations[locale].libraryView.ukuranPenuhMl}</label>
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
                  required
                />
              </div>

            <div className="space-y-1">
              <label className="font-semibold block text-ink">{translations[locale].libraryView.remainingLiquidLabel}</label>
              <input 
                type="number" 
                inputMode="numeric"
                min="0" 
                max={bottleSize}
                step="0.5"
                value={bottleRemaining}
                onChange={e => setBottleRemaining(Number(e.target.value))}
                className="w-full min-h-[44px] p-2 bg-paper border border-border text-[14px] font-mono tabular-nums text-ink"
                required
              />
            </div>
          </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold block text-ink">Harga Pembelian (Rp)</label>
              <input 
                type="number" 
                inputMode="numeric"
                value={bottlePrice}
                onChange={e => setBottlePrice(Number(e.target.value))}
                className="w-full min-h-[44px] p-2 bg-paper border border-border text-[14px] font-mono tabular-nums text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold block text-ink">{translations[locale].libraryView.initialStatusLabel}</label>
              <select 
                value={bottleStatus}
                onChange={e => setBottleStatus(e.target.value as any)}
                className="w-full min-h-[44px] p-2 bg-paper border border-border text-[14px] text-ink"
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
              className="accent-bar w-4 h-4"
            />
            <span className="font-medium text-[12px] text-ink">{translations[locale].libraryView.markFavoriteLabel}</span>
          </label>

          <div className="flex justify-end gap-3 pt-3 border-t border-hairline">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="min-h-[48px] px-4 py-2 border border-border hover:border-bar text-[14px] font-medium text-ink"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-6 py-2 bg-bar hover:bg-ink text-paper text-[14px] font-medium"
            >
              {translations[locale].libraryView.saveBottleToWardrobe}
            </button>
          </div>
        </form>
      </BottomSheetOrModal>

      {/* ── BOTTOM SHEET / MODAL: UPDATE LEVEL (REMAINING ML) & EDIT BOTOL ── */}
      <BottomSheetOrModal
        isOpen={Boolean(editingBottle)}
        onClose={() => setEditingBottle(null)}
        locale={locale}
        title={translations[locale].libraryView.editVolumeSisaBotol}
        subtitle={translations[locale].libraryView.perbaruiSisaVolumeCairanBotolParfum}
        maxWidth="max-w-sm"
      >
        {editingBottle && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-[12px]">
            <div className="space-y-1.5">
              <label className="font-semibold block text-ink">{translations[locale].libraryView.remainingLiquidLabel}</label>
              <input 
                type="number"
                inputMode="numeric"
                min="0"
                max={editingBottle.size_ml}
                step="0.5"
                value={editRemainingMl}
                onChange={e => setEditRemainingMl(Number(e.target.value))}
                className="w-full min-h-[44px] p-2.5 bg-paper border border-border font-mono tabular-nums text-[14px] text-ink"
                required
              />
              <div className="flex justify-between items-center text-[12px] text-secondary">
                <span>{fmt(translations[locale].libraryView.fullSizeLabel, editingBottle.size_ml)}</span>
                <span className="font-mono tabular-nums">
                  {editingBottle.size_ml > 0 ? Math.round((editRemainingMl / editingBottle.size_ml) * 100) : 0}% {translations[locale].libraryView.percentRemaining}
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
                  className="min-h-[44px] bg-surface border border-hairline hover:border-bar text-[12px] font-mono tabular-nums font-bold text-ink"
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
                className="accent-bar w-4 h-4"
              />
              <span className="font-medium text-[12px] text-ink">{translations[locale].libraryView.makeFavoriteLabel}</span>
            </label>

            <div className="flex justify-between items-center pt-3 border-t border-hairline">
              <button
                type="button"
                onClick={() => {
                  onDeleteBottle(editingBottle.id);
                  setEditingBottle(null);
                }}
                className="min-h-[48px] text-error hover:underline flex items-center gap-1 text-[12px] font-medium px-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{translations[locale].libraryView.deleteBottleLabel}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBottle(null)}
                  className="min-h-[48px] px-3 py-1.5 border border-border hover:border-bar text-[14px] font-medium text-ink"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] px-5 py-1.5 bg-bar text-paper hover:bg-ink font-medium text-[14px]"
                >
                  {translations[locale].admin.formSave}
                </button>
              </div>
            </div>
          </form>
        )}
      </BottomSheetOrModal>

    </div>
  );
};
