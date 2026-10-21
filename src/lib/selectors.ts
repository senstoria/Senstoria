/**
 * Shared Selectors Module (Single Source of Truth)
 * Rule 1: Counts, remaining %, low-bottle status and wear totals come from one shared selector module.
 * Components never recompute them.
 */
export {
  isLowBottle,
  calculateRemainingPercentage,
  computeCollectionSummary,
  computeScentDna,
  calculateScentDna,
  computeDiaryStats,
  computeReviewSummary,
  calculateFairSamplePrice
} from './derivedCalculations.ts';

export type {
  BottleState,
  WearLogState,
  StoryState,
  ReviewState,
  CollectionSummary,
  ScentDnaProfile,
  DiaryStats,
  ReviewSummary,
  WaitlistState,
  SampleOrderState,
  ScentStoryState,
  WearState,
  ScentDnaSummary
} from './derivedCalculations.ts';
