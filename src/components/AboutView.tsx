import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { translations, type Locale } from '../lib/i18n.ts';
import { APP_VERSION } from '../lib/profileN6.ts';

interface AboutViewProps {
  onBack: () => void;
  locale: Locale;
}

/**
 * Fase N6 (G16 + P1): Tentang Versi Ini — versi dari konstanta APP_VERSION
 * (profileN6.ts; package.json masih "0.0.0" default npm) + disclaimer
 * lisensi pola antarmuka.
 * Tombol "Inventaris Pola Nike" TIDAK DIBANGUN: targetnya (file
 * NIKE_INVENTORY.md di workspace) tidak ada di repo dan tidak bisa
 * disajikan dari aplikasi — tautan ke sana akan mati. Bila founder mau
 * inventaris itu diterbitkan sebagai dokumen, tombol bisa ditambahkan
 * dengan URL yang benar.
 */
export const AboutView: React.FC<AboutViewProps> = ({ onBack, locale }) => {
  const t = translations[locale];
  return (
    <div data-testid="about-screen" className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.aboutView.backToSettings}</span>
      </button>

      <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
        {t.aboutView.title}
      </h1>

      <div className="flex items-center justify-between gap-4 border-b border-hairline py-4 min-h-[48px]">
        <span className="text-[14px] leading-[20px] font-bold text-ink">{t.aboutView.versionLabel}</span>
        <span data-testid="about-version" className="text-[14px] leading-[20px] font-mono text-ink">
          {APP_VERSION}
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-[14px] leading-[20px] font-bold text-ink">{t.aboutView.licenseTitle}</h2>
        <p className="text-[14px] leading-[22px] text-secondary">{t.aboutView.licenseBody}</p>
      </div>
    </div>
  );
};
