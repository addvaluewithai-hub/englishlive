import type { LearningGoal } from '../product/profile';
import type { ConversationMission } from '../tutor/types';
import { createUnexpectedChangeMission, FIRST_B1_MISSION_ID } from './b1/unexpectedChange';

export { FIRST_B1_MISSION_ID } from './b1/unexpectedChange';

export function resolveConversationMission(
  missionId: string | null | undefined,
  goal: LearningGoal | undefined,
): ConversationMission {
  if (!missionId || missionId === FIRST_B1_MISSION_ID) return createUnexpectedChangeMission(goal);
  // Until the MVP catalog expands, unknown/deprecated links safely land on the first
  // production mission instead of reviving the old integration fixture.
  return createUnexpectedChangeMission(goal);
}
