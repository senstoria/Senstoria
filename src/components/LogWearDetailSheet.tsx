import React, { useState, useEffect } from 'react';
import { Droplet, Heart, Sun, Wind, CloudRain, Clock, Plus, Minus, Check } from 'lucide-react';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { BottleState } from '../lib/derivedCalculations.ts';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale } from '../lib/i18n.ts';

interface LogWearDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bottles: BottleState[];
  perfumes: SeedPerfume[];
  initialBottleId?: string;
  onSaveWearDetail: (data: {
    bottleId: string;
    spraysCount: number;
    mood: string;
    occasion: string;
    weather: string;
    compliments: number;
    note: string;
  }) => void;
  locale: Locale;
}

const OCCASIONS = ['Harian / Kasual', 'Kantor & Kerja', 'Kencan Romantis', 'Pesta / Malam', 'Olahraga / Santai'];
const MOODS = ['Percaya Diri', 'Segar & Semangat', 'Tenang & Hangat', 'Elegan & Misterius', 'Romantis'];
const WEATHERS = ['Panas Tropis', 'Ruang Ber-AC', 'Hujan / Sejuk', 'Malam Hangat'];

export const LogWearDetailSheet: React.FC<LogWearDetailSheetProps> = ({
  isOpen,
  onClose,
  bottles,
  perfumes,
  initialBottleId,
  onSaveWearDetail,
  locale
}) => {
  const activeBottles = bottles.filter(b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed'));
  const [selectedBottleId, setSelectedBottleId] = useState<string>(
    initialBottleId || activeBottles[0]?.id || ''
  );

  const [spraysCount, setSpraysCount] = useState<number>(3);
  const [mood, setMood] = useState<string>(MOODS[0]);
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0]);
  const [weather, setWeather] = useState<string>(WEATHERS[0]);
  const [compliment, setCompliment] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (initialBottleId) {
      setSelectedBottleId(initialBottleId);
    } else if (activeBottles.length > 0 && !selectedBottleId) {
      setSelectedBottleId(activeBottles[0].id);
    }
  }, [initialBottleId, activeBottles]);

  const selectedBottle = activeBottles.find(b => b.id === selectedBottleId);
  const selectedPerfume = perfumes.find(p => p.id === selectedBottle?.perfume_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBottleId) return;

    onSaveWearDetail({
      bottleId: selectedBottleId,
      spraysCount,
      mood,
      occasion,
      weather,
      compliments: compliment ? 1 : 0,
      note: note.trim()
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <BottomSheetOrModal
      isOpen={isOpen}
      onClose={onClose}
      title={locale === 'id' ? 'Catat Rincian Pemakaian' : 'Log Wear Details'}
      subtitle={locale === 'id' ? 'Buku Harian Semprot & Jejak Aroma' : 'Daily Scent Wear & Context'}
      maxWidth="max-w-md"
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
            <Check className="w-6 h-6" />
          </div>
          <p className="font-serif text-xl font-bold">
            {locale === 'id' ? 'Pemakaian Berhasil Dicatat!' : 'Wear Logged Successfully!'}
          </p>
          <p className="text-xs text-[#5C5C5C]">
            -{(spraysCount * 0.12).toFixed(1)} ml {locale === 'id' ? 'dikurangkan dari botolmu.' : 'decremented from bottle.'}
          </p>
        </div>
      ) : activeBottles.length === 0 ? (
        <div className="py-6 text-center space-y-3">
          <p className="text-xs text-[#5C5C5C]">
            {locale === 'id' 
              ? 'Belum ada botol aktif di lemarimu. Silakan tambahkan botol terlebih dahulu.' 
              : 'No active bottles in your library. Please add a bottle first.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 bg-[#333333] text-white text-xs font-semibold"
          >
            {locale === 'id' ? 'Tutup' : 'Close'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Bottle */}
          <div className="space-y-1">
            <label className="font-semibold block text-[#1A1A1A]">
              {locale === 'id' ? 'Pilih Botol dari Lemarimu' : 'Select Perfume Bottle'}
            </label>
            <select
              value={selectedBottleId}
              onChange={e => setSelectedBottleId(e.target.value)}
              className="w-full min-h-[44px] p-2.5 bg-white border border-[#333333] text-base md:text-xs text-[#1A1A1A] focus:outline-hidden"
              required
            >
              {activeBottles.map(b => {
                const perf = perfumes.find(p => p.id === b.perfume_id);
                return (
                  <option key={b.id} value={b.id}>
                    {perf ? `${perf.brand} — ${perf.name}` : 'Parfum'} ({b.remaining_ml} / {b.size_ml} ml)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Stepper for Sprays Count (Min 44px Tap Targets) */}
          <div className="space-y-1.5 bg-[#F4F3E6] p-3.5 border border-[#D9D7C9]">
            <div className="flex justify-between items-baseline">
              <label className="font-semibold block text-[#1A1A1A]">
                {locale === 'id' ? 'Jumlah Semprotan' : 'Number of Sprays'}
              </label>
              <span className="text-[11px] font-mono text-[#5C5C5C]">
                ≈ -{(spraysCount * 0.12).toFixed(1)} ml
              </span>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSpraysCount(prev => Math.max(1, prev - 1))}
                className="w-12 h-12 min-h-[44px] min-w-[44px] bg-white border border-[#333333] flex items-center justify-center text-lg font-bold hover:bg-neutral-100 transition active:scale-95"
                aria-label="Kurangi semprotan"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="font-serif text-3xl font-bold text-[#1A1A1A]">{spraysCount}</span>
                <span className="text-[10px] text-[#5C5C5C] block uppercase tracking-wider">Semprot / Sprays</span>
              </div>

              <button
                type="button"
                onClick={() => setSpraysCount(prev => Math.min(12, prev + 1))}
                className="w-12 h-12 min-h-[44px] min-w-[44px] bg-white border border-[#333333] flex items-center justify-center text-lg font-bold hover:bg-neutral-100 transition active:scale-95"
                aria-label="Tambah semprotan"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context: Occasion Chips (Min 44px tap height) */}
          <div className="space-y-1.5">
            <label className="font-semibold block text-[#1A1A1A]">
              {locale === 'id' ? 'Konteks / Acara Pemakaian' : 'Occasion'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map(occ => (
                <button
                  type="button"
                  key={occ}
                  onClick={() => setOccasion(occ)}
                  className={`min-h-[40px] px-3 py-1.5 border text-xs font-medium transition rounded-xs ${
                    occasion === occ 
                      ? 'bg-[#333333] text-white border-black font-semibold' 
                      : 'bg-white border-[#D9D7C9] text-[#5C5C5C] hover:text-black'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Chips */}
          <div className="space-y-1.5">
            <label className="font-semibold block text-[#1A1A1A]">
              {locale === 'id' ? 'Suasana Hati (Mood)' : 'Mood'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMood(m)}
                  className={`min-h-[40px] px-3 py-1.5 border text-xs font-medium transition rounded-xs ${
                    mood === m 
                      ? 'bg-[#333333] text-white border-black font-semibold' 
                      : 'bg-white border-[#D9D7C9] text-[#5C5C5C] hover:text-black'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Weather Chips */}
          <div className="space-y-1.5">
            <label className="font-semibold block text-[#1A1A1A]">
              {locale === 'id' ? 'Cuaca Saat Dipakai' : 'Weather'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WEATHERS.map(w => (
                <button
                  type="button"
                  key={w}
                  onClick={() => setWeather(w)}
                  className={`min-h-[40px] px-3 py-1.5 border text-xs font-medium transition rounded-xs ${
                    weather === w 
                      ? 'bg-[#333333] text-white border-black font-semibold' 
                      : 'bg-white border-[#D9D7C9] text-[#5C5C5C] hover:text-black'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Compliment Received Toggle */}
          <label className="flex items-center gap-3 p-3 bg-white border border-[#D9D7C9] cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={compliment}
              onChange={e => setCompliment(e.target.checked)}
              className="w-4 h-4 accent-[#333333]"
            />
            <div className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${compliment ? 'text-rose-500 fill-rose-500' : 'text-neutral-400'}`} />
              <span className="font-medium text-xs">
                {locale === 'id' ? 'Mendapat pujian dari orang lain hari ini' : 'Received a compliment today'}
              </span>
            </div>
          </label>

          {/* Note Input (16px font to prevent iOS zoom) */}
          <div className="space-y-1">
            <label className="font-semibold block text-[#1A1A1A]">
              {locale === 'id' ? 'Catatan Singkat (Opsional)' : 'Quick Note (Optional)'}
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={locale === 'id' ? 'Cth: Disemprot di kemeja putih, tahan 6 jam...' : 'E.g. Sprayed on white shirt, lasted 6 hours...'}
              className="w-full min-h-[44px] p-2.5 bg-white border border-[#333333] text-base md:text-xs text-[#1A1A1A] focus:outline-hidden"
            />
          </div>

          {/* Submit Button in Thumb Zone (Height >= 48px) */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] h-12 bg-[#333333] hover:bg-black text-[#FFFEF2] text-sm font-semibold flex items-center justify-center gap-2 transition rounded-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-black"
            >
              <Droplet className="w-4 h-4 text-sky-400" />
              <span>{locale === 'id' ? 'Simpan Catatan Pemakaian' : 'Save Wear Log'}</span>
            </button>
          </div>
        </form>
      )}
    </BottomSheetOrModal>
  );
};
