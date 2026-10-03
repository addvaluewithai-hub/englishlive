import { LEARN_V2_A1_CONTRACTS } from './learnV2A1Contracts';
import { LEARN_V2_B1_CONTRACTS } from './learnV2B1Contracts';
import type { SpeakingLessonContract } from './lessonContracts';

export const LEARN_V2_LESSON_CONTRACTS: SpeakingLessonContract[] = [
  ...LEARN_V2_A1_CONTRACTS,
  ...LEARN_V2_B1_CONTRACTS,
];
