import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { translations, fmt, Locale } from '../lib/i18n.ts';
import { PUBLISHED_PERFUMES, SeedPerfume } from '../data/seedPerfumes.ts';
import { DUMMY_DECANTS, DummyDecant, DummyDecantStatus } from '../data/dummyDecants.ts';
import { Bottle } from './Bottle.tsx';

interface TryItFirstViewProps {
  locale: Locale;
  onSelectPerfume: (id: string) => void;
  onOpenWaitlist: (perfumeId: string) => void;
}

type DecantFilter = 'all' | DummyDecantStatus;

/**
 * Try It First redesign — founder 3 Nov 2026 09:02–09:05 WIB:
 * - Decant product cards in the Catalog (Nike) card style, but for
 *   DUMMY decant products, with a status button: In-Stock → "Buy",
 *   Upcoming → "Pre-Order", Waitlist → "Interest".
 * - Search bar + status filter pills (All Decant, In-Stock, Upcoming,
 *   Waitlist) that REPLACE the old Feed / In Stock / Upcoming /
 *   Waitlist tab bar (founder answer 09:05 WIB: "menggantikan").
 * - Filter pill size copies the Catalog olfactive (family) pills
 *   exactly (founder 09:05 WIB: "ukuran nya sesuai ukuran filter
 *   olfactive pada katalog"): px-3.5 py-1.5, font-medium, text-xs
 *   container — no new size invented.
 * - Cards are DUMMY (founder 09:05 WIB: "bikin decant product card
 *   dummy untuk saat ini"), labelled "Dummy" on every card plus a
 *   view-level dummy notice. See src/data/dummyDecants.ts for the
 *   honesty lines. REAL decant data is still Waitlist / Coming Soon
 *   under the 2 Nov 2026 founder gate; this view changes no real
 *   status, stock, price, quota, or countdown.
 *
 * What was REMOVED with the old tab bar (recorded, not hidden):
 * - The In Stock honest-empty panel and the Upcoming intro + card list
 *   are gone as separate tabs; their honest content is replaced by the
 *   status filter itself (an empty filtered result says so plainly)
 *   and by the dummy notice below, which states real decants are
 *   still Waitlist / Coming Soon.
 * - The old Waitlist explanatory panel (entries cannot be shown, no
 *   endpoint for own entries) is gone as a tab; its substance is kept
 *   in one line: "Interest" opens the real waitlist modal, and the
 *   modal itself explains email confirmation. No list, count, or
 *   progress of real waitlist entries is shown anywhere here.
 * - The old tab i18n keys (tabFeed/tabInStock/tabUpcoming/tabWaitlist,
 *   inStockEmptyTitle/Body, upcomingIntro, waitlistTitle/Body,
 *   waitlistBackButton, decantComingSoonLabel, detailButton,
 *   joinButton, notesLabel, priceNote) are LEFT in i18n untouched as
 *   cleanup candidates — not deleted silently.
 *
 * Button honesty (hard line):
 * - "Interest" (Waitlist dummy) opens the REAL TryItFirstModal for the
 *   base perfume (5/10 ml, no price) — the flow that already exists.
 * - "Buy" (In-Stock dummy) and "Pre-Order" (Upcoming dummy) show an
 *   honest in-view notice that this is a dummy preview card and that
 *   decant checkout / pre-order is not available. They NEVER complete
 *   a purchase, create an order, open a checkout, or redirect to an
 *   affiliate full-bottle offer as if it were a decant.
 * - NO decant price, stock, quota, or countdown number appears on any
 *   dummy card (Q13 undecided).
 */
