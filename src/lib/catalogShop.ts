// Fase N3 — Katalog pola Shop (C1–C7). Pure helpers for the Shop-landing
// catalog: URL query state, search suggestions, family tiles, newest-first
// ordering. No React, no DOM — unit-tested in catalogShop.test.ts.
//
// Data honesty (binding, pelajaran N2): every helper here takes the
// caller-supplied perfume list and never reaches for SEED_PERFUMES
// itself. Callers pass PUBLISHED_PERFUMES only, so the 22 draft rows can
// never leak into tiles, counts, suggestions, or the hero.
import { SeedPerfume, CanonicalOccasionTag } from '../data/seedPerfumes.ts';
import { perfumeMatchesFamily } from './derivedCalculations.ts';

export type CatalogSortKey =
  | 'name-asc'
  | 'name-desc'
  | 'brand-asc'
  | 'price-asc'
  | 'price-desc'
  | 'year-desc';

export const SORT_KEYS: CatalogSortKey[] = [
  'name-asc',
  'name-desc',
  'brand-asc',
  'price-asc',
  'price-desc',
  'year-desc',
];

// C2: "Terbaru dulu" is the catalog's default order. "Terbaru" = tanggal
// terbit seed, implemented as release_year desc with the seed order as
// the tiebreak (stable sort). Both published rows currently lack
// release_year, so the order is the seed order — never invented.
export const DEFAULT_CATALOG_SORT: CatalogSortKey = 'year-desc';

export const SFP_FAMILY_IDS = [
  'Amber',
  'Chypre',
  'Citrus',
  'Floral',
  'Fougère',
  'Leather',
  'Woody',
] as const;

// Broad Shop-category families (C1 tiles). The tile keys are the SFP
// match keys, except Oriental, which maps to the SFP 'Amber' key
// (substring 'amber' matches 'Ambery' — the mapping note already in
// CatalogView). Fresh has no SFP equivalent (same note); it matches the
// stored family string 'Fresh' directly.
export const TILE_FAMILY_IDS = ['Woody', 'Floral', 'Fresh', 'Amber'] as const;

export const GENDER_VALUES = ['masculine', 'feminine', 'unisex'] as const;

export const CONCENTRATION_VALUES = ['Extrait', 'Parfum', 'EDP', 'EDT', 'EDC'] as const;

// Canonical occasion vocabulary (SeedPerfume.occasion_tags). Labels live
// in i18n (catalogView.occasionOptions); this list is only the values.
export const OCCASION_VALUES = [
  'daily',
  'office',
  'casual',
  'date_night',
  'formal',
  'night_out',
  'sport',
] as const;

export interface CatalogQueryState {
  q: string;
  sort: CatalogSortKey;
  families: string[];
  brands: string[];
  genders: string[];
  origins: string[];
  concentrations: string[];
  years: string[];
  occasions: CanonicalOccasionTag[];
  reviewRate: number | null;
  note: string;
  priceMin: number;
  priceMax: number | null;
}

export const EMPTY_CATALOG_QUERY: CatalogQueryState = {
  q: '',
  sort: DEFAULT_CATALOG_SORT,
  families: [],
  brands: [],
  genders: [],
  origins: [],
  concentrations: [],
  years: [],
  occasions: [],
  reviewRate: null,
  note: '',
  priceMin: 0,
  priceMax: null,
};

const splitList = (raw: string | null): string[] => {
  if (!raw) return [];
  return Array.from(
    new Set(raw.split(',').map(s => s.trim()).filter(Boolean))
  );
};

const validList = (raw: string | null, allowed: readonly string[]): string[] =>
  splitList(raw).filter(v => allowed.includes(v));

