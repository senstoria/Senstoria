import React from 'react';
import { X, ArrowRight, Layers, Trash2 } from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale } from '../lib/i18n.ts';

interface CompareTrayProps {
  comparePerfumes: SeedPerfume[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onOpenCompare: () => void;
  locale: Locale;
}

export const CompareTray: React.FC<CompareTrayProps> = ({
  comparePerfumes,
  onRemove,
  onClear,
  onOpenCompare,
  locale
}) => {
  if (comparePerfumes.length === 0) return null;

  return (
    <aside 
      className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] lg:bottom-0 left-0 right-0 z-30 bg-[#333333] text-[#fffef2] border-t border-[#8a8a8a] py-2 px-3 sm:px-6 transition-all duration-200"
      aria-label="Ruang Komparasi Parfum"
    >
      <div className="max-w-[1120px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Tray summary and horizontal chips */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Layers className="w-4 h-4 text-[#fffef2] shrink-0" aria-hidden="true" />
            <span className="text-[12px] font-medium uppercase tracking-wider font-mono tabular-nums">
              <span className="hidden sm:inline">Compare </span>({comparePerfumes.length}/3)
            </span>
          </div>

          {/* Perfume chips in tray with horizontal touch scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar min-w-0">
            {comparePerfumes.map(p => (
              <div 
                key={p.id}
                className="bg-[#000000] border border-[#8a8a8a] pl-2.5 pr-1.5 py-1 text-[12px] flex items-center gap-2 rounded-none shrink-0 max-w-[140px] sm:max-w-[180px]"
              >
                <span className="font-sans font-medium text-[#fffef2] truncate text-[12px]">
                  {p.name}
                </span>
                <button 
                  type="button"
                  onClick={() => onRemove(p.id)}
                  className="min-h-[32px] min-w-[32px] flex items-center justify-center text-[#d9d7c9] hover:text-[#fffef2] focus:outline-hidden"
                  title={`Hapus ${p.name}`}
                  aria-label={`Hapus ${p.name} dari komparasi`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Empty slot placeholder */}
            {Array.from({ length: 3 - comparePerfumes.length }).map((_, idx) => (
              <div 
                key={idx}
                className="hidden md:flex border border-dashed border-[#8a8a8a] px-3 py-1 text-[12px] text-[#d9d7c9] font-mono shrink-0"
              >
                + Slot {comparePerfumes.length + idx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClear}
            className="min-h-[44px] px-2 text-[12px] text-[#d9d7c9] hover:text-[#fffef2] transition flex items-center gap-1 underline"
            title={locale === 'id' ? 'Hapus Semua' : 'Clear All'}
          >
            <Trash2 className="w-3.5 h-3.5 sm:hidden" />
            <span className="hidden sm:inline">{locale === 'id' ? 'Hapus' : 'Clear'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCompare}
            disabled={comparePerfumes.length < 2}
            className={`min-h-[44px] px-4 py-2 text-[12px] font-medium transition flex items-center gap-1.5 rounded-none shrink-0 ${
              comparePerfumes.length >= 2 
                ? 'bg-[#fffef2] text-[#000000] hover:bg-[#f4f3e6] cursor-pointer' 
                : 'bg-[#5c5c5c] text-[#d9d7c9] border border-[#8a8a8a] cursor-not-allowed opacity-70'
            }`}
          >
            <span>{locale === 'id' ? 'Buka Komparasi' : 'Compare Now'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </aside>
  );
};
