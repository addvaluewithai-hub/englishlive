import type { TeachingBeat } from './b1/teacherLabScript';

/**
 * An application-owned narration cursor. The caller must only advance after
 * the corresponding audible PCM turn has actually finished playing.
 * The teacher can answer questions between scripted stretches, but cannot
 * decide which teaching line comes next.
 */
export class ScriptedNarrationDirector {
  private sceneId: string | null = null;
  private beats: readonly TeachingBeat[] = [];
  private index = -1;
  private reading = false;

  get isReading() { return this.reading; }
  get currentSceneId() { return this.sceneId; }
  get currentBeat() { return this.reading ? this.beats[this.index] : null; }

  start(sceneId: string, beats: readonly TeachingBeat[]): TeachingBeat {
    if (!beats.length) throw new Error('Each scripted scene needs a narration line.');
    if (this.reading) throw new Error('Cannot start a new scene while narration is playing.');
    this.sceneId = sceneId;
    this.beats = beats;
    this.index = 0;
    this.reading = true;
    return beats[0];
  }

  /** Never advance on tool-only responses, transcript events or predicted audio timing. */
  audioFinished(): { next: TeachingBeat | null; finishedSceneId: string | null } {
    if (!this.reading) return { next: null, finishedSceneId: null };
    if (this.index + 1 < this.beats.length) {
      return { next: this.beats[++this.index], finishedSceneId: null };
    }
    this.reading = false;
    return { next: null, finishedSceneId: this.sceneId };
  }

  /** An interruption does not automatically skip an unread line. */
  pause(): TeachingBeat | null {
    const beat = this.currentBeat;
    this.reading = false;
    return beat;
  }
}
