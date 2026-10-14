import type { PracticeMissionContract } from '../types';
import type { PracticeCompletionState } from './types';

/** True when the final review never arrived, so an empty list must not read as clean English. */
export function notesIncomplete(review: PracticeCompletionState) {
  return review.diagnostics?.finalReview !== undefined && review.diagnostics.finalReview !== 'received';
}

/** Plain-text support report. Metadata only beyond the saved notes themselves; no tokens or audio. */
export function buildReviewReport(mission: PracticeMissionContract, review: PracticeCompletionState, ar: boolean, reviewConnection: unknown) {
  const issues = review.corrections ?? [];
  const improvements = review.improvements ?? [];
  const trace = review.diagnostics;
  return [
    `Practice: ${mission.level} — ${mission.titleEn}`,
    'Source: Otti Live listening notes, not a verbatim transcript or proficiency score.',
    `Saved corrections: ${issues.length}`,
    `Optional improvements: ${improvements.length}`,
    ...issues.map((issue) => `ERROR — Heard: ${issue.originalEn}\nCorrected: ${issue.betterEn}\nWhy: ${(ar ? issue.feedbackAr : issue.feedbackEn) || '-'}`),
    ...improvements.map((note) => `OPTIONAL — Already-valid: ${note.originalEn}\nAlternative: ${note.betterEn}\nWhy: ${(ar ? note.feedbackAr : note.feedbackEn) || '-'}`),
    'Observed goals: ' + ((review.achievedGoalIds ?? []).join(', ') || 'none'),
    `Final review: ${trace?.finalReview ?? 'unknown'} after ${trace?.finalWaitMs ?? 0} ms`,
    'Notebook: ' + JSON.stringify(trace?.notebook ?? {}),
    'Roleplay connection: ' + JSON.stringify(trace?.transport ?? []),
    'Roleplay timeline (elapsedMs from session start; metadata only):',
    ...(trace?.timeline?.length ? trace.timeline.map((event) => JSON.stringify(event)) : ['No timeline recorded.']),
    'Review connection: ' + JSON.stringify(reviewConnection),
  ].join('\n\n');
}
