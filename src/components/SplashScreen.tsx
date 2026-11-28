import React, { useEffect } from 'react';

/**
 * A1 — splash hitam first-run: mark-S putih besar, tanpa teks lain.
 * Komponen splash bersama (§5.3 / G14): dipakai di first-run dan
 * (nanti) alur keluar/masuk. Lanjut otomatis ~1,4 detik; ketuk di
 * mana pun juga melanjutkan — tombolnya ber-aria-label supaya tetap
 * bisa dioperasikan keyboard tanpa teks yang terlihat.
 */
interface SplashScreenProps {
  onDone: () => void;
  continueLabel: string;
  autoAdvanceMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDone, continueLabel, autoAdvanceMs = 1400 }) => {
  useEffect(() => {
    const t = window.setTimeout(onDone, autoAdvanceMs);
    return () => window.clearTimeout(t);
  }, [onDone, autoAdvanceMs]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={continueLabel}
      data-testid="onboarding-splash"
      className="w-full min-h-full flex flex-col items-center justify-center bg-black text-white cursor-pointer"
    >
      <span
        className="w-32 h-32 border-2 border-white flex items-center justify-center text-[80px] font-extrabold leading-none"
        aria-hidden="true"
      >
        S
      </span>
    </button>
  );
};
