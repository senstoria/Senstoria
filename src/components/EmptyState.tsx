import React from 'react';

export type EmptyStateIconType = 'shelf' | 'diary' | 'compare' | 'bottle';

interface EmptyStateProps {
  title: string;
  body: string;
  ctaLabel: string;
  onCtaClick: () => void;
  secondaryCtaLabel?: string;
  onSecondaryCtaClick?: () => void;
  iconType?: EmptyStateIconType;
  className?: string;
}

/**
 * EmptyState component conforming to Rule 8 & Rule 9
 * Minimal monochrome line-art SVG, one-sentence body, minimum 44px tap target, WCAG AA contrast.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  body,
  ctaLabel,
  onCtaClick,
  secondaryCtaLabel,
  onSecondaryCtaClick,
  iconType = 'shelf',
  className = ''
}) => {
  return (
    <div 
      className={`p-10 md:p-14 text-center bg-[#FFFEF2] border border-[#D9D7C9] flex flex-col items-center justify-center space-y-5 rounded-xs ${className}`}
      role="region"
      aria-label={title}
    >
      {/* Monochrome Line-Art SVG */}
      <div className="w-20 h-20 flex items-center justify-center text-[#333333]" aria-hidden="true">
        {iconType === 'shelf' && (
          <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            {/* Minimalist shelf line */}
            <line x1="8" y1="62" x2="72" y2="62" strokeWidth="2" />
            <line x1="12" y1="66" x2="16" y2="74" />
            <line x1="68" y1="66" x2="64" y2="74" />
            {/* Bottle 1 - Classic Rectangular Flacon */}
            <rect x="18" y="32" width="16" height="30" rx="1" />
            <rect x="22" y="24" width="8" height="8" rx="0.5" />
            <line x1="26" y1="20" x2="26" y2="24" />
            <line x1="22" y1="42" x2="30" y2="42" strokeDasharray="1 2" />
            {/* Bottle 2 - Slender Cylinder */}
            <rect x="44" y="26" width="14" height="36" rx="1" />
            <rect x="47" y="18" width="8" height="8" rx="0.5" />
            <circle cx="51" cy="40" r="3" strokeDasharray="1 2" />
          </svg>
        )}

        {iconType === 'diary' && (
          <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            {/* Open notebook */}
            <path d="M12 20C12 18 24 16 40 18C56 16 68 18 68 20V62C68 62 56 60 40 62C24 60 12 62 12 62V20Z" />
            <line x1="40" y1="18" x2="40" y2="62" />
            {/* Page lines */}
            <line x1="18" y1="28" x2="34" y2="28" />
            <line x1="18" y1="36" x2="34" y2="36" />
            <line x1="18" y1="44" x2="30" y2="44" />
            <line x1="46" y1="28" x2="62" y2="28" />
            <line x1="46" y1="36" x2="62" y2="36" />
            {/* Scent droplet */}
            <path d="M54 44C54 44 58 48 58 50C58 52 56 54 54 54C52 54 50 52 50 50C50 48 54 44 54 44Z" />
          </svg>
        )}

        {iconType === 'compare' && (
          <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            {/* 3 compare column slots */}
            <rect x="10" y="16" width="16" height="48" rx="1" strokeDasharray="3 3" />
            <rect x="32" y="16" width="16" height="48" rx="1" strokeDasharray="3 3" />
            <rect x="54" y="16" width="16" height="48" rx="1" strokeDasharray="3 3" />
            {/* Plus symbols inside empty slots */}
            <line x1="18" y1="36" x2="18" y2="44" />
            <line x1="14" y1="40" x2="22" y2="40" />
            <line x1="40" y1="36" x2="40" y2="44" />
            <line x1="36" y1="40" x2="44" y2="40" />
            <line x1="62" y1="36" x2="62" y2="44" />
            <line x1="58" y1="40" x2="66" y2="40" />
          </svg>
        )}

        {iconType === 'bottle' && (
          <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <rect x="24" y="28" width="32" height="42" rx="1" />
            <rect x="32" y="16" width="16" height="12" rx="0.5" />
            <line x1="40" y1="10" x2="40" y2="16" />
            <line x1="24" y1="52" x2="56" y2="52" strokeDasharray="2 2" />
          </svg>
        )}
      </div>

      {/* Copy */}
      <div className="space-y-2 max-w-md">
        <h3 className="font-serif text-2xl font-normal text-[#1A1A1A]">
          {title}
        </h3>
        <p className="text-sm md:text-base text-[#5C5C5C] leading-relaxed">
          {body}
        </p>
      </div>

      {/* Primary & Secondary Actions (min 44px tap target) */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCtaClick}
          className="min-h-[44px] px-6 py-2.5 bg-[#333333] hover:bg-black text-[#FFFEF2] text-sm font-semibold transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#8A4B14] rounded-xs cursor-pointer"
        >
          {ctaLabel}
        </button>

        {secondaryCtaLabel && onSecondaryCtaClick && (
          <button
            type="button"
            onClick={onSecondaryCtaClick}
            className="min-h-[44px] px-6 py-2.5 bg-transparent hover:bg-black/5 text-[#1A1A1A] border border-[#333333] text-sm font-semibold transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#8A4B14] rounded-xs cursor-pointer"
          >
            {secondaryCtaLabel}
          </button>
        )}
      </div>
    </div>
  );
};
