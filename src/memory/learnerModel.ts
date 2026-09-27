import type { ConversationMission, ConversationMissionState } from '../tutor/types';
import { readEnglishLiveMemory, saveEnglishLiveMemory } from './store';
import type {
  CapabilityEvidenceMemory,
  EnglishLiveMemoryState,
  SessionMemorySummary,
  SessionObservation,
} from './types';

export interface RecordSessionOutcomeInput {
  sessionId: string;
  mission: ConversationMission;
  state: ConversationMissionState;
  characterId: string;
  startedAt: string;
  endedAt?: string;
}

export function recordSessionOutcome(input: RecordSessionOutcomeInput): EnglishLiveMemoryState {
  const memory = readEnglishLiveMemory();
  if (memory.recentSessions.some((session) => session.sessionId === input.sessionId)) return memory;

  const endedAt = input.endedAt ?? new Date().toISOString();
  const observedCapabilities: string[] = [];
  const observations: SessionObservation[] = [];

  for (const objective of input.mission.objectives) {
    const objectiveState = input.state.objectives[objective.id];
    if (!objectiveState) continue;
    const evidence = objectiveState.evidence;
    if (!evidence.length && objectiveState.status !== 'met') continue;

    const outcome = objectiveState.status === 'met' ? 'met' : 'attempted';
    observedCapabilities.push(objective.capability);
    observations.push({
      objectiveId: objective.id,
      capabilityId: objective.capability,
      title: objective.title,
      outcome,
    });

    const existing = memory.capabilities[objective.capability];
    const latestEvidence = evidence.at(-1);
    const recentEvidence: CapabilityEvidenceMemory[] = latestEvidence
      ? [{
          id: latestEvidence.id,
          missionId: input.mission.id,
          objectiveId: objective.id,
          outcome,
          summary: outcome === 'met'
            ? `Met the authored evidence for “${objective.title}” in this session.`
            : `Attempted “${objective.title}”; another natural observation is useful.`,
          recordedAt: latestEvidence.recordedAt,
        }]
      : [];

    memory.capabilities[objective.capability] = {
      capabilityId: objective.capability,
      attemptedSessions: (existing?.attemptedSessions ?? 0) + 1,
      successfulSessions: (existing?.successfulSessions ?? 0) + (outcome === 'met' ? 1 : 0),
      recycleSuggested: outcome !== 'met',
      lastPractisedAt: endedAt,
      recentEvidence: [...(existing?.recentEvidence ?? []), ...recentEvidence].slice(-6),
    };
  }

  const previousMission = memory.missions[input.mission.id];
  memory.missions[input.mission.id] = {
    missionId: input.mission.id,
    attemptedSessions: (previousMission?.attemptedSessions ?? 0) + 1,
    observedSessions: (previousMission?.observedSessions ?? 0) + (observations.length ? 1 : 0),
    completedSessions: (previousMission?.completedSessions ?? 0) + (input.state.completedAt ? 1 : 0),
    lastPractisedAt: endedAt,
  };

  const summary: SessionMemorySummary = {
    sessionId: input.sessionId,
    missionId: input.mission.id,
    missionTitle: input.mission.title,
    characterId: input.characterId,
    startedAt: input.startedAt,
    endedAt,
    completed: Boolean(input.state.completedAt),
    observedCapabilities: [...new Set(observedCapabilities)],
    observations,
  };

  memory.recentSessions = [...memory.recentSessions, summary].slice(-12);
  memory.lastPartnerId = input.characterId;
  saveEnglishLiveMemory(memory);
  return memory;
}
