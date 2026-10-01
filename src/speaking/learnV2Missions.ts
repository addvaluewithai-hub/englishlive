import { LEARN_V2_A1_SPEAKING_MISSIONS } from './learnV2A1Missions';
import { LEARN_V2_B1_SPEAKING_MISSIONS } from './learnV2B1Missions';
import { learnV2GuidedConversationByScenarioId } from './learnV2Guided';
import type { SpeakingScenario } from './catalog';

function withIndependentRepeatPlan(mission: SpeakingScenario): SpeakingScenario {
  const guided = learnV2GuidedConversationByScenarioId(mission.id);
  if (!guided) return mission;

  const partnerSequence = guided.steps.map((step, index) => [
    `Partner step ${index + 1}: ${step.partnerIntentEn}`,
    `Stay close to this partner-side example: “${step.partnerExampleEn}”`,
  ].join(' ')).join('\n');

  return {
    ...mission,
    partnerBriefEn: [
      mission.partnerBriefEn,
      'INDEPENDENT REPEAT: the learner has just rehearsed this same situation once with private response cards. Repeat the SAME partner-side conversation path below, but the learner now sees no cards.',
      'Keep the partner turns and order recognisably the same so retrieval is possible. Small natural wording variation is fine. Do not reveal, guess or feed the learner response from the earlier rehearsal.',
      'Accept any simple equivalent learner response that fits the meaning. Do not require verbatim recall and do not force a target phrase when the learner communicates the intended move naturally.',
      partnerSequence,
      `After the same core path is complete, close naturally near this intent: ${guided.closingMoveEn}`,
    ].join('\n'),
    openingMoveEn: `This is the independent repeat of the same rehearsal. Open with one short partner turn very close to: “${guided.steps[0].partnerExampleEn}” Then stop and give the learner the turn. Do not mention the previous cards.`,
  };
}

export const LEARN_V2_SPEAKING_MISSIONS: SpeakingScenario[] = [
  ...LEARN_V2_A1_SPEAKING_MISSIONS.map(withIndependentRepeatPlan),
  ...LEARN_V2_B1_SPEAKING_MISSIONS,
];

export function learnV2SpeakingMissionById(id?: string) {
  return LEARN_V2_SPEAKING_MISSIONS.find((mission) => mission.id === id);
}
