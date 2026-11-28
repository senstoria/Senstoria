import {
  rankRecommendations,
  type ScentQuizAnswers,
} from './scentScoring.ts';
import { PUBLISHED_PERFUMES } from '../data/seedPerfumes.ts';

/**
 * Fase N8 (G10 + P5) — Tanya Kurator: pemandu percakapan untuk Finder.
 *
 * Logika murni (pola yang sama dengan onboardingN7.ts / wishlistN5.ts).
 *
 * Aturan yang dipegang (BR-10, rencana §7 Fase N8):
 * - Kurator adalah PEMANDU, bukan pemilih: ia tidak memilih produk
 *   sendiri, tidak mengurutkan ulang tanpa penjelasan, dan tidak
 *   pernah mengubah angka skor. Semua angka/alasan di jawaban berasal
 *   dari mesin skor Finder yang sudah ada (scentScoring.ts) — kurator
 *   hanya MEMBACA hasil Finder, tidak pernah menulis skor.
 * - Satu-satunya sumber kebenaran produk adalah skor Finder +
 *   alasan per-dimensi (breakdownRows / whyFitsBullets /
 *   possibleMismatch) yang dihitung calculateMatchScore. Bila Finder
 *   tidak punya jawaban pengguna, tidak ada skor yang dijelaskan —
 *   jawaban hanya menyarankan input Finder untuk dicoba, tanpa nama
 *   produk dan tanpa angka.
 * - 'Hujan' BUKAN dimensi Finder (preseden N7: 'Untuk hujan' sengaja
 *   tidak dipetakan). Bila pertanyaan menyebut hujan, jawaban WAJIB
 *   jujur soal itu (lihat RAIN_HONESTY_*): pilihan terdekat adalah
 *   iklim 'evening_cool' (udara malam yang sejuk — sitasi Finder
 *   sendiri menyebut "saat hujan sejuk"), tapi itu SARAN untuk dicoba,
 *   bukan pemetaan. Jangan pernah menulis "suasana hujan" sebagai
 *   input Finder.
 * - 'Sehari penuh' memetakan longevity 'long' (target band 8h+,
 *   fit 0,94; 6-8h fit 0,80) — satu-satunya pemetaan ketahanan
 *   panjang yang didukung mesin skor.
 */

/** Teks berpasangan ID/EN — preseden scentScoring (citationId/En). */
export interface LocalizedText {
  id: string;
  en: string;
}

export type CuratorDimension =
  | 'notesFamily'
  | 'climate'
  | 'occasion'
  | 'longevity'
  | 'gender'
  | 'budget';

export interface CuratorFinderInput extends LocalizedText {
  dimension: CuratorDimension;
  /** Nilai input Finder yang disarankan (mis. 'Woody', 'long'). */
  value: string;
}

/** Penjelasan tervalidasi: satu-satunya isi jawaban kurator. */
export interface ValidatedExplanation {
  headline: LocalizedText;
  /** Alasan — semuanya berasal dari mesin skor / definisi dimensi. */
  reasons: LocalizedText[];
  /** Input Finder yang disarankan untuk dicoba (navigasi saja). */
  finderInputs: CuratorFinderInput[];
  /** Catatan kejujuran (hujan, tanpa skor, dsb.) — tidak boleh dihapus. */
  honestyNotes: LocalizedText[];
  /** Hasil Finder untuk jawaban tersimpan (null bila belum ada jawaban). */
  topMatch: {
    perfumeId: string;
    brand: string;
    name: string;
    score: number;
  } | null;
}

export interface CuratorIntents {
  families: string[];
  climate: 'outdoor_hot' | 'indoor_ac' | 'evening_cool' | null;
  occasion: 'daily_office' | 'casual_dating' | 'formal_evening' | 'outdoor_sport' | null;
  longevity: 'light' | 'moderate' | 'long' | null;
  mentionsRain: boolean;
  mentionsCalm: boolean;
  mentionsSweet: boolean;
}

