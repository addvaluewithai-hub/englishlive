import { languageIssueParameters, languageReviewParameters, createLanguageReviewTracker } from './languageReview';
import type { LiveClientTool } from '../live/tools';
import type { PracticeCorrectionRecord } from './runtime';
import type { PracticeMissionContract } from './types';

const LIMIT = 240;

function clean(value: unknown, max = LIMIT) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * No recorded audio, no provider STT and no independent coach.
 * Otti reports high-confidence, verbatim learner errors while already listening.
 * Evidence is in-memory only and is never shown during the Live roleplay.
 */
export function createSilentIssueCollector(mission: PracticeMissionContract, onGoalChange?: (observedGoalIds: string[]) => void) {
  const issues: PracticeCorrectionRecord[] = [];
  let rejected = 0;
  let calls = 0;
  const reasons: Record<string, number> = {};
  const reject = (reason: string) => {
    rejected++;
    reasons[reason] = (reasons[reason] ?? 0) + 1;
    return { saved: false };
  };
  const validBeats = new Set(mission.beats.map((beat) => beat.id));
  const allowedGoals = new Set(mission.beats.filter((beat) => beat.type === 'required').map((beat) => beat.id));
  const observedGoals = new Set<string>();

  const tool: LiveClientTool = {
    declaration: {
      name: 'record_language_issue',
      behavior: 'NON_BLOCKING',
      description: 'Privately record ONE clearly heard learner English mistake and its precise correction. Never speak about this call or ask for a retry. Call only at high confidence. If the exact spoken words are uncertain, do not call.',
      parameters: languageIssueParameters,
    },
    handle(args) {
      calls++;
      const originalEn = clean(args.original_en, 220);
      const betterEn = clean(args.better_en, 220);
      const feedbackAr = clean(args.explanation_ar, 260);
      const feedbackEn = clean(args.explanation_en, 260);
      const confidence = clean(args.confidence, 20).toLowerCase();
      const beat = clean(args.beat_id, 80);
      const beatId = validBeats.has(beat) ? beat : 'conversation';
      const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();
      const key = normalize(originalEn) + '→' + normalize(betterEn);
      if (confidence !== 'high') return reject('confidence');
      if (!originalEn || !betterEn || !feedbackAr || !feedbackEn) return reject('missing_fields');
      if (originalEn.toLowerCase() === betterEn.toLowerCase()) return reject('unchanged');
      if (issues.some((entry) => normalize(entry.originalEn) + '→' + normalize(entry.betterEn) === key)) {
        return reject('repeat');
      }
      issues.push({ beatId, originalEn, betterEn, feedbackAr, feedbackEn, requiresRetry: false });
      return { saved: true };
    },
  };

  const languageReview = createLanguageReviewTracker(tool.handle);

  // Observations are informational only. They must NEVER gate the next Otti
  // reply, force a retry, or imply mastery from one successful exchange.
  const progressTool: LiveClientTool = {
    declaration: {
      name: 'record_practice_progress',
      behavior: 'NON_BLOCKING',
      description: 'Silently record EVERY actual learner turn: first check the exact English for errors (do not normalize it), then note authored goals. Successful communication does NOT imply correct grammar. Include language_review even if goal_ids is empty or all goals were previously noted. Never announce these notes or wait for the result. On PRIVATE_FINISH_NOTES, audit actual heard language and set final_review true.',
      parameters: {
        type: 'OBJECT',
        properties: {
          language_review: languageReviewParameters,
          final_review: { type: 'BOOLEAN', description: 'True ONLY in response to PRIVATE_FINISH_NOTES from the app.' },
          goal_ids: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: 'Zero or more exact goal IDs from the current authored mission, ONLY if the learner actually demonstrated them.',
          },
        },
        required: ['language_review', 'goal_ids'],
      },
    },
    handle(args) {
      const languageSaved = languageReview.accept(args.language_review, args.final_review === true);
      if (!Array.isArray(args.goal_ids)) return { saved: false, count: 0 };
      const ids = args.goal_ids.slice(0, 12).filter((id): id is string => typeof id === 'string');
      let newlyObserved = 0;
      for (const id of ids) {
        if (!allowedGoals.has(id) || observedGoals.has(id)) continue;
        observedGoals.add(id);
        newlyObserved++;
      }
      if (newlyObserved) onGoalChange?.([...observedGoals]);
      return { saved: newlyObserved > 0 || languageSaved, count: newlyObserved };
    },
  };

  return {
    tool,
    progressTool,
    getIssues: () => issues.map((issue) => ({ ...issue })),
    getObservedGoalIds: () => [...observedGoals],
    getRejectedCount: () => rejected,
    getDiagnostics: () => ({ calls, saved: issues.length, rejected, reasons: { ...reasons }, languageReviews: languageReview.snapshot() }),
    isFinalized: languageReview.isFinalized,
    beginFinalReview: languageReview.beginFinalReview,
    clear() { issues.length = 0; languageReview.reset(); observedGoals.clear(); rejected = 0; calls = 0; for (const key of Object.keys(reasons)) delete reasons[key]; onGoalChange?.([]); },
  };
}
