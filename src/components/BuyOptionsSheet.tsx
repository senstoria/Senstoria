import React from 'react';
import { ExternalLink, Sparkles, ShieldCheck, ShoppingBag } from 'lucide-react';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { goUrl } from '../lib/dataLayer.ts';
import { translations, Locale, formatCurrency } from '../lib/i18n.ts';

interface BuyOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  perfume: SeedPerfume | null;
  locale: Locale;
  onOpenTryItFirst?: (perfumeId: string) => void;
}

export const BuyOptionsSheet: React.FC<BuyOptionsSheetProps> = ({
  isOpen,
  onClose,
  perfume,
  locale,
  onOpenTryItFirst
}) => {
  if (!perfume) return null;

  return (
    <BottomSheetOrModal
      isOpen={isOpen}
      onClose={onClose}
      locale={locale}
      title={translations[locale].buySheet.opsiPembelianRepurchaseResmi}
      subtitle={`${perfume.brand} — ${perfume.name}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Perfume Card Snapshot */}
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

        {/* Purchase Buttons (Height >= 48px each for mobile ergonomics, exactly ONE filled button) */}
        <div className="space-y-2.5">
          <p className="text-[12px] font-medium text-ink">
            {translations[locale].buySheet.pilihMitraMarketplaceResmi}
          </p>

          <a
            href={goUrl(perfume.id, 'shopee', 'repurchase_sheet')}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="w-full min-h-[48px] h-12 bg-bar hover:bg-ink text-paper px-4 flex items-center justify-between font-medium text-[14px] transition rounded-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-paper" />
              <span>{translations[locale].buySheet.beliResmiDiShopeeMall}</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          <a
            href={goUrl(perfume.id, 'tokopedia', 'repurchase_sheet')}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="w-full min-h-[48px] h-12 bg-paper border border-border hover:bg-surface text-ink px-4 flex items-center justify-between font-medium text-[14px] transition rounded-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-bar" />
              <span>{translations[locale].buySheet.beliResmiDiTokopediaOfficial}</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          {onOpenTryItFirst && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTryItFirst(perfume.id);
              }}
              className="w-full min-h-[44px] bg-surface border border-hairline hover:border-border text-ink px-4 flex items-center justify-center gap-2 font-medium text-[12px] transition rounded-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-bar" />
              <span>{translations[locale].buySheet.cobaSampelDuluDecant}</span>
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