/** Bobot dimensi Finder (scentScoring BASE_DIMENSION_WEIGHTS). */
export const CURATOR_DIMENSION_WEIGHTS: Record<CuratorDimension, number> = {
  notesFamily: 25,
  climate: 20,
  occasion: 20,
  longevity: 15,
  gender: 10,
  budget: 10,
};

const DIMENSION_LABELS: Record<CuratorDimension, LocalizedText> = {
  notesFamily: { id: 'Keluarga aroma', en: 'Scent family' },
  climate: { id: 'Iklim', en: 'Climate' },
  occasion: { id: 'Suasana', en: 'Occasion' },
  longevity: { id: 'Ketahanan', en: 'Longevity' },
  gender: { id: 'Gender', en: 'Gender' },
  budget: { id: 'Anggaran', en: 'Budget' },
};

const FAMILY_LABELS: Record<string, LocalizedText> = {
  Woody: { id: 'Woody', en: 'Woody' },
  Floral: { id: 'Floral', en: 'Floral' },
  Fresh: { id: 'Fresh', en: 'Fresh' },
  Ambery: { id: 'Ambery', en: 'Ambery' },
  Gourmand: { id: 'Gourmand', en: 'Gourmand' },
  Aromatic: { id: 'Aromatic', en: 'Aromatic' },
};

/**
 * Catatan kejujuran hujan — dipakai SETIAP jawaban yang menyebut hujan.
 * 'evening_cool' adalah pilihan TERDEKAT (sitasi iklim Finder sendiri
 * menyebut notes dasar mekar "di udara malam atau saat hujan sejuk"),
 * bukan pemetaan hujan: Finder menilai udara malam yang sejuk, bukan
 * hujan itu sendiri.
 */
export const RAIN_HONESTY: LocalizedText = {
  id: 'Finder tidak punya pilihan hujan — “malam yang sejuk” adalah pilihan terdekat: Finder menilai udara malam yang sejuk, bukan hujan itu sendiri.',
  en: 'Finder has no rain option — “cool evening” is the closest choice: Finder scores cool evening air, not rain itself.',
};

export const NO_SCORE_HONESTY: LocalizedText = {
  id: 'Finder belum punya jawabanmu, jadi belum ada skor yang bisa dijelaskan — kurator tidak mengarang skor.',
  en: 'Finder doesn’t have your answers yet, so there’s no score to explain — the curator never invents scores.',
};

function norm(text: string): string {
  // 'kayu manis' (cinnamon = Ambery) disatukan dulu supaya kata 'kayu'
  // di dalamnya tidak ikut tercocok Woody.
  return ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')} `
    .replace(/\s+/g, ' ')
    .replace(' kayu manis ', ' kayumanis ');
}

function has(text: string, ...words: string[]): boolean {
  return words.some(w => text.includes(` ${w} `));
}

/**
 * Membaca maksud pertanyaan dari kata kunci — deterministik, tanpa LLM.
 * Keluarga memakai kata kunci yang sama dengan pencocokan notes mesin
 * skor (cedar/sandalwood/vetiver → Woody, dst.). 'kayu manis' dicek
 * SEBELUM 'kayu' (cinnamon = Ambery, bukan Woody).
 */
