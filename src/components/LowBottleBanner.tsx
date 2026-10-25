import React from 'react';
import { Droplet, CheckCircle2, ShoppingBag, Sparkles } from 'lucide-react';
import { BottleState, isLowBottle, calculateRemainingPercentage } from '../lib/selectors.ts';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale, translations } from '../lib/i18n.ts';

interface LowBottleBannerProps {
  bottles: BottleState[];
  perfumes: SeedPerfume[];
  locale: Locale;
  onBuyAgain: (perfumeId: string) => void;
  onTryItFirst?: (perfumeId: string) => void;
  onMarkFinished: (bottleId: string) => void;
  className?: string;
}

/**
 * Calm LowBottleBanner (Single calm strip)
 * Icon + text naming bottle(s) and % remaining.
 * Actions: Buy again / Try It First / Mark as finished per bottle.
 * Strictly calm editorial: #f4f3e6 surface, #333333 border/text, zero red, no urgency words.
 */
export const LowBottleBanner: React.FC<LowBottleBannerProps> = ({
  bottles,
  perfumes,
  locale,
  onBuyAgain,
  onTryItFirst,
  onMarkFinished,
  className = ''
}) => {
  const t = translations[locale];

  // Currently Wearing bottles only
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

  return (
    <aside 
      className={`bg-[#f4f3e6] border border-[#d9d7c9] p-4 text-xs space-y-3 transition-opacity duration-200 ${className}`}
      role="status"
      aria-label={locale === 'id' ? 'Status sisa botol parfum' : 'Low bottle status'}
    >
      <div className="divide-y divide-[#d9d7c9]">
        {lowBottles.map((item, idx) => (
          <div 
            key={item.bottle.id} 
            className={`flex flex-col md:flex-row md:items-center justify-between gap-3 ${idx > 0 ? 'pt-3 mt-3' : ''}`}
          >
            {/* Calm Icon + Text naming bottle and % remaining */}
            <div className="flex items-center gap-2.5">
              <Droplet className="w-4 h-4 text-[#333333] shrink-0" aria-hidden="true" />
              <p className="text-[14px] text-[#000000] font-normal leading-snug">
                <span className="font-medium text-[#000000]">{item.perfumeName}</span>
                <span className="text-[#5c5c5c] font-mono tabular-nums ml-2">
                  ({item.percentage}% {locale === 'id' ? 'tersisa' : 'remaining'} · {item.bottle.remaining_ml} / {item.bottle.size_ml} ml)
                </span>
              </p>
            </div>

            {/* Calm Actions: Buy again / Try It First / Mark as finished */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onBuyAgain(item.bottle.perfume_id)}
                className="min-h-[36px] px-3 py-1 bg-[#333333] hover:bg-black text-[#fffef2] text-xs font-medium transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{locale === 'id' ? 'Beli lagi' : 'Buy again'}</span>
              </button>

              {onTryItFirst && (
                <button
                  type="button"
                  onClick={() => onTryItFirst(item.bottle.perfume_id)}
                  className="min-h-[36px] px-3 py-1 bg-white hover:bg-[#f4f3e6] border border-[#8a8a8a] text-[#000000] text-xs font-medium transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#333333]" aria-hidden="true" />
                  <span>{locale === 'id' ? 'Coba sampel' : 'Try It First'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onMarkFinished(item.bottle.id)}
                className="min-h-[36px] px-3 py-1 bg-white hover:bg-[#f4f3e6] border border-[#8a8a8a] text-[#5c5c5c] hover:text-[#000000] text-xs font-medium transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{locale === 'id' ? 'Tandai habis' : 'Mark as finished'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
