import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { translations, type Locale } from '../lib/i18n.ts';
import { providerLabel } from '../lib/profileN6.ts';
import type { UserProfile } from '../context/AuthContext.tsx';

interface SettingsViewProps {
  user: UserProfile | null;
  languageLabel: string;
  visibilityLabel: string;
  onChangePassword: () => Promise<void>;
  onNavigateToLanguage: () => void;
  onNavigateToVisibility: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToAbout: () => void;
  onOpenPrivacy: () => void;
  onOpenDataRights: () => void;
  onSignOut: () => void;
  onBack: () => void;
  onSignIn: () => void;
  locale: Locale;
}

/**
 * Fase N6 (G12 + P1, menyerap checklist item 6): Pengaturan — 10 baris
 * yang relevan dan benar-benar ada (mockup 03-settings). Dari 24 baris
 * Settings Nike hanya 10 yang dipakai; sisanya (Units of Measure,
 * Delivery/Payment, Country/Region, Shipping, Location, Blocked Users,
 * Workout Info, Find a Store, Get Support, Explore Our Apps, Terms of
 * Sale, SNKRS) TIDAK dipakai — jangan ditebak.
 * - Akun Tertaut: HANYA menampilkan status dari providerId Firebase
 *   yang sebenarnya (G12); mengaktifkannya tetap langkah console founder.
 * - Ganti Kata Sandi: API Firebase yang sudah ada (resetPassword).
 * - Hapus Akun: teks merah → alur Data Rights yang sudah ada (PR #61).
 * - Bahasa: baris ini yang menggantikan tombol bahasa di header (G13).
 */
export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  languageLabel,
  visibilityLabel,
  onChangePassword,
  onNavigateToLanguage,
  onNavigateToVisibility,
  onNavigateToNotifications,
  onNavigateToAbout,
  onOpenPrivacy,
  onOpenDataRights,
  onSignOut,
  onBack,
  onSignIn,
  locale,
}) => {
  const t = translations[locale];
  const linkedLabels = (user?.linkedProviders ?? [])
    .map(providerLabel)
    .filter((label): label is string => label !== null);
  const linkedSub = linkedLabels.length > 0
    ? [...new Set(linkedLabels)].join(' · ')
    : t.settingsView.guestEmailSub;

  const rows: {
    label: string;
    sub?: string;
    danger?: boolean;
    onClick: () => void | Promise<void>;
    testId?: string;
  }[] = [
    { label: t.settingsView.email, sub: user ? user.email : t.settingsView.guestEmailSub, onClick: () => {} },
    { label: t.settingsView.changePassword, onClick: () => { void onChangePassword(); }, testId: 'settings-change-password' },
    { label: t.settingsView.linkedAccounts, sub: linkedSub, onClick: () => {} },
    { label: t.settingsView.language, sub: languageLabel, onClick: onNavigateToLanguage },
    { label: t.settingsView.privacy, sub: t.settingsView.privacySub, onClick: onOpenPrivacy },
    { label: t.settingsView.visibility, sub: visibilityLabel, onClick: onNavigateToVisibility },
    { label: t.settingsView.notifications, sub: t.settingsView.notificationsSub, onClick: onNavigateToNotifications },
    { label: t.settingsView.about, onClick: onNavigateToAbout },
    { label: t.settingsView.deleteAccount, danger: true, onClick: onOpenDataRights },
    { label: t.settingsView.signOut, danger: true, onClick: onSignOut },
  ];

  return (
    <div data-testid="settings-screen" className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.settingsView.backToProfile}</span>
      </button>

      <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
        {t.settingsView.title}
      </h1>

      {!user && (
        <button
          type="button"
          onClick={onSignIn}
          className="inline-flex items-center justify-center min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-bar hover:bg-ink text-paper transition active:scale-[0.97] cursor-pointer"
        >
          {t.profileView.signIn}
        </button>
      )}

      <nav aria-label={t.settingsView.title}>
        {rows.map(row => (
          <button
            key={row.label}
            type="button"
            data-testid={row.testId}
            onClick={() => { void row.onClick(); }}
            className="flex w-full items-center justify-between gap-3 bg-paper border-b border-hairline py-4 text-left min-h-[48px] cursor-pointer"
          >
            <span className="min-w-0">
              <span className={`block text-[14px] leading-[20px] font-bold ${row.danger ? 'text-error' : 'text-ink'}`}>
                {row.label}
              </span>
              {row.sub && (
                <span className="block text-[13px] leading-[18px] text-muted truncate">{row.sub}</span>
              )}
            </span>
            <ChevronRight className="w-5 h-5 text-secondary flex-none" aria-hidden="true" />
          </button>
        ))}
      </nav>
    </div>
  );
};