export function parseCuratorQuestion(raw: string): CuratorIntents {
  const text = norm(raw);
  const families: string[] = [];
  const addFamily = (f: string) => {
    if (!families.includes(f)) families.push(f);
  };

  if (has(text, 'kayumanis', 'cinnamon', 'amber', 'ambery', 'oriental', 'rempah')) addFamily('Ambery');
  if (has(text, 'woody', 'kayu', 'cedar', 'sandalwood', 'cendana', 'vetiver')) addFamily('Woody');
  if (has(text, 'floral', 'bunga', 'mawar', 'rose', 'melati', 'jasmine', 'peony')) addFamily('Floral');
  if (has(text, 'fresh', 'segar', 'citrus', 'sitrus', 'bergamot', 'lemon')) addFamily('Fresh');
  if (has(text, 'gourmand', 'vanila', 'vanilla', 'karamel', 'caramel', 'kopi', 'coffee', 'coklat', 'chocolate')) addFamily('Gourmand');
  if (has(text, 'aromatic', 'aromatik', 'lavender', 'sage', 'teh', 'tea', 'mint')) addFamily('Aromatic');

  let climate: CuratorIntents['climate'] = null;
  if (has(text, 'panas', 'terik', 'siang hari', 'outdoor', 'luar ruangan', 'gerah')) climate = 'outdoor_hot';
  else if (has(text, 'kantor', 'ac', 'ruangan', 'indoor', 'dalam ruangan')) climate = 'indoor_ac';
  else if (has(text, 'malam', 'sejuk', 'dingin', 'sore', 'evening', 'cool')) climate = 'evening_cool';

  let occasion: CuratorIntents['occasion'] = null;
  if (has(text, 'olahraga', 'sport', 'lari', 'gym', 'futsal')) occasion = 'outdoor_sport';
  else if (has(text, 'formal', 'acara', 'pesta', 'night out')) occasion = 'formal_evening';
  else if (has(text, 'kencan', 'date', 'dating')) occasion = 'casual_dating';
  else if (has(text, 'kantor', 'kerja', 'sehari hari', 'daily')) occasion = 'daily_office';
  else if (has(text, 'malam')) occasion = 'formal_evening';

  let longevity: CuratorIntents['longevity'] = null;
  if (has(text, 'tahan lama', 'seharian', 'sehari penuh', 'awet', 'long lasting', 'long-lasting')) longevity = 'long';
  else if (has(text, 'sedang', '6 jam', '6-8')) longevity = 'moderate';
  else if (has(text, 'ringan', 'sebentar', 'cepat hilang', '2 jam')) longevity = 'light';

  return {
    families,
    climate,
    occasion,
    longevity,
    mentionsRain: has(text, 'hujan', 'gerimis', 'rain', 'rainy'),
    mentionsCalm: has(text, 'tenang', 'calm', 'lembut', 'soft', 'adem', 'santai'),
    mentionsSweet: has(text, 'manis', 'sweet', 'gula'),
  };
}

const CLIMATE_INPUT_LABEL: Record<string, LocalizedText> = {
  outdoor_hot: { id: 'Panas terik luar ruangan', en: 'Hot outdoor sun' },
  indoor_ac: { id: 'Ruangan ber-AC', en: 'Air-conditioned indoors' },
  evening_cool: { id: 'Malam yang sejuk', en: 'Cool evening' },
};

const OCCASION_INPUT_LABEL: Record<string, LocalizedText> = {
  daily_office: { id: 'Kantor / sehari-hari', en: 'Office / daily' },
  casual_dating: { id: 'Kencan santai', en: 'Casual date' },
  formal_evening: { id: 'Formal / malam', en: 'Formal / evening' },
  outdoor_sport: { id: 'Olahraga luar ruangan', en: 'Outdoor sport' },
};

const LONGEVITY_INPUT_LABEL: Record<string, LocalizedText> = {
  light: { id: 'Ringan', en: 'Light' },
  moderate: { id: 'Sedang', en: 'Moderate' },
  long: { id: 'Sehari penuh', en: 'A full day' },
};

/**
 * Membangun penjelasan tervalidasi dari pertanyaan + jawaban Finder yang
 * tersimpan. TIDAK PERNAH mengarang skor, produk, atau dimensi.
 *
 * - Ada jawaban Finder tersimpan → headline + alasan dari hasil Finder
 *   yang sebenarnya (top match + sitasi per-dimensi + mismatch terlemah).
 * - Belum ada jawaban → TIDAK ADA produk dan skor; jawaban hanya
 *   menyarankan input Finder untuk dicoba, dengan alasan berupa definisi
 *   dimensi + bobotnya (fakta sistem skor, bukan selera).
 * - Pertanyaan tanpa maksud yang dikenali → pandu ke 6 dimensi Finder.
 */
