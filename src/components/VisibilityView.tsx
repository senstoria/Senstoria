import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { translations, type Locale } from '../lib/i18n.ts';
import {
  PROFILE_VISIBILITIES,
  loadVisibility,
  saveVisibility,
  type ProfileVisibility,
} from '../lib/profileN6.ts';

interface VisibilityViewProps {
  onVisibilityChange: (next: ProfileVisibility) => void;
  onBack: () => void;
  onToast: (message: string) => void;
  locale: Locale;
}

/**
 * Fase N6 (G15 + P13): Visibilitas Profil — radio Semua orang /
 * Anggota saja / Privat, default Privat. Disimpan langsung saat dipilih
 * (localStorage; belum ada endpoint backend) + toast konfirmasi.
 * Journal tetap privat apa pun pilihannya — ditulis eksplisit di layar.
 */
export const VisibilityView: React.FC<VisibilityViewProps> = ({ onVisibilityChange, onBack, onToast, locale }) => {
  const t = translations[locale];
  const [value, setValue] = useState<ProfileVisibility>(() => loadVisibility());

  const labels: Record<ProfileVisibility, string> = {
    everyone: t.visibilityView.optionEveryone,
    members: t.visibilityView.optionMembers,
    private: t.visibilityView.optionPrivate,
  };

  const choose = (next: ProfileVisibility) => {
    setValue(next);
    saveVisibility(next);
    onVisibilityChange(next);
    onToast(t.visibilityView.saved);
  };

  return (
    <div data-testid="visibility-screen" className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.visibilityView.backToSettings}</span>
      </button>

      <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
        {t.visibilityView.title}
      </h1>
      <p className="text-[14px] leading-[20px] text-secondary">{t.visibilityView.intro}</p>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label={t.visibilityView.title}>
        {PROFILE_VISIBILITIES.map(v => {
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(v)}
              className={`flex items-center justify-between min-h-[48px] rounded-full border px-5 text-[14px] font-bold transition cursor-pointer ${selected ? 'bg-bar text-paper border-bar' : 'border-border bg-paper text-ink hover:border-bar'}`}
            >
              <span>{labels[v]}</span>
              <span
                className="w-[20px] h-[20px] rounded-full border-2 border-current inline-flex items-center justify-center flex-none"
                aria-hidden="true"
              >
                <span className={`w-[10px] h-[10px] rounded-full bg-current ${selected ? 'opacity-100' : 'opacity-0'}`} />
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[13px] leading-[18px] text-muted">{t.visibilityView.note}</p>
    </div>
  );
};
