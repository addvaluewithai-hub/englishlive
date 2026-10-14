import type { PracticeCorrectionRecord, PracticeSupportSummary } from '../runtime';
import type { LiveDiagnostic, LiveStatus } from '../../live/types';

export type TutorPhase = 'briefing' | 'roleplay' | 'review';
export type TutorState = {
  status: LiveStatus;
  text: string;
  micOpen: boolean;
  level: number;
  paused: boolean;
  waiting: boolean;
  error: string | null;
};
export const idleTutorState: TutorState = {
  status: 'idle', text: '', micOpen: false, level: 0, paused: false, waiting: false, error: null,
};
export type PracticeCompletionState = {
  support?: PracticeSupportSummary;
  corrections?: PracticeCorrectionRecord[];
  achievedGoalIds?: string[];
  durationSeconds?: number;
  conversationText?: string;
  recordedByOtti?: boolean;
  diagnostics?: {
    transport: LiveDiagnostic[];
    collector: { calls: number; saved: number; rejected: number; reasons: Record<string, number>;
      languageReviews?: { checks: number; missing: number; noClearIssue: number; uncertain: number; finalized: boolean } };
    finishTimedOut: boolean;
  };
};
