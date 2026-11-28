import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { translations, fmt, type Locale } from '../lib/i18n.ts';
import { memberSinceYear } from '../lib/profileN6.ts';
import { EmptyState } from './EmptyState.tsx';
import { validateScentDnaData, type ScentDnaFamilyShare } from './ScentDnaVisualisation.tsx';
import { dominantFamilyShare, type DnaGenderLabel, type DnaLongevityBand } from '../lib/senstoriaN10.ts';
import type { UserProfile } from '../context/AuthContext.tsx';

// Radar DNA dimuat malas seperti di hasil Finder (recharts berat).
const ScentDnaRadarChart = React.lazy(() => import('./ScentDnaRadarChart.tsx'));

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
            className="inline-flex items-center justify-center min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-bar hover:bg-ink text-paper transition active:scale-[0.97] cursor-pointer"
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

/**
 * Fase N10 (P15 + J-02): Scent DNA sebagai halaman tenang yang dibuka dari
 * Profil (G1) — BUKAN widget di Home. Pola mockup 08-scent-dna: judul
 * Display, tab keluarga bergaris bawah, satu radar, satu kalimat yang
 * diturunkan dari data, gate jujur, dan rincian dimensi.
 *
 * Kejujuran data (bukan tebakan):
 * - Radar memakai pembagian keluarga nyata dari botol milik pengguna
 *   (4+ sumbu keluarga). Nilai CONTOH mockup untuk 6 dimensi Finder TIDAK
 *   dipakai: botol tidak membawa data Climate / Occasion / Budget, jadi
 *   baris-baris itu tidak dirender sama sekali (kolom kosong tetap kosong).
 * - Kalimat hanya menyebut keluarga dominan + persentasenya — tanpa klaim
 *   selera umum ("tenang dan hangat" di mockup adalah CONTOH).
 * - Gate J-02: botol custom disebut sebagai jalan ketiga membentuk profil;
 *   ambang TIDAK diturunkan. Jumlah parfum terbit dihitung dari katalog,
 *   bukan angka mati.
 */
