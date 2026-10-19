import React, { useState } from 'react';
import { X, Star, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { ReviewState } from '../lib/derivedCalculations.ts';
import { LONGEVITY_BANDS, SILLAGE_OPTIONS, REPURCHASE_OPTIONS } from '../data/seedDiaryData.ts';
import { Locale } from '../lib/i18n.ts';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfumes: SeedPerfume[];
  initialPerfumeId?: string;
  userName: string;
  userId: string;
  onSubmitReview: (review: ReviewState) => void;
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
  locale
}: ReviewModalProps) {
  const [selectedPerfumeId, setSelectedPerfumeId] = useState<string>(initialPerfumeId || perfumes[0]?.id || 'prf_001');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [longevityBand, setLongevityBand] = useState<string>(LONGEVITY_BANDS[2]); // 6-8 jam
  const [sillage, setSillage] = useState<'intimate' | 'moderate' | 'strong' | 'enormous'>('moderate');
  const [valueForMoney, setValueForMoney] = useState<number>(5);
  const [repurchaseIntent, setRepurchaseIntent] = useState<'yes_definitely' | 'maybe' | 'unlikely' | 'never'>('yes_definitely');
  const [formatUsed, setFormatUsed] = useState<'full_bottle' | 'decant' | 'sample_vial'>('full_bottle');
  const [title, setTitle] = useState<string>('');
  const [reviewText, setReviewText] = useState<string>('');
  const [prosText, setProsText] = useState<string>('');
  const [consText, setConsText] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const pros = prosText.split(',').map(s => s.trim()).filter(Boolean);
    const cons = consText.split(',').map(s => s.trim()).filter(Boolean);

    const newReview: ReviewState = {
      id: 'rev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      user_id: userId || 'usr_senstoria',
      user_name: userName || 'Anggota Senstoria',
      user_badge: formatUsed === 'full_bottle' ? 'Verified Owner (Botol Penuh)' : 'Verified Member',
      perfume_id: selectedPerfumeId,
      rating,
      longevity_band: longevityBand,
      sillage,
      value_for_money: valueForMoney,
      repurchase_intent: repurchaseIntent,
      format_used: formatUsed,
      title: title.trim() || 'Ulasan Pengalaman Pemakaian',
      review_text: reviewText.trim(),
      pros: pros.length > 0 ? pros : undefined,
      cons: cons.length > 0 ? cons : undefined,
      status: 'approved', // Auto-approved in prototype with moderation filter ready
      created_at: new Date().toISOString(),
      helpful_count: 0
    };

    onSubmitReview(newReview);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFEF2] border border-[#333333] max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#5C5C5C] hover:text-black transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 border-b border-[#D9D7C9] pb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A4B14] font-bold">
            {locale === 'id' ? 'Ulasan Multi-Kriteria Terverifikasi' : 'Multi-Criteria Verified Review'}
          </span>
          <h2 className="font-serif text-3xl font-normal">
            {locale === 'id' ? 'Tulis Ulasan & Evaluasi Aroma' : 'Write Fragrance Evaluation'}
          </h2>
          <p className="text-xs text-[#5C5C5C]">
            {locale === 'id' 
              ? 'Bagikan data ketahanan nyata, jejak aroma, dan nilai parfum ini untuk membantu komunitas memilih tanpa salah beli.' 
              : 'Share real wear longevity, sillage projection, and honest assessment to guide fellow enthusiasts.'}
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3 bg-[#F4F3E6] border border-[#D9D7C9]">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold">
              {locale === 'id' ? 'Ulasan Berhasil Dipublikasikan!' : 'Review Successfully Published!'}
            </h3>
            <p className="text-xs text-[#5C5C5C]">
              {locale === 'id' ? 'Terima kasih atas kontribusi objektifmu untuk perpustakaan Senstoria.' : 'Thank you for your valuable objective review.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            
            {/* 1. Perfume Picker */}
            <div className="space-y-1.5">
              <label className="font-semibold block text-[#1A1A1A]">
                {locale === 'id' ? 'Parfum yang Diulas' : 'Selected Fragrance'}
              </label>
              <select
                value={selectedPerfumeId}
                onChange={e => setSelectedPerfumeId(e.target.value)}
                className="w-full bg-white border border-[#D9D7C9] p-2.5 text-xs font-serif focus:border-black outline-none"
              >
                {perfumes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.brand} — {p.name} ({p.concentration})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Overall Star Rating */}
            <div className="bg-white p-4 border border-[#D9D7C9] space-y-2">
              <label className="font-semibold block text-[#1A1A1A] flex justify-between items-center">
                <span>{locale === 'id' ? 'Skor Keseluruhan (Rating)' : 'Overall Rating'}</span>
                <span className="font-mono text-sm text-[#8A4B14] font-bold">
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
                    className="p-1 text-amber-500 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star ? 'fill-amber-400 text-amber-500' : 'text-neutral-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-[11px] text-[#5C5C5C] ml-2">
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
              <div className="bg-white p-3.5 border border-[#D9D7C9] space-y-2">
                <label className="font-semibold block text-[#1A1A1A]">
                  {locale === 'id' ? 'Daya Tahan Nyata Kulit (Longevity)' : 'Real Skin Longevity'}
                </label>
                <div className="space-y-1.5">
                  {LONGEVITY_BANDS.map(band => (
                    <label key={band} className="flex items-center gap-2 text-[11px] cursor-pointer hover:text-black">
                      <input
                        type="radio"
                        name="longevity"
                        value={band}
                        checked={longevityBand === band}
                        onChange={() => setLongevityBand(band)}
                        className="accent-[#8A4B14]"
                      />
                      <span>{band}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sillage Projection */}
              <div className="bg-white p-3.5 border border-[#D9D7C9] space-y-2">
                <label className="font-semibold block text-[#1A1A1A]">
                  {locale === 'id' ? 'Jejak Aroma (Sillage & Proyeksi)' : 'Sillage & Projection'}
                </label>
                <div className="space-y-1.5">
                  {SILLAGE_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-start gap-2 text-[11px] cursor-pointer hover:text-black">
                      <input
                        type="radio"
                        name="sillage"
                        value={opt.value}
                        checked={sillage === opt.value}
                        onChange={() => setSillage(opt.value)}
                        className="accent-[#8A4B14] mt-0.5"
                      />
                      <div>
                        <span className="font-medium block">{opt.label}</span>
                        <span className="text-[10px] text-[#5C5C5C]">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* 4. Format Used & Repurchase Intent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Format Used */}
              <div className="space-y-1.5">
                <label className="font-semibold block">
                  {locale === 'id' ? 'Format yang Kamu Pakai' : 'Format Used'}
                </label>
                <select
                  value={formatUsed}
                  onChange={e => setFormatUsed(e.target.value as any)}
                  className="w-full bg-white border border-[#D9D7C9] p-2.5 text-xs outline-none"
                >
                  <option value="full_bottle">{locale === 'id' ? 'Botol Penuh (Full Bottle)' : 'Full Bottle'}</option>
                  <option value="decant">{locale === 'id' ? 'Decant / Travel Size (5–10 ml)' : 'Decant (5–10 ml)'}</option>
                  <option value="sample_vial">{locale === 'id' ? 'Sample Vial (1–2 ml)' : 'Sample Vial (1–2 ml)'}</option>
                </select>
              </div>

              {/* Repurchase Intent */}
              <div className="space-y-1.5">
                <label className="font-semibold block">
                  {locale === 'id' ? 'Niat Beli Ulang' : 'Repurchase Intent'}
                </label>
                <select
                  value={repurchaseIntent}
                  onChange={e => setRepurchaseIntent(e.target.value as any)}
                  className="w-full bg-white border border-[#D9D7C9] p-2.5 text-xs outline-none"
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
                <label className="font-semibold block">
                  {locale === 'id' ? 'Judul Ulasan' : 'Review Headline'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={locale === 'id' ? 'Ringkasan kesan utamamu (misal: Gurih dan hangat untuk malam hari)' : 'Headline summary'}
                  className="w-full bg-white border border-[#D9D7C9] p-2.5 text-xs focus:border-black outline-none"
                  maxLength={120}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">
                  {locale === 'id' ? 'Ulasan Lengkap (Wajib)' : 'Review Details (Required)'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder={locale === 'id' ? 'Ceritakan evolusi aroma dari top notes hingga drydown, bagaimana aromanya bereaksi terhadap panas kulitmu...' : 'Describe how the scent opens, evolves, and wears on your skin...'}
                  className="w-full bg-white border border-[#D9D7C9] p-2.5 text-xs focus:border-black outline-none leading-relaxed"
                  minLength={10}
                  maxLength={2000}
                />
                <span className="text-[10px] text-[#5C5C5C] block text-right">
                  {reviewText.length} / 2000 karakter
                </span>
              </div>
            </div>

            {/* 6. Pros & Cons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold block text-emerald-800">
                  {locale === 'id' ? '+ Kelebihan (Pisahkan dengan koma)' : '+ Pros (Comma separated)'}
                </label>
                <input
                  type="text"
                  value={prosText}
                  onChange={e => setProsText(e.target.value)}
                  placeholder="Aroma ramah kantor, botol kokoh, banyak pujian"
                  className="w-full bg-white border border-[#D9D7C9] p-2 text-xs focus:border-black outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-rose-800">
                  {locale === 'id' ? '- Kekurangan (Pisahkan dengan koma)' : '- Cons (Comma separated)'}
                </label>
                <input
                  type="text"
                  value={consText}
                  onChange={e => setConsText(e.target.value)}
                  placeholder="Terlalu manis untuk siang terik, sprayer agak keras"
                  className="w-full bg-white border border-[#D9D7C9] p-2 text-xs focus:border-black outline-none"
                />
              </div>
            </div>

            {/* Integrity statement */}
            <div className="flex items-center gap-2 p-3 bg-[#F4F3E6] border border-[#D9D7C9] text-[11px] text-[#5C5C5C]">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
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
                className="px-4 py-2.5 border border-[#D9D7C9] text-xs hover:bg-[#F4F3E6] transition"
              >
                {locale === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold transition"
              >
                {locale === 'id' ? 'Kirim Ulasan Sekarang' : 'Submit Review'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
