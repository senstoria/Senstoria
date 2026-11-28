import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { translations, formatCurrency, fmt, type Locale } from '../lib/i18n.ts';
import { PUBLISHED_PERFUMES } from '../data/seedPerfumes.ts';
import {
  DELIVERY_ESTIMATES,
  buildReceiptText,
  computeSalesTotals,
  resolveSalesBagPerfumes,
  validateShippingAddress,
  type PromoCode,
  type SalesBag,
  type SalesCourier,
  type SalesDeliveryMethod,
  type SalesOrder,
  type ShippingAddressInput,
  type ShippingQuote,
} from '../lib/salesN12.ts';
import type { UserProfile } from '../context/AuthContext.tsx';

export interface PlaceOrderInput {
  shipping: ShippingAddressInput;
  billingSameAsShipping: boolean;
  billingAddress: ShippingAddressInput | null;
}

interface CheckoutViewProps {
  locale: Locale;
  user: UserProfile | null;
  bag: SalesBag;
  promo: PromoCode | null;
  promoError: boolean;
  onApplyPromo: (code: string) => void;
  onRemovePromo: () => void;
  deliveryCourier: SalesCourier;
  deliveryMethod: SalesDeliveryMethod;
  postalCode: string;
  shippingQuote: ShippingQuote | null;
  midtransConfigured: boolean;
  shippingConfigured: boolean;
  placedOrder: SalesOrder | null;
  onBack: () => void;
  onSignIn: () => void;
  onViewOrders: () => void;
  onPlaceOrder: (input: PlaceOrderInput) => Promise<{ ok: boolean; error?: string }>;
}

const emptyAddress = (postalCode: string): ShippingAddressInput => ({
  recipientName: '',
  phone: '',
  address: '',
  city: '',
  postalCode,
});

/**
 * Fase N12 (gerbang S3, F4/F6/F7/F8) — checkout + layar sukses.
 * Alamat pengiriman, pembayaran (Midtrans), kode promo, ringkasan,
 * alamat penagihan, "Kirim Pembayaran" + spinner "Memproses…".
 *
 * Gate kejujuran: bila Midtrans BELUM terkonfigurasi (tanpa client key
 * atau tanpa endpoint token server), tombol pembayaran NONAKTIF dengan
 * copy jujur dan checkout TIDAK membuat pesanan apa pun. Bila tarif
 * ongkir belum terhubung, total akhir tidak ada — checkout juga
 * terkunci (ongkir tidak ditebak). Layar sukses (F7/F8) hanya muncul
 * setelah pembayaran Midtrans NYATA sukses — tidak ada sukses palsu.
 * Satu nomor pesanan yang konsisten; angka beraritmetika benar.
 */
