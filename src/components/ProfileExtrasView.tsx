import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { translations, fmt, formatCurrency, type Locale } from '../lib/i18n.ts';
import { memberSinceYear } from '../lib/profileN6.ts';
import { EmptyState } from './EmptyState.tsx';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { canBuyerCancelOrder, type SalesOrder, type SalesOrderStatus } from '../lib/salesN12.ts';
import { validateScentDnaData, type ScentDnaFamilyShare } from './ScentDnaVisualisation.tsx';
import { dominantFamilyShare, type DnaGenderLabel, type DnaLongevityBand } from '../lib/senstoriaN10.ts';
import type { UserProfile } from '../context/AuthContext.tsx';

import { ScentDnaDonut } from './ScentDnaDonut.tsx';

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
  user: UserProfile | null;
  orders: SalesOrder[];
  ordersLoaded: boolean;
  onBack: () => void;
  onNavigateToCatalog: () => void;
  onSignIn: () => void;
  onCancelOrder: (order: SalesOrder) => Promise<boolean>;
  onPayOrder: (order: SalesOrder) => void;
  locale: Locale;
}> = ({ user, orders, ordersLoaded, onBack, onNavigateToCatalog, onSignIn, onCancelOrder, onPayOrder, locale }) => {
  const t = translations[locale];
  const ot = t.ordersView;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SalesOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(false);
  const [cancelledToast, setCancelledToast] = useState(false);

  const statusLabel = (status: SalesOrderStatus): string =>
    status === 'baru' ? ot.statusBaru
    : status === 'dibayar' ? ot.statusDibayar
    : status === 'dikirim' ? ot.statusDikirim
    : status === 'selesai' ? ot.statusSelesai
    : ot.statusBatal;

  const selected = orders.find(o => o.id === selectedId) ?? null;

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError(false);
    const ok = await onCancelOrder(cancelTarget);
    setCancelling(false);
    if (ok) {
      setCancelTarget(null);
      setCancelledToast(true);
    } else {
      setCancelError(true);
    }
  };

  /* ── Detail satu pesanan ── */
  if (selected) {
    return (
      <div data-testid="orders-detail-screen" className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{ot.backToList}</span>
        </button>
        <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
          {ot.detailTitle}
        </h1>
        <div className="border border-hairline p-4 space-y-2">
          <div className="flex items-center justify-between text-[14px] text-ink">
            <span className="font-bold">{selected.order_number}</span>
            <span className={`text-[13px] font-bold ${selected.status === 'batal' ? 'text-error' : 'text-ink'}`}>
              {statusLabel(selected.status)}
            </span>
          </div>
          <p className="text-[13px] text-secondary">
            {ot.orderDateLabel}: {selected.created_at.slice(0, 10)}
          </p>
          <p className="text-[13px] text-secondary">
            {ot.paymentLabel}: {ot.midtransLabel}
            {selected.midtrans_transaction_id ? ` · ${selected.midtrans_transaction_id}` : ''}
          </p>
        </div>

        <div className="border border-hairline p-4 space-y-2">
          <h2 className="text-[14px] font-bold text-ink">{ot.itemsLabel}</h2>
          {selected.items.map(item => (
            <div key={item.perfume_id} className="flex items-center justify-between text-[14px] text-ink">
              <span>{item.brand} {item.name} — {item.size_ml} ml × {item.quantity}</span>
              <span className="font-mono tabular-nums">{formatCurrency(item.line_total_idr, locale)}</span>
            </div>
          ))}
        </div>

        <div className="border border-hairline p-4 space-y-2">
          <h2 className="text-[14px] font-bold text-ink">{ot.shippingLabel}</h2>
          <p className="text-[14px] text-ink">
            {selected.shipping.recipient_name} — {selected.shipping.address}, {selected.shipping.city} {selected.shipping.postal_code}
          </p>
          <p className="text-[13px] text-secondary">
            {selected.shipping.courier.toUpperCase()} · {selected.shipping.method === 'standard' ? 'Standard' : 'Express'}
          </p>
          <p className="text-[13px] text-secondary">
            {ot.trackingLabel}: {selected.tracking_number ?? ot.noTracking}
          </p>
        </div>

        <div className="border border-hairline p-4 space-y-2">
          <div className="flex items-center justify-between text-[14px] text-ink">
            <span>{t.bagView.subtotalLabel}</span>
            <span className="font-mono tabular-nums">{formatCurrency(selected.subtotal_idr, locale)}</span>
          </div>
          {selected.discount_idr > 0 && (
            <div className="flex items-center justify-between text-[14px] text-ink">
              <span>{`${t.checkoutView.discountLabel}${selected.promo_code ? ` (${selected.promo_code})` : ''}`}</span>
              <span className="font-mono tabular-nums">−{formatCurrency(selected.discount_idr, locale)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[14px] text-ink">
            <span>{t.bagView.deliveryLabel}</span>
            <span className="font-mono tabular-nums">{formatCurrency(selected.delivery_idr, locale)}</span>
          </div>
          <div className="flex items-center justify-between text-[14px] text-secondary">
            <span>{t.bagView.taxIncludedLabel}</span>
            <span className="font-mono tabular-nums">{formatCurrency(selected.tax_included_idr, locale)}</span>
          </div>
          <div className="flex items-center justify-between text-[16px] font-bold text-ink border-t border-hairline pt-2">
            <span>{t.bagView.totalLabel}</span>
            <span className="font-mono tabular-nums">{formatCurrency(selected.total_idr, locale)}</span>
          </div>
        </div>

        {selected.status === 'baru' && (
          <button
            type="button"
            onClick={() => onPayOrder(selected)}
            className="w-full min-h-[52px] rounded-full bg-bar hover:bg-ink text-paper text-[15px] font-bold transition active:scale-[0.97] cursor-pointer"
          >
            {t.checkoutView.submitButton}
          </button>
        )}
        {canBuyerCancelOrder(selected.status) && (
          <button
            type="button"
            onClick={() => setCancelTarget(selected)}
            className="w-full min-h-[48px] text-[14px] font-medium text-error hover:underline transition cursor-pointer"
          >
            {ot.cancelOrder}
          </button>
        )}

        <BottomSheetOrModal
          isOpen={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          locale={locale}
          title={ot.cancelConfirmTitle}
          maxWidth="max-w-md"
        >
          <div className="space-y-3">
            <p className="text-[14px] leading-[20px] text-secondary">
              {cancelTarget ? fmt(ot.cancelConfirmBody, cancelTarget.order_number) : ''}
            </p>
            {cancelError && (
              <p className="text-[13px] text-error" role="alert">{ot.cancelFailed}</p>
            )}
            <button
              type="button"
              onClick={confirmCancel}
              disabled={cancelling}
              className="w-full min-h-[48px] bg-error hover:bg-ink disabled:opacity-50 text-paper text-[14px] font-bold rounded-full transition cursor-pointer"
            >
              {cancelling ? t.checkoutView.submitting : ot.cancelConfirmButton}
            </button>
            <button
              type="button"
              onClick={() => setCancelTarget(null)}
              className="w-full min-h-[44px] text-[14px] font-medium text-ink hover:underline cursor-pointer"
            >
              {ot.cancelKeepButton}
            </button>
          </div>
        </BottomSheetOrModal>
      </div>
    );
  }

  /* ── Daftar pesanan ── */
  return (
    <div data-testid="orders-screen" className="space-y-6">
      <BackButton onBack={onBack} label={ot.backToProfile} />
      <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
        {ot.title}
      </h1>
      {cancelledToast && (
        <p className="text-[14px] text-success" role="status">{ot.cancelledToast}</p>
      )}
      {!user ? (
        <>
          <p className="text-[14px] leading-[20px] text-secondary">{ot.signInRequired}</p>
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center justify-center min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-bar hover:bg-ink text-paper transition active:scale-[0.97] cursor-pointer"
          >
            {ot.signInButton}
          </button>
        </>
      ) : !ordersLoaded ? (
        <p className="text-[14px] text-secondary">{t.common.loading}</p>
      ) : orders.length === 0 ? (
        <EmptyState
          title={ot.emptyTitle}
          body={ot.emptyBody}
          ctaLabel={ot.exploreCatalog}
          onCtaClick={onNavigateToCatalog}
          iconType="shelf"
        />
      ) : (
        <ul className="divide-y divide-hairline border-y border-hairline">
          {orders.map(order => (
            <li key={order.id} data-testid="order-row">
              <button
                type="button"
                onClick={() => setSelectedId(order.id)}
                className="flex w-full items-center justify-between gap-3 py-4 text-left min-h-[48px] cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-[14px] leading-[20px] font-bold text-ink font-mono">{order.order_number}</span>
                  <span className="block text-[13px] leading-[18px] text-muted">
                    {order.created_at.slice(0, 10)} · {order.items.length} item · {formatCurrency(order.total_idr, locale)}
                  </span>
                </span>
                <span className={`flex-none text-[13px] font-bold ${order.status === 'batal' ? 'text-error' : 'text-ink'}`}>
                  {statusLabel(order.status)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
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

          <ScentDnaDonut familyBreakdown={familyBreakdown} />

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
