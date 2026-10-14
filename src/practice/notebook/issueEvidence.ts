import type { PracticeCorrectionRecord } from '../runtime';

/** One clearly heard learner mistake. Shared by the per-turn note and the final review tool. */
export const issueItemSchema = {
  type: 'OBJECT',
  properties: {
    original_en: { type: 'STRING', description: 'The learner exact words as heard, mistake included. Never fix or paraphrase them.' },
    better_en: { type: 'STRING', description: 'The same sentence with ONLY the mistake corrected, keeping the learner meaning.' },
    explanation_ar: { type: 'STRING', description: 'One short friendly Egyptian Arabic sentence explaining the fix.' },
    explanation_en: { type: 'STRING', description: 'One short simple English sentence explaining the fix.' },
  },
  required: ['original_en', 'better_en'],
};

export const issueListSchema = {
  type: 'ARRAY',
  items: issueItemSchema,
  description: 'Every clearly heard learner English mistake, small ones included (articles, verb forms, agreement, prepositions, word order, wrong word). One item per distinct correction.',
};

export type IssueRejection = 'not_object' | 'missing_fields' | 'unchanged' | 'not_confident' | 'repeat';

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const comparable = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, ' ').trim();

export function issueKey(issue: Pick<PracticeCorrectionRecord, 'originalEn' | 'betterEn'>) {
  return `${comparable(issue.originalEn)}→${comparable(issue.betterEn)}`;
}

/**
 * Validate provider arguments into a stored correction. Requires the exact heard words and a
 * different correction; explanations are helpful but optional so a real observed error is not
 * dropped because the model skipped a field. Never synthesises learner words.
 */
export function parseIssue(value: unknown, validBeats: ReadonlySet<string>):
  { ok: true; issue: PracticeCorrectionRecord } | { ok: false; reason: IssueRejection } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, reason: 'not_object' };
  const args = value as Record<string, unknown>;
  const confidence = text(args.confidence, 20).toLowerCase();
  if (confidence && confidence !== 'high') return { ok: false, reason: 'not_confident' };
  const originalEn = text(args.original_en, 220);
  const betterEn = text(args.better_en, 220);
  if (!originalEn || !betterEn) return { ok: false, reason: 'missing_fields' };
  if (comparable(originalEn) === comparable(betterEn)) return { ok: false, reason: 'unchanged' };
  const beat = text(args.beat_id, 80);
  return {
    ok: true,
    issue: {
      beatId: validBeats.has(beat) ? beat : 'conversation',
      originalEn,
      betterEn,
      feedbackAr: text(args.explanation_ar, 260),
      feedbackEn: text(args.explanation_en, 260),
      requiresRetry: false,
    },
  };
}
