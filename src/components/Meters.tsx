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
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#77776F] dark:text-[#A3A39A]">Daya Tahan</span>
        <span className="font-semibold text-[#25252A] dark:text-[#F5F5EC]">{textLabel}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((seg) => {
          const isActive = seg <= safeLevel;
          return (
            <div
              key={seg}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-[#A9651F] dark:bg-[#D68B3E]'
                  : 'bg-[#E3E1D8] dark:bg-[#333338]'
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
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#77776F] dark:text-[#A3A39A]">Jejak Aroma (Sillage)</span>
        <span className="font-semibold text-[#25252A] dark:text-[#F5F5EC]">{textLabel}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((seg) => {
          const isActive = seg <= safeLevel;
          return (
            <div
              key={seg}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-[#25252A] dark:bg-[#F5F5EC]'
                  : 'bg-[#E3E1D8] dark:bg-[#333338]'
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
  size = 64,
  strokeWidth = 6,
  label,
  className = ''
}) => {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[#E3E1D8] dark:text-[#333338]"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-[#A9651F] dark:text-[#D68B3E] transition-all duration-1000 ease-out"
          fill="none"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-sm font-bold tracking-tight text-[#25252A] dark:text-[#F5F5EC]">
          {safeScore}%
        </span>
        {label && (
          <span className="text-[9px] uppercase tracking-wider text-[#77776F] dark:text-[#A3A39A]">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
