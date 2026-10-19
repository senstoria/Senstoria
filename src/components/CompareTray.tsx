import React from 'react';
import { X, ArrowRight, Layers } from 'lucide-react';
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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#333333] text-[#FFFEF2] border-t border-neutral-700 shadow-2xl py-3 px-4 md:px-8 transition-transform animate-in slide-in-from-bottom duration-200">
      <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Tray summary and slots */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Compare ({comparePerfumes.length}/3)
            </span>
          </div>

          {/* Perfume chips in tray */}
          <div className="flex items-center gap-2">
            {comparePerfumes.map(p => (
              <div 
                key={p.id}
                className="bg-neutral-800 border border-neutral-600 px-2.5 py-1 text-xs flex items-center gap-2 rounded-none"
              >
                <span className="font-serif font-bold text-white max-w-[120px] truncate">
                  {p.brand} {p.name}
                </span>
                <button 
                  onClick={() => onRemove(p.id)}
                  className="text-neutral-400 hover:text-white"
                  title="Remove from compare"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: 3 - comparePerfumes.length }).map((_, idx) => (
              <div 
                key={idx}
                className="hidden sm:flex border border-dashed border-neutral-600 px-3 py-1 text-[11px] text-neutral-400 font-mono"
              >
                + Slot {comparePerfumes.length + idx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClear}
            className="text-xs text-neutral-400 hover:text-white transition"
          >
            {locale === 'id' ? 'Hapus Semua' : 'Clear All'}
          </button>
          <button
            onClick={onOpenCompare}
            disabled={comparePerfumes.length < 2}
            className={`px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              comparePerfumes.length >= 2 
                ? 'bg-[#FFFEF2] text-[#1A1A1A] hover:bg-neutral-200' 
                : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <span>{locale === 'id' ? 'Bandingkan Sekarang' : 'Compare Now'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
