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
      'INDEPENDENT REPEAT: the learner has just rehearsed this same situation once with English response cards. In this round the UI gives only a short Arabic meaning/intent cue; the learner must produce the English themselves.',
      'Repeat the SAME partner-side conversation path below. Keep the partner turns and order recognisably the same so retrieval is possible. Small natural wording variation is fine. Do not reveal, guess or feed the learner response from the earlier rehearsal.',
      'Accept any simple English response that genuinely expresses the intended meaning, even when the wording is different from the rehearsal card. Never correct a learner merely for choosing a different valid phrase, contraction, word order variant that is grammatical, or another natural way to say the same thing.',
      'CORRECTION RULE: if the learner makes a genuine English error in the current target — for example a wrong auxiliary, clearly wrong question order, wrong core form, or wording that changes/breaks the intended meaning — correct it immediately but briefly. Say something like “Almost — say: Where does she live?” Give the correct English form once, then continue the conversation naturally. Do not open a grammar lecture and do not demand verbatim imitation.',
      'If the learner wording is understandable but merely imperfect outside the current target, prefer to continue. The distinction is genuine error versus valid alternative, not exact-match versus non-match.',
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