export const ScentDnaScreen: React.FC<{
  familyBreakdown: ScentDnaFamilyShare[];
  perfumesCount: number;
  topNotes: string[];
  publishedCount: number;
  dominantLongevity: DnaLongevityBand | null;
  dominantGender: DnaGenderLabel | null;
  onBack: () => void;
  onNavigateToCatalog: () => void;
  locale: Locale;
}> = ({ familyBreakdown, perfumesCount, topNotes, publishedCount, dominantLongevity, dominantGender, onBack, onNavigateToCatalog, locale }) => {
  const t = translations[locale];
  const dominant = dominantFamilyShare(familyBreakdown);
  const visibleFamilies = familyBreakdown.filter(item => item.percentage > 0);
  const [selectedFamily, setSelectedFamily] = useState<string>(
    dominant?.family ?? visibleFamilies[0]?.family ?? ''
  );
  const selected = visibleFamilies.find(item => item.family === selectedFamily) ?? dominant ?? visibleFamilies[0];
  const isDominantSelected = selected !== undefined && dominant !== null && selected.family === dominant.family;

  const bandLabel: Record<DnaLongevityBand, string> = {
    '<2h': t.scentDnaView.longevityBandUnder2h,
    '2-4h': t.scentDnaView.longevityBand2to4h,
    '4-6h': t.scentDnaView.longevityBand4to6h,
    '6-8h': t.scentDnaView.longevityBand6to8h,
    '8h+': t.scentDnaView.longevityBandOver8h,
  };
  const genderLabel: Record<DnaGenderLabel, string> = {
    feminine: t.scentDnaView.genderFeminine,
    masculine: t.scentDnaView.genderMasculine,
    unisex: t.scentDnaView.genderUnisex,
  };

  return (
    <div data-testid="scent-dna-screen" className="space-y-6">
      <BackButton onBack={onBack} label={t.scentDnaView.backToProfile} />
      <h1 className="font-display text-[36px] leading-[40px] font-extrabold tracking-[-0.02em] text-ink">
        {t.scentDnaView.title}
      </h1>

      {/* Gate jujur (J-02): di bawah ambang 3 parfum — tanpa radar, tanpa
          kalimat, tanpa angka karangan. */}
      {perfumesCount < 3 ? (
        <div data-testid="scent-dna-gate" className="bg-surface p-6 text-center space-y-3">
          <p className="text-[14px] leading-[20px] text-ink">
            <b>{t.scentDnaView.gateTitle}</b>
            <br />
            {fmt(t.scentDnaView.gateBodyPublished, publishedCount)}
            {' '}
            {t.scentDnaView.gateBodyCustom}
          </p>
          <p className="font-mono text-[12px] text-secondary tabular-nums">
            {fmt(t.scentDnaView.gateProgress, perfumesCount)}
          </p>
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="w-full min-h-[48px] rounded-full bg-bar hover:bg-ink text-paper text-[14px] font-bold transition active:scale-[0.97] cursor-pointer flex items-center justify-center"
          >
            {t.scentDna.jelajahiKatalog}
          </button>
        </div>
      ) : !validateScentDnaData(familyBreakdown) ? (
        <div data-testid="scent-dna-error" role="alert" className="p-4 bg-surface border border-hairline text-xs space-y-1.5">
          <p className="font-semibold text-ink">{t.scentDna.dataProfilScentDnaTidakValid}</p>
          <p className="text-secondary leading-relaxed">{t.scentDna.distribusiKeluargaOlfaktifTidakDapatD}</p>
        </div>
      ) : (
        <>
          {/* Tab keluarga bergaris bawah (mockup 08). */}
          <div className="flex gap-5 overflow-x-auto border-b border-hairline" role="tablist" aria-label={t.scentDnaView.shareListLabel}>
            {visibleFamilies.map(item => {
              const active = item.family === selected?.family;
              return (
                <button
                  key={item.family}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedFamily(item.family)}
                  className={`pb-1.5 pt-1 text-[14px] font-bold whitespace-nowrap min-h-[44px] border-b-2 transition ${active ? 'border-ink text-ink' : 'border-transparent text-secondary hover:text-ink'}`}
                >
                  {item.family}
                </button>
              );
            })}
          </div>

          {/* Satu radar (pembagian keluarga nyata). */}
          <React.Suspense fallback={<div className="h-[260px] flex items-center justify-center font-mono text-xs text-secondary">{t.common.loading}</div>}>
            <ScentDnaRadarChart familyBreakdown={familyBreakdown} height={260} />
          </React.Suspense>

          {/* Satu kalimat — diturunkan dari data, tanpa klaim selera umum. */}
          {selected && (
            <p className="font-display text-[19px] leading-[26px] font-bold tracking-[-0.02em] text-ink text-center">
              {isDominantSelected
                ? fmt(t.scentDnaView.sentenceDominant, selected.family, selected.percentage)
                : fmt(t.scentDnaView.sentenceShare, selected.family, selected.percentage)}
            </p>
          )}

          {/* Pembagian keluarga sebagai teks (alternatif tekstual radar). */}
          <div aria-label={t.scentDnaView.shareListLabel}>
            {visibleFamilies.map(item => (
              <div key={item.family} className="flex justify-between border-b border-hairline py-3 text-[14px] leading-[20px]">
                <b className="font-bold text-ink">{item.family}</b>
                <span className="font-mono tabular-nums text-secondary">{item.percentage}%</span>
              </div>
            ))}
          </div>

          {/* Rincian dimensi — hanya dimensi yang punya data botol nyata.
              Climate / Occasion / Budget tidak dirender (tidak ada datanya). */}
          <div>
            {dominant && (
              <div className="flex justify-between border-b border-hairline py-3 text-[14px] leading-[20px]">
                <b className="font-bold text-ink">{t.scentDnaView.dimNotesFamily}</b>
                <span className="text-secondary">{dominant.family}</span>
              </div>
            )}
            {dominantLongevity && (
              <div className="flex justify-between border-b border-hairline py-3 text-[14px] leading-[20px]">
                <b className="font-bold text-ink">{t.scentDnaView.dimLongevity}</b>
                <span className="text-secondary">{bandLabel[dominantLongevity]}</span>
              </div>
            )}
            {dominantGender && (
              <div className="flex justify-between border-b border-hairline py-3 text-[14px] leading-[20px]">
                <b className="font-bold text-ink">{t.scentDnaView.dimGender}</b>
                <span className="text-secondary">{genderLabel[dominantGender]}</span>
              </div>
            )}
          </div>

          {/* Keterangan: berdasarkan N parfum + notes dominan. */}
          <p className="pt-1 text-xs text-secondary leading-relaxed">
            <span className="font-mono text-[12px] text-ink">
              {fmt(t.scentDna.berdasarkan0Parfum, perfumesCount)}
            </span>
            {topNotes.length > 0 && (
              <span>
                {' · '}
                <span className="font-medium text-ink">{t.scentDna.notesDominan}</span>
                {topNotes.slice(0, 8).map((note, idx) => `${idx + 1}. ${note}`).join(' · ')}
              </span>
            )}
          </p>
        </>
      )}
    </div>
  );
};