export function buildValidatedExplanation(
  question: string,
  answers: ScentQuizAnswers,
  hasRealAnswers: boolean,
): ValidatedExplanation {
  const intents = parseCuratorQuestion(question);
  const honestyNotes: LocalizedText[] = [];
  if (intents.mentionsRain) honestyNotes.push(RAIN_HONESTY);

  const finderInputs: CuratorFinderInput[] = [];
  const pushInput = (dimension: CuratorDimension, value: string, label: LocalizedText) => {
    if (!finderInputs.some(i => i.dimension === dimension && i.value === value)) {
      finderInputs.push({ dimension, value, ...label });
    }
  };

  // Saran input Finder dari maksud pertanyaan (navigasi saja — kurator
  // tidak pernah menulis jawaban Finder pengguna).
  for (const f of intents.families) {
    pushInput('notesFamily', f, FAMILY_LABELS[f] ?? { id: f, en: f });
  }
  if (intents.climate) pushInput('climate', intents.climate, CLIMATE_INPUT_LABEL[intents.climate]);
  if (intents.occasion) pushInput('occasion', intents.occasion, OCCASION_INPUT_LABEL[intents.occasion]);
  if (intents.longevity) pushInput('longevity', intents.longevity, LONGEVITY_INPUT_LABEL[intents.longevity]);
  // Hujan: sarankan iklim terdekat (evening_cool) — dengan catatan
  // kejujuran di atas, bukan sebagai pemetaan.
  if (intents.mentionsRain && !intents.climate) {
    pushInput('climate', 'evening_cool', CLIMATE_INPUT_LABEL.evening_cool);
  }

  const matchedAnything =
    intents.families.length > 0 ||
    intents.climate !== null ||
    intents.occasion !== null ||
    intents.longevity !== null ||
    // Hujan saja sudah cukup sebagai maksud: sarannya iklim terdekat.
    intents.mentionsRain;

  if (!hasRealAnswers) {
    honestyNotes.push(NO_SCORE_HONESTY);
    const reasons: LocalizedText[] = [];
    for (const input of finderInputs) {
      const weight = CURATOR_DIMENSION_WEIGHTS[input.dimension];
      const dim = DIMENSION_LABELS[input.dimension];
      reasons.push({
        id: `${dim.id} (bobot ${weight} dari 100) — pilihanmu di sini menentukan seberapa besar dimensi ini memengaruhi skor Finder.`,
        en: `${dim.en} (weight ${weight} of 100) — your choice here decides how much this dimension shapes the Finder score.`,
      });
    }
    if (!matchedAnything) {
      return {
        headline: {
          id: 'Kurator hanya memandu lewat 6 dimensi Finder — keluarga, iklim, suasana, ketahanan, gender, dan anggaran. Coba tanya soal salah satunya, atau isi Finder dulu.',
          en: 'The curator only guides through Finder’s 6 dimensions — family, climate, occasion, longevity, gender, and budget. Try asking about one of them, or fill in Finder first.',
        },
        reasons,
        finderInputs: [],
        honestyNotes,
        topMatch: null,
      };
    }
    return {
      headline: {
        id: 'Coba jawab hal-hal ini di Finder — Finder yang akan menghitung kecocokannya, bukan kurator.',
        en: 'Try answering these in Finder — Finder calculates the match, not the curator.',
      },
      reasons,
      finderInputs,
      honestyNotes,
      topMatch: null,
    };
  }

  // ── Ada jawaban Finder tersimpan: semua angka/alasan dari mesin skor. ──
  const ranked = rankRecommendations(PUBLISHED_PERFUMES, answers);
  const top = ranked[0];
  const topDetail = top;
  const reasons: LocalizedText[] = [];
  for (const b of topDetail.whyFitsBulletsId.slice(0, 2)) {
    const idx = topDetail.whyFitsBulletsId.indexOf(b);
    reasons.push({ id: b, en: topDetail.whyFitsBulletsEn[idx] ?? b });
  }
  // Sitasi per-dimensi untuk maksud yang ditanyakan (data nyata).
  const rowByKey = new Map(topDetail.breakdownRows.map(r => [r.key, r]));
  const addCitation = (key: 'notesFamily' | 'climate' | 'occasion' | 'longevity') => {
    const row = rowByKey.get(key);
    if (row && !row.isNoData && row.fit !== null && reasons.length < 4) {
      if (!reasons.some(r => r.id === row.citationId)) {
        reasons.push({ id: row.citationId, en: row.citationEn });
      }
    }
  };
  if (intents.families.length > 0) addCitation('notesFamily');
  if (intents.climate !== null || intents.mentionsRain) addCitation('climate');
  if (intents.occasion !== null) addCitation('occasion');
  if (intents.longevity !== null) addCitation('longevity');
  if (reasons.length === 0) {
    reasons.push({
      id: 'Finder menghitung kecocokan dari 6 dimensi — lihat rincian tiap skor di layar hasil Finder.',
      en: 'Finder calculates the match from 6 dimensions — see each score’s breakdown on the Finder results screen.',
    });
  }
  // Kejujuran: dimensi terlemah dari hasil Finder yang sebenarnya.
  if (topDetail.possibleMismatchId) {
    honestyNotes.push({
      id: `Yang perlu diperhatikan: ${topDetail.possibleMismatchId}`,
      en: `Worth noting: ${topDetail.possibleMismatchEn}`,
    });
  }

  return {
    headline: {
      id: `Berdasarkan jawaban Findermu, ${top.perfume.brand} ${top.perfume.name} cocok ${top.matchScore}%.`,
      en: `Based on your Finder answers, ${top.perfume.brand} ${top.perfume.name} matches ${top.matchScore}%.`,
    },
    reasons,
    // Saran input hanya untuk maksud yang BELUM dinyatakan di jawaban
    // tersimpan (yang sudah dinyatakan tidak perlu disarankan lagi).
    finderInputs: finderInputs.filter(i => {
      if (i.dimension === 'notesFamily') return !answers.preferredFamilies.includes(i.value);
      if (i.dimension === 'climate') return answers.climateSetting === 'flexible';
      if (i.dimension === 'occasion') return answers.occasionSetting === 'flexible';
      if (i.dimension === 'longevity') return answers.longevityExpectation === 'not_sure';
      return true;
    }),
    honestyNotes,
    topMatch: {
      perfumeId: top.perfume.id,
      brand: top.perfume.brand,
      name: top.perfume.name,
      score: top.matchScore,
    },
  };
}

