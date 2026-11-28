import React, { useState } from 'react';
import { translations, type Locale } from '../lib/i18n.ts';
import { PUBLISHED_PERFUMES } from '../data/seedPerfumes.ts';
import {
  applyGenderToFinder,
  applyInterestsToFinder,
  readSavedQuizAnswers,
  saveQuizAnswers,
  type OnboardingGender,
  type OnboardingInterest,
} from '../lib/onboardingN7.ts';
import { OnboardingProgressBar } from './OnboardingProgressBar.tsx';
import { Bottle } from './Bottle.tsx';
import { SplashScreen } from './SplashScreen.tsx';

/**
 * Fase N7 (P2) — Onboarding first-run + kuesioner Finder.
 *
 * 7 layar (A1–A2, A12 ada di SignedInView, A13–A15, A18) sebagai SATU
 * gerbang first-run di App (state, BUKAN rute URL — deep link fitur
 * tetap melewati gerbang; gerbang hanya tampil saat masuk dari '/').
 * Setiap langkah selalu bisa dilewati; selesai/lewati → onFinish
 * (App yang menulis flag localStorage + Firestore).
 *
 * Copy: hanya dari copy Senstoria yang sudah disetujui / harfiah rencana
 * (A2, A13, A14, A15, A18) — bukan dari copy Nike. A18 memakai "Kamu
 * sudah siap!" dari rencana: frame aslinya TIDAK TERVERIFIKASI ULANG di
 * studi dan duplikat Figma masih view-only (MCP terblokir), jadi copy
 * mockup 05 / rencana yang dipakai.
 * Judul kuesioner 28px (catatan verifikasi rencana — membungkus 3 baris
 * dengan rapi); tipografi display memakai Fraunces (Y5), bukan Archivo
 * 800 mockup — mockup dipakai sebagai referensi layout, seperti N5.
 * Jawaban disimpan per langkah saat "Lanjut": gender di Q1, minat di
 * Q2 — keduanya hanya mengisi INPUT Finder (kunci
 * senstoria_quiz_answers_v2), tidak pernah mengubah skor.
 */

type OnboardingStep = 'splash' | 'welcome' | 'opener' | 'q1' | 'q2' | 'done';

interface OnboardingViewProps {
  locale: Locale;
  onFinish: () => void;
  onGoAuth: () => void;
}

const featuredPerfume = [...PUBLISHED_PERFUMES]
  .sort((a, b) => (b.release_year ?? 0) - (a.release_year ?? 0))[0];

const GENDER_OPTIONS: { value: OnboardingGender; labelKey: 'q1All' | 'q1Male' | 'q1Female' | 'q1Unknown' }[] = [
  { value: 'all', labelKey: 'q1All' },
  { value: 'male', labelKey: 'q1Male' },
  { value: 'female', labelKey: 'q1Female' },
  { value: 'unknown', labelKey: 'q1Unknown' },
];

const INTEREST_OPTIONS: { value: OnboardingInterest; labelKey: 'q2Woody' | 'q2Floral' | 'q2Fresh' | 'q2Oriental' | 'q2Rainy' | 'q2Night' }[] = [
  { value: 'woody', labelKey: 'q2Woody' },
  { value: 'floral', labelKey: 'q2Floral' },
  { value: 'fresh', labelKey: 'q2Fresh' },
  { value: 'oriental', labelKey: 'q2Oriental' },
  { value: 'rainy', labelKey: 'q2Rainy' },
  { value: 'night', labelKey: 'q2Night' },
];

