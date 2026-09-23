import type { CharacterEmotion, CharacterGesture } from './types';

export const performanceEmotions = [
  'neutral',
  'happy',
  'sad',
  'surprised',
  'thinking',
  'laughing',
  'excited',
] as const satisfies readonly CharacterEmotion[];

export const performanceGestures = [
  'none',
  'wave',
  'blink',
  'jump',
  'explain',
  'think',
  'celebrate',
] as const satisfies readonly CharacterGesture[];

export interface CharacterPerformanceCue {
  emotion: (typeof performanceEmotions)[number];
  gesture: (typeof performanceGestures)[number];
  intensity: number;
  durationSeconds: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function normalizePerformanceCue(
  args: Record<string, unknown>,
): CharacterPerformanceCue | null {
  const emotion = args.emotion;
  const gesture = args.gesture ?? 'none';
  if (!performanceEmotions.includes(emotion as CharacterPerformanceCue['emotion'])) return null;
  if (!performanceGestures.includes(gesture as CharacterPerformanceCue['gesture'])) return null;

  const intensity = typeof args.intensity === 'number' && Number.isFinite(args.intensity)
    ? clamp(args.intensity, 0, 1)
    : 0.7;
  const durationSeconds = typeof args.durationSeconds === 'number' && Number.isFinite(args.durationSeconds)
    ? clamp(args.durationSeconds, 0.8, 4)
    : 2.4;

  return {
    emotion: emotion as CharacterPerformanceCue['emotion'],
    gesture: gesture as CharacterPerformanceCue['gesture'],
    intensity,
    durationSeconds,
  };
}

export const PERFORMANCE_TOOL_NAME = 'perform_character';

export const performanceToolDeclaration = {
  name: PERFORMANCE_TOOL_NAME,
  description:
    'Optional visible acting cue for a meaningful conversational beat. Ordinary speech motion and lip sync are automatic locally. Use at most once per spoken turn, not for every sentence.',
  behavior: 'NON_BLOCKING',
  parameters: {
    type: 'OBJECT',
    properties: {
      emotion: { type: 'STRING', enum: [...performanceEmotions] },
      gesture: { type: 'STRING', enum: [...performanceGestures] },
      intensity: {
        type: 'NUMBER',
        description: 'Expression strength from 0 to 1. Usually 0.55 to 0.85.',
      },
      durationSeconds: {
        type: 'NUMBER',
        description: 'How long the deliberate beat should read visually, from 0.8 to 4 seconds.',
      },
    },
    required: ['emotion'],
  },
};

export const PERFORMANCE_GUIDANCE = `
The on-screen character already has automatic lip sync, speech energy, idle motion and natural movement driven locally by the actual playback audio.
Do not call ${PERFORMANCE_TOOL_NAME} for normal talking, every sentence, routine listening or ordinary facial movement.
Use it only when one deliberate visible beat materially improves the moment: a greeting wave, a clear thinking beat, surprise, celebration, or an important explanation.
Use at most one ${PERFORMANCE_TOOL_NAME} call per spoken turn. Give semantic intent only; never describe bones, coordinates, frames or mouth shapes. Continue speaking naturally after the tool call.
`;
