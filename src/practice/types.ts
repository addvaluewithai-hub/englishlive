import type { PracticeLevelId, PracticeWorldId } from './catalog';

export type PracticeLanguageReference = {
  id: string;
  label: string;
  role?: string;
};

export type PracticeLanguageGrounding = {
  sourceRepo: string;
  sourceLevel: PracticeLevelId;
  inventoryScope: 'cumulative_through_level';
  abilities: PracticeLanguageReference[];
  grammar: PracticeLanguageReference[];
  phrases: PracticeLanguageReference[];
  words: PracticeLanguageReference[];
  runtimeSummaryEn: string[];
};

export type PracticeCanonicalTurn = {
  beatId: string;
  speaker: 'ai_role' | 'learner';
  text: string;
};

export type PracticeMissionBeat = {
  id: string;
  type: 'required' | 'ending';
  aiIntentEn: string;
  preferredRealizationsEn?: string[];
  learnerIntentEn: string;
  learnerModelsEn?: string[];
  overviewAr?: string;
  correctionFocusEn?: string[];
  next?: string;
};

export type PracticeMissionContract = {
  sourceId: string;
  revision: number;
  slug: string;
  level: PracticeLevelId;
  worldId: PracticeWorldId;
  titleAr: string;
  titleEn: string;
  settingAr: string;
  learnerRoleAr: string;
  aiRoleAr: string;
  goalAr: string;
  durationMinutes: number;
  languageGrounding: PracticeLanguageGrounding;
  truthEn: string[];
  canonicalDialogue: PracticeCanonicalTurn[];
  surfaceFreedom: 'tight' | 'bounded' | 'open_within_graph';
  beats: PracticeMissionBeat[];
  openingMoveEn: string;
  promptPolicyEn: string[];
};
