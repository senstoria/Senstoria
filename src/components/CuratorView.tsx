import React, { useEffect, useRef, useState } from 'react';
import { translations, type Locale } from '../lib/i18n.ts';
import {
  AI_GEMINI_REPHRASE_ENABLED,
  buildValidatedExplanation,
  getGeminiApiKey,
  renderValidatedExplanationText,
  rephraseValidatedExplanation,
  type ValidatedExplanation,
} from '../lib/curatorN8.ts';
import { readSavedQuizAnswers } from '../lib/scentScoring.ts';

interface CuratorMessage {
  id: number;
  role: 'user' | 'curator';
  text: string;
  /** Label meta di bawah pesan (mis. "Kurator · penjelasan tervalidasi"). */
  meta: string;
  isExample?: boolean;
  explanation?: ValidatedExplanation;
  /** True bila teks jawaban sudah di-rephrase LLM (tampil apa adanya). */
  rephrased?: boolean;
}

interface CuratorViewProps {
  locale: Locale;
  onBack: () => void;
  onNavigateToFinder: () => void;
  onSelectPerfume: (perfumeId: string) => void;
}

/**
 * Fase N8 (G10 + P5) — Tanya Kurator.
 *
 * Pola mockup 06-tanya-kurator.html (skor 4/5): header kembali + h1,
 * intro batas pemandu-vs-pemilih, gelembung tanya (kanan, hitam) dan
 * jawab (kiri, gray-100), satu baris tanya + tombol Kirim.
 *
 * Yang diubah dari mockup (konflik rencana-vs-kode, dilaporkan):
 * - Pertukaran CONTOH dikoreksi: mockup menulis suasana "hujan" sebagai
 *   input Finder, padahal Finder tidak punya dimensi hujan (preseden
 *   N7). Contoh memakai "malam yang sejuk" + catatan kejujuran hujan.
 * - Riwayat chat memakai scroll (mockup hanya satu pertukaran).
 * - Jawaban live BUKAN teks karangan: penjelasan tervalidasi dari
 *   mesin skor Finder (curatorN8.ts). Rephrase LLM hanya jalan bila
 *   flag AI_GEMINI_REPHRASE_ENABLED true + kunci ada — hari ini
 *   keduanya mati, jadi jawaban tampil apa adanya dengan label jujur.
 */