export function CheckoutView({
  locale,
  user,
  bag,
  promo,
  promoError,
  onApplyPromo,
  onRemovePromo,
  deliveryCourier,
  deliveryMethod,
  postalCode,
  shippingQuote,
  midtransConfigured,
  shippingConfigured,
  placedOrder,
  onBack,
  onSignIn,
  onViewOrders,
  onPlaceOrder,
}: CheckoutViewProps) {
  const t = translations[locale].checkoutView;
  const resolved = resolveSalesBagPerfumes(bag, PUBLISHED_PERFUMES);
  const totals = computeSalesTotals(
    resolved.map(({ item, perfume }) => ({ unitPriceIdr: perfume.reference_price_idr, quantity: item.quantity })),
    shippingQuote?.costIdr ?? null,
    promo,
  );

  const [shipping, setShipping] = useState<ShippingAddressInput>(() => emptyAddress(postalCode));
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<ShippingAddressInput>(() => emptyAddress(postalCode));
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [promoInput, setPromoInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit =
    midtransConfigured &&
    shippingConfigured &&
    totals.totalIdr !== null &&
    resolved.length > 0 &&
    !submitting;

  const submit = async () => {
    const invalid = validateShippingAddress(shipping);
    const billingInvalid = billingSame ? [] : validateShippingAddress(billing);
    const allInvalid = [...new Set([...invalid, ...billingInvalid.map(f => `billing_${f}`)])];
    setInvalidFields(allInvalid);
    if (invalid.length > 0 || billingInvalid.length > 0) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await onPlaceOrder({
      shipping,
      billingSameAsShipping: billingSame,
      billingAddress: billingSame ? null : billing,
    });
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error ?? t.orderFailed);
    }
  };

  const downloadReceipt = () => {
    if (!placedOrder) return;
    const text = buildReceiptText(placedOrder, locale);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `senstoria-struk-${placedOrder.order_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Layar sukses (F7/F8) — hanya setelah pembayaran nyata sukses. ── */
  if (placedOrder) {
    const estimate = DELIVERY_ESTIMATES[placedOrder.shipping.method];
    return (
      <div data-testid="checkout-success-screen" className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3 pt-6">
          <CheckCircle2 className="w-16 h-16 text-success" aria-hidden="true" />
          <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
            {t.successTitle}
          </h1>
          <p className="text-[14px] leading-[20px] text-secondary max-w-md">{t.successBody}</p>
        </div>

        <div className="border border-hairline p-4 space-y-2">
          <div className="flex items-center justify-between text-[14px] text-ink">
            <span className="font-bold">{t.orderNumberLabel}</span>
            <span className="font-mono tabular-nums" data-testid="success-order-number">{placedOrder.order_number}</span>
          </div>
          <p className="text-[13px] text-secondary">{fmt(t.confirmationEmailNote, placedOrder.buyer_email)}</p>
          <p className="text-[13px] text-secondary">
            {placedOrder.shipping.recipient_name} — {placedOrder.shipping.address}, {placedOrder.shipping.city} {placedOrder.shipping.postal_code}
          </p>
          <p className="text-[13px] text-secondary">
            {placedOrder.shipping.courier.toUpperCase()} · {fmt(t.estimateLabel, String(estimate.minDays), String(estimate.maxDays))}
          </p>
        </div>

        <div className="border border-hairline p-4 space-y-2">
          {placedOrder.items.map(item => (
            <div key={item.perfume_id} className="flex items-center justify-between text-[14px] text-ink">
              <span>{item.brand} {item.name} — {item.size_ml} ml × {item.quantity}</span>
              <span className="font-mono tabular-nums">{formatCurrency(item.line_total_idr, locale)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-[14px] text-ink border-t border-hairline pt-2">
            <span>{t.subtotalLabel}</span>
            <span className="font-mono tabular-nums">{formatCurrency(placedOrder.subtotal_idr, locale)}</span>
          </div>
          {placedOrder.discount_idr > 0 && (
            <div className="flex items-center justify-between text-[14px] text-ink">
              <span>{`${t.discountLabel}${placedOrder.promo_code ? ` (${placedOrder.promo_code})` : ''}`}</span>
              <span className="font-mono tabular-nums">−{formatCurrency(placedOrder.discount_idr, locale)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[14px] text-ink">
            <span>{t.deliveryLabel}</span>
            <span className="font-mono tabular-nums">{formatCurrency(placedOrder.delivery_idr, locale)}</span>
          </div>
          <div className="flex items-center justify-between text-[14px] text-secondary">
            <span>{t.taxIncludedLabel}</span>
            <span className="font-mono tabular-nums">{formatCurrency(placedOrder.tax_included_idr, locale)}</span>
          </div>
          <div className="flex items-center justify-between text-[16px] font-bold text-ink border-t border-hairline pt-2">
            <span>{t.totalLabel}</span>
            <span className="font-mono tabular-nums">{formatCurrency(placedOrder.total_idr, locale)}</span>
          </div>
        </div>

        <p className="text-[13px] text-secondary">{t.returnPolicyNote}</p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onViewOrders}
            className="w-full min-h-[52px] rounded-full bg-bar hover:bg-ink text-paper text-[15px] font-bold transition active:scale-[0.97] cursor-pointer"
          >
            {t.viewOrders}
          </button>
          <button
            type="button"
            onClick={downloadReceipt}
            className="w-full min-h-[48px] rounded-full border border-border bg-paper text-ink text-[14px] font-bold transition hover:border-bar cursor-pointer"
          >
            {t.saveReceipt}
          </button>
        </div>
      </div>
    );
  }

  /* ── Checkout butuh akun (pesanan terikat ke pembeli). ── */
  if (!user) {
    return (
      <div data-testid="checkout-signin-required" className="space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.backToBag}</span>
        </button>
        <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">{t.signInRequired}</h1>
        <p className="text-[14px] leading-[20px] text-secondary">{t.signInRequiredBody}</p>
        <button
          type="button"
          onClick={onSignIn}
          className="inline-flex items-center justify-center min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-bar hover:bg-ink text-paper transition active:scale-[0.97] cursor-pointer"
        >
          {t.signInButton}
        </button>
      </div>
    );
  }

  const field = (
    id: string,
    label: string,
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    invalidKey: string,
    inputMode?: 'numeric' | 'tel',
  ) => (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[14px] font-bold text-ink">{label}</label>
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalidFields.includes(invalidKey)}
        className="w-full min-h-[48px] rounded-full border border-border bg-paper px-5 text-[14px] text-ink placeholder:text-muted focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
      />
      {invalidFields.includes(invalidKey) && (
        <p className="text-[13px] text-error" role="alert">{t.fieldRequired}</p>
      )}
    </div>
  );

  const estimate = DELIVERY_ESTIMATES[deliveryMethod];

  return (
    <div data-testid="checkout-screen" className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.backToBag}</span>
      </button>
      <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">{t.title}</h1>

      {/* Alamat pengiriman (F4). */}
      <section aria-label={t.addressTitle} className="space-y-3 border border-hairline p-4">
        <h2 className="text-[16px] font-bold text-ink">{t.addressTitle}</h2>
        {field('co-name', t.recipientName, t.recipientNamePlaceholder, shipping.recipientName, v => setShipping(s => ({ ...s, recipientName: v })), 'recipientName')}
        {field('co-phone', t.phone, t.phonePlaceholder, shipping.phone, v => setShipping(s => ({ ...s, phone: v })), 'phone', 'tel')}
        {field('co-address', t.address, t.addressPlaceholder, shipping.address, v => setShipping(s => ({ ...s, address: v })), 'address')}
        {field('co-city', t.city, t.cityPlaceholder, shipping.city, v => setShipping(s => ({ ...s, city: v })), 'city')}
        {field('co-postal', t.postalCode, t.postalCodePlaceholder, shipping.postalCode, v => setShipping(s => ({ ...s, postalCode: v.replace(/[^0-9]/g, '').slice(0, 5) })), 'postalCode', 'numeric')}
        <div className="text-[14px] text-ink pt-1">
          <span className="font-bold">{t.courierTitle}: </span>
          {deliveryCourier.toUpperCase()} · {deliveryMethod === 'standard' ? t.methodStandard : t.methodExpress} · {fmt(t.estimateLabel, String(estimate.minDays), String(estimate.maxDays))}
        </div>
      </section>

      {/* Pembayaran (F4) — Midtrans, ter-gate. */}
      <section aria-label={t.paymentTitle} className="space-y-3 border border-hairline p-4">
        <h2 className="text-[16px] font-bold text-ink">{t.paymentTitle}</h2>
        <p className="text-[14px] text-secondary leading-relaxed">{t.paymentMethodsNote}</p>
        {!midtransConfigured && (
          <div className="border border-hairline bg-surface p-4 space-y-1" role="status">
            <p className="text-[14px] font-bold text-ink">{t.paymentNotActive}</p>
            <p className="text-[13px] text-secondary leading-relaxed">{t.paymentNotActiveBody}</p>
          </div>
        )}
        {!shippingConfigured && (
          <div className="border border-hairline bg-surface p-4 space-y-1" role="status">
            <p className="text-[14px] font-bold text-ink">{t.shippingNotActive}</p>
            <p className="text-[13px] text-secondary leading-relaxed">{t.shippingNotActiveBody}</p>
          </div>
        )}
      </section>

      {/* Kode promo (F4). */}
      <section aria-label={t.promoTitle} className="space-y-3 border border-hairline p-4">
        <h2 className="text-[16px] font-bold text-ink">{t.promoTitle}</h2>
        {promo ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] text-ink" role="status">{fmt(t.promoApplied, promo.code)}</p>
            <button
              type="button"
              onClick={onRemovePromo}
              className="min-h-[44px] px-3 text-[14px] font-medium text-error hover:underline cursor-pointer"
            >
              {translations[locale].bagView.promoRemove}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <label htmlFor="co-promo-input" className="sr-only">{t.promoTitle}</label>
              <input
                id="co-promo-input"
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
        )}
      </section>

      {/* Ringkasan (F4/F8). */}
      <section aria-label={t.summaryTitle} className="space-y-2 border border-hairline p-4">
        <h2 className="text-[16px] font-bold text-ink">{t.summaryTitle}</h2>
        {resolved.map(({ item, perfume }) => (
          <div key={item.perfumeId} className="flex items-center justify-between text-[14px] text-ink">
            <span>{perfume.brand} {perfume.name} — {perfume.reference_price_size_ml} ml × {item.quantity}</span>
            <span className="font-mono tabular-nums">{formatCurrency(perfume.reference_price_idr * item.quantity, locale)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-[14px] text-ink border-t border-hairline pt-2">
          <span>{t.subtotalLabel}</span>
          <span className="font-mono tabular-nums">{formatCurrency(totals.subtotalIdr, locale)}</span>
        </div>
        {totals.discountIdr > 0 && promo && (
          <div className="flex items-center justify-between text-[14px] text-ink">
            <span>{`${t.discountLabel} (${promo.code})`}</span>
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
        <div className="flex items-center justify-between text-[16px] font-bold text-ink border-t border-hairline pt-2">
          <span>{t.totalLabel}</span>
          <span className="font-mono tabular-nums">
            {totals.totalIdr === null ? '—' : formatCurrency(totals.totalIdr, locale)}
          </span>
        </div>
      </section>

      {/* Alamat penagihan (F6). */}
      <section aria-label={t.billingTitle} className="space-y-3 border border-hairline p-4">
        <h2 className="text-[16px] font-bold text-ink">{t.billingTitle}</h2>
        <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            checked={billingSame}
            onChange={e => setBillingSame(e.target.checked)}
            className="w-5 h-5 accent-black"
          />
          <span className="text-[14px] font-medium text-ink">{t.billingSameAsShipping}</span>
        </label>
        {!billingSame && (
          <div className="space-y-3">
            {field('co-b-name', t.recipientName, t.recipientNamePlaceholder, billing.recipientName, v => setBilling(s => ({ ...s, recipientName: v })), 'billing_recipientName')}
            {field('co-b-phone', t.phone, t.phonePlaceholder, billing.phone, v => setBilling(s => ({ ...s, phone: v })), 'billing_phone', 'tel')}
            {field('co-b-address', t.address, t.addressPlaceholder, billing.address, v => setBilling(s => ({ ...s, address: v })), 'billing_address')}
            {field('co-b-city', t.city, t.cityPlaceholder, billing.city, v => setBilling(s => ({ ...s, city: v })), 'billing_city')}
            {field('co-b-postal', t.postalCode, t.postalCodePlaceholder, billing.postalCode, v => setBilling(s => ({ ...s, postalCode: v.replace(/[^0-9]/g, '').slice(0, 5) })), 'billing_postalCode', 'numeric')}
          </div>
        )}
      </section>

      {submitError && (
        <p className="text-[14px] text-error" role="alert">{submitError}</p>
      )}

      {/* Kirim Pembayaran (F6) — nonaktif selama gate tertutup. */}
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
        className="w-full min-h-[52px] rounded-full bg-bar hover:bg-ink disabled:opacity-50 text-paper text-[15px] font-bold transition active:scale-[0.97] cursor-pointer disabled:cursor-not-allowed"
      >
        {submitting ? t.submitting : t.submitButton}
      </button>
      {!canSubmit && !submitting && (
        <p className="text-[13px] text-secondary text-center">
          {!midtransConfigured ? t.paymentNotActive : !shippingConfigured ? t.shippingNotActive : ''}
        </p>
      )}
    </div>
  );
}