/** Merender penjelasan tervalidasi menjadi teks polos (tampil + input LLM). */
export function renderValidatedExplanationText(
  explanation: ValidatedExplanation,
  locale: 'id' | 'en',
): string {
  const pick = (t: LocalizedText) => (locale === 'id' ? t.id : t.en);
  const lines: string[] = [pick(explanation.headline)];
  for (const r of explanation.reasons) lines.push(`• ${pick(r)}`);
  if (explanation.finderInputs.length > 0) {
    lines.push(
      locale === 'id'
        ? `Coba di Finder: ${explanation.finderInputs.map(i => pick(i)).join(', ')}.`
        : `Try in Finder: ${explanation.finderInputs.map(i => pick(i)).join(', ')}.`,
    );
  }
  for (const n of explanation.honestyNotes) lines.push(`Catatan: ${pick(n)}`);
  return lines.join('\n');
}

// ══════════════════════════════════════════════════════════════════════
// GEMINI REPHRASE (BR-10) — wiring Fase N8, kunci belakangan.
// ══════════════════════════════════════════════════════════════════════
//
// Keputusan founder 28 Nov 2026 09:27 WIB: sumber jawaban = LLM rephrase
// penjelasan tervalidasi (BR-10). Keputusan 09:29 WIB: bangun dulu,
// kunci belakangan — jadi flag di bawah TETAP false: tidak ada kunci
// Gemini di repo, tidak ada endpoint yang dipanggil, dan layar
// menampilkan penjelasan tervalidasi apa adanya dengan label jujur.
// Saat founder siap, ia memberi kunci via Secure Vault → kunci dipasang
// sebagai env var Vercel VITE_GEMINI_API_KEY → flag ini diubah true di
// PR tersendiri (bukan diam-diam). Server-side (Firebase Functions)
// butuh Blaze yang sengaja ditunda 25 Nov 2026 — jalur client-side di
// sini memakai kunci yang dibatasi referrer senstoria.app.
//
// LLM HANYA me-rephrase: instruksi di bawah melarang menambah fakta,
// produk, skor, harga, atau rekomendasi, dan melarang menghapus alasan
// atau catatan kejujuran. Bila panggilan gagal / kosong, layar memakai
// penjelasan tervalidasi asli (fallback jujur, bukan jawaban karangan).
// ══════════════════════════════════════════════════════════════════════

