import React from 'react';
import { X, ArrowRight, Layers, Trash2 } from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { translations, Locale, fmt } from '../lib/i18n.ts';

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
      className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] lg:bottom-0 left-0 right-0 z-30 bg-bar text-paper border-t border-border py-2 px-3 sm:px-6 transition-all duration-200"
      aria-label={translations[locale].compareTray.trayAria}
    >
      <div className="max-w-[1120px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Tray summary and horizontal chips */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Layers className="w-4 h-4 text-paper shrink-0" aria-hidden="true" />
            <span className="text-[12px] font-medium uppercase tracking-wider font-mono tabular-nums">
              <span className="hidden sm:inline">Compare </span>({comparePerfumes.length}/3)
            </span>
          </div>

          {/* Perfume chips in tray with horizontal touch scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar min-w-0">
            {comparePerfumes.map(p => (
              <div 
                key={p.id}
                className="bg-ink border border-border pl-2.5 pr-1.5 py-1 text-[12px] flex items-center gap-2 rounded-none shrink-0 max-w-[140px] sm:max-w-[180px]"
              >
                <span className="font-sans font-medium text-paper truncate text-[12px]">
                  {p.name}
                </span>
                <button 
                  type="button"
                  onClick={() => onRemove(p.id)}
                  className="min-h-[32px] min-w-[32px] flex items-center justify-center text-ondark hover:text-paper focus:outline-hidden"
                  title={fmt(translations[locale].compareTray.removeTitle, p.name)}
                  aria-label={fmt(translations[locale].compareTray.removeAria, p.name)}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Empty slot placeholder */}
            {Array.from({ length: 3 - comparePerfumes.length }).map((_, idx) => (
              <div 
                key={idx}
                className="hidden md:flex border border-dashed border-border px-3 py-1 text-[12px] text-ondark font-mono shrink-0"
              >
                {fmt(translations[locale].compareTray.slotLabel, comparePerfumes.length + idx + 1)}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClear}
            className="min-h-[44px] px-2 text-[12px] text-ondark hover:text-paper transition flex items-center gap-1 underline"
            title={translations[locale].catalogView.hapusSemua}
          >
            <Trash2 className="w-3.5 h-3.5 sm:hidden" />
            <span className="hidden sm:inline">{translations[locale].catalogView.hapus}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCompare}
            disabled={comparePerfumes.length < 2}
            className={`min-h-[44px] px-4 py-2 text-[12px] font-medium transition flex items-center gap-1.5 rounded-none shrink-0 ${
              comparePerfumes.length >= 2 
                ? 'bg-paper text-ink hover:bg-surface cursor-pointer' 
                : 'bg-secondary text-ondark border border-border cursor-not-allowed opacity-70'
            }`}
          >
            <span>{translations[locale].compareTray.bukaKomparasi}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </aside>
  );
};