export const CuratorView: React.FC<CuratorViewProps> = ({
  locale,
  onBack,
  onNavigateToFinder,
  onSelectPerfume,
}) => {
  const t = translations[locale].curatorView;
  const [input, setInput] = useState('');
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [nextId, setNextId] = useState(3);
  const chatRef = useRef<HTMLDivElement>(null);

  const exampleUser: CuratorMessage = {
    id: 1,
    role: 'user',
    text: t.exampleQuestion,
    meta: `${t.you} · ${t.exampleLabel}`,
    isExample: true,
  };
  const exampleCurator: CuratorMessage = {
    id: 2,
    role: 'curator',
    text: `${t.exampleHeadline}\n\n${t.exampleGuidance}\n\nCatatan: ${t.exampleRainNote}`,
    meta: `${t.curator} · ${t.exampleLabel}`,
    isExample: true,
  };
  const [messages, setMessages] = useState<CuratorMessage[]>([exampleUser, exampleCurator]);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isRephrasing]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isRephrasing) return;
    setInput('');
    const userMsg: CuratorMessage = {
      id: nextId,
      role: 'user',
      text: question,
      meta: t.you,
    };
    setMessages(prev => [...prev, userMsg]);
    setNextId(id => id + 1);

    const { answers, hasRealAnswers } = readSavedQuizAnswers();
    const explanation = buildValidatedExplanation(question, answers, hasRealAnswers);
    let answerText = renderValidatedExplanationText(explanation, locale);
    let meta = `${t.curator} · ${t.validatedLabel}`;
    let rephrased = false;

    // Rephrase LLM (BR-10): hanya bila flag hidup + kunci ada. Hari ini
    // flag mati, jadi cabang ini tidak berjalan — jawaban tetap penjelasan
    // tervalidasi apa adanya. Gagal → fallback jujur ke teks asli.
    if (AI_GEMINI_REPHRASE_ENABLED && getGeminiApiKey()) {
      setIsRephrasing(true);
      try {
        const result = await rephraseValidatedExplanation(answerText, { locale });
        if (result.ok) {
          answerText = result.text;
          meta = `${t.curator} · ${t.rephrasedLabel}`;
          rephrased = true;
        }
      } finally {
        setIsRephrasing(false);
      }
    }

    const curatorMsg: CuratorMessage = {
      id: nextId + 1,
      role: 'curator',
      text: answerText,
      meta,
      explanation,
      rephrased,
    };
    setMessages(prev => [...prev, curatorMsg]);
    setNextId(id => id + 2);
  };

  return (
    <div data-testid="curator-screen" className="space-y-4 max-w-2xl mx-auto">
      {/* Header — pola mockup: kembali 44px + h1 28px */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.backLabel}
          className="w-11 h-11 shrink-0 flex items-center justify-center cursor-pointer rounded-full hover:bg-gray-100 transition active:scale-[0.97]"
        >
          <span aria-hidden="true" className="text-[28px] leading-none text-ink">‹</span>
        </button>
        <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.025em] text-ink">
          {t.title}
        </h1>
      </div>

      {/* Batas pemandu-vs-pemilih — rencana harfiah, di layar */}
      <p className="text-[14px] leading-[20px] text-secondary px-1">{t.intro}</p>

      {/* Riwayat chat — scroll saat implementasi (mockup hanya 1 pertukaran) */}
      <div
        ref={chatRef}
        data-testid="curator-chat"
        className="flex flex-col gap-4 px-1 py-2 max-h-[52vh] overflow-y-auto"
        aria-live="polite"
      >
        {messages.map(m => (
          <div key={m.id} className="space-y-2">
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[85%] ml-auto bg-ink text-white rounded-2xl rounded-br-sm px-4 py-3.5 text-[14px] leading-[20px]'
                  : 'max-w-[85%] bg-gray-100 text-ink rounded-2xl rounded-bl-sm px-4 py-3.5 text-[14px] leading-[20px]'
              }
            >
              <p className="whitespace-pre-line">
                {m.role === 'curator' && m.explanation && !m.rephrased ? (
                  <>
                    <strong>{m.explanation.headline[locale === 'id' ? 'id' : 'en']}</strong>
                    {m.explanation.reasons.map((r, i) => (
                      <span key={i} className="block mt-2">
                        • {r[locale === 'id' ? 'id' : 'en']}
                      </span>
                    ))}
                    {m.explanation.honestyNotes.map((n, i) => (
                      <span key={`n-${i}`} className="block mt-2 text-secondary">
                        Catatan: {n[locale === 'id' ? 'id' : 'en']}
                      </span>
                    ))}
                  </>
                ) : (
                  m.text
                )}
              </p>
              {m.role === 'curator' && m.explanation?.topMatch && (
                <button
                  type="button"
                  onClick={() => onSelectPerfume(m.explanation!.topMatch!.perfumeId)}
                  className="mt-3 w-full text-left bg-paper border border-hairline px-3 py-2.5 cursor-pointer hover:bg-surface transition"
                >
                  <span className="block text-[12px] text-secondary">
                    {locale === 'id' ? 'Hasil Finder untuk jawabanmu' : 'Finder result for your answers'}
                  </span>
                  <span className="block text-[14px] font-bold text-ink">
                    {m.explanation.topMatch.brand} {m.explanation.topMatch.name} — {m.explanation.topMatch.score}%
                  </span>
                  <span className="block text-[12px] font-semibold text-ink underline mt-0.5">
                    {t.viewDetail}
                  </span>
                </button>
              )}
              {m.role === 'curator' && m.explanation && m.explanation.finderInputs.length > 0 && (
                <button
                  type="button"
                  onClick={onNavigateToFinder}
                  className="mt-3 min-h-[44px] px-4 bg-bar hover:bg-ink text-paper text-[14px] font-semibold cursor-pointer rounded-full transition active:scale-[0.97]"
                >
                  {t.openFinder}
                </button>
              )}
            </div>
            <span
              className={`block text-[12px] text-secondary ${m.role === 'user' ? 'text-right' : ''}`}
            >
              {m.meta}
            </span>
          </div>
        ))}
        {isRephrasing && (
          <div className="max-w-[85%] bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3.5 text-[14px] text-secondary">
            …
          </div>
        )}
      </div>

      {/* Satu baris tanya + Kirim — pola mockup */}
      <div className="flex gap-2 px-1 pb-2">
        <input
          data-testid="curator-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') void handleSend();
          }}
          placeholder={t.inputPlaceholder}
          aria-label={t.inputLabel}
          className="flex-1 min-h-[48px] rounded-full border border-border bg-gray-100 px-4 text-[14px] text-ink placeholder:text-secondary outline-none focus:border-ink"
        />
        <button
          data-testid="curator-send"
          type="button"
          onClick={() => void handleSend()}
          disabled={input.trim().length === 0 || isRephrasing}
          className="flex-none min-h-[48px] min-w-[88px] px-5 rounded-full bg-ink text-white text-[14px] font-bold cursor-pointer transition active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t.send}
        </button>
      </div>

      {/* Label jujur status rephrase — flag mati + kunci belum ada */}
      {!AI_GEMINI_REPHRASE_ENABLED && (
        <p className="px-1 text-[12px] leading-[16px] text-secondary">
          {locale === 'id'
            ? 'Jawaban kurator adalah penjelasan tervalidasi dari Finder — rephrase LLM belum aktif karena kunci Gemini belum tersedia.'
            : 'Curator answers are validated explanations from Finder — LLM rephrasing is not active yet because no Gemini key is available.'}
        </p>
      )}
    </div>
  );
};
