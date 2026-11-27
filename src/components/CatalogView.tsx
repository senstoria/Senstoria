import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search,
  SlidersHorizontal,
  X,
  Heart,
  Check,
  Layers, 
  ExternalLink, 
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  History,
  ArrowUpDown
} from 'lucide-react';
import { SeedPerfume, CanonicalOccasionTag } from '../data/seedPerfumes.ts';
import { translations, fmt, Locale, formatCurrency } from '../lib/i18n.ts';
import { Bottle } from './Bottle.tsx';
import { BuyOptionsSheet } from './BuyOptionsSheet.tsx';
import { FilterRightDrawer } from './FilterRightDrawer.tsx';
import { EmptyState } from './EmptyState.tsx';
import { perfumeMatchesFamily } from '../lib/derivedCalculations.ts';
import {
  parseCatalogQuery,
  serializeCatalogQuery,
  computeSearchSuggestions,
  honestSearchSuggestion,
  newestFirst,
  countActiveFilters,
  FAMILY_TILES,
  DEFAULT_CATALOG_SORT,
  EMPTY_CATALOG_QUERY,
  type CatalogSortKey,
  type CatalogQueryState,
  type SearchSuggestion,
} from '../lib/catalogShop.ts';
import { calculateMatchScore, readSavedQuizAnswers } from '../lib/scentScoring.ts';
import type { StatePreview } from '../lib/statePreview.ts';
import { ViewError } from './StateViews.tsx';

