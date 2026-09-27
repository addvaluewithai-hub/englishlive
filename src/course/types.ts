import type { SupportBoard } from '../presentation/types';
import type {
  ConversationEvidence,
  ConversationResponseKind,
} from '../tutor/types';

export type CourseLessonBeatKind =
  | 'teach'
  | 'guided_practice'
  | 'conversation_task'
  | 'recap';

export type CourseLessonBeatCompletion = 'teacher_turn' | 'evidence';

export interface CourseLessonBeat {
  id: string;
  title: string;
  kind: CourseLessonBeatKind;
  completion: CourseLessonBeatCompletion;
  /** Internal delivery brief. The teacher should speak naturally rather than recite it. */
  teachingBrief: string;
  /** Learner-facing spoken question/task for evidence beats. */
  prompt?: string;
  /** Authored application-owned visual. Gemini does not author or mutate this board. */
  board?: SupportBoard;
  capability?: string;
  successEvidence?: string;
  acceptedResponseKinds?: readonly ConversationResponseKind[];
  repairHints?: readonly string[];
}

export interface CourseLessonDefinition {
  id: string;
  unitId: string;
  order: number;
  title: string;
  subtitle: string;
  purpose: string;
  languageFocus: readonly string[];
  beats: readonly CourseLessonBeat[];
  challenge?: boolean;
}

export interface CourseUnitDefinition {
  id: string;
  levelId: string;
  order: number;
  title: string;
  promise: string;
  lessons: readonly CourseLessonDefinition[];
}

export interface CourseLevelDefinition {
  id: 'b1' | 'b2';
  title: string;
  promise: string;
  units: readonly CourseUnitDefinition[];
}

export interface CourseDefinition {
  id: string;
  title: string;
  levels: readonly CourseLevelDefinition[];
}

export interface CourseLessonBeatState {
  status: 'pending' | 'active' | 'met';
  evidence: ConversationEvidence[];
  automaticTranscript?: string;
  metAt?: string;
}

export interface CourseLessonState {
  lessonId: string;
  currentBeatId: string;
  beats: Record<string, CourseLessonBeatState>;
  completedAt?: string;
  updatedAt: string;
}

/** Privacy-minimized resumable state. No transcripts or semantic story summaries. */
export interface CourseLessonProgressSnapshot {
  lessonId: string;
  currentBeatId: string;
  beatStatuses: Record<string, 'pending' | 'active' | 'met'>;
  completedAt?: string;
  updatedAt: string;
}

export interface CourseLessonRunObservation {
  beatId: string;
  title: string;
  capability?: string;
  outcome: 'met' | 'attempted';
}

export interface CourseLessonRunSummary {
  runId: string;
  lessonId: string;
  lessonTitle: string;
  unitId: string;
  characterId: string;
  startedAt: string;
  endedAt: string;
  completed: boolean;
  observations: CourseLessonRunObservation[];
}

export interface CourseLessonStats {
  lessonId: string;
  attemptedRuns: number;
  completedRuns: number;
  lastPractisedAt: string;
}

export interface CourseProgressState {
  version: 1;
  lessonProgress: Record<string, CourseLessonProgressSnapshot>;
  lessonStats: Record<string, CourseLessonStats>;
  recentRuns: CourseLessonRunSummary[];
  updatedAt: string;
}
