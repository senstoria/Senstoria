import React from 'react';
import { AlertCircle, CheckCircle2, ShoppingBag } from 'lucide-react';
import { BottleState, isLowBottle, calculateRemainingPercentage } from '../lib/selectors.ts';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale, translations } from '../lib/i18n.ts';

interface LowBottleBannerProps {
  bottles: BottleState[];
  perfumes: SeedPerfume[];
  locale: Locale;
  onBuyAgain: (perfumeId: string) => void;
  onMarkFinished: (bottleId: string) => void;
  className?: string;
}

/**
 * LowBottleBanner component (Phase 1.2)
 * Strictly uses isLowBottle and calculateRemainingPercentage on Currently Wearing bottles.
 * Outline style with icon + text, monochrome only (Rule 9: no red alarm styling).
 * Disappears when no bottles are low.
 */
export const LowBottleBanner: React.FC<LowBottleBannerProps> = ({
  bottles,
  perfumes,
  locale,
  onBuyAgain,
  onMarkFinished,
  className = ''
}) => {
  const t = translations[locale];

  // Currently Wearing bottles only (Rule 2)
  const currentlyWearing = bottles.filter(
    b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed')
  );

  const lowBottles = currentlyWearing
    .filter(b => isLowBottle(b))
    .map(b => {
      const perfume = perfumes.find(p => p.id === b.perfume_id);
      const pct = calculateRemainingPercentage(b) ?? 0;
      return {
        bottle: b,
        perfume,
        perfumeName: perfume ? `${perfume.brand} — ${perfume.name}` : 'Parfum',
        percentage: pct
      };
    });

  if (lowBottles.length === 0) {
    return null;
  }

  // Single bottle low alert
  if (lowBottles.length === 1) {
    const item = lowBottles[0];
    const message = t.home.lowBottleBannerSingle
      .replace('{name}', item.perfumeName)
      .replace('{pct}', String(item.percentage));

    return (
      <div 
        className={`border border-[#333333] bg-[#FFFEF2] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#333333] shrink-0" aria-hidden="true" />
          <p className="font-medium text-[#1A1A1A] text-sm">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onBuyAgain(item.bottle.perfume_id)}
            className="min-h-[36px] px-3.5 py-1.5 bg-[#333333] hover:bg-black text-[#FFFEF2] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.home.buyAgain}</span>
          </button>
          <button
            type="button"
            onClick={() => onMarkFinished(item.bottle.id)}
            className="min-h-[36px] px-3.5 py-1.5 bg-transparent hover:bg-black/5 text-[#1A1A1A] border border-[#333333] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.home.markAsFinished}</span>
          </button>
        </div>
      </div>
    );
  }

  // Grouped banner for 2 or more bottles
  const groupedHeader = t.home.lowBottleBannerGrouped.replace('{count}', String(lowBottles.length));

  return (
    <div 
      className={`border border-[#333333] bg-[#FFFEF2] p-4 text-xs space-y-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 pb-2 border-b border-[#D9D7C9]">
        <AlertCircle className="w-4 h-4 text-[#333333] shrink-0" aria-hidden="true" />
        <h3 className="font-semibold text-sm text-[#1A1A1A]">
          {groupedHeader}
        </h3>
      </div>

      <div className="divide-y divide-[#D9D7C9]/60">
        {lowBottles.map(item => (
          <div key={item.bottle.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-medium text-sm text-[#1A1A1A]">
                {item.perfumeName}
              </p>
              <p className="text-xs text-[#5C5C5C] font-mono">
                {item.percentage}% {t.home.remainingText} · {item.bottle.remaining_ml} / {item.bottle.size_ml} ml
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onBuyAgain(item.bottle.perfume_id)}
                className="min-h-[36px] px-3 py-1 bg-[#333333] hover:bg-black text-[#FFFEF2] font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.home.buyAgain}</span>
              </button>
              <button
                type="button"
                onClick={() => onMarkFinished(item.bottle.id)}
                className="min-h-[36px] px-3 py-1 bg-transparent hover:bg-black/5 text-[#1A1A1A] border border-[#333333] font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.home.markAsFinished}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
