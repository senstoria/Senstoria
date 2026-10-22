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

/**
 * CompareTray:
 * - Positioned stickily right above the mobile bottom navigation bar on mobile (< 1024px)
 * - Positioned at bottom-0 on desktop (>= 1024px)
 * - Horizontal scrolling chip container so it never wraps or breaks 360px/390px viewports
 * - Min 44px tap targets for buttons
 */
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
      className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] lg:bottom-0 left-0 right-0 z-30 bg-[#1A1A1A] text-[#FFFEF2] border-t border-neutral-700 shadow-2xl py-2 px-3 sm:px-6 transition-all duration-200 animate-in slide-in-from-bottom"
      aria-label="Ruang Komparasi Parfum"
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Tray summary and horizontal chips */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Layers className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              <span className="hidden sm:inline">Compare </span>({comparePerfumes.length}/3)
            </span>
          </div>

          {/* Perfume chips in tray with horizontal touch scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar min-w-0">
            {comparePerfumes.map(p => (
              <div 
                key={p.id}
                className="bg-neutral-800 border border-neutral-600 pl-2 pr-1 py-1 text-[11px] flex items-center gap-1.5 rounded-none shrink-0 max-w-[130px] sm:max-w-[160px]"
              >
                <span className="font-serif font-bold text-white truncate">
                  {p.name}
                </span>
                <button 
                  type="button"
                  onClick={() => onRemove(p.id)}
                  className="min-h-[32px] min-w-[32px] flex items-center justify-center text-neutral-400 hover:text-white rounded-xs focus:outline-hidden"
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
                className="hidden md:flex border border-dashed border-neutral-600 px-2.5 py-1 text-[10px] text-neutral-400 font-mono shrink-0"
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
            className="min-h-[44px] px-2 text-xs text-neutral-400 hover:text-white transition flex items-center gap-1"
            title={locale === 'id' ? 'Hapus Semua' : 'Clear All'}
          >
            <Trash2 className="w-3.5 h-3.5 sm:hidden" />
            <span className="hidden sm:inline">{locale === 'id' ? 'Hapus' : 'Clear'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCompare}
            disabled={comparePerfumes.length < 2}
            className={`min-h-[44px] px-3 sm:px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 rounded-xs shrink-0 ${
              comparePerfumes.length >= 2 
                ? 'bg-[#FFFEF2] text-[#1A1A1A] hover:bg-neutral-200 cursor-pointer shadow-sm' 
                : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed opacity-70'
            }`}
          >
            <span className="whitespace-nowrap">
              {locale === 'id' ? 'Bandingkan' : 'Compare'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </aside>
  );
};
