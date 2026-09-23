import type { MouthPose, MouthViseme } from '../character/types';

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, amount: number) => a + (b - a) * amount;

export interface TimedMouthPose {
  offsetSeconds: number;
  pose: MouthPose;
}

const basePose = (viseme: MouthViseme, energy: number): MouthPose => {
  const voice = clamp(energy);
  switch (viseme) {
    case 'MBP': return { viseme, energy: voice, open: 0.01, width: 0.4, round: 0.02 };
    case 'FV': return { viseme, energy: voice, open: 0.14, width: 0.58, round: 0.03 };
    case 'EE': return { viseme, energy: voice, open: 0.22 + voice * 0.1, width: 0.9, round: 0.01 };
    case 'IH': return { viseme, energy: voice, open: 0.3 + voice * 0.08, width: 0.7, round: 0.04 };
    case 'AA': return { viseme, energy: voice, open: 0.5 + voice * 0.34, width: 0.68, round: 0.08 };
    case 'OH': return { viseme, energy: voice, open: 0.5 + voice * 0.22, width: 0.48, round: 0.78 };
    case 'OO': return { viseme, energy: voice, open: 0.28 + voice * 0.14, width: 0.32, round: 0.98 };
    case 'L': return { viseme, energy: voice, open: 0.38 + voice * 0.1, width: 0.62, round: 0.04 };
    case 'S': return { viseme, energy: voice, open: 0.13 + voice * 0.08, width: 0.78, round: 0.03 };
    case 'CH': return { viseme, energy: voice, open: 0.24 + voice * 0.08, width: 0.62, round: 0.58 };
    case 'WQ': return { viseme, energy: voice, open: 0.2 + voice * 0.06, width: 0.34, round: 0.98 };
    case 'REST':
    default: return { viseme: 'REST', energy: voice, open: 0.035, width: 0.42, round: 0.05 };
  }
};

const mixPose = (audio: MouthPose, hint: MouthPose, amount: number): MouthPose => ({
  viseme: amount >= 0.4 ? hint.viseme : audio.viseme,
  energy: audio.energy,
  open: lerp(audio.open, hint.open, amount),
  width: lerp(audio.width ?? 0.5, hint.width ?? 0.5, amount),
  round: lerp(audio.round ?? 0, hint.round ?? 0, amount),
});

