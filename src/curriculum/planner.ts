import type { EnglishLiveMemoryState } from '../memory/types';
import type { LearningGoal } from '../product/profile';
import type { ConversationMission } from '../tutor/types';
import {
  MVP_B1_MISSIONS,
  listMvpB1Missions,
} from './catalog';

export type CurriculumPlanReason = 'start' | 'continue_path' | 'recycle' | 'keep_fresh';

export interface PlannedConversation {
  mission: ConversationMission;
  pathIndex: number;
  reason: CurriculumPlanReason;
  reasonLabel: string;
}

export type MissionPathStatus = 'new' | 'seen' | 'observed' | 'revisit';

export interface MissionPathItem {
  mission: ConversationMission;
  order: number;
  family: string;
  promise: string;
  status: MissionPathStatus;
  attemptedSessions: number;
  observedSessions: number;
  completedSessions: number;
}

function missionNeedsRecycle(mission: ConversationMission, memory: EnglishLiveMemoryState) {
  return mission.objectives.some((objective) => memory.capabilities[objective.capability]?.recycleSuggested);
}

function missionLastPractisedAt(missionId: string, memory: EnglishLiveMemoryState) {
  return memory.missions[missionId]?.lastPractisedAt ?? '';
}

export function buildMissionPath(
  goal: LearningGoal | undefined,
  memory: EnglishLiveMemoryState,
): MissionPathItem[] {
  const missions = listMvpB1Missions(goal);
  return missions.map((mission, index) => {
    const record = memory.missions[mission.id];
    const needsRecycle = missionNeedsRecycle(mission, memory);
    let status: MissionPathStatus = 'new';
    if ((record?.observedSessions ?? 0) > 0) status = needsRecycle ? 'revisit' : 'observed';
    else if ((record?.attemptedSessions ?? 0) > 0) status = 'seen';

    return {
      mission,
      order: MVP_B1_MISSIONS[index].order,
      family: MVP_B1_MISSIONS[index].family,
      promise: MVP_B1_MISSIONS[index].promise,
      status,
      attemptedSessions: record?.attemptedSessions ?? 0,
      observedSessions: record?.observedSessions ?? 0,
      completedSessions: record?.completedSessions ?? 0,
    };
  });
}

export function planNextConversation(
  goal: LearningGoal | undefined,
  memory: EnglishLiveMemoryState,
): PlannedConversation {
  const path = buildMissionPath(goal, memory);
  // The first pass is exposure, not an exam gate. Any real attempt opens the next
  // speaking job; evidence quality controls later recycle instead of locking the path.
  const firstUntried = path.find((item) => item.attemptedSessions === 0);

  if (firstUntried) {
    const firstEver = path.every((item) => item.attemptedSessions === 0);
    return {
      mission: firstUntried.mission,
      pathIndex: firstUntried.order - 1,
      reason: firstEver ? 'start' : 'continue_path',
      reasonLabel: firstEver
        ? 'Start with connected familiar speaking.'
        : 'Continue the B1 conversation path with a different speaking job.',
    };
  }

  const lastMissionId = memory.recentSessions.at(-1)?.missionId;
  const recycleCandidates = path
    .filter((item) => item.status === 'revisit' || item.status === 'seen')
    .sort((left, right) => {
      const leftIsLast = left.mission.id === lastMissionId ? 1 : 0;
      const rightIsLast = right.mission.id === lastMissionId ? 1 : 0;
      if (leftIsLast !== rightIsLast) return leftIsLast - rightIsLast;
      return missionLastPractisedAt(left.mission.id, memory)
        .localeCompare(missionLastPractisedAt(right.mission.id, memory));
    });

  if (recycleCandidates.length) {
    const next = recycleCandidates[0];
    return {
      mission: next.mission,
      pathIndex: next.order - 1,
      reason: 'recycle',
      reasonLabel: next.status === 'seen'
        ? 'Try this speaking job again in a fresh conversation so we can collect usable evidence.'
        : 'Bring one useful capability back in a fresh conversation instead of drilling it.',
    };
  }

  const oldest = [...path].sort((left, right) =>
    missionLastPractisedAt(left.mission.id, memory)
      .localeCompare(missionLastPractisedAt(right.mission.id, memory)),
  )[0];

  return {
    mission: oldest.mission,
    pathIndex: oldest.order - 1,
    reason: 'keep_fresh',
    reasonLabel: 'Keep B1 conversation skills fresh by returning to the least recent speaking job.',
  };
}