interface CatalogViewProps {
  perfumes: SeedPerfume[];
  isLoading?: boolean;
  onSelectPerfume: (id: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onOpenTryItFirst: (id: string) => void;
  // Founder correction 16 (1 Nov 2026): opens the existing Finder view
  // from the cold-start banner button. Optional so the view still renders
  // its banner text alone when no navigation handler is supplied; App
  // always supplies it (setView('finder')). No new page is created.
  onGoToFinder?: () => void;
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
  // Tahap 2 (§4): keadaan layar lewat `?state=…` + jalan keluarnya.
  // loading → skeleton asli; empty → data dianggap kosong (EmptyState
  // alami); empty-filter → pencarian awal 'zzzz' (tidak cocok apa pun);
  // error → panel ViewError; offline/destructive tidak berlaku di sini.
  previewState?: StatePreview | null;
  onClearPreview?: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  perfumes,
  isLoading = false,
  onSelectPerfume,
  wishlistIds,
  onToggleWishlist,
  compareIds,
  onToggleCompare,
  // Tahap 2 (kartu produk gaya Nike): onOpenTryItFirst and
  // ownedPerfumeIds are destructured again — the card's Buy pop-up
  // offers Try It First as JOIN WAITLIST ONLY via onOpenTryItFirst,
  // still owned-gated (PR #18): owned perfumes get the e-commerce
  // options only, no Try It First entry in the pop-up.
  onOpenTryItFirst,
  ownedPerfumeIds,
  onGoToFinder,
  initialFilterNote,
  initialFilterBrand,
  initialFilterFamily,
  locale,
  reviewAverages,
  previewState = null,
  onClearPreview,
}) => {
  // Tahap 2 (§4): `?state=empty` — katalog kosong: data diperlakukan
  // sebagai kosong, sehingga EmptyState alami layar ini yang tampil.
  const displayPerfumes = previewState === 'empty' ? [] : perfumes;
  // Fase N3 (Audit Step 3): keadaan awal Katalog dari query URL
  // (?q=&sort=&family=...) — dibaca sekali saat mount; lazy
  // initializer di bawah memakainya per-bidang, dengan initialFilter*
  // (navigasi silang dari Detail) sebagai fallback. ?state= preview
  // menonaktifkan pembacaan ini supaya harness Tahap 2 tidak terganggu.
  // Validasi ada di parseCatalogQuery: nilai tak dikenal dibuang, bukan
  // ditebak.
  const urlInitial: CatalogQueryState | null =
    previewState === null ? parseCatalogQuery(window.location.search) : null;
  // Kehadiran param mentah: parse mengembalikan []/'' untuk param yang
  // tidak ada, sehingga fallback ke initialFilter* (navigasi silang
  // dari Detail — App.tsx catalogFilterFamily/Brand/Note) harus
  // memeriksa kehadiran param, bukan null. Query menang per-bidang
  // bila param-nya ada; bila tidak ada, initialFilter* yang dipakai.
  const urlParams: URLSearchParams | null =
    previewState === null ? new URLSearchParams(window.location.search) : null;
  // Tahap 2 (§4): `?state=empty-filter` — pencarian awal yang tidak
  // cocok dengan apa pun; input tetap terisi dan bisa dihapus pengguna.
  const [searchQuery, setSearchQuery] = useState(previewState === 'empty-filter' ? 'zzzz' : (urlInitial?.q ?? ''));
  // Tahap 2: perfume whose Buy pop-up (BuyOptionsSheet, catalog variant)
  // is open; null = closed. The pop-up is closed via X/Escape/backdrop
  // (BottomSheetOrModal) or by choosing Try It First, which hands off
  // to the Stage 1 waitlist modal via onOpenTryItFirst.
  const [buyPerfume, setBuyPerfume] = useState<SeedPerfume | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(urlInitial?.origins ?? []);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>(urlParams?.has('family') ? (urlInitial?.families ?? []) : (initialFilterFamily ? [initialFilterFamily] : []));
  const [selectedConcentrations, setSelectedConcentrations] = useState<string[]>(urlInitial?.concentrations ?? []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(urlParams?.has('brand') ? (urlInitial?.brands ?? []) : (initialFilterBrand ? [initialFilterBrand] : []));
  const [selectedGenders, setSelectedGenders] = useState<string[]>(urlInitial?.genders ?? []);
  const [selectedYearBuckets, setSelectedYearBuckets] = useState<string[]>(urlInitial?.years ?? []);
  // Fase N3 (C7): filter Occasion — tag kanonik dari seed
  // (occasion_tags). Parfum tanpa tag tidak cocok dengan pilihan apa
  // pun (tidak pernah ditebak).
  const [selectedOccasions, setSelectedOccasions] = useState<CanonicalOccasionTag[]>(urlInitial?.occasions ?? []);
  // Year of Release (founder 1 Nov 2026 07:31 WIB): the dropdown from
  // PR #29 is reverted to a plain scrollable checkbox list, styled
  // exactly like Brand Origin (first 7 visible, rest scroll inside
  // the section). Multi-select is inherent to checkboxes.
  const [minReviewRate, setMinReviewRate] = useState<number | null>(urlInitial?.reviewRate ?? null);
  const [selectedNote, setSelectedNote] = useState<string>(urlParams?.has('note') ? (urlInitial?.note ?? '') : (initialFilterNote || ''));
  // Tahap 1 (founder 1 Nov 2026 12:49 WIB): the PR #31 dual-handle
  // slider is REPLACED IN FULL by input + radio Harga controls — the
  // slider is gone, not kept as a shortcut. Bands are a founder
  // decision: the top band "> Rp 1.000.000" deliberately does not
  // distinguish Rp 1.500.000 from Rp 5.000.000. An empty max input
  // means NO upper bound (displayed as "Rp X+"), so a perfume above
  // any typed max is never silently dropped while the max is empty.
  // The filtered field is the same reference_price_idr as before
  // (sample-data semantics unchanged); only the control changed.
  // Behaviour, documented: picking a radio fills min/max; typing in
  // either input cancels the radio selection (band becomes custom).
  // Inputs are clamped so min never exceeds max.
  const PRICE_BANDS: { id: string; min: number; max: number | null }[] = [
    { id: '0-100k', min: 0, max: 100000 },
    { id: '100k-250k', min: 100000, max: 250000 },
    { id: '250k-500k', min: 250000, max: 500000 },
    { id: '500k-1m', min: 500000, max: 1000000 },
    { id: 'over-1m', min: 1000000, max: null },
  ];
  const [priceMin, setPriceMin] = useState(urlInitial?.priceMin ?? 0);
  const [priceMax, setPriceMax] = useState<number | null>(urlInitial?.priceMax ?? null);
  // Band awal dicocokkan dari min/max URL (bila sama persis dengan satu
  // band); bila tidak, band kosong = kustom.
  const [priceBand, setPriceBand] = useState<string | null>(() => {
    if (!urlInitial || (urlInitial.priceMin === 0 && urlInitial.priceMax === null)) return null;
    return PRICE_BANDS.find(b => b.min === urlInitial.priceMin && b.max === urlInitial.priceMax)?.id ?? null;
  });
  const isPriceFilterActive = priceMin > 0 || priceMax !== null;
  const resetPriceFilter = () => { setPriceMin(0); setPriceMax(null); setPriceBand(null); };
  const priceRangeLabel = priceMax === null
    ? `${formatCurrency(priceMin, locale)}+`
    : `${formatCurrency(priceMin, locale)} – ${formatCurrency(priceMax, locale)}`;
  // Fase N3 (C2): urutan baku Katalog adalah "Terbaru dulu" (year-desc)
  // — bukan lagi Nama (A–Z). "Terbaru" = release_year desc dengan
  // urutan seed sebagai penyeimbang; kedua parfum terbit saat ini tidak
  // punya release_year, jadi urutannya adalah urutan seed.
  const [sortBy, setSortBy] = useState<CatalogSortKey>(urlInitial?.sort ?? DEFAULT_CATALOG_SORT);
  // Fase N3 (C7): drawer filter memakai DRAFT — pilihan di dalam drawer
  // baru berlaku saat "Apply" ditekan; X/backdrop/Escape membuang draft.
  // State asli (yang dibaca chips/grid/URL) tidak berubah selama drawer
  // terbuka. Pola yang sama dengan popup "Lihat Semua" yang sudah ada —
  // hanya saja di sini draft-nya mencakup SEMUA dimensi drawer, bukan
  // satu seksi. Footer lama (Hapus Semua + Tutup) diganti "Reset (n)" +
  // "Apply" mengikuti Shop 07; "Apply" di sini nyata (commit draft),
  // bukan tombol tutup yang menyamar.
  interface FilterDraft {
    countries: string[];
    families: string[];
    concentrations: string[];
    brands: string[];
    genders: string[];
    years: string[];
    occasions: CanonicalOccasionTag[];
    reviewRate: number | null;
    note: string;
    priceMin: number;
    priceMax: number | null;
    priceBand: string | null;
    sortBy: CatalogSortKey;
  }
  const [filterDraft, setFilterDraft] = useState<FilterDraft | null>(null);
  const snapshotFilters = (): FilterDraft => ({
    countries: selectedCountries,
    families: selectedFamilies,
    concentrations: selectedConcentrations,
    brands: selectedBrands,
    genders: selectedGenders,
    years: selectedYearBuckets,
    occasions: selectedOccasions,
    reviewRate: minReviewRate,
    note: selectedNote,
    priceMin,
    priceMax,
    priceBand,
    sortBy,
  });
  const toggleInList = <T,>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
  const openFilterDrawer = () => {
    setFilterDraft(snapshotFilters());
    setIsFilterPanelOpen(true);
  };
  const closeFilterDrawer = () => {
    // Membuang draft: pilihan yang tidak di-Apply tidak pernah
    // menyentuh state asli. filterDraft juga dihapus supaya effFilters
    // kembali membaca snapshot state asli saat drawer tertutup.
    setFilterDraft(null);
    setIsFilterPanelOpen(false);
  };
  const updateDraft = (patch: Partial<FilterDraft>) =>
    setFilterDraft(prev => (prev ? { ...prev, ...patch } : prev));
  const resetDraft = () =>
    setFilterDraft(prev => (prev ? {
      ...prev,
      countries: [],
      families: [],
      concentrations: [],
      brands: [],
      genders: [],
      years: [],
      occasions: [],
      reviewRate: null,
      note: '',
      priceMin: 0,
      priceMax: null,
      priceBand: null,
      sortBy: DEFAULT_CATALOG_SORT,
    } : prev));
  const applyDraft = () => {
    if (!filterDraft) {
      setIsFilterPanelOpen(false);
      return;
    }
    const dd = filterDraft;
    setSelectedCountries(dd.countries);
    setSelectedFamilies(dd.families);
    setSelectedConcentrations(dd.concentrations);
    setSelectedBrands(dd.brands);
    setSelectedGenders(dd.genders);
    setSelectedYearBuckets(dd.years);
    setSelectedOccasions(dd.occasions);
    setMinReviewRate(dd.reviewRate);
    setSelectedNote(dd.note);
    setPriceMin(dd.priceMin);
    setPriceMax(dd.priceMax);
    setPriceBand(dd.priceBand);
    setSortBy(dd.sortBy);
    setFilterDraft(null);
    setIsFilterPanelOpen(false);
  };
  // Nilai efektif di dalam drawer: draft bila terbuka, snapshot state
  // asli bila tidak (drawer tidak ter-render saat tertutup, kecuali
  // selama animasi keluar 200ms — di sana draft yang tampil, dan itu
  // benar: panel yang meluncur pergi harus menunjukkan isinya).
  const effFilters: FilterDraft = filterDraft ?? snapshotFilters();
  // Hitungan filter aktif di draft, untuk label "Reset (n)".
  const draftActiveCount = filterDraft
    ? countActiveFilters({ ...EMPTY_CATALOG_QUERY, ...filterDraft, sort: filterDraft.sortBy })
    : 0;
  // Correction item 7: every filter section is individually collapsible
  // (accordion per section). All sections start expanded; tapping a
  // section header hides/shows only that section's options. The state is
  // shared by the desktop sidebar and the mobile sheet (same section ids).
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const FilterSection = ({ id, title, selectedLabel, className, children }: { id: string; title: string; selectedLabel?: string; className?: string; children: React.ReactNode }) => {
    const collapsed = !!collapsedSections[id];
    return (
      <div className={className}>
        <button
          type="button"
          aria-expanded={!collapsed}
          onClick={() => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }))}
          className="w-full flex items-center justify-between gap-2 cursor-pointer text-left"
        >
          <span className="flex items-baseline gap-2 min-w-0">
            <span className="text-sm font-semibold text-ink">{title}</span>
            {selectedLabel ? <span className="text-xs font-normal text-secondary truncate">({selectedLabel})</span> : null}
          </span>
          {collapsed ? <ChevronDown className="w-4 h-4 shrink-0 text-secondary" /> : <ChevronUp className="w-4 h-4 shrink-0 text-secondary" />}
        </button>
        {!collapsed && children}
      </div>
    );
  };
  // Fase N3 (C7): kontrol Harga di drawer menulis ke DRAFT, bukan ke
  // state asli — berlaku hanya saat Apply. Aturan input sama seperti
  // sebelumnya (pilih radio mengisi min/max; ketik membatalkan radio;
  // min tidak pernah melebihi max).
  const onDraftPriceMinInput = (raw: string) => {
    const v = raw === '' ? 0 : Math.max(0, Number(raw) || 0);
    const nextMax = effFilters.priceMax !== null && v > effFilters.priceMax ? v : effFilters.priceMax;
    updateDraft({ priceBand: null, priceMin: v, priceMax: nextMax });
  };
  const onDraftPriceMaxInput = (raw: string) => {
    const v = raw === '' ? null : Math.max(0, Number(raw) || 0);
    const nextMin = v !== null && v < effFilters.priceMin ? v : effFilters.priceMin;
    updateDraft({ priceBand: null, priceMin: nextMin, priceMax: v });
  };
  const draftPriceRangeLabel = effFilters.priceMax === null
    ? `${formatCurrency(effFilters.priceMin, locale)}+`
    : `${formatCurrency(effFilters.priceMin, locale)} – ${formatCurrency(effFilters.priceMax, locale)}`;
  const isDraftPriceActive = effFilters.priceMin > 0 || effFilters.priceMax !== null;
  // Tahap 1: shared Harga (Price) controls, used by the filter drawer.
  // Fase N3: membaca dan menulis DRAFT (effFilters), bukan state asli.
  // Two number inputs (min/max, Rp) plus radio bands. Inputs are
  // native, so keyboard control and screen-reader labels come from the
  // browser.
  const PriceControls = ({ variant }: { variant: 'mobile' | 'desktop' }) => {
    const t = translations[locale].catalogView;
    const compact = variant === 'desktop';
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={effFilters.priceMin === 0 ? '' : effFilters.priceMin}
            placeholder={t.priceMinPlaceholder}
            aria-label={t.priceMinLabel}
            onChange={e => onDraftPriceMinInput(e.target.value)}
            className={compact ? 'w-full px-3 py-2 bg-card border border-hairline text-xs tabular-nums focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus' : 'w-full px-3.5 py-2.5 bg-card border border-hairline text-sm tabular-nums focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus'}
          />
          <span aria-hidden="true" className="text-secondary shrink-0">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={effFilters.priceMax ?? ''}
            placeholder={t.priceMaxPlaceholder}
            aria-label={t.priceMaxLabel}
            onChange={e => onDraftPriceMaxInput(e.target.value)}
            className={compact ? 'w-full px-3 py-2 bg-card border border-hairline text-xs tabular-nums focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus' : 'w-full px-3.5 py-2.5 bg-card border border-hairline text-sm tabular-nums focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus'}
          />
        </div>
        <div className={compact ? 'space-y-1.5 text-xs' : 'space-y-2'}>
          {PRICE_BANDS.map(band => (
            <label key={band.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`priceBand-${variant}`}
                checked={effFilters.priceBand === band.id}
                onChange={() => updateDraft({ priceMin: band.min, priceMax: band.max, priceBand: band.id })}
                className="accent-bar shrink-0"
              />
              <span className="tabular-nums">{band.max === null ? `> ${formatCurrency(band.min, locale)}` : `${formatCurrency(band.min, locale)} – ${formatCurrency(band.max, locale)}`}</span>
            </label>
          ))}
        </div>
        {isDraftPriceActive ? (
          <button
            type="button"
            onClick={() => updateDraft({ priceMin: 0, priceMax: null, priceBand: null })}
            className="text-xs font-medium underline cursor-pointer"
          >
            {t.priceReset}
          </button>
        ) : (
          <p className="text-xs text-secondary">{t.priceAllLabel}</p>
        )}
      </div>
    );
  };
  // Tahap 1, popup filter gaya Zalora (Asal Brand, Specific Brand,
  // Year of Release): one shared state for desktop sidebar and mobile
  // sheet. Each section shows only a search input + a "Lihat Semua"
  // button; the checkable option list lives in the popup. The section
  // search text pre-fills the popup search when the popup opens.
  // Draft selections inside the popup are applied only by "Tambah";
  // "Hapus" clears the draft inside the panel (apply with Tambah);
  // closing via X/backdrop/Escape discards the draft (cancel).
  // Ordering: Brand Origin keeps Indonesia first, then alphabetical
  // (existing rule, not pure Zalora alphabetical); Specific Brand is
  // alphabetical; Year of Release keeps newest-first (chronological,
  // not alphabetical) — both retentions are deliberate and noted in
  // the PR body.
  type PopupSectionKind = 'origin' | 'brand' | 'year';
  const [popupSection, setPopupSection] = useState<PopupSectionKind | null>(null);
  const [popupSearch, setPopupSearch] = useState('');
  const [popupDraft, setPopupDraft] = useState<string[]>([]);
  const [originSearch, setOriginSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [yearSearch, setYearSearch] = useState('');
  const openPopup = (kind: PopupSectionKind) => {
    setPopupSection(kind);
    // Fase N3 (C7): popup "Lihat Semua" bersarang di dalam drawer — draft
    // di dalamnya disemai dari DRAFT drawer (effFilters), bukan state
    // asli, supaya "Tambah" hanya mengubah draft drawer.
    setPopupDraft(kind === 'origin' ? [...effFilters.countries] : kind === 'brand' ? [...effFilters.brands] : [...effFilters.years]);
    setPopupSearch(kind === 'origin' ? originSearch : kind === 'brand' ? brandSearch : yearSearch);
  };
  const closePopup = () => setPopupSection(null);
  const applyPopup = () => {
    if (popupSection === 'origin') updateDraft({ countries: popupDraft });
    else if (popupSection === 'brand') updateDraft({ brands: popupDraft });
    else if (popupSection === 'year') updateDraft({ years: popupDraft });
    setPopupSection(null);
  };
  const renderSearchFilterRow = (kind: PopupSectionKind, variant: 'mobile' | 'desktop') => {
    const t = translations[locale].catalogView;
    const search = kind === 'origin' ? originSearch : kind === 'brand' ? brandSearch : yearSearch;
    const setSearch = kind === 'origin' ? setOriginSearch : kind === 'brand' ? setBrandSearch : setYearSearch;
    // Fase N3 (C7): hitungan pilihan membaca DRAFT drawer.
    const selectedCount = kind === 'origin' ? effFilters.countries.length : kind === 'brand' ? effFilters.brands.length : effFilters.years.length;
    const compact = variant === 'desktop';
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.popupSearchPlaceholder}
            aria-label={t.popupSearchPlaceholder}
            className={compact ? 'w-full pl-9 pr-3 py-2 bg-card border border-hairline text-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus' : 'w-full pl-10 pr-3 py-3 bg-card border border-hairline text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus'}
          />
        </div>
        <button
          type="button"
          onClick={() => openPopup(kind)}
          aria-label={t.viewAll}
          className="text-xs font-medium underline cursor-pointer"
        >
          {t.viewAll}{selectedCount > 0 ? ` (${selectedCount} ${t.selectedSuffix})` : ''}
        </button>
      </div>
    );
  };
  const renderPopup = () => {
    if (!popupSection) return null;
    const t = translations[locale].catalogView;
    // Computed here (not at the top of the component body) so the
    // option lists below are already initialised when this runs.
    const popupOptionItems: { id: string; label: string }[] = popupSection === 'origin'
      ? allCountries.map(c => ({ id: c, label: c }))
      : popupSection === 'brand'
        ? allBrands.map(b => ({ id: b, label: b }))
        : YEAR_BUCKETS.map(b => ({ id: b.id, label: b.label }));
    const popupVisibleOptions = popupOptionItems.filter(o =>
      o.label.toLowerCase().includes(popupSearch.toLowerCase().trim()));
    const popupSectionTitle = popupSection === 'origin'
      ? translations[locale].catalogView.originHeading
      : popupSection === 'brand'
        ? translations[locale].catalogView.brandHeading
        : translations[locale].catalogView.yearHeading;
    // Founder correction on PR #35: the Zalora-style filter popup is a
    // full-height drawer docked to the RIGHT edge (not a floating
    // centred modal). Header and footer are sticky; only the option
    // list scrolls. All popup behaviour is unchanged: search pre-fill,
    // draft selections, Hapus clears the draft, Tambah applies it, and
    // closing via X/backdrop/Escape discards the draft.
    return (
      <FilterRightDrawer
        isOpen
        onClose={closePopup}
        locale={locale}
        title={popupSectionTitle}
        // Founder follow-up (1 Nov 2026): the search field lives in the
        // sticky header block, not in the scrollable body, so title +
        // X + search AND the Hapus/Tambah footer stay visible together
        // while only the option list scrolls.
        search={(
          <div className="relative">
            <Search className="w-4 h-4 text-secondary absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={popupSearch}
              onChange={e => setPopupSearch(e.target.value)}
              placeholder={t.popupSearchPlaceholder}
              aria-label={t.popupSearchPlaceholder}
              className="w-full pl-10 pr-3 py-2.5 bg-card border border-hairline text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>
        )}
        footer={(
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPopupDraft([])}
              className="min-h-[44px] px-4 py-2 border border-border text-xs font-semibold cursor-pointer"
            >
              {t.hapus}
            </button>
            <button
              type="button"
              onClick={applyPopup}
              className="flex-1 min-h-[44px] py-2.5 bg-bar text-paper text-xs font-semibold cursor-pointer"
            >
              {t.popupApply}
            </button>
          </div>
        )}
      >
        <div className="space-y-4 pb-2">
          {popupVisibleOptions.length === 0 ? (
            <p className="text-sm text-secondary">{t.popupNoOptions}</p>
          ) : (
            <div className="space-y-1.5 pr-1">
              {popupVisibleOptions.map(opt => (
                <label key={opt.id} className="flex items-center gap-3 min-h-[44px] px-3 py-2 border border-hairline bg-card cursor-pointer active:bg-surface rounded-full">
                  <input
                    type="checkbox"
                    checked={popupDraft.includes(opt.id)}
                    onChange={() => setPopupDraft(prev => prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id])}
                    className="w-4 h-4 accent-bar shrink-0"
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </FilterRightDrawer>

    );
  };
  // Sprint 3: saved quiz answers drive per-card match % (cold-start banner when none)
  const [savedQuiz] = useState(readSavedQuizAnswers);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  // Tahap 4 (instruksi founder 1 Nov 2026 12:01 WIB): Catalog compare
  // is gated behind this toggle, but there is NO per-card compare
  // button in any state — the PR #28 button was DELETED, not hidden.
  // When the mode is on, tapping a full card (photo or name, or any
  // other non-control area of the card) toggles that perfume in/out of
  // the comparison, reusing the existing compareIds flow (max 3,
  // enforced in App.handleToggleCompare, CMP-01; a 4th pick is refused
  // with the existing toast). Turning the toggle off does not clear an
  // existing selection — the tray still offers it (PR #28 behaviour).
  // Controls inside the card keep their own actions and do NOT toggle:
  // Buy opens the pop-up, Love toggles wishlist, brand filters by
  // brand — each stops propagation to the card toggle. While the mode
  // is on, tapping a card does NOT open Detail; Detail is reached by
  // turning the mode off and tapping photo/name as usual, or from the
  // Compare page itself (CompareView column headers already open
  // Detail via onSelectPerfume). No new Detail button is added here.
  const [isCompareMode, setIsCompareMode] = useState(false);
  // 2 Nov 2026 (permintaan baru a–d): there is no static left filter
  // panel and no hidden-panel state anymore. The Filter button in the
  // sort row opens the full right filter drawer (isFilterPanelOpen);
  // the grid is always full-width. Active-filter chips stay visible.

  // Requirement 1: Skeleton cards appear only if loading exceeds 300ms
  // (Tahap 2: `?state=loading` memaksa loading yang sama — skeleton
  // tetap baru muncul setelah 300ms, bukan langsung saat mount.)
  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    const loading = isLoading || previewState === 'loading';
    if (!loading) {
      setShowSkeleton(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [isLoading, previewState]);

  // Requirement 2: Filter changes keep current cards visible with a subtle opacity dip while results update
  const [isFilterDipping, setIsFilterDipping] = useState(false);
  const filterKey = `${searchQuery}_${selectedCountries.join(',')}_${selectedFamilies.join(',')}_${selectedConcentrations.join(',')}_${selectedBrands.join(',')}_${selectedGenders.join(',')}_${selectedYearBuckets.join(',')}_${selectedOccasions.join(',')}_${minReviewRate ?? ''}_${selectedNote}_${priceMin}_${priceMax ?? ''}_${sortBy}`;
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

  // Fase N3 (Audit Step 3): keadaan Katalog ditulis ke URL
  // (?q=&sort=&family=...) lewat replaceState — reload/share tidak
  // kehilangan filter/sort/pencarian, dan tombol Back tidak mengarah ke
  // entri baru setiap kali filter berubah. Dibaca kembali saat mount
  // oleh urlInitial di atas. Dinonaktifkan saat ?state= preview (harness
  // Tahap 2): halaman preview tidak boleh menulis URL preview-nya.
  // Tidak menulis saat isLoading — skeleton bukan keadaan filter.
  useEffect(() => {
    if (previewState !== null || isLoading) return;
    const qs = serializeCatalogQuery({
      q: searchQuery,
      sort: sortBy,
      families: selectedFamilies,
      brands: selectedBrands,
      genders: selectedGenders,
      origins: selectedCountries,
      concentrations: selectedConcentrations,
      years: selectedYearBuckets,
      occasions: selectedOccasions,
      reviewRate: minReviewRate,
      note: selectedNote,
      priceMin,
      priceMax,
    });
    const next = qs ? `/catalog?${qs}` : '/catalog';
    if (window.location.pathname === '/catalog' && window.location.search !== (qs ? `?${qs}` : '')) {
      window.history.replaceState(window.history.state, '', next);
    }
  }, [previewState, isLoading, searchQuery, sortBy, selectedFamilies, selectedBrands, selectedGenders, selectedCountries, selectedConcentrations, selectedYearBuckets, selectedOccasions, minReviewRate, selectedNote, priceMin, priceMax]);

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
  const allBrands = useMemo(() => Array.from(new Set(displayPerfumes.map(p => p.brand))).sort(), [displayPerfumes]);
  const allCountries = useMemo(() => {
    const set = new Set<string>(INITIAL_COUNTRIES);
    displayPerfumes.forEach(p => { const c = perfumeCountry(p); if (c) set.add(c); });
    return Array.from(set).sort(sortCountries);
  }, [displayPerfumes]);
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
  // Tahap 1, Review rate: minimum-rating options 2+ / 3+ / 4+ / 5
  // (previously 1-5 stars). Still only enabled when at least one
  // displayed perfume has a verified average; with none, the facet
  // shows its honest no-data note and no rating is invented.
  const availableReviewRates = useMemo(() => {
    if (!reviewAverages) return [] as number[];
    const avgs = displayPerfumes.map(p => reviewAverages[p.id]).filter((v): v is number => typeof v === 'number');
    return avgs.length > 0 ? [5, 4, 3, 2] : [];
  }, [displayPerfumes, reviewAverages]);
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
  const toggleOccasion = (val: CanonicalOccasionTag) => {
    setSelectedOccasions(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCountries([]);
    setSelectedFamilies([]);
    setSelectedConcentrations([]);
    setSelectedBrands([]);
    setSelectedGenders([]);
    setSelectedYearBuckets([]);
    setSelectedOccasions([]);
    setMinReviewRate(null);
    setSelectedNote('');
    resetPriceFilter();
    setSortBy(DEFAULT_CATALOG_SORT);
  };

  const hasActiveFilters = searchQuery !== '' ||
    selectedCountries.length > 0 ||
    selectedFamilies.length > 0 ||
    selectedConcentrations.length > 0 ||
    selectedBrands.length > 0 ||
    selectedGenders.length > 0 ||
    selectedYearBuckets.length > 0 ||
    selectedOccasions.length > 0 ||
    minReviewRate !== null ||
    isPriceFilterActive ||
    selectedNote !== '';

  // Multi-facet filtering logic (CAT-03)
  const filteredPerfumes = useMemo(() => {
    return displayPerfumes.filter(perfume => {
      // 1. Search Query (name, brand, notes, description, family)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = perfume.name.toLowerCase().includes(q);
        const matchBrand = perfume.brand.toLowerCase().includes(q);
        const matchNotes = (perfume.top_notes + ' ' + perfume.heart_notes + ' ' + perfume.base_notes).toLowerCase().includes(q);
        // Fase N3 (C3): pencarian juga cocok dengan keluarga aroma
        // (nama keluarga + label Shop: "oriental" cocok dengan Ambery
        // lewat label tampilannya).
        const matchFamily = SFP_FAMILIES.some(f => {
          const label = sfpLabel(f.id);
          return perfumeMatchesFamily(perfume, f.id) &&
            (f.id.toLowerCase().includes(q) || label.toLowerCase().includes(q));
        });
        if (!matchName && !matchBrand && !matchNotes && !matchFamily) return false;
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

      // 10. Harga / Price Filter (Tahap 1 input + radio, same
      // reference_price_idr field as the old slider and radio bands).
      // An empty max means no upper bound, so perfumes above any
      // typed max still match while the max input is empty.
      if (isPriceFilterActive) {
        const p = perfume.reference_price_idr;
        if (p < priceMin) return false;
        if (priceMax !== null && p > priceMax) return false;
      }

      // 11. Occasion (Fase N3, C7): cocok dengan occasion_tags
      // kanonik parfum. Parfum tanpa tag tidak cocok dengan pilihan apa
      // pun (tidak pernah ditebak).
      if (selectedOccasions.length > 0) {
        const tags = perfume.occasion_tags ?? [];
        if (!selectedOccasions.some(o => tags.includes(o))) return false;
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
    selectedOccasions,
    minReviewRate,
    reviewAverages,
    selectedNote,
    priceMin,
    priceMax,
    sortBy
  ]);

  // Fase N3 (C3): saran pencarian dari parfum TERBIT saja — nama,
  // keluarga, atau note. Dihitung dari displayPerfumes (published-only
  // di App.tsx); draft tidak pernah masuk ke sini.
  const searchSuggestions: SearchSuggestion[] = useMemo(
    () => computeSearchSuggestions(displayPerfumes, searchQuery, SFP_FAMILIES),
    [displayPerfumes, searchQuery]
  );
  // Saran jujur untuk empty state pencarian: kata pertama yang
  // benar-benar menghasilkan hasil dari data terbit.
  const emptySuggestion = useMemo(
    () => honestSearchSuggestion(displayPerfumes, SFP_FAMILIES),
    [displayPerfumes]
  );
  // Fase N3 (C1): parfum terbaru terbit — "terbaru" = release_year
  // desc, urutan seed sebagai penyeimbang.
  const newestPerfume = useMemo(
    () => newestFirst(displayPerfumes)[0] ?? null,
    [displayPerfumes]
  );
  // Fase N3: hero + ubin keluarga hanya tampil di tampilan landing
  // (tanpa pencarian, tanpa filter aktif, bukan loading). Begitu
  // pengguna mencari/memfilter, hasil mengambil alih layar.
  const isLanding = !isLoading && searchQuery.trim() === '' && !hasActiveFilters;
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const showSuggestions = isSearchFocused && searchQuery.trim() !== '' && searchSuggestions.length > 0;
  // Ubin keluarga yang dipilih saat ini (maks. satu — ubin adalah
  // jalan pintas ke filter Keluarga aroma).
  const singleTileFamily = selectedFamilies.length === 1 ? selectedFamilies[0] : null;
  // Fase N3 (C1): target gulir "Lihat Semua" di hero.
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  // Tahap 2 (§4): keadaan error lewat `?state=error` — panel kata biasa +
  // tombol coba lagi; input yang sudah diisi tidak hilang.
  if (previewState === 'error') {
    return <ViewError locale={locale} onRetry={onClearPreview ?? (() => {})} />;
  }

  return (
    <div className="space-y-8">
      
      {/* ── CATALOG HEADER (Standardized Pattern) ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-4">
        <div className="space-y-1">
          <span className="label-caption block">
            {translations[locale].catalogView.katalogTerkurasi}
          </span>
          <h2 className="font-display text-ink">
            {translations[locale].catalogView.eksplorasiKoleksiParfum}
          </h2>
          <p className="text-[14px] leading-[20px] text-secondary font-mono">
            {fmt(translations[locale].catalogView.menampilkan0DariTotal1Parfum, filteredPerfumes.length, displayPerfumes.length)}
            <span className="ml-2 px-1.5 py-0.5 bg-surface border border-hairline text-[12px] whitespace-nowrap">
              {translations[locale].sampleDataBadge}
            </span>
          </p>
        </div>

        {/* 2 Nov 2026 (permintaan baru d): the header row keeps only the
            title block. The old mobile-only filter toggle is gone: the
            Filter button in the sort row below opens the same full
            right drawer on every width (the drawer is full-width on
            narrow screens), so a second trigger is not needed. */}
      </div>

      {/* Fase N3 (C1): hero parfum terbaru terbit + ubin keluarga aroma
          — hanya di tampilan landing. Hero memakai parfum terbit
          pertama menurut urutan "Terbaru dulu" (saat ini The Perfection,
          karena belum ada release_year di data terbit). TIDAK ADA harga
          di hero (J-12/P8 — harga hanya di Detail). Foto asli dipakai
          bila ada; bila belum ada, ilustrasi Bottle yang sama seperti
          kartu — tidak pernah disajikan sebagai foto asli. */}
      {isLanding && newestPerfume && (
        <section aria-label={translations[locale].catalogView.heroEyebrow} className="bg-surface border border-hairline p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="shrink-0 mx-auto sm:mx-0 w-[120px] h-[120px] flex items-center justify-center">
            {newestPerfume.image_url ? (
              <img
                src={newestPerfume.image_url}
                alt={`${newestPerfume.brand} ${newestPerfume.name}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <Bottle
                fragranceId={newestPerfume.id}
                name={newestPerfume.name}
                brand={newestPerfume.brand}
                size="lg"
                showFill={false}
              />
            )}
          </div>
          <div className="flex-1 space-y-1 text-center sm:text-left">
            <span className="label-caption block">
              {translations[locale].catalogView.heroEyebrow}
            </span>
            <h3 className="font-display text-[24px] leading-[28px] text-ink">
              {newestPerfume.brand} {newestPerfume.name}
            </h3>
            <p className="text-sm text-secondary">
              {newestPerfume.concentration} · {newestPerfume.reference_price_size_ml} ml
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
              <button
                type="button"
                onClick={() => onSelectPerfume(newestPerfume.id)}
                className="min-h-[44px] px-5 py-2.5 bg-bar text-paper text-sm font-semibold rounded-full cursor-pointer"
              >
                {translations[locale].catalogView.heroViewDetail}
              </button>
              <button
                type="button"
                onClick={() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="min-h-[44px] px-5 py-2.5 bg-card border border-bar text-sm font-semibold rounded-full cursor-pointer"
              >
                {translations[locale].catalogView.heroSeeAll}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Fase N3 (C1): ubin keluarga aroma — latar mengikuti tint
          keluarga N1 (palette.ts); TIDAK ada palet baru. Hitungan adalah
          jumlah parfum TERBIT per keluarga (Woody 0, Floral 1, Fresh 0,
          Oriental 0 dengan data saat ini). Ubin adalah jalan pintas:
          mengetuknya memilih satu keluarga; mengetuk lagi membatalkan.
          Keluarga kosong tetap ditampilkan dengan hitungan 0 dan
          empty state jujur saat diketuk — bukan parfum karangan. */}
      {isLanding && (
        <section aria-label={translations[locale].catalogView.tilesTitle} className="space-y-3">
          <h3 className="font-display text-[20px] leading-[24px] text-ink">
            {translations[locale].catalogView.tilesTitle}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {FAMILY_TILES.map(tile => {
              const count = displayPerfumes.filter(p => perfumeMatchesFamily(p, tile.key)).length;
              const isActive = singleTileFamily === tile.key;
              return (
                <button
                  key={tile.key}
                  type="button"
                  onClick={() => setSelectedFamilies(isActive ? [] : [tile.key])}
                  aria-pressed={isActive}
                  className={`min-h-[76px] rounded-control p-3 text-left cursor-pointer ${tile.tintClass} ${isActive ? 'ring-2 ring-ink' : 'ring-1 ring-hairline'}`}
                >
                  <span className="block text-sm font-bold text-ink">{tile.label}</span>
                  <span className="block text-xs text-muted">
                    {locale === 'id' ? `${count} parfum` : count === 1 ? '1 fragrance' : `${count} fragrances`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 2 Nov 2026 (permintaan baru b + c): the sort row no longer
          holds Product Comparison — that toggle moved into the Finder
          quiz banner below, beside Finder, with non-boxy rounded
          controls (see the banner). This row now holds ONLY the Filter
          button, stuck exactly beside the Sort-by dropdown (Filter
          left, Sort-by right, one shared gap, no spacer pushing them
          to opposite ends). The Filter button opens the full right
          filter drawer; it no longer hides/shows a static panel,
          because the static left panel is gone (see (d) below). */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openFilterDrawer}
          aria-pressed={isFilterPanelOpen}
          aria-label={isFilterPanelOpen ? translations[locale].catalogView.hideFilters : translations[locale].catalogView.showFilters}
          className="min-h-[44px] px-3 py-1.5 rounded-control border border-bar text-xs font-semibold flex items-center gap-1.5 bg-card hover:bg-surface cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{isFilterPanelOpen ? translations[locale].catalogView.hideFilters : translations[locale].catalogView.showFilters}</span>
        </button>
        <div className="flex items-center gap-2">
          <label className="text-xs text-secondary whitespace-nowrap">{translations[locale].catalogView.sortLabel}</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            aria-label={translations[locale].catalogView.sortLabel}
            className="min-h-[44px] px-3 py-1.5 rounded-control bg-card border border-bar text-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus font-medium cursor-pointer"
          >
            {translations[locale].catalogView.sortOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
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
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onKeyDown={e => {
              if (e.key === 'Enter') saveSearchQuery(searchQuery);
            }}
            placeholder={translations[locale].catalogView.cariNamaParfumBrandAtauNotesCthBerg}
            aria-label={translations[locale].catalogView.searchLabel}
            className="w-full pl-10 pr-10 py-3 bg-card border border-bar text-base md:text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label={translations[locale].catalogView.clearLabel}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-secondary hover:text-ink cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Fase N3 (C3): saran pencarian — nama, keluarga, atau note dari
            parfum terbit saja. onMouseDown preventDefault supaya klik
            tidak memicu blur input sebelum onClick berjalan. Memilih
            saran mengisi query dan menyimpan riwayat. */}
        {showSuggestions && (
          <div role="listbox" aria-label={translations[locale].catalogView.suggestionsLabel} className="border border-hairline bg-card shadow-card">
            {searchSuggestions.map(s => (
              <button
                key={`${s.kind}:${s.text}`}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  setSearchQuery(s.text);
                  saveSearchQuery(s.text);
                  setIsSearchFocused(false);
                }}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-[44px] text-left text-sm hover:bg-surface cursor-pointer"
              >
                <span className="text-ink">{s.text}</span>
                <span className="text-xs text-secondary whitespace-nowrap">
                  {s.kind === 'perfume'
                    ? translations[locale].catalogView.suggestionPerfume
                    : s.kind === 'family'
                      ? translations[locale].catalogView.suggestionFamily
                      : translations[locale].catalogView.suggestionNote}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Search History Chips — Fase N3: hanya saat query kosong,
            supaya riwayat tidak mendorong hasil pencarian ke bawah. */}
        {searchQuery.trim() === '' && searchHistory.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-secondary flex items-center gap-1 text-[12px] whitespace-nowrap">
              <History className="w-3 h-3" /> {translations[locale].catalogView.historyLabel}
            </span>
            {searchHistory.map(item => (
              <button
                key={item}
                onClick={() => setSearchQuery(item)}
                className="px-2 py-0.5 bg-surface border border-hairline text-[12px] text-bar hover:border-ink transition cursor-pointer whitespace-nowrap"
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

        {/* Olfactive Family Quick Tabs — ide Figma (27 Nov 2026):
            kembali menjadi pill: aktif isi hitam + teks putih,
            nonaktif putih + border hitam 1px; tinggi 36px, scroll
            horizontal .chip-scroll (halus + tertahan). Sebelumnya
            tab teks bergaris bawah (Nike Fase 2). */}
        <div className="chip-scroll flex items-center gap-4 overflow-x-auto py-1 text-xs">
          <button
            onClick={() => setSelectedFamilies([])}
            className={`px-3.5 py-1.5 min-h-[36px] rounded-full flex items-center whitespace-nowrap transition-all active:scale-[0.98] border ${
              selectedFamilies.length === 0 
                ? 'bg-bar text-paper border-bar font-bold' 
                : 'bg-paper border-ink text-ink hover:border-bar font-medium'
            }`}
          >
            {translations[locale].catalogView.semuaAroma} ({displayPerfumes.length})
          </button>
          {allFamilies.map(fam => {
            const isSelected = selectedFamilies.includes(fam);
            const count = displayPerfumes.filter(p => perfumeMatchesFamily(p, fam)).length;
            return (
              <button
                key={fam}
                onClick={() => {
                  setSelectedFamilies(isSelected ? [] : [fam]);
                }}
                className={`px-3.5 py-1.5 min-h-[36px] rounded-full flex items-center whitespace-nowrap transition-all active:scale-[0.98] border ${
                  isSelected 
                    ? 'bg-bar text-paper border-bar font-bold' 
                    : 'bg-paper border-ink text-ink hover:border-bar font-medium'
                }`}
              >
                {sfpLabel(fam)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tahap 0 (26 Nov 2026, follow-up PR #62): bar chips filter AKTIF
          dipindah KE LUAR div space-y-4 di atas — parent space-y-4
          berakhir tepat di tepi bawah chips bar, sehingga sticky tidak
          punya ruang scroll dan bar ikut tergulung (terukur: setelah
          scroll 723px, bar berada di top -135, bukan menempel). Sebagai
          anak langsung wadah root (yang memanjang sampai grid), sticky
          kini punya containing block setinggi halaman katalog. Posisi
          menempelnya di bawah header via .sticky-below-header (bukan
          top-0, yang membuatnya meluncur ke balik header z-30). */}
        {/* Active Filter Chips (Requirement 2: Sticky chips above grid with one 'Clear all') */}
        {hasActiveFilters && (
          <div className="sticky sticky-below-header z-20 bg-paper py-2.5 px-3 border border-bar flex flex-wrap items-center gap-2 text-xs">
            <span className="text-secondary font-semibold text-[12px] uppercase tracking-wider whitespace-nowrap">
              {translations[locale].catalogView.filterAktif}
            </span>

            {selectedCountries.map(country => (
              <span key={country} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
                <span>{country}</span>
                <button type="button" onClick={() => toggleCountry(country)} aria-label={fmt(translations[locale].catalogView.removeFilterAria, country)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedFamilies.map(fam => (
              <span key={fam} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
                <span>{sfpLabel(fam)}</span>
                <button type="button" onClick={() => toggleFamily(fam)} aria-label={fmt(translations[locale].catalogView.removeFilterAria, sfpLabel(fam))} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedConcentrations.map(conc => (
              <span key={conc} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 font-mono whitespace-nowrap">
                <span>{conc}</span>
                <button type="button" onClick={() => toggleConcentration(conc)} aria-label={fmt(translations[locale].catalogView.removeFilterAria, conc)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {isPriceFilterActive && (
              <span className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 font-mono whitespace-nowrap">
                <span>
                  {priceRangeLabel}
                </span>
                <button type="button" onClick={resetPriceFilter} aria-label={fmt(translations[locale].catalogView.removeFilterAria, priceRangeLabel)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedBrands.map(brand => (
              <span key={brand} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
                <span>{translations[locale].admin.formBrand} {brand}</span>
                <button type="button" onClick={() => toggleBrand(brand)} aria-label={fmt(translations[locale].catalogView.removeFilterAria, brand)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedGenders.map(gender => (
              <span key={gender} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
                <span>{gender === 'feminine' ? translations[locale].catalogView.genderFeminine : gender === 'masculine' ? translations[locale].catalogView.genderMasculine : translations[locale].catalogView.genderUnisex}</span>
                <button type="button" onClick={() => toggleGender(gender)} aria-label={fmt(translations[locale].catalogView.removeFilterAria, gender)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {selectedYearBuckets.map(bucketId => (
              <span key={bucketId} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 font-mono whitespace-nowrap">
                <span>{YEAR_BUCKETS.find(b => b.id === bucketId)?.label}</span>
                <button type="button" onClick={() => toggleYearBucket(bucketId)} aria-label={fmt(translations[locale].catalogView.removeFilterAria, YEAR_BUCKETS.find(b => b.id === bucketId)?.label ?? bucketId)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {/* Fase N3 (C7): chip Occasion. */}
            {selectedOccasions.map(occ => (
              <span key={occ} className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
                <span>{translations[locale].catalogView.occasionOptions.find(o => o.value === occ)?.label ?? occ}</span>
                <button type="button" onClick={() => toggleOccasion(occ)} aria-label={fmt(translations[locale].catalogView.removeFilterAria, translations[locale].catalogView.occasionOptions.find(o => o.value === occ)?.label ?? occ)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {minReviewRate !== null && (
              <span className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
                <span>{minReviewRate}{translations[locale].catalogView.reviewAndUp}</span>
                <button type="button" onClick={() => setMinReviewRate(null)} aria-label={fmt(translations[locale].catalogView.removeFilterAria, `${minReviewRate}${translations[locale].catalogView.reviewAndUp}`)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedNote !== '' && (
              <span className="bg-card border border-bar px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
                <span>Note: {selectedNote}</span>
                <button type="button" onClick={() => setSelectedNote('')} aria-label={fmt(translations[locale].catalogView.removeFilterAria, `Note: ${selectedNote}`)} className="cursor-pointer hover:text-error"><X className="w-3 h-3" /></button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-bar hover:underline font-bold text-xs ml-auto flex items-center gap-1 cursor-pointer px-2 py-1 min-h-[44px] bg-surface border border-hairline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{translations[locale].catalogView.hapusSemua}</span>
            </button>
          </div>
        )}

      {/* 2 Nov 2026 (permintaan baru d): the full filter panel.
          The old mobile bottom sheet AND the old desktop left sidebar
          are both gone; pressing Filter (sort row, every width) opens
          this panel (FilterRightDrawer: portal to document.body,
          main page frozen, only the panel scrolls, 440px desktop /
          100% mobile). Nike Fase 3 (26 Nov 2026): di HP panel ini
          tampil sebagai sheet bawah putih dengan handle (items-end,
          max-h 92dvh), di desktop tetap drawer kanan 440px; baris
          opsi filter kini pill outline (Nike). It contains EVERY
          filter section, not just the three "Lihat Semua" ones, with
          the same section content as before (accordion per section,
          shared collapse state, search rows, checkboxes/radios,
          Harga input+radio, rating with its honest no-data message).
          Fase N3 (C7, 27 Nov 2026): drawer kini DRAFT — pilihan di
          dalam drawer baru berlaku saat "Apply" (commit ke state
          asli); X/backdrop/Escape membuang draft. Footer "Reset (n)"
          + "Apply" mengikuti Shop 07. "Apply" di sini nyata, bukan
          tombol tutup yang menyamar — perilaku lama (langsung
          berlaku + footer Hapus Semua/Tutup) diganti oleh keputusan
          ini. Seksi diurutkan mengikuti Shop 07: Sort, Keluarga
          aroma, Brand, Untuk siapa, Occasion, Harga, Asal Brand,
          Konsentrasi, Tahun Rilis, Rating. */}
      <FilterRightDrawer
        isOpen={isFilterPanelOpen}
        onClose={closeFilterDrawer}
        locale={locale}
        title={translations[locale].catalogView.filterHeading}
        ariaLabel={translations[locale].catalogView.filterHeading}
        footer={(
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetDraft}
              disabled={draftActiveCount === 0}
              className="min-h-[44px] px-4 py-2 border border-border text-xs font-semibold cursor-pointer rounded-full disabled:opacity-40 disabled:cursor-default"
            >
              {fmt(translations[locale].catalogView.drawerReset, draftActiveCount)}
            </button>
            <button
              type="button"
              onClick={applyDraft}
              className="flex-1 min-h-[44px] py-2.5 bg-bar text-paper text-xs font-semibold cursor-pointer rounded-full"
            >
              {translations[locale].catalogView.drawerApply}
            </button>
          </div>
        )}
      >
        <div className="space-y-6 pb-2">
          {/* Fase N3 (C7): Urutkan — radio, baku "Terbaru dulu" (C2).
              Di sini sort ikut draft: berlaku saat Apply, sama seperti
              filter lainnya. */}
          <FilterSection id="sort" title={translations[locale].catalogView.sortHeading} selectedLabel={translations[locale].catalogView.sortOptions.find(o => o.value === effFilters.sortBy)?.label} className="space-y-2.5">
            <div className="grid grid-cols-1 gap-2">
              {translations[locale].catalogView.sortOptions.map(o => (
                <label key={o.value} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface rounded-full">
                  <input
                    type="radio"
                    name="filterPanelSort"
                    checked={effFilters.sortBy === o.value}
                    onChange={() => updateDraft({ sortBy: o.value as CatalogSortKey })}
                    className="w-4 h-4 accent-bar"
                  />
                  <span className="text-sm font-medium">{o.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Fase N3 (C7): Keluarga aroma — pill multi-select (SFP 7),
              hitungan parfum TERBIT. Label tampil sama seperti ubin
              (Ambery, bukan Amber) supaya tidak ada dua nama untuk
              satu keluarga. */}
          <FilterSection id="family" title={translations[locale].catalogView.tilesTitle} className="space-y-2.5 pt-3 border-t border-hairline">
            <div className="flex flex-wrap gap-2">
              {allFamilies.map(fam => {
                const isSelected = effFilters.families.includes(fam);
                const count = displayPerfumes.filter(p => perfumeMatchesFamily(p, fam)).length;
                return (
                  <button
                    key={fam}
                    type="button"
                    onClick={() => updateDraft({ families: toggleInList(effFilters.families, fam) })}
                    aria-pressed={isSelected}
                    className={`px-3.5 py-1.5 min-h-[36px] rounded-full flex items-center whitespace-nowrap border text-xs ${isSelected ? 'bg-bar text-paper border-bar font-bold' : 'bg-paper border-ink text-ink hover:border-bar font-medium'}`}
                  >
                    {sfpLabel(fam)} ({count})
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Facet 5: Specific Brand — Zalora pattern: search + Lihat Semua popup */}
          <FilterSection id="brand" title={translations[locale].catalogView.brandHeading} className="space-y-2.5 pt-3 border-t border-hairline">
            {renderSearchFilterRow('brand', 'mobile')}
          </FilterSection>

          {/* Facet: Gender Preference */}
          <FilterSection id="gender" title={translations[locale].catalogView.genderHeading} className="space-y-2.5 pt-3 border-t border-hairline">
            {allGenders.length === 0 ? (
              <p className="text-sm text-secondary">{translations[locale].catalogView.genderNoData}</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {allGenders.map(g => (
                  <label key={g} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface rounded-full">
                    <input
                      type="checkbox"
                      checked={effFilters.genders.includes(g)}
                      onChange={() => updateDraft({ genders: toggleInList(effFilters.genders, g) })}
                      className="w-4 h-4 accent-bar"
                    />
                    <span className="text-sm font-medium">{g === 'feminine' ? translations[locale].catalogView.genderFeminine : g === 'masculine' ? translations[locale].catalogView.genderMasculine : translations[locale].catalogView.genderUnisex}</span>
                  </label>
                ))}
              </div>
            )}
          </FilterSection>

          {/* Fase N3 (C7): Occasion — tag kanonik (7), pill
              multi-select. Parfum tanpa tag tidak cocok dengan pilihan
              apa pun. */}
          <FilterSection id="occasion" title={translations[locale].catalogView.occasionHeading} className="space-y-2.5 pt-3 border-t border-hairline">
            <div className="flex flex-wrap gap-2">
              {translations[locale].catalogView.occasionOptions.map(o => {
                const isSelected = effFilters.occasions.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => updateDraft({ occasions: toggleInList(effFilters.occasions, o.value) })}
                    aria-pressed={isSelected}
                    className={`px-3.5 py-1.5 min-h-[36px] rounded-full flex items-center whitespace-nowrap border text-xs ${isSelected ? 'bg-bar text-paper border-bar font-bold' : 'bg-paper border-ink text-ink hover:border-bar font-medium'}`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Facet 6: Harga / Price (Tahap 1 input + radio, slider removed) */}
          <FilterSection id="budget" title={translations[locale].catalogView.priceHeading} selectedLabel={isDraftPriceActive ? draftPriceRangeLabel : undefined} className="space-y-2.5 pt-3 border-t border-hairline">
            <PriceControls variant="mobile" />
          </FilterSection>

          {/* Facet 1: Brand Origin — Zalora pattern: search + Lihat Semua popup */}
          <FilterSection id="origin" title={translations[locale].catalogView.originHeading} className="space-y-2.5 pt-3 border-t border-hairline">
            {allCountries.length === 0 ? (
              <p className="text-sm text-secondary">{translations[locale].catalogView.originNoData}</p>
            ) : (
              renderSearchFilterRow('origin', 'mobile')
            )}
          </FilterSection>

          {/* Facet 4: Concentration */}
          <FilterSection id="concentration" title={translations[locale].catalogView.concentrationHeading} className="space-y-2.5 pt-3 border-t border-hairline">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allConcentrations.map(conc => (
                <label key={conc} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface font-mono rounded-full">
                  <input
                    type="checkbox"
                    checked={effFilters.concentrations.includes(conc)}
                    onChange={() => updateDraft({ concentrations: toggleInList(effFilters.concentrations, conc) })}
                    className="w-4 h-4 accent-bar"
                  />
                  <span className="text-sm font-medium">{conc}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Facet: Year of Release — Zalora pattern, newest first in popup */}
          <FilterSection id="year" title={translations[locale].catalogView.yearHeading} className="space-y-2.5 pt-3 border-t border-hairline">
            {availableYearBuckets.length === 0 ? (
              <p className="text-sm text-secondary">{translations[locale].catalogView.yearNoData}</p>
            ) : (
              renderSearchFilterRow('year', 'mobile')
            )}
          </FilterSection>

          {/* Facet: Review rate — only enabled where a verified average exists */}
          <FilterSection id="review" title={translations[locale].catalogView.reviewHeading} selectedLabel={effFilters.reviewRate === null ? undefined : effFilters.reviewRate === 5 ? '5 ★' : `${effFilters.reviewRate}${translations[locale].catalogView.reviewAndUp}`} className="space-y-2.5 pt-3 border-t border-hairline">
            {availableReviewRates.length === 0 ? (
              <p className="text-sm text-secondary">{translations[locale].catalogView.reviewNoData}</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {availableReviewRates.map(min => (
                  <label key={min} className="flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 border border-hairline bg-card cursor-pointer active:bg-surface rounded-full">
                    <input
                      type="radio"
                      name="filterPanelReviewRate"
                      checked={effFilters.reviewRate === min}
                      onChange={() => updateDraft({ reviewRate: min })}
                      className="w-4 h-4 accent-bar"
                    />
                    <span className="text-sm font-medium">{min === 5 ? '5 ★' : `${min}${translations[locale].catalogView.reviewAndUp}`}</span>
                  </label>
                ))}
              </div>
            )}
          </FilterSection>

        </div>
      </FilterRightDrawer>


      {/* Tahap 1: Zalora popup panel (shared by the full filter drawer; nested drawer) */}
      {renderPopup()}

      {/* 2 Nov 2026 (permintaan baru d): no left sidebar anymore.
          The two-column layout (sidebar col-span-3 + grid col-span-9)
          is gone with it; the product grid below is always full-width
          (col-span-12), exactly as it was when Hide Filter hid the
          old panel. The filter sections now live only in the full
          right drawer above. */}
      <div>

        {/* Right: Product Cards Grid (CAT-01, equal card heights, 2-line title clamp) */}
        <section className="md:col-span-12 space-y-6">
          
          {showSkeleton ? (
            /* Requirement 1: Skeleton cards with exact final card dimensions (no layout shift) */
            /* 2 Nov 2026 (founder 15:12 WIB): Catalog cards 4 per row on
               desktop — skeleton and cards changed TOGETHER (same
               grid classes) so there is no layout shift. 3 Nov 2026
               (founder 13:49 WIB, Tugas 1 redefined — desktop already
               clear, mobile only): base column changed 1 → 2, so
               mobile is now 2 per row; sm stays 2, lg stays 4. */
            <div role="status" aria-label={translations[locale].stateViews.loadingLabel} className="columns-2 lg:columns-4 gap-5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`catalog-skeleton-${idx}`}
                  className="flex flex-col space-y-3 break-inside-avoid mb-[23px]"
                >
                  <div className="space-y-3">
                    <div className="aspect-square w-full bg-gray-100 flex items-center justify-center relative p-3">
                      <div className="w-16 h-28 bg-ink border border-hairline" />
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <div className="w-8 h-8 bg-card border border-hairline" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-baseline">
                        <div className="h-3.5 w-24 bg-ink" />
                        <div className="h-3.5 w-12 bg-ink" />
                      </div>
                      <div className="h-[48px] mt-1 space-y-1.5">
                        <div className="h-5 w-4/5 bg-ink" />
                        <div className="h-5 w-2/5 bg-ink" />
                      </div>
                    </div>
                  </div>
                  {/* Amended Tahap 2 skeleton matches the Nike-style
                      card: photo (1:1) + names left + Buy pill right,
                      no concentration, no price label — and since
                      2 Nov 2026 no price bar either (price removed
                      from the card, so the skeleton drops its price
                      placeholder to match the final card). */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-stretch justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="h-4 w-3/5 bg-ink" />
                        <div className="h-5 w-2/5 bg-ink" />
                      </div>
                      <div className="h-[50px] w-24 rounded-full bg-ink" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPerfumes.length === 0 ? (
            /* Fase N3 (C3/C5): empty state dibedakan — pencarian tanpa
               hasil (dengan saran JUJUR sebagai aksi kedua: kata yang
               benar-benar menghasilkan hasil dari data terbit),
               keluarga tunggal tanpa parfum terbit, atau filter umum. */
            searchQuery.trim() !== '' ? (
              <EmptyState
                title={fmt(translations[locale].catalogView.searchEmptyTitle, searchQuery.trim())}
                body={translations[locale].catalogView.emptyBody}
                ctaLabel={translations[locale].catalogView.clearAllFilters}
                onCtaClick={clearAllFilters}
                secondaryCtaLabel={emptySuggestion ? fmt(translations[locale].catalogView.searchTrySuggestion, emptySuggestion) : undefined}
                onSecondaryCtaClick={emptySuggestion ? () => setSearchQuery(emptySuggestion) : undefined}
                iconType="shelf"
              />
            ) : singleTileFamily ? (
              <EmptyState
                title={fmt(translations[locale].catalogView.familyEmptyTitle, sfpLabel(singleTileFamily))}
                body={translations[locale].catalogView.familyEmptyBody}
                ctaLabel={translations[locale].catalogView.clearAllFilters}
                onCtaClick={clearAllFilters}
                iconType="shelf"
              />
            ) : (
              <EmptyState
                title={translations[locale].catalogView.emptyTitle}
                body={translations[locale].catalogView.emptyBody}
                ctaLabel={translations[locale].catalogView.clearAllFilters}
                onCtaClick={clearAllFilters}
                iconType="shelf"
              />
            )
          ) : (
            <>
            {/* 2 Nov 2026 (permintaan baru b): the Finder quiz banner
                bar now holds BOTH actions side by side, with
                NON-boxy frames (rounded-control, the 12px control
                radius from PR #17 — NOT the rounded-none squares of
                PR #40 item 18 and NOT full pills; the radius is a
                stated draft default, correctable at review):
                Compare (EN) / Bandingkan (ID) and Finder (EN) /
                Temukan (ID). The Compare toggle moved here from the
                sort row (deleted there, not duplicated); its behaviour
                is unchanged (full-card toggle, max 3, tray,
                CompareView). Adaptation, documented for review: the
                bar itself now renders ALWAYS, not only before the quiz
                is answered — otherwise moving Compare here would hide
                the toggle entirely once the quiz is answered, since
                the old banner was cold-start-only. After answers exist
                the bar shows just the two buttons (right-aligned);
                the cold-start text shows only while unanswered. The
                Detail-page banner is untouched (Finder only there). */}
            {/* Nike Fase 2: bar banner Finder/Compare — bukan lagi kartu
                biru; baris teks + tombol pill hitam di atas putih.
                Perilaku tidak berubah (Compare toggle max 3 + tray,
                Finder membuka kuesioner). */}
            <div className="py-1 text-[12px] text-secondary mb-6 flex flex-wrap items-center justify-between gap-3">
              {!savedQuiz.hasRealAnswers && (
                <span>{translations[locale].common.coldStartBanner}</span>
              )}
              <div className="flex flex-wrap items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsCompareMode(prev => !prev)}
                  aria-pressed={isCompareMode}
                  aria-label={translations[locale].catalogView.compareModeToggleAria}
                  className={`min-h-[44px] px-3 py-1.5 rounded-full border border-bar text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${isCompareMode ? 'bg-bar text-paper' : 'bg-paper text-ink hover:bg-surface'}`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{translations[locale].catalogView.compareShort}</span>
                </button>
                {onGoToFinder && (
                  <button
                    type="button"
                    onClick={onGoToFinder}
                    aria-label={translations[locale].common.finderButtonAria}
                    className="min-h-[44px] px-3 py-1.5 rounded-full border border-bar text-xs font-semibold flex items-center gap-1.5 bg-bar text-paper hover:bg-ink cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{translations[locale].common.finderButton}</span>
                  </button>
                )}
              </div>
            </div>
            {/* Figma ideas (27 Nov 2026): grid masonry 2 kolom foto-led —
                stagger memberi kesan kurasi (bukan grid seragam); jarak
                antar-kolom 20px, antar-baris 23px mengikuti referensi.
                Kartu sudut 0 arah Nike dipertahankan. Dengan katalog 2
                parfum, stagger-nya halus — tinggi kartu hanya berbeda
                dari bungkus nama (1 vs 2 baris). Fase N3 (C4): grid
                hasil tetap 2 kolom (Shop); ref untuk gulir "Lihat
                Semua" di hero. */}
            <div ref={gridRef} className={`columns-2 lg:columns-4 gap-5 transition-opacity duration-150 ${isFilterDipping ? 'opacity-70' : 'opacity-100'}`}>
              {filteredPerfumes.map((perfume, idx) => {
                const isWishlisted = wishlistIds.includes(perfume.id);
                const isCompared = compareIds.includes(perfume.id);

                return (
                  <div
                    key={perfume.id}
                    onClick={isCompareMode ? () => onToggleCompare(perfume.id) : undefined}
                    className={`flex flex-col space-y-3 break-inside-avoid mb-[23px] animate-card-enter ${isCompareMode ? 'cursor-pointer' : ''}`}
                    style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                  >
                    {/* Tahap 2 (kartu gaya Nike): plain 1:1 photo panel
                        above, text below — no card border/padding.
                        Outside compare mode the photo still opens
                        Detail (PR #30 behaviour kept). Tahap 4: while
                        compare mode is on, the photo instead toggles
                        compare, and the whole card body does the same
                        (outer div onClick above); the photo area is
                        keyboard-focusable (Enter/Space) with
                        aria-pressed showing the selected state, and a
                        selected card gets a "Terpilih / Selected"
                        badge only — no ring (founder 2 Nov 2026:
                        the black ring around a selected card is
                        removed; the badge alone marks selection).
                        Controls inside the card keep
                        their own actions and stop propagation, so Buy
                        (pop-up), Love (wishlist) and brand (brand
                        filter) never toggle compare. */}
                    <div className="space-y-3">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={`${perfume.brand} ${perfume.name}`}
                        aria-pressed={isCompareMode ? isCompared : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCompareMode) onToggleCompare(perfume.id);
                          else onSelectPerfume(perfume.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (isCompareMode) onToggleCompare(perfume.id);
                            else onSelectPerfume(perfume.id);
                          }
                        }}
                        className="aspect-square w-full bg-gray-100 flex items-center justify-center relative cursor-pointer group p-3 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        {/* Tahap 4: visible selected marker, compare
                            mode only. Koreksi badge (klarifikasi
                            founder 1 Nov 2026 20:36 WIB — yang
                            dimaksud BUKAN jarak antar kartu, melainkan
                            jarak badge ini dari tepi kartu/foto):
                            badge memakai rounded-chip (token 8px)
                            dan inset top-4/left-4 (dari top-2/left-2)
                            agar tidak mepet tepi dan tidak boxy.
                            Gap grid antar kartu TIDAK diubah; ring
                            kartu terpilih DIHAPUS per perintah
                            founder 2 Nov 2026 — hanya badge
                            Selected yang menandai kartu terpilih. */}
                        {isCompareMode && isCompared && (
                          <span className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-bar text-paper text-[12px] font-semibold px-2 py-1 rounded-chip whitespace-nowrap">
                            <Check className="w-3.5 h-3.5" />
                            {translations[locale].catalogView.compareSelectedLabel}
                          </span>
                        )}
                        {/* Item 9/32: the card photo is a verified real photo
                            (perfume.image_url) when one exists. When no
                            canonical photo exists yet, the Bottle
                            illustration remains as an honest fallback —
                            it is never presented as a real photo.
                            Amended: the fallback Bottle gets NO
                            concentrationLabel here, so it must not print
                            any concentration on the card;
                            Detail/Library keep their own labels. */}
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
                            size="sm"
                            showFill={false}
                          />
                        )}

                        {/* Top corner actions — Tahap 4: Love ONLY.
                            The PR #28 per-card compare button is
                            DELETED here (not hidden): in compare mode
                            the full card itself is the selector, so a
                            per-card icon would duplicate it and
                            contradict the founder instruction. Love
                            keeps its own action and stops propagation
                            so it never toggles compare. */}
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWishlist(perfume.id);
                            }}
                            className="min-h-[44px] min-w-[44px] p-2 rounded-full bg-white shadow-sm hover:bg-surface text-bar transition toggle-icon cursor-pointer active:scale-95 flex items-center justify-center"
                            title={translations[locale].catalogView.toggleWishlistTitle}
                            aria-label={translations[locale].catalogView.saveToWishlistAria}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-bar text-bar' : 'text-secondary'}`} />
                          </button>
                        </div>

                      </div>

                      {/* Amended Tahap 2 (koreksi founder 16:10–16:11 WIB,
                          contoh Nike image-98 + image-99): under the
                          photo, the name block sits LEFT and the Buy
                          pill sits RIGHT on the same block — NOT a
                          full-width Buy pill below the name. The
                          concentration is REMOVED from the card,
                          and the reference-price label is REMOVED
                          from the card: the price row is just the red
                          ± nominal. Font hierarchy (image-99), in
                          order Brand → Aroma → Price (REVISI 16:42 WIB,
                          crop image-100, menggantikan hierarki amendemen
                          1/2 awal): Brand first, SMALL, 14px/20px,
                          regular, black, normal capitalisation (the
                          PR #39 small-caps brand style is gone); Aroma
                          second, LARGER than Brand, 20px/26px, BOLD,
                          black; Price third, inside the same left
                          column, left-aligned, font-size EXACTLY the
                          Brand size (14px/20px), semibold, black
                          (dua warna 27 Nov 2026 — instruksi harga merah
                          Tahap 4 Luma SUDAH TIDAK berlaku; harga di
                          kartu pun sudah dihapus 2 Nov 2026, jadi
                          baris ini hanya dokumentasi historis).
                          Brand → Aroma and Aroma → Price share
                          one space-y-1 (4px) gap (amendemen 3, koreksi
                          17:02 WIB — diperkecil dari 8px). Brand is a
                          real button: it filters the catalog to that
                          brand via the existing Specific Brand
                          mechanism (no new brand page). Name is a
                          button too, opening Detail. */}
                      {/* Amendemen 3 (koreksi founder 17:02–17:03 WIB,
                          menggantikan gap dan tinggi pill amendemen 2):
                          Brand → Aroma → Harga memakai gap yang SAMA
                          tapi DIPERKECIL: space-y-1 (4px), dari 8px.
                          Brand tetap 14px/20px regular, Aroma tetap
                          20px/26px BOLD, Harga tetap = ukuran Brand.
                          Pill Buy di kanan BLOK NAMA saja (bukan
                          seluruh kolom kiri): tepi atas pill = tepi
                          atas Brand, tepi bawah pill = tepi bawah
                          Aroma, secara STRUKTURAL — pill memakai
                          self-stretch di dalam flex row yang hanya
                          berisi blok nama, jadi tingginya mengikuti
                          tinggi blok nama: line-height Brand 20px +
                          gap 4px + line-height Aroma 26px = 50px.
                          Tidak ada lagi tinggi tetap 52px yang bisa
                          meleset bila gap/line-height berubah. Harga
                          berada di bawah row nama+Buy (gap 4px yang
                          sama), di luar row itu, sehingga tidak ikut
                          menentukan tinggi pill. */}
                      {/* Tahap 0 (26 Nov 2026, B-01): di HP (< lg) pill Beli
                          pindah ke BAWAH blok nama (flex-col), bukan di
                          kanan — kotak nama di grid 2 kolom hanya ~80px
                          lebarnya sehingga "Enchantée" dan "The Perfection"
                          terpotong di tengah kata (terukur terpotong
                          24,9px / 23,2px oleh line-clamp-2). Di desktop
                          (lg+) susunan lama dipertahankan: nama di kiri,
                          pill di kanan dengan self-stretch. Catatan
                          Amendemen 3 di atas kini hanya berlaku untuk
                          susunan desktop. */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:justify-between lg:gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBrands([perfume.brand]);
                              }}
                              className="block min-h-[24px] flex items-center text-[14px] leading-[20px] text-ink hover:underline cursor-pointer text-left"
                            >
                              {perfume.brand}
                            </button>

                            <h3 className="text-[20px] leading-[26px] font-bold text-ink line-clamp-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isCompareMode) onToggleCompare(perfume.id);
                                  else onSelectPerfume(perfume.id);
                                }}
                                aria-pressed={isCompareMode ? isCompared : undefined}
                                className="cursor-pointer hover:underline text-left"
                              >
                                {perfume.name}
                              </button>
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBuyPerfume(perfume);
                            }}
                            aria-label={fmt(translations[locale].catalogView.buyButtonAria, perfume.brand, perfume.name)}
                            className="shrink-0 self-stretch min-h-[44px] w-full justify-center py-2 lg:w-auto lg:py-0 flex items-center rounded-full bg-bar hover:bg-ink text-paper font-medium text-[15px] px-6 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus cursor-pointer"
                          >
                            {translations[locale].catalogView.buyButton}
                          </button>
                        </div>

                          {/* Item 9/32: description and notes are NOT on the
                              card anymore — they live only in the product
                              detail, which opens when the photo (or the
                              title) is tapped outside compare mode
                              (in compare mode those taps toggle compare
                              instead). The note-chip shortcut is
                              gone with them; note filtering still works
                              from the detail page and from active filters. */}

                          {/* 2 Nov 2026 (permintaan baru a): HARGA DIHAPUS
                              DARI KARTU KATALOG. The red ± nominal row
                              that used to sit here (Brand → Aroma →
                              Price) is gone: no nominal, no ±, no red
                              price text, and no ± title/aria on the
                              card. Deliberately NOT changed: the price
                              DATA (reference_price_idr) stays in the
                              seed data; Detail, the Buy pop-up, and
                              Compare still show prices; the Harga /
                              Price filter section in the drawer still
                              filters on the same data (see the PR body
                              review question: should the Harga filter
                              also go now that card prices are gone?).
                              The sample-data badge that used to sit
                              beside the card price is gone with it —
                              sample labelling on the card now rests on
                              the "Sample data" badge beside the catalog
                              count, as before. Match % below is
                              untouched. */}
                          {/* Sprint 3: match % from saved quiz answers; cold-start banner replaces it */}
                          {savedQuiz.hasRealAnswers && (
                            <p className="text-[12px] font-mono tabular-nums text-ink">
                              {fmt(translations[locale].common.matchPercent, calculateMatchScore(perfume, savedQuiz.answers).matchScore)}
                            </p>
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

      {/* Tahap 2: the card Buy pop-up, reusing BuyOptionsSheet in
          catalog mode (NOT a second sheet). Exactly two options:
          Buy in E-Commerce (/go + disclosure) and Try It First as
          JOIN WAITLIST ONLY (Stage 1 flow via onOpenTryItFirst).
          No decant is sold here (Stage 2, gated, undecided).
          Owned-gated per PR #18: owned perfumes get no Try It First
          entry. Closes via X/Escape/backdrop (BottomSheetOrModal). */}
      <BuyOptionsSheet
        isOpen={buyPerfume !== null}
        onClose={() => setBuyPerfume(null)}
        perfume={buyPerfume}
        locale={locale}
        variant="catalog"
        showTryItFirst={buyPerfume !== null && !ownedPerfumeIds.includes(buyPerfume.id)}
        onJoinWaitlist={(id) => {
          setBuyPerfume(null);
          onOpenTryItFirst(id);
        }}
      />

    </div>
  );
};
