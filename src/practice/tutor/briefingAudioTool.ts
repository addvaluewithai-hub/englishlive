import type { LiveClientTool } from '../../live/tools';
import type { TutorSession } from './TutorSession';

/** Blocking tool: Live is told playback succeeded only after WebAudio fired ended. */
export function briefingAudioTool(slug: string, session: TutorSession): LiveClientTool {
  let played = false;
  return {
    declaration: {
      name: 'play_lesson_dialogue',
      behavior: 'BLOCKING',
      description: 'Play the approved scene example with two distinct voices and expressive delivery. Call ONCE at the start of the briefing instead of reading the sample dialogue yourself. Wait for playback to finish; then continue teaching.',
      parameters: { type: 'OBJECT', properties: {} },
    },
    async handle() {
      if (played) return { played: true, reason: 'already_played', instruction: 'Do not replay automatically. Continue teaching.' };
      const result = await session.playLessonDialogue(slug);
      if (result.played) played = true;
      return {
        ...result,
        instruction: result.played
          ? 'The two-person sample has FINISHED playing to the learner. Briefly explain what they heard, invite questions, then wait. Do not recite the example.'
          : 'Example audio was unavailable or interrupted. Do not claim it played; briefly explain the situation without reciting the sample, and invite questions.',
      };
    },
  };
}
