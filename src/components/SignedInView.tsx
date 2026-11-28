import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { translations, fmt, type Locale } from '../lib/i18n.ts';

/**
 * A12 — layar konfirmasi masuk: centang hijau besar, "Kamu sudah
 * masuk", "Selamat datang kembali, {nama}.", pill "Mulai Menjelajah".
 * Lanjut otomatis ~1,2 detik (rencana: "bisa dilewati otomatis ~1
 * detik"); pill melanjutkan seketika. Hanya untuk akun yang SUDAH ADA
 * (masuk email / provider returning) — akun baru provider langsung
 * pulang dengan toast seperti sign-up, supaya "Selamat datang kembali"
 * tidak salah alamat.
 */
interface SignedInViewProps {
  locale: Locale;
  name: string;
  onContinue: () => void;
  autoAdvanceMs?: number;
}

export const SignedInView: React.FC<SignedInViewProps> = ({ locale, name, onContinue, autoAdvanceMs = 1200 }) => {
  const t = translations[locale].signedInView;

  useEffect(() => {
    const timer = window.setTimeout(onContinue, autoAdvanceMs);
    return () => window.clearTimeout(timer);
  }, [onContinue, autoAdvanceMs]);

  return (
    <div data-testid="signed-in-screen" className="fixed inset-0 z-[70] overflow-y-auto bg-paper text-ink" role="dialog" aria-label={t.title}>
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 text-center">
        <span className="w-20 h-20 rounded-full border-2 border-success text-success flex items-center justify-center" aria-hidden="true">
          <Check className="w-10 h-10" strokeWidth={3} />
        </span>
        <h1 className="font-display text-[28px] leading-[34px] font-extrabold tracking-[-0.02em] mt-8">{t.title}</h1>
        <p className="text-[16px] leading-[26px] text-secondary mt-3">{fmt(t.greeting, name)}</p>
        <button
          type="button"
          onClick={onContinue}
          className="flex items-center justify-center w-full max-w-[448px] min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-bar text-paper transition active:scale-[0.98] cursor-pointer mt-10"
        >
          {t.continue}
        </button>
      </div>
    </div>
  );
};
