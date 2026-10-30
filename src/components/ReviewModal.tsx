import React, { useState } from 'react';
import { Star, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { translations, Locale } from '../lib/i18n.ts';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { ReviewState } from '../lib/derivedCalculations.ts';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfumes: SeedPerfume[];
  initialPerfumeId?: string;
  userName?: string;
  userId?: string;
  onSubmitReview: (reviewData: Omit<ReviewState, 'id' | 'created_at' | 'helpful_count'>) => void;
  currentUser?: { nickname?: string; email?: string } | null;
  locale: Locale;
}




export function ReviewModal({
  isOpen,
  onClose,
  perfumes,
  initialPerfumeId,
  userName,
  userId,
  onSubmitReview,
  currentUser,
  locale
}: ReviewModalProps) {
  const [selectedPerfumeId, setSelectedPerfumeId] = useState<string>(
    initialPerfumeId || (perfumes[0]?.id ?? '')
  );
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [longevityBand, setLongevityBand] = useState<string>(translations[locale].reviewOptions.longevityBands[1].value);
  const [sillage, setSillage] = useState<'intimate' | 'moderate' | 'strong'>('moderate');
  const [formatUsed, setFormatUsed] = useState<'full_bottle' | 'decant' | 'sample_vial'>('full_bottle');
  const [repurchaseIntent, setRepurchaseIntent] = useState<'yes_definitely' | 'maybe' | 'unlikely' | 'never'>('yes_definitely');
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [prosText, setProsText] = useState('');
  const [consText, setConsText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const pros = prosText.split(',').map(s => s.trim()).filter(Boolean);
    const cons = consText.split(',').map(s => s.trim()).filter(Boolean);

    onSubmitReview({
      user_id: userId || 'usr_senstoria',
      perfume_id: selectedPerfumeId,
      user_name: userName || currentUser?.nickname || 'Pengulas Senstoria',
      user_badge: 'Pemakai Terverifikasi',
      rating,
      value_for_money: rating,
      longevity_band: longevityBand,
      sillage,
      format_used: formatUsed,
      repurchase_intent: repurchaseIntent,
      title: title.trim() || 'Ulasan Pemakaian Nyata',
      review_text: reviewText.trim(),
      pros: pros.length > 0 ? pros : undefined,
      cons: cons.length > 0 ? cons : undefined,
      status: 'approved'
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <BottomSheetOrModal
      isOpen={isOpen}
      onClose={onClose}
      title={translations[locale].review.tulisUlasanParfumKomunitas}
      subtitle={translations[locale].review.bantuSesamaPecintaAromaDenganDataPem}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 text-ink">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-mono uppercase tracking-widest text-secondary font-medium">
            {translations[locale].review.ulasanMultiKriteriaTerverifikasi}
          </span>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3 bg-surface border border-hairline">
            <div className="w-12 h-12 bg-bar text-paper mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-[24px] leading-[32px] font-normal text-ink">
              {translations[locale].review.ulasanBerhasilDipublikasikan}
            </h3>
            <p className="text-[12px] text-secondary">
              {translations[locale].review.terimaKasihAtasKontribusiObjektifmuUn}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-[12px]">
            
            {/* 1. Perfume Picker */}
            <div className="space-y-1.5">
              <label className="font-medium block text-ink">
                {translations[locale].review.parfumYangDiulas}
              </label>
              <select
                value={selectedPerfumeId}
                onChange={e => setSelectedPerfumeId(e.target.value)}
                className="w-full bg-paper border border-border p-2.5 text-[12px] font-medium text-ink focus:outline-hidden"
              >
                {perfumes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.brand} — {p.name} ({p.concentration})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Overall Star Rating */}
            <div className="bg-paper p-4 border border-hairline space-y-2">
              <label className="font-medium block text-ink flex justify-between items-center">
                <span>{translations[locale].review.skorKeseluruhanRating}</span>
                <span className="font-mono text-[14px] text-ink font-medium tabular-nums">
                  {(hoverRating || rating).toFixed(1)} / 5.0
                </span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 text-bar transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star ? 'fill-bar text-bar' : 'text-ondark'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-[12px] text-secondary ml-2">
                  {rating === 5 && (translations[locale].review.luarBiasaMasterpiece)}
                  {rating === 4 && (translations[locale].review.sangatBagus)}
                  {rating === 3 && (translations[locale].review.lumayanStandar)}
                  {rating === 2 && (translations[locale].review.diBawahEkspektasi)}
                  {rating === 1 && (translations[locale].review.mengecewakan)}
                </span>
              </div>
            </div>

            {/* 3. Multi-Criteria Metrics: Longevity & Sillage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Longevity Band */}
              <div className="bg-paper p-4 border border-hairline space-y-2">
                <label className="font-medium block text-ink">
                  {translations[locale].review.dayaTahanNyataKulitLongevity}
                </label>
                <div className="space-y-1.5">
                  {translations[locale].reviewOptions.longevityBands.map(band => (
                    <label key={band.value} className="flex items-center gap-2 text-[12px] cursor-pointer hover:text-ink">
                      <input
                        type="radio"
                        name="longevity"
                        value={band.value}
                        checked={longevityBand === band.value}
                        onChange={() => setLongevityBand(band.value)}
                        className="accent-bar"
                      />
                      <span>{band.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sillage Projection */}
              <div className="bg-paper p-4 border border-hairline space-y-2">
                <label className="font-medium block text-ink">
                  {translations[locale].review.jejakAromaSillageProyeksi}
                </label>
                <div className="space-y-1.5">
                  {translations[locale].reviewOptions.sillage.map(opt => (
                    <label key={opt.value} className="flex items-start gap-2 text-[12px] cursor-pointer hover:text-ink">
                      <input
                        type="radio"
                        name="sillage"
                        value={opt.value}
                        checked={sillage === opt.value}
                        onChange={() => setSillage(opt.value as any)}
                        className="accent-bar mt-0.5"
                      />
                      <div>
                        <span className="font-medium block">{opt.label}</span>
                        <span className="text-[12px] text-secondary">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* 4. Format Used & Repurchase Intent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="font-medium block text-ink">
                  {translations[locale].review.formatYangKamuPakai}
                </label>
                <select
                  value={formatUsed}
                  onChange={e => setFormatUsed(e.target.value as any)}
                  className="w-full bg-paper border border-border p-2.5 text-[12px] focus:outline-hidden"
                >
                  <option value="full_bottle">{translations[locale].review.botolPenuhFullBottle}</option>
                  <option value="decant">{translations[locale].review.decantTravelSize510Ml}</option>
                  <option value="sample_vial">{translations[locale].review.sampleVial12Ml}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium block text-ink">
                  {translations[locale].review.niatBeliUlang}
                </label>
                <select
                  value={repurchaseIntent}
                  onChange={e => setRepurchaseIntent(e.target.value as any)}
                  className="w-full bg-paper border border-border p-2.5 text-[12px] focus:outline-hidden"
                >
                  {translations[locale].reviewOptions.repurchase.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* 5. Title & Review Body */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-medium block text-ink">
                  {translations[locale].review.judulUlasan}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={translations[locale].review.ringkasanKesanUtamamuMisalGurihDanHa}
                  className="w-full bg-paper border border-border p-2.5 text-[12px] focus:outline-hidden"
                  maxLength={120}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium block text-ink">
                  {translations[locale].review.ulasanLengkapWajib}
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder={translations[locale].review.ceritakanEvolusiAromaDariTopNotesHin}
                  className="w-full bg-paper border border-border p-2.5 text-[12px] focus:outline-hidden leading-relaxed"
                  minLength={10}
                  maxLength={2000}
                />
                <span className="text-[12px] text-secondary block text-right font-mono tabular-nums">
                  {reviewText.length} / 2000 karakter
                </span>
              </div>
            </div>

            {/* 6. Pros & Cons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium block text-ink">
                  {translations[locale].review.kelebihanPisahkanDenganKoma}
                </label>
                <input
                  type="text"
                  value={prosText}
                  onChange={e => setProsText(e.target.value)}
                  placeholder={translations[locale].review.prosExamplePlaceholder}
                  className="w-full bg-paper border border-border p-2.5 text-[12px] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium block text-secondary">
                  {translations[locale].review.kekuranganPisahkanDenganKoma}
                </label>
                <input
                  type="text"
                  value={consText}
                  onChange={e => setConsText(e.target.value)}
                  placeholder={translations[locale].review.consExamplePlaceholder}
                  className="w-full bg-paper border border-border p-2.5 text-[12px] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Integrity statement */}
            <div className="flex items-center gap-2 p-3 bg-surface border border-hairline text-[12px] text-secondary">
              <ShieldCheck className="w-4 h-4 text-bar shrink-0" />
              <span>
                {translations[locale].review.kebijakanIntegritasUlasanmuAkanTerbit}
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 border border-border text-[12px] text-ink hover:bg-surface transition"
              >
                {translations[locale].review.batal}
              </button>
              <button
                type="submit"
                className="min-h-[48px] px-6 py-2.5 bg-bar hover:bg-ink text-paper text-[12px] font-medium transition"
              >
                {translations[locale].review.kirimUlasanSekarang}
              </button>
            </div>

          </form>
        )}

      </div>
    </BottomSheetOrModal>
  );
}
