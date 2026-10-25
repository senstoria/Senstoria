import React, { useState } from 'react';
import { Star, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale } from '../lib/i18n.ts';
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

const LONGEVITY_BANDS = [
  '1–3 Jam (Sangat Singkat)',
  '4–6 Jam (Moderat)',
  '7–9 Jam (Tahan Lama)',
  '10+ Jam (Sangat Tahan Lama)'
];

const SILLAGE_OPTIONS = [
  { value: 'intimate', label: 'Intim (Kulit Saja)', desc: 'Hanya tercium dalam jarak sangat dekat' },
  { value: 'moderate', label: 'Moderat (Jarak Lengan)', desc: 'Tercium oleh orang di sekitarmu tanpa mengganggu' },
  { value: 'strong', label: 'Kuat (Radius Ruangan)', desc: 'Meninggalkan jejak aroma yang jelas di ruangan' }
];

const REPURCHASE_OPTIONS = [
  { value: 'yes_definitely', label: 'Pasti Beli Lagi' },
  { value: 'maybe', label: 'Mungkin / Perlu Pertimbangan' },
  { value: 'never', label: 'Tidak Akan Beli Lagi' }
];

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
  const [longevityBand, setLongevityBand] = useState<string>(LONGEVITY_BANDS[1]);
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
      title={locale === 'id' ? 'Tulis Ulasan Parfum Komunitas' : 'Write Fragrance Review'}
      subtitle={locale === 'id' ? 'Bantu sesama pecinta aroma dengan data pemakaian nyata kulit' : 'Share real skin wear evaluation'}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 text-[#000000]">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-mono uppercase tracking-widest text-[#5c5c5c] font-medium">
            {locale === 'id' ? 'ULASAN MULTI-KRITERIA TERVERIFIKASI' : 'MULTI-CRITERIA VERIFIED REVIEW'}
          </span>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3 bg-[#f4f3e6] border border-[#d9d7c9]">
            <div className="w-12 h-12 bg-[#333333] text-[#fffef2] mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-[24px] leading-[32px] font-normal text-[#000000]">
              {locale === 'id' ? 'Ulasan Berhasil Dipublikasikan!' : 'Review Successfully Published!'}
            </h3>
            <p className="text-[12px] text-[#5c5c5c]">
              {locale === 'id' ? 'Terima kasih atas kontribusi objektifmu untuk perpustakaan Senstoria.' : 'Thank you for your valuable objective review.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-[12px]">
            
            {/* 1. Perfume Picker */}
            <div className="space-y-1.5">
              <label className="font-medium block text-[#000000]">
                {locale === 'id' ? 'Parfum yang Diulas' : 'Selected Fragrance'}
              </label>
              <select
                value={selectedPerfumeId}
                onChange={e => setSelectedPerfumeId(e.target.value)}
                className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[12px] font-medium text-[#000000] focus:outline-hidden"
              >
                {perfumes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.brand} — {p.name} ({p.concentration})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Overall Star Rating */}
            <div className="bg-[#fffef2] p-4 border border-[#d9d7c9] space-y-2">
              <label className="font-medium block text-[#000000] flex justify-between items-center">
                <span>{locale === 'id' ? 'Skor Keseluruhan (Rating)' : 'Overall Rating'}</span>
                <span className="font-mono text-[14px] text-[#000000] font-medium tabular-nums">
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
                    className="p-1 text-[#333333] transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star ? 'fill-[#333333] text-[#333333]' : 'text-[#d9d7c9]'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-[12px] text-[#5c5c5c] ml-2">
                  {rating === 5 && (locale === 'id' ? 'Luar Biasa / Masterpiece' : 'Masterpiece')}
                  {rating === 4 && (locale === 'id' ? 'Sangat Bagus' : 'Very Good')}
                  {rating === 3 && (locale === 'id' ? 'Lumayan / Standar' : 'Average')}
                  {rating === 2 && (locale === 'id' ? 'Di Bawah Ekspektasi' : 'Below Expectation')}
                  {rating === 1 && (locale === 'id' ? 'Mengecewakan' : 'Disappointing')}
                </span>
              </div>
            </div>

            {/* 3. Multi-Criteria Metrics: Longevity & Sillage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Longevity Band */}
              <div className="bg-[#fffef2] p-4 border border-[#d9d7c9] space-y-2">
                <label className="font-medium block text-[#000000]">
                  {locale === 'id' ? 'Daya Tahan Nyata Kulit (Longevity)' : 'Real Skin Longevity'}
                </label>
                <div className="space-y-1.5">
                  {LONGEVITY_BANDS.map(band => (
                    <label key={band} className="flex items-center gap-2 text-[12px] cursor-pointer hover:text-[#000000]">
                      <input
                        type="radio"
                        name="longevity"
                        value={band}
                        checked={longevityBand === band}
                        onChange={() => setLongevityBand(band)}
                        className="accent-[#333333]"
                      />
                      <span>{band}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sillage Projection */}
              <div className="bg-[#fffef2] p-4 border border-[#d9d7c9] space-y-2">
                <label className="font-medium block text-[#000000]">
                  {locale === 'id' ? 'Jejak Aroma (Sillage & Proyeksi)' : 'Sillage & Projection'}
                </label>
                <div className="space-y-1.5">
                  {SILLAGE_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-start gap-2 text-[12px] cursor-pointer hover:text-[#000000]">
                      <input
                        type="radio"
                        name="sillage"
                        value={opt.value}
                        checked={sillage === opt.value}
                        onChange={() => setSillage(opt.value as any)}
                        className="accent-[#333333] mt-0.5"
                      />
                      <div>
                        <span className="font-medium block">{opt.label}</span>
                        <span className="text-[12px] text-[#5c5c5c]">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* 4. Format Used & Repurchase Intent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="font-medium block text-[#000000]">
                  {locale === 'id' ? 'Format yang Kamu Pakai' : 'Format Used'}
                </label>
                <select
                  value={formatUsed}
                  onChange={e => setFormatUsed(e.target.value as any)}
                  className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[12px] focus:outline-hidden"
                >
                  <option value="full_bottle">{locale === 'id' ? 'Botol Penuh (Full Bottle)' : 'Full Bottle'}</option>
                  <option value="decant">{locale === 'id' ? 'Decant / Travel Size (5–10 ml)' : 'Decant (5–10 ml)'}</option>
                  <option value="sample_vial">{locale === 'id' ? 'Sample Vial (1–2 ml)' : 'Sample Vial (1–2 ml)'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium block text-[#000000]">
                  {locale === 'id' ? 'Niat Beli Ulang' : 'Repurchase Intent'}
                </label>
                <select
                  value={repurchaseIntent}
                  onChange={e => setRepurchaseIntent(e.target.value as any)}
                  className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[12px] focus:outline-hidden"
                >
                  {REPURCHASE_OPTIONS.map(opt => (
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
                <label className="font-medium block text-[#000000]">
                  {locale === 'id' ? 'Judul Ulasan' : 'Review Headline'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={locale === 'id' ? 'Ringkasan kesan utamamu (misal: Gurih dan hangat untuk malam hari)' : 'Headline summary'}
                  className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[12px] focus:outline-hidden"
                  maxLength={120}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium block text-[#000000]">
                  {locale === 'id' ? 'Ulasan Lengkap (Wajib)' : 'Review Details (Required)'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder={locale === 'id' ? 'Ceritakan evolusi aroma dari top notes hingga drydown, bagaimana aromanya bereaksi terhadap panas kulitmu...' : 'Describe how the scent opens, evolves, and wears on your skin...'}
                  className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[12px] focus:outline-hidden leading-relaxed"
                  minLength={10}
                  maxLength={2000}
                />
                <span className="text-[12px] text-[#5c5c5c] block text-right font-mono tabular-nums">
                  {reviewText.length} / 2000 karakter
                </span>
              </div>
            </div>

            {/* 6. Pros & Cons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium block text-[#000000]">
                  {locale === 'id' ? '+ Kelebihan (Pisahkan dengan koma)' : '+ Pros (Comma separated)'}
                </label>
                <input
                  type="text"
                  value={prosText}
                  onChange={e => setProsText(e.target.value)}
                  placeholder="Aroma ramah kantor, botol kokoh, banyak pujian"
                  className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[12px] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium block text-[#5c5c5c]">
                  {locale === 'id' ? '- Kekurangan (Pisahkan dengan koma)' : '- Cons (Comma separated)'}
                </label>
                <input
                  type="text"
                  value={consText}
                  onChange={e => setConsText(e.target.value)}
                  placeholder="Terlalu manis untuk siang terik, sprayer agak keras"
                  className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[12px] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Integrity statement */}
            <div className="flex items-center gap-2 p-3 bg-[#f4f3e6] border border-[#d9d7c9] text-[12px] text-[#5c5c5c]">
              <ShieldCheck className="w-4 h-4 text-[#333333] shrink-0" />
              <span>
                {locale === 'id' 
                  ? 'Kebijakan Integritas: Ulasanmu akan terbit secara transparan tanpa intervensi komersial dari brand manapun.'
                  : 'Integrity Policy: Your review will be published without commercial influence.'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 border border-[#8a8a8a] text-[12px] text-[#000000] hover:bg-[#f4f3e6] transition"
              >
                {locale === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="min-h-[48px] px-6 py-2.5 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[12px] font-medium transition"
              >
                {locale === 'id' ? 'Kirim Ulasan Sekarang' : 'Submit Review'}
              </button>
            </div>

          </form>
        )}

      </div>
    </BottomSheetOrModal>
  );
}
