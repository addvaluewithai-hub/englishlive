import type { FreeSpeakRecap, FreeSpeakTurn, FreeSpeakVocabularyItem } from '../../src/freeSpeak/types';

export interface FreeSpeakAnalysisEnv {
  GEMINI_API_KEY?: string;
  FREE_SPEAK_ANALYSIS_MODEL?: string;
}

const DEFAULT_ANALYSIS_MODEL = 'gemini-3.5-flash-lite';

const recapSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    schemaVersion: { type: 'integer', enum: [1] },
    headlineAr: {
      type: 'string',
      description: 'A short encouraging Arabic headline, grounded in what actually happened.',
    },
    conversationTopicAr: {
      type: 'string',
      description: 'A short Arabic noun phrase naming the main conversation topic.',
    },
    summaryAr: {
      type: 'string',
      description: 'One concise Arabic sentence summarizing what the learner talked about.',
    },
    strengths: {
      type: 'array',
      maxItems: 3,
      items: { type: 'string' },
      description: '0-3 concise Arabic strengths supported by the learner transcript.',
    },
    corrections: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          original: { type: 'string' },
          improved: { type: 'string' },
          noteAr: { type: 'string' },
        },
        required: ['original', 'improved', 'noteAr'],
      },
      description: '0-3 meaningful English corrections. Never correct punctuation or capitalization from speech transcription.',
    },
    vocabulary: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          word: { type: 'string' },
          meaningAr: { type: 'string' },
          source: { type: 'string', enum: ['learner', 'teacher', 'asked_about'] },
        },
        required: ['word', 'meaningAr', 'source'],
      },
      description: 'Useful English words that were actually present in the transcript. asked_about only if the learner explicitly asked what a word/expression meant.',
    },
    nextFocusAr: {
      type: ['string', 'null'],
      description: 'One small evidence-based next focus in Arabic, or null when the transcript is too short.',
    },
  },
  required: [
    'schemaVersion',
    'headlineAr',
    'conversationTopicAr',
    'summaryAr',
    'strengths',
    'corrections',
    'vocabulary',
    'nextFocusAr',
  ],
} as const;

function clip(value: unknown, max: number, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback;
}

function transcriptText(turns: FreeSpeakTurn[]) {
  return turns.map((turn) => {
    const seconds = Math.max(0, Math.round(turn.atMs / 1_000));
    const label = turn.speaker === 'learner' ? 'LEARNER' : 'TEACHER';
    return `[${seconds}s] ${label}: ${turn.text}`;
  }).join('\n');
}

function normalizeRecap(value: unknown): FreeSpeakRecap {
  const input = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const strengths = Array.isArray(input.strengths)
    ? input.strengths.map((item) => clip(item, 180)).filter(Boolean).slice(0, 3)
    : [];
  const corrections = Array.isArray(input.corrections)
    ? input.corrections.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      const original = clip(row.original, 220);
      const improved = clip(row.improved, 220);
      const noteAr = clip(row.noteAr, 220);
      if (!original || !improved || original === improved) return [];
      return [{ original, improved, noteAr }];
    }).slice(0, 3)
    : [];
  const vocabulary: FreeSpeakVocabularyItem[] = Array.isArray(input.vocabulary)
    ? input.vocabulary.flatMap((item): FreeSpeakVocabularyItem[] => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      const word = clip(row.word, 80);
      const meaningAr = clip(row.meaningAr, 160);
      const source: FreeSpeakVocabularyItem['source'] = row.source === 'learner' || row.source === 'teacher' || row.source === 'asked_about'
        ? row.source
        : 'teacher';
      if (!word) return [];
      return [{ word, meaningAr, source }];
    }).filter((item, index, all) => all.findIndex((candidate) => candidate.word.toLowerCase() === item.word.toLowerCase()) === index).slice(0, 6)
    : [];

  return {
    schemaVersion: 1,
    headlineAr: clip(input.headlineAr, 80, 'محادثة حلوة!'),
    conversationTopicAr: clip(input.conversationTopicAr, 90, 'محادثة عامة'),
    summaryAr: clip(input.summaryAr, 280, 'اتكلمت بالإنجليزي في محادثة حقيقية.'),
    strengths,
    corrections,
    vocabulary,
    nextFocusAr: typeof input.nextFocusAr === 'string' && input.nextFocusAr.trim()
      ? input.nextFocusAr.trim().slice(0, 220)
      : null,
  };
}

