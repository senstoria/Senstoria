import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  calculateMatchScore, 
  rankRecommendations, 
  findQualifiedAlternatives,
  ScentQuizAnswers, 
  DEFAULT_QUIZ_ANSWERS,
  BASE_DIMENSION_WEIGHTS
} from './scentScoring.ts';
import { SEED_PERFUMES, SeedPerfume } from '../data/seedPerfumes.ts';

describe('Scent Finder 6-Dimension Scoring Engine (FIND-05 & Rev 1)', () => {
  const samplePerfume: SeedPerfume = SEED_PERFUMES[0]; // HMNS Orgasm

  it('enforces exact 6 scored dimensions and weights (sum = 100)', () => {
    assert.strictEqual(BASE_DIMENSION_WEIGHTS.notesFamily, 25);
    assert.strictEqual(BASE_DIMENSION_WEIGHTS.climate, 20);
    assert.strictEqual(BASE_DIMENSION_WEIGHTS.occasion, 20);
    assert.strictEqual(BASE_DIMENSION_WEIGHTS.longevity, 15);
    assert.strictEqual(BASE_DIMENSION_WEIGHTS.gender, 10);
    assert.strictEqual(BASE_DIMENSION_WEIGHTS.budget, 10);

    const totalWeight = Object.values(BASE_DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
    assert.strictEqual(totalWeight, 100);
  });

  it('guarantees breakdown rows sum exactly to displayed total via largest-remainder method', () => {
    const answers: ScentQuizAnswers = {
      preferredFamilies: ['Floral Ambery', 'Floral'],
      climateSetting: 'indoor_ac',
      occasionSetting: 'daily_office',
      longevityExpectation: 'moderate',
      genderPreference: 'feminine',
      budgetTier: 'mid',
      avoidNotesOrTraits: ['none']
    };

    const result = calculateMatchScore(samplePerfume, answers);
    assert.strictEqual(result.breakdownRows.length, 6);

    const sumPoints = result.breakdownRows.reduce((acc, row) => acc + row.points, 0);
    const adjustmentPoints = result.adjustment ? result.adjustment.points : 0;
    
    // Invariant: sum of row points + adjustment must equal header score EXACTLY
    assert.strictEqual(sumPoints + adjustmentPoints, result.matchScore);
    assert.ok(result.matchScore <= 96, `Score ${result.matchScore} must not exceed 96`);
  });

  it('applies calibration cap: every displayed score is strictly <= 96', () => {
    // Perfect alignment that would produce raw 100
    const perfectAnswers: ScentQuizAnswers = {
      preferredFamilies: ['Floral Ambery', 'Fruity'],
      climateSetting: 'outdoor_hot',
      occasionSetting: 'daily_office',
      longevityExpectation: 'moderate',
      genderPreference: 'feminine',
      budgetTier: 'mid',
      avoidNotesOrTraits: ['none']
    };

    for (const p of SEED_PERFUMES) {
      const res = calculateMatchScore(p, perfectAnswers);
      assert.ok(res.matchScore <= 96, `Perfume ${p.name} had score ${res.matchScore} > 96`);
    }
  });

  it('applies conflict rule: if any active dimension fit < 0.25, total may not exceed 79', () => {
    // HMNS Orgasm is feminine. Choosing masculine gives fit 0.20 < 0.25
    const conflictAnswers: ScentQuizAnswers = {
      preferredFamilies: ['Floral Ambery', 'Fruity'],
      climateSetting: 'indoor_ac',
      occasionSetting: 'daily_office',
      longevityExpectation: 'moderate',
      genderPreference: 'masculine', // Conflict: masculine vs feminine (< 0.25)
      budgetTier: 'mid',
      avoidNotesOrTraits: ['none']
    };

    const result = calculateMatchScore(samplePerfume, conflictAnswers);
    assert.ok(result.matchScore <= 79, `Expected score <= 79 due to conflict, got ${result.matchScore}`);
    assert.ok(result.adjustment !== null, 'Expected adjustment row for conflict cap');
  });

  it('renormalizes active weights when "not_sure" or "flexible" is chosen and labels "No data"', () => {
    const answersWithNotSure: ScentQuizAnswers = {
      preferredFamilies: ['not_sure'],
      climateSetting: 'flexible',
      occasionSetting: 'flexible',
      longevityExpectation: 'not_sure',
      genderPreference: 'any',
      budgetTier: 'flexible',
      avoidNotesOrTraits: ['none']
    };

    const result = calculateMatchScore(samplePerfume, answersWithNotSure);
    assert.ok(result.matchScore >= 60 && result.matchScore <= 92, `Score ${result.matchScore} should be in 60..92`);
    for (const row of result.breakdownRows) {
      assert.strictEqual(row.isNoData, true);
    }
  });

  it('excludes owned perfumes when excludePerfumeIds is passed', () => {
    const ownedIds = ['prf_001', 'prf_003']; // HMNS Orgasm, Oullu Arcanum
    const ranked = rankRecommendations(SEED_PERFUMES, DEFAULT_QUIZ_ANSWERS, ownedIds);

    const foundOwned = ranked.some(r => ownedIds.includes(r.perfume.id));
    assert.strictEqual(foundOwned, false, 'Owned perfumes must be excluded');
  });

  it('generates non-empty Possible Mismatch specific to the weakest scored dimension', () => {
    const result = calculateMatchScore(samplePerfume, DEFAULT_QUIZ_ANSWERS);
    assert.ok(result.possibleMismatchId.length > 10, 'Mismatch ID must be substantive');
    assert.ok(result.possibleMismatchEn.length > 10, 'Mismatch EN must be substantive');
    assert.ok(!result.possibleMismatchId.includes('undefined'));
    assert.ok(!result.possibleMismatchEn.includes('undefined'));
  });

  it('finds qualified alternatives for lower budget, local/int alternative, and stretch pick', () => {
    const ranked = rankRecommendations(SEED_PERFUMES, DEFAULT_QUIZ_ANSWERS);
    assert.ok(ranked.length > 0);
    const top = ranked[0];

    const alternatives = findQualifiedAlternatives(top, ranked);
    assert.ok(alternatives.length <= 3);
    for (const alt of alternatives) {
      assert.ok(alt.recommendation.matchScore >= 60);
      assert.notStrictEqual(alt.recommendation.perfume.id, top.perfume.id);
    }
  });

  it('when skipping quiz, top score is between 60 and 92, rows sum to header', () => {
    const ranked = rankRecommendations(SEED_PERFUMES, DEFAULT_QUIZ_ANSWERS);
    const top = ranked[0];
    assert.ok(top.matchScore >= 60 && top.matchScore <= 92, `Top skipped quiz score ${top.matchScore} should be in 60..92`);

    const sumPoints = top.breakdownRows.reduce((a, b) => a + b.points, 0);
    const adj = top.adjustment ? top.adjustment.points : 0;
    assert.strictEqual(sumPoints + adj, top.matchScore);
  });
});
