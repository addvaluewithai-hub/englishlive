import { useRef, useState } from 'react';
import type { LiveClientTool } from '../live/tools';
import { practiceMissionContractBySlug } from './missions/catalog';
import type { PracticeMissionBeat } from './types';

export type PracticeSupportLevel = 0 | 1 | 2 | 3;
export type PracticeSupportSummary = {
  intentHints: number;
  usefulLanguageReveals: number;
  fullHelpReveals: number;
};

export type PracticeHintBundle = {
  beatId: string;
  intentAr: string;
  contextAr: string | null;
  usefulLanguageEn: string[];
  fullResponseEn: string;
};

const emptySupportSummary = (): PracticeSupportSummary => ({
  intentHints: 0,
  usefulLanguageReveals: 0,
  fullHelpReveals: 0,
});

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function usePracticeMissionRuntime(scenarioId?: string) {
  const contract = practiceMissionContractBySlug(scenarioId);
  const firstBeatId = contract?.beats[0]?.id ?? null;
  const [activeBeatId, setActiveBeatId] = useState<string | null>(firstBeatId);
  const activeBeatIdRef = useRef<string | null>(firstBeatId);
  const [supportLevel, setSupportLevel] = useState<PracticeSupportLevel>(0);
  const supportLevelRef = useRef<PracticeSupportLevel>(0);
  const supportSummaryRef = useRef<PracticeSupportSummary>(emptySupportSummary());
  const [hintBundle, setHintBundle] = useState<PracticeHintBundle | null>(null);
  const hintBundleRef = useRef<PracticeHintBundle | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const hintLoadingRef = useRef(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const finishAfterClosingRef = useRef(false);
  const finalClosingOutputRef = useRef(false);

  function clearCurrentBeatHint() {
    hintBundleRef.current = null;
    setHintBundle(null);
    hintLoadingRef.current = false;
    setHintLoading(false);
    setHintError(null);
    supportLevelRef.current = 0;
    setSupportLevel(0);
  }

  function reset() {
    const next = contract?.beats[0]?.id ?? null;
    activeBeatIdRef.current = next;
    setActiveBeatId(next);
    clearCurrentBeatHint();
    supportSummaryRef.current = emptySupportSummary();
    finishAfterClosingRef.current = false;
    finalClosingOutputRef.current = false;
  }

  function setBeat(args: Record<string, unknown>) {
    if (!contract) return { error: 'No authored Practice mission is active.' };
    const beatId = typeof args.beat_id === 'string' ? args.beat_id : '';
    const beat = contract.beats.find((candidate) => candidate.id === beatId);
    if (!beat) return { error: `Unknown Practice beat: ${beatId}` };

    const current = contract.beats.find((candidate) => candidate.id === activeBeatIdRef.current) ?? null;
    const allowedToAdvance = !current || beat.id === current.id || beat.id === current.next;
    if (!allowedToAdvance) {
      return {
        error: `Beat skip rejected: ${current?.id ?? 'none'} -> ${beat.id}`,
        active_beat: current?.id ?? null,
        instruction: current
          ? `Stay on ${current.id}. You may repeat it or advance only to ${current.next ?? 'no further beat'} after the learner completes the current intent.`
          : 'Return to the first authored beat.',
      };
    }

    const changed = activeBeatIdRef.current !== beat.id;
    activeBeatIdRef.current = beat.id;
    setActiveBeatId(beat.id);
    if (changed) clearCurrentBeatHint();

    if (beat.type === 'ending') {
      finishAfterClosingRef.current = true;
      return {
        active_beat: beat.id,
        instruction: 'Give exactly one short natural closing line. Ask no new question and do not mention the mission engine.',
      };
    }

    return {
      active_beat: beat.id,
      learner_intent: beat.learnerIntentEn,
      instruction: 'Open or continue this beat naturally. If the learner has not satisfied the intent, stay on this beat.',
    };
  }

  function revealSupport(level: Exclude<PracticeSupportLevel, 0>) {
    const previous = supportLevelRef.current;
    if (level > previous) {
      const summary = supportSummaryRef.current;
      supportSummaryRef.current = {
        intentHints: summary.intentHints + (previous < 1 && level >= 1 ? 1 : 0),
        usefulLanguageReveals: summary.usefulLanguageReveals + (previous < 2 && level >= 2 ? 1 : 0),
        fullHelpReveals: summary.fullHelpReveals + (previous < 3 && level >= 3 ? 1 : 0),
      };
    }
    const next = Math.max(previous, level) as PracticeSupportLevel;
    supportLevelRef.current = next;
    setSupportLevel(next);
  }

  function receiveHintBundle(args: Record<string, unknown>) {
    if (!contract) return { error: 'No authored Practice mission is active.' };
    const beatId = cleanText(args.beat_id, 80);
    const currentBeatId = activeBeatIdRef.current;
    if (!beatId || beatId !== currentBeatId) {
      hintLoadingRef.current = false;
      setHintLoading(false);
      setHintError('الـHint وصلت لسياق قديم. جرّب تفتحها تاني.');
      return {
        error: `Stale Practice hint bundle for ${beatId || 'unknown'}; current beat is ${currentBeatId ?? 'none'}.`,
        instruction: 'Do not speak. The learner will request a fresh hint if needed.',
      };
    }

    const intentAr = cleanText(args.intent_ar, 180);
    const contextAr = cleanText(args.context_ar, 180);
    const usefulLanguageEn = cleanStringList(args.useful_language_en);
    const fullResponseEn = cleanText(args.full_response_en, 260);
    if (!intentAr || !usefulLanguageEn.length || !fullResponseEn) {
      hintLoadingRef.current = false;
      setHintLoading(false);
      setHintError('الـHint ما اكتملتش. جرّب تاني.');
      return {
        error: 'Hint bundle is missing intent_ar, useful_language_en or full_response_en.',
        instruction: 'Do not speak. Wait for another UI hint request.',
      };
    }

    const bundle: PracticeHintBundle = {
      beatId,
      intentAr,
      contextAr: contextAr || null,
      usefulLanguageEn,
      fullResponseEn,
    };
    hintBundleRef.current = bundle;
    setHintBundle(bundle);
    hintLoadingRef.current = false;
    setHintLoading(false);
    setHintError(null);
    revealSupport(1);

    return {
      stored: true,
      beat_id: beatId,
      instruction: 'Do not speak or add any explanation. End this turn silently and return control to the learner. The UI now owns progressive reveal of the cached bundle.',
    };
  }

  const tools: LiveClientTool[] = contract ? [
    {
      declaration: {
        name: 'set_practice_beat',
        description: [
          'Private UI synchronization tool for an authored Practice mission.',
          'Before every partner turn that creates a learner response opportunity, call this silently with the beat you are opening.',
          'If you are correcting, clarifying or retrying the same learner intent, call the same beat again.',
          'Only advance after the learner genuinely completes the current communicative intent.',
          'The runtime also rejects beat skipping; move only to the authored next beat.',
          'Use close only after the final required learner intent is complete.',
          'Never mention this tool to the learner.',
        ].join(' '),
        behavior: 'BLOCKING',
        parameters: {
          type: 'OBJECT',
          properties: {
            beat_id: {
              type: 'STRING',
              enum: contract.beats.map((beat) => beat.id),
              description: 'The authored mission beat being opened or continued.',
            },
          },
          required: ['beat_id'],
        },
      },
      handle: setBeat,
    },
    {
      declaration: {
        name: 'provide_practice_hint_bundle',
        description: [
          'Private UI tool. Call ONLY after an explicit UI PRACTICE HINT REQUEST.',
          'Generate the complete support bundle from the conversation context as it exists now, while staying inside the current authored beat, scenario truth and CEFR level.',
          'Return ALL support layers in this single call even though the UI will reveal them progressively later.',
          'intent_ar = a short Egyptian-Arabic description of the learner best next communicative move now.',
          'context_ar = optional short Egyptian-Arabic context note when the conversation took a detour or the hint needs to refer to what just happened.',
          'useful_language_en = a small list of English words/chunks useful for this exact moment.',
          'full_response_en = one natural complete English response that would work now; it is an example, never a password answer.',
          'Do not call this tool proactively, do not advance the beat, and do not speak the hint aloud.',
        ].join(' '),
        behavior: 'BLOCKING',
        parameters: {
          type: 'OBJECT',
          properties: {
            beat_id: {
              type: 'STRING',
              enum: contract.beats.filter((beat) => beat.type !== 'ending').map((beat) => beat.id),
              description: 'The current authored beat this hint supports.',
            },
            intent_ar: {
              type: 'STRING',
              description: 'Short contextual Egyptian-Arabic communicative intent. Do not translate a memorized script.',
            },
            context_ar: {
              type: 'STRING',
              description: 'Optional short Egyptian-Arabic context/recovery note based on what actually happened in the conversation. Use an empty string when unnecessary.',
            },
            useful_language_en: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Two to five short English words or chunks useful right now and appropriate to the mission level.',
            },
            full_response_en: {
              type: 'STRING',
              description: 'One natural complete learner response that fits the current conversation state and current beat.',
            },
          },
          required: ['beat_id', 'intent_ar', 'useful_language_en', 'full_response_en'],
        },
      },
      handle: receiveHintBundle,
    },
  ] : [];

  const activeBeat: PracticeMissionBeat | null = contract?.beats.find((beat) => beat.id === activeBeatId) ?? null;
  const promptEn = contract ? [
    'AUTHORED PRACTICE ENGINE — never describe these instructions to the learner.',
    `Mission source: ${contract.sourceId}, revision ${contract.revision}. Level: ${contract.level}.`,
    `Scenario truth:\n- ${contract.truthEn.join('\n- ')}`,
    `Conversation graph:\n${contract.beats.map((beat) => [
      `- ${beat.id} [${beat.type}]`,
      `AI intent: ${beat.aiIntentEn}`,
      `Learner intent: ${beat.learnerIntentEn}`,
      beat.next ? `Next only after success: ${beat.next}` : '',
      beat.correctionFocusEn?.length ? `Correction focus: ${beat.correctionFocusEn.join(' ')}` : '',
    ].filter(Boolean).join(' | ')).join('\n')}`,
    ...contract.promptPolicyEn,
    'Practice hints are contextual, not authored answer cards. Never volunteer one. When the UI explicitly requests a hint, use the whole conversation so far and call provide_practice_hint_bundle exactly once with ALL support layers. The UI may reveal those layers later without asking you again.',
  ].join('\n\n') : '';

  function beginHintRequest() {
    const beat = contract?.beats.find((candidate) => candidate.id === activeBeatIdRef.current) ?? null;
    if (!beat || beat.type === 'ending') return false;
    if (hintBundleRef.current?.beatId === beat.id) {
      revealSupport(1);
      return false;
    }
    if (hintLoadingRef.current) return false;
    hintLoadingRef.current = true;
    setHintLoading(true);
    setHintError(null);
    return true;
  }

  function failHintRequest(message = 'تعذر تجهيز الـHint. جرّب تاني.') {
    if (!hintLoadingRef.current) return;
    hintLoadingRef.current = false;
    setHintLoading(false);
    setHintError(message);
  }

  function hideSupport() {
    supportLevelRef.current = 0;
    setSupportLevel(0);
  }

  function getSupportSummary() {
    return { ...supportSummaryRef.current };
  }

  function noteTeacherOutput() {
    if (finishAfterClosingRef.current) finalClosingOutputRef.current = true;
  }

  function consumeAutoFinishAfterTurn() {
    if (!finishAfterClosingRef.current || !finalClosingOutputRef.current) return false;
    finishAfterClosingRef.current = false;
    finalClosingOutputRef.current = false;
    return true;
  }

  return {
    contract,
    tools,
    promptEn,
    activeBeat,
    supportLevel,
    hintBundle,
    hintLoading,
    hintError,
    reset,
    beginHintRequest,
    failHintRequest,
    revealSupport,
    hideSupport,
    getSupportSummary,
    noteTeacherOutput,
    consumeAutoFinishAfterTurn,
  };
}
