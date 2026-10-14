import type { ConversationTurn } from './conversationTypes';

/** A learner turn reserved at its original position in the Live transcript. */
export type RecordedPracticeTurn = { turn: ConversationTurn; audioBase64: string; pcmBytes: number };

/** Hard client-side limits: failures must be reported rather than omitted silently. */
export const MAX_SESSION_PCM_BYTES = 5_760_000; // 180 seconds of PCM across a session
export const MAX_SESSION_SEGMENTS = 24;
export const MAX_PARALLEL_TRANSCRIPTIONS = 3;
export const NO_SPEECH_MARKER = '[no speech]';

export type TranscriptionReport = { completed: number; failed: number; noSpeech: number };

/**
 * Transcribe only after the learner chooses Finish and review.
 * Limited concurrency means one slow provider request does not serialize the
 * entire session, while each result stays in its original turn position.
 * On failures the caller must mark the review incomplete; do not infer words.
 */
export async function transcribeRecordedTurns(
  recordings: RecordedPracticeTurn[],
  transcribe: (audioBase64: string) => Promise<string>,
  onProgress?: (done: number, total: number) => void,
): Promise<TranscriptionReport> {
  let cursor = 0;
  let done = 0;
  let completed = 0;
  let failed = 0;
  let noSpeech = 0;
  async function worker() {
    while (cursor < recordings.length) {
      const recording = recordings[cursor++];
      try {
        const result = (await transcribe(recording.audioBase64)).trim();
        if (result.toLowerCase() === NO_SPEECH_MARKER) {
          noSpeech++;
          recording.turn.text = '';
        } else if (result) {
          recording.turn.text = result;
          completed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      } finally {
        done++;
        onProgress?.(done, recordings.length);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL_TRANSCRIPTIONS, recordings.length) }, () => worker()));
  return { completed, failed, noSpeech };
}
