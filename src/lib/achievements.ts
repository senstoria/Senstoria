export interface AchievementBadge {
  id: string;
  titleId: string;
  titleEn: string;
  descriptionId: string;
  descriptionEn: string;
  icon: string; // Lucide icon identifier
  tier: 'bronze' | 'silver' | 'gold';
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export function computeUserAchievements(params: {
  bottleCount: number;
  wearLogCount: number;
  reviewCount: number;
  storyCount: number;
  quizCompleted: boolean;
}): AchievementBadge[] {
  const { bottleCount, wearLogCount, reviewCount, storyCount, quizCompleted } = params;

  return [
    {
      id: 'badge_explorer',
      titleId: 'Fragrance Explorer',
      titleEn: 'Fragrance Explorer',
      descriptionId: 'Selesaikan kuis Scent Finder untuk memetakan olfactive persona pribadimu.',
      descriptionEn: 'Completed the Scent Finder quiz to map your personal olfactive persona.',
      icon: 'Compass',
      tier: 'bronze',
      progress: quizCompleted ? 1 : 0,
      maxProgress: 1,
      isUnlocked: quizCompleted,
      unlockedAt: quizCompleted ? 'Baru saja' : undefined
    },
    {
      id: 'badge_collector',
      titleId: bottleCount >= 10 ? 'Master Curator' : bottleCount >= 5 ? 'Avid Collector' : 'Fragrance Collector',
      titleEn: bottleCount >= 10 ? 'Master Curator' : bottleCount >= 5 ? 'Avid Collector' : 'Fragrance Collector',
      descriptionId: 'Koleksi minimal 5 botol parfum di lemari pribadimu.',
      descriptionEn: 'Collect at least 5 fragrances in your personal library.',
      icon: 'Package',
      tier: bottleCount >= 10 ? 'gold' : bottleCount >= 5 ? 'silver' : 'bronze',
      progress: Math.min(bottleCount, 5),
      maxProgress: 5,
      isUnlocked: bottleCount >= 1,
      unlockedAt: bottleCount >= 1 ? 'Aktif' : undefined
    },
    {
      id: 'badge_wear_streak',
      titleId: wearLogCount >= 15 ? 'Signature Connoisseur' : wearLogCount >= 5 ? 'Daily Scent Devotee' : 'First Spritz',
      titleEn: wearLogCount >= 15 ? 'Signature Connoisseur' : wearLogCount >= 5 ? 'Daily Scent Devotee' : 'First Spritz',
      descriptionId: 'Catat semprotan harianmu di Scent Diary untuk melacak rotasi volume.',
      descriptionEn: 'Log daily wears in your Scent Diary to track bottle depletion.',
      icon: 'Droplet',
      tier: wearLogCount >= 15 ? 'gold' : wearLogCount >= 5 ? 'silver' : 'bronze',
      progress: Math.min(wearLogCount, 5),
      maxProgress: 5,
      isUnlocked: wearLogCount >= 1,
      unlockedAt: wearLogCount >= 1 ? 'Aktif' : undefined
    },
    {
      id: 'badge_reviewer',
      titleId: reviewCount >= 3 ? 'Trusted Critic' : 'Honest Reviewer',
      titleEn: reviewCount >= 3 ? 'Trusted Critic' : 'Honest Reviewer',
      descriptionId: 'Tulis ulasan jujur untuk memandu pencinta parfum lain di iklim tropis.',
      descriptionEn: 'Write honest reviews to guide fellow fragrance enthusiasts in tropical climate.',
      icon: 'Star',
      tier: reviewCount >= 3 ? 'silver' : 'bronze',
      progress: Math.min(reviewCount, 3),
      maxProgress: 3,
      isUnlocked: reviewCount >= 1,
      unlockedAt: reviewCount >= 1 ? 'Aktif' : undefined
    },
    {
      id: 'badge_storyteller',
      titleId: 'Olfactive Poet',
      titleEn: 'Olfactive Poet',
      descriptionId: 'Publikasikan Cerita Aroma (Scent Story) tentang momen berkesan bersamanya.',
      descriptionEn: 'Publish a Scent Story capturing a memorable moment with your fragrance.',
      icon: 'BookOpen',
      tier: 'gold',
      progress: Math.min(storyCount, 1),
      maxProgress: 1,
      isUnlocked: storyCount >= 1,
      unlockedAt: storyCount >= 1 ? 'Aktif' : undefined
    }
  ];
}
