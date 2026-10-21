import React from 'react';
import { 
  Award, 
  Sparkles, 
  Compass, 
  Layers, 
  MessageSquare, 
  BookOpen, 
  Sun, 
  Droplet, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';
import { BottleState, ReviewState, ScentStoryState, WearState } from '../lib/derivedCalculations.ts';

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
  wearLogs: WearState[];
  stories: ScentStoryState[];
  reviews: ReviewState[];
  locale?: 'id' | 'en';
}

export function computeUserAchievements(
  bottles: BottleState[],
  wearLogs: WearState[],
  stories: ScentStoryState[],
  reviews: ReviewState[]
): AchievementBadge[] {
  const activeBottles = bottles.filter(b => !b.deleted_at);
  const totalBottles = activeBottles.length;
  const totalWears = wearLogs.length;
  const totalStories = stories.filter(s => s.status === 'published').length;
  const totalReviews = reviews.length;

  return [
    {
      id: 'fragrance_explorer',
      name: 'Penjelajah Aroma (Fragrance Explorer)',
      nameEn: 'Fragrance Explorer',
      category: 'Eksplorasi',
      description: 'Mencoba atau mengoleksi berbagai profil aroma berbeda di lemari pribadimu.',
      descriptionEn: 'Explore distinct olfactive profiles in your fragrance journey.',
      iconName: 'Compass',
      isUnlocked: totalBottles >= 2 || totalWears >= 3,
      progressText: `${Math.min(totalBottles, 2)}/2 Profil`
    },
    {
      id: 'collector',
      name: 'Kolektor Parfum (Scent Collector)',
      nameEn: 'Fragrance Collector',
      category: 'Koleksi',
      description: 'Memiliki minimal 3 botol aktif (full bottle atau decant) di lemari aroma.',
      descriptionEn: 'Curate at least 3 active bottles in your personal wardrobe.',
      iconName: 'Layers',
      isUnlocked: totalBottles >= 3,
      progressText: `${Math.min(totalBottles, 3)}/3 Botol`
    },
    {
      id: 'habit_sprays',
      name: 'Rutinitas Semprot (1-Tap Ritualist)',
      nameEn: '1-Tap Ritualist',
      category: 'Aktivitas',
      description: 'Mencatat minimal 5 semprotan harian ke dalam log aroma.',
      descriptionEn: 'Log at least 5 daily wear applications to your scent diary.',
      iconName: 'Droplet',
      isUnlocked: totalWears >= 5,
      progressText: `${Math.min(totalWears, 5)}/5 Semprot`
    },
    {
      id: 'reviewer',
      name: 'Pengulas Terpercaya (Community Reviewer)',
      nameEn: 'Verified Reviewer',
      category: 'Komunitas',
      description: 'Menulis ulasan multi-kriteria untuk membantu komunitas menemukan aroma terbaik.',
      descriptionEn: 'Share verified multi-criteria reviews with the Indonesian fragrance community.',
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
      descriptionEn: 'Publish heartfelt personal scent stories and olfactory memoirs.',
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
    const className = `w-5 h-5 ${isUnlocked ? 'text-[#8A4B14]' : 'text-[#8C8C8C]'}`;
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
    <div className="space-y-4 bg-white p-6 border border-[#D9D7C9]">
      <div className="flex flex-wrap justify-between items-baseline border-b border-[#D9D7C9] pb-3 gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8A4B14]">
            <Award className="w-4 h-4" />
            <span>Pencapaian & Lencana Penghargaan (Badges)</span>
          </div>
          <p className="text-xs text-[#5C5C5C]">
            Lencana eksklusif yang kamu buka berdasarkan aktivitas semprot, koleksi lemari, dan ulasan komunitas.
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-sm font-bold text-[#1A1A1A]">{unlockedCount} / {badges.length}</span>
          <span className="text-[11px] text-[#5C5C5C] block">Terbuka</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {badges.map(b => (
          <div 
            key={b.id}
            className={`p-3.5 border transition-all ${
              b.isUnlocked 
                ? 'bg-[#F4F3E6]/60 border-[#8A4B14]/40 shadow-xs' 
                : 'bg-neutral-50/70 border-dashed border-[#D9D7C9] opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="p-2 bg-white border border-[#D9D7C9] rounded-xs">
                {renderIcon(b.iconName, b.isUnlocked)}
              </div>
              {b.isUnlocked ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Terbuka
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-500 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5">
                  <Lock className="w-2.5 h-2.5" /> {b.progressText}
                </span>
              )}
            </div>

            <h4 className="font-serif text-base font-bold mt-2 text-[#1A1A1A]">
              {locale === 'id' ? b.name : b.nameEn}
            </h4>
            <p className="text-[11px] text-[#5C5C5C] mt-1 line-clamp-2">
              {locale === 'id' ? b.description : b.descriptionEn}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
