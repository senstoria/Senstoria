import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Compass, 
  Layers, 
  Droplet, 
  MessageSquare, 
  BookOpen, 
  Sun 
} from 'lucide-react';
import { BottleState, WearLogState, StoryState, ReviewState } from '../lib/derivedCalculations.ts';
import { Locale } from '../lib/i18n.ts';

export interface AchievementBadge {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description: string;
  descriptionEn: string;
  iconName: string;
  isUnlocked: boolean;
  progressText: string;
}

interface AchievementBadgesProps {
  bottles: BottleState[];
  wearLogs: WearLogState[];
  stories: StoryState[];
  reviews: ReviewState[];
  locale?: Locale;
}

export function computeUserAchievements(
  bottles: BottleState[],
  wearLogs: WearLogState[],
  stories: StoryState[],
  reviews: ReviewState[]
): AchievementBadge[] {
  const totalBottles = bottles.length;
  const totalWears = wearLogs.length;
  const totalStories = stories.length;
  const totalReviews = reviews.length;

  return [
    {
      id: 'first_spray',
      name: 'Semprotan Pertama (First Mist)',
      nameEn: 'First Mist',
      category: 'Eksplorasi',
      description: 'Mencatat semprotan harian pertama ke dalam jurnal pemakaian aroma.',
      descriptionEn: 'Logged your very first perfume wear into the scent journal.',
      iconName: 'Droplet',
      isUnlocked: totalWears >= 1,
      progressText: `${Math.min(totalWears, 1)}/1 Semprotan`
    },
    {
      id: 'curator_novice',
      name: 'Kurator Pemula (Novice Curator)',
      nameEn: 'Novice Curator',
      category: 'Koleksi',
      description: 'Menambahkan setidaknya 3 botol wewangian ke dalam lemari koleksi pribadi.',
      descriptionEn: 'Added at least 3 fragrances to your private collection wardrobe.',
      iconName: 'Layers',
      isUnlocked: totalBottles >= 3,
      progressText: `${Math.min(totalBottles, 3)}/3 Botol`
    },
    {
      id: 'critic_initiate',
      name: 'Kritikus Mandiri (Independent Reviewer)',
      nameEn: 'Independent Reviewer',
      category: 'Komunitas',
      description: 'Menulis ulasan multi-kriteria transparan tanpa intervensi pihak sponsor.',
      descriptionEn: 'Published a multi-criteria community wear review.',
      iconName: 'MessageSquare',
      isUnlocked: totalReviews >= 1,
      progressText: `${Math.min(totalReviews, 1)}/1 Ulasan`
    },
    {
      id: 'storyteller',
      name: 'Penutur Memori (Scent Storyteller)',
      nameEn: 'Scent Storyteller',
      category: 'Memori',
      description: 'Mengabadikan momen dan kenangan berharga yang terikat dengan aroma favorit.',
      descriptionEn: 'Publish personal scent stories and olfactory memoirs.',
      iconName: 'BookOpen',
      isUnlocked: totalStories >= 1,
      progressText: `${Math.min(totalStories, 1)}/1 Cerita`
    },
    {
      id: 'tropics_master',
      name: 'Pakar Iklim Tropis (Tropical Connoisseur)',
      nameEn: 'Tropical Connoisseur',
      category: 'Spesialis',
      description: 'Mengoleksi dan mengenakan parfum yang tahan banting di cuaca lembap Indonesia.',
      descriptionEn: 'Master high-humidity wear selections suited for the Indonesian climate.',
      iconName: 'Sun',
      isUnlocked: totalBottles >= 1 && totalWears >= 2,
      progressText: totalWears >= 2 ? 'Tercapai' : `${totalWears}/2 Semprot Tropis`
    }
  ];
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  bottles,
  wearLogs,
  stories,
  reviews,
  locale = 'id'
}) => {
  const badges = computeUserAchievements(bottles, wearLogs, stories, reviews);
  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  const renderIcon = (name: string, isUnlocked: boolean) => {
    const className = `w-5 h-5 ${isUnlocked ? 'text-[#000000]' : 'text-[#8a8a8a]'}`;
    switch (name) {
      case 'Compass': return <Compass className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Droplet': return <Droplet className={className} />;
      case 'MessageSquare': return <MessageSquare className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Sun': return <Sun className={className} />;
      default: return <Award className={className} />;
    }
  };

  return (
    <div className="space-y-4 bg-[#fffef2] p-6 border border-[#d9d7c9]">
      <div className="flex flex-wrap justify-between items-baseline border-b border-[#d9d7c9] pb-3 gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wider text-[#5c5c5c]">
            <Award className="w-4 h-4 text-[#333333]" />
            <span>Pencapaian & Lencana Penghargaan (Badges)</span>
          </div>
          <p className="text-[12px] text-[#5c5c5c]">
            Lencana eksklusif yang kamu buka berdasarkan aktivitas semprot, koleksi lemari, dan ulasan komunitas.
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono tabular-nums text-[14px] font-medium text-[#000000]">{unlockedCount} / {badges.length}</span>
          <span className="text-[12px] text-[#5c5c5c] block">Terbuka</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
        {badges.map(b => (
          <div 
            key={b.id}
            className={`p-4 border transition-all h-full flex flex-col justify-between ${
              b.isUnlocked 
                ? 'bg-[#f4f3e6] border-[#333333]' 
                : 'bg-[#fffef2] border-dashed border-[#d9d7c9] opacity-75'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="p-2 bg-[#fffef2] border border-[#d9d7c9] rounded-none">
                  {renderIcon(b.iconName, b.isUnlocked)}
                </div>
                {b.isUnlocked ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#000000] bg-[#fffef2] border border-[#333333] px-2 py-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#000000]" /> Terbuka
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[12px] font-mono tabular-nums text-[#5c5c5c] bg-[#fffef2] border border-[#d9d7c9] px-2 py-0.5">
                    <Lock className="w-3 h-3" /> {b.progressText}
                  </span>
                )}
              </div>

              <h4 className="font-sans text-[16px] leading-[22px] font-medium mt-3 text-[#000000]">
                {locale === 'id' ? b.name : b.nameEn}
              </h4>
              <p className="text-[12px] text-[#5c5c5c] mt-1 leading-relaxed">
                {locale === 'id' ? b.description : b.descriptionEn}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
