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
import { translations, fmt, Locale, formatCurrency } from '../lib/i18n.ts';
import { Bottle } from './Bottle.tsx';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { computeCatalogFacetCounts, perfumeMatchesFamily } from '../lib/derivedCalculations.ts';

interface CatalogViewProps {
  perfumes: SeedPerfume[];
  isLoading?: boolean;
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
  isLoading = false,
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

  // Requirement 1: Skeleton cards appear only if loading exceeds 300ms
  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Requirement 2: Filter changes keep current cards visible with a subtle opacity dip while results update
  const [isFilterDipping, setIsFilterDipping] = useState(false);
  const filterKey = `${searchQuery}_${selectedOrigins.join(',')}_${selectedTiers.join(',')}_${selectedFamilies.join(',')}_${selectedConcentrations.join(',')}_${selectedBrand}_${selectedNote}_${selectedPriceRange}_${sortBy}`;
  const prevFilterKeyRef = React.useRef(filterKey);

  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey;
      setIsFilterDipping(true);
      const timer = setTimeout(() => {
        setIsFilterDipping(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [filterKey]);

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

  // Extract unique filter options and facet counts strictly derived from displayed perfumes
  const allBrands = useMemo(() => Array.from(new Set(perfumes.map(p => p.brand))).sort(), [perfumes]);
  const facetCounts = useMemo(() => computeCatalogFacetCounts(perfumes), [perfumes]);
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

      // 5. Olfactive Family (using shared perfumeMatchesFamily matching)
      if (selectedFamilies.length > 0) {
        if (!selectedFamilies.some(fam => perfumeMatchesFamily(perfume, fam))) return false;
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
      
      {/* ── CATALOG HEADER (Standardized Pattern) ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-4">
        <div className="space-y-1">
          <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
            {translations[locale].catalogView.katalogTerkurasi}
          </span>
          <h2 className="font-serif text-[24px] leading-[32px] md:text-[32px] md:leading-[40px] text-ink font-normal">
            {translations[locale].catalogView.eksplorasiKoleksiParfum}
          </h2>
          <p className="text-[14px] leading-[20px] text-secondary font-mono">
            {fmt(translations[locale].catalogView.menampilkan0DariTotal1Parfum, filteredPerfumes.length, perfumes.length)}
            <span className="ml-2 px-1.5 py-0.5 bg-surface border border-hairline text-[12px]">
              {translations[locale].sampleDataBadge}
            </span>
          </p>
        </div>

        {/* Quick Filter Drawer Toggle (Mobile) & Sort */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-secondary whitespace-nowrap">{translations[locale].catalogView.sortLabel}</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-white border border-bar px-3 py-1.5 text-xs focus:outline-hidden font-medium cursor-pointer"
            >
{translations[locale].catalogView.sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className="md:hidden px-3 py-1.5 border border-bar text-xs font-semibold flex items-center gap-1.5 bg-surface cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR & PRIMARY CONTROLS ── */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') saveSearchQuery(searchQuery);
            }}
            placeholder={translations[locale].catalogView.cariNamaParfumBrandAtauNotesCthBerg}
            className="w-full pl-10 pr-10 py-3 bg-white border border-bar text-base md:text-sm focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-secondary hover:text-ink cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search History Chips */}
        {searchHistory.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-secondary flex items-center gap-1 text-[12px]">
              <History className="w-3 h-3" /> {translations[locale].catalogView.historyLabel}
            </span>
            {searchHistory.map(item => (
              <button
                key={item}
                onClick={() => setSearchQuery(item)}
                className="px-2 py-0.5 bg-surface border border-hairline text-[12px] text-bar hover:border-ink transition cursor-pointer"
              >
                {item}
              </button>
            ))}
            <button
              onClick={clearSearchHistory}
              className="text-[12px] text-secondary hover:text-error underline ml-1 cursor-pointer"
            >
              {translations[locale].catalogView.hapus}
            </button>
          </div>
        )}

        {/* Olfactive Family Quick Tabs (Editorial Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-hairline/60">
          <button
            onClick={() => setSelectedFamilies([])}
            className={`px-3.5 py-1.5 whitespace-nowrap transition font-medium ${
              selectedFamilies.length === 0 
                ? 'bg-bar text-paper' 
                : 'bg-white border border-hairline text-secondary hover:border-ink hover:text-ink'
            }`}
          >
            {translations[locale].catalogView.semuaAroma} ({perfumes.length})
          </button>
          {allFamilies.map(fam => {
            const isSelected = selectedFamilies.includes(fam);
            const count = facetCounts.familyCounts[fam] ?? 0;
            return (
              <button
                key={fam}
                onClick={() => {
                  setSelectedFamilies(isSelected ? [] : [fam]);
                }}
                className={`px-3.5 py-1.5 whitespace-nowrap transition font-medium ${
                  isSelected 
                    ? 'bg-bar text-paper' 
                    : 'bg-white border border-hairline text-secondary hover:border-ink hover:text-ink'
                }`}
              >
                {fam} ({count})
              </button>
            );
          })}
        </div>

        {/* Active Filter Chips (Requirement 2: Sticky chips above grid with one 'Clear all') */}
        {hasActiveFilters && (
          <div className="sticky top-0 z-20 bg-paper py-2.5 px-3 border border-bar flex flex-wrap items-center gap-2 text-xs">
            <span className="text-secondary font-semibold text-[12px] uppercase tracking-wider">
              {translations[locale].catalogView.filterAktif}
            </span>

            {selectedOrigins.map(orig => (
              <span key={orig} className="bg-white border border-bar px-2.5 py-1 flex items-center gap-1.5">
                <span>{orig === 'ID' ? translations[locale].catalogView.originLocal : translations[locale].catalogView.originIntlChip}</span>
                <button type="button" onClick={() => toggleOrigin(orig)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedTiers.map(tier => (
              <span key={tier} className="bg-white border border-bar px-2.5 py-1 flex items-center gap-1.5 capitalize">
                <span>Tier: {tier}</span>
                <button type="button" onClick={() => toggleTier(tier)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedFamilies.map(fam => (
              <span key={fam} className="bg-white border border-bar px-2.5 py-1 flex items-center gap-1.5">
                <span>{fam}</span>
                <button type="button" onClick={() => toggleFamily(fam)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedConcentrations.map(conc => (
              <span key={conc} className="bg-white border border-bar px-2.5 py-1 flex items-center gap-1.5 font-mono">
                <span>{conc}</span>
                <button type="button" onClick={() => toggleConcentration(conc)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedPriceRange !== 'all' && (
              <span className="bg-white border border-bar px-2.5 py-1 flex items-center gap-1.5 font-mono">
                <span>
                  {translations[locale].catalogView.priceRanges.find(r => r.id === selectedPriceRange)?.label}
                </span>
                <button type="button" onClick={() => setSelectedPriceRange('all')} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedBrand !== 'all' && (
              <span className="bg-white border border-bar px-2.5 py-1 flex items-center gap-1.5">
                <span>{translations[locale].admin.formBrand} {selectedBrand}</span>
                <button type="button" onClick={() => setSelectedBrand('all')} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedNote !== '' && (
              <span className="bg-white border border-bar px-2.5 py-1 flex items-center gap-1.5">
                <span>Note: {selectedNote}</span>
                <button type="button" onClick={() => setSelectedNote('')} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-bar hover:underline font-bold text-xs ml-auto flex items-center gap-1 cursor-pointer px-2 py-1 bg-surface border border-hairline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{translations[locale].catalogView.hapusSemua}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE FILTER BOTTOM SHEET (Requirement 3: Big tappable options + Sticky 'Show N perfumes' apply button) ── */}
      <BottomSheetOrModal
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title={translations[locale].catalogView.filterKatalog}
        subtitle={translations[locale].catalogView.sesuaikanKriteriaPencarianParfum}
      >
        <div className="space-y-6 pb-2">
          {/* Facet 1: Origin */}
          <div className="space-y-2.5">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.originHeading}
            </span>
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-white cursor-pointer active:bg-surface">
                <input
                  type="checkbox"
                  checked={selectedOrigins.includes('ID')}
                  onChange={() => toggleOrigin('ID')}
                  className="w-4 h-4 accent-bar"
                />
                <span className="text-sm font-medium">{translations[locale].catalogView.originLocal}</span>
              </label>
              <label className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-white cursor-pointer active:bg-surface">
                <input
                  type="checkbox"
                  checked={selectedOrigins.includes('INT')}
                  onChange={() => toggleOrigin('INT')}
                  className="w-4 h-4 accent-bar"
                />
                <span className="text-sm font-medium">{translations[locale].catalogView.originIntlLabel}</span>
              </label>
            </div>
          </div>

          {/* Facet 2: Market Tier */}
          <div className="space-y-2.5 pt-3 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              Market Tier
            </span>
            <div className="grid grid-cols-2 gap-2">
              {allTiers.map(tier => (
                <label key={tier} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-white cursor-pointer active:bg-surface capitalize">
                  <input
                    type="checkbox"
                    checked={selectedTiers.includes(tier)}
                    onChange={() => toggleTier(tier)}
                    className="w-4 h-4 accent-bar"
                  />
                  <span className="text-sm font-medium">{tier === 'indie' ? 'Indie / Artisan' : tier}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facet 3: Olfactive Family */}
          <div className="space-y-2.5 pt-3 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.familyHeading}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {allFamilies.map(fam => (
                <label key={fam} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-white cursor-pointer active:bg-surface">
                  <input
                    type="checkbox"
                    checked={selectedFamilies.includes(fam)}
                    onChange={() => toggleFamily(fam)}
                    className="w-4 h-4 accent-bar"
                  />
                  <span className="text-sm font-medium">{fam}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facet 4: Concentration */}
          <div className="space-y-2.5 pt-3 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.concentrationHeading}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allConcentrations.map(conc => (
                <label key={conc} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-white cursor-pointer active:bg-surface font-mono">
                  <input
                    type="checkbox"
                    checked={selectedConcentrations.includes(conc)}
                    onChange={() => toggleConcentration(conc)}
                    className="w-4 h-4 accent-bar"
                  />
                  <span className="text-sm font-medium">{conc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facet 5: Brand */}
          <div className="space-y-2.5 pt-3 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.brandHeading}
            </span>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full bg-white border border-bar min-h-[48px] p-2.5 text-sm font-medium focus:outline-hidden"
            >
              <option value="all">{translations[locale].catalogView.allBrands}</option>
              {allBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Facet 6: Price Range */}
          <div className="space-y-2.5 pt-3 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.budgetHeading}
            </span>
            <div className="grid grid-cols-1 gap-2">
              {translations[locale].catalogView.priceRanges.map(range => (
                <label key={range.id} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-white cursor-pointer active:bg-surface">
                  <input
                    type="radio"
                    name="mobilePriceRange"
                    checked={selectedPriceRange === range.id}
                    onChange={() => setSelectedPriceRange(range.id as any)}
                    className="w-4 h-4 accent-bar"
                  />
                  <span className="text-sm font-medium">{range.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Apply Button at bottom of Mobile Bottom Sheet */}
        <div className="sticky bottom-0 -mx-5 -mb-4 p-4 bg-paper border-t border-bar flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={clearAllFilters}
            className="min-h-[48px] px-4 py-2.5 border border-border text-xs font-semibold text-ink hover:bg-surface cursor-pointer"
          >
            {translations[locale].catalogView.hapus}
          </button>
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(false)}
            className="flex-1 min-h-[48px] py-3 bg-bar hover:bg-ink text-paper text-xs font-semibold text-center transition cursor-pointer"
          >
            {fmt(translations[locale].catalogView.tampilkan0Parfum, filteredPerfumes.length)}
          </button>
        </div>
      </BottomSheetOrModal>

      {/* ── TWO-COLUMN CATALOG INTERFACE (Filter Facets Left | Product Grid Right) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Filter Sidebar (Desktop only) */}
        <aside className="hidden md:block md:col-span-3 space-y-6 bg-surface p-5 border border-hairline">
          <div className="flex justify-between items-center border-b border-hairline pb-3">
            <h3 className="font-serif text-lg font-bold">{translations[locale].catalogView.filterKatalog}</h3>
          </div>

          {/* Facet 1: Origin (CAT-12 / Q9) */}
          <div className="space-y-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.originHeading}
            </span>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrigins.includes('ID')}
                  onChange={() => toggleOrigin('ID')}
                  className="accent-bar"
                />
                <span className="font-medium">{translations[locale].catalogView.originLocal}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrigins.includes('INT')}
                  onChange={() => toggleOrigin('INT')}
                  className="accent-bar"
                />
                <span>{translations[locale].catalogView.originIntlLabel}</span>
              </label>
            </div>
          </div>

          {/* Facet 2: Market Tier (Q9) */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              Market Tier
            </span>
            <div className="space-y-1.5 text-xs">
              {allTiers.map(tier => (
                <label key={tier} className="flex items-center gap-2 cursor-pointer capitalize">
                  <input
                    type="checkbox"
                    checked={selectedTiers.includes(tier)}
                    onChange={() => toggleTier(tier)}
                    className="accent-bar"
                  />
                  <span>{tier === 'indie' ? 'Indie / Artisan' : tier}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facet 3: Olfactive Family */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.familyHeading}
            </span>
            <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
              {allFamilies.map(fam => (
                <label key={fam} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFamilies.includes(fam)}
                    onChange={() => toggleFamily(fam)}
                    className="accent-bar"
                  />
                  <span>{fam}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facet 4: Concentration */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.concentrationHeading}
            </span>
            <div className="space-y-1.5 text-xs">
              {allConcentrations.map(conc => (
                <label key={conc} className="flex items-center gap-2 cursor-pointer font-mono">
                  <input
                    type="checkbox"
                    checked={selectedConcentrations.includes(conc)}
                    onChange={() => toggleConcentration(conc)}
                    className="accent-bar"
                  />
                  <span>{conc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facet 5: Brand Filter Dropdown */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.brandHeading}
            </span>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full bg-white border border-bar p-2 text-xs focus:outline-hidden"
            >
              <option value="all">{translations[locale].catalogView.allBrands}</option>
              {allBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Facet 6: Price Range Bands */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.budgetHeading}
            </span>
            <div className="space-y-1.5 text-xs">
              {translations[locale].catalogView.priceRanges.map(range => (
                <label key={range.id} className="flex items-center gap-2 cursor-pointer font-mono">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={selectedPriceRange === range.id}
                    onChange={() => setSelectedPriceRange(range.id as any)}
                    className="accent-bar"
                  />
                  <span className="font-sans text-xs">{range.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Product Cards Grid (CAT-01, equal card heights, 2-line title clamp) */}
        <section className="md:col-span-9 space-y-6">
          
          {showSkeleton ? (
            /* Requirement 1: Skeleton cards with exact final card dimensions (no layout shift) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`catalog-skeleton-${idx}`}
                  className="bg-white border border-hairline p-5 flex flex-col justify-between h-full space-y-4"
                >
                  <div className="space-y-3">
                    <div className="h-48 bg-surface border border-hairline flex items-center justify-center relative p-3">
                      <div className="w-16 h-28 bg-hairline/40 border border-hairline" />
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <div className="w-8 h-8 bg-white border border-hairline" />
                        <div className="w-8 h-8 bg-white border border-hairline" />
                      </div>
                      <div className="absolute bottom-2 left-2 w-24 h-5 bg-white border border-hairline" />
                    </div>
                    <div>
                      <div className="flex justify-between items-baseline">
                        <div className="h-3.5 w-24 bg-hairline/50" />
                        <div className="h-3.5 w-12 bg-hairline/50" />
                      </div>
                      <div className="h-[48px] mt-1 space-y-1.5">
                        <div className="h-5 w-4/5 bg-hairline/60" />
                        <div className="h-5 w-2/5 bg-hairline/40" />
                      </div>
                      <div className="h-[40px] mt-1 space-y-1">
                        <div className="h-3.5 w-full bg-hairline/40" />
                        <div className="h-3.5 w-3/4 bg-hairline/30" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <div className="h-6 w-16 border border-hairline bg-surface" />
                      <div className="h-6 w-14 border border-hairline bg-surface" />
                      <div className="h-6 w-18 border border-hairline bg-surface" />
                    </div>
                  </div>
                  <div className="space-y-3 pt-3 border-t border-hairline">
                    <div className="flex justify-between items-baseline">
                      <div className="h-3.5 w-24 bg-hairline/40" />
                      <div className="h-4 w-28 bg-hairline/60" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="min-h-[44px] h-[44px] border border-hairline bg-surface" />
                      <div className="min-h-[48px] h-[48px] bg-bar/20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPerfumes.length === 0 ? (
            /* Empty State with Clear Filter CTA & Compass Icon */
            <div className="p-12 text-center bg-white border border-hairline space-y-4">
              <div className="w-12 h-12 mx-auto bg-surface border border-hairline flex items-center justify-center text-accent">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-bar">{translations[locale].catalogView.emptyTitle}</h3>
              <p className="text-xs text-secondary max-w-md mx-auto leading-relaxed">
                {translations[locale].catalogView.emptyBody}
              </p>
              <div className="flex justify-center gap-3 pt-1">
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-bar hover:bg-ink text-paper text-xs font-semibold transition cursor-pointer"
                >
                  {translations[locale].catalogView.clearAllFilters}
                </button>
              </div>
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch transition-opacity duration-150 ${isFilterDipping ? 'opacity-70' : 'opacity-100'}`}>
              {filteredPerfumes.map((perfume, idx) => {
                const isWishlisted = wishlistIds.includes(perfume.id);
                const isCompared = compareIds.includes(perfume.id);

                return (
                  <div
                    key={perfume.id}
                    className="bg-white border border-hairline p-5 flex flex-col justify-between h-full space-y-4 hover:border-ink transition-colors animate-card-enter"
                    style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                  >
                    {/* Top image and badges */}
                    <div className="space-y-3">
                      <div 
                        onClick={() => onSelectPerfume(perfume.id)}
                        className="h-48 bg-surface border border-hairline flex items-center justify-center relative cursor-pointer group p-3"
                      >
                        <Bottle
                          fragranceId={perfume.id}
                          name={perfume.name}
                          brand={perfume.brand}
                          size="sm"
                          showFill={false}
                        />

                        {/* Top corner actions */}
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWishlist(perfume.id);
                            }}
                            className="p-2 bg-white border border-hairline hover:bg-surface text-bar transition toggle-icon cursor-pointer active:scale-95"
                            title={translations[locale].catalogView.toggleWishlistTitle}
                            aria-label={translations[locale].catalogView.saveToWishlistAria}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-bar text-bar' : 'text-secondary'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCompare(perfume.id);
                            }}
                            className={`p-2 border border-hairline transition toggle-icon cursor-pointer active:scale-95 ${
                              isCompared ? 'bg-bar text-paper' : 'bg-white hover:bg-surface text-secondary'
                            }`}
                            title={translations[locale].catalogView.addToCompareTitle}
                            aria-label={translations[locale].catalogView.addToCompareAria}
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Origin tag */}
                        <span className="absolute bottom-2 left-2 text-[12px] font-mono px-2 py-0.5 bg-white border border-hairline uppercase text-secondary">
                          {perfume.origin === 'ID' ? translations[locale].catalogView.originLocal : translations[locale].catalogView.originIntlChip}
                        </span>
                      </div>

                      {/* Header details with 2-line title clamp */}
                      <div>
                        <div className="flex justify-between items-baseline text-xs text-secondary">
                          <span 
                            onClick={() => setSelectedBrand(perfume.brand)} 
                            className="font-semibold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            {perfume.brand}
                          </span>
                          <span className="font-mono text-xs">{perfume.concentration}</span>
                        </div>

                        <h3 
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="text-[18px] leading-[24px] font-medium text-ink mt-1 cursor-pointer hover:underline line-clamp-2 h-[48px]"
                        >
                          {perfume.name}
                        </h3>

                        <p className="text-[14px] leading-[20px] text-secondary mt-1 line-clamp-2">
                          {locale === 'id' ? perfume.description_id : perfume.description_en}
                        </p>
                      </div>

                      {/* Clickable Notes Chips (CAT-06) */}
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[12px] text-secondary">
                        {perfume.top_notes.split(',').slice(0, 3).map(n => {
                          const cleanNote = n.trim();
                          return (
                            <button
                              key={cleanNote}
                              type="button"
                              onClick={() => setSelectedNote(cleanNote)}
                              className="border border-hairline px-2 py-0.5 hover:border-ink hover:text-ink transition cursor-pointer"
                            >
                              {cleanNote}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom row: Price, Sample Badge, and Action CTAs */}
                    <div className="space-y-3 pt-3 border-t border-hairline">
                      <div className="flex justify-between items-baseline text-xs font-mono">
                        <span className="text-secondary flex items-center gap-1.5">
                          <span>{translations[locale].catalogView.hargaReferensi}</span>
                          <span className="px-1 py-0.5 bg-surface border border-hairline text-[12px] font-sans">
                            {translations[locale].sampleDataBadge}
                          </span>
                        </span>
                        <span className="font-bold text-ink tabular-nums">{formatCurrency(perfume.reference_price_idr, locale)}</span>
                      </div>

                      {/* Exactly ONE primary (filled) button per card */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectPerfume(perfume.id)}
                          className="min-h-[44px] py-2.5 border border-bar hover:bg-surface text-xs font-medium text-ink transition cursor-pointer"
                        >
                          {translations[locale].catalogView.viewSpecs}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenTryItFirst(perfume.id)}
                          className="min-h-[48px] py-3 bg-bar hover:bg-ink text-paper text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
                        >
                          {translations[locale].nav.tryItFirst}
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