const readNumber = (raw: string | null): number | null => {
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

/** Parse a catalog query string (window.location.search) into validated
 *  filter state. Unknown or invalid values are dropped, never guessed:
 *  an invalid sort falls back to the default, an invalid list entry is
 *  removed, a negative price is clamped to 0, and a max below the min is
 *  raised to the min (same rule as the price inputs). */
export function parseCatalogQuery(search: string): CatalogQueryState {
  const params = new URLSearchParams(search);
  const sortRaw = params.get('sort');
  const sort: CatalogSortKey =
    sortRaw !== null && (SORT_KEYS as string[]).includes(sortRaw)
      ? (sortRaw as CatalogSortKey)
      : DEFAULT_CATALOG_SORT;
  const priceMinRaw = readNumber(params.get('pmin'));
  const priceMin = priceMinRaw === null ? 0 : Math.max(0, priceMinRaw);
  const priceMaxRaw = readNumber(params.get('pmax'));
  const priceMax =
    priceMaxRaw === null ? null : Math.max(priceMin, Math.max(0, priceMaxRaw));
  const reviewRateRaw = readNumber(params.get('rate'));
  const reviewRate =
    reviewRateRaw !== null && [2, 3, 4, 5].includes(reviewRateRaw)
      ? reviewRateRaw
      : null;
  return {
    q: params.get('q') ?? '',
    sort,
    families: validList(params.get('family'), [
      ...SFP_FAMILY_IDS,
      'Fresh',
    ]),
    brands: splitList(params.get('brand')),
    genders: validList(params.get('gender'), GENDER_VALUES),
    origins: splitList(params.get('origin')),
    concentrations: validList(params.get('conc'), CONCENTRATION_VALUES),
    years: splitList(params.get('year')).filter(
      id => id === 'before-2000' || /^\d{4}$/.test(id)
    ),
    occasions: validList(params.get('occ'), OCCASION_VALUES) as CanonicalOccasionTag[],
    reviewRate,
    note: params.get('note') ?? '',
    priceMin,
    priceMax,
  };
}

/** Serialize catalog state to a query string (without the leading '?').
 *  Default/empty values are omitted, so a fresh catalog is just
 *  '/catalog' and a shared link carries only what differs. */
export function serializeCatalogQuery(s: CatalogQueryState): string {
  const params = new URLSearchParams();
  if (s.q.trim() !== '') params.set('q', s.q.trim());
  if (s.sort !== DEFAULT_CATALOG_SORT) params.set('sort', s.sort);
  if (s.families.length > 0) params.set('family', s.families.join(','));
  if (s.brands.length > 0) params.set('brand', s.brands.join(','));
  if (s.genders.length > 0) params.set('gender', s.genders.join(','));
  if (s.origins.length > 0) params.set('origin', s.origins.join(','));
  if (s.concentrations.length > 0)
    params.set('conc', s.concentrations.join(','));
  if (s.years.length > 0) params.set('year', s.years.join(','));
  if (s.occasions.length > 0) params.set('occ', s.occasions.join(','));
  if (s.reviewRate !== null) params.set('rate', String(s.reviewRate));
  if (s.note !== '') params.set('note', s.note);
  if (s.priceMin > 0) params.set('pmin', String(s.priceMin));
  if (s.priceMax !== null) params.set('pmax', String(s.priceMax));
  return params.toString();
}

/** Newest-first order (C2): release_year desc, seed order as the
 *  tiebreak (Array.sort is stable). */
export function newestFirst(perfumes: SeedPerfume[]): SeedPerfume[] {
  return [...perfumes].sort(
    (a, b) => (b.release_year ?? 0) - (a.release_year ?? 0)
  );
}

export interface FamilyTile {
  /** SFP match key (perfumeMatchesFamily). */
  key: string;
  /** Label shown on the tile (Nike Shop category name). */
  label: string;
  /** N1 family tint class — never a new palette value (T4). Woody and
   *  Oriental share Sand per the documented 15-key → 5-tint mapping. */
  tintClass: string;
}

export const FAMILY_TILES: FamilyTile[] = [
  { key: 'Woody', label: 'Woody', tintClass: 'bg-family-sand' },
  { key: 'Floral', label: 'Floral', tintClass: 'bg-family-blush' },
  { key: 'Fresh', label: 'Fresh', tintClass: 'bg-family-mist' },
  { key: 'Amber', label: 'Oriental', tintClass: 'bg-family-sand' },
];

export interface SearchSuggestion {
  text: string;
  kind: 'perfume' | 'family' | 'note';
}

/** Search suggestions (C3): names, families, and note phrases from the
 *  supplied (published-only) perfumes, matching the query. Order:
 *  names, then families, then notes; capped at `limit`. A family is
 *  suggested only when at least one supplied perfume matches it, so a
 *  suggestion never leads to an empty grid. */
export function computeSearchSuggestions(
  perfumes: SeedPerfume[],
  query: string,
  familyOptions: { id: string; label: string }[],
  limit = 5
): SearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [];
  const out: SearchSuggestion[] = [];
  const seen = new Set<string>();
  const push = (text: string, kind: SearchSuggestion['kind']) => {
    const key = `${kind}:${text.toLowerCase()}`;
    if (seen.has(key) || out.length >= limit) return;
    seen.add(key);
    out.push({ text, kind });
  };
  for (const p of perfumes) {
    if (p.name.toLowerCase().includes(q)) push(p.name, 'perfume');
  }
  for (const f of familyOptions) {
    const count = perfumes.filter(p => perfumeMatchesFamily(p, f.id)).length;
    if (count > 0 && f.label.toLowerCase().includes(q)) {
      push(f.label, 'family');
    }
  }
  const notePhrases = new Set<string>();
  for (const p of perfumes) {
    for (const field of [p.top_notes, p.heart_notes, p.base_notes]) {
      for (const n of field.split(',')) {
        const t = n.trim();
        if (t !== '') notePhrases.add(t);
      }
    }
  }
  for (const n of notePhrases) {
    if (n.toLowerCase().includes(q)) push(n, 'note');
  }
  return out;
}

/** Honest "Coba '…'" term for the search empty state (C3): a term that
 *  is guaranteed to return results — the first family (in the given
 *  option order) with at least one supplied perfume, lowercased; else
 *  the first note phrase of the first supplied perfume; else null. The
 *  plan's literal 'woody' is NOT used: no published perfume matches it,
 *  so it would suggest a dead end. */
export function honestSearchSuggestion(
  perfumes: SeedPerfume[],
  familyOptions: { id: string; label: string }[]
): string | null {
  for (const f of familyOptions) {
    const count = perfumes.filter(p => perfumeMatchesFamily(p, f.id)).length;
    if (count > 0) return f.label.toLowerCase();
  }
  for (const p of perfumes) {
    for (const field of [p.top_notes, p.heart_notes, p.base_notes]) {
      const first = field.split(',')[0]?.trim();
      if (first) return first.toLowerCase();
    }
  }
  return null;
}

/** Count of active filter dimensions in a query state (for the drawer
 *  "Reset (n)" label). Sort is not a filter and is not counted; the
 *  search query lives outside the drawer and is not counted either. */
export function countActiveFilters(s: CatalogQueryState): number {
  return (
    s.families.length +
    s.brands.length +
    s.genders.length +
    s.origins.length +
    s.concentrations.length +
    s.years.length +
    s.occasions.length +
    (s.reviewRate !== null ? 1 : 0) +
    (s.note !== '' ? 1 : 0) +
    (s.priceMin > 0 || s.priceMax !== null ? 1 : 0)
  );
}
