/**
 * PWA helpers — Senstoria Tahap 3 (26 Nov 2026).
 *
 * - registerServiceWorker(): production builds only, so `vite dev` never
 *   serves a stale shell from a worker. A failed registration is silent:
 *   the app works fully without a worker; installation is a bonus, not
 *   a requirement.
 * - isStandalone(): the app is already running installed (standalone
 *   display mode or iOS `navigator.standalone`) — never show an install
 *   prompt to someone who already installed it.
 * - isIOS(): iOS Safari has no `beforeinstallprompt`; installation there
 *   is Share → Add to Home Screen, shown as guidance, not a prompt.
 */

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  // Dev builds serve fresh files per request; a worker would only cache
  // yesterday's shell. Registration is a production-only behaviour.
  if (!import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Silent on purpose: no worker, no problem — the app still works. */
    });
  });
}

export function isStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari: `navigator.standalone` is true when launched from Home Screen.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIOS(): boolean {
  // iPadOS 13+ reports itself as Macintosh; touch points tell it apart.
  const touchMac =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || touchMac;
}

/** A `beforeinstallprompt` event with the real `prompt()` attached. */
export interface DeferredInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