function interactionText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return '';
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === 'string' && record.output_text.trim()) return record.output_text.trim();
  if (!Array.isArray(record.steps)) return '';

  const chunks: string[] = [];
  for (const step of record.steps) {
    if (!step || typeof step !== 'object') continue;
    const content = (step as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      const row = part as Record<string, unknown>;
      if (row.type === 'text' && typeof row.text === 'string') chunks.push(row.text);
    }
  }
  return chunks.join('').trim();
}

export async function analyzeFreeSpeakTranscript(
  env: FreeSpeakAnalysisEnv,
  input: {
    modeId: string;
    characterName: string;
    durationSeconds: number;
    transcript: FreeSpeakTurn[];
  },
) {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  const model = env.FREE_SPEAK_ANALYSIS_MODEL?.trim() || DEFAULT_ANALYSIS_MODEL;
  const transcript = transcriptText(input.transcript);
  if (!transcript.trim()) throw new Error('Conversation transcript is empty.');

  const prompt = `You are Englotti's post-conversation English coach.
Analyze the transcript of a real voice conversation between an English learner and ${input.characterName}.

PRODUCT RULES
- The conversation itself comes first. This recap should be short, warm and useful, never school-like or overwhelming.
- Base every claim ONLY on evidence in the transcript. Do not invent something the learner did not say.
- ASR punctuation, capitalization and spelling can be noisy. Never create a correction that is only punctuation/capitalization.
- Never score pronunciation, accent, intonation, fluency percentage or proficiency level. This transcript is not phoneme-level evidence.
- Strengths: mention concrete communication behavior or successful English use. 0-3 items only.
- Corrections: choose only high-value grammar, word-choice or natural-phrasing improvements from LEARNER turns. 0-3 items. Keep the learner's intended meaning.
- If a learner sentence is acceptable conversational English, do not "correct" it just to make it stylistically different.
- Vocabulary: include only words/expressions that literally appear in the transcript. source=asked_about only when the learner explicitly asks about its meaning. 0-6 items.
- Arabic UI text should be concise Egyptian Arabic written in Arabic script. English examples remain English.
- If the transcript is too short for a section, return an empty array or null instead of making something up.
- The recap is not part of structured-course progress.

CONTEXT
Mode: ${input.modeId}
Duration: ${input.durationSeconds} seconds

TRANSCRIPT
${transcript}`;

  // Interactions is Google's current recommended Gemini API surface. Using it
  // here also gives Flash-Lite a first-class structured-output path instead of
  // relying on the legacy generateContent model/support matrix.
  const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      store: false,
      generation_config: {
        thinking_level: 'minimal',
        max_output_tokens: 2_400,
      },
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: recapSchema,
      },
    }),
  });

  const payload = await upstream.json().catch(() => null) as {
    status?: string;
    steps?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    output_text?: string;
    error?: { message?: string };
  } | null;

  if (!upstream.ok) {
    throw new Error(payload?.error?.message || `Gemini analysis failed (${upstream.status}).`);
  }
  if (payload?.status && payload.status !== 'completed') {
    throw new Error(`Gemini analysis did not complete (status: ${payload.status}).`);
  }

  const text = interactionText(payload);
  if (!text) throw new Error('Gemini analysis returned an empty response.');

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini analysis did not return valid JSON.');
  }

  return { model, recap: normalizeRecap(parsed) };
}
