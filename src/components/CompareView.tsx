import React from 'react';
import { 
  ArrowLeft, 
  X, 
  Plus, 
  ExternalLink, 
  Heart, 
  Check, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale, formatCurrency, translations, fmt } from '../lib/i18n.ts';
import { EmptyState } from './EmptyState.tsx';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';

interface CompareViewProps {
  perfumes: SeedPerfume[];
  compareIds: string[];
  onRemoveFromCompare: (id: string) => void;
  onOpenCatalogToAdd: () => void;
  onSelectPerfume: (id: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onOpenTryItFirst: (id: string) => void;
  locale: Locale;
}

export const CompareView: React.FC<CompareViewProps> = ({
  perfumes,
  compareIds,
  onRemoveFromCompare,
  onOpenCatalogToAdd,
  onSelectPerfume,
  wishlistIds,
  onToggleWishlist,
  onOpenTryItFirst,
  locale
}) => {
  const [highlightDiffs, setHighlightDiffs] = React.useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = React.useState(false);
  const [quickAddSearch, setQuickAddSearch] = React.useState('');

  const selectedPerfumes = compareIds
    .map(id => perfumes.find(p => p.id === id))
    .filter((p): p is SeedPerfume => Boolean(p));

  // Compute shared notes across all compared perfumes
  const sharedNotes = React.useMemo(() => {
    if (selectedPerfumes.length < 2) return new Set<string>();

    const noteLists = selectedPerfumes.map(p => {
      const allNotes = (p.top_notes + ', ' + p.heart_notes + ', ' + p.base_notes)
        .split(',')
        .map(n => n.trim().toLowerCase());
      return new Set(allNotes);
    });

    const shared = new Set<string>();
    const firstList = Array.from(noteLists[0]);

    for (const note of firstList) {
      if (noteLists.every(list => list.has(note))) {
        shared.add(note);
      }
    }
    return shared;
  }, [selectedPerfumes]);

  const isNoteShared = (noteStr: string) => {
    return sharedNotes.has(noteStr.trim().toLowerCase());
  };

  // Candidates for quick add (not already in compare)
  const availableToAdd = React.useMemo(() => {
    return perfumes.filter(p => {
      if (compareIds.includes(p.id)) return false;
      if (!quickAddSearch.trim()) return true;
      const q = quickAddSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.primary_family.toLowerCase().includes(q);
    });
  }, [perfumes, compareIds, quickAddSearch]);

  return (
    <div className="space-y-8">
      
      {/* ── HEADER & CONTROLS ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
            {translations[locale].compareView.komparasiSisiKeSisi}
          </span>
          <h1 className="font-serif text-[32px] leading-[40px] md:text-[48px] md:leading-[56px] font-normal text-ink mt-1">
            {translations[locale].compareView.bandingkanKarakterKomposisiKetahanan}
          </h1>
          <p className="text-[12px] text-secondary mt-1 font-mono tabular-nums">
            {selectedPerfumes.length} {translations[locale].compareView.dari3SlotParfumAktif}
            {sharedNotes.size > 0 && (
              <span className="ml-2 text-ink font-medium bg-surface border border-hairline px-2 py-0.5">
                {sharedNotes.size} {translations[locale].compareView.notesSamaTerdeteksi}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedPerfumes.length >= 2 && (
            <button
              onClick={() => setHighlightDiffs(!highlightDiffs)}
              className={`px-3 py-2 text-[12px] font-medium border transition ${
                highlightDiffs 
                  ? 'bg-bar border-bar text-paper' 
                  : 'bg-paper border-border hover:bg-surface text-ink'
              }`}
            >
              {highlightDiffs 
                ? (translations[locale].compareView.modeSorotPerbedaanAktif) 
                : (translations[locale].compareView.sorotPerbedaanSaja)}
            </button>
          )}

          {selectedPerfumes.length < 3 && (
            <button
              onClick={() => setIsQuickAddModalOpen(true)}
              className="px-4 py-2 bg-bar hover:bg-ink text-paper text-[12px] font-medium flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{translations[locale].compareView.tambahParfum}</span>
            </button>
          )}
        </div>
      </div>

      {selectedPerfumes.length === 0 ? (
        <EmptyState
          title={translations[locale].compareView.bandingkanParfum}
          body={translations[locale].emptyStates.compareBody}
          ctaLabel={translations[locale].emptyStates.compareCta}
          onCtaClick={onOpenCatalogToAdd}
          iconType="compare"
        />
      ) : (
        <div className="space-y-3">
          {/* Mobile Horizontal Scroll Hint Banner */}
          <div className="flex md:hidden items-center justify-between px-3 py-2 bg-surface border border-hairline text-[12px] text-secondary">
            <span className="flex items-center gap-1.5 font-medium">
              <span>←</span>
              <span>{translations[locale].compareView.geserTabelUntukMelihatRincian}</span>
              <span>→</span>
            </span>
            <span className="font-mono text-[12px] text-ink tabular-nums">{selectedPerfumes.length}/3 parfum</span>
          </div>

          {/* Responsive Horizontal Scroll Container with Sticky Header Column */}
          <div className="overflow-x-auto border border-hairline bg-paper">
            <table className="w-full text-left text-[12px] border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-surface border-b border-hairline">
                <th className="p-4 w-44 font-medium text-secondary uppercase tracking-wider text-[12px] sticky left-0 bg-surface z-10 border-r border-hairline">
                  Parameter
                </th>
                {selectedPerfumes.map(p => (
                  <th key={p.id} className="p-4 w-72 align-top">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[12px] uppercase font-medium text-secondary block tracking-wider">
                          {p.brand}
                        </span>
                        <h3 
                          onClick={() => onSelectPerfume(p.id)}
                          className="font-sans text-[18px] leading-[24px] font-medium text-ink hover:underline cursor-pointer"
                        >
                          {p.name}
                        </h3>
                        <span className="text-[12px] font-mono tabular-nums text-secondary">
                          {p.concentration} · {p.release_year}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemoveFromCompare(p.id)}
                        className="text-secondary hover:text-ink p-1"
                        title={translations[locale].compareView.removeTitle}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
                {/* Empty slot placeholder column */}
                {selectedPerfumes.length < 3 && (
                  <th className="p-4 w-60 border-l border-dashed border-hairline text-center align-middle bg-paper">
                    <button
                      onClick={onOpenCatalogToAdd}
                      className="border border-dashed border-border p-4 text-[12px] text-secondary hover:bg-surface transition flex flex-col items-center gap-1 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Tambah Slot {selectedPerfumes.length + 1}</span>
                    </button>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-hairline border-t border-hairline">
              
              {/* Row: Asal & Tier */}
              <tr>
                <td className="p-4 font-medium text-secondary sticky left-0 bg-paper z-10 border-r border-hairline">
                  {translations[locale].compareView.originTierHeading}
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 capitalize text-ink">
                    {p.origin === 'ID' ? 'Lokal Indonesia' : 'Global / Internasional'} · {p.market_tier}
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Olfactive Family */}
              <tr>
                <td className="p-4 font-medium text-secondary sticky left-0 bg-paper z-10 border-r border-hairline">
                  {translations[locale].catalogView.familyHeading}
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 font-medium text-ink">
                    {p.primary_family} {p.secondary_family ? `(${p.secondary_family})` : ''}
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Heat Suitability (Climate Fit) */}
              <tr className="bg-paper">
                <td className="p-4 font-medium text-secondary sticky left-0 bg-paper z-10 border-r border-hairline">
                  {translations[locale].compareView.kesesuaianIklimPanas}
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4">
                    <span className="font-mono text-[16px] font-medium tabular-nums text-ink">
                      {p.heat_suitability} / 5
                    </span>
                    <span className="block text-[12px] text-secondary mt-0.5">
                      {p.heat_suitability >= 4 
                        ? (translations[locale].compareView.sangatCocokCuacaPanas)
                        : (translations[locale].compareView.cocokRuangAcMalam)}
                    </span>
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Top Notes (with shared notes highlighted) */}
              <tr>
                <td className="p-4 font-medium text-secondary sticky left-0 bg-paper z-10 border-r border-hairline">
                  Top Notes
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.top_notes.split(',').map(n => {
                        const trimmed = n.trim();
                        const shared = isNoteShared(trimmed);
                        return (
                          <span 
                            key={trimmed}
                            className={`px-2 py-0.5 border text-[12px] ${
                              shared 
                                ? 'bg-surface border-bar font-medium text-ink' 
                                : 'border-hairline bg-paper text-ink'
                            }`}
                          >
                            {trimmed} {shared && '★'}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Heart Notes */}
              <tr>
                <td className="p-4 font-medium text-secondary sticky left-0 bg-paper z-10 border-r border-hairline">
                  Heart Notes
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.heart_notes.split(',').map(n => {
                        const trimmed = n.trim();
                        const shared = isNoteShared(trimmed);
                        return (
                          <span 
                            key={trimmed}
                            className={`px-2 py-0.5 border text-[12px] ${
                              shared 
                                ? 'bg-surface border-bar font-medium text-ink' 
                                : 'border-hairline bg-paper text-ink'
                            }`}
                          >
                            {trimmed} {shared && '★'}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Base Notes */}
              <tr>
                <td className="p-4 font-medium text-secondary sticky left-0 bg-paper z-10 border-r border-hairline">
                  Base Notes
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.base_notes.split(',').map(n => {
                        const trimmed = n.trim();
                        const shared = isNoteShared(trimmed);
                        return (
                          <span 
                            key={trimmed}
                            className={`px-2 py-0.5 border text-[12px] ${
                              shared 
                                ? 'bg-surface border-bar font-medium text-ink' 
                                : 'border-hairline bg-paper text-ink'
                            }`}
                          >
                            {trimmed} {shared && '★'}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Longevity & Sillage */}
              <tr>
                <td className="p-4 font-medium text-secondary sticky left-0 bg-paper z-10 border-r border-hairline">
                  {translations[locale].compareView.longevityProjectionHeading}
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 font-mono text-[12px] tabular-nums">
                    <p className="font-medium text-ink">{p.longevity_expected_band}</p>
                    <p className="text-secondary text-[12px] mt-0.5">Sillage: {p.projection_expected} / 4</p>
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Reference Price & Value / ml */}
              <tr>
                <td className="p-4 font-medium text-secondary sticky left-0 bg-paper z-10 border-r border-hairline">
                  <p>{translations[locale].compareView.hargaNilaiMl}</p>
                  <span className="px-1.5 py-0.5 bg-surface border border-hairline text-[12px] font-sans text-secondary inline-block mt-1">
                    {translations[locale].sampleDataBadge}
                  </span>
                </td>
                {selectedPerfumes.map(p => {
                  const pricePerMl = Math.round(p.reference_price_idr / p.reference_price_size_ml);
                  return (
                    <td key={p.id} className="p-4 font-mono tabular-nums">
                      <p className="font-medium text-[14px] text-ink">{formatCurrency(p.reference_price_idr, locale)}</p>
                      <p className="text-[12px] text-secondary">Per botol {p.reference_price_size_ml}ml</p>
                      <span className="inline-block mt-1 bg-surface text-ink border border-hairline text-[12px] font-mono px-2 py-0.5">
                        {formatCurrency(pricePerMl, locale)} / ml
                      </span>
                    </td>
                  );
                })}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Purchase Outbound CTAs */}
              <tr className="bg-surface">
                <td className="p-4 font-medium text-secondary sticky left-0 bg-surface z-10 border-r border-hairline">
                  {translations[locale].compareView.shoppingActionsHeading}
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`/go/${p.id}?platform=shopee&src=compare`}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        className="min-h-[44px] bg-bar hover:bg-ink text-paper flex items-center justify-center text-center font-medium text-[12px] transition"
                      >
                        {translations[locale].compareView.buyOnShopee}
                      </a>
                      <a
                        href={`/go/${p.id}?platform=tokopedia&src=compare`}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        className="min-h-[44px] border border-border hover:bg-paper text-ink flex items-center justify-center text-center font-medium text-[12px] transition"
                      >
                        {translations[locale].compareView.buyOnTokopedia}
                      </a>
                    </div>
                    <button
                      onClick={() => onOpenTryItFirst(p.id)}
                      className="w-full py-1.5 text-[12px] text-secondary underline text-center block hover:text-ink"
                    >
                      Coba Dulu (Waitlist Sampel)
                    </button>
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-secondary pt-2">
          {translations[locale].buySheet.kamiBisaMenerimaKomisiJikaKamuMembel}
        </p>
      </div>
      )}

      {/* Note legend explanation */}
      {sharedNotes.size > 0 && (
        <div className="p-4 bg-surface border border-hairline text-[12px] flex items-center gap-3">
          <span className="font-medium text-ink">{translations[locale].compareView.highlightNotesLabel}</span>
          <span className="text-secondary">
            Menandakan aroma notes yang dimiliki bersama oleh semua parfum yang sedang kamu bandingkan ({Array.from(sharedNotes).join(', ')}).
          </span>
        </div>
      )}

      {/* ── BOTTOM SHEET / MODAL: QUICK ADD PERFUME TO COMPARE ── */}
      <BottomSheetOrModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        title={translations[locale].compareView.pilihParfumUntukDibandingkan}
        subtitle={translations[locale].compareView.bandingkanPiramidaAromaSpesifikasiMaks}
        maxWidth="max-w-lg"
      >
        <div className="space-y-3">
          <input
            type="text"
            value={quickAddSearch}
            onChange={e => setQuickAddSearch(e.target.value)}
            placeholder={translations[locale].compareView.cariNamaAtauBrandParfum}
            className="w-full min-h-[44px] p-2.5 bg-paper border border-border text-[14px] text-ink focus:outline-hidden"
            autoFocus
          />

          <div className="max-h-72 overflow-y-auto divide-y divide-hairline border border-hairline bg-paper text-[12px]">
            {availableToAdd.length === 0 ? (
              <div className="p-6 text-center text-secondary">
                {translations[locale].compareView.tidakAdaParfumYangCocok}
              </div>
            ) : (
              availableToAdd.slice(0, 15).map(p => (
                <div 
                  key={p.id}
                  className="p-3 min-h-[48px] flex justify-between items-center hover:bg-surface transition"
                >
                  <div className="pr-2">
                    <span className="text-[12px] uppercase font-medium text-secondary block tracking-wider">
                      {p.brand} · {p.primary_family}
                    </span>
                    <h4 className="font-sans text-[14px] font-medium text-ink">{p.name}</h4>
                    <span className="text-[12px] font-mono tabular-nums text-secondary">
                      {formatCurrency(p.reference_price_idr, locale)} ({p.reference_price_size_ml}ml)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onRemoveFromCompare(p.id);
                      setIsQuickAddModalOpen(false);
                    }}
                    className="min-h-[44px] px-3.5 py-2 bg-bar hover:bg-ink text-paper text-[12px] font-medium shrink-0"
                  >
                    + {translations[locale].productDetail.compareAction}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsQuickAddModalOpen(false)}
              className="min-h-[44px] px-4 py-2 border border-border hover:bg-surface text-[12px] text-ink font-medium"
            >
              {translations[locale].compareView.tutup}
            </button>
          </div>
        </div>
      </BottomSheetOrModal>

    </div>
  );
};
