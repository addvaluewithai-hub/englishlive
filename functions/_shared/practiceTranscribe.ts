/**
 * Strict, literal audio-to-text only. NEVER ask Gemini to repair learner English:
 * the later coach needs evidence of the original mistakes.
 */
export const PRACTICE_TRANSCRIBE_MODEL = 'gemini-3.1-flash-lite';
export const MAX_WAV_BYTES = 960_044; // header + up to 30 s of 16 kHz PCM
export const MAX_REQUEST_CHARS = 1_400_000;
export const VERBATIM_PROMPT = [
  'Transcribe the audible LEARNER speech in this recording WORD FOR WORD.',
  'This is an English-language learning assessment. Write actual spoken words, not what the learner should have said.',
  'KEEP all grammatical mistakes, wrong articles, fragments, repeated words, self-corrections, and filler words.',
  'Do NOT correct, improve, paraphrase, translate, normalize, summarize, or complete an unfinished sentence.',
  'Use Latin letters for audible English speech. If the person actually speaks Arabic, use Arabic script for those Arabic words. Never use Hindi/Devanagari for English words.',
  'Do not infer unheard words from the scenario. If unintelligible, use [inaudible] for that fragment, never guess.',
  'If the recording contains only silence or ambient noise and no actual spoken words, return exactly [no speech]. Do not invent a conversation.',
  'Return ONLY the transcript text. No label, quotation marks, comments, Markdown, or feedback.',
].join(' ');

export function parsePracticeWav(value: unknown): string {
  if (typeof value !== 'string' || value.length > 1_280_060 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error('Invalid audio payload.');
  const binary = atob(value);
  if (binary.length < 364 || binary.length > MAX_WAV_BYTES) throw new Error('Audio duration/size out of range.');
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const word = (start: number) => String.fromCharCode(...bytes.subarray(start, start + 4));
  if (word(0) !== 'RIFF' || word(8) !== 'WAVE' || word(12) !== 'fmt ' || word(36) !== 'data'
      || view.getUint32(4, true) !== bytes.length - 8 || view.getUint32(16, true) !== 16
      || view.getUint16(20, true) !== 1 || view.getUint16(22, true) !== 1
      || view.getUint32(24, true) !== 16_000 || view.getUint32(28, true) !== 32_000
      || view.getUint16(32, true) !== 2 || view.getUint16(34, true) !== 16
      || view.getUint32(40, true) !== bytes.length - 44) throw new Error('Expected 16 kHz mono PCM WAV.');
  return value;
}

export async function transcribePracticeAudio(env: { GEMINI_API_KEY?: string }, audioBase64: string): Promise<string> {
  const key = env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('Transcription unavailable.');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${PRACTICE_TRANSCRIBE_MODEL}:generateContent`, {
    method: 'POST',
    signal: AbortSignal.timeout(20_000),
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { text: VERBATIM_PROMPT },
        { inline_data: { mime_type: 'audio/wav', data: audioBase64 } },
      ] }],
      generationConfig: { temperature: 0, maxOutputTokens: 600 },
    }),
  });
  if (!response.ok) throw new Error('Transcription provider unavailable.');
  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const transcript = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim() ?? '';
  if (!transcript || transcript.length > 4000) throw new Error('No reliable transcript returned.');
  return transcript;
}
