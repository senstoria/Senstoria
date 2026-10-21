import { BottleState, ScentDnaProfile } from './derivedCalculations.ts';
import { SeedPerfume } from '../data/seedPerfumes.ts';

export interface ScentDnaRecommendation {
  perfume: SeedPerfume;
  score: number;
  matchReasons: string[];
  matchedFamily: string;
}

export function recommendPerfumesByScentDna(params: {
  bottles: BottleState[];
  perfumes: SeedPerfume[];
  scentDna: ScentDnaProfile;
  limit?: number;
}): ScentDnaRecommendation[] {
  const { bottles, perfumes, scentDna, limit = 4 } = params;

  // Set of IDs already in user's library
  const ownedIds = new Set(
    bottles
      .filter(b => !b.deleted_at)
      .map(b => b.perfume_id)
  );

  // Top 2 dominant families in user's profile
  const sortedFamilies = Object.entries(scentDna.familyPercentages || {})
    .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
    .filter(([_, pct]) => (Number(pct) || 0) > 0);

  const primaryFamily = sortedFamilies[0]?.[0] || 'Fresh';
  const secondaryFamily = sortedFamilies[1]?.[0] || 'Woody';

  const userTopNotes = (scentDna.topNotes || []).map(n => n.note.toLowerCase());

  const candidates: ScentDnaRecommendation[] = [];

  for (const perfume of perfumes) {
    if (ownedIds.has(perfume.id)) continue;

    let score = 50; // base score
    const matchReasons: string[] = [];

    // Family match
    if (perfume.primary_family === primaryFamily) {
      score += 28;
      matchReasons.push(`Sesuai keluarga aroma utamamu: ${primaryFamily}`);
    } else if (perfume.primary_family === secondaryFamily || perfume.secondary_family === primaryFamily) {
      score += 18;
      matchReasons.push(`Melengkapi nuansa aroma ${secondaryFamily}`);
    }

    // Note overlap
    const perfumeNotes = `${perfume.top_notes}, ${perfume.heart_notes}, ${perfume.base_notes}`.toLowerCase();
    const sharedNotes = userTopNotes.filter(note => perfumeNotes.includes(note));
    if (sharedNotes.length > 0) {
      score += Math.min(sharedNotes.length * 7, 21);
      matchReasons.push(`Mengandung notes favoritmu: ${sharedNotes.slice(0, 2).join(', ')}`);
    }

    // Tropical heat suitability
    if (perfume.heat_suitability >= 8) {
      score += 10;
      matchReasons.push('Karakter optimal untuk cuaca tropis hangat');
    }

    // Market popularity / rating seed boost
    if (perfume.rating_seed >= 4.5) {
      score += 5;
    }

    candidates.push({
      perfume,
      score: Math.min(Math.round(score), 99),
      matchReasons,
      matchedFamily: perfume.primary_family
    });
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, limit);
}
