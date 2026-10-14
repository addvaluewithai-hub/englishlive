import type { PracticeMissionContract } from '../types';

/** Fixed reviewed lines: TTS changes how the example sounds, never what happens in the scene. */
export function lessonDialogue(mission: PracticeMissionContract) {
  const source = mission.canonicalDialogue.slice(0, 10);
  if (!source.some((turn) => turn.speaker === 'learner') ||
      !source.some((turn) => turn.speaker === 'ai_role')) return [];
  const setting = (mission.titleEn + ' ' + mission.openingMoveEn).toLowerCase();
  const problem = /wrong|problem|complaint|return|refund|repeat|understand/.test(setting);
  const social = /meet|friend|plan|introduc/.test(setting);
  return source.map((turn) => ({
    speaker: turn.speaker === 'ai_role' ? 'Partner' : 'Learner',
    text: turn.text,
    style: turn.speaker === 'ai_role'
      ? problem ? 'attentive, sympathetic and reassuring' : social ? 'bright, curious and friendly' : 'welcoming, helpful and natural'
      : problem ? 'polite, concerned but composed' : social ? 'interested, relaxed and upbeat' : 'polite, curious and natural',
  }));
}

export const LESSON_TTS_MODEL = 'gemini-3.8-flash-tts';
