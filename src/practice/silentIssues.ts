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
export function createSilentIssueCollector(mission: PracticeMissionContract) {
  const issues: PracticeCorrectionRecord[] = [];
  let rejected = 0;
  const validBeats = new Set(mission.beats.map((beat) => beat.id));

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

  return {
    tool,
    getIssues: () => issues.map((issue) => ({ ...issue })),
    getRejectedCount: () => rejected,
    clear() { issues.length = 0; rejected = 0; },
  };
}
