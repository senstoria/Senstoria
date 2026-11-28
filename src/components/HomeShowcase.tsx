import { WearTimer } from './WearTimer.tsx';
import type { WearLogState } from '../lib/derivedCalculations.ts';
import { useState } from 'react';
import { Bell, Heart, Search, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import type { SeedPerfume } from '../data/seedPerfumes.ts';
import { TILE_FAMILY_IDS } from '../lib/catalogShop.ts';
import { perfumeMatchesFamily } from '../lib/derivedCalculations.ts';
import { translations, type Locale } from '../lib/i18n.ts';
import { Bottle } from './Bottle.tsx';

interface HomeHeaderProps {
  locale: Locale;
  name?: string;
  bagCount: number;
  desktop?: boolean;
  onOpenNotifications: () => void;
  onOpenBag: () => void;
}

export function HomeHeader({ locale, name, bagCount, desktop = false, onOpenNotifications, onOpenBag }: HomeHeaderProps) {
  const hour = new Date().getHours();
  const greeting = locale === 'id'
    ? (hour < 11 ? 'Selamat pagi,' : hour < 15 ? 'Selamat siang,' : hour < 19 ? 'Selamat sore,' : 'Selamat malam,')
    : (hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,');
  const t = translations[locale];
  const actionClass = 'relative grid size-11 shrink-0 place-items-center rounded-full border border-hairline text-ink hover:bg-surface active:scale-[0.97]';

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="min-w-0 break-words">
        <p className="text-sm text-muted">{greeting}</p>
        <p className="text-base font-bold text-ink">{name?.trim() || t.profileView.guestName}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" className={actionClass} onClick={onOpenNotifications} aria-label={locale === 'id' ? 'Notifikasi' : 'Notifications'}>
          <Bell size={19} aria-hidden="true" />
        </button>
        <button type="button" className={actionClass} onClick={onOpenBag} data-testid={desktop ? 'header-bag-button-desktop' : 'header-bag-button'} aria-label={`${t.nav.bag} (${bagCount})`}>
          <ShoppingBag size={19} aria-hidden="true" />
          {bagCount > 0 && (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-brick px-1 text-[11px] font-bold text-paper" aria-hidden="true">
              {bagCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

interface HomeShowcaseProps {
  locale: Locale;
  perfumes: SeedPerfume[];
  wishlistIds: string[];
  activeWearLogs?: WearLogState[];
  onToggleWishlist: (id: string) => void;
  onSelectPerfume: (id: string) => void;
  onBrowseCatalog: (query?: { search: string; family: string }) => void;
}

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function HomeShowcase({ locale, perfumes, wishlistIds, activeWearLogs, onToggleWishlist, onSelectPerfume, onBrowseCatalog }: HomeShowcaseProps) {
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('');
  const isId = locale === 'id';
  const t = translations[locale].catalogView;
  const query = search.trim().toLowerCase();
  const results = perfumes.filter(perfume =>
    (!family || perfumeMatchesFamily(perfume, family)) &&
    (!query || `${perfume.name} ${perfume.brand}`.toLowerCase().includes(query))
  );
  const now = Date.now();

  return (
    <div className="space-y-5">
      <h1 className="display-home text-ink">
        {isId ? 'Temukan aroma' : 'Find your signature'}<br />
        <em className="font-display font-bold italic text-warm">{isId ? 'khasmu.' : 'scent.'}</em>
      </h1>

      <form role="search" className="flex items-center gap-2" onSubmit={event => event.preventDefault()}>
        <label className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-pill border border-ink/15 bg-paper px-4 focus-within:ring-2 focus-within:ring-focus">
          <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            aria-label={t.searchLabel}
            placeholder={isId ? 'Cari parfum, brand…' : 'Search perfumes, brands…'}
            className="min-w-0 w-full bg-transparent text-base text-ink outline-hidden placeholder:text-muted"
          />
        </label>
        <button
          type="button"
          onClick={() => onBrowseCatalog({ search, family })}
          aria-label={t.showFilters}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-paper active:scale-[0.97]"
        >
          <SlidersHorizontal size={19} aria-hidden="true" />
        </button>
      </form>

      <div role="group" aria-label={isId ? 'Keluarga aroma' : 'Scent families'} className="flex gap-2 overflow-x-auto p-1 -m-1">
        {['', ...TILE_FAMILY_IDS].map(id => (
          <button
            key={id}
            type="button"
            aria-pressed={family === id}
            onClick={() => setFamily(id)}
            className="flex min-h-11 shrink-0 items-center active:scale-[0.97]"
          >
            <span className={`inline-flex h-(--chip-height) items-center rounded-chip border border-ink/15 px-3 text-sm font-semibold ${family === id ? 'bg-ink text-paper' : 'bg-surface text-ink'}`}>
              {id === 'Amber' ? 'Oriental' : id || (isId ? 'Semua' : 'All')}
            </span>
          </button>
        ))}
      </div>

      {activeWearLogs && <WearTimer wearLogs={activeWearLogs} locale={locale} />}

      <section aria-labelledby="home-showcase-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="home-showcase-title" className="display-section text-ink">{isId ? 'Populer sekarang' : 'Popular now'}</h2>
          <button type="button" onClick={() => onBrowseCatalog()} className="min-h-11 shrink-0 text-xs font-semibold text-muted hover:underline">
            {t.viewAll}
          </button>
        </div>
        {results.length === 0 ? (
          <p role="status" className="text-sm text-muted">{isId ? 'Tidak ada parfum yang cocok.' : 'No matching perfumes.'}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
            {results.map(perfume => {
              const saved = wishlistIds.includes(perfume.id);
              const publishedAt = Date.parse(perfume.published_at ?? '');
              const age = now - publishedAt;
              const isNew = age >= 0 && age < NEW_WINDOW_MS;
              return (
                <li key={perfume.id} className="flex min-w-0 flex-col gap-2">
                  <div className="relative aspect-square">
                    <button
                      type="button"
                      aria-label={perfume.name}
                      onClick={() => onSelectPerfume(perfume.id)}
                      className="relative isolate flex size-full items-center justify-center overflow-hidden rounded-photo bg-photo p-3"
                    >
                      <span aria-hidden="true" className="absolute inset-x-1/4 bottom-[12%] -z-10 h-2 rounded-full bg-ink/15 blur-sm" />
                      {perfume.image_url ? (
                        <img src={perfume.image_url} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <Bottle fragranceId={perfume.id} name={perfume.name} brand={perfume.brand} size="sm" showFill={false} />
                      )}
                    </button>
                    {isNew && <span className="label-caps absolute left-3 top-3 rounded-full bg-ink px-2 py-1 text-paper">NEW</span>}
                    <button
                      type="button"
                      aria-label={`${t.saveToWishlistAria} · ${perfume.name}`}
                      aria-pressed={saved}
                      onClick={() => onToggleWishlist(perfume.id)}
                      className="absolute right-1 top-1 grid size-11 place-items-center text-wishlist active:scale-[0.97]"
                    >
                      <span className="grid size-9 place-items-center rounded-full bg-paper">
                        <Heart size={17} className={saved ? 'fill-current' : undefined} aria-hidden="true" />
                      </span>
                    </button>
                  </div>
                  <div className="min-w-0 break-words">
                    <h3 className="text-card-name text-ink">{perfume.name}</h3>
                    <p className="text-small text-muted">{[perfume.primary_family, perfume.concentration].filter(Boolean).join(' · ')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectPerfume(perfume.id)}
                    aria-label={`${isId ? 'Lihat' : 'View'} ${perfume.name}`}
                    className="mt-auto flex min-h-11 items-center self-end rounded-pill active:scale-[0.97]"
                  >
                    <span className="rounded-pill bg-ink px-4 py-1.5 text-xs font-semibold text-paper">{isId ? 'Lihat' : 'View'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
