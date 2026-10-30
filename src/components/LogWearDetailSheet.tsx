import React, { useState } from 'react';
import { Minus, Plus, Heart, Droplet, Check } from 'lucide-react';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { BottleState, WearLogState, mlForSprays } from '../lib/derivedCalculations.ts';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { translations, Locale } from '../lib/i18n.ts';

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
  const [occasion, setOccasion] = useState<string>(translations[locale].logWearOptions.occasions[0].value);
  const [mood, setMood] = useState<string>(translations[locale].logWearOptions.moods[0].value);
  const [weather, setWeather] = useState<string>(translations[locale].logWearOptions.weathers[0].value);
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
        sprays: spraysCount,
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
      locale={locale}
      title={translations[locale].logWear.catatPemakaianAromaLogWear}
      subtitle={translations[locale].logWear.kurangkanCairanBotolLacakKebiasaanSem}
      maxWidth="max-w-md"
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-3 bg-surface border border-hairline">
          <div className="w-12 h-12 bg-bar text-paper flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <p className="font-serif text-[24px] leading-[32px] font-normal text-ink">
            {translations[locale].logWear.pemakaianBerhasilDicatat}
          </p>
          <p className="text-[12px] text-secondary font-mono tabular-nums">
            -{mlForSprays(spraysCount).toFixed(1)} ml {translations[locale].logWear.dikurangkanDariBotolmu}
          </p>
        </div>
      ) : activeBottles.length === 0 ? (
        <div className="py-6 text-center space-y-3">
          <p className="text-[12px] text-secondary">
            {translations[locale].logWear.belumAdaBotolAktifDiLemarimuSilakan}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 bg-bar text-paper text-[12px] font-medium"
          >
            {translations[locale].compareView.tutup}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-[12px]">
          {/* Select Bottle */}
          <div className="space-y-1">
            <label className="font-medium block text-ink">
              {translations[locale].logWear.pilihBotolDariLemarimu}
            </label>
            <select
              value={selectedBottleId}
              onChange={e => setSelectedBottleId(e.target.value)}
              className="w-full min-h-[44px] p-2.5 bg-paper border border-border text-[12px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              required
            >
              {activeBottles.map(b => {
                const perf = perfumes.find(p => p.id === b.perfume_id);
                return (
                  <option key={b.id} value={b.id}>
                    {perf ? `${perf.brand} — ${perf.name}` : translations[locale].app.unknownPerfume} ({b.remaining_ml} / {b.size_ml} ml)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Stepper for Sprays Count */}
          <div className="space-y-1.5 bg-surface p-4 border border-hairline">
            <div className="flex justify-between items-baseline">
              <label className="font-medium block text-ink">
                {translations[locale].logWear.jumlahSemprotan}
              </label>
              <span className="text-[12px] font-mono tabular-nums text-secondary">
                ≈ -{mlForSprays(spraysCount).toFixed(1)} ml
              </span>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSpraysCount(prev => Math.max(1, prev - 1))}
                className="w-12 h-12 min-h-[44px] min-w-[44px] bg-paper border border-border flex items-center justify-center text-[16px] font-medium hover:bg-surface transition"
                aria-label={translations[locale].logWear.decreaseSprays}
              >
                <Minus className="w-4 h-4 text-ink" />
              </button>

              <div className="text-center">
                <span className="font-serif text-[32px] leading-[40px] font-normal text-ink tabular-nums">{spraysCount}</span>
                <span className="text-[12px] text-secondary block uppercase tracking-wider">Semprot / Sprays</span>
              </div>

              <button
                type="button"
                onClick={() => setSpraysCount(prev => Math.min(12, prev + 1))}
                className="w-12 h-12 min-h-[44px] min-w-[44px] bg-paper border border-border flex items-center justify-center text-[16px] font-medium hover:bg-surface transition"
                aria-label={translations[locale].logWear.increaseSprays}
              >
                <Plus className="w-4 h-4 text-ink" />
              </button>
            </div>
          </div>

          {/* Context: Occasion Chips */}
          <div className="space-y-1.5">
            <label className="font-medium block text-ink">
              {translations[locale].logWear.konteksAcaraPemakaian}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {translations[locale].logWearOptions.occasions.map(occ => (
                <button
                  type="button"
                  key={occ.value}
                  onClick={() => setOccasion(occ.value)}
                  className={`min-h-[40px] px-3 py-1.5 border text-[12px] font-medium transition ${
                    occasion === occ.value 
                      ? 'bg-bar text-paper border-bar' 
                      : 'bg-paper border-hairline text-secondary hover:text-ink'
                  }`}
                >
                  {occ.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Chips */}
          <div className="space-y-1.5">
            <label className="font-medium block text-ink">
              {translations[locale].logWear.suasanaHatiMood}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {translations[locale].logWearOptions.moods.map(m => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`min-h-[40px] px-3 py-1.5 border text-[12px] font-medium transition ${
                    mood === m.value 
                      ? 'bg-bar text-paper border-bar' 
                      : 'bg-paper border-hairline text-secondary hover:text-ink'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weather Chips */}
          <div className="space-y-1.5">
            <label className="font-medium block text-ink">
              {translations[locale].logWear.cuacaSaatDipakai}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {translations[locale].logWearOptions.weathers.map(w => (
                <button
                  type="button"
                  key={w.value}
                  onClick={() => setWeather(w.value)}
                  className={`min-h-[40px] px-3 py-1.5 border text-[12px] font-medium transition ${
                    weather === w.value 
                      ? 'bg-bar text-paper border-bar' 
                      : 'bg-paper border-hairline text-secondary hover:text-ink'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compliment Received Toggle */}
          <label className="flex items-center gap-3 p-3 bg-paper border border-hairline cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={compliment}
              onChange={e => setCompliment(e.target.checked)}
              className="w-4 h-4 accent-bar"
            />
            <div className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${compliment ? 'text-error fill-error' : 'text-secondary'}`} />
              <span className="font-medium text-[12px] text-ink">
                {translations[locale].logWear.mendapatPujianDariOrangLainHariIni}
              </span>
            </div>
          </label>

          {/* Note Input */}
          <div className="space-y-1">
            <label className="font-medium block text-ink">
              {translations[locale].logWear.catatanSingkatOpsional}
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={translations[locale].logWear.cthDisemprotDiKemejaPutihTahan6Jam}
              className="w-full min-h-[44px] p-2.5 bg-paper border border-border text-[12px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] h-12 bg-bar hover:bg-ink text-paper text-[14px] font-medium flex items-center justify-center gap-2 transition"
            >
              <Droplet className="w-4 h-4 text-paper" />
              <span>{translations[locale].logWear.simpanCatatanPemakaian}</span>
            </button>
          </div>
        </form>
      )}
    </BottomSheetOrModal>
  );
};
