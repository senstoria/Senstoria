import React from 'react';
import { ChevronRight, User as UserIcon } from 'lucide-react';
import { translations, fmt, type Locale } from '../lib/i18n.ts';
import { initialFromName, memberSinceYear, type ProfileVisibility } from '../lib/profileN6.ts';
import type { UserProfile } from '../context/AuthContext.tsx';

interface ProfileViewProps {
  user: UserProfile | null;
  visibility: ProfileVisibility;
  onNavigateToEditProfile: () => void;
  onNavigateToOrders: () => void;
  onNavigateToScentDna: () => void;
  onNavigateToTryItFirst: () => void;
  onNavigateToSettings: () => void;
  onNavigateToInbox: () => void;
  onNavigateToMembership: () => void;
  onNavigateToVisibility: () => void;
  onNavigateToAbout: () => void;
  onSignIn: () => void;
  locale: Locale;
}

/**
 * Fase N6 (G1 + P1): layar Profil — rumah bagi akun pengguna.
 * Mockup 02-profil: avatar inisial 64px + nama + email (+ "Member sejak
 * {tahun}" HANYA bila creationTime asli tersedia — memberSinceYear
 * mengembalikan null bila tidak ada, dan baris itu tidak ditampilkan,
 * jangan ditebak). 4 shortcut (Pesanan — empty state jujur sampai S3;
 * Scent DNA; Coba Dulu; Pengaturan) + baris Inbox, Keanggotaan,
 * Visibilitas, Tentang Versi Ini. Layar utama: tab bar TAMPIL (D-4).
 * Tamu (belum masuk) melihat keadaan tamu yang jujur + tombol Masuk.
 */
export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  visibility,
  onNavigateToEditProfile,
  onNavigateToOrders,
  onNavigateToScentDna,
  onNavigateToTryItFirst,
  onNavigateToSettings,
  onNavigateToInbox,
  onNavigateToMembership,
  onNavigateToVisibility,
  onNavigateToAbout,
  onSignIn,
  locale,
}) => {
  const t = translations[locale];
  const memberYear = memberSinceYear(user?.memberSinceIso);
  const initial = user ? initialFromName(user.nickname) : '';
  const visibilityLabel =
    visibility === 'everyone' ? t.visibilityView.optionEveryone
    : visibility === 'members' ? t.visibilityView.optionMembers
    : t.visibilityView.optionPrivate;

  const shortcuts = [
    { label: t.profileView.orders, onClick: onNavigateToOrders },
    { label: t.profileView.scentDna, onClick: onNavigateToScentDna },
    { label: t.profileView.tryItFirst, onClick: onNavigateToTryItFirst },
    { label: t.profileView.settings, onClick: onNavigateToSettings },
  ];

  const rows = [
    { label: t.profileView.inbox, sub: t.profileView.inboxSub, onClick: onNavigateToInbox },
    { label: t.profileView.membership, sub: t.profileView.membershipSub, onClick: onNavigateToMembership },
    { label: t.profileView.visibility, sub: visibilityLabel, onClick: onNavigateToVisibility },
    { label: t.profileView.about, sub: t.profileView.aboutSub, onClick: onNavigateToAbout },
  ];

  return (
    <div data-testid="profile-screen" className="space-y-6">
      {/* Header: avatar 64px + nama + email (mockup 02). */}
      <div className="flex items-center gap-4">
        <span
          className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-[24px] font-extrabold text-ink flex-none"
          aria-label={t.profileView.title}
        >
          {initial ? initial : <UserIcon className="w-7 h-7 text-secondary" aria-hidden="true" />}
        </span>
        <div className="min-w-0">
          <h1 className="text-[24px] leading-[28px] font-extrabold tracking-[-0.02em] text-ink truncate">
            {user ? user.nickname : t.profileView.guestName}
          </h1>
          {user ? (
            <p className="text-[13px] leading-[18px] text-muted truncate">
              {user.email}
              {memberYear !== null ? ` · ${fmt(t.profileView.memberSince, String(memberYear))}` : ''}
            </p>
          ) : (
            <p className="text-[13px] leading-[18px] text-muted">
              {t.profileView.guestSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Edit Profil / Masuk (tamu). */}
      <div>
        {user ? (
          <button
            type="button"
            onClick={onNavigateToEditProfile}
            className="inline-flex items-center justify-center min-h-[48px] rounded-full px-6 text-[14px] font-bold border border-border bg-paper text-ink hover:bg-surface transition active:scale-[0.98] cursor-pointer"
          >
            {t.profileView.editProfile}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center justify-center min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-bar hover:bg-ink text-paper transition active:scale-[0.98] cursor-pointer"
          >
            {t.profileView.signIn}
          </button>
        )}
      </div>

      {/* 4 shortcut (mockup 02: grid 4 kolom, panel gray-100). */}
      <div className="grid grid-cols-4 gap-2" aria-label={t.profileView.shortcutsLabel}>
        {shortcuts.map(s => (
          <button
            key={s.label}
            type="button"
            onClick={s.onClick}
            className="bg-gray-100 rounded-lg min-h-[56px] text-[13px] leading-[16px] font-bold text-ink cursor-pointer px-1 py-2 hover:bg-gray-200 transition active:scale-[0.98]"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Baris: Inbox, Keanggotaan, Visibilitas, Tentang Versi Ini. */}
      <nav aria-label={t.profileView.title}>
        {rows.map(row => (
          <button
            key={row.label}
            type="button"
            onClick={row.onClick}
            className="flex w-full items-center justify-between gap-3 bg-paper border-b border-hairline py-4 text-left min-h-[48px] cursor-pointer"
          >
            <span className="min-w-0">
              <span className="block text-[14px] leading-[20px] font-bold text-ink">{row.label}</span>
              <span className="block text-[13px] leading-[18px] text-muted">{row.sub}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-secondary flex-none" aria-hidden="true" />
          </button>
        ))}
      </nav>
    </div>
  );
};
