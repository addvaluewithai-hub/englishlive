/**
 * Practice-only mic capture. The same 16 kHz mono PCM that goes to Otti is held
 * temporarily to make a WAV for Flash-Lite. Nothing is persisted on the client.
 * A bounded pre-roll keeps consonants at the start of speech; hard overflow
 * fails closed instead of sending a misleading truncated recording.
 */
const RATE = 16_000;
const MAX_BYTES = 960_000; // 30 seconds at 16 kHz, mono 16-bit.
const PREROLL_BYTES = 16_000; // 0.5 second
const VOICE_LEVEL = 0.045;

export class PracticeTurnAudioBuffer {
  private chunks: Uint8Array[] = [];
  private preRoll: Uint8Array[] = [];
  private bytes = 0;
  private preRollBytes = 0;
  private started = false;
  private overflow = false;

  get hasSpeech() { return this.started; }

  push(base64Pcm: string, level: number) {
    if (this.overflow) return;
    const binary = atob(base64Pcm);
    const chunk = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    if (!chunk.length || chunk.length % 2) return;
    if (!this.started) {
      this.preRoll.push(chunk);
      this.preRollBytes += chunk.length;
      while (this.preRollBytes > PREROLL_BYTES && this.preRoll.length > 1) {
        this.preRollBytes -= this.preRoll.shift()!.length;
      }
      if (level <= VOICE_LEVEL) return;
      this.started = true;
      this.chunks = this.preRoll;
      this.bytes = this.preRollBytes;
      this.preRoll = [];
      this.preRollBytes = 0;
      if (this.bytes > MAX_BYTES) this.overflow = true;
      return;
    }
    if (this.bytes + chunk.length > MAX_BYTES) { this.overflow = true; return; }
    this.chunks.push(chunk);
    this.bytes += chunk.length;
  }

  clear() {
    this.chunks = [];
    this.preRoll = [];
    this.bytes = 0;
    this.preRollBytes = 0;
    this.started = false;
    this.overflow = false;
  }

  takeWavBase64(): { audioBase64: string | null; overflow: boolean } {
    const overflow = this.overflow;
    if (!this.started || overflow) { this.clear(); return { audioBase64: null, overflow }; }
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
    header.setUint16(20, 1, true); // PCM
    header.setUint16(22, 1, true); // mono
    header.setUint32(24, RATE, true);
    header.setUint32(28, RATE * 2, true);
    header.setUint16(32, 2, true);
    header.setUint16(34, 16, true);
    fourCC(36, 'data');
    header.setUint32(40, this.bytes, true);
    let offset = 44;
    for (const chunk of this.chunks) { wav.set(chunk, offset); offset += chunk.length; }
    this.clear();
    // Avoid spreading unbounded arrays as function arguments.
    let encoded = '';
    for (let i = 0; i < wav.length; i += 0x8000) {
      encoded += String.fromCharCode(...wav.subarray(i, i + 0x8000));
    }
    return { audioBase64: btoa(encoded), overflow: false };
  }
}
