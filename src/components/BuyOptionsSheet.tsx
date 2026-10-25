import React from 'react';
import { ExternalLink, Sparkles, ShieldCheck, ShoppingBag } from 'lucide-react';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale, formatCurrency } from '../lib/i18n.ts';

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
      title={locale === 'id' ? 'Opsi Pembelian & Repurchase Resmi' : 'Official Purchase & Repurchase Options'}
      subtitle={`${perfume.brand} — ${perfume.name}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Perfume Card Snapshot */}
        <div className="bg-[#f4f3e6] border border-[#d9d7c9] p-4 space-y-1">
          <div className="flex items-center justify-between text-[12px] uppercase font-mono tracking-wider text-[#5c5c5c]">
            <span>{perfume.origin === 'ID' ? 'Artisan Indonesia' : 'Global Designer'}</span>
            <span>{perfume.concentration}</span>
          </div>
          <h4 className="font-sans text-[18px] font-medium text-[#000000]">{perfume.name}</h4>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-[12px] text-[#5c5c5c]">
              {locale === 'id' ? 'Harga Referensi:' : 'Reference Price:'}
            </span>
            <span className="font-mono tabular-nums text-[14px] font-medium text-[#000000]">
              {formatCurrency(perfume.reference_price_idr, locale)} ({perfume.reference_price_size_ml} ml)
            </span>
          </div>
        </div>

        {/* Purchase Buttons (Height >= 48px each for mobile ergonomics, exactly ONE filled button) */}
        <div className="space-y-2.5">
          <p className="text-[12px] font-medium text-[#000000]">
            {locale === 'id' ? 'Pilih Mitra Marketplace Resmi Terverifikasi:' : 'Select Verified Official Partner:'}
          </p>

          <a
            href={`/go/${perfume.id}?platform=shopee&src=repurchase_sheet`}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="w-full min-h-[48px] h-12 bg-[#333333] hover:bg-[#000000] text-[#fffef2] px-4 flex items-center justify-between font-medium text-[14px] transition rounded-none focus:outline-hidden"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#fffef2]" />
              <span>{locale === 'id' ? 'Beli Resmi di Shopee Mall' : 'Buy on Shopee Mall'}</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          <a
            href={`/go/${perfume.id}?platform=tokopedia&src=repurchase_sheet`}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="w-full min-h-[48px] h-12 bg-[#fffef2] border border-[#8a8a8a] hover:bg-[#f4f3e6] text-[#000000] px-4 flex items-center justify-between font-medium text-[14px] transition rounded-none focus:outline-hidden"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#333333]" />
              <span>{locale === 'id' ? 'Beli Resmi di Tokopedia Official' : 'Buy on Tokopedia Official'}</span>
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
              className="w-full min-h-[44px] bg-[#f4f3e6] border border-[#d9d7c9] hover:border-[#8a8a8a] text-[#000000] px-4 flex items-center justify-center gap-2 font-medium text-[12px] transition rounded-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#333333]" />
              <span>{locale === 'id' ? 'Coba Sampel Dulu (Decant)' : 'Try Sample Decant First'}</span>
            </button>
          )}
        </div>

        {/* Affiliate Disclosure */}
        <div className="pt-2 border-t border-[#d9d7c9] text-[12px] text-[#5c5c5c] leading-relaxed flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#5c5c5c] shrink-0 mt-0.5" />
          <p>
            {locale === 'id'
              ? 'Senstoria dapat memperoleh komisi bila kamu membeli melalui tautan di atas tanpa biaya tambahan bagimu. Komisi tidak pernah memengaruhi skor kecocokan atau posisi rekomendasi parfum.'
              : 'Senstoria may earn a commission on qualifying purchases at no extra cost to you. This never affects match scores or ranking algorithms.'}
          </p>
        </div>
      </div>
    </BottomSheetOrModal>
  );
};
