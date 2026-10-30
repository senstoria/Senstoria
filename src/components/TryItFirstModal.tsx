import React, { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale, translations, fmt } from '../lib/i18n.ts';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { submitWaitlist, type WaitlistSizeMl, type WaitlistNotificationPref } from '../lib/waitlist.ts';

interface TryItFirstModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfume: SeedPerfume;
  userEmail?: string;
  locale: Locale;
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'sent' }
  | { kind: 'recorded_no_email' }
  | { kind: 'already' }
  | { kind: 'error'; message: string };

/**
 * Sprint 4 — Try It First modal, waitlist ONLY.
 * Deleted vs the old modal: the public feature-flag controller, the checkout
 * tab (shipping/payment forms, /api/shipping + /api/payment fetches with
 * flat/fabricated fallbacks, QR string + derived VA number, "Simulasikan
 * Pembayaran Lunas", simulation-confirmed invoice), fair-price estimates,
 * the willingness radio, and the fair-price slider. No prices anywhere
 * (D-04: Q13 undecided). Submits go to the waitlist Cloud Function; the UI
 * renders the honest emailSent outcome and never claims an email was sent
 * when it was not.
 */
export function TryItFirstModal({
  isOpen,
  onClose,
  perfume,
  userEmail = '',
  locale
}: TryItFirstModalProps) {
  const t = translations[locale].tryItFirstModal;
  const [sizeMl, setSizeMl] = useState<WaitlistSizeMl>(5);
  const [email, setEmail] = useState(userEmail);
  const [whatsapp, setWhatsapp] = useState('');
  const [notifPref, setNotifPref] = useState<WaitlistNotificationPref>('email');
  const [state, setState] = useState<SubmitState>({ kind: 'idle' });

  // Keep the prefilled email in sync if the signed-in user changes.
  React.useEffect(() => {
    if (userEmail) setEmail(userEmail);
  }, [userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.kind === 'submitting') return;
    setState({ kind: 'submitting' });
    const result = await submitWaitlist({
      email,
      perfume_id: perfume.id,
      size_ml: sizeMl,
      ...(whatsapp.trim() ? { whatsapp_number: whatsapp.trim() } : {}),
      notification_pref: notifPref,
    });
    if (!result.ok) {
      setState({
        kind: 'error',
        message: result.error === 'backend' || result.error === 'rate_limited' ? t.errorBackend : t.errorBody,
      });
      return;
    }
    if (result.already) {
      setState({ kind: 'already' });
      return;
    }
    setState(result.emailSent ? { kind: 'sent' } : { kind: 'recorded_no_email' });
  };

  const sizes: { value: WaitlistSizeMl; label: string; desc: string }[] = [
    { value: 2, label: t.sizeLabel2, desc: t.sizeDesc2 },
    { value: 5, label: t.sizeLabel5, desc: t.sizeDesc5 },
    { value: 10, label: t.sizeLabel10, desc: t.sizeDesc10 },
  ];

  return (
    <BottomSheetOrModal
      isOpen={isOpen}
      onClose={onClose}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
    >
      {(state.kind === 'sent' || state.kind === 'recorded_no_email' || state.kind === 'already') ? (
        <div className="space-y-4 text-center py-4">
          <CheckCircle2 className="w-10 h-10 text-bar mx-auto" />
          <h3 className="font-sans font-medium text-lg text-ink">
            {state.kind === 'already' ? t.alreadyTitle : t.successTitle}
          </h3>
          <p className="text-sm text-secondary leading-relaxed">
            {state.kind === 'sent' ? t.successBodyEmail : state.kind === 'recorded_no_email' ? t.successBodyNoEmail : t.alreadyBody}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-bar hover:bg-ink text-paper text-sm font-medium transition min-h-[44px]"
          >
            {t.closeWindow}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-4 bg-surface border border-hairline space-y-1">
            <p className="font-medium text-ink">{perfume.name}</p>
            <p className="text-xs text-secondary">{perfume.brand}</p>
            <p className="text-xs text-secondary">{t.priceNote}</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-sm text-ink">{t.sizeHeading}</p>
            <div className="grid grid-cols-3 gap-2">
              {sizes.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSizeMl(s.value)}
                  aria-pressed={sizeMl === s.value}
                  className={`p-3 border text-left transition min-h-[44px] ${sizeMl === s.value ? 'border-ink bg-surface' : 'border-hairline hover:border-secondary'}`}
                >
                  <span className="block text-sm font-medium text-ink">{s.label}</span>
                  <span className="block text-xs text-secondary">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="waitlist-email" className="font-medium text-sm text-ink block">{t.emailLabel}</label>
            <input
              id="waitlist-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="w-full p-3 bg-paper border border-border text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="waitlist-wa" className="font-medium text-sm text-ink block">{t.phoneLabel}</label>
            <input
              id="waitlist-wa"
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="+62"
              className="w-full p-3 bg-paper border border-border text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          <div className="space-y-2">
            <p className="font-medium text-sm text-ink">{t.notifHeading}</p>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'email' as const, label: t.notifEmail },
                { value: 'whatsapp' as const, label: t.notifWhatsapp },
                { value: 'both' as const, label: t.notifBoth },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNotifPref(opt.value)}
                  aria-pressed={notifPref === opt.value}
                  className={`px-4 py-2.5 border text-sm transition min-h-[44px] ${notifPref === opt.value ? 'border-ink bg-surface font-medium' : 'border-hairline hover:border-secondary'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {state.kind === 'error' && (
            <div className="p-3 bg-surface border border-hairline text-sm text-ink flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={state.kind === 'submitting'}
            className="w-full min-h-[48px] py-3.5 bg-bar hover:bg-ink disabled:opacity-60 text-paper text-sm font-medium transition"
          >
            {state.kind === 'submitting' ? t.submitting : fmt(t.submitWaitlist, String(sizeMl))}
          </button>
        </form>
      )}
    </BottomSheetOrModal>
  );
}
