import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { translations } from './i18n';
import { DEFAULT_QUIZ_ANSWERS, type ScentQuizAnswers } from './scentScoring';
import {
  ONBOARDING_FLAG_KEY,
  PASSWORD_MIN_LENGTH,
  QUIZ_ANSWERS_KEY,
  applyGenderToFinder,
  applyInterestsToFinder,
  hasSeenOnboarding,
  mapGenderToFinder,
  markOnboardingSeen,
  passwordMeetsFirebaseRules,
  readSavedQuizAnswers,
  saveQuizAnswers,
  type SizeStorageLike,
} from './onboardingN7';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appSrc = readFileSync(path.join(__dirname, '../App.tsx'), 'utf-8');

/** Penyimpanan palsu untuk node:test (localStorage tidak tersedia di sini). */
function fakeStorage(initial: Record<string, string> = {}): SizeStorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = v; },
  };
}

describe('Fase N7 — Onboarding hitam + kuesioner Finder (A1–A2, A12, A13–A15, A18 + P2)', () => {
  it('flag first-run: default belum pernah, mark → pernah; nilai asing → belum', () => {
    assert.equal(hasSeenOnboarding(fakeStorage()), false);
    const s = fakeStorage();
    markOnboardingSeen(s);
    assert.equal(s.data[ONBOARDING_FLAG_KEY], '1');
    assert.equal(hasSeenOnboarding(s), true);
    assert.equal(hasSeenOnboarding(fakeStorage({ [ONBOARDING_FLAG_KEY]: 'yes' })), false);
    assert.equal(hasSeenOnboarding(fakeStorage({ [ONBOARDING_FLAG_KEY]: '1' })), true);
  });

  it('Gender kuesioner 1 (A14) → input gender Finder; all/unknown → any', () => {
    assert.equal(mapGenderToFinder('all'), 'any');
    assert.equal(mapGenderToFinder('male'), 'masculine');
    assert.equal(mapGenderToFinder('female'), 'feminine');
    assert.equal(mapGenderToFinder('unknown'), 'any');
    const next = applyGenderToFinder(DEFAULT_QUIZ_ANSWERS, 'female');
    assert.equal(next.genderPreference, 'feminine');
    // Dimensi lain tidak tersentuh.
    assert.equal(next.occasionSetting, DEFAULT_QUIZ_ANSWERS.occasionSetting);
    assert.deepEqual(next.preferredFamilies, DEFAULT_QUIZ_ANSWERS.preferredFamilies);
  });

  it('Minat kuesioner 2 (A15): keluarga → preferredFamilies; Oriental → Ambery (preseden N3)', () => {
    const next = applyInterestsToFinder(DEFAULT_QUIZ_ANSWERS, ['woody', 'oriental']);
    assert.deepEqual(next.preferredFamilies, ['Woody', 'Ambery']);
    assert.equal(next.occasionSetting, 'flexible', 'tanpa suasana malam, occasion tidak berubah');
  });

  it('Minat: "Untuk malam hari" → formal_evening; "Untuk hujan" tidak dipetakan (jujur, bukan tebakan)', () => {
    const rainyOnly = applyInterestsToFinder(DEFAULT_QUIZ_ANSWERS, ['rainy']);
    assert.deepEqual(rainyOnly, DEFAULT_QUIZ_ANSWERS, 'hujan saja tidak mengubah satu pun input Finder');
    const night = applyInterestsToFinder(DEFAULT_QUIZ_ANSWERS, ['fresh', 'night']);
    assert.deepEqual(night.preferredFamilies, ['Fresh']);
    assert.equal(night.occasionSetting, 'formal_evening');
  });

  it('Minat: duplikat dihapus; jawaban Finder yang sudah tersimpan dipertahankan di luar dimensi kuesioner', () => {
    const current: ScentQuizAnswers = {
      ...DEFAULT_QUIZ_ANSWERS,
      climateSetting: 'outdoor_hot',
      longevityExpectation: 'long',
      budgetTier: 'premium',
    };
    const next = applyInterestsToFinder(current, ['floral', 'floral', 'woody']);
    assert.deepEqual(next.preferredFamilies, ['Floral', 'Woody']);
    assert.equal(next.climateSetting, 'outdoor_hot');
    assert.equal(next.longevityExpectation, 'long');
    assert.equal(next.budgetTier, 'premium');
    assert.equal(next.genderPreference, 'any');
  });

  it('Jawaban kuesioner round-trip lewat kunci Finder yang sudah ada (senstoria_quiz_answers_v2)', () => {
    const s = fakeStorage();
    assert.deepEqual(readSavedQuizAnswers(s), DEFAULT_QUIZ_ANSWERS);
    assert.equal(readSavedQuizAnswers(fakeStorage({ [QUIZ_ANSWERS_KEY]: 'bukan-json' })), DEFAULT_QUIZ_ANSWERS);
    const merged = applyInterestsToFinder(applyGenderToFinder(DEFAULT_QUIZ_ANSWERS, 'male'), ['woody', 'night']);
    saveQuizAnswers(s, merged);
    const back = readSavedQuizAnswers(s);
    assert.equal(back.genderPreference, 'masculine');
    assert.deepEqual(back.preferredFamilies, ['Woody']);
    assert.equal(back.occasionSetting, 'formal_evening');
  });

  it('Aturan kata sandi Firebase (A6): hanya minimal 6 karakter — batas 5/6', () => {
    assert.equal(PASSWORD_MIN_LENGTH, 6);
    assert.equal(passwordMeetsFirebaseRules(''), false);
    assert.equal(passwordMeetsFirebaseRules('12345'), false);
    assert.equal(passwordMeetsFirebaseRules('123456'), true);
    assert.equal(passwordMeetsFirebaseRules('kata-sandi-panjang'), true);
  });

  it('Copy onboarding ada di i18n ID+EN, tidak kosong (A2/A13/A14/A15/A18/A12)', () => {
    for (const locale of ['id', 'en'] as const) {
      const t = translations[locale].onboardingView;
      assert.ok(t.welcomeCopy.length > 10, `${locale}: welcomeCopy`);
      assert.ok(t.openerTitle.length > 10, `${locale}: openerTitle`);
      assert.ok(t.q1Title.length > 5, `${locale}: q1Title`);
      assert.ok(t.q2Title.length > 5, `${locale}: q2Title`);
      assert.ok(t.doneTitle.length > 5, `${locale}: doneTitle`);
      assert.equal(t.q1Step.includes('1'), true, `${locale}: q1Step menyebut langkah 1`);
      assert.equal(t.q2Step.includes('2'), true, `${locale}: q2Step menyebut langkah 2`);
      const s = translations[locale].signedInView;
      assert.ok(s.title.length > 5, `${locale}: signedIn title`);
      assert.ok(s.greeting.includes('{name}'), `${locale}: greeting memakai placeholder {name}`);
      assert.ok(s.continue.length > 5, `${locale}: signedIn continue`);
    }
    // Copy rencana (harfiah): A2 ID + A13 ID + A18 ID.
    assert.equal(translations.id.onboardingView.welcomeCopy, 'Perpustakaan parfum pribadimu — ingatan dulu, belanja belakangan.');
    assert.equal(translations.id.onboardingView.openerTitle, 'Untuk mempersonalisasi pengalamanmu, ceritakan sedikit tentang seleramu.');
    assert.equal(translations.id.onboardingView.doneTitle, 'Kamu sudah siap!');
    assert.equal(translations.id.onboardingView.q1Title, 'Parfum apa yang paling sering kamu pakai?');
    assert.equal(translations.id.onboardingView.q2Title, 'Keluarga aroma dan suasana apa yang menarik buatmu?');
  });

  it('Aturan kata sandi ada di i18n authModal ID+EN', () => {
    for (const locale of ['id', 'en'] as const) {
      const a = translations[locale].authModal;
      assert.ok(a.passwordRulesTitle.length > 3, `${locale}: passwordRulesTitle`);
      assert.ok(a.passwordMinLength.includes('6'), `${locale}: passwordMinLength menyebut 6`);
    }
    assert.equal(translations.id.authModal.passwordMinLength, 'Minimal 6 karakter');
  });

  it('App: gerbang onboarding first-run ada; TIDAK ada rute URL baru (keputusan: state, bukan rute)', () => {
    assert.ok(appSrc.includes('OnboardingView'), 'App me-render OnboardingView');
    assert.ok(appSrc.includes('hasSeenOnboarding'), 'App memakai gerbang hasSeenOnboarding');
    assert.ok(appSrc.includes('showOnboarding'), 'App punya state showOnboarding');
    assert.ok(appSrc.includes('SignedInView'), 'App me-render SignedInView (A12)');
    // Regresi N5: bila suatu hari rute onboarding ditambahkan, regex
    // parseFeaturePath harus ikut — hari ini keputusannya: TIDAK ada rute.
    // (Dicek pada baris regex literalnya, bukan seluruh file — komentar
    // gerbang di App juga menyebut kedua kata itu.)
    assert.ok(!appSrc.includes("'/onboarding'"), 'tidak ada rute /onboarding di map rute');
    const regexLine = appSrc.split('\n').find(l => l.includes('pathname.match(/^\\/'));
    assert.ok(regexLine && !regexLine.includes('onboarding'), 'regex parseFeaturePath tidak memuat onboarding');
    assert.ok(appSrc.includes("view !== 'detail'"), 'tab bar tetap sembunyi di Detail');
  });

  it('AuthPageView: daftar aturan kata sandi live + tombol nonaktif sampai lolos (A6)', () => {
    const src = readFileSync(path.join(__dirname, '../components/AuthPageView.tsx'), 'utf-8');
    assert.ok(src.includes('passwordMeetsFirebaseRules'), 'AuthPageView memakai passwordMeetsFirebaseRules');
    assert.ok(src.includes('passwordRulesTitle'), 'daftar aturan memakai kunci i18n passwordRulesTitle');
    assert.ok(src.includes('passwordMinLength'), 'aturan minimal 6 karakter tampil');
    assert.ok(src.includes('disabled='), 'tombol submit bisa nonaktif');
  });

  it('OnboardingView: setiap langkah bisa dilewati; splash auto-lanjut (A1)', () => {
    const src = readFileSync(path.join(__dirname, '../components/OnboardingView.tsx'), 'utf-8');
    // Tombol Lewati (kunci i18n t.skip) ada di welcome/opener/q1/q2/done.
    const skipCount = (src.match(/\{t\.skip\}/g) || []).length;
    assert.ok(skipCount >= 5, `tombol Lewati ada di 5 langkah, ketemu ${skipCount}`);
    assert.ok(src.includes('OnboardingProgressBar'), 'kuesioner memakai progress bar baru §5.3');
    assert.ok(src.includes('PUBLISHED_PERFUMES'), 'welcome memakai parfum terbit nyata (bukan foto/nama karangan)');
    assert.ok(!src.includes('nike'), 'tidak ada referensi Nike di OnboardingView');
  });
});
