import type { LiveClientTool } from '../live/tools';
import type { PracticeCorrectionRecord } from './runtime';
import type { PracticeMissionContract } from './types';

const MAX_ISSUES = 12;
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
  const validBeats = new Set(mission.beats.map((beat) => beat.id));
  const allowedGoals = new Set(mission.beats.filter((beat) => beat.type === 'required').map((beat) => beat.id));
  const observedGoals = new Set<string>();

  const tool: LiveClientTool = {
    declaration: {
      name: 'record_language_issue',
      behavior: 'NON_BLOCKING',
      description: 'Privately record ONE clearly heard learner English mistake and its precise correction. Never speak about this call or ask for a retry. Call only at high confidence. If the exact spoken words are uncertain, do not call.',
      parameters: {
        type: 'OBJECT',
        properties: {
          original_en: { type: 'STRING', description: 'EXACT learner words as heard, including their real errors, never a paraphrase.' },
          better_en: { type: 'STRING', description: 'Concise natural corrected form, preserving intended meaning.' },
          explanation_ar: { type: 'STRING', description: 'One short, learner-friendly Arabic explanation.' },
          explanation_en: { type: 'STRING', description: 'One short English explanation of the actual error.' },
          beat_id: { type: 'STRING', description: 'Matching authored mission beat ID, or conversation.' },
          confidence: { type: 'STRING', description: 'Set to high only when exact learner wording is clearly audible; otherwise do not call.' },
        },
        required: ['original_en', 'better_en', 'explanation_ar', 'explanation_en', 'confidence'],
      },
    },
    handle(args) {
      const originalEn = clean(args.original_en, 220);
      const betterEn = clean(args.better_en, 220);
      const feedbackAr = clean(args.explanation_ar, 260);
      const feedbackEn = clean(args.explanation_en, 260);
      const confidence = clean(args.confidence, 20).toLowerCase();
      const beat = clean(args.beat_id, 80);
      const beatId = validBeats.has(beat) ? beat : 'conversation';
      const key = originalEn.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (confidence !== 'high' || !originalEn || !betterEn || !feedbackAr || !feedbackEn ||
          originalEn.toLowerCase() === betterEn.toLowerCase() || !key || issues.length >= MAX_ISSUES ||
          issues.some((entry) => entry.originalEn.toLowerCase().replace(/[^a-z0-9]+/g, '') === key)) {
        rejected++;
        return { saved: false };
      }
      issues.push({ beatId, originalEn, betterEn, feedbackAr, feedbackEn, requiresRetry: false });
      return { saved: true };
    },
  };

  // Observations are informational only. They must NEVER gate the next Otti
  // reply, force a retry, or imply mastery from one successful exchange.
  const progressTool: LiveClientTool = {
    declaration: {
      name: 'record_practice_progress',
      behavior: 'NON_BLOCKING',
      description: 'Privately mark one or several authored speaking opportunities clearly demonstrated by the LEARNER in the current live conversation. Never announce these notes, impose order, or delay your next reply. Do not infer a goal from the staff question alone.',
      parameters: {
        type: 'OBJECT',
        properties: {
          goal_ids: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: 'One or more exact goal IDs from the current authored mission, ONLY if the learner actually demonstrated them.',
          },
        },
        required: ['goal_ids'],
      },
    },
    handle(args) {
      if (!Array.isArray(args.goal_ids)) return { saved: false, count: 0 };
      const ids = args.goal_ids.slice(0, 12).filter((id): id is string => typeof id === 'string');
      let newlyObserved = 0;
      for (const id of ids) {
        if (!allowedGoals.has(id) || observedGoals.has(id)) continue;
        observedGoals.add(id);
        newlyObserved++;
      }
      if (newlyObserved) onGoalChange?.([...observedGoals]);
      return { saved: newlyObserved > 0, count: newlyObserved };
    },
  };

  return {
    tool,
    progressTool,
    getIssues: () => issues.map((issue) => ({ ...issue })),
    getObservedGoalIds: () => [...observedGoals],
    getRejectedCount: () => rejected,
    clear() { issues.length = 0; observedGoals.clear(); rejected = 0; onGoalChange?.([]); },
  };
}
