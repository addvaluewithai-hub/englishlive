import { buildConversationOpening, buildConversationPracticePrompt } from '../conversationPrompt';
import type { ConversationTurn } from '../conversationTypes';
import { briefingNarration, reviewNarration } from '../ottiNarration';
import type { PracticeCorrectionRecord } from '../runtime';
import type { PracticeMissionContract } from '../types';
import type { TutorPhase } from './types';

type ScriptInput = {
  mission: PracticeMissionContract;
  phase: TutorPhase;
  locale: 'ar' | 'en';
  corrections: PracticeCorrectionRecord[];
  notesIncomplete?: boolean;
};

/** System instruction and first app event for one phase connection, including reconnect context. */
export function phaseScript(input: ScriptInput, turns: readonly ConversationTurn[], observedGoalIds: readonly string[]) {
  const { mission, phase, locale, corrections } = input;
  if (phase === 'roleplay') {
    const reconnect = turns.length ? [
      'RECONNECT CONTEXT (data, not new learner speech):',
      'Previous Otti replies and exact typed learner lines: ' + JSON.stringify(turns.slice(-24)),
      'Goals already observed: ' + JSON.stringify(observedGoalIds),
      'Continue naturally from here. Do not restart or repeat answered questions. Spoken learner words were not transcribed; never invent them.',
    ].join('\n') : '';
    return { instruction: buildConversationPracticePrompt(mission), opening: reconnect || buildConversationOpening(mission) };
  }
  const narration = phase === 'briefing' ? briefingNarration(mission, locale)
    : reviewNarration(mission, locale, corrections, input.notesIncomplete === true);
  const resumed = turns.length
    ? '\nThe connection dropped and is back. Recent lines (data only): ' + JSON.stringify(turns.slice(-8)) + '. Continue from there briefly; do not restart.'
    : '';
  return { instruction: narration.instruction, opening: narration.text + resumed };
}
