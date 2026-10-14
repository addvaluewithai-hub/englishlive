import { practiceMissionContractBySlug } from '../../src/practice/missions/catalog';
import { lessonDialogue, LESSON_TTS_MODEL } from '../../src/practice/audio/lessonDialogue';

type Interaction = {
  steps?: Array<{ type?: string; content?: Array<{ type?: string; data?: string }> }>;
};

export function buildLessonAudioRequest(slug: string) {
  const mission = practiceMissionContractBySlug(slug);
  if (!mission) return null;
  const turns = lessonDialogue(mission);
  if (turns.length < 2) return null;
  return {
    model: LESSON_TTS_MODEL,
    input: [{
      type: 'user_input',
      content: turns.map((turn) => ({
        type: 'text', text: turn.text,
        annotations: [{ type: 'speech_metadata', speaker: turn.speaker, style: turn.style }],
      })),
    }],
    response_format: { type: 'audio', mime_type: 'audio/wav' },
    generation_config: {
      speech_config: {
        mode: 'conversational',
        speakers: [
          { speaker: 'Partner', voice: 'Puck' },
          { speaker: 'Learner', voice: 'Kore' },
        ],
      },
    },
  };
}

/** Raw Gemini Interactions REST JSON puts audio in steps, not output_audio. */
export function extractLessonWav(payload: Interaction): Uint8Array<ArrayBuffer> {
  const blocks = payload.steps?.filter((step) => step.type === 'model_output')
    .flatMap((step) => step.content ?? []).filter((part) => part.type === 'audio' && !!part.data) ?? [];
  const encoded = blocks.at(-1)?.data;
  if (!encoded || encoded.length > 15_000_000) throw new Error('Missing or oversized TTS output.');
  const binary = atob(encoded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  if (bytes.length < 44 || new TextDecoder().decode(bytes.subarray(0, 4)) !== 'RIFF' ||
      new TextDecoder().decode(bytes.subarray(8, 12)) !== 'WAVE') {
    throw new Error('TTS output was not WAV.');
  }
  return bytes;
}
