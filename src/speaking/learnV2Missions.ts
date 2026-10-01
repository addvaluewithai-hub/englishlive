import { LEARN_V2_A1_SPEAKING_MISSIONS } from './learnV2A1Missions';
import { LEARN_V2_B1_SPEAKING_MISSIONS } from './learnV2B1Missions';
import type { SpeakingScenario } from './catalog';

export const LEARN_V2_SPEAKING_MISSIONS: SpeakingScenario[] = [
  ...LEARN_V2_A1_SPEAKING_MISSIONS,
  ...LEARN_V2_B1_SPEAKING_MISSIONS,
];

export function learnV2SpeakingMissionById(id?: string) {
  return LEARN_V2_SPEAKING_MISSIONS.find((mission) => mission.id === id);
}
