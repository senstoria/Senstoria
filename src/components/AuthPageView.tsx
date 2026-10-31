import React from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { translations, type Locale } from '../lib/i18n.ts';

/**
 * AuthPageView — dedicated sign-in / sign-up page (founder decision,
 * 31 Oct 2026: auth moves from the BottomSheetOrModal tabbed modal to a
 * split page modelled on the EditorM community template's PATTERN only).
 *
 * Mobile-first: one full, generous form column, no side panel.
 * Desktop: split layout — form column (~448px, the template's 404px form
 * widened slightly for the 16px base font) on one side, an editorial
 * panel on the other. Both auth panels use the SAME photo — a
 * founder-supplied store interior, served from
 * public/assets/auth-panel.jpg — not an illustration and NOT a
 * catalogue product photo (founder decision 31 Oct 2026, 12:20 WIB,
 * replacing the earlier Senstoria wallpaper photo for both panels).
 * Each tab keeps its own subtitle string from i18n; only the photo
 * and its treatment are shared. The canonical image_url rule for
 * catalogue photos is untouched. NOTE (binary push blocker, same as
 * the S favicon and the earlier wallpaper): auth-panel.jpg cannot be
 * pushed through the text-only GitHub MCP snapshot path, so until it
 * is uploaded via another route (GitHub web upload), the <img> below
 * will 404 on the remote branch — the code change itself is complete.
 * The panel heading is the white Senstoria wordmark logo
 * (public/assets/senstoria-logo-white.png, founder decision 31 Oct
 * 2026, 12:21 WIB), not a text heading; it carries alt="Senstoria"
 * so the brand name stays readable to screen readers. That logo file
 * is likewise binary and must be uploaded via the same web route.
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

/** Google "G" mark (multicolour, standard brand paths) and Apple mark
 * (ink, to match direction C), drawn as inline SVG so no binary asset
 * has to be pushed through the text-only snapshot path. Both are
 * aria-hidden: the button text already names the provider. Rendered at
 * 20px inside the provider buttons, on both tabs. */
const GoogleMark: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.12-6.73-4.96H1.29v3.1C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M6.27 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l4.98-3.1z"
    />
    <path
      fill="#EA4335"
      d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l4.98 3.1C6.22 6.88 8.87 4.76 12 4.76z"
    />
  </svg>
);

const AppleMark: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0 text-ink">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.702" />
  </svg>
);

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
              buttons), wired to real Firebase popup sign-in. Each button
              shows its brand mark (inline SVG, 20px) beside the text, on
              both tabs — founder decision 31 Oct 2026, reversing the
              earlier text-only approach. */}
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
                className="min-h-[48px] px-3 bg-white border border-bar text-[14px] font-medium text-ink transition hover:bg-surface rounded-control flex items-center justify-center gap-2"
              >
                <GoogleMark />
                {t.providerGoogle}
              </button>
              <button
                type="button"
                onClick={() => onProviderSignIn('apple')}
                className="min-h-[48px] px-3 bg-white border border-bar text-[14px] font-medium text-ink transition hover:bg-surface rounded-control flex items-center justify-center gap-2"
              >
                <AppleMark />
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

        {/* ── Editorial side panel (desktop only). Hidden on mobile so
            the form stays one full, unobstructed column. Both tabs show
            the SAME photo: the founder-supplied store interior
            (public/assets/auth-panel.jpg), replacing the earlier
            Senstoria wallpaper photo. No Pexels photo and no brand
            attribution are shown in the panel. NOTE (binary push
            blocker, same as the S favicon): auth-panel.jpg and the
            white logo below cannot be pushed through the text-only
            GitHub MCP snapshot path, so until they are uploaded via
            another route (GitHub web upload, like the favicon), the
            images below will 404 on the remote branch — the code
            change itself is complete. This is an editorial
            auth-panel photo, NOT a catalogue product photo. Each tab
            keeps its own subtitle; only the photo and its treatment
            are shared. ── */}
        <aside className="hidden lg:block relative bg-surface border border-hairline rounded-card overflow-hidden">
          {/* Decorative: the white logo and subtitle below already
              convey the panel's meaning, so the photo itself carries
              an empty alt (and no i18n key is needed for it). */}
          <img
            src="/assets/auth-panel.jpg"
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div className="relative flex h-full flex-col items-center justify-center gap-6 p-10 text-center">
            {/* White wordmark logo (not a text heading): alt keeps the
                brand name readable to screen readers. */}
            <img
              src="/assets/senstoria-logo-white.png"
              alt="Senstoria"
              loading="lazy"
              className="w-[240px] max-w-[260px] h-auto"
            />
            <p className="text-[16px] leading-[26px] text-paper/90 max-w-[320px]">
              {isSignin ? t.subtitleSignin : t.subtitleSignup}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AuthPageView;
