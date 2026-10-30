import React, { useEffect } from 'react';
import { translations, Locale } from '../lib/i18n.ts';

export type LegalPageTab = 'privacy' | 'terms' | 'affiliate' | 'faq';

interface LegalPageProps {
  tab: LegalPageTab;
  locale: Locale;
  onTabChange: (tab: LegalPageTab) => void;
  onBack: () => void;
}

interface Section {
  heading: string;
  body: string;
}

/**
 * Sprint 4 — public legal pages as real routes (/legal/privacy, /legal/terms,
 * /legal/affiliate, /legal/faq). Content is adapted from the LegalModal copy
 * with editorial review: the "community stories" framing is dropped (Journal
 * is private), the affiliate page states the no-pay-to-rank rule, and the FAQ
 * is new. No login required. Strings live in i18n.ts (legalPage section).
 */
export const LegalPage: React.FC<LegalPageProps> = ({ tab, locale, onTabChange, onBack }) => {
  const t = translations[locale].legalPage;

  const tabs: { id: LegalPageTab; label: string }[] = [
    { id: 'privacy', label: t.tabPrivacy },
    { id: 'terms', label: t.tabTerms },
    { id: 'affiliate', label: t.tabAffiliate },
    { id: 'faq', label: t.tabFaq }
  ];

  const sections: Record<LegalPageTab, { title: string; intro: string; items: Section[] }> = {
    privacy: {
      title: t.privacyTitle,
      intro: t.privacyIntro,
      items: [
        { heading: t.privacyS1H, body: t.privacyS1B },
        { heading: t.privacyS2H, body: t.privacyS2B },
        { heading: t.privacyS3H, body: t.privacyS3B },
        { heading: t.privacyS4H, body: t.privacyS4B }
      ]
    },
    terms: {
      title: t.termsTitle,
      intro: t.termsIntro,
      items: [
        { heading: t.termsS1H, body: t.termsS1B },
        { heading: t.termsS2H, body: t.termsS2B },
        { heading: t.termsS3H, body: t.termsS3B },
        { heading: t.termsS4H, body: t.termsS4B }
      ]
    },
    affiliate: {
      title: t.affiliateTitle,
      intro: t.affiliateIntro,
      items: [
        { heading: t.affiliateS1H, body: t.affiliateS1B },
        { heading: t.affiliateS2H, body: t.affiliateS2B },
        { heading: t.affiliateS3H, body: t.affiliateS3B }
      ]
    },
    faq: {
      title: t.faqTitle,
      intro: t.faqIntro,
      items: [
        { heading: t.faqQ1, body: t.faqA1 },
        { heading: t.faqQ2, body: t.faqA2 },
        { heading: t.faqQ3, body: t.faqA3 },
        { heading: t.faqQ4, body: t.faqA4 },
        { heading: t.faqQ5, body: t.faqA5 },
        { heading: t.faqQ6, body: t.faqA6 },
        { heading: t.faqQ7, body: t.faqA7 }
      ]
    }
  };

  const current = sections[tab];

  useEffect(() => {
    document.title = `${current.title} — Senstoria`;
  }, [current.title]);

  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-hairline pb-6">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-secondary hover:text-ink underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden"
        >
          {t.backHome}
        </button>
        <h1 className="font-serif text-3xl md:text-4xl text-bar font-normal leading-tight">
          {current.title}
        </h1>
        <p className="text-sm text-secondary max-w-2xl leading-relaxed">{current.intro}</p>
      </div>

      <div className="flex border-b border-hairline text-xs overflow-x-auto gap-2">
        {tabs.map(tb => {
          const isActive = tab === tb.id;
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => onTabChange(tb.id)}
              className={`pb-2.5 pt-1 px-3 font-medium border-b-2 transition whitespace-nowrap ${
                isActive ? 'border-ink text-ink' : 'border-transparent text-secondary hover:text-ink'
              }`}
            >
              {tb.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6 max-w-2xl">
        {current.items.map((item, idx) => (
          <section key={idx} className="space-y-2">
            <h2 className="font-sans font-medium text-base text-ink">{item.heading}</h2>
            <p className="text-sm text-bar leading-relaxed">{item.body}</p>
          </section>
        ))}
      </div>

      <p className="text-xs text-secondary font-mono">Senstoria v1.0 · UU PDP Compliant</p>
    </div>
  );
};
