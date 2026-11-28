// Fase N13 (P11) — halaman publik satu cerita yang dibagikan: /s/<token>.
// TANPA header akun, TANPA tab bar, TANPA navigasi ke Jurnal pemilik,
// TANPA komentar/like/pengikut (B4 ditolak). Pembaca tidak butuh akun.
// Token tidak ditemukan / dicabut → halaman jujur, bukan redirect diam-diam.
import React, { useEffect, useState } from 'react';
import { Flag, ArrowLeft } from 'lucide-react';
import { fetchSharedStoryByToken, isFirebaseConfigured, reportSharedStory } from '../lib/firebase.ts';
import { isShareToken } from '../lib/storySharingN13.ts';
import type { SharedStoryDoc } from '../lib/storySharingN13.ts';
import { Locale, translations, formatCheckedDate, fmt } from '../lib/i18n.ts';

interface SharedStoryViewProps {
  token: string;
  locale: Locale;
  onBackHome: () => void;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; doc: SharedStoryDoc }
  | { kind: 'not-found' }
  | { kind: 'revoked' }
  | { kind: 'error' };

export function SharedStoryView({ token, locale, onBackHome }: SharedStoryViewProps) {
  const t = translations[locale].sharedStoryView;
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [confirmingReport, setConfirmingReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportFailed, setReportFailed] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Token bentuknya bukan token sah → "tidak ditemukan" langsung,
    // tanpa menyentuh backend (tautan rusak, bukan cerita yang hilang).
    if (!isShareToken(token)) {
      setState({ kind: 'not-found' });
      return;
    }
    // Backend belum terkonfigurasi → jangan berbohong "tidak ditemukan":
    // tampilkan panel error yang jujur.
    if (!isFirebaseConfigured) {
      setState({ kind: 'error' });
      return;
    }
    setState({ kind: 'loading' });
    fetchSharedStoryByToken(token).then(doc => {
      if (cancelled) return;
      if (!doc) setState({ kind: 'not-found' });
      else if (doc.revoked) setState({ kind: 'revoked' });
      else setState({ kind: 'ready', doc });
    });
    return () => { cancelled = true; };
  }, [token]);

  const handleReport = async () => {
    if (reporting || reportDone) return;
    setReporting(true);
    const ok = await reportSharedStory(token);
    setReporting(false);
    if (ok) {
      setReportDone(true);
      setConfirmingReport(false);
    } else {
      setReportFailed(true);
    }
  };

  // ——— Panel keadaan (loading / tidak ditemukan / dicabut / error) ———
  if (state.kind !== 'ready') {
    const panel =
      state.kind === 'loading'
        ? { testid: 'shared-story-loading', title: t.loading, body: '' }
        : state.kind === 'not-found'
          ? { testid: 'shared-story-not-found', title: t.notFoundTitle, body: t.notFoundBody }
          : state.kind === 'revoked'
            ? { testid: 'shared-story-revoked', title: t.revokedTitle, body: t.revokedBody }
            : { testid: 'shared-story-error', title: t.loadErrorTitle, body: t.loadErrorBody };
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 space-y-6 text-center">
        <p className="font-display text-[20px] text-ink">Senstoria</p>
        <div data-testid={panel.testid} className="space-y-3 border border-hairline bg-card p-8">
          <h1 className="font-display text-[24px] leading-[30px] text-ink">{panel.title}</h1>
          {panel.body && <p className="text-[14px] leading-[20px] text-secondary">{panel.body}</p>}
        </div>
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex min-h-[44px] items-center gap-2 px-5 text-[14px] font-medium text-ink underline underline-offset-4 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t.backHome}
        </button>
      </div>
    );
  }

  const { doc } = state;
  const author = doc.display_name ? fmt(t.byAuthor, doc.display_name) : t.byAnonymous;
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 space-y-8">
      <p className="text-center font-display text-[20px] text-ink">Senstoria</p>

      <article data-testid="shared-story-screen" className="space-y-5 border border-hairline bg-card p-6 md:p-10">
        <div className="space-y-1 border-b border-hairline pb-4">
          <p className="label-caption">{t.kicker}</p>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink">
            {doc.perfume_brand} · {doc.perfume_name}
          </p>
          <p className="text-[12px] text-secondary font-mono">
            {formatCheckedDate(doc.story_date, locale)} · {author}
          </p>
        </div>

        {doc.title && (
          <h1 className="font-display text-[24px] md:text-[30px] leading-[32px] md:leading-[38px] font-normal text-ink">
            {doc.title}
          </h1>
        )}

        <p className="text-[16px] md:text-[18px] leading-[1.75] text-bar font-display whitespace-pre-line">
          {doc.body}
        </p>

        <p className="border-t border-hairline pt-4 text-[13px] leading-[18px] text-secondary">
          {t.honestyNote}
        </p>
      </article>

      <div className="space-y-3 text-center">
        {reportDone ? (
          <p data-testid="shared-story-report-done" className="text-[14px] font-medium text-ink" role="status">
            {t.reportReceived}
          </p>
        ) : confirmingReport ? (
          <div data-testid="shared-story-report-confirm" className="space-y-3 border border-hairline bg-card p-5">
            <p className="text-[14px] font-medium text-ink">{t.reportConfirmTitle}</p>
            <p className="text-[13px] leading-[18px] text-secondary">{t.reportConfirmBody}</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={reporting}
                onClick={handleReport}
                className="min-h-[44px] px-5 bg-bar text-paper text-[14px] font-medium rounded-full disabled:opacity-50"
              >
                {t.reportConfirm}
              </button>
              <button
                type="button"
                onClick={() => { setConfirmingReport(false); setReportFailed(false); }}
                className="min-h-[44px] px-5 text-[14px] font-medium text-ink underline underline-offset-4"
              >
                {translations[locale].shareStory.cancel}
              </button>
            </div>
            {reportFailed && (
              <p className="text-[13px] text-error" role="alert">{t.reportFailed}</p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setConfirmingReport(true); setReportFailed(false); }}
            className="inline-flex min-h-[44px] items-center gap-2 px-4 text-[13px] font-medium text-secondary hover:text-ink underline underline-offset-4 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Flag className="w-4 h-4" aria-hidden="true" />
            {t.reportButton}
          </button>
        )}

        <div>
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex min-h-[44px] items-center gap-2 px-5 text-[14px] font-medium text-ink underline underline-offset-4 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t.backHome}
          </button>
        </div>
      </div>
    </div>
  );
}
