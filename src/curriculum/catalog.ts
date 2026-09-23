import type { LearningGoal } from '../product/profile';
import type { ConversationMission } from '../tutor/types';
import {
  MVP_B1_MISSIONS,
  MVP_B1_MISSION_IDS,
  type MvpB1MissionId,
} from './b1/mvpMissions';
import { FIRST_B1_MISSION_ID } from './b1/unexpectedChange';

export { FIRST_B1_MISSION_ID, MVP_B1_MISSIONS, MVP_B1_MISSION_IDS };
export type { MvpB1MissionId };

export function listMvpB1Missions(goal: LearningGoal | undefined): ConversationMission[] {
  return MVP_B1_MISSIONS.map((entry) => entry.create(goal));
}

export function isMvpB1MissionId(value: string | null | undefined): value is MvpB1MissionId {
  return Boolean(value && (MVP_B1_MISSION_IDS as readonly string[]).includes(value));
}

export function resolveConversationMission(
  missionId: string | null | undefined,
  goal: LearningGoal | undefined,
): ConversationMission {
  const entry = MVP_B1_MISSIONS.find((candidate) => candidate.id === missionId)
    ?? MVP_B1_MISSIONS[0];
  return entry.create(goal);
}

export function getMvpMissionDescriptor(missionId: string | null | undefined) {
  return MVP_B1_MISSIONS.find((candidate) => candidate.id === missionId)
    ?? MVP_B1_MISSIONS[0];
}