export function TryItFirstView({ locale, onSelectPerfume, onOpenWaitlist }: TryItFirstViewProps) {
  const t = translations[locale].tryItFirstView;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DecantFilter>('all');
  const [dummyNotice, setDummyNotice] = useState<string | null>(null);

  const pillars = [
    { title: t.pillar1Title, body: t.pillar1Body },
    { title: t.pillar2Title, body: t.pillar2Body },
    { title: t.pillar3Title, body: t.pillar3Body },
  ];

  // Resolve each dummy decant to its published base perfume for display.
  // A dummy whose base perfume is not published is dropped, never guessed.
  const resolved: Array<{ decant: DummyDecant; perfume: SeedPerfume }> = DUMMY_DECANTS
    .map(decant => {
      const perfume = PUBLISHED_PERFUMES.find(p => p.id === decant.basePerfumeId);
      return perfume ? { decant, perfume } : null;
    })
    .filter((x): x is { decant: DummyDecant; perfume: SeedPerfume } => x !== null);

  const query = searchQuery.trim().toLowerCase();
  const filtered = resolved.filter(({ decant, perfume }) => {
    if (statusFilter !== 'all' && decant.status !== statusFilter) return false;
    if (!query) return true;
    const haystack = `${perfume.brand} ${perfume.name} ${perfume.top_notes ?? ''}`.toLowerCase();
    return haystack.includes(query);
  });

  const countFor = (status: DecantFilter) =>
    status === 'all' ? resolved.length : resolved.filter(({ decant }) => decant.status === status).length;

  const filters: Array<{ id: DecantFilter; label: string }> = [
    { id: 'all', label: t.filterAll },
    { id: 'inStock', label: t.filterInStock },
    { id: 'upcoming', label: t.filterUpcoming },
    { id: 'waitlist', label: t.filterWaitlist },
  ];

  const handleCardButton = (decant: DummyDecant) => {
    if (decant.status === 'waitlist') {
      setDummyNotice(null);
      onOpenWaitlist(decant.basePerfumeId);
    } else if (decant.status === 'inStock') {
      setDummyNotice(t.dummyBuyNotice);
    } else {
      setDummyNotice(t.dummyPreOrderNotice);
    }
  };

  const renderDecantCard = ({ decant, perfume }: { decant: DummyDecant; perfume: SeedPerfume }) => {
    const buttonLabel =
      decant.status === 'inStock' ? t.buyButton
      : decant.status === 'upcoming' ? t.preOrderButton
      : t.interestButton;
    return (
      <div key={decant.id} className="flex flex-col h-full space-y-3">
        {/* Catalog (Nike) card photo: plain 1:1 panel above, text below.
            Same fallback as Catalog cards: verified real photo when one
            exists, otherwise the Bottle illustration — never presented
            as a real photo. Published perfumes currently have no
            image_url, so the Bottle fallback renders here. */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`${perfume.brand} ${perfume.name} ${fmt(t.sizeLabel, String(decant.sizeMl))}`}
          onClick={() => onSelectPerfume(perfume.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectPerfume(perfume.id);
            }
          }}
          className="aspect-square w-full bg-surface border border-hairline flex items-center justify-center relative cursor-pointer p-3 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="absolute top-4 left-4 z-10 bg-bar text-paper text-[12px] font-semibold px-2 py-1 rounded-chip">
            {t.dummyBadge}
          </span>
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
        </div>

        {/* Name block left, status pill right — same structure as the
            Catalog Nike card: Brand 14px/20px regular, Name 20px/26px
            bold, pill self-stretch to the name block height. No price
            row on any dummy card (Q13 undecided). */}
        <div className="min-w-0 space-y-1">
          <div className="flex items-stretch justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="block text-[14px] leading-[20px] text-ink">
                {perfume.brand}
              </p>
              <h3 className="text-[20px] leading-[26px] font-bold text-ink line-clamp-2">
                <button
                  type="button"
                  onClick={() => onSelectPerfume(perfume.id)}
                  className="cursor-pointer hover:underline text-left"
                >
                  {perfume.name}
                </button>
              </h3>
              <p className="text-sm text-secondary">
                {fmt(t.sizeLabel, String(decant.sizeMl))}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCardButton(decant)}
              aria-label={`${buttonLabel} ${perfume.brand} ${perfume.name} ${fmt(t.sizeLabel, String(decant.sizeMl))}`}
              className="shrink-0 self-stretch flex items-center justify-center rounded-full bg-bar hover:bg-ink text-paper font-medium text-[15px] px-6 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer min-h-[44px]"
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-hairline pb-6">
        <p className="font-mono text-xs text-secondary uppercase">{t.kicker}</p>
        <h1 className="font-serif text-3xl md:text-4xl text-bar font-normal leading-tight">{t.title}</h1>
        <p className="text-sm text-secondary max-w-2xl leading-relaxed">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pillars.map(p => (
          <div key={p.title} className="p-4 bg-surface border border-hairline space-y-2">
            <p className="font-medium text-ink">{p.title}</p>
            <p className="text-sm text-secondary leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      {/* Dummy preview honesty notice — always visible above the cards. */}
      <div className="p-4 bg-surface border border-hairline">
        <p className="text-sm text-secondary leading-relaxed">{t.dummyNotice}</p>
      </div>

      {/* Search bar (Catalog style) + status filter pills (Catalog
          olfactive pill size, copied exactly: px-3.5 py-1.5,
          font-medium, text-xs container). These REPLACE the old tab bar. */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            className="w-full pl-10 pr-10 py-3 bg-card border border-bar text-base md:text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={t.clearLabel}
              className="absolute right-3.5 top-3.5 text-secondary hover:text-ink cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-hairline/60"
          role="group"
          aria-label={t.filterListLabel}
        >
          {filters.map(f => {
            const isSelected = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3.5 py-1.5 whitespace-nowrap transition font-medium ${
                  isSelected
                    ? 'bg-bar text-paper'
                    : 'bg-card border border-hairline text-secondary hover:border-ink hover:text-ink'
                }`}
              >
                {f.label} ({countFor(f.id)})
              </button>
            );
          })}
        </div>
      </div>

      {/* Honest notice for dummy Buy / Pre-Order presses (not a purchase,
          not an order, not a checkout). Dismissible. */}
      {dummyNotice && (
        <div className="p-4 bg-surface border border-hairline flex items-start justify-between gap-3">
          <p className="text-sm text-secondary leading-relaxed">{dummyNotice}</p>
          <button
            type="button"
            onClick={() => setDummyNotice(null)}
            aria-label={t.clearLabel}
            className="text-secondary hover:text-ink cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm text-secondary">
          {filtered.length === 0 ? t.emptyResult : fmt(t.decantCount, String(filtered.length))}
        </p>
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {filtered.map(renderDecantCard)}
          </div>
        )}
      </div>
    </div>
  );
}
