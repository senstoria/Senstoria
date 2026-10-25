import React from 'react';

interface LongevityMeterProps {
  level: number; // 1 to 5
  className?: string;
}

interface SillageMeterProps {
  level: number; // 1 to 5
  className?: string;
}

interface ScoreRingProps {
  score: number; // 0 - 100
  size?: number; // default 56
  strokeWidth?: number; // default 5
  label?: string;
  className?: string;
}

const LONGEVITY_LABELS = ['<2 jam', '2–4 jam', '4–6 jam', '6–8 jam', '8 jam+'];
const SILLAGE_LABELS = ['Intim', 'Dekat', 'Sedang', 'Kuat', 'Sangat kuat'];

export const LongevityMeter: React.FC<LongevityMeterProps> = ({ level, className = '' }) => {
  const safeLevel = Math.max(1, Math.min(5, Math.round(level)));
  const textLabel = LONGEVITY_LABELS[safeLevel - 1];

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center text-[12px]">
        <span className="text-[#5c5c5c]">Daya Tahan</span>
        <span className="font-medium text-[#000000]">{textLabel}</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((seg) => {
          const isActive = seg <= safeLevel;
          return (
            <div
              key={seg}
              className={`h-2 flex-1 rounded-none transition-all duration-300 ${
                isActive
                  ? 'bg-[#333333]'
                  : 'bg-[#d9d7c9]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export const SillageMeter: React.FC<SillageMeterProps> = ({ level, className = '' }) => {
  const safeLevel = Math.max(1, Math.min(5, Math.round(level)));
  const textLabel = SILLAGE_LABELS[safeLevel - 1];

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center text-[12px]">
        <span className="text-[#5c5c5c]">Jejak Aroma (Sillage)</span>
        <span className="font-medium text-[#000000]">{textLabel}</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((seg) => {
          const isActive = seg <= safeLevel;
          return (
            <div
              key={seg}
              className={`h-2 flex-1 rounded-none transition-all duration-300 ${
                isActive
                  ? 'bg-[#333333]'
                  : 'bg-[#d9d7c9]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 56,
  strokeWidth = 4,
  label,
  className = ''
}) => {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#d9d7c9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#333333"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          fill="none"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-[12px] font-mono tabular-nums font-medium text-[#000000]">
          {safeScore}%
        </span>
        {label && (
          <span className="text-[12px] uppercase tracking-wider text-[#5c5c5c]">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