/** Flag rephrase LLM — TETAP false sampai kunci Gemini tersedia. */
export const AI_GEMINI_REPHRASE_ENABLED = false;

/** Model Gemini untuk rephrase (REST v1beta, tanpa dependensi baru). */
export const GEMINI_MODEL = 'gemini-2.0-flash';

export function getGeminiApiKey(): string | null {
  try {
    const key = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_GEMINI_API_KEY;
    return typeof key === 'string' && key.length > 0 ? key : null;
  } catch {
    return null;
  }
}

const REPHRASE_INSTRUCTION: Record<'id' | 'en', string> = {
  id: 'Tulis ulang penjelasan berikut dengan kata-katamu sendiri, dalam Bahasa Indonesia. Ubah HANYA kata-katanya — jangan tambah fakta, produk, skor, harga, atau rekomendasi apa pun, dan jangan hapus alasan atau catatan apa pun. Pertahankan semua angka persis seperti aslinya.',
  en: 'Rewrite the following explanation in your own words, in English. Change ONLY the wording — do not add any facts, products, scores, prices, or recommendations, and do not remove any reason or note. Keep every number exactly as written.',
};

export type RephraseResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'disabled' | 'no_key' | 'request_failed' | 'empty_response' };

/**
 * Meminta Gemini me-rephrase SATU penjelasan tervalidasi. `fetchFn`
 * disuntik supaya bisa dites di node:test (fetch global tidak ada di
 * sana). Tidak pernah dipanggil saat flag mati atau kunci tidak ada.
 */
export async function rephraseValidatedExplanation(
  validatedText: string,
  opts: {
    locale?: 'id' | 'en';
    apiKey?: string | null;
    fetchFn?: typeof fetch;
    enabled?: boolean;
  } = {},
): Promise<RephraseResult> {
  const enabled = opts.enabled ?? AI_GEMINI_REPHRASE_ENABLED;
  if (!enabled) return { ok: false, reason: 'disabled' };
  const apiKey = opts.apiKey ?? getGeminiApiKey();
  if (!apiKey) return { ok: false, reason: 'no_key' };
  const fetchFn = opts.fetchFn ?? globalThis.fetch;
  if (typeof fetchFn !== 'function') return { ok: false, reason: 'request_failed' };

  const locale = opts.locale ?? 'id';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  let res: Response;
  try {
    res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `${REPHRASE_INSTRUCTION[locale]}\n\n${validatedText}` }] },
        ],
      }),
    });
  } catch {
    return { ok: false, reason: 'request_failed' };
  }
  if (!res.ok) return { ok: false, reason: 'request_failed' };
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: 'request_failed' };
  }
  const text =
    (data as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
      ?.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
  if (!text.trim()) return { ok: false, reason: 'empty_response' };
  return { ok: true, text: text.trim() };
}
