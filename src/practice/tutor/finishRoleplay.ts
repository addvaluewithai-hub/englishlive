import type { TutorSession } from './TutorSession';

export type FinalReviewOutcome = 'received' | 'missing' | 'offline';

const FIRST_WAIT_MS = 15_000;
const REMINDER_WAIT_MS = 10_000;

export const FINISH_NOTES_EVENT = [
  'PRIVATE_FINISH_NOTES: the learner pressed Done. The roleplay is over. Do not speak.',
  'Think back over everything the learner said in this session and call submit_final_review once now.',
  'Include EVERY clearly heard English mistake, small ones too, with their exact words and a corrected version, even if you already noted it.',
  'Do not invent quotes and do not use prompt examples as evidence. If their English was clearly correct use status no_clear_issue; if you could not hear it well use uncertain.',
].join(' ');

const FINISH_REMINDER = 'PRIVATE_FINISH_NOTES reminder: call submit_final_review now with the learner mistakes you heard (or an honest status). Do not speak.';

async function waitFor(done: () => boolean, ms: number, cancelled: () => boolean) {
  const deadline = Date.now() + ms;
  while (!done() && !cancelled() && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 60));
}

/**
 * End the roleplay inside the SAME Live connection that heard the learner, then ask Otti for
 * one dedicated review call. Audio output is muted and the microphone stays closed. The
 * notebook is frozen only after every received message has been handled.
 */
export async function finishRoleplay(session: TutorSession | null, finalized: () => boolean): Promise<{ outcome: FinalReviewOutcome; waitedMs: number }> {
  const started = Date.now();
  if (!session || session.closed || !session.live?.connected) {
    session?.options.diagnostic({ event: 'finish_missing', ms: 0 });
    return { outcome: 'offline', waitedMs: 0 };
  }
  session.finishing = true;
  session.clearTimers();
  session.setMic(false);
  session.suppressOutput = true;
  session.queue?.interrupt();
  session.performer.thinking();
  session.update({ status: 'listening', waiting: true });
  session.live.endAudioStream();
  session.live.sendText(FINISH_NOTES_EVENT);
  session.options.diagnostic({ event: 'finish_requested' });
  const gone = () => session.closed || !session.live?.connected;
  await waitFor(finalized, FIRST_WAIT_MS, gone);
  if (!finalized() && !gone()) {
    session.live?.sendText(FINISH_REMINDER);
    session.options.diagnostic({ event: 'finish_reminder' });
    await waitFor(finalized, REMINDER_WAIT_MS, gone);
  }
  await session.live?.flushPendingMessages();
  session.flushTeacher();
  const waitedMs = Date.now() - started;
  const outcome: FinalReviewOutcome = finalized() ? 'received' : 'missing';
  session.options.diagnostic({ event: outcome === 'received' ? 'finish_received' : 'finish_missing', ms: waitedMs });
  return { outcome, waitedMs };
}
