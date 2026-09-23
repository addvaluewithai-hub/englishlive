export const conversationResponseKinds = [
  'answer',
  'question',
  'help_request',
  'continuation',
  'unusable',
] as const;

export type ConversationResponseKind = (typeof conversationResponseKinds)[number];
export type ConversationRubricVerdict = 'meets' | 'partial' | 'does_not_meet';
export type ConversationEvidenceSource = 'live_audio' | 'automatic_transcript' | 'text';

export interface ConversationObjective {
  id: string;
  title: string;
  capability: string;
  brief: string;
  successEvidence: string;
  acceptedResponseKinds: readonly ConversationResponseKind[];
  repairHints?: readonly string[];
  allowBoard?: boolean;
}

export interface ConversationMission {
  id: string;
  title: string;
  level: 'B1' | 'B2';
  purpose: string;
  scenario: string;
  openingPrompt: string;
  objectives: readonly ConversationObjective[];
}

export interface ConversationEvidence {
  id: string;
  objectiveId: string;
  responseKind: ConversationResponseKind;
  rubricVerdict: ConversationRubricVerdict;
  source: ConversationEvidenceSource;
  summary: string;
  misconception?: string;
  recordedAt: string;
}

export interface ConversationObjectiveState {
  status: 'pending' | 'active' | 'met';
  evidence: ConversationEvidence[];
  automaticTranscript?: string;
  metAt?: string;
}

export interface ConversationMissionState {
  missionId: string;
  currentObjectiveId: string;
  objectives: Record<string, ConversationObjectiveState>;
  completedAt?: string;
  updatedAt: string;
}
