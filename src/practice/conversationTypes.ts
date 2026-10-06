import type { PracticeCorrectionRecord, PracticeHintBundle, PracticeLanguageStatus } from './runtime';

export type ConversationTurn = { id: string; speaker: 'learner' | 'otti'; text: string };
export type CoachMode = 'turn' | 'hint' | 'recap';
export type CoachResult = {
  turnId: string;
  languageStatus: PracticeLanguageStatus;
  corrections: PracticeCorrectionRecord[];
  achievedGoalIds: string[];
  nextFocusAr: string;
  nextFocusEn: string;
  hint: PracticeHintBundle | null;
};
export type CoachInput = {
  missionSlug: string;
  mode: CoachMode;
  turnId: string;
  transcript: ConversationTurn[];
};
