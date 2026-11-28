import React from 'react';
import { translations, type Locale } from '../lib/i18n.ts';

interface LanguageViewProps {
  locale: Locale;
  onSelectLocale: (next: Locale) => void;
  onDone: () => void;
}

/**
 * Fase N6 (G13 + P1): layar pilih bahasa — latar HITAM (momen, bukan
 * dark mode; D-6 tetap berlaku — seluruh aplikasi lain tetap putih).
 * Mockup 04-bahasa: mark-S, "Pilih Bahasamu", 2 opsi EN/ID, pill putih
 * "Selesai". Perbaikan residu mockup (ruang kosong besar di bawah opsi):
 * mark-S DIPERBESAR 72px → 96px + padding atas 48px → 64px — dipilih
 * daripada menambah baris penjelasan, supaya tidak ada copy baru yang
 * dikarang. Bahasa langsung mengganti UI saat dipilih; "Selesai"
 * kembali ke Pengaturan. Tombol bahasa di header dipindah ke sini (G13).
 */
export const LanguageView: React.FC<LanguageViewProps> = ({ locale, onSelectLocale, onDone }) => {
  const t = translations[locale];
  const options: { value: Locale; label: string }[] = [
    { value: 'en', label: t.languageView.english },
    { value: 'id', label: t.languageView.indonesian },
  ];

  return (
    <div
      data-testid="language-screen"
      className="bg-black text-white -mx-4 md:-mx-6 lg:-mx-8 px-8 md:px-10 lg:px-12 pt-16 pb-8 min-h-[70vh] flex flex-col items-center"
    >
      <div
        className="w-24 h-24 border-2 border-white flex items-center justify-center text-[56px] font-extrabold leading-none"
        aria-label="Senstoria"
      >
        S
      </div>
      <h1 className="text-[36px] leading-[42px] font-extrabold tracking-[-0.02em] text-center mt-12">
        {t.languageView.title}
      </h1>
      <p className="text-[14px] leading-[20px] text-white/70 text-center mt-3">
        {t.languageView.subtitle}
      </p>

      <div className="w-full mt-10" role="radiogroup" aria-label={t.languageView.title}>
        {options.map(opt => {
          const selected = locale === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelectLocale(opt.value)}
              className={`flex w-full items-center justify-between min-h-[56px] rounded-full border px-5 text-[16px] font-bold transition cursor-pointer mt-3 ${selected ? 'border-white bg-white text-black' : 'border-white/40 bg-transparent text-white hover:border-white'}`}
            >
              <span>{opt.label}</span>
              <span
                className="w-[22px] h-[22px] rounded-full border-2 border-current inline-flex items-center justify-center flex-none"
                aria-hidden="true"
              >
                <span className={`w-[10px] h-[10px] rounded-full bg-current ${selected ? 'opacity-100' : 'opacity-0'}`} />
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onDone}
        className="flex items-center justify-center w-full min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-white text-black transition active:scale-[0.97] cursor-pointer mt-auto"
      >
        {t.languageView.done}
      </button>
    </div>
  );
};
