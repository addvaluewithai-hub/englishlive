import type { PracticeLevelId, PracticeWorldId } from './catalog';

export type PracticeMissionBeat = {
  id: string;
  type: 'required' | 'ending';
  aiIntentEn: string;
  learnerIntentEn: string;
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
  truthEn: string[];
  beats: PracticeMissionBeat[];
  openingMoveEn: string;
  promptPolicyEn: string[];
};
