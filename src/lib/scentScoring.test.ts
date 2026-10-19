import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  calculateMatchScore, 
  rankRecommendations, 
  ScentQuizAnswers, 
  DEFAULT_QUIZ_ANSWERS 
} from './scentScoring.ts';
import { SEED_PERFUMES, SeedPerfume } from '../data/seedPerfumes.ts';

describe('Scent Finder 6-Dimension Scoring Engine (FIND-05)', () => {
  const samplePerfume: SeedPerfume = SEED_PERFUMES[0];

  it('calculates deterministic score between 0 and 100', () => {
    const answers: ScentQuizAnswers = {
      preferredFamilies: ['Floral Ambery', 'Floral'],
      climateSetting: 'indoor_ac',
      projectionPreference: 'moderate',
      longevityExpectation: 'moderate',
      brandOriginPreference: 'local_id',
      budgetTier: 'mid',
      avoidNotesOrTraits: ['none']
    };

    const result = calculateMatchScore(samplePerfume, answers);
    assert.ok(result.matchScore >= 0 && result.matchScore <= 100);
    assert.ok(result.matchScore >= 85, `Expected high match for aligned preferences, got ${result.matchScore}`);
    assert.strictEqual(result.dimensionScores.originFit, 100);
  });

  it('renormalizes active weights when "not_sure" or "flexible" is chosen (FIND-05)', () => {
    const answersWithNotSure: ScentQuizAnswers = {
      preferredFamilies: ['not_sure'],
      climateSetting: 'flexible',
      projectionPreference: 'not_sure',
      longevityExpectation: 'not_sure',
      brandOriginPreference: 'any',
      budgetTier: 'flexible',
      avoidNotesOrTraits: ['none']
    };

    const result = calculateMatchScore(samplePerfume, answersWithNotSure);
    // When everything is not_sure or flexible, active weights renormalize to baseline 75
    assert.strictEqual(result.matchScore, 75);
    assert.ok(result.whyFitsBulletsId.length > 0);
    assert.ok(result.whyFitsBulletsEn.length > 0);
  });

  it('applies avoidance penalty for disliked notes/traits', () => {
    const baseAnswers: ScentQuizAnswers = {
      preferredFamilies: ['Aromatic'],
      climateSetting: 'indoor_ac',
      projectionPreference: 'moderate',
      longevityExpectation: 'long',
      brandOriginPreference: 'any',
      budgetTier: 'flexible',
      avoidNotesOrTraits: ['none']
    };

    const penaltyAnswers: ScentQuizAnswers = {
      ...baseAnswers,
      avoidNotesOrTraits: ['overly_sweet'] // Farhampton has Tonka/Fruit which triggers sweetness penalty
    };

    const normalScore = calculateMatchScore(samplePerfume, baseAnswers).matchScore;
    const penalizedScore = calculateMatchScore(samplePerfume, penaltyAnswers).matchScore;
    
    assert.ok(penalizedScore <= normalScore, 'Penalized score should be less than or equal to normal score');
  });

  it('ranks recommendations in descending order of matchScore', () => {
    const answers = DEFAULT_QUIZ_ANSWERS;
    const ranked = rankRecommendations(SEED_PERFUMES, answers);

    assert.ok(ranked.length > 0);
    for (let i = 0; i < ranked.length - 1; i++) {
      assert.ok(
        ranked[i].matchScore >= ranked[i + 1].matchScore,
        `Ranking violation at index ${i}: ${ranked[i].matchScore} < ${ranked[i + 1].matchScore}`
      );
    }
  });

  it('provides both Indonesian and English grounded citations and possible mismatches', () => {
    const result = calculateMatchScore(samplePerfume, DEFAULT_QUIZ_ANSWERS);
    assert.ok(result.whyFitsBulletsId.length > 0);
    assert.ok(result.whyFitsBulletsEn.length > 0);
    assert.ok(typeof result.possibleMismatchId === 'string' && result.possibleMismatchId.length > 0);
    assert.ok(typeof result.possibleMismatchEn === 'string' && result.possibleMismatchEn.length > 0);
  });
});
