import React from 'react';
import { translations, fmt, Locale } from '../lib/i18n.ts';
import { PUBLISHED_PERFUMES } from '../data/seedPerfumes.ts';

interface TryItFirstViewProps {
  locale: Locale;
  onSelectPerfume: (id: string) => void;
  onOpenWaitlist: (perfumeId: string) => void;
}

/**
 * Sprint 4 — Try It First page, waitlist ONLY, over PUBLISHED perfumes.
 * Deleted vs the old page: the Stage-2 decant shop (hard-coded
 * OFFICIAL_DECANTS with PRICES for draft rows, "100% keaslian terverifikasi"
 * / sterile-glass / 3-7-day-test value pillars for a service that does not
 * exist yet), the inline WhatsApp order form that recorded nothing, and the
 * fake "Tim akan mengabari" confirmation. The only action here opens the
 * waitlist modal, which writes to the waitlist backend. No prices anywhere
 * (D-04: Q13 undecided).
 */
export function TryItFirstView({ locale, onSelectPerfume, onOpenWaitlist }: TryItFirstViewProps) {
  const t = translations[locale].tryItFirstView;
  const perfumes = PUBLISHED_PERFUMES;

  const pillars = [
    { title: t.pillar1Title, body: t.pillar1Body },
    { title: t.pillar2Title, body: t.pillar2Body },
    { title: t.pillar3Title, body: t.pillar3Body },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-hairline pb-6">
        <p className="font-mono text-xs text-secondary uppercase">{t.kicker}</p>
        <h1 className="font-serif text-3xl md:text-4xl text-bar font-normal leading-tight">{t.title}</h1>
        <p className="text-sm text-secondary max-w-2xl leading-relaxed">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pillars.map(p => (
          <div key={p.title} className="p-4 bg-surface border border-hairline space-y-2">
            <p className="font-medium text-ink">{p.title}</p>
            <p className="text-sm text-secondary leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <p className="text-sm text-secondary">
          {perfumes.length === 0 ? t.emptyCatalog : fmt(t.publishedCount, String(perfumes.length))}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {perfumes.map(p => (
            <div key={p.id} className="p-4 bg-paper border border-hairline space-y-3">
              <div className="space-y-1">
                <p className="font-medium text-ink">{p.name}</p>
                <p className="text-xs text-secondary">{p.brand}</p>
                {p.top_notes && (
                  <p className="text-xs text-secondary">{t.notesLabel} {p.top_notes}</p>
                )}
                <p className="text-xs text-secondary">{t.priceNote}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSelectPerfume(p.id)}
                  className="px-4 py-2.5 border border-hairline hover:border-secondary text-sm transition min-h-[44px]"
                >
                  {t.detailButton}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenWaitlist(p.id)}
                  className="px-4 py-2.5 bg-bar hover:bg-ink text-paper text-sm font-medium transition min-h-[44px]"
                >
                  {t.joinButton}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
