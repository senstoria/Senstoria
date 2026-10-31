import React from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { translations, type Locale } from '../lib/i18n.ts';
import { Bottle } from './Bottle.tsx';

/**
 * AuthPageView — dedicated sign-in / sign-up page (founder decision,
 * 31 Oct 2026: auth moves from the BottomSheetOrModal tabbed modal to a
 * split page modelled on the EditorM community template's PATTERN only).
 *
 * Mobile-first: one full, generous form column, no side panel.
 * Desktop: split layout — form column (~448px, the template's 404px form
 * widened slightly for the 16px base font) on one side, an editorial
 * panel on the other. The panel deliberately does NOT reuse the template's
 * Unsplash stock photo: it uses Senstoria's own Bottle SVG illustration
 * plus editorial serif typography and the auth subtitle strings that
 * already exist in i18n.
 *
 * Logic is intentionally identical to the old modal form: same fields
 * (email + password; consent checkbox only on sign-up, with working
 * terms/privacy links; forgot password only on sign-in), same validation
 * and error/notice display, same submit handlers passed in from App.
 * Provider buttons (founder decision 31 Oct 2026, reversing the
 * original brief): Sign in with Google / Apple ARE included, as real
 * Firebase Auth popup sign-in via AuthContext.signInWithProvider —
 * never decorative. Until the founder enables the providers in the
 * Firebase console, attempts fail honestly with
 * authErrors.provider_not_enabled (see AuthContext for the console
 * steps; Apple additionally needs an Apple Developer Service ID + key).
 * NOT included from the template, on purpose: a "Remember for 30 days"
 * behaviour (a persistence change, not a visual one), and a Name field
 * (Senstoria does not use one).
 */
export interface AuthPageViewProps {
  tab: 'signin' | 'signup';
  locale: Locale;
  email: string;
  password: string;
  termsAccepted: boolean;
  error: string | null;
  notice: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTermsChange: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onProviderSignIn: (provider: 'google' | 'apple') => void;
  onForgotPassword: () => void;
  onTabChange: (tab: 'signin' | 'signup') => void;
  onBack: () => void;
  onGoLegal: (tab: 'terms' | 'privacy') => void;
}

export const AuthPageView: React.FC<AuthPageViewProps> = ({
  tab,
  locale,
  email,
  password,
  termsAccepted,
  error,
  notice,
  onEmailChange,
  onPasswordChange,
  onTermsChange,
  onSubmit,
  onProviderSignIn,
  onForgotPassword,
  onTabChange,
  onBack,
  onGoLegal,
}) => {
  const t = translations[locale].authModal;
  const isSignin = tab === 'signin';

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[44px] px-1 py-2 text-[14px] font-medium text-ink flex items-center gap-2 transition hover:text-secondary"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.authBack}
      </button>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-0 lg:items-stretch">
        {/* ── Form side: template pattern (large serif title, calm
            subtitle, generous fields, one clear dark primary button,
            a switch link instead of the old modal tabs). ── */}
        <div className="w-full max-w-[448px] mx-auto lg:mx-0 lg:justify-self-center py-2 md:py-6 space-y-8">
          <div className="space-y-3">
            <h1 className="font-serif text-[36px] leading-[44px] font-normal text-ink">
              {isSignin ? t.titleSignin : t.titleSignup}
            </h1>
            <p className="text-[16px] leading-[26px] text-secondary">
              {isSignin ? t.subtitleSignin : t.subtitleSignup}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-error/10 border border-error text-error text-[14px] flex items-start gap-2 rounded-control">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="p-4 bg-surface border border-hairline text-ink text-[14px] rounded-control">
              {notice}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5 text-[14px]">
            <div className="space-y-2">
              <label className="font-semibold block">{t.emailLabel}</label>
              <input
                type="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full min-h-[48px] p-3 bg-white border border-bar text-base md:text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent rounded-control"
              />
            </div>

            <div className="space-y-2">
              <label className="font-semibold block">{t.passwordLabel}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full min-h-[48px] p-3 bg-white border border-bar text-base md:text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent rounded-control"
              />
            </div>

            {isSignin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-[14px] underline text-ink min-h-[44px]"
                >
                  {translations[locale].app.lupaKataSandi}
                </button>
              </div>
            )}

            {!isSignin && (
              <label className="flex items-start gap-2 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => onTermsChange(e.target.checked)}
                  className="mt-0.5 accent-bar w-4 h-4"
                />
                <span className="text-[14px] text-secondary">
                  {t.consentPrefix}
                  <button type="button" onClick={() => onGoLegal('terms')} className="underline text-ink">
                    {t.termsLink}
                  </button>
                  {t.consentMiddle}
                  <button type="button" onClick={() => onGoLegal('privacy')} className="underline text-ink">
                    {t.privacyLink}
                  </button>
                  {t.consentSuffix}
                </span>
              </label>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] py-3.5 bg-bar hover:bg-ink text-paper text-[16px] font-medium transition cursor-pointer rounded-control"
            >
              {isSignin ? t.submitSignin : t.submitSignup}
            </button>
          </form>

          {/* Provider sign-in, template pattern (divider + two side-by-side
              buttons), wired to real Firebase popup sign-in. Text-only
              labels: no brand-mark assets are bundled or faked. */}
          <div className="space-y-4">
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="flex-1 border-t border-hairline" />
              <span className="text-[12px] text-secondary">{t.providerDivider}</span>
              <span className="flex-1 border-t border-hairline" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onProviderSignIn('google')}
                className="min-h-[48px] px-3 bg-white border border-bar text-[14px] font-medium text-ink transition hover:bg-surface rounded-control"
              >
                {t.providerGoogle}
              </button>
              <button
                type="button"
                onClick={() => onProviderSignIn('apple')}
                className="min-h-[48px] px-3 bg-white border border-bar text-[14px] font-medium text-ink transition hover:bg-surface rounded-control"
              >
                {t.providerApple}
              </button>
            </div>
          </div>

          <p className="text-[14px] text-secondary text-center">
            <button
              type="button"
              onClick={() => onTabChange(isSignin ? 'signup' : 'signin')}
              className="underline text-ink min-h-[44px]"
            >
              {isSignin ? t.authSwitchToSignup : t.authSwitchToSignin}
            </button>
          </p>
        </div>

        {/* ── Editorial side panel (desktop only): Bottle SVG + serif
            typography, no stock photo. Hidden on mobile so the form
            stays one full, unobstructed column. ── */}
        <aside className="hidden lg:flex flex-col items-center justify-center gap-6 bg-surface border border-hairline rounded-card p-10 text-center overflow-hidden">
          <Bottle size="lg" showFill={false} />
          <p className="font-serif text-[32px] leading-[40px] font-normal text-ink max-w-[320px]">
            Senstoria
          </p>
          <p className="text-[16px] leading-[26px] text-secondary max-w-[320px]">
            {isSignin ? t.subtitleSignin : t.subtitleSignup}
          </p>
        </aside>
      </div>
    </div>
  );
};

export default AuthPageView;
