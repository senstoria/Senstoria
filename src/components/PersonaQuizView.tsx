import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Award, 
  RotateCcw, 
  Share2, 
  Layers,
  Droplet
} from 'lucide-react';
import { ScentDnaRadarChart } from './ScentDnaRadarChart.tsx';
import { Locale } from '../lib/i18n.ts';

export interface UserPersonaProfile {
  title: string;
  tagline: string;
  description: string;
  primaryFamily: string;
  secondaryFamily: string;
  signatureNotes: string[];
  climateRecommendation: string;
  radarBreakdown: Record<string, number>;
  completedAt: string;
}

interface PersonaQuizViewProps {
  onBackToDashboard: () => void;
  onSelectPerfume: (id: string) => void;
  locale: Locale;
}

interface Question {
  id: number;
  textId: string;
  textEn: string;
  options: {
    labelId: string;
    labelEn: string;
    family: 'Woody' | 'Floral' | 'Fresh' | 'Ambery' | 'Gourmand' | 'Aromatic';
    iconName?: string;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    textId: '1. Suasana apa yang paling membuatmu merasa tenang dan berenergi?',
    textEn: '1. Which atmosphere makes you feel most relaxed and invigorated?',
    options: [
      { labelId: 'Taman basah sehabis hujan & angin sejuk', labelEn: 'Wet garden after rain & cool breeze', family: 'Fresh' },
      { labelId: 'Perpustakaan tua dengan rak kayu & buku antik', labelEn: 'Old library with polished wood & antique books', family: 'Woody' },
      { labelId: 'Kebun bunga mekar di pagi hari yang cerah', labelEn: 'Blooming flower garden on a bright morning', family: 'Floral' },
      { labelId: 'Kedai kopi hangat beraroma pastry & vanila', labelEn: 'Cozy coffee shop smelling of pastry & vanilla', family: 'Gourmand' },
      { labelId: 'Lounge malam berpenerangan temaram & musik jazz', labelEn: 'Dimly lit evening lounge with jazz music', family: 'Ambery' }
    ]
  },
  {
    id: 2,
    textId: '2. Kapan momen terpenting bagimu untuk mengenakan parfum?',
    textEn: '2. What is your most important moment to wear perfume?',
    options: [
      { labelId: 'Pagi hari sebelum berangkat kerja / aktivitas aktif', labelEn: 'Morning before starting work / active day', family: 'Fresh' },
      { labelId: 'Pertemuan formal dan presentasi bisnis penting', labelEn: 'Formal meetings and executive presentations', family: 'Woody' },
      { labelId: 'Kencan santai atau makan malam romantis berdua', labelEn: 'Casual dates or romantic intimate dinner', family: 'Gourmand' },
      { labelId: 'Akhir pekan santai saat menikmati waktu luang', labelEn: 'Relaxed weekends while enjoying personal downtime', family: 'Aromatic' },
      { labelId: 'Pesta malam, gala resepsi, atau acara seni eksklusif', labelEn: 'Night parties, gala receptions, or art galleries', family: 'Floral' }
    ]
  },
  {
    id: 3,
    textId: '3. Karakter atau impresi apa yang ingin kamu pancarkan ke orang sekitar?',
    textEn: '3. What impression or aura do you wish to project to people around you?',
    options: [
      { labelId: 'Bersih, segar, rapi, dan mudah didekati', labelEn: 'Clean, fresh, polished, and approachable', family: 'Fresh' },
      { labelId: 'Misterius, percaya diri, berkharisma, dan berwibawa', labelEn: 'Mysterious, confident, charismatic, and grounded', family: 'Woody' },
      { labelId: 'Manis, hangat, ramah, dan memikat', labelEn: 'Sweet, warm, friendly, and irresistible', family: 'Gourmand' },
      { labelId: 'Elegan, puitis, lembut, dan penuh keanggunan', labelEn: 'Elegant, poetic, graceful, and refined', family: 'Floral' },
      { labelId: 'Mewah, sensual, berani, dan tak terlupakan', labelEn: 'Opulent, sensual, bold, and unforgettable', family: 'Ambery' }
    ]
  },
  {
    id: 4,
    textId: '4. Bagaimana kamu menyiasati cuaca panas tropis Indonesia yang lembap?',
    textEn: '4. How do you approach the humid Indonesian tropical climate?',
    options: [
      { labelId: 'Selalu memilih kesegaran citrus, bergamot, atau akuatik', labelEn: 'Always lean on crisp citrus, bergamot, or aquatic', family: 'Fresh' },
      { labelId: 'Menyukai sentuhan teh melati, mint, atau rempah aromatik sejuk', labelEn: 'Love jasmine tea, herbal mint, or cooling aromatics', family: 'Aromatic' },
      { labelId: 'Tetap menyukai kehangatan kayu kering seperti cendana/cedar', labelEn: 'Still prefer dry airy woods like sandalwood/cedarwood', family: 'Woody' },
      { labelId: 'Suka aroma bunga putih seperti sedap malam atau melati', labelEn: 'Fond of night-blooming white florals or jasmine', family: 'Floral' },
      { labelId: 'Lebih banyak di ruangan ber-AC dingin sehingga bebas memilih aroma manis/hangat', labelEn: 'Mostly in chilled AC spaces, free to enjoy richer sweet/warm scents', family: 'Gourmand' }
    ]
  },
  {
    id: 5,
    textId: '5. Sentuhan jejak akhir (dry-down) seperti apa yang paling kamu sukai di kulitmu?',
    textEn: '5. What dry-down trail on your skin feels most satisfying to you?',
    options: [
      { labelId: 'Sabun mewah bersih, linen putih, dan musk ringan', labelEn: 'Clean luxury soap, white linen, and light musk', family: 'Fresh' },
      { labelId: 'Kayu cedarwood halus, vetiver kering, dan lumut oakmoss', labelEn: 'Polished cedarwood, dry vetiver, and subtle oakmoss', family: 'Woody' },
      { labelId: 'Vanilla Madagascar creamy, tonka bean, dan karamel halus', labelEn: 'Creamy Madagascar vanilla, tonka bean, and spun caramel', family: 'Gourmand' },
      { labelId: 'Amber keemasan, resin dupa labdanum, dan rempah manis', labelEn: 'Golden amber, labdanum resin, and sweet spice', family: 'Ambery' },
      { labelId: 'Kelopak mawar halus, iris powdery, dan kelopak melati', labelEn: 'Delicate rose petals, powdery iris, and jasmine', family: 'Floral' }
    ]
  }
];

