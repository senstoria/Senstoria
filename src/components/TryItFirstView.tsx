import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { translations, Locale } from '../lib/i18n.ts';
import { PUBLISHED_PERFUMES, SeedPerfume } from '../data/seedPerfumes.ts';
import { DUMMY_DECANTS, DummyDecant, DummyDecantStatus } from '../data/dummyDecants.ts';
import { Bottle } from './Bottle.tsx';
import type { StatePreview } from '../lib/statePreview.ts';
import { useDelayedFlag } from '../lib/statePreview.ts';
import { ViewError, ViewSkeleton } from './StateViews.tsx';
import { EmptyState } from './EmptyState.tsx';

interface TryItFirstViewProps {
  locale: Locale;
  onSelectPerfume: (id: string) => void;
  onOpenWaitlist: (perfumeId: string) => void;
  // Tahap 2 (§4): keadaan layar lewat `?state=…` + jalan keluarnya.
  // loading → skeleton Coba Dulu; error → panel ViewError; empty →
  // kartu dianggap kosong (REVISI 26 Nov 2026, Checklist item 3:
  // kosong kini menampilkan EmptyState + jalan keluar, membalik
  // perintah founder 3 Nov 2026); empty-filter → pencarian awal
  // 'zzzz' (tidak cocok apa pun, kini juga menampilkan EmptyState);
  // offline/destructive tidak berlaku.
  previewState?: StatePreview | null;
  onClearPreview?: () => void;
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
 *   dummy untuk saat ini"). REVISI 3 Nov 2026 09:21–09:22 WIB
 *   (founder): the "Dummy" badge on every card is REMOVED, and the
 *   decant size line is NOT rendered on the card.
 *   REVISI 3 Nov 2026 14:28–14:29 WIB (founder, tap "Hapus keduanya",
 *   after being warned): the three pillar cards AND the view-level
 *   dummy notice panel above the grid are BOTH REMOVED. Consequence,
 *   recorded as-is: after this removal, a merged dummy card carries
 *   NO visible label at all (badge already gone in the 09:21 revision,
 *   panel now gone too), so it will read fully as a real offer; the
 *   dummy cards remain a UI preview in substance only, and REAL decant
 *   data is still Waitlist / Coming Soon under the 2 Nov 2026 founder
 *   gate. No replacement label was added — the founder ordered
 *   removal, not replacement. See src/data/dummyDecants.ts for the
 *   honesty lines. This view changes no real status, stock, price,
 *   quota, or countdown.
 * - REVISI TAMBAHAN 3 Nov 2026 15:05 WIB (founder, "buang juga ini"):
 *   the count line below the filter pills ("4 decant dummy
 *   ditampilkan" and its per-filter/search variants, decantCount) is
 *   ALSO REMOVED, element and all — not hidden with CSS. Consequence,
 *   recorded as-is: this was the last visible "dummy" word left in
 *   the view, so after this revision the Try It First view contains
 *   NO visible "dummy" word at all, and a merged decant card will
 *   read fully as a real offer. Filter/search behaviour itself is
 *   UNCHANGED (filtering still works, only the count text is gone);
 *   the filter pills keep their per-status numbers in parentheses,
 *   and an empty filtered result now shows no message (the grid is
 *   simply hidden). The decantCount i18n key is LEFT untouched as a
 *   cleanup candidate — not deleted silently.
 * - REVISI 26 Nov 2026 (founder, "sesuai rekomendasi kamu lanjutkan",
 *   Checklist Design item 3): kedua penghapusan di atas DIBALIK.
 *   Empty state kembali — hasil filter kosong kini menampilkan shared
 *   EmptyState (judul + pesan + jalan keluar hapus pencarian/filter),
 *   dan label "Dummy" kembali di tiap kartu (badge di sudut foto).
 *   Tombol Buy/Pre-Order dummy TETAP inert tanpa feedback — itu sisa
 *   yang masih terbuka, bukan bagian item ini. Kunci i18n lama
 *   dummyBadge + emptyResult dipakai kembali (keduanya tidak pernah
 *   dihapus dari i18n); dua kunci baru emptyResultTitle +
 *   emptyResultCta ditambahkan untuk EmptyState.
 *
 * What was REMOVED with the old tab bar (recorded, not hidden):
 * - The In Stock honest-empty panel and the Upcoming intro + card list
 *   are gone as separate tabs; their honest content is replaced by the
 *   status filter itself (an empty filtered result says so plainly —
 *   REVISI 26 Nov 2026, Checklist item 3: kini lewat shared
 *   EmptyState + jalan keluar hapus pencarian/filter).
 *   (The view-level dummy notice that once stated real decants are
 *   still Waitlist / Coming Soon is itself removed by the 14:29 WIB
 *   revision in this PR — see above.)
 * - The old Waitlist explanatory panel (entries cannot be shown, no
 *   endpoint for own entries) is gone as a tab; its substance is kept
 *   in one line: "Interest" opens the real waitlist modal, and the
 *   modal itself explains email confirmation. No list, count, or
 *   progress of real waitlist entries is shown anywhere here.
 * - REVISI 3 Nov 2026 14:28–14:29 WIB (founder, tap "Hapus keduanya"):
 *   the three pillar cards (pillar1/2/3Title+Body) and the view-level
 *   dummy notice panel are both REMOVED. Their i18n keys are LEFT in
 *   i18n untouched as cleanup candidates — not deleted silently.
 * - The old tab i18n keys (tabFeed/tabInStock/tabUpcoming/tabWaitlist,
 *   inStockEmptyTitle/Body, upcomingIntro, waitlistTitle/Body,
 *   waitlistBackButton, decantComingSoonLabel, detailButton,
 *   joinButton, notesLabel, priceNote) are LEFT in i18n untouched as
 *   cleanup candidates — not deleted silently.
 *
 * Button honesty (hard line, as revised 3 Nov 2026 14:30 WIB):
 * - "Interest" (Waitlist dummy) opens the REAL TryItFirstModal for the
 *   base perfume (5/10 ml, no price) — the flow that already exists.
 * - "Buy" (In-Stock dummy) and "Pre-Order" (Upcoming dummy) are now
 *   INERT: they show NO notice, complete NO purchase, create NO
 *   order, open NO checkout, and redirect NOWHERE (the dismissible
 *   dummy notice bar was removed by founder order 14:30 WIB).
 *   Their future behaviour is a separate, undecided decision.
 * - NO decant price, stock, quota, or countdown number appears on any
 *   dummy card (Q13 undecided).
 */
export function TryItFirstView({ locale, onSelectPerfume, onOpenWaitlist, previewState = null, onClearPreview }: TryItFirstViewProps) {
  const t = translations[locale].tryItFirstView;
  // Tahap 2 (§4): `?state=empty-filter` — pencarian awal yang tidak
  // cocok dengan apa pun; input tetap terisi dan bisa dihapus pengguna.
  const [searchQuery, setSearchQuery] = useState(previewState === 'empty-filter' ? 'zzzz' : '');
  const [statusFilter, setStatusFilter] = useState<DecantFilter>('all');

  // Tahap 2 (§4): `?state=empty` — kartu dianggap kosong.
  const sourceDecants = previewState === 'empty' ? [] : DUMMY_DECANTS;

  // Resolve each dummy decant to its published base perfume for display.
  // A dummy whose base perfume is not published is dropped, never guessed.
  const resolved: Array<{ decant: DummyDecant; perfume: SeedPerfume }> = sourceDecants
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

  // Checklist item 3 (26 Nov 2026): jalan keluar EmptyState — hapus
  // pencarian dan kembalikan filter ke semua decant.
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const filters: Array<{ id: DecantFilter; label: string }> = [
    { id: 'all', label: t.filterAll },
    { id: 'inStock', label: t.filterInStock },
    { id: 'upcoming', label: t.filterUpcoming },
    { id: 'waitlist', label: t.filterWaitlist },
  ];

  const handleCardButton = (decant: DummyDecant) => {
    if (decant.status === 'waitlist') {
      onOpenWaitlist(decant.basePerfumeId);
    }
    // REVISI 3 Nov 2026 14:30 WIB (founder, "hapus ini juga"): dummy
    // Buy / Pre-Order buttons are now INERT — no notice, checkout,
    // order, stock, or navigation. Their future behaviour (real
    // checkout / pre-order or another action) is a separate decision.
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
          aria-label={`${perfume.brand} ${perfume.name}`}
          onClick={() => onSelectPerfume(perfume.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectPerfume(perfume.id);
            }
          }}
          className="aspect-square w-full bg-surface border border-hairline flex items-center justify-center relative cursor-pointer p-3 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
        >
          {/* Checklist item 3 (26 Nov 2026): label "Dummy" kembali di
              tiap kartu — membalik penghapusan 3 Nov 2026 atas perintah
              founder ("sesuai rekomendasi kamu lanjutkan"). Istilah
              "Dummy" (id+en sama) adalah kata yang sudah dipakai di
              codebase dan riwayat PR; founder bisa minta ganti kata
              saat review. Badge hitam-pill yang sama dengan pill
              status kartu (bg-bar/text-paper), sudut kiri atas foto,
              tidak menutupi nama/harga (nama ada di bawah foto). */}
          <span className="absolute left-3 top-3 z-10 rounded-full bg-bar px-2.5 py-1 text-xs font-semibold text-paper">
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
            bold. REVISI 3 Nov 2026 09:21–09:22 WIB (founder): the decant
            size line is NOT rendered on the card (size stays in the
            dummy data only, for the waitlist modal).
            REVISI 3 Nov 2026 09:39 WIB (founder, supersedes the
            "identical to the Catalog pill" benchmark of the previous
            revision): the status pill is now COMPACT and SMALL — its
            text is 14px/20px, exactly the brand text size on the same
            card, its width follows the button text only (no
            self-stretch), and its padding is minimal (px-3 py-1) so
            there is no large empty space inside the pill. This pill
            is deliberately SMALLER than the Catalog Buy pill.
            CONFLICT NOTED: at 14px/20px + px-3 py-1 the pill is about
            28px tall, below the 44px touch target used elsewhere;
            per the founder order the small pill wins and the 44px
            target is NOT preserved here — recorded in the PR body.
            Two cards of the same perfume now differ on the card only
            by their button/status, per the founder order, recorded
            as-is. No price row on any dummy card (Q13 undecided). */}
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
            </div>

            <button
              type="button"
              onClick={() => handleCardButton(decant)}
              aria-label={`${buttonLabel} ${perfume.brand} ${perfume.name}`}
              className="shrink-0 self-start whitespace-nowrap flex items-center justify-center rounded-full bg-bar hover:bg-ink text-paper font-medium text-[14px] leading-[20px] px-3 py-1 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus cursor-pointer"
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Tahap 2 (§4): keadaan lewat `?state=…`. Diletakkan setelah semua
  // hook di atas, sebelum return, supaya urutan hook tidak berubah.
  // Skeleton baru muncul bila loading melebihi ~300ms (aturan §4).
  const showLoadingSkeleton = useDelayedFlag(previewState === 'loading');
  if (previewState === 'loading' && showLoadingSkeleton) {
    return <ViewSkeleton locale={locale} layout="tryitfirst" />;
  }
  if (previewState === 'error') {
    return <ViewError locale={locale} onRetry={onClearPreview ?? (() => {})} />;
  }

  return (
    <div className="space-y-8">
      {/* Nike Fase 3: header Coba Dulu hitam — judul + subjudul putih
          di atas hitam, bukan lagi kartu colour-field biru. Label
          "Dummy" dan EmptyState PR #75 tidak berubah. */}
      <div className="bg-bar border border-hairline p-6 md:p-8 space-y-3">
        <p className="label-caption text-paper/85">{t.kicker}</p>
        <h1 className="font-display text-paper leading-tight">{t.title}</h1>
        <p className="text-sm text-paper/85 max-w-2xl leading-relaxed">{t.subtitle}</p>
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
            className="w-full pl-10 pr-10 py-3 bg-card border border-bar text-base md:text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={t.clearLabel}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-secondary hover:text-ink cursor-pointer"
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

      <div className="space-y-4">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {filtered.map(renderDecantCard)}
          </div>
        ) : (
          /* Checklist item 3 (26 Nov 2026): hasil kosong kini jujur —
             shared EmptyState (pola yang sama dengan Katalog) + jalan
             keluar hapus pencarian/filter. Membalik perintah founder
             3 Nov 2026 ("hasil filter kosong tidak berpesan"). */
          <EmptyState
            title={t.emptyResultTitle}
            body={t.emptyResult}
            ctaLabel={t.emptyResultCta}
            onCtaClick={handleClearFilters}
            iconType="bottle"
          />
        )}
      </div>
    </div>
  );
}
