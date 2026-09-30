import type {
  SpeakingEvidenceItem,
  SpeakingRecap,
  SpeakingTurn,
  SpeakingVocabularyItem,
} from '../../src/speaking/types';

export interface SpeakingAnalysisEnv {
  GEMINI_API_KEY?: string;
  SPEAKING_ANALYSIS_MODEL?: string;
  FREE_SPEAK_ANALYSIS_MODEL?: string;
}

const DEFAULT_ANALYSIS_MODEL = 'gemini-3.5-flash-lite';
const outcomes = new Set(['demonstrated', 'emerging', 'not_observed']);

const recapSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    schemaVersion: { type: 'integer', enum: [1] },
    headlineAr: { type: 'string' },
    summaryAr: { type: 'string' },
    strengths: { type: 'array', maxItems: 3, items: { type: 'string' } },
    corrections: {
      type: 'array', maxItems: 2,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          original: { type: 'string' }, improved: { type: 'string' }, noteAr: { type: 'string' },
        },
        required: ['original', 'improved', 'noteAr'],
      },
    },
    vocabulary: {
      type: 'array', maxItems: 6,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          word: { type: 'string' }, meaningAr: { type: 'string' }, source: { type: 'string', enum: ['learner', 'teacher', 'asked_about'] },
        },
        required: ['word', 'meaningAr', 'source'],
      },
    },
    nextFocusAr: { type: ['string', 'null'] },
    evidence: {
      type: 'array', maxItems: 18,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          skillId: { type: 'string' },
          outcome: { type: 'string', enum: ['demonstrated', 'emerging', 'not_observed'] },
          evidenceAr: { type: 'string' },
          learnerExcerpt: { type: ['string', 'null'] },
        },
        required: ['skillId', 'outcome', 'evidenceAr', 'learnerExcerpt'],
      },
    },
  },
  required: ['schemaVersion', 'headlineAr', 'summaryAr', 'strengths', 'corrections', 'vocabulary', 'nextFocusAr', 'evidence'],
} as const;

function clip(value: unknown, max: number, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback;
}

function transcriptText(turns: SpeakingTurn[]) {
  return turns.map((turn) => {
    const seconds = Math.max(0, Math.round(turn.atMs / 1_000));
    const label = turn.speaker === 'learner' ? 'LEARNER' : 'PARTNER';
    return `[${seconds}s] ${label}: ${turn.text}`;
  }).join('\n');
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

function normalizeRecap(value: unknown, targetSkills: string[]): SpeakingRecap {
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
      if (!original || !improved || original === improved) return [];
      return [{ original, improved, noteAr: clip(row.noteAr, 220) }];
    }).slice(0, 2)
    : [];
  const vocabulary: SpeakingVocabularyItem[] = Array.isArray(input.vocabulary)
    ? input.vocabulary.flatMap((item): SpeakingVocabularyItem[] => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      const word = clip(row.word, 80);
      if (!word) return [];
      const source: SpeakingVocabularyItem['source'] = row.source === 'learner' || row.source === 'asked_about' ? row.source : 'teacher';
      return [{ word, meaningAr: clip(row.meaningAr, 160), source }];
    }).filter((item, index, all) => all.findIndex((candidate) => candidate.word.toLowerCase() === item.word.toLowerCase()) === index).slice(0, 6)
    : [];
  const target = new Set(targetSkills);
  const evidence: SpeakingEvidenceItem[] = Array.isArray(input.evidence)
    ? input.evidence.flatMap((item): SpeakingEvidenceItem[] => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      const skillId = clip(row.skillId, 64);
      if (!skillId || !target.has(skillId)) return [];
      const outcome = typeof row.outcome === 'string' && outcomes.has(row.outcome)
        ? row.outcome as SpeakingEvidenceItem['outcome']
        : 'not_observed';
      const learnerExcerpt = typeof row.learnerExcerpt === 'string' && row.learnerExcerpt.trim()
        ? row.learnerExcerpt.trim().slice(0, 280)
        : null;
      return [{ skillId, outcome, evidenceAr: clip(row.evidenceAr, 240), learnerExcerpt }];
    }).filter((item, index, all) => all.findIndex((candidate) => candidate.skillId === item.skillId) === index)
    : [];

  for (const skillId of targetSkills) {
    if (!evidence.some((item) => item.skillId === skillId)) {
      evidence.push({ skillId, outcome: 'not_observed', evidenceAr: 'مافيش دليل كفاية في المحادثة دي.', learnerExcerpt: null });
    }
  }

  return {
    schemaVersion: 1,
    headlineAr: clip(input.headlineAr, 80, 'موقف حقيقي خلص!'),
    summaryAr: clip(input.summaryAr, 300, 'استخدمت الإنجليزي في موقف عملي.'),
    strengths,
    corrections,
    vocabulary,
    nextFocusAr: typeof input.nextFocusAr === 'string' && input.nextFocusAr.trim() ? input.nextFocusAr.trim().slice(0, 220) : null,
    evidence,
  };
}