export const OnboardingView: React.FC<OnboardingViewProps> = ({ locale, onFinish, onGoAuth }) => {
  const t = translations[locale].onboardingView;
  const [step, setStep] = useState<OnboardingStep>('splash');
  // Mockup 05: "Untuk saya — semua" sudah terpilih di awal.
  const [gender, setGender] = useState<OnboardingGender>('all');
  const [interests, setInterests] = useState<OnboardingInterest[]>([]);

  const advanceQ1 = () => {
    saveQuizAnswers(localStorage, applyGenderToFinder(readSavedQuizAnswers(localStorage), gender));
    setStep('q2');
  };

  const advanceQ2 = () => {
    saveQuizAnswers(localStorage, applyInterestsToFinder(readSavedQuizAnswers(localStorage), interests));
    setStep('done');
  };

  const toggleInterest = (value: OnboardingInterest) => {
    setInterests(prev => (prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]));
  };

  const optionClass = (selected: boolean) =>
    `flex w-full items-center justify-between min-h-[56px] rounded-full border px-5 text-[16px] font-bold transition cursor-pointer mt-3 ${selected ? 'border-white bg-white text-black' : 'border-white/40 bg-transparent text-white hover:border-white'}`;

  return (
    <div data-testid="onboarding-screen" className="fixed inset-0 z-[70] overflow-y-auto [&_button:focus-visible]:outline-2 [&_button:focus-visible]:-outline-offset-4 [&_button:focus-visible]:outline-current" role="dialog" aria-label={t.welcomeCopy}>
      {step === 'splash' && (
        <SplashScreen continueLabel={t.splashContinue} onDone={() => setStep('welcome')} />
      )}

      {step === 'welcome' && (
        <div data-testid="onboarding-welcome" className="flex min-h-dvh flex-col bg-ink font-sans text-paper">
          <header className="mx-auto flex w-full max-w-lg items-center justify-between px-6 pt-4">
            <img src="/assets/senstoria-logo-white.png" alt="Senstoria" width={120} height={20} />
            <button type="button" onClick={onFinish} className="min-h-11 min-w-11 rounded-full px-2 text-sm font-normal text-gray-300 cursor-pointer">
              {t.skip}
            </button>
          </header>

          <div className="relative isolate mx-auto flex min-h-[300px] w-full max-w-lg flex-1 items-center overflow-hidden px-6">
            <p lang="en" className="display-giant leading-[0.9] max-[359px]:text-[clamp(48px,20vw,72px)]">
              <span className="block whitespace-nowrap">STAND</span>
              <span className="block whitespace-nowrap">OUT.</span>
            </p>
            <div aria-hidden="true" className="pointer-events-none absolute right-[3%] bottom-0 z-10 w-[51%] max-w-[240px]">
              <Bottle
                fragranceId={featuredPerfume?.id}
                name={featuredPerfume?.name}
                brand={featuredPerfume?.brand}
                silhouette="rectangular"
                size="xl"
                className="rotate-12 drop-shadow-lg [&_svg]:h-auto [&_svg]:w-full"
              />
            </div>
          </div>

          <div className="relative z-20 min-h-[38dvh] rounded-t-sheet-top bg-paper text-ink">
            <div className="mx-auto max-w-lg px-6 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div aria-hidden="true" className="flex items-center gap-1.5">
                <span className="h-1.5 w-6 rounded-full bg-ink" />
                {[1, 2, 3, 4].map(page => (
                  <span key={page} className="size-1.5 rounded-full bg-stone" />
                ))}
              </div>
              <h1 className="mt-4 text-[26px] leading-7 font-bold">
                <span className="block">{featuredPerfume?.brand}</span>
                <span className="block">{featuredPerfume?.name}</span>
              </h1>
              <p className="text-small mt-2 text-muted">{t.welcomeCopy}</p>
              <button
                type="button"
                onClick={() => setStep('opener')}
                className="relative mt-5 flex min-h-14 w-full items-center justify-center rounded-full bg-ink px-14 text-sm font-bold text-paper cursor-pointer"
              >
                <span aria-hidden="true" className="absolute left-2 grid size-10 place-items-center rounded-full bg-paper text-xl text-ink">→</span>
                {t.welcomeStart}
              </button>
              <button type="button" onClick={onGoAuth} className="block min-h-11 w-full rounded-full text-center text-sm font-bold text-ink underline cursor-pointer">
                {t.welcomeSignIn}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'opener' && (
        <div data-testid="onboarding-opener" className="min-h-dvh flex flex-col px-6 pt-12 pb-8 bg-black text-white">
          <div className="w-24 h-24 border-2 border-white flex items-center justify-center text-[56px] font-extrabold leading-none" aria-label="Senstoria">
            S
          </div>
          <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.025em] mt-12">{t.openerTitle}</h1>
          <div className="mt-auto pt-10 space-y-3">
            <button
              type="button"
              onClick={() => setStep('q1')}
              className="flex items-center justify-center w-full min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-white text-black transition active:scale-[0.97] cursor-pointer"
            >
              {t.continue}
            </button>
            <button
              type="button"
              onClick={onFinish}
              className="block w-full text-center text-white/85 text-[14px] font-bold underline min-h-[44px] cursor-pointer"
            >
              {t.skip}
            </button>
          </div>
        </div>
      )}

      {step === 'q1' && (
        <div data-testid="onboarding-q1" className="min-h-dvh flex flex-col px-6 pt-12 pb-8 bg-black text-white">
          <OnboardingProgressBar step={1} total={2} label={t.q1Step} />
          <p className="text-[13px] leading-[16px] text-white/70 mt-4">{t.q1Step}</p>
          <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.025em] mt-3">{t.q1Title}</h1>
          <p className="text-[14px] leading-[20px] text-white/70 mt-3">{t.q1Sub}</p>
          <div className="mt-8" role="radiogroup" aria-label={t.q1Title}>
            {GENDER_OPTIONS.map(opt => {
              const selected = gender === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setGender(opt.value)}
                  className={optionClass(selected)}
                >
                  <span>{t[opt.labelKey]}</span>
                  <span className="w-[22px] h-[22px] rounded-full border-2 border-current inline-flex items-center justify-center flex-none" aria-hidden="true">
                    <span className={`w-[10px] h-[10px] rounded-full bg-current ${selected ? 'opacity-100' : 'opacity-0'}`} />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto pt-10 space-y-3">
            <button
              type="button"
              onClick={advanceQ1}
              className="flex items-center justify-center w-full min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-white text-black transition active:scale-[0.97] cursor-pointer"
            >
              {t.continue}
            </button>
            <button
              type="button"
              onClick={onFinish}
              className="block w-full text-center text-white/85 text-[14px] font-bold underline min-h-[44px] cursor-pointer"
            >
              {t.skip}
            </button>
          </div>
        </div>
      )}

      {step === 'q2' && (
        <div data-testid="onboarding-q2" className="min-h-dvh flex flex-col px-6 pt-12 pb-8 bg-black text-white">
          <OnboardingProgressBar step={2} total={2} label={t.q2Step} />
          <p className="text-[13px] leading-[16px] text-white/70 mt-4">{t.q2Step}</p>
          <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.025em] mt-3">{t.q2Title}</h1>
          <p className="text-[14px] leading-[20px] text-white/70 mt-3">{t.q2Sub}</p>
          <div className="mt-8" role="group" aria-label={t.q2Title}>
            {INTEREST_OPTIONS.map(opt => {
              const selected = interests.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggleInterest(opt.value)}
                  className={optionClass(selected)}
                >
                  <span>{t[opt.labelKey]}</span>
                  <span className="w-[22px] h-[22px] rounded-full border-2 border-current inline-flex items-center justify-center flex-none" aria-hidden="true">
                    <span className={`w-[10px] h-[10px] rounded-full bg-current ${selected ? 'opacity-100' : 'opacity-0'}`} />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto pt-10 space-y-3">
            <button
              type="button"
              onClick={advanceQ2}
              className="flex items-center justify-center w-full min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-white text-black transition active:scale-[0.97] cursor-pointer"
            >
              {t.continue}
            </button>
            <button
              type="button"
              onClick={onFinish}
              className="block w-full text-center text-white/85 text-[14px] font-bold underline min-h-[44px] cursor-pointer"
            >
              {t.skip}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div data-testid="onboarding-done" className="min-h-dvh flex flex-col px-6 pt-12 pb-8 bg-black text-white">
          <div className="w-24 h-24 border-2 border-white flex items-center justify-center text-[56px] font-extrabold leading-none" aria-label="Senstoria">
            S
          </div>
          <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.025em] mt-12">{t.doneTitle}</h1>
          <div className="mt-auto pt-10 space-y-3">
            <button
              type="button"
              onClick={onFinish}
              className="flex items-center justify-center w-full min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-white text-black transition active:scale-[0.97] cursor-pointer"
            >
              {t.doneExplore}
            </button>
            <button
              type="button"
              onClick={onFinish}
              className="block w-full text-center text-white/85 text-[14px] font-bold underline min-h-[44px] cursor-pointer"
            >
              {t.skip}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
