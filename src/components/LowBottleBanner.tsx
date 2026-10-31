import React from 'react';
import { Droplet, CheckCircle2, ShoppingBag } from 'lucide-react';
import { BottleState, isLowBottle, calculateRemainingPercentage } from '../lib/selectors.ts';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale, translations } from '../lib/i18n.ts';

interface LowBottleBannerProps {
  bottles: BottleState[];
  perfumes: SeedPerfume[];
  locale: Locale;
  onBuyAgain: (perfumeId: string) => void;
  // No onTryItFirst: this banner only ever lists owned bottles (Currently
  // Wearing, in_use/sealed, low), and an owned perfume needs no sample try.
  onMarkFinished: (bottleId: string) => void;
  className?: string;
}

/**
 * Calm LowBottleBanner (Single calm strip)
 * Icon + text naming bottle(s) and % remaining.
 * Actions: Buy again / Mark as finished per bottle. Try it First is
 * intentionally NOT offered here: every bottle this banner lists is already
 * owned (Currently Wearing, in_use/sealed, low), so a sample try is pointless.
 * Strictly calm editorial: surface background, bar border/text, zero red, no urgency words.
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
        perfumeName: perfume ? `${perfume.brand} — ${perfume.name}` : translations[locale].app.unknownPerfume,
        percentage: pct
      };
    });

  if (lowBottles.length === 0) {
    return null;
  }

  return (
    <aside 
      className={`bg-surface border border-hairline p-4 text-xs space-y-3 transition-opacity duration-200 ${className}`}
      role="status"
      aria-label={translations[locale].lowBottle.statusSisaBotolParfum}
    >
      <div className="divide-y divide-hairline">
        {lowBottles.map((item, idx) => (
          <div 
            key={item.bottle.id} 
            className={`flex flex-col md:flex-row md:items-center justify-between gap-3 ${idx > 0 ? 'pt-3 mt-3' : ''}`}
          >
            {/* Calm Icon + Text naming bottle and % remaining */}
            <div className="flex items-center gap-2.5">
              <Droplet className="w-4 h-4 text-bar shrink-0" aria-hidden="true" />
              <p className="text-[14px] text-ink font-normal leading-snug">
                <span className="font-medium text-ink">{item.perfumeName}</span>
                <span className="text-secondary font-mono tabular-nums ml-2">
                  ({item.percentage}% {translations[locale].libraryView.percentRemaining} · {item.bottle.remaining_ml} / {item.bottle.size_ml} ml)
                </span>
              </p>
            </div>

            {/* Calm Actions: Buy again / Mark as finished (no Try it First: owned bottles) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onBuyAgain(item.bottle.perfume_id)}
                className="min-h-[36px] px-3 py-1 bg-bar hover:bg-ink text-paper text-xs font-medium transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{translations[locale].home.buyAgain}</span>
              </button>

              <button
                type="button"
                onClick={() => onMarkFinished(item.bottle.id)}
                className="min-h-[36px] px-3 py-1 bg-white hover:bg-surface border border-border text-secondary hover:text-ink text-xs font-medium transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{translations[locale].lowBottle.tandaiHabis}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