export async function analyzeSpeakingTranscript(
  env: SpeakingAnalysisEnv,
  input: {
    scenarioId: string;
    scenarioTitleAr: string;
    goalAr: string;
    difficulty: string;
    characterName: string;
    interactionFocus: string[];
    durationSeconds: number;
    transcript: SpeakingTurn[];
    curriculumLevel?: string;
    lessonCode?: string;
    targetLanguageEn?: string[];
    correctionFocusEn?: string[];
    boundariesEn?: string[];
  },
) {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  const model = env.SPEAKING_ANALYSIS_MODEL?.trim() || env.FREE_SPEAK_ANALYSIS_MODEL?.trim() || DEFAULT_ANALYSIS_MODEL;
  const transcript = transcriptText(input.transcript);
  if (!transcript.trim()) throw new Error('Conversation transcript is empty.');
  const targetSkills = input.interactionFocus.slice(0, 18);
  const curriculumScope = input.lessonCode
    ? `\nCURRICULUM LESSON\nLevel: ${input.curriculumLevel || 'A1'}\nLesson: ${input.lessonCode}\nTarget language: ${(input.targetLanguageEn ?? []).join('; ') || 'not supplied'}\nCorrection focus: ${(input.correctionFocusEn ?? []).join('; ') || 'meaning breakdown and current lesson goal only'}\nBoundaries: ${(input.boundariesEn ?? []).join(' | ') || 'stay inside the stated lesson goal'}\n`
    : '';
  const correctionRule = input.lessonCode
    ? '- Corrections: max 2. Correct only meaning breakdowns or errors directly relevant to the curriculum lesson correction focus/target language above. Do not introduce a broader grammar target because you noticed an unrelated clear error.'
    : '- Corrections: max 2, only meaningful grammar/word-choice/natural-phrasing improvements from learner turns. Ignore ASR punctuation/capitalization.';

  const prompt = `You are Englotti's post-scenario English coach.\nAnalyze only the evidence in this voice-conversation transcript.\n\nSCENARIO\nID: ${input.scenarioId}\nTitle: ${input.scenarioTitleAr}\nGoal: ${input.goalAr}\nDifficulty setting: ${input.difficulty}\nPartner: ${input.characterName}\nTarget interaction skills: ${targetSkills.join(', ') || 'none specified'}\nDuration: ${input.durationSeconds} seconds\n${curriculumScope}\nRULES\n- This is evidence collection, not a proficiency test. Never assign CEFR, numeric scores, percentages, mastery, pronunciation, accent, or intonation judgments.\n- Judge only the target interaction skills listed above.\n- demonstrated = clear transcript evidence that the learner performed the behavior.\n- emerging = partial/inconsistent evidence or heavy partner support.\n- not_observed = the transcript does not give enough evidence. Absence is not weakness.\n- learnerExcerpt must be an exact short excerpt from a LEARNER turn or null.\n- Strengths and next focus must be grounded in transcript evidence.\n${correctionRule}\n- Vocabulary: only words/expressions literally present in the transcript. asked_about only when the learner explicitly asked about meaning.\n- Arabic UI text should be concise Egyptian Arabic. English examples remain English.\n\nTRANSCRIPT\n${transcript}`;

  const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      model,
      input: prompt,
      store: false,
      generation_config: { thinking_level: 'minimal', max_output_tokens: 2800 },
      response_format: { type: 'text', mime_type: 'application/json', schema: recapSchema },
    }),
  });
  const payload = await upstream.json().catch(() => null) as {
    status?: string;
    steps?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    output_text?: string;
    error?: { message?: string };
  } | null;
  if (!upstream.ok) throw new Error(payload?.error?.message || `Gemini analysis failed (${upstream.status}).`);
  if (payload?.status && payload.status !== 'completed') throw new Error(`Gemini analysis did not complete (status: ${payload.status}).`);
  const text = interactionText(payload);
  if (!text) throw new Error('Gemini analysis returned an empty response.');
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('Gemini analysis did not return valid JSON.'); }
  return { model, recap: normalizeRecap(parsed, targetSkills) };
}
