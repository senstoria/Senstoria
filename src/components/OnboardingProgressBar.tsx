import React from 'react';

/**
 * Progress bar — komponen BARU §5.3 rencana (96px, 4px, 50%/100%).
 * Dipakai kuesioner onboarding A14–A15; penunjuk langkah, bukan
 * gamifikasi. Desain dari mockup 05-onboarding: track putih 25%,
 * isian putih penuh.
 */
interface OnboardingProgressBarProps {
  step: number;
  total: number;
  label: string;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({ step, total, label }) => (
  <div
    className="w-24 h-1 rounded-full bg-white/25"
    role="progressbar"
    aria-valuenow={step}
    aria-valuemin={0}
    aria-valuemax={total}
    aria-label={label}
  >
    <div
      className="h-1 rounded-full bg-white transition-all"
      style={{ width: `${Math.min(100, Math.max(0, (step / total) * 100))}%` }}
    />
  </div>
);