const textToVisemes = (input: string): MouthViseme[] => {
  const normalized = input.toLowerCase();
  const result: MouthViseme[] = [];
  let index = 0;
  while (index < normalized.length) {
    const pair = normalized.slice(index, index + 2);
    const char = normalized[index];
    if (/\s|[.,!?;:()[\]{}"']/u.test(char)) { index += 1; continue; }
    if (pair === 'sh' || pair === 'ch' || pair === 'zh') { result.push('CH'); index += 2; continue; }
    if (pair === 'th') { result.push('S'); index += 2; continue; }
    if (pair === 'oo' || pair === 'ou') { result.push('OO'); index += 2; continue; }
    if (pair === 'ee' || pair === 'ea') { result.push('EE'); index += 2; continue; }
    if (/[bmp]/u.test(char)) result.push('MBP');
    else if (/[fv]/u.test(char)) result.push('FV');
    else if (/[wq]/u.test(char)) result.push('WQ');
    else if (/[iy]/u.test(char)) result.push('EE');
    else if (/[u]/u.test(char)) result.push('OO');
    else if (/[o]/u.test(char)) result.push('OH');
    else if (/[a]/u.test(char)) result.push('AA');
    else if (/[e]/u.test(char)) result.push('IH');
    else if (char === 'l') result.push('L');
    else if (/[sztdkgrnxcj]/u.test(char)) result.push('S');
    else if (/\p{L}/u.test(char)) result.push('S');
    index += 1;
  }
  return result;
};

class TranscriptGuide {
  private queue: MouthViseme[] = [];
  private transcript = '';
  private elapsed = 0;

  push(text: string) {
    const incoming = text.trim();
    if (!incoming) return;
    let delta = incoming;
    if (incoming.startsWith(this.transcript)) {
      delta = incoming.slice(this.transcript.length);
      this.transcript = incoming;
    } else if (this.transcript.endsWith(incoming)) {
      return;
    } else {
      let overlap = 0;
      const max = Math.min(this.transcript.length, incoming.length);
      for (let length = max; length > 0; length -= 1) {
        if (this.transcript.slice(-length) === incoming.slice(0, length)) { overlap = length; break; }
      }
      delta = incoming.slice(overlap);
      this.transcript += delta;
    }
    this.queue.push(...textToVisemes(delta));
    if (this.queue.length > 64) this.queue.splice(0, this.queue.length - 64);
  }

  next(deltaSeconds: number, energy: number) {
    const current = this.queue[0];
    if (!current) return null;
    const hold = ['MBP', 'FV', 'S', 'CH', 'WQ'].includes(current) ? 0.055 : 0.075;
    if (energy > 0.025 || current === 'MBP') {
      this.elapsed += deltaSeconds;
      if (this.elapsed >= hold) { this.queue.shift(); this.elapsed = 0; }
    }
    return current;
  }

  reset() {
    this.queue = [];
    this.transcript = '';
    this.elapsed = 0;
  }
}

const goertzelPower = (samples: Float32Array, sampleRate: number, frequency: number) => {
  const omega = (2 * Math.PI * frequency) / sampleRate;
  const coefficient = 2 * Math.cos(omega);
  let s0 = 0; let s1 = 0; let s2 = 0;
  for (const sample of samples) {
    s0 = sample + coefficient * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return Math.max(0, s1 * s1 + s2 * s2 - coefficient * s1 * s2);
};

const analyzeFrame = (samples: Int16Array, sampleRate: number): MouthPose => {
  if (!samples.length) return basePose('REST', 0);
  const windowed = new Float32Array(samples.length);
  let sumSquares = 0;
  let zeroCrossings = 0;
  let previous = samples[0];
  let previousNormalized = previous / 32768;
  for (let index = 0; index < samples.length; index += 1) {
    const normalized = samples[index] / 32768;
    sumSquares += normalized * normalized;
    if ((samples[index] >= 0) !== (previous >= 0)) zeroCrossings += 1;
    previous = samples[index];
    const emphasized = normalized - 0.94 * previousNormalized;
    previousNormalized = normalized;
    const hamming = 0.54 - 0.46 * Math.cos((2 * Math.PI * index) / Math.max(1, samples.length - 1));
    windowed[index] = emphasized * hamming;
  }

  const rms = Math.sqrt(sumSquares / samples.length);
  const energy = clamp((rms - 0.0045) * 8.8);
  if (energy < 0.035) return basePose('REST', energy);

  const zcr = zeroCrossings / samples.length;
  const frequencies: number[] = [];
  for (let frequency = 250; frequency <= 3250; frequency += 150) frequencies.push(frequency);
  const powers = frequencies.map((frequency) => goertzelPower(windowed, sampleRate, frequency));
  let f1 = 500; let f1Power = -1; let f2 = 1500; let f2Power = -1;
  let total = 0; let weighted = 0;
  for (let index = 0; index < frequencies.length; index += 1) {
    const frequency = frequencies[index]; const power = powers[index];
    total += power; weighted += power * frequency;
    if (frequency <= 1000 && power > f1Power) { f1 = frequency; f1Power = power; }
  }
  for (let index = 0; index < frequencies.length; index += 1) {
    const frequency = frequencies[index]; const power = powers[index];
    if (frequency >= Math.max(850, f1 + 300) && power > f2Power) { f2 = frequency; f2Power = power; }
  }
  const centroid = total > 0 ? weighted / total : 1200;
  const highNoise = clamp((centroid - 1350) / 1500) * clamp((zcr - 0.05) / 0.2);

  let viseme: MouthViseme;
  if (highNoise > 0.34 && energy < 0.72) viseme = centroid < 2050 ? 'FV' : 'S';
  else if (f1 < 475 && f2 > 1700) viseme = 'EE';
  else if (f1 < 475 && f2 < 1250) viseme = 'OO';
  else if (f1 >= 700) viseme = 'AA';
  else if (f2 < 1350) viseme = 'OH';
  else viseme = 'IH';

  const pose = basePose(viseme, energy);
  pose.open = clamp(pose.open * (0.72 + energy * 0.38));
  return pose;
};

export class VisemeAnalyzer {
  private readonly transcript = new TranscriptGuide();

  pushTranscript(text: string) { this.transcript.push(text); }
  resetTranscript() { this.transcript.reset(); }

  analyze(samples: Int16Array, sampleRate: number): TimedMouthPose[] {
    const frameSize = Math.max(160, Math.round(sampleRate * 0.024));
    const hopSize = Math.max(120, Math.round(sampleRate * 0.02));
    const frames: TimedMouthPose[] = [];
    for (let start = 0; start < samples.length; start += hopSize) {
      const frame = samples.subarray(start, Math.min(samples.length, start + frameSize));
      const audio = analyzeFrame(frame, sampleRate);
      const hintViseme = this.transcript.next(hopSize / sampleRate, audio.energy);
      const hint = hintViseme ? basePose(hintViseme, audio.energy) : null;
      const hintWeight = hintViseme && ['MBP', 'FV', 'L', 'CH', 'WQ'].includes(hintViseme) ? 0.48 : 0.3;
      frames.push({ offsetSeconds: start / sampleRate, pose: hint ? mixPose(audio, hint, hintWeight) : audio });
      if (frame.length < frameSize) break;
    }
    return frames.length ? frames : [{ offsetSeconds: 0, pose: basePose('REST', 0) }];
  }
}
