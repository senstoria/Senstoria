import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Heart, 
  Layers, 
  ExternalLink, 
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  History,
  ArrowUpDown
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { translations, fmt, Locale, formatCurrency } from '../lib/i18n.ts';
import { Bottle } from './Bottle.tsx';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { EmptyState } from './EmptyState.tsx';
import { computeCatalogFacetCounts, perfumeMatchesFamily } from '../lib/derivedCalculations.ts';
import { calculateMatchScore, readSavedQuizAnswers } from '../lib/scentScoring.ts';

interface CatalogViewProps {
  perfumes: SeedPerfume[];
  isLoading?: boolean;
  onSelectPerfume: (id: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onOpenTryItFirst: (id: string) => void;
  // Perfume ids the user already owns (non-deleted bottle records). Try it
  // First is hidden for these: an owned perfume needs no sample try.
  ownedPerfumeIds: string[];
  initialFilterNote?: string | null;
  initialFilterBrand?: string | null;
  initialFilterFamily?: string | null;
  locale: Locale;
  // Verified average review rating per perfume id (1-5), when available.
  // Absent by default: CatalogView has no review data of its own, and no
  // rating is ever invented. The Review rate filter only enables options
  // for which at least one displayed perfume has a verified average.
  reviewAverages?: Record<string, number>;
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
  ownedPerfumeIds,
  initialFilterNote,
  initialFilterBrand,
  initialFilterFamily,
  locale,
  reviewAverages
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>(initialFilterFamily ? [initialFilterFamily] : []);
  const [selectedConcentrations, setSelectedConcentrations] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialFilterBrand ? [initialFilterBrand] : []);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedYearBuckets, setSelectedYearBuckets] = useState<string[]>([]);
  const [minReviewRate, setMinReviewRate] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<string>(initialFilterNote || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState<'all' | 'under-350' | '350-750' | '750-1500' | 'above-1500'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'brand-asc' | 'price-asc' | 'price-desc' | 'year-desc'>('name-asc');
  // Desktop filter panel starts open (the previous always-visible behaviour)
  // and can be collapsed to just its header, then expanded again.
  const [isFilterPanelCollapsed, setIsFilterPanelCollapsed] = useState(false);
  // Sprint 3: saved quiz answers drive per-card match % (cold-start banner when none)
  const [savedQuiz] = useState(readSavedQuizAnswers);
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
  const filterKey = `${searchQuery}_${selectedCountries.join(',')}_${selectedFamilies.join(',')}_${selectedConcentrations.join(',')}_${selectedBrands.join(',')}_${selectedGenders.join(',')}_${selectedYearBuckets.join(',')}_${minReviewRate ?? ''}_${selectedNote}_${selectedPriceRange}_${sortBy}`;
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

  // Brand Origin country for a perfume. Only a verified brand_country, or
  // the 'ID' classification (Indonesian local), yields a country. INT rows
  // without a verified brand_country yield undefined: their country is
  // unknown and must never be guessed, and they match no country filter.
  const perfumeCountry = (p: SeedPerfume): string | undefined =>
    p.brand_country ?? (p.origin === 'ID' ? 'Indonesia' : undefined);

  // Extract unique filter options strictly derived from displayed perfumes.
  // Options with no displayed perfume are not offered, so no filter can
  // promise results the current catalog cannot deliver.
  const allBrands = useMemo(() => Array.from(new Set(perfumes.map(p => p.brand))).sort(), [perfumes]);
  const allCountries = useMemo(() => {
    const set = new Set<string>();
    perfumes.forEach(p => { const c = perfumeCountry(p); if (c) set.add(c); });
    return Array.from(set).sort();
  }, [perfumes]);
  const allGenders = useMemo(() => {
    const order = ['feminine', 'masculine', 'unisex'];
    const present = new Set(perfumes.map(p => p.gender_label));
    return order.filter(g => present.has(g as any));
  }, [perfumes]);
  const YEAR_BUCKETS = [
    { id: '2020+', label: '2020+', inBucket: (y: number) => y >= 2020 },
    { id: '2010-2019', label: '2010–2019', inBucket: (y: number) => y >= 2010 && y <= 2019 },
    { id: '2000-2009', label: '2000–2009', inBucket: (y: number) => y >= 2000 && y <= 2009 },
    { id: 'before-2000', label: 'Before 2000', inBucket: (y: number) => y < 2000 },
  ];
  const availableYearBuckets = useMemo(() => YEAR_BUCKETS.filter(b =>
    perfumes.some(p => p.release_year !== undefined && b.inBucket(p.release_year))
  ), [perfumes]);
  const availableReviewRates = useMemo(() => {
    if (!reviewAverages) return [] as number[];
    const avgs = perfumes.map(p => reviewAverages[p.id]).filter((v): v is number => typeof v === 'number');
    return [5, 4, 3].filter(min => avgs.some(v => v >= min));
  }, [perfumes, reviewAverages]);
  const facetCounts = useMemo(() => computeCatalogFacetCounts(perfumes), [perfumes]);
  const allFamilies = ['Fresh', 'Floral', 'Woody', 'Ambery', 'Gourmand', 'Aromatic'];
  const allConcentrations = ['Extrait', 'Parfum', 'EDP', 'EDT', 'EDC'];

  // Toggle helpers
  const toggleCountry = (val: string) => {
    setSelectedCountries(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };
  const toggleFamily = (val: string) => {
    setSelectedFamilies(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };
  const toggleConcentration = (val: string) => {
    setSelectedConcentrations(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };
  const toggleBrand = (val: string) => {
    setSelectedBrands(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };
  const toggleGender = (val: string) => {
    setSelectedGenders(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };
  const toggleYearBucket = (val: string) => {
    setSelectedYearBuckets(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCountries([]);
    setSelectedFamilies([]);
    setSelectedConcentrations([]);
    setSelectedBrands([]);
    setSelectedGenders([]);
    setSelectedYearBuckets([]);
    setMinReviewRate(null);
    setSelectedNote('');
    setSelectedPriceRange('all');
    setSortBy('name-asc');
  };

  const hasActiveFilters = searchQuery !== '' ||
    selectedCountries.length > 0 ||
    selectedFamilies.length > 0 ||
    selectedConcentrations.length > 0 ||
    selectedBrands.length > 0 ||
    selectedGenders.length > 0 ||
    selectedYearBuckets.length > 0 ||
    minReviewRate !== null ||
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

      // 3. Brand Origin: actual brand country. A perfume with no verified
      // country matches no country selection (never guessed into a bucket).
      if (selectedCountries.length > 0) {
        const country = perfumeCountry(perfume);
        if (!country || !selectedCountries.includes(country)) return false;
      }

      // 4. Olfactive Family (using shared perfumeMatchesFamily matching)
      if (selectedFamilies.length > 0) {
        if (!selectedFamilies.some(fam => perfumeMatchesFamily(perfume, fam))) return false;
      }

      // 5. Concentration
      if (selectedConcentrations.length > 0) {
        if (!selectedConcentrations.includes(perfume.concentration)) return false;
      }

      // 6. Specific Brand (multi-select checkboxes)
      if (selectedBrands.length > 0) {
        if (!selectedBrands.includes(perfume.brand)) return false;
      }

      // 7. Gender Preference: matches the perfume's brand-stated gender
      // label. 'unknown' matches no gender selection (never guessed).
      if (selectedGenders.length > 0) {
        if (!selectedGenders.includes(perfume.gender_label)) return false;
      }

      // 8. Year of Release: matches a selected bucket. A perfume with no
      // release_year matches no year selection (never guessed).
      if (selectedYearBuckets.length > 0) {
        if (perfume.release_year === undefined) return false;
        const inBucket = selectedYearBuckets.some(id =>
          YEAR_BUCKETS.find(b => b.id === id)?.inBucket(perfume.release_year as number));
        if (!inBucket) return false;
      }

      // 9. Review rate: minimum verified average rating. A perfume with no
      // verified average matches no review-rate selection (never invented).
      if (minReviewRate !== null) {
        const avg = reviewAverages?.[perfume.id];
        if (avg === undefined || avg < minReviewRate) return false;
      }

      // 10. Price Range Filter (unchanged radio bands; the slider is job 10)
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
      if (sortBy === 'year-desc') return (b.release_year ?? 0) - (a.release_year ?? 0);
      return 0;
    });
  }, [
    perfumes,
    searchQuery,
    selectedCountries,
    selectedFamilies,
    selectedConcentrations,
    selectedBrands,
    selectedGenders,
    selectedYearBuckets,
    minReviewRate,
    reviewAverages,
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
              className="bg-card border border-bar px-3 py-1.5 text-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent font-medium cursor-pointer"
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
            className="w-full pl-10 pr-10 py-3 bg-card border border-bar text-base md:text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
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
                : 'bg-card border border-hairline text-secondary hover:border-ink hover:text-ink'
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
                    : 'bg-card border border-hairline text-secondary hover:border-ink hover:text-ink'
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

            {selectedCountries.map(country => (
              <span key={country} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5">
                <span>{country}</span>
                <button type="button" onClick={() => toggleCountry(country)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedFamilies.map(fam => (
              <span key={fam} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5">
                <span>{fam}</span>
                <button type="button" onClick={() => toggleFamily(fam)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedConcentrations.map(conc => (
              <span key={conc} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 font-mono">
                <span>{conc}</span>
                <button type="button" onClick={() => toggleConcentration(conc)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedPriceRange !== 'all' && (
              <span className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 font-mono">
                <span>
                  {translations[locale].catalogView.priceRanges.find(r => r.id === selectedPriceRange)?.label}
                </span>
                <button type="button" onClick={() => setSelectedPriceRange('all')} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedBrands.map(brand => (
              <span key={brand} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5">
                <span>{translations[locale].admin.formBrand} {brand}</span>
                <button type="button" onClick={() => toggleBrand(brand)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedGenders.map(gender => (
              <span key={gender} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5">
                <span>{gender === 'feminine' ? translations[locale].catalogView.genderFeminine : gender === 'masculine' ? translations[locale].catalogView.genderMasculine : translations[locale].catalogView.genderUnisex}</span>
                <button type="button" onClick={() => toggleGender(gender)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedYearBuckets.map(bucketId => (
              <span key={bucketId} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 font-mono">
                <span>{YEAR_BUCKETS.find(b => b.id === bucketId)?.label}</span>
                <button type="button" onClick={() => toggleYearBucket(bucketId)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {minReviewRate !== null && (
              <span className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5">
                <span>{minReviewRate}{translations[locale].catalogView.reviewAndUp}</span>
                <button type="button" onClick={() => setMinReviewRate(null)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedNote !== '' && (
              <span className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5">
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
        locale={locale}
        title={translations[locale].catalogView.filterKatalog}
        subtitle={translations[locale].catalogView.sesuaikanKriteriaPencarianParfum}
      >
        <div className="space-y-6 pb-2">
          {/* Facet 1: Brand Origin — actual brand countries, never ID/INT */}
          <div className="space-y-2.5">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.originHeading}
            </span>
            {allCountries.length === 0 ? (
              <p className="text-sm text-secondary">{translations[locale].catalogView.originNoData}</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {allCountries.map(country => (
                  <label key={country} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface">
                    <input
                      type="checkbox"
                      checked={selectedCountries.includes(country)}
                      onChange={() => toggleCountry(country)}
                      className="w-4 h-4 accent-bar"
                    />
                    <span className="text-sm font-medium">{country}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Facet 3: Olfactive Family */}
          <div className="space-y-2.5 pt-3 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.familyHeading}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {allFamilies.map(fam => (
                <label key={fam} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface">
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
                <label key={conc} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface font-mono">
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

          {/* Facet 5: Specific Brand — multi-select checkboxes */}
          <div className="space-y-2.5 pt-3 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.brandHeading}
            </span>
            <div className="grid grid-cols-1 gap-2">
              {allBrands.map(b => (
                <label key={b} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={() => toggleBrand(b)}
                    className="w-4 h-4 accent-bar"
                  />
                  <span className="text-sm font-medium">{b}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facet: Gender Preference */}
          <div className="space-y-2.5 pt-3 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.genderHeading}
            </span>
            {allGenders.length === 0 ? (
              <p className="text-sm text-secondary">{translations[locale].catalogView.genderNoData}</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {allGenders.map(g => (
                  <label key={g} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface">
                    <input
                      type="checkbox"
                      checked={selectedGenders.includes(g)}
                      onChange={() => toggleGender(g)}
                      className="w-4 h-4 accent-bar"
                    />
                    <span className="text-sm font-medium">{g === 'feminine' ? translations[locale].catalogView.genderFeminine : g === 'masculine' ? translations[locale].catalogView.genderMasculine : translations[locale].catalogView.genderUnisex}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Facet: Year of Release */}
          <div className="space-y-2.5 pt-3 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.yearHeading}
            </span>
            {availableYearBuckets.length === 0 ? (
              <p className="text-sm text-secondary">{translations[locale].catalogView.yearNoData}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableYearBuckets.map(bucket => (
                  <label key={bucket.id} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface font-mono">
                    <input
                      type="checkbox"
                      checked={selectedYearBuckets.includes(bucket.id)}
                      onChange={() => toggleYearBucket(bucket.id)}
                      className="w-4 h-4 accent-bar"
                    />
                    <span className="text-sm font-medium">{bucket.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Facet: Review rate — only enabled where a verified average exists */}
          <div className="space-y-2.5 pt-3 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.reviewHeading}
            </span>
            {availableReviewRates.length === 0 ? (
              <p className="text-sm text-secondary">{translations[locale].catalogView.reviewNoData}</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {availableReviewRates.map(min => (
                  <label key={min} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface">
                    <input
                      type="radio"
                      name="mobileReviewRate"
                      checked={minReviewRate === min}
                      onChange={() => setMinReviewRate(min)}
                      className="w-4 h-4 accent-bar"
                    />
                    <span className="text-sm font-medium">{min}{translations[locale].catalogView.reviewAndUp}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Facet 6: Price Range */}
          <div className="space-y-2.5 pt-3 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.budgetHeading}
            </span>
            <div className="grid grid-cols-1 gap-2">
              {translations[locale].catalogView.priceRanges.map(range => (
                <label key={range.id} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface">
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
        
        {/* Left Filter Sidebar (Desktop only) — collapsible to its header */}
        <aside className="hidden md:block md:col-span-3 space-y-6 bg-surface p-5 border border-hairline">
          <div className="flex justify-between items-center border-b border-hairline pb-3">
            <h3 className="font-serif text-lg font-bold">{translations[locale].catalogView.filterKatalog}</h3>
            <button
              type="button"
              onClick={() => setIsFilterPanelCollapsed(!isFilterPanelCollapsed)}
              aria-expanded={!isFilterPanelCollapsed}
              className="flex items-center gap-1 text-xs font-semibold text-secondary hover:text-ink cursor-pointer"
            >
              {isFilterPanelCollapsed ? (
                <>{translations[locale].catalogView.expandFilters} <ChevronDown className="w-4 h-4" /></>
              ) : (
                <>{translations[locale].catalogView.collapseFilters} <ChevronUp className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {isFilterPanelCollapsed ? (
            <p className="text-xs text-secondary">{translations[locale].catalogView.filtersCollapsedNote}</p>
          ) : (
          <>
          {/* Facet 1: Brand Origin — actual brand countries, never ID/INT */}
          <div className="space-y-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.originHeading}
            </span>
            {allCountries.length === 0 ? (
              <p className="text-xs text-secondary">{translations[locale].catalogView.originNoData}</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {allCountries.map(country => (
                  <label key={country} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCountries.includes(country)}
                      onChange={() => toggleCountry(country)}
                      className="accent-bar"
                    />
                    <span>{country}</span>
                  </label>
                ))}
              </div>
            )}
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

          {/* Facet 5: Specific Brand — multi-select checkboxes */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.brandHeading}
            </span>
            <div className="space-y-1.5 text-xs">
              {allBrands.map(b => (
                <label key={b} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={() => toggleBrand(b)}
                    className="accent-bar"
                  />
                  <span>{b}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facet: Gender Preference */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.genderHeading}
            </span>
            {allGenders.length === 0 ? (
              <p className="text-xs text-secondary">{translations[locale].catalogView.genderNoData}</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {allGenders.map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGenders.includes(g)}
                      onChange={() => toggleGender(g)}
                      className="accent-bar"
                    />
                    <span>{g === 'feminine' ? translations[locale].catalogView.genderFeminine : g === 'masculine' ? translations[locale].catalogView.genderMasculine : translations[locale].catalogView.genderUnisex}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Facet: Year of Release */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.yearHeading}
            </span>
            {availableYearBuckets.length === 0 ? (
              <p className="text-xs text-secondary">{translations[locale].catalogView.yearNoData}</p>
            ) : (
              <div className="space-y-1.5 text-xs font-mono">
                {availableYearBuckets.map(bucket => (
                  <label key={bucket.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedYearBuckets.includes(bucket.id)}
                      onChange={() => toggleYearBucket(bucket.id)}
                      className="accent-bar"
                    />
                    <span>{bucket.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Facet: Review rate — only enabled where a verified average exists */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <span className="text-xs uppercase font-semibold tracking-wider text-secondary block">
              {translations[locale].catalogView.reviewHeading}
            </span>
            {availableReviewRates.length === 0 ? (
              <p className="text-xs text-secondary">{translations[locale].catalogView.reviewNoData}</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {availableReviewRates.map(min => (
                  <label key={min} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="desktopReviewRate"
                      checked={minReviewRate === min}
                      onChange={() => setMinReviewRate(min)}
                      className="accent-bar"
                    />
                    <span>{min}{translations[locale].catalogView.reviewAndUp}</span>
                  </label>
                ))}
              </div>
            )}
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
          </>
          )}
        </aside>

        {/* Right: Product Cards Grid (CAT-01, equal card heights, 2-line title clamp) */}
        <section className="md:col-span-9 space-y-6">
          
          {showSkeleton ? (
            /* Requirement 1: Skeleton cards with exact final card dimensions (no layout shift) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 desktop:grid-cols-4 gap-6 items-stretch">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`catalog-skeleton-${idx}`}
                  className="bg-card border border-hairline p-5 flex flex-col justify-between h-full space-y-4"
                >
                  <div className="space-y-3">
                    <div className="h-48 bg-surface border border-hairline flex items-center justify-center relative p-3">
                      <div className="w-16 h-28 bg-hairline/40 border border-hairline" />
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <div className="w-8 h-8 bg-card border border-hairline" />
                        <div className="w-8 h-8 bg-card border border-hairline" />
                      </div>
                      <div className="absolute bottom-2 left-2 w-24 h-5 bg-card border border-hairline" />
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
            /* Empty State: shared EmptyState (calm icon + 1 sentence + 1 action, 44px CTA) */
            <EmptyState
              title={translations[locale].catalogView.emptyTitle}
              body={translations[locale].catalogView.emptyBody}
              ctaLabel={translations[locale].catalogView.clearAllFilters}
              onCtaClick={clearAllFilters}
              iconType="shelf"
            />
          ) : (
            <>
            {!savedQuiz.hasRealAnswers && (
              <div className="bg-surface border border-hairline p-3 text-[12px] text-ink mb-6">
                {translations[locale].common.coldStartBanner}
              </div>
            )}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 desktop:grid-cols-4 gap-6 items-stretch transition-opacity duration-150 ${isFilterDipping ? 'opacity-70' : 'opacity-100'}`}>
              {filteredPerfumes.map((perfume, idx) => {
                const isWishlisted = wishlistIds.includes(perfume.id);
                const isCompared = compareIds.includes(perfume.id);

                return (
                  <div
                    key={perfume.id}
                    className="bg-card border border-hairline p-5 md:p-6 flex flex-col justify-between h-full space-y-5 hover:border-ink transition-colors animate-card-enter"
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
                          concentrationLabel={perfume.concentration}
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
                            className="p-2 bg-card border border-hairline hover:bg-surface text-bar transition toggle-icon cursor-pointer active:scale-95"
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
                              isCompared ? 'bg-bar text-paper' : 'bg-card hover:bg-surface text-secondary'
                            }`}
                            title={translations[locale].catalogView.addToCompareTitle}
                            aria-label={translations[locale].catalogView.addToCompareAria}
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Origin tag */}
                        <span className="absolute bottom-2 left-2 text-[12px] font-mono px-2 py-0.5 bg-card border border-hairline uppercase text-secondary">
                          {perfume.origin === 'ID' ? translations[locale].catalogView.originLocal : translations[locale].catalogView.originIntlChip}
                        </span>
                      </div>

                      {/* Header details with 2-line title clamp */}
                      <div>
                        <div className="flex justify-between items-baseline text-xs text-secondary">
                          <span
                            onClick={() => setSelectedBrands([perfume.brand])}
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

                        {/* Sprint 3: match % from saved quiz answers; cold-start banner replaces it */}
                        {savedQuiz.hasRealAnswers && (
                          <p className="text-[12px] font-mono tabular-nums text-ink pt-1">
                            {fmt(translations[locale].common.matchPercent, calculateMatchScore(perfume, savedQuiz.answers).matchScore)}
                          </p>
                        )}
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
                          {perfume.price_is_sample ? (
                            <span className="px-1 py-0.5 bg-surface border border-hairline text-[12px] font-sans">
                              {translations[locale].sampleDataBadge}
                            </span>
                          ) : perfume.price_checked_date ? (
                            <span className="px-1 py-0.5 bg-surface border border-hairline text-[12px] font-sans">
                              {fmt(translations[locale].common.priceCheckedOn, perfume.price_checked_date)}
                            </span>
                          ) : null}
                        </span>
                        <span className="font-bold text-ink tabular-nums">{formatCurrency(perfume.reference_price_idr, locale)} <span className="font-normal text-secondary">({perfume.reference_price_size_ml} ml)</span></span>
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
                        {!ownedPerfumeIds.includes(perfume.id) && (
                          <button
                            type="button"
                            onClick={() => onOpenTryItFirst(perfume.id)}
                            className="min-h-[48px] py-3 bg-bar hover:bg-ink text-paper text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
                          >
                            {translations[locale].nav.tryItFirst}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
            </>
          )}

        </section>
      </div>

    </div>
  );
};
