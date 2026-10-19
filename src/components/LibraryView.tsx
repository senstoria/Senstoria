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
  BookOpen
} from 'lucide-react';
import { 
  BottleState, 
  calculateRemainingPercentage, 
  isLowBottle, 
  computeCollectionSummary, 
  computeScentDna 
} from '../lib/derivedCalculations.ts';
import { SeedPerfume, SEED_PERFUMES } from '../data/seedPerfumes.ts';
import { Locale, formatCurrency } from '../lib/i18n.ts';

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
  locale
}) => {
  const [activeTab, setActiveTab] = useState<ShelfTab>('wearing');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'catalog' | 'custom'>('catalog');

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
  const scentDna = useMemo(() => computeScentDna(bottles, perfumes), [bottles, perfumes]);

  // Active Shelves filtering
  const currentlyWearingBottles = bottles.filter(b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed'));
  const favoriteBottles = bottles.filter(b => !b.deleted_at && b.is_favorite && b.status !== 'finished');
  const memoryBottles = bottles.filter(b => !b.deleted_at && b.status === 'finished');
  const wishlistPerfumes = wishlistIds
    .map(id => perfumes.find(p => p.id === id))
    .filter((p): p is SeedPerfume => Boolean(p));

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
      
      {/* ── TOP SHELF BANNER & HEADER ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D9D7C9] pb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#5C5C5C] font-semibold">
            {locale === 'id' ? 'Koleksi Pribadi' : 'Personal Shelf & Wardrobe'}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-normal mt-1">
            {locale === 'id' ? 'Lemari Wewangian & Scent DNA' : 'Fragrance Library & Scent DNA'}
          </h1>
          <p className="text-xs text-[#5C5C5C] mt-1 font-mono">
            {summary.currentlyWearingCount} {locale === 'id' ? 'botol aktif' : 'active bottles'} · {summary.favoritesCount} {locale === 'id' ? 'favorit' : 'favorites'} · {locale === 'id' ? 'Valuasi Koleksi' : 'Total Value'}: {formatCurrency(summary.totalCollectionValueIdr, locale)}
          </p>
        </div>

        {/* Action: Add bottle to shelf */}
        <button
          onClick={() => {
            setAddMode('catalog');
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2 bg-[#333333] hover:bg-black text-[#FFFEF2] text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{locale === 'id' ? 'Tambah Botol ke Lemari' : 'Add Bottle to Shelf'}</span>
        </button>
      </div>

      {/* ── 4 RAK (FOUR SHELVES) + SCENT DNA NAVIGATION TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-[#D9D7C9]/70 scrollbar-none">
        
        {/* Rak 1: Sedang Dipakai (In Use) */}
        <button
          onClick={() => setActiveTab('wearing')}
          className={`px-4 py-2 whitespace-nowrap transition font-medium flex items-center gap-2 ${
            activeTab === 'wearing'
              ? 'bg-[#333333] text-[#FFFEF2]'
              : 'bg-white border border-[#D9D7C9] text-[#5C5C5C] hover:border-black hover:text-black'
          }`}
        >
          <span>{locale === 'id' ? 'Sedang Dipakai' : 'Currently Wearing'}</span>
          <span className="font-mono text-[11px] opacity-80">({currentlyWearingBottles.length})</span>
        </button>

        {/* Rak 2: Ingin Dicoba (Wishlist) */}
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-4 py-2 whitespace-nowrap transition font-medium flex items-center gap-2 ${
            activeTab === 'wishlist'
              ? 'bg-[#333333] text-[#FFFEF2]'
              : 'bg-white border border-[#D9D7C9] text-[#5C5C5C] hover:border-black hover:text-black'
          }`}
        >
          <span>{locale === 'id' ? 'Ingin Dicoba (Wishlist)' : 'Want to Try'}</span>
          <span className="font-mono text-[11px] opacity-80">({wishlistPerfumes.length})</span>
        </button>

        {/* Rak 3: Favorit */}
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 whitespace-nowrap transition font-medium flex items-center gap-2 ${
            activeTab === 'favorites'
              ? 'bg-[#333333] text-[#FFFEF2]'
              : 'bg-white border border-[#D9D7C9] text-[#5C5C5C] hover:border-black hover:text-black'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>{locale === 'id' ? 'Favorit' : 'Favorites'}</span>
          <span className="font-mono text-[11px] opacity-80">({favoriteBottles.length})</span>
        </button>

        {/* Rak 4: Kenangan (Finished & Memories) */}
        <button
          onClick={() => setActiveTab('memories')}
          className={`px-4 py-2 whitespace-nowrap transition font-medium flex items-center gap-2 ${
            activeTab === 'memories'
              ? 'bg-[#333333] text-[#FFFEF2]'
              : 'bg-white border border-[#D9D7C9] text-[#5C5C5C] hover:border-black hover:text-black'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>{locale === 'id' ? 'Kenangan & Botol Habis' : 'Memories & Empties'}</span>
          <span className="font-mono text-[11px] opacity-80">({memoryBottles.length})</span>
        </button>

        {/* Dashboard: Scent DNA */}
        <button
          onClick={() => setActiveTab('dna')}
          className={`px-4 py-2 whitespace-nowrap transition font-medium flex items-center gap-2 ${
            activeTab === 'dna'
              ? 'bg-[#8A4B14] text-[#FFFEF2]'
              : 'bg-white border border-[#8A4B14]/40 text-[#8A4B14] hover:bg-[#8A4B14] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{locale === 'id' ? 'Dashboard Scent DNA' : 'Scent DNA Analysis'}</span>
        </button>

      </div>

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
            <div className="p-12 text-center bg-white border border-[#D9D7C9] space-y-4">
              <Droplet className="w-8 h-8 mx-auto text-[#5C5C5C]" />
              <h3 className="font-serif text-2xl font-normal">
                {locale === 'id' ? 'Belum ada botol di rak Sedang Dipakai.' : 'No bottles currently in rotation.'}
              </h3>
              <p className="text-xs text-[#5C5C5C] max-w-md mx-auto">
                Tambahkan botol wewangian yang kamu miliki sekarang agar Senstoria dapat membangun profil Scent DNA dan memprediksi rekomendasi yang tepat.
              </p>
              <button
                onClick={() => {
                  setAddMode('catalog');
                  setIsAddModalOpen(true);
                }}
                className="px-6 py-2.5 bg-[#333333] hover:bg-black text-[#FFFEF2] text-xs font-semibold"
              >
                + Tambah Botol Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {currentlyWearingBottles.map(bottle => {
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

                const percentage = calculateRemainingPercentage(bottle);
                const low = isLowBottle(bottle);

                return (
                  <div 
                    key={bottle.id} 
                    className={`bg-white p-5 border ${low ? 'border-[#B3261E]' : 'border-[#D9D7C9]'} flex flex-col justify-between space-y-4 transition-all hover:border-black`}
                  >
                    {/* Top Thumbnail & Action Badges */}
                    <div className="space-y-3">
                      <div 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="h-44 bg-[#F4F3E6] border border-[#D9D7C9] flex items-center justify-center relative cursor-pointer group"
                      >
                        <svg width="60" height="90" viewBox="0 0 60 90" fill="none" stroke="#333333" strokeWidth="1.5" className="opacity-80 group-hover:opacity-100 transition">
                          <rect x="22" y="5" width="16" height="12" />
                          <rect x="26" y="2" width="8" height="3" />
                          <rect x="10" y="17" width="40" height="68" rx="2" />
                          <circle cx="30" cy="50" r="12" strokeDasharray="2 2" />
                        </svg>

                        {/* Favorite button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBottle(bottle.id, { is_favorite: !bottle.is_favorite });
                          }}
                          className={`absolute top-2 right-2 p-1.5 bg-white border border-[#D9D7C9] hover:bg-[#F4F3E6] transition ${
                            bottle.is_favorite ? 'text-red-600' : 'text-[#5C5C5C]'
                          }`}
                          title="Toggle Favorite"
                        >
                          <Heart className={`w-3.5 h-3.5 ${bottle.is_favorite ? 'fill-current' : ''}`} />
                        </button>

                        {/* Low Bottle Alert Tag */}
                        {low && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold text-[#B3261E] bg-red-50 border border-red-200 px-1.5 py-0.5">
                            Menipis (&lt;=20%)
                          </span>
                        )}

                        <span className="absolute bottom-2 left-2 text-[10px] font-mono px-1.5 py-0.5 bg-white/95 border border-[#D9D7C9]">
                          {bottle.times_worn || 0}x dipakai
                        </span>
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex justify-between items-baseline text-xs text-[#5C5C5C]">
                          <span className="font-semibold uppercase tracking-wider">{perfume.brand}</span>
                          <span className="font-mono">{perfume.concentration}</span>
                        </div>

                        <h3 
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="font-serif text-xl font-bold mt-0.5 cursor-pointer hover:underline line-clamp-1"
                        >
                          {perfume.name}
                        </h3>

                        <p className="text-xs text-[#5C5C5C] mt-1 line-clamp-1">
                          {perfume.top_notes}
                        </p>
                      </div>

                      {/* Fill Level Progress Bar (BR-02) */}
                      <div className="space-y-1 pt-1 border-t border-[#D9D7C9]">
                        <div className="w-full bg-[#E5E3D3] h-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${low ? 'bg-[#B3261E]' : 'bg-[#333333]'}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-[#5C5C5C]">
                          <span>{percentage}% sisa</span>
                          <span>{bottle.remaining_ml} / {bottle.size_ml} ml</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action CTAs */}
                    <div className="space-y-2 pt-2 border-t border-[#D9D7C9]">
                      <button 
                        onClick={() => onLogWear(bottle.id)} 
                        className="w-full py-2 bg-[#333333] hover:bg-black text-[#FFFEF2] text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Droplet className="w-3.5 h-3.5" />
                        <span>Catat Semprotan Hari Ini</span>
                      </button>

                      {low && (
                        <a 
                          href={`/go/${perfume.id}?platform=shopee&src=low_bottle`}
                          target="_blank"
                          rel="sponsored nofollow noopener"
                          className="block text-center py-1.5 border border-[#B3261E] text-[#B3261E] text-xs font-medium hover:bg-red-50 transition"
                        >
                          Beli Ulang Sebelum Habis (Shopee)
                        </a>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 text-[#5C5C5C]">
                        <button
                          onClick={() => handleOpenEdit(bottle)}
                          className="hover:text-black flex items-center gap-1 text-[11px]"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Volume</span>
                        </button>
                        <button
                          onClick={() => handleMarkAsFinished(bottle)}
                          className="hover:text-amber-800 flex items-center gap-1 text-[11px]"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Tandai Habis</span>
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
          <p className="text-xs text-[#5C5C5C]">
            {locale === 'id' 
              ? 'Wewangian yang menarik minatmu dan ingin kamu coba atau miliki di masa mendatang.' 
              : 'Fragrances you have bookmarked to test, sample, or purchase in the future.'}
          </p>

          {wishlistPerfumes.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#D9D7C9] space-y-4">
              <Heart className="w-8 h-8 mx-auto text-[#5C5C5C]" />
              <h3 className="font-serif text-2xl font-normal">Wishlist masih kosong.</h3>
              <p className="text-xs text-[#5C5C5C] max-w-md mx-auto">
                Jelajahi katalog dan klik ikon hati pada parfum yang menarik perhatianmu untuk menyimpannya di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {wishlistPerfumes.map(perfume => (
                <div key={perfume.id} className="bg-white p-5 border border-[#D9D7C9] space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div 
                      onClick={() => onSelectPerfume(perfume.id)}
                      className="h-44 bg-[#F4F3E6] border border-[#D9D7C9] flex items-center justify-center relative cursor-pointer"
                    >
                      <svg width="60" height="90" viewBox="0 0 60 90" fill="none" stroke="#333333" strokeWidth="1.5" className="opacity-80">
                        <rect x="22" y="5" width="16" height="12" />
                        <rect x="26" y="2" width="8" height="3" />
                        <rect x="10" y="17" width="40" height="68" rx="2" />
                      </svg>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveWishlist(perfume.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white border border-[#D9D7C9] text-red-600 hover:bg-[#F4F3E6]"
                        title="Hapus dari wishlist"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#5C5C5C] block tracking-wider">
                        {perfume.brand} · {perfume.concentration}
                      </span>
                      <h3 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="font-serif text-xl font-bold mt-0.5 cursor-pointer hover:underline"
                      >
                        {perfume.name}
                      </h3>
                      <p className="text-xs text-[#5C5C5C] mt-1 line-clamp-1">{perfume.top_notes}</p>
                    </div>

                    <div className="text-xs font-mono font-bold pt-1 border-t border-[#D9D7C9]">
                      {formatCurrency(perfume.reference_price_idr, locale)} ({perfume.reference_price_size_ml}ml)
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#D9D7C9]">
                    <button
                      onClick={() => {
                        handleSelectCatalogPerfume(perfume);
                        setBottleStatus('in_use');
                        setAddMode('catalog');
                        setIsAddModalOpen(true);
                      }}
                      className="w-full py-2 bg-[#333333] hover:bg-black text-[#FFFEF2] text-xs font-semibold transition"
                    >
                      Sudah Punya (Pindah ke Lemari)
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => onOpenTryItFirst(perfume.id)}
                        className="py-1.5 border border-[#333333] hover:bg-[#F4F3E6] text-xs font-medium"
                      >
                        Coba Dulu
                      </button>
                      <a
                        href={`/go/${perfume.id}?platform=shopee&src=wishlist_shelf`}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        className="py-1.5 bg-[#F4F3E6] border border-[#D9D7C9] text-center text-xs font-medium hover:bg-neutral-200"
                      >
                        Beli Shopee
                      </a>
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
            <div className="p-12 text-center bg-white border border-[#D9D7C9] space-y-4">
              <Heart className="w-8 h-8 mx-auto text-red-500" />
              <h3 className="font-serif text-2xl font-normal">Belum ada botol favorit.</h3>
              <p className="text-xs text-[#5C5C5C] max-w-md mx-auto">
                Beri tanda hati pada botol di lemari yang paling sering kamu pakai atau paling kamu sukai.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {favoriteBottles.map(bottle => {
                const perfume = perfumes.find(p => p.id === bottle.perfume_id);
                if (!perfume) return null;
                const percentage = calculateRemainingPercentage(bottle);

                return (
                  <div key={bottle.id} className="bg-white p-5 border border-[#D9D7C9] space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#5C5C5C]">{perfume.brand}</span>
                        <h3 className="font-serif text-xl font-bold">{perfume.name}</h3>
                      </div>
                      <span className="text-red-600 bg-red-50 border border-red-200 p-1">
                        <Heart className="w-4 h-4 fill-current" />
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full bg-[#E5E3D3] h-1.5 overflow-hidden">
                        <div className="bg-[#333333] h-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-[#5C5C5C]">
                        <span>{percentage}% sisa</span>
                        <span>{bottle.times_worn || 0}x dipakai</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onLogWear(bottle.id)}
                      className="w-full py-2 bg-[#333333] hover:bg-black text-[#FFFEF2] text-xs font-semibold"
                    >
                      Catat Semprotan
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
          <p className="text-xs text-[#5C5C5C]">
            {locale === 'id' 
              ? 'Arsip botol yang telah kosong atau aroma masa lalu yang memiliki kenangan emosional berharga.' 
              : 'Emptied bottles and archived fragrance memories preserving your personal olfactory journey.'}
          </p>

          {memoryBottles.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#D9D7C9] space-y-4">
              <Archive className="w-8 h-8 mx-auto text-[#5C5C5C]" />
              <h3 className="font-serif text-2xl font-normal">Belum ada botol di rak Kenangan.</h3>
              <p className="text-xs text-[#5C5C5C] max-w-md mx-auto">
                Ketika botol wewangianmu habis (0 ml), pindahkan ke rak Kenangan untuk menyimpan jejak pemakaian dan histori aromanya.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {memoryBottles.map(bottle => {
                const perfume = perfumes.find(p => p.id === bottle.perfume_id);
                if (!perfume) return null;

                return (
                  <div key={bottle.id} className="bg-white p-5 border border-[#D9D7C9] space-y-4 opacity-90">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#5C5C5C]">{perfume.brand}</span>
                        <h3 className="font-serif text-xl font-bold line-through text-[#5C5C5C]">{perfume.name}</h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 border border-neutral-300">
                        Habis (0 ml)
                      </span>
                    </div>

                    <p className="text-xs text-[#5C5C5C]">
                      Telah disemprot sebanyak <strong>{bottle.times_worn || 0} kali</strong> selama menemani aktivitasmu.
                    </p>

                    <div className="pt-2 border-t border-[#D9D7C9] flex justify-between items-center text-xs">
                      <a
                        href={`/go/${perfume.id}?platform=shopee&src=memories_shelf`}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        className="text-[#8A4B14] hover:underline font-semibold"
                      >
                        Beli Ulang di Shopee →
                      </a>
                      <button
                        onClick={() => onDeleteBottle(bottle.id)}
                        className="text-[#5C5C5C] hover:text-red-700"
                        title="Hapus permanen dari arsip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB 5: DASHBOARD SCENT DNA ══════════════ */}
      {activeTab === 'dna' && (
        <div className="space-y-8 bg-white p-6 md:p-8 border border-[#D9D7C9]">
          
          {/* Header Persona */}
          <div className="border-b border-[#D9D7C9] pb-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8A4B14]">
              <Sparkles className="w-4 h-4" />
              <span>Profil DNA Aroma Pribadi</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-[#1A1A1A]">
              Karakter Utama: {scentDna.dominantFamily} Devotee
            </h2>
            <p className="text-sm text-[#5C5C5C] leading-relaxed max-w-3xl italic">
              "{locale === 'id' ? scentDna.editorialPersonaId : scentDna.editorialPersonaEn}"
            </p>
          </div>

          {/* Grid Metrics & Family Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left: Olfactive Family Breakdown */}
            <div className="md:col-span-7 space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A1A]">
                Distribusi Keluarga Olfaktif Koleksimu
              </h3>

              <div className="space-y-3">
                {scentDna.familyBreakdown.map(item => (
                  <div key={item.family} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">{item.family}</span>
                      <span className="font-mono text-[#5C5C5C]">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-[#E5E3D3] h-2.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          item.family === 'Woody' ? 'bg-[#333333]' :
                          item.family === 'Floral' ? 'bg-[#8A4B14]' :
                          item.family === 'Fresh' ? 'bg-[#7F8F3F]' :
                          item.family === 'Ambery' ? 'bg-amber-700' :
                          'bg-neutral-600'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Notes Cloud */}
              <div className="pt-4 border-t border-[#D9D7C9] space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A1A]">
                  Notes Paling Sering Muncul di Lemari
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {scentDna.topNotes.map(n => (
                    <span 
                      key={n.note} 
                      className="px-2.5 py-1 bg-[#F4F3E6] border border-[#D9D7C9] text-xs font-medium text-[#1A1A1A]"
                    >
                      {n.note}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Climate Suitability & Stats */}
            <div className="md:col-span-5 bg-[#F4F3E6] p-6 border border-[#D9D7C9] space-y-5">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A1A]">
                Kesesuaian Iklim Tropis Indonesia
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Sun className="w-3.5 h-3.5 text-amber-600" /> Siang Terik Outdoor Tropis
                    </span>
                    <span className="font-mono font-bold">{scentDna.climateSuitability.tropicalOutdoorPct}%</span>
                  </div>
                  <div className="w-full bg-white h-2 overflow-hidden border border-[#D9D7C9]">
                    <div className="bg-[#8A4B14] h-full" style={{ width: `${scentDna.climateSuitability.tropicalOutdoorPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Wind className="w-3.5 h-3.5 text-blue-600" /> Ruang Ber-AC Seharian (Kantor)
                    </span>
                    <span className="font-mono font-bold">{scentDna.climateSuitability.officeAcPct}%</span>
                  </div>
                  <div className="w-full bg-white h-2 overflow-hidden border border-[#D9D7C9]">
                    <div className="bg-[#333333] h-full" style={{ width: `${scentDna.climateSuitability.officeAcPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-purple-600" /> Malam Hari & Cuaca Hujan
                    </span>
                    <span className="font-mono font-bold">{scentDna.climateSuitability.eveningRainPct}%</span>
                  </div>
                  <div className="w-full bg-white h-2 overflow-hidden border border-[#D9D7C9]">
                    <div className="bg-purple-900 h-full" style={{ width: `${scentDna.climateSuitability.eveningRainPct}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Wardrobe Summary Card */}
              <div className="pt-4 border-t border-[#D9D7C9] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#5C5C5C]">Total Volume Tersisa:</span>
                  <span className="font-mono font-bold">{scentDna.totalVolumeMl} ml</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C5C5C]">Rata-rata Sisa Isi Botol:</span>
                  <span className="font-mono font-bold">{scentDna.averageRemainingPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C5C5C]">Total Nilai Koleksi:</span>
                  <span className="font-mono font-bold">{formatCurrency(summary.totalCollectionValueIdr, locale)}</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ── MODAL: TAMBAH BOTOL KE LEMARI (CAB-04 & CUSTOM DUPLICATE GUARD) ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFEF2] border border-[#333333] max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-[#D9D7C9] pb-3">
              <h3 className="font-serif text-2xl font-bold">
                {locale === 'id' ? 'Tambah Parfum ke Lemarimu' : 'Add Perfume to Library'}
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#5C5C5C] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector: Cari di Katalog vs Input Manual */}
            <div className="grid grid-cols-2 border border-[#333333] text-center text-xs p-0.5 bg-[#F4F3E6]">
              <button
                type="button"
                onClick={() => setAddMode('catalog')}
                className={`py-2 font-semibold transition ${addMode === 'catalog' ? 'bg-[#333333] text-white' : 'text-[#5C5C5C] hover:text-black'}`}
              >
                Pilih dari Katalog (42 Kurasi)
              </button>
              <button
                type="button"
                onClick={() => setAddMode('custom')}
                className={`py-2 font-semibold transition ${addMode === 'custom' ? 'bg-[#333333] text-white' : 'text-[#5C5C5C] hover:text-black'}`}
              >
                Tambah Manual (Custom / Privat)
              </button>
            </div>

            <form onSubmit={handleSaveAddBottle} className="space-y-4 text-xs">
              
              {/* MODE 1: PILIH DARI KATALOG */}
              {addMode === 'catalog' ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold block">Cari Parfum di Katalog</label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#5C5C5C] absolute left-3 top-2.5 pointer-events-none" />
                      <input 
                        type="text"
                        value={catalogSearch}
                        onChange={e => setCatalogSearch(e.target.value)}
                        placeholder="Ketik nama atau brand (cth: HMNS, Oullu)..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#333333] text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Candidates List */}
                  <div className="max-h-36 overflow-y-auto divide-y border border-[#D9D7C9] bg-white">
                    {filteredCatalogOptions.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => handleSelectCatalogPerfume(p)}
                        className={`p-2.5 flex justify-between items-center cursor-pointer transition ${
                          selectedCatalogId === p.id ? 'bg-[#F4F3E6] font-bold border-l-4 border-l-black' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] uppercase text-[#5C5C5C]">{p.brand}</span>
                          <p className="text-xs font-serif">{p.name}</p>
                        </div>
                        <span className="font-mono text-[11px] text-[#5C5C5C]">{p.concentration} · {p.reference_price_size_ml}ml</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* MODE 2: INPUT MANUAL DENGAN DUPLICATE DETECTION ("DID YOU MEAN...?") */
                <div className="space-y-3 bg-[#F4F3E6] p-4 border border-[#D9D7C9]">
                  <div className="space-y-1">
                    <label className="font-semibold block">Nama Brand</label>
                    <input 
                      type="text"
                      value={customBrand}
                      onChange={e => setCustomBrand(e.target.value)}
                      placeholder="Contoh: Le Labo,HMNS, atau Toko Parfum Lokal"
                      className="w-full p-2 bg-white border border-[#333333] text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold block">Nama Varian Parfum</label>
                    <input 
                      type="text"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      placeholder="Contoh: Santal 33, Orgasm, Vanilla Mist"
                      className="w-full p-2 bg-white border border-[#333333] text-xs"
                      required
                    />
                  </div>

                  {/* Duplicate Detection Alert */}
                  {detectedCatalogDuplicate && (
                    <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Apakah maksudmu: {detectedCatalogDuplicate.brand} — {detectedCatalogDuplicate.name}?</span>
                      </div>
                      <p className="text-[11px] text-[#5C5C5C]">
                        Parfum ini sudah ada di katalog kurasi kami dengan data notes terverifikasi.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectCatalogPerfume(detectedCatalogDuplicate);
                          setAddMode('catalog');
                        }}
                        className="text-xs font-bold underline text-amber-900 mt-1"
                      >
                        Pilih Data Kurasi Katalog Saja →
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold block">Konsentrasi</label>
                      <select 
                        value={customConcentration}
                        onChange={e => setCustomConcentration(e.target.value as any)}
                        className="w-full p-2 bg-white border border-[#333333] text-xs"
                      >
                        <option value="EDP">EDP</option>
                        <option value="EDT">EDT</option>
                        <option value="Extrait">Extrait de Parfum</option>
                        <option value="EDC">EDC</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold block">Keluarga Aroma</label>
                      <select 
                        value={customFamily}
                        onChange={e => setCustomFamily(e.target.value)}
                        className="w-full p-2 bg-white border border-[#333333] text-xs"
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
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#D9D7C9]">
                <div className="space-y-1">
                  <label className="font-semibold block">Ukuran Botol Penuh (ml)</label>
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
                    className="w-full p-2 bg-white border border-[#333333] text-xs font-mono"
                    required
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
                    className="w-full p-2 bg-white border border-[#333333] text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">Harga Pembelian (Rp)</label>
                  <input 
                    type="number" 
                    value={bottlePrice}
                    onChange={e => setBottlePrice(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#333333] text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Status Awal</label>
                  <select 
                    value={bottleStatus}
                    onChange={e => setBottleStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-[#333333] text-xs"
                  >
                    <option value="in_use">Sedang Dipakai (In Use)</option>
                    <option value="sealed">Masih Tersegel (Sealed)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input 
                  type="checkbox"
                  checked={bottleIsFavorite}
                  onChange={e => setBottleIsFavorite(e.target.checked)}
                  className="accent-[#333333]"
                />
                <span className="font-medium text-xs">Tandai sebagai Parfum Favorit</span>
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#D9D7C9]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#333333] hover:bg-[#F4F3E6]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#333333] hover:bg-black text-[#FFFEF2] font-semibold"
                >
                  Simpan Botol ke Lemari
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: EDIT BOTOL ── */}
      {editingBottle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFEF2] border border-[#333333] max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <h3 className="font-serif text-xl font-bold">Edit Volume & Status Botol</h3>
            
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold block">Sisa Cairan (ml)</label>
                <input 
                  type="number"
                  min="0"
                  max={editingBottle.size_ml}
                  step="0.5"
                  value={editRemainingMl}
                  onChange={e => setEditRemainingMl(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-[#333333] font-mono text-sm"
                  required
                />
                <span className="text-[11px] text-[#5C5C5C]">Maksimal {editingBottle.size_ml} ml</span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input 
                  type="checkbox"
                  checked={editIsFavorite}
                  onChange={e => setEditIsFavorite(e.target.checked)}
                  className="accent-[#333333]"
                />
                <span className="font-medium">Jadikan Parfum Favorit</span>
              </label>

              <div className="flex justify-between items-center pt-3 border-t border-[#D9D7C9]">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteBottle(editingBottle.id);
                    setEditingBottle(null);
                  }}
                  className="text-red-700 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBottle(null)}
                    className="px-3 py-1.5 border border-[#333333] hover:bg-[#F4F3E6]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#333333] text-white hover:bg-black font-semibold"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
