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
import { Locale, formatCurrency, translations } from '../lib/i18n.ts';
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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d9d7c9] pb-4">
        <div>
          <span className="text-[12px] uppercase tracking-widest text-[#5c5c5c] font-medium block">
            {locale === 'id' ? 'KOMPARASI SISI-KE-SISI' : 'SIDE-BY-SIDE COMPARISON'}
          </span>
          <h1 className="font-serif text-[32px] leading-[40px] md:text-[48px] md:leading-[56px] font-normal text-[#000000] mt-1">
            {locale === 'id' ? 'Bandingkan Karakter, Komposisi & Ketahanan' : 'Compare Scents, Performance & Value'}
          </h1>
          <p className="text-[12px] text-[#5c5c5c] mt-1 font-mono tabular-nums">
            {selectedPerfumes.length} {locale === 'id' ? 'dari 3 slot parfum aktif' : 'of 3 perfume slots active'}
            {sharedNotes.size > 0 && (
              <span className="ml-2 text-[#000000] font-medium bg-[#f4f3e6] border border-[#d9d7c9] px-2 py-0.5">
                {sharedNotes.size} {locale === 'id' ? 'notes sama terdeteksi' : 'shared notes detected'}
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
                  ? 'bg-[#333333] border-[#333333] text-[#fffef2]' 
                  : 'bg-[#fffef2] border-[#8a8a8a] hover:bg-[#f4f3e6] text-[#000000]'
              }`}
            >
              {highlightDiffs 
                ? (locale === 'id' ? '✓ Mode Sorot Perbedaan Aktif' : '✓ Highlight Differences Active') 
                : (locale === 'id' ? 'Sorot Perbedaan Saja' : 'Highlight Differences')}
            </button>
          )}

          {selectedPerfumes.length < 3 && (
            <button
              onClick={() => setIsQuickAddModalOpen(true)}
              className="px-4 py-2 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[12px] font-medium flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{locale === 'id' ? 'Tambah Parfum' : 'Add Perfume'}</span>
            </button>
          )}
        </div>
      </div>

      {selectedPerfumes.length === 0 ? (
        <EmptyState
          title={locale === 'id' ? 'Bandingkan Parfum' : 'Compare perfumes'}
          body={locale === 'id' ? 'Pilih hingga 3 parfum untuk dibandingkan.' : 'Pick up to 3 perfumes to compare.'}
          ctaLabel={locale === 'id' ? 'Cari Parfum' : 'Find a Perfume'}
          onCtaClick={onOpenCatalogToAdd}
          iconType="compare"
        />
      ) : (
        <div className="space-y-3">
          {/* Mobile Horizontal Scroll Hint Banner */}
          <div className="flex md:hidden items-center justify-between px-3 py-2 bg-[#f4f3e6] border border-[#d9d7c9] text-[12px] text-[#5c5c5c]">
            <span className="flex items-center gap-1.5 font-medium">
              <span>←</span>
              <span>{locale === 'id' ? 'Geser tabel untuk melihat rincian' : 'Swipe table to view details'}</span>
              <span>→</span>
            </span>
            <span className="font-mono text-[12px] text-[#000000] tabular-nums">{selectedPerfumes.length}/3 parfum</span>
          </div>

          {/* Responsive Horizontal Scroll Container with Sticky Header Column */}
          <div className="overflow-x-auto border border-[#d9d7c9] bg-[#fffef2]">
            <table className="w-full text-left text-[12px] border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-[#f4f3e6] border-b border-[#d9d7c9]">
                <th className="p-4 w-44 font-medium text-[#5c5c5c] uppercase tracking-wider text-[12px] sticky left-0 bg-[#f4f3e6] z-10 border-r border-[#d9d7c9]">
                  Parameter
                </th>
                {selectedPerfumes.map(p => (
                  <th key={p.id} className="p-4 w-72 align-top">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[12px] uppercase font-medium text-[#5c5c5c] block tracking-wider">
                          {p.brand}
                        </span>
                        <h3 
                          onClick={() => onSelectPerfume(p.id)}
                          className="font-sans text-[18px] leading-[24px] font-medium text-[#000000] hover:underline cursor-pointer"
                        >
                          {p.name}
                        </h3>
                        <span className="text-[12px] font-mono tabular-nums text-[#5c5c5c]">
                          {p.concentration} · {p.release_year}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemoveFromCompare(p.id)}
                        className="text-[#5c5c5c] hover:text-[#000000] p-1"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
                {/* Empty slot placeholder column */}
                {selectedPerfumes.length < 3 && (
                  <th className="p-4 w-60 border-l border-dashed border-[#d9d7c9] text-center align-middle bg-[#fffef2]">
                    <button
                      onClick={onOpenCatalogToAdd}
                      className="border border-dashed border-[#8a8a8a] p-4 text-[12px] text-[#5c5c5c] hover:bg-[#f4f3e6] transition flex flex-col items-center gap-1 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Tambah Slot {selectedPerfumes.length + 1}</span>
                    </button>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#d9d7c9] border-t border-[#d9d7c9]">
              
              {/* Row: Asal & Tier */}
              <tr>
                <td className="p-4 font-medium text-[#5c5c5c] sticky left-0 bg-[#fffef2] z-10 border-r border-[#d9d7c9]">
                  Asal Brand & Tier
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 capitalize text-[#000000]">
                    {p.origin === 'ID' ? 'Lokal Indonesia' : 'Global / Internasional'} · {p.market_tier}
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Olfactive Family */}
              <tr>
                <td className="p-4 font-medium text-[#5c5c5c] sticky left-0 bg-[#fffef2] z-10 border-r border-[#d9d7c9]">
                  Keluarga Aroma
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 font-medium text-[#000000]">
                    {p.primary_family} {p.secondary_family ? `(${p.secondary_family})` : ''}
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Heat Suitability (Climate Fit) */}
              <tr className="bg-[#fffef2]">
                <td className="p-4 font-medium text-[#5c5c5c] sticky left-0 bg-[#fffef2] z-10 border-r border-[#d9d7c9]">
                  {locale === 'id' ? 'Kesesuaian Iklim Panas' : 'Heat Suitability'}
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4">
                    <span className="font-mono text-[16px] font-medium tabular-nums text-[#000000]">
                      {p.heat_suitability} / 5
                    </span>
                    <span className="block text-[12px] text-[#5c5c5c] mt-0.5">
                      {p.heat_suitability >= 4 
                        ? (locale === 'id' ? 'Sangat cocok cuaca panas' : 'Ideal for tropical heat')
                        : (locale === 'id' ? 'Cocok ruang AC / malam' : 'Best in AC / evenings')}
                    </span>
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Top Notes (with shared notes highlighted) */}
              <tr>
                <td className="p-4 font-medium text-[#5c5c5c] sticky left-0 bg-[#fffef2] z-10 border-r border-[#d9d7c9]">
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
                                ? 'bg-[#f4f3e6] border-[#333333] font-medium text-[#000000]' 
                                : 'border-[#d9d7c9] bg-[#fffef2] text-[#000000]'
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
                <td className="p-4 font-medium text-[#5c5c5c] sticky left-0 bg-[#fffef2] z-10 border-r border-[#d9d7c9]">
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
                                ? 'bg-[#f4f3e6] border-[#333333] font-medium text-[#000000]' 
                                : 'border-[#d9d7c9] bg-[#fffef2] text-[#000000]'
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
                <td className="p-4 font-medium text-[#5c5c5c] sticky left-0 bg-[#fffef2] z-10 border-r border-[#d9d7c9]">
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
                                ? 'bg-[#f4f3e6] border-[#333333] font-medium text-[#000000]' 
                                : 'border-[#d9d7c9] bg-[#fffef2] text-[#000000]'
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
                <td className="p-4 font-medium text-[#5c5c5c] sticky left-0 bg-[#fffef2] z-10 border-r border-[#d9d7c9]">
                  Ketahanan & Proyeksi
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 font-mono text-[12px] tabular-nums">
                    <p className="font-medium text-[#000000]">{p.longevity_expected_band}</p>
                    <p className="text-[#5c5c5c] text-[12px] mt-0.5">Sillage: {p.projection_expected} / 4</p>
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Reference Price & Value / ml */}
              <tr>
                <td className="p-4 font-medium text-[#5c5c5c] sticky left-0 bg-[#fffef2] z-10 border-r border-[#d9d7c9]">
                  <p>{locale === 'id' ? 'Harga & Nilai / ml' : 'Price & Value / ml'}</p>
                  <span className="px-1.5 py-0.5 bg-[#f4f3e6] border border-[#d9d7c9] text-[9px] font-sans text-[#5c5c5c] inline-block mt-1">
                    {locale === 'id' ? 'Data contoh' : 'Sample data'}
                  </span>
                </td>
                {selectedPerfumes.map(p => {
                  const pricePerMl = Math.round(p.reference_price_idr / p.reference_price_size_ml);
                  return (
                    <td key={p.id} className="p-4 font-mono tabular-nums">
                      <p className="font-medium text-[14px] text-[#000000]">{formatCurrency(p.reference_price_idr, locale)}</p>
                      <p className="text-[12px] text-[#5c5c5c]">Per botol {p.reference_price_size_ml}ml</p>
                      <span className="inline-block mt-1 bg-[#f4f3e6] text-[#000000] border border-[#d9d7c9] text-[12px] font-mono px-2 py-0.5">
                        {formatCurrency(pricePerMl, locale)} / ml
                      </span>
                    </td>
                  );
                })}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Purchase Outbound CTAs */}
              <tr className="bg-[#f4f3e6]">
                <td className="p-4 font-medium text-[#5c5c5c] sticky left-0 bg-[#f4f3e6] z-10 border-r border-[#d9d7c9]">
                  Aksi Belanja & Coba
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`/go/${p.id}?platform=shopee&src=compare`}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        className="min-h-[44px] bg-[#333333] hover:bg-[#000000] text-[#fffef2] flex items-center justify-center text-center font-medium text-[12px] transition"
                      >
                        Beli di Shopee
                      </a>
                      <a
                        href={`/go/${p.id}?platform=tokopedia&src=compare`}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        className="min-h-[44px] border border-[#8a8a8a] hover:bg-[#fffef2] text-[#000000] flex items-center justify-center text-center font-medium text-[12px] transition"
                      >
                        Beli di Tokopedia
                      </a>
                    </div>
                    <button
                      onClick={() => onOpenTryItFirst(p.id)}
                      className="w-full py-1.5 text-[12px] text-[#5c5c5c] underline text-center block hover:text-[#000000]"
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
        <p className="text-[12px] text-[#5c5c5c] pt-2">
          {locale === 'id' 
            ? 'Kami bisa menerima komisi jika kamu membeli lewat tautan ini. Komisi tidak memengaruhi skor kecocokanmu.' 
            : 'We may earn a commission if you buy through these links. It never changes your match score.'}
        </p>
      </div>
      )}

      {/* Note legend explanation */}
      {sharedNotes.size > 0 && (
        <div className="p-4 bg-[#f4f3e6] border border-[#d9d7c9] text-[12px] flex items-center gap-3">
          <span className="font-medium text-[#000000]">★ Highlight Catatan:</span>
          <span className="text-[#5c5c5c]">
            Menandakan aroma notes yang dimiliki bersama oleh semua parfum yang sedang kamu bandingkan ({Array.from(sharedNotes).join(', ')}).
          </span>
        </div>
      )}

      {/* ── BOTTOM SHEET / MODAL: QUICK ADD PERFUME TO COMPARE ── */}
      <BottomSheetOrModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        title={locale === 'id' ? 'Pilih Parfum untuk Dibandingkan' : 'Select Perfume to Compare'}
        subtitle={locale === 'id' ? 'Bandingkan piramida aroma & spesifikasi (maks. 3)' : 'Compare notes pyramid & specs (max 3)'}
        maxWidth="max-w-lg"
      >
        <div className="space-y-3">
          <input
            type="text"
            value={quickAddSearch}
            onChange={e => setQuickAddSearch(e.target.value)}
            placeholder={locale === 'id' ? 'Cari nama atau brand parfum...' : 'Search perfume name or brand...'}
            className="w-full min-h-[44px] p-2.5 bg-[#fffef2] border border-[#8a8a8a] text-[14px] text-[#000000] focus:outline-hidden"
            autoFocus
          />

          <div className="max-h-72 overflow-y-auto divide-y divide-[#d9d7c9] border border-[#d9d7c9] bg-[#fffef2] text-[12px]">
            {availableToAdd.length === 0 ? (
              <div className="p-6 text-center text-[#5c5c5c]">
                {locale === 'id' ? 'Tidak ada parfum yang cocok.' : 'No fragrances found.'}
              </div>
            ) : (
              availableToAdd.slice(0, 15).map(p => (
                <div 
                  key={p.id}
                  className="p-3 min-h-[48px] flex justify-between items-center hover:bg-[#f4f3e6] transition"
                >
                  <div className="pr-2">
                    <span className="text-[12px] uppercase font-medium text-[#5c5c5c] block tracking-wider">
                      {p.brand} · {p.primary_family}
                    </span>
                    <h4 className="font-sans text-[14px] font-medium text-[#000000]">{p.name}</h4>
                    <span className="text-[12px] font-mono tabular-nums text-[#5c5c5c]">
                      {formatCurrency(p.reference_price_idr, locale)} ({p.reference_price_size_ml}ml)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onRemoveFromCompare(p.id);
                      setIsQuickAddModalOpen(false);
                    }}
                    className="min-h-[44px] px-3.5 py-2 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[12px] font-medium shrink-0"
                  >
                    + {locale === 'id' ? 'Bandingkan' : 'Compare'}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsQuickAddModalOpen(false)}
              className="min-h-[44px] px-4 py-2 border border-[#8a8a8a] hover:bg-[#f4f3e6] text-[12px] text-[#000000] font-medium"
            >
              {locale === 'id' ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      </BottomSheetOrModal>

    </div>
  );
};
