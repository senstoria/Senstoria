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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D9D7C9] pb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#5C5C5C] font-semibold">
            {locale === 'id' ? 'Komparasi Sisi-ke-Sisi (Maksimal 3 Parfum)' : 'Side-by-Side Comparison (Max 3 Perfumes)'}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-normal mt-1">
            {locale === 'id' ? 'Bandingkan Karakter, Komposisi & Ketahanan' : 'Compare Scents, Performance & Value'}
          </h1>
          <p className="text-xs text-[#5C5C5C] mt-1 font-mono">
            {selectedPerfumes.length} {locale === 'id' ? 'dari 3 slot parfum aktif' : 'of 3 perfume slots active'}
            {sharedNotes.size > 0 && (
              <span className="ml-2 text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 px-2 py-0.5">
                {sharedNotes.size} {locale === 'id' ? 'notes sama terdeteksi' : 'shared notes detected'}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedPerfumes.length >= 2 && (
            <button
              onClick={() => setHighlightDiffs(!highlightDiffs)}
              className={`px-3 py-2 text-xs font-medium border transition ${
                highlightDiffs 
                  ? 'bg-amber-100 border-amber-800 text-amber-900 font-bold' 
                  : 'bg-white border-[#333333] hover:bg-[#F4F3E6] text-[#1A1A1A]'
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
              className="px-4 py-2 bg-[#333333] hover:bg-black text-[#FFFEF2] text-xs font-semibold flex items-center gap-1.5 transition"
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
        /* Responsive Horizontal Scroll Container with Sticky Header Column (CMP-04) */
        <div className="overflow-x-auto border border-[#D9D7C9] bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#F4F3E6] border-b border-[#D9D7C9]">
                <th className="p-4 w-44 font-semibold text-[#5C5C5C] uppercase tracking-wider text-[10px] sticky left-0 bg-[#F4F3E6] z-10 border-r border-[#D9D7C9]">
                  Parameter
                </th>
                {selectedPerfumes.map(p => (
                  <th key={p.id} className="p-4 w-72 align-top">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#5C5C5C] block tracking-wider">
                          {p.brand}
                        </span>
                        <h3 
                          onClick={() => onSelectPerfume(p.id)}
                          className="font-serif text-xl font-bold hover:underline cursor-pointer"
                        >
                          {p.name}
                        </h3>
                        <span className="text-[11px] font-mono text-[#5C5C5C]">
                          {p.concentration} · {p.release_year}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemoveFromCompare(p.id)}
                        className="text-[#5C5C5C] hover:text-black p-1"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
                {/* Empty slot placeholder column */}
                {selectedPerfumes.length < 3 && (
                  <th className="p-4 w-60 border-l border-dashed border-[#D9D7C9] text-center align-middle bg-[#FFFEF2]/50">
                    <button
                      onClick={onOpenCatalogToAdd}
                      className="border border-dashed border-[#333333] p-4 text-xs text-[#5C5C5C] hover:bg-white transition flex flex-col items-center gap-1 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Tambah Slot {selectedPerfumes.length + 1}</span>
                    </button>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y border-[#D9D7C9]">
              
              {/* Row: Asal & Tier */}
              <tr>
                <td className="p-4 font-semibold text-[#5C5C5C] sticky left-0 bg-white z-10 border-r border-[#D9D7C9]">
                  Asal Brand & Tier
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 capitalize">
                    {p.origin === 'ID' ? 'Lokal Indonesia' : 'Global / Internasional'} · {p.market_tier}
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Olfactive Family */}
              <tr>
                <td className="p-4 font-semibold text-[#5C5C5C] sticky left-0 bg-white z-10 border-r border-[#D9D7C9]">
                  Keluarga Aroma
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 font-medium">
                    {p.primary_family} {p.secondary_family ? `(${p.secondary_family})` : ''}
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Heat Suitability (Climate Fit) */}
              <tr className="bg-[#FFFEF2]">
                <td className="p-4 font-semibold text-[#5C5C5C] sticky left-0 bg-[#FFFEF2] z-10 border-r border-[#D9D7C9]">
                  {locale === 'id' ? 'Kesesuaian Iklim Panas' : 'Heat Suitability'}
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4">
                    <span className="font-mono text-base font-bold text-[#1A1A1A]">
                      {p.heat_suitability} / 5
                    </span>
                    <span className="block text-xs text-[#5C5C5C] mt-0.5">
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
                <td className="p-4 font-semibold text-[#5C5C5C] sticky left-0 bg-white z-10 border-r border-[#D9D7C9]">
                  Top Notes
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {p.top_notes.split(',').map(n => {
                        const trimmed = n.trim();
                        const shared = isNoteShared(trimmed);
                        return (
                          <span 
                            key={trimmed}
                            className={`px-1.5 py-0.5 border ${
                              shared 
                                ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900' 
                                : 'border-[#D9D7C9] bg-neutral-50 text-neutral-800'
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
                <td className="p-4 font-semibold text-[#5C5C5C] sticky left-0 bg-white z-10 border-r border-[#D9D7C9]">
                  Heart Notes
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {p.heart_notes.split(',').map(n => {
                        const trimmed = n.trim();
                        const shared = isNoteShared(trimmed);
                        return (
                          <span 
                            key={trimmed}
                            className={`px-1.5 py-0.5 border ${
                              shared 
                                ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900' 
                                : 'border-[#D9D7C9] bg-neutral-50 text-neutral-800'
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
                <td className="p-4 font-semibold text-[#5C5C5C] sticky left-0 bg-white z-10 border-r border-[#D9D7C9]">
                  Base Notes
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {p.base_notes.split(',').map(n => {
                        const trimmed = n.trim();
                        const shared = isNoteShared(trimmed);
                        return (
                          <span 
                            key={trimmed}
                            className={`px-1.5 py-0.5 border ${
                              shared 
                                ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900' 
                                : 'border-[#D9D7C9] bg-neutral-50 text-neutral-800'
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
                <td className="p-4 font-semibold text-[#5C5C5C] sticky left-0 bg-white z-10 border-r border-[#D9D7C9]">
                  Ketahanan & Proyeksi
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 font-mono text-xs">
                    <p className="font-bold">{p.longevity_expected_band}</p>
                    <p className="text-[#5C5C5C] text-[11px] mt-0.5">Sillage: {p.projection_expected} / 4</p>
                  </td>
                ))}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Reference Price & Value / ml */}
              <tr>
                <td className="p-4 font-semibold text-[#5C5C5C] sticky left-0 bg-white z-10 border-r border-[#D9D7C9]">
                  Harga & Nilai per ml
                </td>
                {selectedPerfumes.map(p => {
                  const pricePerMl = Math.round(p.reference_price_idr / p.reference_price_size_ml);
                  return (
                    <td key={p.id} className="p-4 font-mono">
                      <p className="font-bold text-sm">{formatCurrency(p.reference_price_idr, locale)}</p>
                      <p className="text-[11px] text-[#5C5C5C]">Per botol {p.reference_price_size_ml}ml</p>
                      <span className="inline-block mt-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-1.5 py-0.5">
                        {formatCurrency(pricePerMl, locale)} / ml
                      </span>
                    </td>
                  );
                })}
                {selectedPerfumes.length < 3 && <td></td>}
              </tr>

              {/* Row: Purchase Outbound CTAs (AFF-05) */}
              <tr className="bg-[#F4F3E6]">
                <td className="p-4 font-semibold text-[#5C5C5C] sticky left-0 bg-[#F4F3E6] z-10 border-r border-[#D9D7C9]">
                  Aksi Belanja & Coba
                </td>
                {selectedPerfumes.map(p => (
                  <td key={p.id} className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <a
                        href={`/go/${p.id}?platform=shopee&src=compare`}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        className="py-2.5 bg-[#333333] hover:bg-black text-[#FFFEF2] text-center font-medium text-xs transition"
                      >
                        Shopee
                      </a>
                      <a
                        href={`/go/${p.id}?platform=tokopedia&src=compare`}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        className="py-2.5 border border-[#333333] hover:bg-white text-center font-medium text-xs transition"
                      >
                        Tokopedia
                      </a>
                    </div>
                    <button
                      onClick={() => onOpenTryItFirst(p.id)}
                      className="w-full py-1.5 text-[11px] text-[#8A4B14] underline text-center block hover:text-black"
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
      )}

      {/* Note legend explanation */}
      {sharedNotes.size > 0 && (
        <div className="p-4 bg-[#F4F3E6] border border-[#D9D7C9] text-xs flex items-center gap-3">
          <span className="font-bold text-emerald-800">★ Highlight Hijau:</span>
          <span className="text-[#5C5C5C]">
            Menandakan aroma notes yang dimiliki bersama oleh semua parfum yang sedang kamu bandingkan ({Array.from(sharedNotes).join(', ')}).
          </span>
        </div>
      )}

      {/* ── QUICK ADD PERFUME MODAL ── */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFEF2] border border-[#333333] max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-[#D9D7C9] pb-3">
              <h3 className="font-serif text-2xl font-bold">
                {locale === 'id' ? 'Pilih Parfum untuk Dibandingkan' : 'Select Perfume to Compare'}
              </h3>
              <button 
                onClick={() => setIsQuickAddModalOpen(false)}
                className="text-[#5C5C5C] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={quickAddSearch}
              onChange={e => setQuickAddSearch(e.target.value)}
              placeholder={locale === 'id' ? 'Cari nama atau brand parfum...' : 'Search perfume name or brand...'}
              className="w-full p-2.5 bg-white border border-[#333333] text-xs focus:outline-hidden"
              autoFocus
            />

            <div className="max-h-64 overflow-y-auto divide-y border border-[#D9D7C9] bg-white text-xs">
              {availableToAdd.length === 0 ? (
                <div className="p-6 text-center text-[#5C5C5C]">
                  {locale === 'id' ? 'Tidak ada parfum yang cocok.' : 'No fragrances found.'}
                </div>
              ) : (
                availableToAdd.slice(0, 15).map(p => (
                  <div 
                    key={p.id}
                    className="p-3 flex justify-between items-center hover:bg-[#F4F3E6] transition"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#5C5C5C] block tracking-wider">
                        {p.brand} · {p.primary_family}
                      </span>
                      <h4 className="font-serif text-sm font-bold">{p.name}</h4>
                      <span className="text-[11px] font-mono text-[#5C5C5C]">
                        {formatCurrency(p.reference_price_idr, locale)} ({p.reference_price_size_ml}ml)
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        // Add to compare via onRemoveFromCompare or toggle
                        onRemoveFromCompare(p.id); // in App.tsx handleToggleCompare toggles it on
                        setIsQuickAddModalOpen(false);
                      }}
                      className="px-3 py-1.5 bg-[#333333] hover:bg-black text-[#FFFEF2] text-xs font-semibold"
                    >
                      + {locale === 'id' ? 'Bandingkan' : 'Compare'}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsQuickAddModalOpen(false)}
                className="px-4 py-2 border border-[#333333] hover:bg-[#F4F3E6] text-xs font-medium"
              >
                {locale === 'id' ? 'Tutup' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
