import type { SupportBoard } from '../presentation/types';
import type {
  ConversationEvidenceSource,
  ConversationResponseKind,
} from '../tutor/types';

export type SceneLessonLevelId = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';

export type SceneInteractionKind =
  | 'elicitation'
  | 'micro_practice'
  | 'guided_dialogue'
  | 'roleplay'
  | 'fresh_transfer';

export interface SceneSuccessCriterion {
  id: string;
  label: string;
  required?: boolean;
}

export interface SceneTeachingPlan {
  /** Internal authoring guidance. The teacher explains these points mostly in Egyptian Arabic. */
  explainInArabic: readonly string[];
  /** English language the learner should hear/see in this scene. */
  englishTargets: readonly string[];
  /** Delivery guardrails that keep the scene bounded and consistent. */
  constraints?: readonly string[];
}

export interface SceneInteractionPlan {
  kind: SceneInteractionKind;
  /** Internal setup for the live teacher. */
  setup: string;
  /** The learner-facing task. The teacher may phrase it naturally without changing its demand. */
  learnerTask: string;
  /** Ordered teaching moves. Do not skip ahead unless the learner has already demonstrated the move. */
  teacherMoves: readonly string[];
  acceptedResponseKinds: readonly ConversationResponseKind[];
  successCriteria: readonly SceneSuccessCriterion[];
  /** Ordered support escalation. Use the lightest support that works. */
  supportLadder: readonly string[];
}

export interface SceneLessonScene {
  id: string;
  title: string;
  goal: string;
  teaching: SceneTeachingPlan;
  board?: SupportBoard;
  interaction: SceneInteractionPlan;
}

export interface SceneLessonDefinition {
  id: string;
  levelId: SceneLessonLevelId;
  unitId: string;
  unitTitle: string;
  order: number;
  title: string;
  subtitle: string;
  performance: string;
  coreLanguage: readonly string[];
  boundaries: readonly string[];
  source: {
    repository: string;
    branch: string;
    path: string;
    sourceLessonId: string;
  };
  scenes: readonly SceneLessonScene[];
}

export interface SceneLessonEvidence {
  id: string;
  sceneId: string;
  responseKind: ConversationResponseKind;
  source: ConversationEvidenceSource;
  /** Content-minimized semantic summary of evidence accumulated in the authored scene. */
  summary: string;
  metCriteria: string[];
  recordedAt: string;
}

export interface SceneLessonSceneState {
  status: 'pending' | 'active' | 'met';
  evidence: SceneLessonEvidence[];
  automaticTranscript?: string;
  /** Application-owned count of authored board chunks already revealed in this scene. */
  boardRevealCount: number;
  metAt?: string;
}

export interface SceneLessonState {
  lessonId: string;
  currentSceneId: string;
  scenes: Record<string, SceneLessonSceneState>;
  completedAt?: string;
  updatedAt: string;
}
