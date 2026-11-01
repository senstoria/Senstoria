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
import { perfumeMatchesFamily } from '../lib/derivedCalculations.ts';
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
  // Item 9/32: onOpenTryItFirst and ownedPerfumeIds stay in the props
  // interface (App.tsx still passes them) but are no longer destructured
  // here — the card no longer renders Try it First; it lives in the
  // product detail, still owned-gated there (PR #18).
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
  // Year of Release (founder 1 Nov 2026 07:31 WIB): the dropdown from
  // PR #29 is reverted to a plain scrollable checkbox list, styled
  // exactly like Brand Origin (first 7 visible, rest scroll inside
  // the section). Multi-select is inherent to checkboxes.
  const [minReviewRate, setMinReviewRate] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<string>(initialFilterNote || '');
  // Job 10/32: Price Range is a dual-handle slider (Rp), replacing the
  // radio Budget Range bands. Bounds: Rp 0 – Rp 5.000.000, step
  // Rp 50.000. Rp 5.000.000 covers both published prices (Rp 279.000 and
  // Rp 633.215) with headroom, and even the highest draft-seed price
  // (Rp 3.400.000) if it is ever published. A max handle parked at the
  // top means NO upper bound (displayed as "Rp 5.000.000+"), so a
  // perfume above Rp 5.000.000 is never silently dropped: it still
  // matches while the max handle is at the top, and is only excluded
  // when the user deliberately drags the max handle below its price.
  // The filtered field is the same reference_price_idr as before
  // (sample-data semantics unchanged); only the control changed.
  const PRICE_SLIDER_MAX = 5000000;
  const PRICE_SLIDER_STEP = 50000;
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(PRICE_SLIDER_MAX);
  const isPriceFilterActive = priceMin > 0 || priceMax < PRICE_SLIDER_MAX;
  const resetPriceFilter = () => { setPriceMin(0); setPriceMax(PRICE_SLIDER_MAX); };
  const priceMaxLabel = priceMax >= PRICE_SLIDER_MAX
    ? `${formatCurrency(PRICE_SLIDER_MAX, locale)}+`
    : formatCurrency(priceMax, locale);
  const priceRangeLabel = `${formatCurrency(priceMin, locale)} – ${priceMaxLabel}`;
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'brand-asc' | 'price-asc' | 'price-desc' | 'year-desc'>('name-asc');
  // Correction item 7: every filter section is individually collapsible
  // (accordion per section). All sections start expanded; tapping a
  // section header hides/shows only that section's options. The state is
  // shared by the desktop sidebar and the mobile sheet (same section ids).
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const FilterSection = ({ id, title, className, children }: { id: string; title: string; className?: string; children: React.ReactNode }) => {
    const collapsed = !!collapsedSections[id];
    return (
      <div className={className}>
        <button
          type="button"
          aria-expanded={!collapsed}
          onClick={() => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }))}
          className="w-full flex items-center justify-between gap-2 cursor-pointer text-left"
        >
          <span className="text-xs uppercase font-semibold tracking-wider text-secondary">{title}</span>
          {collapsed ? <ChevronDown className="w-4 h-4 shrink-0 text-secondary" /> : <ChevronUp className="w-4 h-4 shrink-0 text-secondary" />}
        </button>
        {!collapsed && children}
      </div>
    );
  };
  // Job 10/32: shared dual-handle price slider, used by both the
  // desktop sidebar and the mobile sheet so the two renderings cannot
  // drift apart. Two native <input type="range"> handles share one
  // visual track: the min handle clamps to the max value and vice
  // versa, so the handles can never cross. Each handle is a real
  // range input, so keyboard control (arrow keys, Home/End) and
  // screen-reader labels (aria-label + aria-valuetext per handle)
  // come from the browser. Known accessibility limit, reported
  // honestly: a screen reader announces two separate sliders, not
  // one combined dual-handle control — there is no single ARIA
  // widget for a dual-handle slider in plain HTML.
  const PriceSliderControls = () => {
    const t = translations[locale].catalogView;
    const minPct = (priceMin / PRICE_SLIDER_MAX) * 100;
    const maxPct = (priceMax / PRICE_SLIDER_MAX) * 100;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium tabular-nums">{formatCurrency(priceMin, locale)}</span>
          <span className="font-medium tabular-nums">{priceMaxLabel}</span>
        </div>
        <div className="relative h-11">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-hairline rounded-full" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-bar rounded-full"
            style={{ left: `${minPct}%`, width: `${Math.max(maxPct - minPct, 0)}%` }}
          />
          <input
            type="range"
            min={0}
            max={PRICE_SLIDER_MAX}
            step={PRICE_SLIDER_STEP}
            value={priceMin}
            aria-label={t.priceSliderMinLabel}
            aria-valuetext={formatCurrency(priceMin, locale)}
            onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax))}
            className="price-dual-range"
            style={{ zIndex: priceMin < priceMax ? 20 : 10 }}
          />
          <input
            type="range"
            min={0}
            max={PRICE_SLIDER_MAX}
            step={PRICE_SLIDER_STEP}
            value={priceMax}
            aria-label={t.priceSliderMaxLabel}
            aria-valuetext={priceMaxLabel}
            onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin))}
            className="price-dual-range"
            style={{ zIndex: priceMin < priceMax ? 10 : 20 }}
          />
        </div>
        {isPriceFilterActive ? (
          <button
            type="button"
            onClick={resetPriceFilter}
            className="text-xs font-medium underline cursor-pointer"
          >
            {t.priceSliderReset}
          </button>
        ) : (
          <p className="text-xs text-secondary">{t.priceSliderAllLabel}</p>
        )}
      </div>
    );
  };
  // Sprint 3: saved quiz answers drive per-card match % (cold-start banner when none)
  const [savedQuiz] = useState(readSavedQuizAnswers);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  // Job 8/32: Catalog compare is gated behind this toggle. When off, no
  // card shows a compare button at all; when on, each card shows its
  // add-to-compare button, reusing the existing compareIds flow (max 3,
  // enforced in App.handleToggleCompare, CMP-01). Turning the toggle off
  // does not clear an existing selection — the tray still offers it.
  const [isCompareMode, setIsCompareMode] = useState(false);

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
  const filterKey = `${searchQuery}_${selectedCountries.join(',')}_${selectedFamilies.join(',')}_${selectedConcentrations.join(',')}_${selectedBrands.join(',')}_${selectedGenders.join(',')}_${selectedYearBuckets.join(',')}_${minReviewRate ?? ''}_${selectedNote}_${priceMin}_${priceMax}_${sortBy}`;
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

  // Correction item 7, Brand Origin: the initial option list is the 10
  // famous perfume-producing countries below, offered whether or not the
  // current catalog already has a perfume from that country (selecting
  // one with no match honestly shows an empty result). Ordering
  // correction (founder 31 Oct 2026 22:24 WIB): Indonesia first, then
  // the rest alphabetically. Any additional verified brand country
  // from displayed perfumes follows the same rule (Indonesia stays
  // first, the rest alphabetical). A brand country is still only ever
  // a verified brand_country (or the 'ID' local classification);
  // nothing is guessed.
  const INITIAL_COUNTRIES = ['Indonesia', 'France', 'Germany', 'Italy', 'Japan', 'Spain', 'Switzerland', 'United Arab Emirates', 'United Kingdom', 'United States'];
  const sortCountries = (a: string, b: string) => {
    if (a === 'Indonesia') return -1;
    if (b === 'Indonesia') return 1;
    return a.localeCompare(b);
  };
  const allBrands = useMemo(() => Array.from(new Set(perfumes.map(p => p.brand))).sort(), [perfumes]);
  const allCountries = useMemo(() => {
    const set = new Set<string>(INITIAL_COUNTRIES);
    perfumes.forEach(p => { const c = perfumeCountry(p); if (c) set.add(c); });
    return Array.from(set).sort(sortCountries);
  }, [perfumes]);
  // Correction item 7, Gender Preference: all three options are always
  // offered (For Him / For Her / For All), mapped from gender_label.
  // 'unknown' still matches no selection (never guessed).
  const allGenders = ['masculine', 'feminine', 'unisex'];
  // Correction item 7, Year of Release: single years 2000-2026 plus
  // '<2000' for releases below 2000. All options are always offered;
  // a perfume without release_year matches no year selection.
  // Order correction (founder 31 Oct 2026 22:26 WIB, kept 1 Nov 2026):
  // newest first (2026 down to 2000), with '<2000' last. The order
  // only affects display (scrollable checkbox list); the matching
  // logic is unchanged.
  const YEAR_BUCKETS = [
    ...Array.from({ length: 27 }, (_, i) => {
      const y = 2026 - i;
      return { id: String(y), label: String(y), inBucket: (v: number) => v === y };
    }),
    { id: 'before-2000', label: '<2000', inBucket: (y: number) => y < 2000 },
  ];
  const availableYearBuckets = YEAR_BUCKETS;
  // Correction item 7, Review rate: minimum-rating options 1-5 stars
  // (previously 5/4/3 only). Still only enabled when at least one
  // displayed perfume has a verified average; with none, the facet
  // shows its honest no-data note and no rating is invented.
  const availableReviewRates = useMemo(() => {
    if (!reviewAverages) return [] as number[];
    const avgs = perfumes.map(p => reviewAverages[p.id]).filter((v): v is number => typeof v === 'number');
    return avgs.length > 0 ? [5, 4, 3, 2, 1] : [];
  }, [perfumes, reviewAverages]);
  // Correction item 7, Olfactive Families (SFP): the 7 families of the
  // Societe Francaise des Parfumeurs. The stored id is the match key
  // used by the shared perfumeMatchesFamily substring matcher; the
  // label is what the filter shows. Ordering/label correction
  // (founder 31 Oct 2026 22:24 WIB): the SFP A-G letter prefixes are
  // dropped from the labels, and the families are ordered by the
  // first letter of each family name (Ambery, Chypre, Citrus, Floral,
  // Fougere, Leather, Woody). Only labels and order change here --
  // the ids (match keys) are unchanged, so filtering behaves exactly
  // as before, and family F is still shown as 'Ambery' per
  // correction 8.
  // Honest mapping from the old catalog families (see PR report):
  // Floral -> Floral, Woody -> Woody, Ambery -> Amber (substring
  // 'amber' matches 'Ambery'); Citrus, Fougere, Chypre and Leather
  // match only perfumes whose family field already contains that
  // word. Old families Fresh, Aromatic and Gourmand have NO SFP
  // equivalent assigned here: a perfume with only those families
  // matches no SFP filter, pending a founder decision -- never
  // silently re-labelled.
  const SFP_FAMILIES = [
    { id: 'Amber', label: 'Ambery' },
    { id: 'Chypre', label: 'Chypre' },
    { id: 'Citrus', label: 'Citrus' },
    { id: 'Floral', label: 'Floral' },
    { id: 'Fougère', label: 'Fougère' },
    { id: 'Leather', label: 'Leather' },
    { id: 'Woody', label: 'Woody' },
  ];
  const sfpLabel = (id: string) => SFP_FAMILIES.find(f => f.id === id)?.label ?? id;
  const allFamilies = SFP_FAMILIES.map(f => f.id);
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
  // Year of Release checkbox list (founder 1 Nov 2026 07:31 WIB):
  // plain checkboxes, newest first (2026 down to 2000, '<2000'
  // last), scrollable exactly like Brand Origin in PR #30 — only
  // the first 7 options are visible, the rest scroll inside the
  // section. Mobile: 7 rows × 48px min-height + 6 × 8px gaps =
  // 384px. Desktop: 7 rows × 16px + 6 × 6px gaps = 148px.
  // Rendered as a plain helper (not a component) like the other
  // facet renderings in this file. The dropdown placeholder and
  // closed summary from PR #29 are no longer used.
  const renderYearCheckboxes = (variant: 'mobile' | 'desktop') => {
    const compact = variant === 'desktop';
    return (
      <div className={compact ? 'space-y-1.5 text-xs max-h-[148px] overflow-y-auto pr-1' : 'grid grid-cols-1 gap-2 max-h-[384px] overflow-y-auto pr-1'}>
        {availableYearBuckets.map(bucket => (
          <label key={bucket.id} className={compact ? 'flex items-center gap-2 cursor-pointer font-mono' : 'flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface'}>
            <input
              type="checkbox"
              checked={selectedYearBuckets.includes(bucket.id)}
              onChange={() => toggleYearBucket(bucket.id)}
              className="w-4 h-4 accent-bar shrink-0"
            />
            <span className={compact ? 'font-sans text-xs' : 'text-sm font-medium'}>{bucket.label}</span>
          </label>
        ))}
      </div>
    );
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
    resetPriceFilter();
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
    isPriceFilterActive ||
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

      // 10. Price Range Filter (job 10/32 dual-handle slider, same
      // reference_price_idr field as the old radio bands). Max at the
      // top of the slider means no upper bound, so perfumes above
      // Rp 5.000.000 still match at full range.
      if (isPriceFilterActive) {
        const p = perfume.reference_price_idr;
        if (p < priceMin) return false;
        if (priceMax < PRICE_SLIDER_MAX && p > priceMax) return false;
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
    priceMin,
    priceMax,
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
          <button
            type="button"
            onClick={() => setIsCompareMode(prev => !prev)}
            aria-pressed={isCompareMode}
            aria-label={translations[locale].catalogView.compareModeToggleAria}
            className={`min-h-[44px] px-3 py-1.5 border border-bar text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${isCompareMode ? 'bg-bar text-paper' : 'bg-card hover:bg-surface text-ink'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{translations[locale].catalogView.compareModeToggle}</span>
          </button>
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

      {/* Compare-mode hint: only visible while the toggle is on. */}
      {isCompareMode && (
        <div className="bg-surface border border-hairline p-3 text-[12px] text-ink">
          {translations[locale].catalogView.compareModeActiveHint} ({compareIds.length}/3)
        </div>
      )}

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
            const count = perfumes.filter(p => perfumeMatchesFamily(p, fam)).length;
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
                {sfpLabel(fam)} ({count})
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
                <span>{sfpLabel(fam)}</span>
                <button type="button" onClick={() => toggleFamily(fam)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedConcentrations.map(conc => (
              <span key={conc} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 font-mono">
                <span>{conc}</span>
                <button type="button" onClick={() => toggleConcentration(conc)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {isPriceFilterActive && (
              <span className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 font-mono">
                <span>
                  {priceRangeLabel}
                </span>
                <button type="button" onClick={resetPriceFilter} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
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
          <FilterSection id="origin" title={translations[locale].catalogView.originHeading} className="space-y-2.5">
            {allCountries.length === 0 ? (
              <p className="text-sm text-secondary">{translations[locale].catalogView.originNoData}</p>
            ) : (
              // Brand Origin only: show the first 7 countries, the rest scroll
              // inside this section. 7 rows × 48px min-height + 6 × 8px gaps = 384px.
              <div className="grid grid-cols-1 gap-2 max-h-[384px] overflow-y-auto pr-1">
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
          </FilterSection>

          {/* Facet 3: Olfactive Family */}
          <FilterSection id="family" title={translations[locale].catalogView.familyHeading} className="space-y-2.5 pt-3 border-t border-hairline">
            <div className="grid grid-cols-2 gap-2">
              {allFamilies.map(fam => (
                <label key={fam} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface">
                  <input
                    type="checkbox"
                    checked={selectedFamilies.includes(fam)}
                    onChange={() => toggleFamily(fam)}
                    className="w-4 h-4 accent-bar"
                  />
                  <span className="text-sm font-medium">{sfpLabel(fam)}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Facet 4: Concentration */}
          <FilterSection id="concentration" title={translations[locale].catalogView.concentrationHeading} className="space-y-2.5 pt-3 border-t border-hairline">
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
          </FilterSection>

          {/* Facet 5: Specific Brand — multi-select checkboxes */}
          <FilterSection id="brand" title={translations[locale].catalogView.brandHeading} className="space-y-2.5 pt-3 border-t border-hairline">
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
          </FilterSection>

          {/* Facet: Gender Preference */}
          <FilterSection id="gender" title={translations[locale].catalogView.genderHeading} className="space-y-2.5 pt-3 border-t border-hairline">
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
          </FilterSection>

          {/* Facet: Year of Release (scrollable checkboxes, newest first) */}
          <FilterSection id="year" title={translations[locale].catalogView.yearHeading} className="space-y-2.5 pt-3 border-t border-hairline">
            {availableYearBuckets.length === 0 ? (
              <p className="text-sm text-secondary">{translations[locale].catalogView.yearNoData}</p>
            ) : (
              renderYearCheckboxes('mobile')
            )}
          </FilterSection>

          {/* Facet: Review rate — only enabled where a verified average exists */}
          <FilterSection id="review" title={translations[locale].catalogView.reviewHeading} className="space-y-2.5 pt-3 border-t border-hairline">
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
          </FilterSection>

          {/* Facet 6: Price Range (job 10/32 dual-handle slider) */}
          <FilterSection id="budget" title={translations[locale].catalogView.budgetHeading} className="space-y-2.5 pt-3 border-t border-hairline">
            <PriceSliderControls />
          </FilterSection>
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
        
        {/* Left Filter Sidebar (Desktop only) — sections individually collapsible */}
        <aside className="hidden md:block md:col-span-3 space-y-6 bg-surface p-5 border border-hairline">
          <div className="flex justify-between items-center border-b border-hairline pb-3">
            <h3 className="font-serif text-lg font-bold">{translations[locale].catalogView.filterKatalog}</h3>
          </div>

          <>
          {/* Facet 1: Brand Origin — actual brand countries, never ID/INT */}
          <FilterSection id="origin" title={translations[locale].catalogView.originHeading} className="space-y-2">
            {allCountries.length === 0 ? (
              <p className="text-xs text-secondary">{translations[locale].catalogView.originNoData}</p>
            ) : (
              // Brand Origin only: show the first 7 countries, the rest scroll
              // inside this section. 7 rows × 16px line-height + 6 × 6px gaps = 148px.
              <div className="space-y-1.5 text-xs max-h-[148px] overflow-y-auto pr-1">
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
          </FilterSection>

          {/* Facet 3: Olfactive Family */}
          <FilterSection id="family" title={translations[locale].catalogView.familyHeading} className="space-y-2 pt-2 border-t border-hairline">
            <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
              {allFamilies.map(fam => (
                <label key={fam} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFamilies.includes(fam)}
                    onChange={() => toggleFamily(fam)}
                    className="accent-bar"
                  />
                  <span>{sfpLabel(fam)}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Facet 4: Concentration */}
          <FilterSection id="concentration" title={translations[locale].catalogView.concentrationHeading} className="space-y-2 pt-2 border-t border-hairline">
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
          </FilterSection>

          {/* Facet 5: Specific Brand — multi-select checkboxes */}
          <FilterSection id="brand" title={translations[locale].catalogView.brandHeading} className="space-y-2 pt-2 border-t border-hairline">
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
          </FilterSection>

          {/* Facet: Gender Preference */}
          <FilterSection id="gender" title={translations[locale].catalogView.genderHeading} className="space-y-2 pt-2 border-t border-hairline">
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
          </FilterSection>

          {/* Facet: Year of Release (scrollable checkboxes, newest first) */}
          <FilterSection id="year" title={translations[locale].catalogView.yearHeading} className="space-y-2 pt-2 border-t border-hairline">
            {availableYearBuckets.length === 0 ? (
              <p className="text-xs text-secondary">{translations[locale].catalogView.yearNoData}</p>
            ) : (
              renderYearCheckboxes('desktop')
            )}
          </FilterSection>

          {/* Facet: Review rate — only enabled where a verified average exists */}
          <FilterSection id="review" title={translations[locale].catalogView.reviewHeading} className="space-y-2 pt-2 border-t border-hairline">
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
          </FilterSection>

          {/* Facet 6: Price Range (job 10/32 dual-handle slider) */}
          <FilterSection id="budget" title={translations[locale].catalogView.budgetHeading} className="space-y-2 pt-2 border-t border-hairline">
            <PriceSliderControls />
          </FilterSection>
          </>
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
                      </div>
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
                    </div>
                  </div>
                  {/* Item 9/32 skeleton matches the simplified card:
                      photo + brand/title + reference price only. */}
                  <div className="space-y-3 pt-3 border-t border-hairline">
                    <div className="flex justify-between items-baseline">
                      <div className="h-3.5 w-24 bg-hairline/40" />
                      <div className="h-4 w-28 bg-hairline/60" />
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
                        {/* Item 9/32: the card photo is a verified real photo
                            (perfume.image_url) when one exists. When no
                            canonical photo exists yet, the Bottle
                            illustration remains as an honest fallback —
                            it is never presented as a real photo. */}
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
                            concentrationLabel={perfume.concentration}
                            size="sm"
                            showFill={false}
                          />
                        )}

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
                          {isCompareMode && (
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
                          )}
                        </div>

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

                        {/* Item 9/32: description and notes are NOT on the
                            card anymore — they live only in the product
                            detail, which opens when the photo (or the
                            title) is tapped. The note-chip shortcut is
                            gone with them; note filtering still works
                            from the detail page and from active filters. */}

                        {/* Sprint 3: match % from saved quiz answers; cold-start banner replaces it */}
                        {savedQuiz.hasRealAnswers && (
                          <p className="text-[12px] font-mono tabular-nums text-ink pt-1">
                            {fmt(translations[locale].common.matchPercent, calculateMatchScore(perfume, savedQuiz.answers).matchScore)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom row (item 9/32): reference price only. The
                        bottle size suffix and the "price checked on"
                        badge are removed from the card — both live only
                        in the product detail. The sample-data badge is
                        kept: removing it would hide that a price is
                        sample data. View Specs and Try it First buttons
                        are removed from the card — detail opens on
                        photo/title tap, and Try it First (owned-gated,
                        PR #18) lives in the detail. */}
                    <div className="space-y-3 pt-3 border-t border-hairline">
                      <div className="flex justify-between items-baseline text-xs font-mono">
                        <span className="text-secondary flex items-center gap-1.5">
                          <span>{translations[locale].catalogView.hargaReferensi}</span>
                          {perfume.price_is_sample ? (
                            <span className="px-1 py-0.5 bg-surface border border-hairline text-[12px] font-sans">
                              {translations[locale].sampleDataBadge}
                            </span>
                          ) : null}
                        </span>
                        <span className="font-bold text-ink tabular-nums">{formatCurrency(perfume.reference_price_idr, locale)}</span>
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
