import { PcmPlaybackQueue } from '../../audio/PcmPlaybackQueue';
import type { TutorSession } from './TutorSession';

/** Otti's audio output, wired to the animated mouth and to turn hand-back when playback drains. */
export function createTutorPlayback(session: TutorSession) {
  return new PcmPlaybackQueue({
    onMouthPose: (pose) => { if (!session.closed) session.performer.setMouth(pose); },
    onSpeechStart: () => {
      if (session.closed || session.holding) return;
      session.setMic(false);
      session.update({ status: 'speaking', waiting: false });
      session.performer.speechStart();
    },
    onSpeechEnd: () => {
      if (session.closed || session.holding) return;
      session.performer.speechEnd();
      session.playbackDrained();
    },
    onTurnComplete: () => session.listen(),
  });
}
