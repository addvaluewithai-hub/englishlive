import type { LiveClientTool } from '../live/tools';

export const languageIssueParameters = {
  type: 'OBJECT',
  properties: {
    original_en: { type: 'STRING', description: 'Exact erroneous English actually heard. Do NOT silently correct or normalize the learner words.' },
    better_en: { type: 'STRING', description: 'Correct ONLY the genuine error, retaining the learner meaning.' },
    explanation_ar: { type: 'STRING', description: 'Brief friendly Egyptian Arabic explanation.' },
    explanation_en: { type: 'STRING', description: 'Brief explanation of the actual English error.' },
    beat_id: { type: 'STRING', description: 'Authored goal ID or conversation.' },
    confidence: { type: 'STRING', enum: ['high'], description: 'Use only for clearly heard exact words.' },
  },
  required: ['original_en', 'better_en', 'explanation_ar', 'explanation_en', 'confidence'],
};

export const languageReviewParameters = {
  type: 'OBJECT',
  properties: {
    status: { type: 'STRING', enum: ['issues', 'no_clear_issue', 'uncertain'] },
    issues: { type: 'ARRAY', items: languageIssueParameters,
      description: 'ALL clearly detected errors, including articles/agreement/prepositions. Empty only if none were clearly detected.' },
    reason: { type: 'STRING', description: 'Why no clear issue or why uncertain. Never infer correct grammar from successful communication.' },
  },
  required: ['status', 'issues', 'reason'],
};

/** Audit coverage separately from issue count: an omitted review is not clean English. */
export function createLanguageReviewTracker(record: LiveClientTool['handle']) {
  let checks = 0;
  let missing = 0;
  let noClearIssue = 0;
  let uncertain = 0;
  let finalized = false;
  function accept(value: unknown, final: boolean) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) { missing++; return false; }
    const review = value as Record<string, unknown>;
    if (!['issues', 'no_clear_issue', 'uncertain'].includes(String(review.status)) || !Array.isArray(review.issues) ||
        typeof review.reason !== 'string' || (review.status === 'issues' && !review.issues.length) ||
        (review.status !== 'issues' && (review.issues.length > 0 || !review.reason.trim()))) {
      missing++; return false;
    }
    checks++;
    let incomplete = false;
    for (const issue of review.issues) {
      if (!issue || typeof issue !== 'object' || Array.isArray(issue)) { incomplete = true; continue; }
      const fields = ['original_en', 'better_en', 'explanation_ar', 'explanation_en'];
      if (fields.some((field) => typeof issue[field] !== 'string' || !issue[field].trim()) ||
          issue.confidence !== 'high' || issue.original_en?.toLowerCase() === issue.better_en?.toLowerCase()) incomplete = true;
      record(issue);
    }
    if (review.status === 'no_clear_issue') noClearIssue++;
    if (review.status === 'uncertain') uncertain++;
    if (incomplete) missing++;
    if (final && !incomplete) finalized = true;
    return true;
  }
  return {
    beginFinalReview() { finalized = false; },
    accept, isFinalized: () => finalized,
    snapshot: () => ({ checks, missing, noClearIssue, uncertain, finalized }),
    reset() { checks = 0; missing = 0; noClearIssue = 0; uncertain = 0; finalized = false; },
  };
}
