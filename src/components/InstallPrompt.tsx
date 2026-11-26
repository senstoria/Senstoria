import React from 'react';
import { X } from 'lucide-react';
import { translations, type Locale } from '../lib/i18n.ts';
import {
  isIOS,
  isStandalone,
  type DeferredInstallPrompt,
} from '../lib/pwa.ts';

/**
 * InstallPrompt — Tahap 3 (26 Nov 2026).
 *
 * A calm, dismissible install card, shown inline at the top of Home —
 * never a banner covering content, never a floating overlay.
 *
 * - Android/desktop Chrome: shown only after the browser fires
 *   `beforeinstallprompt` (the app is actually installable); the
 *   "Pasang aplikasi" button calls the captured prompt once.
 * - iOS Safari: no system prompt exists, so the card shows the
 *   Share → Add to Home Screen steps instead.
 * - Phone-only: the card is a mobile-app affordance. Desktop Chrome can
 *   install PWAs too, but this product's install moment is the phone —
 *   below the app's own `lg` breakpoint, where the bottom tab bar lives.
 *   (Headless/desktop checks: the card must not appear at 1200px.)
 * - Shown at most once: dismissing (or installing) writes a flag to
 *   localStorage and the card never returns. Already-installed
 *   (standalone) users never see it.
 */
const DISMISS_KEY = 'senstoria-install-prompt-dismissed';

export const InstallPrompt: React.FC<{ locale: Locale }> = ({ locale }) => {
  const t = translations[locale].install;
  const [deferred, setDeferred] =
    React.useState<DeferredInstallPrompt | null>(null);
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [isIos] = React.useState<boolean>(() => isIOS());
  const [standalone] = React.useState<boolean>(() => isStandalone());
  const [isMobile, setIsMobile] = React.useState<boolean>(
    () => window.matchMedia('(max-width: 1023px)').matches,
  );

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  React.useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      // Prevent Chrome's own mini-infobar; we show our own calm card.
      event.preventDefault();
      setDeferred(event as DeferredInstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () =>
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const dismiss = React.useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* Storage unavailable — the card just hides for this session. */
    }
  }, []);

  const install = React.useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') dismiss();
    } catch {
      dismiss();
    }
    setDeferred(null);
  }, [deferred, dismiss]);

  // Never show: already installed, already dismissed, desktop viewport,
  // or nothing to offer (no install prompt captured and not iOS).
  if (standalone || dismissed || !isMobile) return null;
  if (!deferred && !isIos) return null;

  const showIosSteps = !deferred && isIos;

  return (
    <section
      role="region"
      aria-label={t.title}
      className="rounded-card border border-hairline bg-surface p-5 flex gap-4 items-start"
    >
      <img
        src="/assets/senstoria-mark-s.png"
        alt=""
        aria-hidden="true"
        className="w-10 h-10 shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0 space-y-2">
        <h2 className="text-[16px] leading-[22px] font-semibold text-ink">
          {showIosSteps ? t.iosTitle : t.title}
        </h2>
        <p className="text-[14px] leading-[20px] text-secondary">
          {showIosSteps ? t.iosBody : t.body}
        </p>
        <div className="pt-1 flex flex-wrap items-center gap-3">
          {!showIosSteps && (
            <button
              type="button"
              onClick={install}
              className="min-h-[44px] bg-bar hover:bg-ink text-paper px-6 text-sm font-semibold transition active:scale-[0.98] cursor-pointer rounded-full"
            >
              {t.installButton}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="min-h-[44px] px-2 text-sm font-medium text-secondary hover:text-ink underline underline-offset-4 transition cursor-pointer"
          >
            {t.later}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.closeLabel}
        className="shrink-0 w-11 h-11 flex items-center justify-center text-secondary hover:text-ink transition cursor-pointer rounded-full"
      >
        <X className="w-5 h-5" />
      </button>
    </section>
  );
};
