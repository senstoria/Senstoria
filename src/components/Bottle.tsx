import React from 'react';
import { PALETTE } from '../lib/palette.ts';

export type BottleSilhouette = 'round' | 'rectangular' | 'slim' | 'dropper' | 'atomizer' | 'cylinder';

interface BottleProps {
  fragranceId?: string;
  name?: string;
  brand?: string;
  concentrationLabel?: string;
  family?: string;
  silhouette?: BottleSilhouette;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fillPercentage?: number; // 0 - 100
  showFill?: boolean; // used ONLY on Currently Wearing cards and Home wear rotation
  interactive?: boolean;
  className?: string;
}

function getSilhouetteFromId(id: string): BottleSilhouette {
  const shapes: BottleSilhouette[] = ['rectangular', 'round', 'cylinder', 'slim', 'atomizer', 'dropper'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
  }
  return shapes[Math.abs(hash) % shapes.length];
}

/**
 * Senstoria Generic Monochrome SVG Bottle Illustration
 * Palette locked to src/lib/palette.ts tokens (paper, bar, ink, secondary,
 * border, hairline, surface, error). No hex literals in this file.
 * Generic monochrome SVG bottle silhouettes with liquid fill drawn inside.
 * Liquid fill is used ONLY when showFill === true (Currently Wearing and Home wear rotation).
 * All other cards use static empty-outline silhouette.
 */
