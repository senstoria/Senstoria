import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Heart, 
  Layers, 
  ExternalLink, 
  ChevronDown,
  Sparkles,
  RotateCcw,
  History,
  Compass,
  ArrowUpDown
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale, formatCurrency } from '../lib/i18n.ts';

interface CatalogViewProps {
  perfumes: SeedPerfume[];
  onSelectPerfume: (id: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onOpenTryItFirst: (id: string) => void;
  initialFilterNote?: string | null;
  initialFilterBrand?: string | null;
  initialFilterFamily?: string | null;
  locale: Locale;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  perfumes,
  onSelectPerfume,
  wishlistIds,
  onToggleWishlist,
  compareIds,
  onToggleCompare,
  onOpenTryItFirst,
  initialFilterNote,
  initialFilterBrand,
  initialFilterFamily,
  locale
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>(initialFilterFamily ? [initialFilterFamily] : []);
  const [selectedConcentrations, setSelectedConcentrations] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>(initialFilterBrand || 'all');
  const [selectedNote, setSelectedNote] = useState<string>(initialFilterNote || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState<'all' | 'under-350' | '350-750' | '750-1500' | 'above-1500'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'brand-asc' | 'price-asc' | 'price-desc' | 'year-desc' | 'rating-desc'>('name-asc');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Search history state (saves last 5 searches)
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('senstoria_search_history') || '[]');
    } catch {
      return [];
    }
  });

  const saveSearchQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setSearchHistory(prev => {
      const next = [trimmed, ...prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      try {
        localStorage.setItem('senstoria_search_history', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('senstoria_search_history');
    } catch {
      // ignore
    }
  };

  // Extract unique filter options from data
  const allBrands = useMemo(() => Array.from(new Set(perfumes.map(p => p.brand))).sort(), [perfumes]);
  const allFamilies = ['Fresh', 'Floral', 'Woody', 'Ambery', 'Gourmand', 'Aromatic'];
  const allTiers = ['indie', 'niche', 'designer', 'mass'];
  const allConcentrations = ['Extrait', 'Parfum', 'EDP', 'EDT', 'EDC'];

  // Toggle helpers
  const toggleOrigin = (val: string) => {
    setSelectedOrigins(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };
  const toggleTier = (val: string) => {
    setSelectedTiers(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };
  const toggleFamily = (val: string) => {
    setSelectedFamilies(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };
  const toggleConcentration = (val: string) => {
    setSelectedConcentrations(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedOrigins([]);
    setSelectedTiers([]);
    setSelectedFamilies([]);
    setSelectedConcentrations([]);
    setSelectedBrand('all');
    setSelectedNote('');
    setSelectedPriceRange('all');
    setSortBy('name-asc');
  };

  const hasActiveFilters = searchQuery !== '' || 
    selectedOrigins.length > 0 || 
    selectedTiers.length > 0 || 
    selectedFamilies.length > 0 || 
    selectedConcentrations.length > 0 || 
    selectedBrand !== 'all' || 
    selectedPriceRange !== 'all' ||
    selectedNote !== '';

  // Multi-facet filtering logic (CAT-03)
  const filteredPerfumes = useMemo(() => {
    return perfumes.filter(perfume => {
      // 1. Search Query (name, brand, notes, description)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = perfume.name.toLowerCase().includes(q);
        const matchBrand = perfume.brand.toLowerCase().includes(q);
        const matchNotes = (perfume.top_notes + ' ' + perfume.heart_notes + ' ' + perfume.base_notes).toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchNotes) return false;
      }

      // 2. Specific Note Click filter (CAT-06)
      if (selectedNote !== '') {
        const q = selectedNote.toLowerCase().trim();
        const matchNotes = (perfume.top_notes + ' ' + perfume.heart_notes + ' ' + perfume.base_notes).toLowerCase().includes(q);
        if (!matchNotes) return false;
      }

      // 3. Origin (ID vs INT)
      if (selectedOrigins.length > 0) {
        if (!selectedOrigins.includes(perfume.origin)) return false;
      }

      // 4. Market Tier
      if (selectedTiers.length > 0) {
        if (!selectedTiers.includes(perfume.market_tier)) return false;
      }

      // 5. Olfactive Family
      if (selectedFamilies.length > 0) {
        if (!selectedFamilies.includes(perfume.primary_family)) return false;
      }

      // 6. Concentration
      if (selectedConcentrations.length > 0) {
        if (!selectedConcentrations.includes(perfume.concentration)) return false;
      }

      // 7. Brand
      if (selectedBrand !== 'all') {
        if (perfume.brand !== selectedBrand) return false;
      }

      // 8. Price Range Filter
      if (selectedPriceRange !== 'all') {
        const p = perfume.reference_price_idr;
        if (selectedPriceRange === 'under-350' && p >= 350000) return false;
        if (selectedPriceRange === '350-750' && (p < 350000 || p > 750000)) return false;
        if (selectedPriceRange === '750-1500' && (p < 750000 || p > 1500000)) return false;
        if (selectedPriceRange === 'above-1500' && p <= 1500000) return false;
      }

      return true;
    }).sort((a, b) => {
      // CAT-04 Sorting Rules
      if (sortBy === 'brand-asc') return a.brand.localeCompare(b.brand);
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price-asc') return a.reference_price_idr - b.reference_price_idr;
      if (sortBy === 'price-desc') return b.reference_price_idr - a.reference_price_idr;
      if (sortBy === 'year-desc') return b.release_year - a.release_year;
      if (sortBy === 'rating-desc') return (b.rating_seed || 0) - (a.rating_seed || 0);
      return 0;
    });
  }, [
    perfumes, 
    searchQuery, 
    selectedOrigins, 
    selectedTiers, 
    selectedFamilies, 
    selectedConcentrations, 
    selectedBrand, 
    selectedNote, 
    selectedPriceRange,
    sortBy
  ]);

  return (
    <div className="space-y-8">
      
      {/* ── CATALOG HEADER ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D9D7C9] pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#5C5C5C] font-semibold">
            {locale === 'id' ? 'Katalog Terkurasi' : 'Curated Catalog'}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-normal mt-1">
            {locale === 'id' ? 'Eksplorasi Koleksi Parfum' : 'Explore Fragrance Database'}
          </h1>
          <p className="text-xs text-[#5C5C5C] mt-1 font-mono">
            {locale === 'id' 
              ? `Menampilkan ${filteredPerfumes.length} dari total ${perfumes.length} parfum` 
              : `Showing ${filteredPerfumes.length} of ${perfumes.length} fragrances`}
            <span className="ml-2 px-1.5 py-0.5 bg-[#F4F3E6] border border-[#D9D7C9] text-[10px]">
              {locale === 'id' ? 'Data contoh (terverifikasi)' : 'Sample data (verified)'}
            </span>
          </p>
        </div>

        {/* Quick Filter Drawer Toggle (Mobile) & Sort */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#5C5C5C] whitespace-nowrap">Urutkan:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-white border border-[#333333] px-3 py-1.5 text-xs focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="name-asc">Nama (A–Z)</option>
              <option value="name-desc">Nama (Z–A)</option>
              <option value="brand-asc">Brand (A–Z)</option>
              <option value="year-desc">Tahun Rilis (Terbaru)</option>
              <option value="price-asc">Harga (Terendah)</option>
              <option value="price-desc">Harga (Tertinggi)</option>
              <option value="rating-desc">Rating Komunitas</option>
            </select>
          </div>

          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className="md:hidden px-3 py-1.5 border border-[#333333] text-xs font-semibold flex items-center gap-1.5 bg-[#F4F3E6]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR & PRIMARY CONTROLS ── */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#5C5C5C] absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') saveSearchQuery(searchQuery);
            }}
            placeholder={locale === 'id' ? 'Cari nama parfum, brand, atau notes (cth: bergamot, oud, HMNS)...' : 'Search perfume, brand, or notes (e.g. bergamot, oud, HMNS)...'}
            className="w-full pl-10 pr-10 py-3 bg-white border border-[#333333] text-sm focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-[#5C5C5C] hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search History Chips */}
        {searchHistory.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#8C8C8C] flex items-center gap-1 text-[11px]">
              <History className="w-3 h-3" /> Riwayat:
            </span>
            {searchHistory.map(item => (
              <button
                key={item}
                onClick={() => setSearchQuery(item)}
                className="px-2 py-0.5 bg-[#F4F3E6] border border-[#D9D7C9] text-[11px] text-[#333333] hover:border-black transition"
              >
                {item}
              </button>
            ))}
            <button
              onClick={clearSearchHistory}
              className="text-[10px] text-[#8C8C8C] hover:text-red-700 underline ml-1"
            >
              Hapus
            </button>
          </div>
        )}

        {/* Olfactive Family Quick Tabs (Editorial Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-[#D9D7C9]/60">
          <button
            onClick={() => setSelectedFamilies([])}
            className={`px-3.5 py-1.5 whitespace-nowrap transition font-medium ${
              selectedFamilies.length === 0 
                ? 'bg-[#333333] text-[#FFFEF2]' 
                : 'bg-white border border-[#D9D7C9] text-[#5C5C5C] hover:border-black hover:text-black'
            }`}
          >
            {locale === 'id' ? 'Semua Aroma' : 'All Families'} ({perfumes.length})
          </button>
          {allFamilies.map(fam => {
            const isSelected = selectedFamilies.includes(fam);
            const count = perfumes.filter(p => p.primary_family === fam).length;
            return (
              <button
                key={fam}
                onClick={() => {
                  setSelectedFamilies(isSelected ? [] : [fam]);
                }}
                className={`px-3.5 py-1.5 whitespace-nowrap transition font-medium ${
                  isSelected 
                    ? 'bg-[#333333] text-[#FFFEF2]' 
                    : 'bg-white border border-[#D9D7C9] text-[#5C5C5C] hover:border-black hover:text-black'
                }`}
              >
                {fam} ({count})
              </button>
            );
          })}
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[#5C5C5C] font-semibold text-[11px] uppercase tracking-wider">
              Filter Aktif:
            </span>

            {selectedOrigins.map(orig => (
              <span key={orig} className="bg-white border border-[#333333] px-2.5 py-1 flex items-center gap-1.5">
                <span>{orig === 'ID' ? 'Lokal Indonesia' : 'Internasional'}</span>
                <button onClick={() => toggleOrigin(orig)}><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedTiers.map(tier => (
              <span key={tier} className="bg-white border border-[#333333] px-2.5 py-1 flex items-center gap-1.5 capitalize">
                <span>Tier: {tier}</span>
                <button onClick={() => toggleTier(tier)}><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedFamilies.map(fam => (
              <span key={fam} className="bg-white border border-[#333333] px-2.5 py-1 flex items-center gap-1.5">
                <span>{fam}</span>
                <button onClick={() => toggleFamily(fam)}><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedConcentrations.map(conc => (
              <span key={conc} className="bg-white border border-[#333333] px-2.5 py-1 flex items-center gap-1.5 font-mono">
                <span>{conc}</span>
                <button onClick={() => toggleConcentration(conc)}><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedPriceRange !== 'all' && (
              <span className="bg-white border border-[#333333] px-2.5 py-1 flex items-center gap-1.5 font-mono">
                <span>
                  {selectedPriceRange === 'under-350' && '< Rp 350.000'}
                  {selectedPriceRange === '350-750' && 'Rp 350k - Rp 750k'}
                  {selectedPriceRange === '750-1500' && 'Rp 750k - Rp 1.5jt'}
                  {selectedPriceRange === 'above-1500' && '> Rp 1.500.000'}
                </span>
                <button onClick={() => setSelectedPriceRange('all')}><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedBrand !== 'all' && (
              <span className="bg-white border border-[#333333] px-2.5 py-1 flex items-center gap-1.5">
                <span>Brand: {selectedBrand}</span>
                <button onClick={() => setSelectedBrand('all')}><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedNote !== '' && (
              <span className="bg-white border border-[#333333] px-2.5 py-1 flex items-center gap-1.5">
                <span>Note: {selectedNote}</span>
                <button onClick={() => setSelectedNote('')}><X className="w-3 h-3" /></button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="text-[#8A4B14] hover:underline font-bold text-xs ml-2 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{locale === 'id' ? 'Hapus Semua' : 'Clear All'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── TWO-COLUMN CATALOG INTERFACE (Filter Facets Left | Product Grid Right) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Filter Sidebar (Desktop) or Drawer (Mobile) */}
        <aside className={`md:col-span-3 space-y-6 ${isFilterDrawerOpen ? 'block' : 'hidden md:block'} bg-[#F4F3E6] p-5 border border-[#D9D7C9]`}>
          <div className="flex justify-between items-center border-b border-[#D9D7C9] pb-3">
            <h3 className="font-serif text-lg font-bold">Filter Katalog</h3>
            <button 
              onClick={() => setIsFilterDrawerOpen(false)}
              className="md:hidden text-[#5C5C5C] hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Facet 1: Origin (CAT-12 / Q9) */}
          <div className="space-y-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-[#5C5C5C] block">
              Asal Brand (Origin)
            </span>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrigins.includes('ID')}
                  onChange={() => toggleOrigin('ID')}
                  className="accent-[#333333]"
                />
                <span className="font-medium">Lokal Indonesia</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrigins.includes('INT')}
                  onChange={() => toggleOrigin('INT')}
                  className="accent-[#333333]"
                />
                <span>Internasional / Global</span>
              </label>
            </div>
          </div>

          {/* Facet 2: Market Tier (Q9) */}
          <div className="space-y-2 pt-2 border-t border-[#D9D7C9]">
            <span className="text-xs uppercase font-semibold tracking-wider text-[#5C5C5C] block">
              Market Tier
            </span>
            <div className="space-y-1.5 text-xs">
              {allTiers.map(tier => (
                <label key={tier} className="flex items-center gap-2 cursor-pointer capitalize">
                  <input
                    type="checkbox"
                    checked={selectedTiers.includes(tier)}
                    onChange={() => toggleTier(tier)}
                    className="accent-[#333333]"
                  />
                  <span>{tier === 'indie' ? 'Indie / Artisan' : tier}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facet 3: Olfactive Family */}
          <div className="space-y-2 pt-2 border-t border-[#D9D7C9]">
            <span className="text-xs uppercase font-semibold tracking-wider text-[#5C5C5C] block">
              Keluarga Aroma (Family)
            </span>
            <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
              {allFamilies.map(fam => (
                <label key={fam} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFamilies.includes(fam)}
                    onChange={() => toggleFamily(fam)}
                    className="accent-[#333333]"
                  />
                  <span>{fam}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facet 4: Concentration */}
          <div className="space-y-2 pt-2 border-t border-[#D9D7C9]">
            <span className="text-xs uppercase font-semibold tracking-wider text-[#5C5C5C] block">
              Konsentrasi
            </span>
            <div className="space-y-1.5 text-xs">
              {allConcentrations.map(conc => (
                <label key={conc} className="flex items-center gap-2 cursor-pointer font-mono">
                  <input
                    type="checkbox"
                    checked={selectedConcentrations.includes(conc)}
                    onChange={() => toggleConcentration(conc)}
                    className="accent-[#333333]"
                  />
                  <span>{conc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facet 5: Brand Filter Dropdown */}
          <div className="space-y-2 pt-2 border-t border-[#D9D7C9]">
            <span className="text-xs uppercase font-semibold tracking-wider text-[#5C5C5C] block">
              Brand Spesifik
            </span>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full bg-white border border-[#333333] p-2 text-xs focus:outline-hidden"
            >
              <option value="all">Semua Brand</option>
              {allBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Facet 6: Price Range Bands */}
          <div className="space-y-2 pt-2 border-t border-[#D9D7C9]">
            <span className="text-xs uppercase font-semibold tracking-wider text-[#5C5C5C] block">
              Rentang Anggaran (IDR)
            </span>
            <div className="space-y-1.5 text-xs">
              {[
                { id: 'all', label: 'Semua Harga' },
                { id: 'under-350', label: '< Rp 350.000' },
                { id: '350-750', label: 'Rp 350k – Rp 750k' },
                { id: '750-1500', label: 'Rp 750k – Rp 1.5jt' },
                { id: 'above-1500', label: '> Rp 1.500.000' },
              ].map(range => (
                <label key={range.id} className="flex items-center gap-2 cursor-pointer font-mono">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={selectedPriceRange === range.id}
                    onChange={() => setSelectedPriceRange(range.id as any)}
                    className="accent-[#333333]"
                  />
                  <span className="font-sans text-xs">{range.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Product Cards Grid (CAT-01, equal card heights, 2-line title clamp) */}
        <section className="md:col-span-9 space-y-6">
          
          {filteredPerfumes.length === 0 ? (
            /* Empty State with Clear Filter CTA & Compass Icon */
            <div className="p-12 text-center bg-white border border-[#D9D7C9] space-y-4">
              <div className="w-12 h-12 mx-auto bg-[#F4F3E6] border border-[#D9D7C9] flex items-center justify-center text-[#8A4B14]">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-[#1A1A1A]">Tidak ada parfum yang cocok dengan filter ini</h3>
              <p className="text-xs text-[#5C5C5C] max-w-md mx-auto leading-relaxed">
                Coba sesuaikan kombinasi keluarga aroma, rentang tier, atau kata kunci pencarianmu.
              </p>
              <div className="flex justify-center gap-3 pt-1">
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-[#333333] hover:bg-black text-[#FFFEF2] text-xs font-semibold transition"
                >
                  Hapus Semua Filter
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPerfumes.map(perfume => {
                const isWishlisted = wishlistIds.includes(perfume.id);
                const isCompared = compareIds.includes(perfume.id);

                return (
                  <div
                    key={perfume.id}
                    className="bg-white border border-[#D9D7C9] p-5 flex flex-col justify-between space-y-4 transition-all hover:border-black"
                  >
                    {/* Top image and badges */}
                    <div className="space-y-3">
                      <div 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="h-44 bg-[#F4F3E6] border border-[#D9D7C9] flex items-center justify-center relative cursor-pointer group"
                      >
                        <svg width="60" height="90" viewBox="0 0 60 90" fill="none" stroke="#333333" strokeWidth="1.5" className="opacity-70 group-hover:opacity-100 transition">
                          <rect x="22" y="5" width="16" height="12" />
                          <rect x="26" y="2" width="8" height="3" />
                          <rect x="10" y="17" width="40" height="68" rx="2" />
                          <circle cx="30" cy="50" r="12" strokeDasharray="2 2" />
                        </svg>

                        {/* Top corner actions */}
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWishlist(perfume.id);
                            }}
                            className={`p-1.5 bg-white border border-[#D9D7C9] hover:bg-[#F4F3E6] transition ${
                              isWishlisted ? 'text-red-600' : 'text-[#5C5C5C]'
                            }`}
                            title="Toggle Wishlist"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCompare(perfume.id);
                            }}
                            className={`p-1.5 bg-white border border-[#D9D7C9] hover:bg-[#F4F3E6] transition ${
                              isCompared ? 'bg-neutral-800 text-white' : 'text-[#5C5C5C]'
                            }`}
                            title="Add to Compare"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Origin tag */}
                        <span className="absolute bottom-2 left-2 text-[10px] font-mono px-1.5 py-0.5 bg-white/95 border border-[#D9D7C9] uppercase">
                          {perfume.origin === 'ID' ? 'Lokal Indonesia' : 'Internasional'}
                        </span>
                      </div>

                      {/* Header details with 2-line title clamp */}
                      <div>
                        <div className="flex justify-between items-baseline text-xs text-[#5C5C5C]">
                          <span 
                            onClick={() => setSelectedBrand(perfume.brand)} 
                            className="font-semibold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            {perfume.brand}
                          </span>
                          <span className="font-mono">{perfume.concentration}</span>
                        </div>

                        <h3 
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="font-serif text-xl font-bold mt-0.5 cursor-pointer hover:underline line-clamp-1"
                        >
                          {perfume.name}
                        </h3>

                        <p className="text-xs text-[#5C5C5C] mt-1 line-clamp-2">
                          {locale === 'id' ? perfume.description_id : perfume.description_en}
                        </p>
                      </div>

                      {/* Clickable Notes Chips (CAT-06) */}
                      <div className="flex flex-wrap gap-1 pt-1 text-[11px] text-[#5C5C5C]">
                        {perfume.top_notes.split(',').slice(0, 3).map(n => {
                          const cleanNote = n.trim();
                          return (
                            <button
                              key={cleanNote}
                              onClick={() => setSelectedNote(cleanNote)}
                              className="border border-[#D9D7C9] px-1.5 py-0.5 hover:border-black hover:text-black transition"
                            >
                              {cleanNote}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom row: Price, Sample Badge, and Action CTAs */}
                    <div className="space-y-3 pt-2 border-t border-[#D9D7C9]">
                      <div className="flex justify-between items-baseline text-xs font-mono">
                        <span className="text-[#5C5C5C]">Harga referensi:</span>
                        <span className="font-bold">{formatCurrency(perfume.reference_price_idr, locale)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="py-2 border border-[#333333] hover:bg-[#F4F3E6] text-xs font-medium transition"
                        >
                          Lihat Specs
                        </button>
                        <button
                          onClick={() => onOpenTryItFirst(perfume.id)}
                          className="py-2 bg-[#333333] hover:bg-black text-[#FFFEF2] text-xs font-medium transition"
                        >
                          Coba Dulu
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </section>
      </div>

    </div>
  );
};
