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
        <div className="bg-[#F4F3E6] border border-[#D9D7C9] p-4 space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-[#5C5C5C]">
            <span>{perfume.origin === 'ID' ? 'Artisan Indonesia' : 'Global Designer'}</span>
            <span>{perfume.concentration}</span>
          </div>
          <h4 className="font-serif text-lg font-bold text-[#1A1A1A]">{perfume.name}</h4>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs text-[#5C5C5C]">
              {locale === 'id' ? 'Harga Referensi:' : 'Reference Price:'}
            </span>
            <span className="font-mono text-sm font-bold text-[#1A1A1A]">
              {formatCurrency(perfume.reference_price_idr, locale)} ({perfume.reference_price_size_ml} ml)
            </span>
          </div>
        </div>

        {/* Purchase Buttons (Height >= 48px each for mobile ergonomics) */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-[#1A1A1A]">
            {locale === 'id' ? 'Pilih Mitra Marketplace Resmi Terverifikasi:' : 'Select Verified Official Partner:'}
          </p>

          <a
            href={`/go/${perfume.id}?platform=shopee&src=repurchase_sheet`}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="w-full min-h-[48px] h-12 bg-[#333333] hover:bg-black text-[#FFFEF2] px-4 flex items-center justify-between font-semibold text-xs transition rounded-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-black"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-orange-400" />
              <span>{locale === 'id' ? 'Beli Resmi di Shopee Mall' : 'Buy on Shopee Mall'}</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          <a
            href={`/go/${perfume.id}?platform=tokopedia&src=repurchase_sheet`}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="w-full min-h-[48px] h-12 bg-white border border-[#333333] hover:bg-[#F4F3E6] text-[#1A1A1A] px-4 flex items-center justify-between font-semibold text-xs transition rounded-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-black"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
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
              className="w-full min-h-[44px] bg-[#F4F3E6] border border-[#D9D7C9] hover:bg-neutral-200 text-[#1A1A1A] px-4 flex items-center justify-center gap-2 font-medium text-xs transition rounded-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>{locale === 'id' ? 'Belum Yakin? Coba Sampel Dulu (Decant)' : 'Not Sure? Try Sample Decant First'}</span>
            </button>
          )}
        </div>

        {/* Affiliate Disclosure (PRD Binding Rule) */}
        <div className="pt-2 border-t border-[#D9D7C9] text-[11px] text-[#5C5C5C] leading-relaxed flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8A4B14] shrink-0 mt-0.5" />
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
