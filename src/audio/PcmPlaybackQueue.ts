import type { MouthPose } from '../character/types';
import { VisemeAnalyzer } from './VisemeAnalyzer';

const base64ToInt16 = (base64: string) => {
  const binary = atob(base64);
  const evenLength = binary.length - (binary.length % 2);
  const bytes = new Uint8Array(evenLength);
  for (let index = 0; index < evenLength; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Int16Array(bytes.buffer);
};

export interface PlaybackCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  /** Fires only after a model turn with actual audible PCM has finished playing. */
  onTurnComplete?: () => void;
  onMouthPose?: (pose: MouthPose | null) => void;
}

export class PcmPlaybackQueue {
  private context: AudioContext | null = null;
  private nextStart = 0;
  private generation = 0;
  private enqueueChain: Promise<void> = Promise.resolve();
  private active = new Set<AudioBufferSourceNode>();
  private outputActive = false;
  private turnCompletePending = false;
  private turnHasAudio = false;
  private starvationTimer: number | null = null;
  private timers = new Set<number>();
  private readonly visemes = new VisemeAnalyzer();

  constructor(private readonly callbacks: PlaybackCallbacks = {}) {}

  async unlock() {
    if (!this.context) this.context = new AudioContext({ latencyHint: 'interactive' });
    if (this.context.state === 'suspended') await this.context.resume();
    const buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start();
  }

  pushTranscript(text: string) {
    this.visemes.pushTranscript(text);
  }

  enqueue(base64: string, sampleRate = 24_000) {
    const generation = this.generation;
    const job = this.enqueueChain.then(() => this.enqueueChunk(base64, sampleRate, generation));
    this.enqueueChain = job.catch(() => {});
    return job;
  }

  markTurnComplete() {
    const generation = this.generation;
    void this.enqueueChain.then(() => {
      if (generation !== this.generation) return;
      if (!this.turnHasAudio) {
        // Tool-only / text-only server turns are not audible partner turns and must never
        // advance authored teaching or lesson-opening gates.
        this.visemes.resetTranscript();
        return;
      }
      this.turnCompletePending = true;
      if (this.active.size === 0) this.finishOutput();
    });
  }

  interrupt() {
    this.generation += 1;
    const hadPlayback = this.outputActive || this.active.size > 0;
    this.clearStarvationTimer();
    this.clearTimers();
    for (const source of this.active) {
      source.onended = null;
      try { source.stop(); } catch { /* already stopped */ }
    }
    this.active.clear();
    this.nextStart = 0;
    this.turnHasAudio = false;
    this.turnCompletePending = false;
    this.outputActive = false;
    this.visemes.resetTranscript();
    this.callbacks.onMouthPose?.(null);
    if (hadPlayback) this.callbacks.onSpeechEnd?.();
  }

  async close() {
    this.interrupt();
    await this.context?.close();
    this.context = null;
  }

  private async enqueueChunk(base64: string, sampleRate: number, generation: number) {
    if (generation !== this.generation) return;
    this.clearStarvationTimer();
    const samples = base64ToInt16(base64);
    if (!samples.length) return;
    if (!this.context) this.context = new AudioContext({ latencyHint: 'interactive' });
    if (this.context.state === 'suspended') await this.context.resume();
    if (generation !== this.generation) return;

    const buffer = this.context.createBuffer(1, samples.length, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) channel[index] = samples[index] / 32768;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    this.active.add(source);

    const now = this.context.currentTime;
    const startAt = Math.max(now + (this.nextStart === 0 ? 0.075 : 0.012), this.nextStart);
    if (!this.outputActive) {
      this.outputActive = true;
      this.schedule(startAt, generation, () => this.callbacks.onSpeechStart?.());
    }

    for (const frame of this.visemes.analyze(samples, sampleRate)) {
      this.schedule(startAt + frame.offsetSeconds, generation, () => {
        this.callbacks.onMouthPose?.(frame.pose);
      });
    }

    this.turnHasAudio = true;
    source.start(startAt);
    this.nextStart = startAt + buffer.duration;
    source.onended = () => {
      this.active.delete(source);
      if (this.active.size) return;
      if (this.turnCompletePending) this.finishOutput();
      else {
        this.starvationTimer = window.setTimeout(() => {
          this.starvationTimer = null;
          if (!this.active.size && this.outputActive) this.finishOutput();
        }, 900);
      }
    };
  }

  private schedule(audioTime: number, generation: number, callback: () => void) {
    if (!this.context) return;
    const delay = Math.max(0, (audioTime - this.context.currentTime) * 1000);
    const timer = window.setTimeout(() => {
      this.timers.delete(timer);
      if (generation === this.generation) callback();
    }, delay);
    this.timers.add(timer);
  }

  private finishOutput() {
    const completed = this.turnCompletePending && this.turnHasAudio;
    this.clearStarvationTimer();
    this.clearTimers();
    this.nextStart = 0;
    this.outputActive = false;
    this.turnCompletePending = false;
    this.turnHasAudio = false;
    this.visemes.resetTranscript();
    this.callbacks.onMouthPose?.(null);
    if (completed) this.callbacks.onTurnComplete?.();
    this.callbacks.onSpeechEnd?.();
  }

  private clearStarvationTimer() {
    if (this.starvationTimer !== null) window.clearTimeout(this.starvationTimer);
    this.starvationTimer = null;
  }

  private clearTimers() {
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers.clear();
  }
}
