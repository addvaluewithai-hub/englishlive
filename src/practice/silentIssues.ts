import type { LiveClientTool } from '../live/tools';
import { issueKey, issueListSchema, parseIssue } from './notebook/issueEvidence';
import type { PracticeCorrectionRecord } from './runtime';
import type { PracticeMissionContract } from './types';

export const FINAL_REVIEW_TOOL = 'submit_final_review';
export const PROGRESS_TOOL = 'record_practice_progress';
export type FinalReviewStatus = 'issues' | 'no_clear_issue' | 'uncertain' | 'invalid';

export type NotebookDiagnostics = {
  turnNotes: number;
  finalReviewCalls: number;
  finalStatus: FinalReviewStatus | null;
  saved: number;
  fromTurns: number;
  fromFinal: number;
  rejected: number;
  reasons: Record<string, number>;
};

/**
 * Otti's private notebook for one roleplay. Nothing is recorded from the microphone here:
 * the Live model reports what it heard through two tools. Per-turn notes are a bonus;
 * the final review, requested once the roleplay ends, is the primary capture path because
 * the model is no longer splitting attention between acting and note-taking.
 */
export function createSilentIssueCollector(mission: PracticeMissionContract, onGoalChange?: (observedGoalIds: string[]) => void) {
  const validBeats = new Set(mission.beats.map((beat) => beat.id));
  const allowedGoals = new Set(mission.beats.filter((beat) => beat.type === 'required').map((beat) => beat.id));
  const issues: PracticeCorrectionRecord[] = [];
  const keys = new Set<string>();
  const observedGoals = new Set<string>();
  let counts = { turnNotes: 0, finalReviewCalls: 0, fromTurns: 0, fromFinal: 0, rejected: 0 };
  let reasons: Record<string, number> = {};
  let finalStatus: FinalReviewStatus | null = null;
  let finalRequested = false;
  let finalized = false;

  function record(list: unknown, source: 'fromTurns' | 'fromFinal') {
    let saved = 0;
    for (const value of Array.isArray(list) ? list.slice(0, 40) : []) {
      const parsed = parseIssue(value, validBeats);
      const reason = !parsed.ok ? parsed.reason : keys.has(issueKey(parsed.issue)) ? 'repeat' : null;
      if (reason || !parsed.ok) {
        counts.rejected++;
        reasons[reason ?? 'invalid'] = (reasons[reason ?? 'invalid'] ?? 0) + 1;
        continue;
      }
      keys.add(issueKey(parsed.issue));
      issues.push(parsed.issue);
      counts[source]++;
      saved++;
    }
    return saved;
  }

  // Goals are informational only. They never gate Otti's reply or imply mastery.
  const progressTool: LiveClientTool = {
    declaration: {
      name: PROGRESS_TOOL,
      behavior: 'NON_BLOCKING',
      description: 'Private notebook. After each learner turn, record clearly heard English mistakes and goals. For each issue explain WHY in Egyptian Arabic and simple English, stating the rule, not just the corrected phrase. Never mention it aloud or wait for it.',
      parameters: {
        type: 'OBJECT',
        properties: {
          goal_ids: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Authored goal IDs the learner actually demonstrated. Empty is fine.' },
          issues: issueListSchema,
        },
        required: ['goal_ids'],
      },
    },
    handle(args) {
      counts.turnNotes++;
      const saved = record(args.issues, 'fromTurns');
      let newGoals = 0;
      for (const id of Array.isArray(args.goal_ids) ? args.goal_ids.slice(0, 12) : []) {
        if (typeof id !== 'string' || !allowedGoals.has(id) || observedGoals.has(id)) continue;
        observedGoals.add(id);
        newGoals++;
      }
      if (newGoals) onGoalChange?.([...observedGoals]);
      return { saved: saved > 0 || newGoals > 0, issues: saved, goals: newGoals };
    },
  };

  const finalReviewTool: LiveClientTool = {
    declaration: {
      name: FINAL_REVIEW_TOOL,
      behavior: 'NON_BLOCKING',
      description: 'Call exactly once for PRIVATE_FINISH_NOTES. Return EVERY clearly heard learner mistake with exact original, corrected sentence and specific WHY/rule in Egyptian Arabic and English. Include small mistakes and ones already noted.',
      parameters: {
        type: 'OBJECT',
        properties: {
          status: { type: 'STRING', enum: ['issues', 'no_clear_issue', 'uncertain'], description: 'issues if any mistake was clearly heard; no_clear_issue only if the learner English was clearly correct; uncertain if you could not hear it well.' },
          issues: issueListSchema,
        },
        required: ['status', 'issues'],
      },
    },
    handle(args) {
      counts.finalReviewCalls++;
      const saved = record(args.issues, 'fromFinal');
      const status = String(args.status);
      finalStatus = status === 'issues' || status === 'no_clear_issue' || status === 'uncertain' ? status : 'invalid';
      if (finalRequested) finalized = true;
      return { saved: true, issues: saved };
    },
  };

  return {
    progressTool,
    finalReviewTool,
    tools: [progressTool, finalReviewTool] as LiveClientTool[],
    getIssues: () => issues.map((issue) => ({ ...issue })),
    getObservedGoalIds: () => [...observedGoals],
    getDiagnostics: (): NotebookDiagnostics => ({ ...counts, finalStatus, saved: issues.length, reasons: { ...reasons } }),
    beginFinalReview() { finalRequested = true; finalized = false; },
    isFinalized: () => finalized,
    clear() {
      issues.length = 0; keys.clear(); observedGoals.clear();
      counts = { turnNotes: 0, finalReviewCalls: 0, fromTurns: 0, fromFinal: 0, rejected: 0 };
      reasons = {}; finalStatus = null; finalRequested = false; finalized = false;
      onGoalChange?.([]);
    },
  };
}
