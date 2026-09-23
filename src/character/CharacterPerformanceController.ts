import type { CharacterHostHandle } from './CharacterHost';
import type { CharacterPerformanceCue } from './performance';
import type { MouthPose } from './types';

export class CharacterPerformanceController {
  private speaking = false;
  private pendingCue: CharacterPerformanceCue | null = null;
  private resetTimer: number | null = null;

  constructor(private readonly getHost: () => CharacterHostHandle | null) {}

  setMouth(pose: MouthPose | null) {
    this.getHost()?.setMouth(pose);
  }

  speechStart() {
    this.speaking = true;
    this.getHost()?.setMode('speaking');
    if (this.pendingCue) {
      const cue = this.pendingCue;
      this.pendingCue = null;
      this.applyNow(cue);
    }
  }

  speechEnd() {
    this.speaking = false;
    this.getHost()?.setMouth(null);
    this.getHost()?.setMode('listening');
  }

  thinking() {
    if (!this.speaking) this.getHost()?.setMode('thinking');
  }

  listening() {
    if (!this.speaking) this.getHost()?.setMode('listening');
  }

  applyCue(cue: CharacterPerformanceCue) {
    if (this.speaking) this.applyNow(cue);
    else this.pendingCue = cue;
  }

  interrupt() {
    this.speaking = false;
    this.pendingCue = null;
    this.clearResetTimer();
    const host = this.getHost();
    host?.cancel();
    host?.setMouth(null);
    host?.setEmotion('neutral', 0.55);
    host?.setMode('listening');
  }

  cancelCue() {
    this.pendingCue = null;
    this.clearResetTimer();
    const host = this.getHost();
    host?.cancel();
    host?.setEmotion('neutral', 0.55);
  }

  close() {
    this.speaking = false;
    this.pendingCue = null;
    this.clearResetTimer();
    const host = this.getHost();
    host?.cancel();
    host?.setMouth(null);
    host?.setMode('idle');
  }

  private applyNow(cue: CharacterPerformanceCue) {
    const host = this.getHost();
    if (!host) return;
    host.setEmotion(cue.emotion, cue.intensity);
    host.setGesture(cue.gesture, cue.durationSeconds);
    this.clearResetTimer();
    this.resetTimer = window.setTimeout(() => {
      this.resetTimer = null;
      this.getHost()?.setEmotion('neutral', 0.55);
    }, cue.durationSeconds * 1000);
  }

  private clearResetTimer() {
    if (this.resetTimer !== null) window.clearTimeout(this.resetTimer);
    this.resetTimer = null;
  }
}
