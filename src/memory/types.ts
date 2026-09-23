export type RelationshipMemoryKind = 'follow_up' | 'preference' | 'interest';

export interface CapabilityEvidenceMemory {
  id: string;
  missionId: string;
  objectiveId: string;
  outcome: 'met' | 'attempted';
  summary: string;
  recordedAt: string;
}

export interface CapabilityMemory {
  capabilityId: string;
  attemptedSessions: number;
  successfulSessions: number;
  recycleSuggested: boolean;
  lastPractisedAt: string;
  recentEvidence: CapabilityEvidenceMemory[];
}

export interface SessionMemorySummary {
  sessionId: string;
  missionId: string;
  missionTitle: string;
  characterId: string;
  startedAt: string;
  endedAt: string;
  completed: boolean;
  observedCapabilities: string[];
}

export interface RelationshipMemoryNote {
  id: string;
  kind: RelationshipMemoryKind;
  text: string;
  sourceMissionId: string;
  createdAt: string;
}

export interface RelationshipMemoryProposal {
  kind: RelationshipMemoryKind;
  text: string;
}

export interface EnglishLiveMemoryState {
  version: 1;
  capabilities: Record<string, CapabilityMemory>;
  recentSessions: SessionMemorySummary[];
  relationshipNotes: RelationshipMemoryNote[];
  lastPartnerId?: string;
  updatedAt: string;
}
