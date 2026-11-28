import { DEFAULT_QUIZ_ANSWERS, type ScentQuizAnswers } from './scentScoring.ts';

/**
 * Fase N7 (P2) — Onboarding first-run + kuesioner Finder.
 *
 * Logika murni + penyimpanan (pola yang sama dengan wishlistN5.ts /
 * profileN6.ts: storage disuntik supaya bisa dites di node:test).
 *
 * Aturan yang dipegang:
 * - First-run-only: flag localStorage `senstoria_onboarding_seen_v1`
 *   (+ Firestore `users/{uid}.onboarding_seen` untuk lintas perangkat,
 *   ditulis AuthContext.markOnboardingSeen). Pengguna lama tidak pernah
 *   diblokir: setiap langkah selalu bisa dilewati.
 * - Jawaban kuesioner HANYA mengisi INPUT Finder (localStorage
 *   `senstoria_quiz_answers_v2` yang sudah dibaca ScentFinderView saat
 *   mount) — tidak pernah mengubah skor, ranking, atau hasil.
 * - Tidak ada rute URL baru untuk onboarding: onboarding adalah gerbang
 *   first-run di App (state), bukan layar fitur. Deep link fitur tetap
 *   melewati gerbang (gerbang hanya tampil saat masuk dari '/').
 */

export const ONBOARDING_FLAG_KEY = 'senstoria_onboarding_seen_v1';
/** Kunci jawaban Finder yang sudah ada (ScentFinderView membacanya). */
export const QUIZ_ANSWERS_KEY = 'senstoria_quiz_answers_v2';

export interface SizeStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function hasSeenOnboarding(storage: SizeStorageLike): boolean {
  try {
    return storage.getItem(ONBOARDING_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboardingSeen(storage: SizeStorageLike): void {
  try {
    storage.setItem(ONBOARDING_FLAG_KEY, '1');
  } catch {
    // Best-effort saja — gerbang tidak boleh gagal karena storage.
  }
}

/** Kuesioner 1 (A14) — memetakan dimensi Gender Finder. */
export type OnboardingGender = 'all' | 'male' | 'female' | 'unknown';
export const ONBOARDING_GENDERS: readonly OnboardingGender[] = ['all', 'male', 'female', 'unknown'];

/**
 * Kuesioner 2 (A15) — 4 keluarga aroma + 2 suasana. 'rainy' sengaja
 * TIDAK dipetakan: Finder tidak punya dimensi hujan (climate:
 * outdoor_hot / indoor_ac / evening_cool / flexible; occasion:
 * daily_office / casual_dating / formal_evening / outdoor_sport /
 * flexible) — menebak pemetaannya akan mengarang selera. 'night'
 * memetakan occasion malam Finder ('formal_evening', satu-satunya
 * opsi malam di Finder).
 */
export type OnboardingInterest = 'woody' | 'floral' | 'fresh' | 'oriental' | 'rainy' | 'night';
export const ONBOARDING_INTERESTS: readonly OnboardingInterest[] = ['woody', 'floral', 'fresh', 'oriental', 'rainy', 'night'];

const INTEREST_FAMILY: Record<'woody' | 'floral' | 'fresh' | 'oriental', string> = {
  woody: 'Woody',
  floral: 'Floral',
  fresh: 'Fresh',
  /** Preseden N3: Oriental memetakan kunci 'Amber' (SFP 'Ambery'). */
  oriental: 'Ambery',
};

export function mapGenderToFinder(gender: OnboardingGender): string {
  if (gender === 'male') return 'masculine';
  if (gender === 'female') return 'feminine';
  // 'all' dan 'unknown' sama-sama berarti tanpa preferensi gender.
  return 'any';
}

export function applyGenderToFinder(current: ScentQuizAnswers, gender: OnboardingGender): ScentQuizAnswers {
  return { ...current, genderPreference: mapGenderToFinder(gender) };
}

export function applyInterestsToFinder(current: ScentQuizAnswers, interests: OnboardingInterest[]): ScentQuizAnswers {
  const families = [...new Set(
    interests
      .filter((i): i is 'woody' | 'floral' | 'fresh' | 'oriental' => i in INTEREST_FAMILY)
      .map(i => INTEREST_FAMILY[i]),
  )];
  const next: ScentQuizAnswers = { ...current };
  if (families.length > 0) next.preferredFamilies = families;
  if (interests.includes('night')) next.occasionSetting = 'formal_evening';
  return next;
}

export function readSavedQuizAnswers(storage: SizeStorageLike): ScentQuizAnswers {
  try {
    const saved = storage.getItem(QUIZ_ANSWERS_KEY);
    if (!saved) return DEFAULT_QUIZ_ANSWERS;
    return JSON.parse(saved) as ScentQuizAnswers;
  } catch {
    return DEFAULT_QUIZ_ANSWERS;
  }
}

export function saveQuizAnswers(storage: SizeStorageLike, answers: ScentQuizAnswers): void {
  try {
    storage.setItem(QUIZ_ANSWERS_KEY, JSON.stringify(answers));
  } catch {
    // Best-effort saja.
  }
}

/**
 * A6 — aturan kata sandi Firebase yang benar-benar diberlakukan.
 * Firebase Auth (kebijakan default) hanya mensyaratkan minimal 6
 * karakter; tidak ada aturan huruf besar/angka/simbol di console.
 * Aturan yang ditampilkan di AuthPageView HARUS yang ini — bukan
 * aturan Nike ("Minimal 8 karakter" dsb).
 */
export const PASSWORD_MIN_LENGTH = 6;

export function passwordMeetsFirebaseRules(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}
