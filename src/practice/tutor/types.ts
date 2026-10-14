import type { PracticeCorrectionRecord, PracticeSupportSummary } from '../runtime';
import type { LiveDiagnostic, LiveStatus } from '../../live/types';
import type { NotebookDiagnostics } from '../silentIssues';
import type { FinalReviewOutcome } from './finishRoleplay';

export type TutorPhase = 'briefing' | 'roleplay' | 'review';
export type TutorState = {
  status: LiveStatus;
  text: string;
  micOpen: boolean;
  examplePlaying: boolean;
  level: number;
  paused: boolean;
  waiting: boolean;
  error: string | null;
};
export const idleTutorState: TutorState = {
  status: 'idle', text: '', micOpen: false, examplePlaying: false, level: 0, paused: false, waiting: false, error: null,
};
export type CountedDiagnostic = LiveDiagnostic & { count: number };
export type TimedDiagnostic = LiveDiagnostic & { elapsedMs: number };
/** Metadata only: no tokens, audio, learner words or rejected phrases. */
export type NotebookTrace = {
  transport: CountedDiagnostic[];
  timeline: TimedDiagnostic[];
  notebook: NotebookDiagnostics;
  finalReview: FinalReviewOutcome;
  finalWaitMs: number;
};
export type PracticeCompletionState = {
  support?: PracticeSupportSummary;
  corrections?: PracticeCorrectionRecord[];
  achievedGoalIds?: string[];
  durationSeconds?: number;
  conversationText?: string;
  recordedByOtti?: boolean;
  diagnostics?: NotebookTrace;
};
