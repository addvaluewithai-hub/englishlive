import { PcmPlaybackQueue } from '../../audio/PcmPlaybackQueue';
import type { TutorSession } from './TutorSession';

/** Otti's audio output, wired to the animated mouth and to turn hand-back when playback drains. */
export function createTutorPlayback(session: TutorSession) {
  return new PcmPlaybackQueue({
    onMouthPose: (pose) => { if (!session.closed) session.performer.setMouth(pose); },
    onSpeechStart: () => {
      if (session.closed) return;
      session.setMic(false);
      session.update({ status: 'speaking', waiting: false });
      // The sample's two actors are NOT Otti. Keep his mouth still during it.
      if (session.exampleAudioPlaying) session.performer.listening();
      else session.performer.speechStart();
    },
    onSpeechEnd: () => {
      if (session.closed) return;
      if (!session.exampleAudioPlaying) session.performer.speechEnd();
      session.playbackDrained();
    },
    onTurnComplete: () => session.listen(),
  });
}
