import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { translations } from './i18n';
import {
  DEFAULT_QUIZ_ANSWERS,
  calculateMatchScore,
  type ScentQuizAnswers,
} from './scentScoring';
import { PUBLISHED_PERFUMES } from '../data/seedPerfumes';
import {
  AI_GEMINI_REPHRASE_ENABLED,
  NO_SCORE_HONESTY,
  RAIN_HONESTY,
  buildValidatedExplanation,
  parseCuratorQuestion,
  renderValidatedExplanationText,
  rephraseValidatedExplanation,
} from './curatorN8';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appSrc = readFileSync(path.join(__dirname, '../App.tsx'), 'utf-8');
const finderSrc = readFileSync(path.join(__dirname, '../components/ScentFinderView.tsx'), 'utf-8');

/** Jawaban Finder nyata (bukan default) untuk tes mode "ada jawaban". */
const REAL_ANSWERS: ScentQuizAnswers = {
  preferredFamilies: ['Woody'],
  climateSetting: 'evening_cool',
  occasionSetting: 'flexible',
  longevityExpectation: 'long',
  genderPreference: 'any',
  budgetTier: 'flexible',
  avoidNotesOrTraits: ['none'],
};

describe('Fase N8 — Tanya Kurator (G10 + P5)', () => {
  it('App: rute /tanya-kurator terdaftar di map fitur DAN regex parseFeaturePath', () => {
    assert.ok(
      appSrc.includes("curator: '/tanya-kurator'"),
      'FEATURE_ROUTE_BY_VIEW harus memuat curator → /tanya-kurator',
    );
    assert.ok(
      appSrc.includes("'tanya-kurator': 'curator'"),
      'FEATURE_VIEW_BY_ROUTE harus memuat tanya-kurator → curator',
    );
    const regexLine = appSrc.split('\n').find(l => l.includes('parseFeaturePath') && l.includes('match'));
    // Baris regex-nya sendiri: cari lewat alternation fitur (ada beberapa
    // window.location.pathname.match lain di App — auth/legal/katalog).
    const regexSrc = appSrc.split('\n').find(l => l.includes('library|journal|finder'));
    assert.ok(
      regexSrc && regexSrc.includes('tanya-kurator'),
      'regex parseFeaturePath harus memuat tanya-kurator (tanpanya deep link /tanya-kurator jatuh ke Beranda)',
    );
    assert.ok(regexLine !== undefined || regexSrc !== undefined, 'parseFeaturePath harus ada');
  });

  it('App: layar curator di-render + entry point dari Home dan Finder', () => {
    assert.ok(appSrc.includes("view === 'curator'"), 'App harus me-render CuratorView saat view curator');
    assert.ok(appSrc.includes("setView('curator')"), 'App harus punya navigasi ke curator');
    assert.ok(
      appSrc.includes('onNavigateToCurator'),
      'Finder harus menerima prop onNavigateToCurator',
    );
    assert.ok(
      finderSrc.includes('onNavigateToCurator'),
      'ScentFinderView harus memakai onNavigateToCurator',
    );
  });

  it('parse: hujan dikenali tapi BUKAN dimensi; kayu manis → Ambery, bukan Woody', () => {
    const q = parseCuratorQuestion('Aroma apa yang tenang untuk hari hujan?');
    assert.equal(q.mentionsRain, true);
    assert.equal(q.mentionsCalm, true);
    assert.equal(q.climate, null, 'hujan tidak boleh menjadi nilai climate');
    assert.equal(q.occasion, null, 'hujan tidak boleh menjadi nilai occasion');
    assert.equal(parseCuratorQuestion('kayu manis dan rempah').families[0], 'Ambery');
    assert.ok(!parseCuratorQuestion('kayu manis').families.includes('Woody'));
    assert.ok(parseCuratorQuestion('cedar dan sandalwood').families.includes('Woody'));
  });

  it('parse: sehari penuh → longevity long; malam → evening_cool + formal_evening', () => {
    const q = parseCuratorQuestion('yang tahan sehari penuh untuk malam yang sejuk');
    assert.equal(q.longevity, 'long');
    assert.equal(q.climate, 'evening_cool');
    assert.equal(q.occasion, 'formal_evening');
  });

  it('jawaban tanpa jawaban Finder: tanpa produk, tanpa skor, jujur soal hujan', () => {
    const expl = buildValidatedExplanation(
      'Aroma Woody apa yang tenang untuk hari hujan?',
      DEFAULT_QUIZ_ANSWERS,
      false,
    );
    assert.equal(expl.topMatch, null);
    const text = renderValidatedExplanationText(expl, 'id');
    assert.ok(!text.includes('%'), 'tanpa jawaban Finder tidak boleh ada skor persen');
    assert.ok(!text.includes('The Perfection') && !text.includes('Enchantée'), 'tanpa jawaban Finder tidak boleh ada nama produk');
    assert.ok(text.includes(NO_SCORE_HONESTY.id), 'harus jujur: belum ada skor');
    assert.ok(text.includes(RAIN_HONESTY.id), 'harus jujur: Finder tidak punya hujan');
    assert.ok(
      expl.finderInputs.some(i => i.dimension === 'climate' && i.value === 'evening_cool'),
      'hujan menyarankan iklim terdekat evening_cool (bukan pemetaan)',
    );
    assert.ok(
      !expl.finderInputs.some(i => i.value === 'rainy' || i.value === 'hujan'),
      'tidak boleh ada input Finder bernama hujan',
    );
    assert.ok(
      expl.finderInputs.some(i => i.dimension === 'notesFamily' && i.value === 'Woody'),
      'Woody dari pertanyaan harus jadi saran input Finder',
    );
  });

  it('jawaban dengan jawaban Finder: skor = skor Finder yang sebenarnya', () => {
    const expl = buildValidatedExplanation('yang Woody dan tahan lama?', REAL_ANSWERS, true);
    assert.ok(expl.topMatch !== null, 'ada jawaban → ada top match Finder');
    const expected = PUBLISHED_PERFUMES.map(p => calculateMatchScore(p, REAL_ANSWERS)).sort(
      (a, b) => b.matchScore - a.matchScore,
    )[0];
    assert.equal(expl.topMatch!.perfumeId, expected.perfume.id);
    assert.equal(expl.topMatch!.score, expected.matchScore, 'skor kurator harus sama dengan skor Finder');
    const text = renderValidatedExplanationText(expl, 'id');
    assert.ok(text.includes(`${expected.matchScore}%`), 'skor Finder tampil apa adanya');
    assert.ok(expl.reasons.length >= 1, 'alasan dari mesin skor harus ada');
  });

  it('jawaban tanpa maksud yang dikenali: pandu ke 6 dimensi, tanpa karangan', () => {
    const expl = buildValidatedExplanation('halo', DEFAULT_QUIZ_ANSWERS, false);
    assert.equal(expl.topMatch, null);
    assert.equal(expl.finderInputs.length, 0);
    const text = renderValidatedExplanationText(expl, 'id');
    assert.ok(text.includes('6 dimensi'), 'fallback menyebut 6 dimensi Finder');
    assert.ok(!text.includes('%'), 'fallback tidak boleh mengarang skor');
  });

  it('i18n: namespace curatorView lengkap ID + EN', () => {
    for (const locale of ['id', 'en'] as const) {
      const v = translations[locale].curatorView;
      for (const key of [
        'title',
        'intro',
        'inputPlaceholder',
        'send',
        'you',
        'curator',
        'exampleLabel',
        'openFinder',
        'viewDetail',
        'validatedLabel',
        'rephrasedLabel',
        'exampleQuestion',
        'exampleHeadline',
        'exampleGuidance',
        'exampleRainNote',
        'askCuratorLink',
      ] as const) {
        assert.ok(typeof v[key] === 'string' && v[key].length > 0, `curatorView.${key} harus ada di ${locale}`);
      }
    }
    assert.ok(translations.id.curatorView.inputPlaceholder.includes('Tanya soal aroma'));
    assert.ok(translations.en.curatorView.inputPlaceholder.includes('Ask about scent'));
  });

  it('flag rephrase LLM TETAP false; tanpa flag/kunci tidak ada panggilan', async () => {
    assert.equal(AI_GEMINI_REPHRASE_ENABLED, false, 'flag ai_gemini_rephrase harus false sampai kunci tersedia');
    const disabled = await rephraseValidatedExplanation('teks tervalidasi');
    assert.deepEqual(disabled, { ok: false, reason: 'disabled' });
    let fetched = false;
    const noKey = await rephraseValidatedExplanation('teks tervalidasi', {
      enabled: true,
      fetchFn: (() => {
        fetched = true;
        return Promise.resolve(new Response('{}'));
      }) as unknown as typeof fetch,
    });
    assert.deepEqual(noKey, { ok: false, reason: 'no_key' });
    assert.equal(fetched, false, 'tanpa kunci tidak boleh ada fetch ke Gemini');
  });

  it('rephrase: prompt hanya me-rephrase (larang tambah fakta) + fallback saat gagal', async () => {
    let sentBody = '';
    const stubFetch = (async (_url: string, init: { body?: string }) => {
      sentBody = init.body ?? '';
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Penjelasan yang ditulis ulang.' }] } }],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;
    const ok = await rephraseValidatedExplanation('Penjelasan ASLI dengan skor 82%.', {
      enabled: true,
      apiKey: 'kunci-palsu-untuk-tes',
      fetchFn: stubFetch,
    });
    assert.deepEqual(ok, { ok: true, text: 'Penjelasan yang ditulis ulang.' });
    assert.ok(sentBody.includes('Penjelasan ASLI dengan skor 82%.'), 'teks tervalidasi harus dikirim apa adanya');
    assert.ok(sentBody.includes('jangan tambah fakta'), 'instruksi harus melarang tambah fakta (ID)');

    const failingFetch = (async () => new Response('{}', { status: 500 })) as unknown as typeof fetch;
    const failed = await rephraseValidatedExplanation('teks', {
      enabled: true,
      apiKey: 'kunci-palsu-untuk-tes',
      fetchFn: failingFetch,
    });
    assert.deepEqual(failed, { ok: false, reason: 'request_failed' });

    const emptyFetch = (async () =>
      new Response(JSON.stringify({ candidates: [] }), { status: 200 })) as unknown as typeof fetch;
    const empty = await rephraseValidatedExplanation('teks', {
      enabled: true,
      apiKey: 'kunci-palsu-untuk-tes',
      fetchFn: emptyFetch,
    });
    assert.deepEqual(empty, { ok: false, reason: 'empty_response' });
  });

  it('App: komentar flag ai_gemini_rephrase menunjuk wiring N8 di curatorN8.ts', () => {
    assert.ok(
      appSrc.includes('curatorN8'),
      'komentar flag di App.tsx harus menunjuk wiring N8 (curatorN8.ts)',
    );
  });
});
