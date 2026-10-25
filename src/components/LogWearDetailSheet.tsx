import React, { useState } from 'react';
import { Minus, Plus, Heart, Droplet, Check } from 'lucide-react';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { BottleState, WearLogState } from '../lib/derivedCalculations.ts';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale } from '../lib/i18n.ts';

interface LogWearDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bottles: BottleState[];
  perfumes: SeedPerfume[];
  initialBottleId?: string;
  onSaveWearDetail?: (data: {
    bottleId: string;
    spraysCount: number;
    mood: string;
    occasion: string;
    weather: string;
    compliments: number;
    note: string;
  }) => void;
  onSaveLog?: (log: any) => void;
  locale: Locale;
}

const OCCASIONS = [
  'Kantor / Kerja',
  'Kencan Santai',
  'Formal / Acara',
  'Olahraga / Aktif',
  'Santai di Rumah',
  'Pesta / Malam'
];

const MOODS = [
  'Percaya Diri',
  'Tenang & Nyaman',
  'Segar & Berenergi',
  'Misterius & Elegan',
  'Hangat & Nostalgia'
];

const WEATHERS = [
  'Panas Terik Tropis',
  'Hujan Lembap',
  'Ruang Ber-AC',
  'Malam Sejuk'
];

export const LogWearDetailSheet: React.FC<LogWearDetailSheetProps> = ({
  isOpen,
  onClose,
  bottles,
  perfumes,
  initialBottleId,
  onSaveWearDetail,
  onSaveLog,
  locale
}) => {
  const activeBottles = bottles.filter(b => b.remaining_ml > 0);
  const defaultBottleId = initialBottleId || activeBottles[0]?.id || '';

  const [selectedBottleId, setSelectedBottleId] = useState<string>(defaultBottleId);
  const [spraysCount, setSpraysCount] = useState<number>(3);
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0]);
  const [mood, setMood] = useState<string>(MOODS[0]);
  const [weather, setWeather] = useState<string>(WEATHERS[0]);
  const [compliment, setCompliment] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBottleId) return;

    if (onSaveWearDetail) {
      onSaveWearDetail({
        bottleId: selectedBottleId,
        spraysCount,
        occasion,
        mood,
        weather,
        compliments: compliment ? 1 : 0,
        note: note.trim()
      });
    } else if (onSaveLog) {
      onSaveLog({
        bottle_id: selectedBottleId,
        sprays_count: spraysCount,
        occasion,
        mood,
        weather,
        compliments: compliment ? 1 : 0,
        note: note.trim() ? note.trim() : undefined
      });
    }

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
      title={locale === 'id' ? 'Catat Pemakaian Aroma (Log Wear)' : 'Log Fragrance Wear'}
      subtitle={locale === 'id' ? 'Kurangkan cairan botol & lacak kebiasaan semprotanmu' : 'Record sprays and track your daily scent'}
      maxWidth="max-w-md"
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-3 bg-[#f4f3e6] border border-[#d9d7c9]">
          <div className="w-12 h-12 bg-[#333333] text-[#fffef2] flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <p className="font-serif text-[24px] leading-[32px] font-normal text-[#000000]">
            {locale === 'id' ? 'Pemakaian Berhasil Dicatat!' : 'Wear Logged Successfully!'}
          </p>
          <p className="text-[12px] text-[#5c5c5c] font-mono tabular-nums">
            -{(spraysCount * 0.12).toFixed(1)} ml {locale === 'id' ? 'dikurangkan dari botolmu.' : 'decremented from bottle.'}
          </p>
        </div>
      ) : activeBottles.length === 0 ? (
        <div className="py-6 text-center space-y-3">
          <p className="text-[12px] text-[#5c5c5c]">
            {locale === 'id' 
              ? 'Belum ada botol aktif di lemarimu. Silakan tambahkan botol terlebih dahulu.' 
              : 'No active bottles in your library. Please add a bottle first.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 bg-[#333333] text-[#fffef2] text-[12px] font-medium"
          >
            {locale === 'id' ? 'Tutup' : 'Close'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-[12px]">
          {/* Select Bottle */}
          <div className="space-y-1">
            <label className="font-medium block text-[#000000]">
              {locale === 'id' ? 'Pilih Botol dari Lemarimu' : 'Select Perfume Bottle'}
            </label>
            <select
              value={selectedBottleId}
              onChange={e => setSelectedBottleId(e.target.value)}
              className="w-full min-h-[44px] p-2.5 bg-[#fffef2] border border-[#8a8a8a] text-[12px] text-[#000000] focus:outline-hidden"
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

          {/* Stepper for Sprays Count */}
          <div className="space-y-1.5 bg-[#f4f3e6] p-4 border border-[#d9d7c9]">
            <div className="flex justify-between items-baseline">
              <label className="font-medium block text-[#000000]">
                {locale === 'id' ? 'Jumlah Semprotan' : 'Number of Sprays'}
              </label>
              <span className="text-[12px] font-mono tabular-nums text-[#5c5c5c]">
                ≈ -{(spraysCount * 0.12).toFixed(1)} ml
              </span>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSpraysCount(prev => Math.max(1, prev - 1))}
                className="w-12 h-12 min-h-[44px] min-w-[44px] bg-[#fffef2] border border-[#8a8a8a] flex items-center justify-center text-[16px] font-medium hover:bg-[#f4f3e6] transition"
                aria-label="Kurangi semprotan"
              >
                <Minus className="w-4 h-4 text-[#000000]" />
              </button>

              <div className="text-center">
                <span className="font-serif text-[32px] leading-[40px] font-normal text-[#000000] tabular-nums">{spraysCount}</span>
                <span className="text-[12px] text-[#5c5c5c] block uppercase tracking-wider">Semprot / Sprays</span>
              </div>

              <button
                type="button"
                onClick={() => setSpraysCount(prev => Math.min(12, prev + 1))}
                className="w-12 h-12 min-h-[44px] min-w-[44px] bg-[#fffef2] border border-[#8a8a8a] flex items-center justify-center text-[16px] font-medium hover:bg-[#f4f3e6] transition"
                aria-label="Tambah semprotan"
              >
                <Plus className="w-4 h-4 text-[#000000]" />
              </button>
            </div>
          </div>

          {/* Context: Occasion Chips */}
          <div className="space-y-1.5">
            <label className="font-medium block text-[#000000]">
              {locale === 'id' ? 'Konteks / Acara Pemakaian' : 'Occasion'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map(occ => (
                <button
                  type="button"
                  key={occ}
                  onClick={() => setOccasion(occ)}
                  className={`min-h-[40px] px-3 py-1.5 border text-[12px] font-medium transition ${
                    occasion === occ 
                      ? 'bg-[#333333] text-[#fffef2] border-[#333333]' 
                      : 'bg-[#fffef2] border-[#d9d7c9] text-[#5c5c5c] hover:text-[#000000]'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Chips */}
          <div className="space-y-1.5">
            <label className="font-medium block text-[#000000]">
              {locale === 'id' ? 'Suasana Hati (Mood)' : 'Mood'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMood(m)}
                  className={`min-h-[40px] px-3 py-1.5 border text-[12px] font-medium transition ${
                    mood === m 
                      ? 'bg-[#333333] text-[#fffef2] border-[#333333]' 
                      : 'bg-[#fffef2] border-[#d9d7c9] text-[#5c5c5c] hover:text-[#000000]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Weather Chips */}
          <div className="space-y-1.5">
            <label className="font-medium block text-[#000000]">
              {locale === 'id' ? 'Cuaca Saat Dipakai' : 'Weather'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WEATHERS.map(w => (
                <button
                  type="button"
                  key={w}
                  onClick={() => setWeather(w)}
                  className={`min-h-[40px] px-3 py-1.5 border text-[12px] font-medium transition ${
                    weather === w 
                      ? 'bg-[#333333] text-[#fffef2] border-[#333333]' 
                      : 'bg-[#fffef2] border-[#d9d7c9] text-[#5c5c5c] hover:text-[#000000]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Compliment Received Toggle */}
          <label className="flex items-center gap-3 p-3 bg-[#fffef2] border border-[#d9d7c9] cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={compliment}
              onChange={e => setCompliment(e.target.checked)}
              className="w-4 h-4 accent-[#333333]"
            />
            <div className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${compliment ? 'text-[#b3261e] fill-[#b3261e]' : 'text-[#8a8a8a]'}`} />
              <span className="font-medium text-[12px] text-[#000000]">
                {locale === 'id' ? 'Mendapat pujian dari orang lain hari ini' : 'Received a compliment today'}
              </span>
            </div>
          </label>

          {/* Note Input */}
          <div className="space-y-1">
            <label className="font-medium block text-[#000000]">
              {locale === 'id' ? 'Catatan Singkat (Opsional)' : 'Quick Note (Optional)'}
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={locale === 'id' ? 'Cth: Disemprot di kemeja putih, tahan 6 jam...' : 'E.g. Sprayed on white shirt, lasted 6 hours...'}
              className="w-full min-h-[44px] p-2.5 bg-[#fffef2] border border-[#8a8a8a] text-[12px] text-[#000000] focus:outline-hidden"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] h-12 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[14px] font-medium flex items-center justify-center gap-2 transition"
            >
              <Droplet className="w-4 h-4 text-[#fffef2]" />
              <span>{locale === 'id' ? 'Simpan Catatan Pemakaian' : 'Save Wear Log'}</span>
            </button>
          </div>
        </form>
      )}
    </BottomSheetOrModal>
  );
};
