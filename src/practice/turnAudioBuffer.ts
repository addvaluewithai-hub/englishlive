/**
 * Collect the exact 16kHz PCM16 mic frames sent to Otti while the learner mic
 * is enabled. No speech-level threshold: quiet words are never discarded.
 * Frames are retained in memory until the learner explicitly requests review.
 * Bound each segment to 30s; overflow is reported, not silently truncated.
 */
export const PRACTICE_MAX_SEGMENT_PCM_BYTES = 960_000;
const RATE = 16_000;
const MIN_BYTES = 3_200; // ignore tiny callbacks (<100ms), never assess speech volume.

export class PracticeTurnAudioBuffer {
  private chunks: Uint8Array[] = [];
  private bytes = 0;
  private overflow = false;

  get hasAudio() { return this.bytes >= MIN_BYTES && !this.overflow; }
  get sizeBytes() { return this.bytes; }
  get overflowed() { return this.overflow; }

  push(base64Pcm: string) {
    if (this.overflow) return;
    const binary = atob(base64Pcm);
    const chunk = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    if (!chunk.length || chunk.length % 2) return;
    if (this.bytes + chunk.length > PRACTICE_MAX_SEGMENT_PCM_BYTES) {
      this.overflow = true;
      return;
    }
    this.chunks.push(chunk);
    this.bytes += chunk.length;
  }

  clear() {
    this.chunks = [];
    this.bytes = 0;
    this.overflow = false;
  }

  takeWavBase64(): { audioBase64: string | null; overflow: boolean } {
    const overflow = this.overflow;
    if (!this.hasAudio) {
      this.clear();
      return { audioBase64: null, overflow };
    }
    const wav = new Uint8Array(44 + this.bytes);
    const header = new DataView(wav.buffer);
    const fourCC = (offset: number, word: string) => {
      for (let i = 0; i < 4; i++) header.setUint8(offset + i, word.charCodeAt(i));
    };
    fourCC(0, 'RIFF');
    header.setUint32(4, wav.length - 8, true);
    fourCC(8, 'WAVE');
    fourCC(12, 'fmt ');
    header.setUint32(16, 16, true);
    header.setUint16(20, 1, true);
    header.setUint16(22, 1, true);
    header.setUint32(24, RATE, true);
    header.setUint32(28, RATE * 2, true);
    header.setUint16(32, 2, true);
    header.setUint16(34, 16);
    fourCC(36, 'data');
    header.setUint32(40, this.bytes, true);
    let offset = 44;
    for (const chunk of this.chunks) { wav.set(chunk, offset); offset += chunk.length; }
    this.clear();
    let encoded = '';
    for (let i = 0; i < wav.length; i += 0x8000) {
      encoded += String.fromCharCode(...wav.subarray(i, i + 0x8000));
    }
    return { audioBase64: btoa(encoded), overflow: false };
  }
}
