import React, { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { translations, formatCurrency, fmt, type Locale } from '../lib/i18n.ts';
import { PUBLISHED_PERFUMES } from '../data/seedPerfumes.ts';
import { Bottle } from './Bottle.tsx';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { EmptyState } from './EmptyState.tsx';
import {
  DELIVERY_ESTIMATES,
  SALES_BAG_QUANTITIES,
  SALES_COURIERS,
  SALES_DELIVERY_METHODS,
  computeSalesTotals,
  isValidPostalCode,
  resolveSalesBagPerfumes,
  salesBagUnitCount,
  type PromoCode,
  type SalesBag,
  type SalesBagItem,
  type SalesCourier,
  type SalesDeliveryMethod,
  type ShippingQuote,
} from '../lib/salesN12.ts';

interface BagViewProps {
  locale: Locale;
  bag: SalesBag;
  promo: PromoCode | null;
  promoError: boolean;
  onApplyPromo: (code: string) => void;
  onRemovePromo: () => void;
  deliveryCourier: SalesCourier;
  deliveryMethod: SalesDeliveryMethod;
  postalCode: string;
  shippingQuote: ShippingQuote | null;
  shippingConfigured: boolean;
  onSaveDelivery: (postalCode: string, courier: SalesCourier, method: SalesDeliveryMethod) => void;
  onBack: () => void;
  onExploreCatalog: () => void;
  onSetQuantity: (perfumeId: string, quantity: number) => void;
  onRemove: (perfumeId: string) => void;
  onCheckout: () => void;
}

/**
 * Fase N12 (gerbang S3, F1–F3) — layar Bag: belanja botol full-size.
 * BUKAN keranjang decant (/keranjang, N9): Bag ini membawa harga nyata
 * dari seed, rincian Subtotal / Ongkir / Pajak-termasuk / Total, dan
 * tombol Checkout. Tab bar TIDAK mendapat slot baru (5 slot terkunci
 * keputusan N0/N6; preseden N9: keranjang adalah layar dalam) — Bag
 * dibuka dari tombol Bag di header (dengan badge jumlah) dan dari Detail.
 *
 * Kejujuran: TANPA "Pick-Up / Find a Store" (tidak ada toko fisik).
 * TANPA angka stok. Ongkir HANYA dari tarif live RajaOngkir — tanpa
 * endpoint, baris ongkir menampilkan "Akan dihitung" dan total
 * menampilkan catatan (tidak ditebak). Pajak yang sudah termasuk
 * ditampilkan sebagai informasi (11/111 dari subtotal), bukan tambahan.
 */
export function BagView({
  locale,
  bag,
  promo,
  promoError,
  onApplyPromo,
  onRemovePromo,
  deliveryCourier,
  deliveryMethod,
  postalCode,
  shippingQuote,
  shippingConfigured,
  onSaveDelivery,
  onBack,
  onExploreCatalog,
  onSetQuantity,
  onRemove,
  onCheckout,
}: BagViewProps) {
  const t = translations[locale].bagView;
  const resolved = resolveSalesBagPerfumes(bag, PUBLISHED_PERFUMES);
  const totals = computeSalesTotals(
    resolved.map(({ item, perfume }) => ({ unitPriceIdr: perfume.reference_price_idr, quantity: item.quantity })),
    shippingQuote?.costIdr ?? null,
    promo,
  );

  // Sheet F2: ubah jumlah satu baris (1–4) atau hapus baris itu.
  const [sheetLine, setSheetLine] = useState<{ item: SalesBagItem; name: string; brand: string } | null>(null);
  const [sheetQuantity, setSheetQuantity] = useState(1);

  // Sheet F3: pengiriman (kode pos + kurir + Standard/Express).
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [draftPostalCode, setDraftPostalCode] = useState(postalCode);
  const [draftCourier, setDraftCourier] = useState<SalesCourier>(deliveryCourier);
  const [draftMethod, setDraftMethod] = useState<SalesDeliveryMethod>(deliveryMethod);
  const [postalError, setPostalError] = useState(false);

  // Kode promo (F4): field + validasi ke Firestore via App.
  const [promoInput, setPromoInput] = useState('');
  const [promoOpen, setPromoOpen] = useState(false);

  const openQuantitySheet = (item: SalesBagItem, name: string, brand: string) => {
    setSheetQuantity(item.quantity);
    setSheetLine({ item, name, brand });
  };

  const openDeliverySheet = () => {
    setDraftPostalCode(postalCode);
    setDraftCourier(deliveryCourier);
    setDraftMethod(deliveryMethod);
    setPostalError(false);
    setDeliveryOpen(true);
  };

  const saveDelivery = () => {
    if (!isValidPostalCode(draftPostalCode)) {
      setPostalError(true);
      return;
    }
    onSaveDelivery(draftPostalCode.trim(), draftCourier, draftMethod);
    setDeliveryOpen(false);
  };

  const estimate = DELIVERY_ESTIMATES[deliveryMethod];
  const ct = translations[locale].checkoutView;
  const deliveryLabel = postalCode
    ? `${deliveryCourier.toUpperCase()} · ${deliveryMethod === 'standard' ? ct.methodStandard : ct.methodExpress}`
    : null;

  return (
    <div data-testid="bag-screen" className="space-y-8">
      {/* Header hitam — pola yang sama dengan header Coba Dulu / Keranjang decant. */}
      <div className="bg-bar border border-hairline p-6 md:p-8 space-y-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.backToCatalog}
          className="flex items-center gap-2 text-paper/80 hover:text-paper text-sm font-medium min-h-[44px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t.backLabel}
        </button>
        <h1 className="font-display text-paper leading-tight">{t.title}</h1>
        <p className="text-sm text-paper max-w-2xl leading-relaxed">{t.subtitle}</p>
        {resolved.length > 0 && (
          <p className="text-sm text-paper/80">{salesBagUnitCount(bag)} item</p>
        )}
      </div>

      {resolved.length === 0 ? (
        <EmptyState
          title={t.emptyTitle}
          body={t.emptyBody}
          ctaLabel={t.exploreCatalog}
          onCtaClick={onExploreCatalog}
          iconType="bag"
        />
      ) : (
        <div className="space-y-6">
          <ul className="divide-y divide-hairline border-y border-hairline">
            {resolved.map(({ item, perfume }) => (
              <li key={item.perfumeId} data-testid="bag-line" className="flex gap-4 py-4">
                <div className="w-20 h-20 shrink-0 bg-surface border border-hairline flex items-center justify-center p-2">
                  {perfume.image_url ? (
                    <img
                      src={perfume.image_url}
                      alt={`${perfume.brand} ${perfume.name}`}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <Bottle
                      fragranceId={perfume.id}
                      name={perfume.name}
                      brand={perfume.brand}
                      size="sm"
                      showFill={false}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[14px] leading-[20px] text-ink">{perfume.brand}</p>
                  <p className="text-[16px] leading-[22px] font-bold text-ink">{perfume.name}</p>
                  <p className="text-sm text-secondary">{t.sizeLabel.replace('{0}', String(perfume.reference_price_size_ml))}</p>
                  <p className="text-[14px] leading-[20px] font-bold text-ink">
                    {formatCurrency(perfume.reference_price_idr * item.quantity, locale)}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => openQuantitySheet(item, perfume.name, perfume.brand)}
                      aria-label={`${t.quantityLabel.replace('{0}', String(item.quantity))} — ${perfume.brand} ${perfume.name}`}
                      className="min-h-[44px] px-4 border border-hairline bg-card text-sm font-medium text-ink hover:border-ink transition cursor-pointer"
                    >
                      {t.quantityLabel.replace('{0}', String(item.quantity))}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(item.perfumeId)}
                      aria-label={`${t.removeLabel} — ${perfume.brand} ${perfume.name}`}
                      className="min-h-[44px] px-3 text-sm font-medium text-error hover:underline transition cursor-pointer"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Kode promo (F4) — validasi ke Firestore, tanpa kode demo. */}
          <div className="border border-hairline p-4 space-y-3">
            <button
              type="button"
              onClick={() => setPromoOpen(v => !v)}
              aria-expanded={promoOpen}
              className="text-[14px] font-bold text-ink min-h-[44px] cursor-pointer"
            >
              {t.promoTitle} +
            </button>
            {promoOpen && (
              promo ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] text-ink" role="status">{fmt(t.promoApplied, promo.code)}</p>
                  <button
                    type="button"
                    onClick={onRemovePromo}
                    className="min-h-[44px] px-3 text-[14px] font-medium text-error hover:underline cursor-pointer"
                  >
                    {t.promoRemove}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <label htmlFor="bag-promo-input" className="sr-only">{t.promoTitle}</label>
                    <input
                      id="bag-promo-input"
                      type="text"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value)}
                      placeholder={t.promoPlaceholder}
                      autoCapitalize="characters"
                      className="flex-1 min-h-[48px] rounded-full border border-border bg-paper px-5 text-[14px] text-ink placeholder:text-muted focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
                    />
                    <button
                      type="button"
                      onClick={() => onApplyPromo(promoInput)}
                      disabled={!promoInput.trim()}
                      className="min-h-[48px] rounded-full bg-bar hover:bg-ink disabled:opacity-50 text-paper px-5 text-[14px] font-bold transition cursor-pointer"
                    >
                      {t.promoApply}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[13px] text-error" role="alert">{t.promoNotFound}</p>
                  )}
                </div>
              )
            )}
          </div>

          {/* Kartu Delivery (F1/F3). */}
          <div className="border border-hairline p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[14px] font-bold text-ink">{t.deliveryTitle}</h2>
              <button
                type="button"
                onClick={openDeliverySheet}
                className="min-h-[44px] px-3 text-[14px] font-medium text-ink underline cursor-pointer"
              >
                {deliveryLabel ?? t.deliveryNotSet}
              </button>
            </div>
            {deliveryLabel && (
              <p className="text-[13px] text-secondary">
                {fmt(t.deliveryEstimate, String(estimate.minDays), String(estimate.maxDays))}
                {shippingQuote ? ` · ${formatCurrency(shippingQuote.costIdr, locale)}` : ''}
              </p>
            )}
            {!shippingConfigured && (
              <p className="text-[13px] text-muted">{t.deliveryPending}</p>
            )}
          </div>

          {/* Rincian (F1): Subtotal / Ongkir / Pajak-termasuk / Total. */}
          <div className="border border-hairline p-4 space-y-2" aria-label={t.totalLabel}>
            <div className="flex items-center justify-between text-[14px] text-ink">
              <span>{t.subtotalLabel}</span>
              <span className="font-mono tabular-nums">{formatCurrency(totals.subtotalIdr, locale)}</span>
            </div>
            {totals.discountIdr > 0 && promo && (
              <div className="flex items-center justify-between text-[14px] text-ink">
                <span>{`${t.promoTitle} (${promo.code})`}</span>
                <span className="font-mono tabular-nums">−{formatCurrency(totals.discountIdr, locale)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[14px] text-ink">
              <span>{t.deliveryLabel}</span>
              <span className="font-mono tabular-nums">
                {totals.deliveryIdr === null ? t.deliveryPending : formatCurrency(totals.deliveryIdr, locale)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[14px] text-secondary">
              <span>{t.taxIncludedLabel}</span>
              <span className="font-mono tabular-nums">{formatCurrency(totals.taxIncludedIdr, locale)}</span>
            </div>
            <p className="text-[12px] text-muted">{t.taxIncludedNote}</p>
            <div className="flex items-center justify-between text-[16px] font-bold text-ink border-t border-hairline pt-2">
              <span>{t.totalLabel}</span>
              <span className="font-mono tabular-nums">
                {totals.totalIdr === null ? '—' : formatCurrency(totals.totalIdr, locale)}
              </span>
            </div>
            {totals.totalIdr === null && (
              <p className="text-[13px] text-secondary">{t.totalPendingNote}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onCheckout}
            className="w-full min-h-[52px] rounded-full bg-bar hover:bg-ink text-paper text-[15px] font-bold transition active:scale-[0.97] cursor-pointer"
          >
            {t.checkoutButton}
          </button>
        </div>
      )}

      {/* ── FASE N12 (F2): SHEET JUMLAH ── */}
      <BottomSheetOrModal
        isOpen={!!sheetLine}
        onClose={() => setSheetLine(null)}
        locale={locale}
        title={sheetLine ? `${sheetLine.brand} ${sheetLine.name}` : ''}
        maxWidth="max-w-md"
      >
        <div data-testid="bag-quantity-sheet" className="space-y-3">
          <div className="flex gap-2" role="group" aria-label={t.quantityLabel.replace('{0}', String(sheetQuantity))}>
            {SALES_BAG_QUANTITIES.map(q => (
              <button
                key={q}
                type="button"
                aria-pressed={sheetQuantity === q}
                onClick={() => setSheetQuantity(q)}
                className={`flex-1 min-h-[48px] rounded-full border text-[14px] font-medium transition ${sheetQuantity === q ? 'bg-bar text-paper border-bar' : 'border-border bg-card text-ink hover:border-bar'}`}
              >
                {q}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!sheetLine) return;
              onSetQuantity(sheetLine.item.perfumeId, sheetQuantity);
              setSheetLine(null);
            }}
            className="w-full min-h-[48px] bg-bar hover:bg-ink text-paper text-[14px] font-medium rounded-full transition"
          >
            {t.doneButton}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!sheetLine) return;
              onRemove(sheetLine.item.perfumeId);
              setSheetLine(null);
            }}
            className="w-full min-h-[44px] text-[14px] font-medium text-error hover:underline transition cursor-pointer"
          >
            {t.removeLabel}
          </button>
        </div>
      </BottomSheetOrModal>

      {/* ── FASE N12 (F3): SHEET PENGIRIMAN ── */}
      <BottomSheetOrModal
        isOpen={deliveryOpen}
        onClose={() => setDeliveryOpen(false)}
        locale={locale}
        title={t.deliveryTitle}
        maxWidth="max-w-md"
      >
        <div data-testid="bag-delivery-sheet" className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="bag-postal-code" className="text-[14px] font-bold text-ink">
              {translations[locale].checkoutView.postalCode}
            </label>
            <input
              id="bag-postal-code"
              type="text"
              inputMode="numeric"
              value={draftPostalCode}
              onChange={e => {
                setDraftPostalCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5));
                setPostalError(false);
              }}
              placeholder={translations[locale].checkoutView.postalCodePlaceholder}
              className="w-full min-h-[48px] rounded-full border border-border bg-paper px-5 text-[14px] text-ink placeholder:text-muted focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
            />
            {postalError && (
              <p className="text-[13px] text-error" role="alert">
                {translations[locale].checkoutView.postalCodePlaceholder}
              </p>
            )}
          </div>

          <fieldset>
            <legend className="text-[14px] font-bold text-ink">{translations[locale].checkoutView.courierTitle}</legend>
            <div className="flex gap-2 mt-2" role="radiogroup" aria-label={translations[locale].checkoutView.courierTitle}>
              {SALES_COURIERS.map(c => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={draftCourier === c}
                  onClick={() => setDraftCourier(c)}
                  className={`flex-1 min-h-[48px] rounded-full border text-[14px] font-bold transition ${draftCourier === c ? 'bg-bar text-paper border-bar' : 'border-border bg-card text-ink hover:border-bar'}`}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[14px] font-bold text-ink">{translations[locale].checkoutView.methodTitle}</legend>
            <div className="flex flex-col gap-2 mt-2" role="radiogroup" aria-label={translations[locale].checkoutView.methodTitle}>
              {SALES_DELIVERY_METHODS.map(m => {
                const est = DELIVERY_ESTIMATES[m];
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={draftMethod === m}
                    onClick={() => setDraftMethod(m)}
                    className={`flex items-center justify-between min-h-[48px] rounded-full border px-5 text-[14px] font-bold transition ${draftMethod === m ? 'bg-bar text-paper border-bar' : 'border-border bg-card text-ink hover:border-bar'}`}
                  >
                    <span>{m === 'standard' ? translations[locale].checkoutView.methodStandard : translations[locale].checkoutView.methodExpress}</span>
                    <span className="text-[13px] font-medium">
                      {fmt(t.deliveryEstimate, String(est.minDays), String(est.maxDays))}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={saveDelivery}
            className="w-full min-h-[48px] bg-bar hover:bg-ink text-paper text-[14px] font-medium rounded-full transition"
          >
            {t.doneButton}
          </button>
        </div>
      </BottomSheetOrModal>
    </div>
  );
}
