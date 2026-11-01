import React from 'react';
import { ExternalLink, ShieldCheck, ShoppingBag } from 'lucide-react';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { goUrl } from '../lib/dataLayer.ts';
import { translations, Locale, formatCurrency } from '../lib/i18n.ts';

interface BuyOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  perfume: SeedPerfume | null;
  locale: Locale;
  // No Try it First here: this repurchase sheet is only ever opened for an
  // owned perfume (via Buy again on an owned low bottle), and an owned
  // perfume needs no sample try.
  //
  // Tahap 2 (kartu produk gaya Nike): the same sheet is reused for the
  // catalog card's Buy button via variant="catalog". In catalog mode the
  // sheet offers exactly two things: (1) Buy in E-Commerce (the existing
  // /go links + disclosure, unchanged) and (2) Try It First as JOIN
  // WAITLIST ONLY (the Stage 1 waitlist flow via onJoinWaitlist).
  // Decant SALES are deliberately NOT offered here: decant sales are
  // Stage 2 and open only via metric/legal gates that the founder has
  // not decided yet. The caller owns the PR #18 owned-gating: it passes
  // showTryItFirst=false for owned perfumes, so an owned perfume gets
  // the e-commerce options only.
  variant?: 'repurchase' | 'catalog';
  onJoinWaitlist?: (id: string) => void;
  showTryItFirst?: boolean;
}

export const BuyOptionsSheet: React.FC<BuyOptionsSheetProps> = ({
  isOpen,
  onClose,
  perfume,
  locale,
  variant = 'repurchase',
  onJoinWaitlist,
  showTryItFirst = false
}) => {
  if (!perfume) return null;

  const isCatalog = variant === 'catalog';

  return (
    <BottomSheetOrModal
      isOpen={isOpen}
      onClose={onClose}
      locale={locale}
      title={isCatalog
        ? translations[locale].buySheet.opsiPembelianKatalog
        : translations[locale].buySheet.opsiPembelianRepurchaseResmi}
      subtitle={`${perfume.brand} — ${perfume.name}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Perfume Card Snapshot (repurchase mode only) */}
        {!isCatalog && (
        <div className="bg-surface border border-hairline p-4 space-y-1">
          <div className="flex items-center justify-between text-[12px] uppercase font-mono tracking-wider text-secondary">
            <span>{perfume.origin === 'ID' ? translations[locale].buySheet.originTierLocal : translations[locale].buySheet.originTierGlobal}</span>
            <span>{perfume.concentration}</span>
          </div>
          <h4 className="font-sans text-[18px] font-medium text-ink">{perfume.name}</h4>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-[12px] text-secondary flex items-center gap-1.5">
              <span>{translations[locale].buySheet.hargaReferensi}</span>
              <span className="px-1.5 py-0.5 bg-surface border border-hairline text-[12px] font-sans">
                {translations[locale].sampleDataBadge}
              </span>
            </span>
            <span className="font-mono tabular-nums text-[14px] font-medium text-ink">
              {formatCurrency(perfume.reference_price_idr, locale)} ({perfume.reference_price_size_ml} ml)
            </span>
          </div>
        </div>
        )}

        {/* Purchase Buttons (Height >= 48px each for mobile ergonomics, exactly ONE filled button) */}
        <div className="space-y-2.5">
          <p className="text-[12px] font-medium text-ink">
            {isCatalog
              ? translations[locale].buySheet.beliDiEcommerce
              : translations[locale].buySheet.pilihMitraMarketplaceResmi}
          </p>

          <a
            href={goUrl(perfume.id, 'shopee', isCatalog ? 'catalog_buy' : 'repurchase_sheet')}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="w-full min-h-[48px] h-12 bg-bar hover:bg-ink text-paper px-4 flex items-center justify-between font-medium text-[14px] transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-paper" />
              <span>{translations[locale].buySheet.beliResmiDiShopeeMall}</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          <a
            href={goUrl(perfume.id, 'tokopedia', isCatalog ? 'catalog_buy' : 'repurchase_sheet')}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="w-full min-h-[48px] h-12 bg-paper border border-border hover:bg-surface text-ink px-4 flex items-center justify-between font-medium text-[14px] transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-bar" />
              <span>{translations[locale].buySheet.beliResmiDiTokopediaOfficial}</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          {/* Tahap 2, catalog mode only: Try It First = JOIN WAITLIST
              ONLY (Stage 1 waitlist flow). No decant is sold here;
              decant sales are Stage 2 and gated, not decided yet.
              Hidden for owned perfumes (caller passes
              showTryItFirst=false), per PR #18. */}
          {isCatalog && showTryItFirst && onJoinWaitlist && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onJoinWaitlist(perfume.id);
              }}
              className="w-full min-h-[48px] h-12 bg-paper border border-border hover:bg-surface text-ink px-4 flex items-center justify-between font-medium text-[14px] transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <span>{translations[locale].buySheet.cobaDuluGabungWaitlist}</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </button>
          )}

        </div>

        {/* Affiliate Disclosure */}
        <div className="pt-2 border-t border-hairline text-[12px] text-secondary leading-relaxed flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
          <p>
            {translations[locale].buySheet.kamiBisaMenerimaKomisiJikaKamuMembel}
          </p>
        </div>
      </div>
    </BottomSheetOrModal>
  );
};