export const Bottle: React.FC<BottleProps> = ({
  fragranceId = 'senstoria-perfume',
  name = 'Parfum',
  brand = 'SENSTORIA',
  concentrationLabel,
  silhouette,
  size = 'md',
  fillPercentage = 80,
  showFill = false,
  interactive = false,
  className = ''
}) => {
  const activeSilhouette = silhouette || getSilhouetteFromId(fragranceId);

  // Enlarged dimensions for hero presence on cards
  const sizeDimensions = {
    sm: { width: 80, height: 120, svgWidth: 96, svgHeight: 144 },
    md: { width: 130, height: 195, svgWidth: 144, svgHeight: 216 },
    lg: { width: 180, height: 270, svgWidth: 180, svgHeight: 270 },
    xl: { width: 240, height: 360, svgWidth: 240, svgHeight: 360 }
  };

  const dim = sizeDimensions[size];
  const clampedFill = Math.max(10, Math.min(95, fillPercentage));

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${interactive ? 'cursor-pointer' : ''} ${className}`}>
      <svg
        width={dim.svgWidth}
        height={dim.svgHeight}
        viewBox="0 0 160 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-200"
      >
        {/* 1. RECTANGULAR FLACON */}
        {activeSilhouette === 'rectangular' && (
          <g>
            {/* Cap */}
            <rect x="66" y="22" width="28" height="28" fill={PALETTE.bar} stroke={PALETTE.bar} strokeWidth="1.5" />
            {/* Collar */}
            <rect x="74" y="50" width="12" height="10" fill={PALETTE.surface} stroke={PALETTE.bar} strokeWidth="1.5" />
            {/* Glass Body */}
            <rect x="38" y="60" width="84" height="152" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="2" />
            
            {/* Liquid Fill (Only if showFill is true) */}
            {showFill && (
              <rect 
                x="42" 
                y="64" 
                width="76" 
                height="144" 
                fill={PALETTE.bar} 
                fillOpacity="0.88"
                className="bottle-fill-liquid"
                style={{ transform: `scaleY(${clampedFill / 100})` }}
              />
            )}

            {/* Inner Dip Tube */}
            <line x1="80" y1="60" x2="80" y2="208" stroke={showFill ? PALETTE.paper : PALETTE.border} strokeWidth="1.5" strokeDasharray="3 2" />
            
            {/* Minimalist Editorial Label */}
            <rect x="48" y="114" width="64" height="44" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="1" />
            <text x="80" y="130" textAnchor="middle" fill={PALETTE.ink} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif" fontWeight="700" letterSpacing="0.8">
              {brand.length > 8 ? brand.slice(0, 8).toUpperCase() : brand.toUpperCase()}
            </text>
            <line x1="56" y1="136" x2="104" y2="136" stroke={PALETTE.hairline} strokeWidth="1" />
            <text x="80" y="148" textAnchor="middle" fill={PALETTE.secondary} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif">
              {name.length > 10 ? name.slice(0, 9) + '..' : name}
            </text>
          </g>
        )}

        {/* 2. ROUND / SPHERICAL BOTTLE */}
        {activeSilhouette === 'round' && (
          <g>
            {/* Cap */}
            <circle cx="80" cy="28" r="14" fill={PALETTE.bar} stroke={PALETTE.bar} strokeWidth="1.5" />
            <rect x="74" y="42" width="12" height="12" fill={PALETTE.surface} stroke={PALETTE.bar} strokeWidth="1.5" />
            {/* Spherical Body */}
            <circle cx="80" cy="138" r="66" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="2" />
            
            {/* Liquid Fill Clip */}
            {showFill && (
              <>
                <clipPath id={`roundClip-${fragranceId}`}>
                  <circle cx="80" cy="138" r="64" />
                </clipPath>
                <g clipPath={`url(#roundClip-${fragranceId})`}>
                  <rect 
                    x="12" 
                    y="74" 
                    width="136" 
                    height="128" 
                    fill={PALETTE.bar}
                    fillOpacity="0.88"
                    className="bottle-fill-liquid"
                    style={{ transform: `scaleY(${clampedFill / 100})` }}
                  />
                </g>
              </>
            )}

            {/* Dip tube */}
            <line x1="80" y1="54" x2="80" y2="200" stroke={showFill ? PALETTE.paper : PALETTE.border} strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Center Label */}
            <circle cx="80" cy="138" r="26" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="1" />
            <text x="80" y="137" textAnchor="middle" fill={PALETTE.ink} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif" fontWeight="700">
              {brand.slice(0, 7).toUpperCase()}
            </text>
            <text x="80" y="148" textAnchor="middle" fill={PALETTE.secondary} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif">
              PARFUM
            </text>
          </g>
        )}

        {/* 3. TALL SLIM COLUMN */}
        {activeSilhouette === 'slim' && (
          <g>
            {/* Tall Cap */}
            <rect x="68" y="16" width="24" height="34" fill={PALETTE.bar} stroke={PALETTE.bar} strokeWidth="1.5" />
            <rect x="74" y="50" width="12" height="8" fill={PALETTE.surface} stroke={PALETTE.bar} strokeWidth="1.5" />
            {/* Column Body */}
            <rect x="52" y="58" width="56" height="162" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="2" />
            
            {showFill && (
              <rect 
                x="56" 
                y="62" 
                width="48" 
                height="154" 
                fill={PALETTE.bar} 
                fillOpacity="0.88"
                className="bottle-fill-liquid"
                style={{ transform: `scaleY(${clampedFill / 100})` }}
              />
            )}

            <line x1="80" y1="58" x2="80" y2="216" stroke={showFill ? PALETTE.paper : PALETTE.border} strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Vertical Label */}
            <rect x="58" y="106" width="44" height="56" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="1" />
            <text x="80" y="128" textAnchor="middle" fill={PALETTE.ink} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif" fontWeight="700" letterSpacing="0.8">
              {brand.slice(0, 6).toUpperCase()}
            </text>
            <text x="80" y="146" textAnchor="middle" fill={PALETTE.secondary} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif">
              EDP
            </text>
          </g>
        )}

        {/* 4. DROPPER / APOTHECARY */}
        {activeSilhouette === 'dropper' && (
          <g>
            {/* Bulb & Cap */}
            <rect x="72" y="12" width="16" height="20" fill={PALETTE.bar} stroke={PALETTE.bar} strokeWidth="1.5" />
            <rect x="66" y="32" width="28" height="16" fill={PALETTE.bar} stroke={PALETTE.bar} strokeWidth="1.5" />
            {/* Glass Bottle Body */}
            <rect x="48" y="48" width="64" height="168" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="2" />

            {showFill && (
              <rect 
                x="52" 
                y="52" 
                width="56" 
                height="160" 
                fill={PALETTE.bar} 
                fillOpacity="0.88"
                className="bottle-fill-liquid"
                style={{ transform: `scaleY(${clampedFill / 100})` }}
              />
            )}

            <line x1="80" y1="48" x2="80" y2="212" stroke={showFill ? PALETTE.paper : PALETTE.border} strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Apothecary Label */}
            <rect x="56" y="112" width="48" height="46" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="1" />
            <text x="80" y="130" textAnchor="middle" fill={PALETTE.ink} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif" fontWeight="700">
              {brand.slice(0, 6).toUpperCase()}
            </text>
            <text x="80" y="146" textAnchor="middle" fill={PALETTE.secondary} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif">
              EXTRAIT
            </text>
          </g>
        )}

        {/* 5. VINTAGE ATOMIZER */}
        {activeSilhouette === 'atomizer' && (
          <g>
            <rect x="70" y="18" width="20" height="22" fill={PALETTE.bar} stroke={PALETTE.bar} strokeWidth="1.5" />
            <rect x="66" y="40" width="28" height="10" fill={PALETTE.surface} stroke={PALETTE.bar} strokeWidth="1.5" />
            <rect x="44" y="50" width="72" height="162" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="2" />

            {showFill && (
              <rect 
                x="48" 
                y="54" 
                width="64" 
                height="154" 
                fill={PALETTE.bar} 
                fillOpacity="0.88"
                className="bottle-fill-liquid"
                style={{ transform: `scaleY(${clampedFill / 100})` }}
              />
            )}

            <line x1="80" y1="50" x2="80" y2="208" stroke={showFill ? PALETTE.paper : PALETTE.border} strokeWidth="1.5" strokeDasharray="3 2" />

            <rect x="52" y="110" width="56" height="46" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="1" />
            <text x="80" y="128" textAnchor="middle" fill={PALETTE.ink} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif" fontWeight="700">
              {brand.slice(0, 7).toUpperCase()}
            </text>
            <text x="80" y="144" textAnchor="middle" fill={PALETTE.secondary} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif">
              SENSTORIA
            </text>
          </g>
        )}

        {/* 6. CYLINDER MINIMAL */}
        {activeSilhouette === 'cylinder' && (
          <g>
            <rect x="58" y="20" width="44" height="28" fill={PALETTE.bar} stroke={PALETTE.bar} strokeWidth="1.5" />
            <rect x="54" y="48" width="52" height="166" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="2" />

            {showFill && (
              <rect 
                x="58" 
                y="52" 
                width="44" 
                height="158" 
                fill={PALETTE.bar} 
                fillOpacity="0.88"
                className="bottle-fill-liquid"
                style={{ transform: `scaleY(${clampedFill / 100})` }}
              />
            )}

            <line x1="80" y1="48" x2="80" y2="210" stroke={showFill ? PALETTE.paper : PALETTE.border} strokeWidth="1.5" strokeDasharray="3 2" />

            <rect x="60" y="112" width="40" height="46" fill={PALETTE.paper} stroke={PALETTE.bar} strokeWidth="1" />
            <text x="80" y="130" textAnchor="middle" fill={PALETTE.ink} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif" fontWeight="700">
              {brand.slice(0, 6).toUpperCase()}
            </text>
            {concentrationLabel && (
              <text x="80" y="146" textAnchor="middle" fill={PALETTE.secondary} fontSize="12" fontFamily="'Hanken Grotesk', sans-serif">
                {concentrationLabel.toUpperCase()}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