export const PersonaQuizView: React.FC<PersonaQuizViewProps> = ({
  onBackToDashboard,
  onSelectPerfume,
  locale
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<UserPersonaProfile | null>(() => {
    try {
      const saved = localStorage.getItem('senstoria_user_persona');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSelectOption = (family: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentStep]: family }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    const counts: Record<string, number> = {
      Woody: 0,
      Floral: 0,
      Fresh: 0,
      Ambery: 0,
      Gourmand: 0,
      Aromatic: 0
    };

    Object.values(selectedAnswers).forEach(fam => {
      if (counts[fam] !== undefined) counts[fam] += 1;
    });

    const total = Math.max(Object.values(counts).reduce((a, b) => a + b, 0), 1);
    const radarBreakdown: Record<string, number> = {};
    for (const [k, v] of Object.entries(counts)) {
      radarBreakdown[k] = Math.round((v / total) * 100);
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topFamily = sorted[0][0];
    const secondFamily = sorted[1][0] || 'Fresh';

    let title = 'The Modern Minimalist';
    let tagline = 'Penyuka kesegaran alami yang bersih, bersahaja, dan memikat tanpa berlebihan.';
    let description = 'Kamu memiliki apresiasi mendalam terhadap aroma yang menghadirkan rasa tenang dan kesegaran sejati. Notes seperti bergamot, teh melati, dan lumut basah adalah zona kenyamananmu.';
    let signatureNotes = ['Bergamot', 'Jasmine Tea', 'White Musk', 'Cedarwood'];
    let climateRec = 'Sangat tahan uji di cuaca tropis terik dan lembap, memberikan kesan segar sepanjang hari.';

    if (topFamily === 'Woody') {
      title = 'The Atmospheric Architect';
      tagline = 'Sosok berkharisma dengan ketertarikan pada tekstur kayu hangat, ketenangan, dan wibawa.';
      description = 'Koleksi impianmu berakar pada aroma kayu cedar, cendana nusantara, dan vetiver kering yang memberikan rasa tenang berwibawa di setiap langkah.';
      signatureNotes = ['Sandalwood', 'Cedarwood', 'Vetiver', 'Black Pepper'];
      climateRec = 'Sangat anggun untuk ruang ber-AC dan pertemuan formal sore hingga malam.';
    } else if (topFamily === 'Gourmand') {
      title = 'The Cozy Connoisseur';
      tagline = 'Pencinta nuansa hangat, manis, dan akrab yang selalu meninggalkan kenangan tak terlupakan.';
      description = 'Kamu menggemari perpaduan manis lembut vanilla, roasted coffee bean, dan tonka yang memeluk erat di kulit.';
      signatureNotes = ['Madagascar Vanilla', 'Roasted Coffee', 'Tonka Bean', 'Almond'];
      climateRec = 'Paling optimal untuk malam hari, suasana santai berhujan, atau ruangan ber-AC sejuk.';
    } else if (topFamily === 'Floral') {
      title = 'The Poetic Romantic';
      tagline = 'Jiwa puitis dengan kepekaan rasa yang tinggi terhadap estetika bunga-bunga tropis.';
      description = 'Bunga sedap malam, melati, dan kelopak mawar memberikan pesona klasik yang elegan di sekitarmu.';
      signatureNotes = ['Tuberose', 'Jasmine Sambac', 'Damask Rose', 'Amber'];
      climateRec = 'Cocok untuk suasana sore menjelang malam dan acara spesial.';
    } else if (topFamily === 'Ambery') {
      title = 'The Enigmatic Luminary';
      tagline = 'Misterius, berani, dan memancarkan kemewahan resin amber yang dalam.';
      description = 'Kamu tidak ragu tampil beda dengan aroma rempah hangat dan resin yang memberikan siluet wangi kaya dan sensual.';
      signatureNotes = ['Golden Amber', 'Cardamom', 'Labdanum', 'Incense'];
      climateRec = 'Luar biasa untuk malam hari dan gala resepsi.';
    }

    const newProfile: UserPersonaProfile = {
      title,
      tagline,
      description,
      primaryFamily: topFamily,
      secondaryFamily: secondFamily,
      signatureNotes,
      climateRecommendation: climateRec,
      radarBreakdown,
      completedAt: new Date().toISOString()
    };

    setResult(newProfile);
    try {
      localStorage.setItem('senstoria_user_persona', JSON.stringify(newProfile));
    } catch {}
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setCurrentStep(0);
    setResult(null);
  };

  const q = QUESTIONS[currentStep];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      
      {/* ── TOP NAV ── */}
      <div className="flex items-center justify-between border-b border-[#D9D7C9] pb-4">
        <button 
          onClick={onBackToDashboard}
          className="text-xs font-semibold text-[#5C5C5C] hover:text-black flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </button>

        <span className="text-xs font-mono text-[#8A4B14] uppercase">
          {result ? 'Hasil Persona Olfaktif' : `Pertanyaan ${currentStep + 1} dari ${QUESTIONS.length}`}
        </span>
      </div>

      {result ? (
        /* ── RESULT DASHBOARD CARD ── */
        <div className="bg-white border border-[#D9D7C9] p-6 md:p-8 space-y-6 animate-fade-in">
          <div className="text-center space-y-2 border-b border-[#D9D7C9] pb-6">
            <span className="px-3 py-1 bg-[#F4F3E6] border border-[#D9D7C9] text-xs font-mono uppercase tracking-widest text-[#8A4B14] inline-block">
              Persona Olfaktif Kamu
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#1A1A1A]">
              {result.title}
            </h2>
            <p className="text-sm font-serif italic text-[#5C5C5C] max-w-lg mx-auto">
              "{result.tagline}"
            </p>
          </div>

          {/* Radar Visualization */}
          <div className="bg-[#FFFEF2] border border-[#D9D7C9] p-4">
            <h3 className="font-serif text-center font-bold text-sm text-[#1A1A1A] mb-2">
              Peta Distribusi DNA Aroma Pilihanmu
            </h3>
            <ScentDnaRadarChart familyPercentages={result.radarBreakdown} height={260} />
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-[#333333]">
            <p>{result.description}</p>
            <div className="p-3 bg-[#F4F3E6] border border-[#D9D7C9] space-y-1">
              <strong className="block text-[#1A1A1A]">Notes Kunci Rekomendasi:</strong>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.signatureNotes.map(n => (
                  <span key={n} className="px-2 py-0.5 bg-white border border-[#D9D7C9] font-mono text-[11px]">
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <p className="font-mono text-[11px] text-[#5C5C5C]">
              <strong>Kesesuaian Cuaca Tropis:</strong> {result.climateRecommendation}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#D9D7C9]">
            <button
              onClick={handleRetake}
              className="px-4 py-2 border border-[#333333] hover:bg-[#F4F3E6] text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ulangi Kuis</span>
            </button>

            <button
              onClick={onBackToDashboard}
              className="px-6 py-2 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Terapkan ke Profil & Scent DNA</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── QUESTION STEP ── */
        <div className="bg-white border border-[#D9D7C9] p-6 md:p-8 space-y-6">
          {/* Progress bar */}
          <div className="w-full bg-[#EAE8D9] h-1.5">
            <div 
              className="bg-[#8A4B14] h-full transition-all duration-300" 
              style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
              {locale === 'id' ? q.textId : q.textEn}
            </h2>
            <p className="text-xs text-[#5C5C5C]">
              Pilih satu yang paling menggambarkan naluri dan preferensimu.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {q.options.map(opt => {
              const isSelected = selectedAnswers[currentStep] === opt.family;
              return (
                <button
                  key={opt.labelId}
                  onClick={() => handleSelectOption(opt.family)}
                  className={`w-full p-4 border text-left transition flex items-center justify-between gap-3 ${
                    isSelected 
                      ? 'border-[#8A4B14] bg-[#FBF8F2] shadow-xs' 
                      : 'border-[#D9D7C9] bg-white hover:border-[#1A1A1A] hover:bg-[#FAFAF7]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className={`text-xs ${isSelected ? 'font-bold text-black' : 'text-neutral-800'}`}>
                      {locale === 'id' ? opt.labelId : opt.labelEn}
                    </p>
                    <span className="text-[10px] font-mono text-[#8A4B14] uppercase">
                      Keluarga: {opt.family}
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#8A4B14] bg-[#8A4B14]' : 'border-[#D9D7C9]'
                  }`}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-[#D9D7C9]">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className={`text-xs font-semibold px-4 py-2 border border-[#D9D7C9] ${
                currentStep === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#F4F3E6]'
              }`}
            >
              Sebelumnya
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedAnswers[currentStep]}
              className={`px-6 py-2.5 bg-[#1A1A1A] text-[#FFFEF2] text-xs font-semibold flex items-center gap-1.5 transition ${
                !selectedAnswers[currentStep] ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black'
              }`}
            >
              <span>{currentStep === QUESTIONS.length - 1 ? 'Hitung Profil Scent DNA' : 'Selanjutnya'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
