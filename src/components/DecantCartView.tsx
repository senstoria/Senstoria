import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { translations, type Locale } from '../lib/i18n.ts';
import { PUBLISHED_PERFUMES } from '../data/seedPerfumes.ts';
import { Bottle } from './Bottle.tsx';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { EmptyState } from './EmptyState.tsx';
import {
  DECANT_CART_QUANTITIES,
  cartUnitCount,
  resolveDecantCartPerfumes,
  type DecantCart,
  type DecantCartItem,
} from '../lib/decantCartN9.ts';

interface DecantCartViewProps {
  locale: Locale;
  cart: DecantCart;
  onBack: () => void;
  onExploreTryItFirst: () => void;
  onSetQuantity: (perfumeId: string, sizeMl: 5 | 10, quantity: number) => void;
  onRemove: (perfumeId: string, sizeMl: 5 | 10) => void;
}

/**
 * Fase N9 (P4): layar Keranjang decant — pernyataan niat, bukan transaksi.
 * - Menampilkan decant yang ditandai: foto, brand, nama, ukuran 5/10 ml,
 *   jumlah (1–4, diubah lewat sheet F2), dan baris "Harga diumumkan saat
 *   peluncuran" sebagai pengganti harga.
 * - TANPA tombol checkout, TANPA pembayaran, TANPA total, TANPA stok,
 *   TANPA countdown. Catatan niat tertulis di layar.
 * - Baris yang parfumnya tidak lagi published dibuang (tidak pernah
 *   menampilkan parfum karangan).
 */
export function DecantCartView({
  locale,
  cart,
  onBack,
  onExploreTryItFirst,
  onSetQuantity,
  onRemove,
}: DecantCartViewProps) {
  const t = translations[locale].decantCartView;
  const tryT = translations[locale].tryItFirstView;
  const resolved = resolveDecantCartPerfumes(cart, PUBLISHED_PERFUMES);

  // Sheet F2: ubah jumlah satu baris (1–4) atau hapus baris itu.
  const [sheetLine, setSheetLine] = useState<{ item: DecantCartItem; name: string; brand: string } | null>(null);
  const [sheetQuantity, setSheetQuantity] = useState(1);

  const openQuantitySheet = (item: DecantCartItem, name: string, brand: string) => {
    setSheetQuantity(item.quantity);
    setSheetLine({ item, name, brand });
  };

  const saveQuantity = () => {
    if (!sheetLine) return;
    onSetQuantity(sheetLine.item.perfumeId, sheetLine.item.sizeMl, sheetQuantity);
    setSheetLine(null);
  };

  const removeLine = () => {
    if (!sheetLine) return;
    onRemove(sheetLine.item.perfumeId, sheetLine.item.sizeMl);
    setSheetLine(null);
  };

  return (
    <div data-testid="decant-cart-screen" className="space-y-8">
      {/* Header hitam — pola yang sama dengan header Coba Dulu. */}
      <div className="bg-bar border border-hairline p-6 md:p-8 space-y-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.backToTryItFirst}
          className="flex items-center gap-2 text-paper/80 hover:text-paper text-sm font-medium min-h-[44px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t.backLabel}
        </button>
        <h1 className="font-display text-paper leading-tight">{t.title}</h1>
        <p className="text-sm text-paper max-w-2xl leading-relaxed">{t.subtitle}</p>
        {resolved.length > 0 && (
          <p className="text-sm text-paper/80">{cartUnitCount(cart)} decant</p>
        )}
      </div>

      {resolved.length === 0 ? (
        <EmptyState
          title={t.emptyTitle}
          body={t.emptyBody}
          ctaLabel={t.exploreTryItFirst}
          onCtaClick={onExploreTryItFirst}
          iconType="bottle"
        />
      ) : (
        <div className="space-y-4">
          <ul className="divide-y divide-hairline border-y border-hairline">
            {resolved.map(({ item, perfume }) => (
              <li key={`${item.perfumeId}:${item.sizeMl}`} data-testid="decant-cart-line" className="flex gap-4 py-4">
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
                  <p className="text-sm text-secondary">{t.sizeLabel.replace('{0}', String(item.sizeMl))}</p>
                  {/* Pengganti harga: baris jujur, bukan angka. */}
                  <p className="text-sm font-medium text-ink">{t.priceNote}</p>
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
                      onClick={() => onRemove(item.perfumeId, item.sizeMl)}
                      aria-label={`${t.removeLabel} — ${perfume.brand} ${perfume.name}`}
                      className="min-h-[44px] px-3 text-sm font-medium text-error hover:underline transition cursor-pointer"
                    >
                      {tryT.removeFromCart}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Catatan niat — tidak ada checkout, pembayaran, atau total. */}
          <p className="text-sm text-secondary leading-relaxed">{t.intentNote}</p>
        </div>
      )}

      {/* ── FASE N9 (F2): SHEET JUMLAH — dipakai di keranjang ── */}
      <BottomSheetOrModal
        isOpen={!!sheetLine}
        onClose={() => setSheetLine(null)}
        locale={locale}
        title={sheetLine ? tryT.quantitySheetTitle.replace('{0}', `${sheetLine.brand} ${sheetLine.name}`) : ''}
        subtitle={tryT.quantitySheetSubtitle}
        maxWidth="max-w-md"
      >
        <div data-testid="decant-quantity-sheet" className="space-y-3">
          <div className="flex gap-2" role="group" aria-label={tryT.quantityLabel}>
            {DECANT_CART_QUANTITIES.map(q => (
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
            onClick={saveQuantity}
            className="w-full min-h-[48px] bg-bar hover:bg-ink text-paper text-[14px] font-medium rounded-full transition"
          >
            {tryT.doneButton}
          </button>
          {/* Hapus (teks merah, F2) — menghapus baris ini dari keranjang. */}
          <button
            type="button"
            onClick={removeLine}
            className="w-full min-h-[44px] text-[14px] font-medium text-error hover:underline transition cursor-pointer"
          >
            {tryT.removeFromCart}
          </button>
        </div>
      </BottomSheetOrModal>
    </div>
  );
}
