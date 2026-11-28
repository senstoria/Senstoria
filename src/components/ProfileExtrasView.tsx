import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { translations, fmt, type Locale } from '../lib/i18n.ts';
import { memberSinceYear } from '../lib/profileN6.ts';
import { EmptyState } from './EmptyState.tsx';
import { ScentDnaVisualisation, type ScentDnaFamilyShare } from './ScentDnaVisualisation.tsx';
import type { UserProfile } from '../context/AuthContext.tsx';

/**
 * Fase N6 (G1): tiga layar kecil dari Profil yang belum punya file sendiri.
 * - Keanggotaan: status akun yang sebenarnya (email + verifikasi +
 *   "Member sejak" hanya bila creationTime asli tersedia). Tanpa poin.
 * - Pesanan: empty state jujur sampai S3 (tidak ada data pesanan — tidak
 *   ada yang ditampilkan sebagai pesanan).
 * - Scent DNA: shortcut G1 → Fase N10; layar ini memakai visualisasi DNA
 *   yang sudah ada di Beranda (data yang sama), bukan placeholder.
 */

interface BackProps {
  onBack: () => void;
  label: string;
}

const BackButton: React.FC<BackProps> = ({ onBack, label }) => (
  <button
    type="button"
    onClick={onBack}
    className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
  >
    <ArrowLeft className="w-3.5 h-3.5" />
    <span>{label}</span>
  </button>
);

export const MembershipView: React.FC<{
  user: UserProfile | null;
  onBack: () => void;
  onSignIn: () => void;
  locale: Locale;
}> = ({ user, onBack, onSignIn, locale }) => {
  const t = translations[locale];
  const memberYear = memberSinceYear(user?.memberSinceIso);
  return (
    <div data-testid="membership-screen" className="space-y-6">
      <BackButton onBack={onBack} label={t.membershipView.backToProfile} />
      <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
        {t.membershipView.title}
      </h1>
      {!user ? (
        <>
          <p className="text-[14px] leading-[20px] text-secondary">{t.membershipView.signInRequired}</p>
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center justify-center min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-bar hover:bg-ink text-paper transition active:scale-[0.98] cursor-pointer"
          >
            {t.profileView.signIn}
          </button>
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-4 border-b border-hairline py-4 min-h-[48px]">
            <span className="text-[14px] leading-[20px] font-bold text-ink">{t.membershipView.statusLabel}</span>
            <span className="text-[14px] leading-[20px] text-ink">{t.membershipView.statusActive}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-hairline py-4 min-h-[48px]">
            <span className="text-[14px] leading-[20px] font-bold text-ink">{t.settingsView.email}</span>
            <span className="text-[14px] leading-[20px] text-ink text-right">
              {user.email}
              <span className="block text-[13px] text-muted">
                {user.isEmailVerified ? t.membershipView.emailVerified : t.membershipView.emailUnverified}
              </span>
            </span>
          </div>
          {memberYear !== null && (
            <div className="flex items-center justify-between gap-4 border-b border-hairline py-4 min-h-[48px]">
              <span className="text-[14px] leading-[20px] font-bold text-ink">
                {fmt(t.membershipView.memberSince, String(memberYear))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const OrdersView: React.FC<{
  onBack: () => void;
  onNavigateToCatalog: () => void;
  locale: Locale;
}> = ({ onBack, onNavigateToCatalog, locale }) => {
  const t = translations[locale];
  return (
    <div data-testid="orders-screen" className="space-y-6">
      <BackButton onBack={onBack} label={t.ordersView.backToProfile} />
      <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
        {t.ordersView.title}
      </h1>
      <EmptyState
        title={t.ordersView.emptyTitle}
        body={t.ordersView.emptyBody}
        ctaLabel={t.ordersView.exploreCatalog}
        onCtaClick={onNavigateToCatalog}
        iconType="shelf"
      />
    </div>
  );
};

export const ScentDnaScreen: React.FC<{
  familyBreakdown: ScentDnaFamilyShare[];
  perfumesCount: number;
  topNotes: string[];
  onBack: () => void;
  onNavigateToCatalog: () => void;
  locale: Locale;
}> = ({ familyBreakdown, perfumesCount, topNotes, onBack, onNavigateToCatalog, locale }) => {
  const t = translations[locale];
  return (
    <div data-testid="scent-dna-screen" className="space-y-6">
      <BackButton onBack={onBack} label={t.scentDnaView.backToProfile} />
      <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
        {t.scentDnaView.title}
      </h1>
      <ScentDnaVisualisation
        familyBreakdown={familyBreakdown}
        perfumesCount={perfumesCount}
        topNotes={topNotes}
        locale={locale}
        isDashboard={false}
        onNavigateToCatalog={onNavigateToCatalog}
      />
    </div>
  );
};
