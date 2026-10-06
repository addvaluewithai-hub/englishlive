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

export type PracticeTaskStatus = 'fulfilled' | 'incomplete' | 'off_intent' | 'unclear';
export type PracticeLanguageStatus = 'clean' | 'minor_error' | 'important_error' | 'unclear';
export type PracticeFeedbackKind = 'correction' | 'task_redirect' | 'repair';

export type PracticeTurnFeedback = {
  beatId: string;
  kind: PracticeFeedbackKind;
  taskStatus: PracticeTaskStatus;
  languageStatus: PracticeLanguageStatus;
  feedbackAr: string;
  feedbackEn: string;
  betterEn: string | null;
  requiresRetry: boolean;
};

export type PracticeEvaluationTrace = {
  beatId: string;
  taskStatus: PracticeTaskStatus;
  languageStatus: PracticeLanguageStatus;
  reasonEn: string;
  betterEn: string | null;
  requiresRetry: boolean;
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

function createHintRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function usePracticeMissionRuntime(scenarioId?: string) {
  const contract = practiceMissionContractBySlug(scenarioId);
  const firstBeatId = contract?.beats[0]?.id ?? null;
  const [activeBeatId, setActiveBeatId] = useState<string | null>(firstBeatId);
  const activeBeatIdRef = useRef<string | null>(firstBeatId);
  const [supportLevel, setSupportLevel] = useState<PracticeSupportLevel>(0);
  const supportLevelRef = useRef<PracticeSupportLevel>(0);
  const maxSupportRecordedRef = useRef<PracticeSupportLevel>(0);
  const supportSummaryRef = useRef<PracticeSupportSummary>(emptySupportSummary());
  const [hintBundle, setHintBundle] = useState<PracticeHintBundle | null>(null);
  const hintBundleRef = useRef<PracticeHintBundle | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const hintLoadingRef = useRef(false);
  const activeHintRequestIdRef = useRef<string | null>(null);
  const [hintError, setHintError] = useState<string | null>(null);
  const finishAfterClosingRef = useRef(false);
  const finalClosingOutputRef = useRef(false);
  const advanceAuthorizedFromBeatRef = useRef<string | null>(null);
  const [turnFeedback, setTurnFeedback] = useState<PracticeTurnFeedback | null>(null);
  const evaluationTraceRef = useRef<PracticeEvaluationTrace[]>([]);

  function clearCurrentBeatHint() {
    hintBundleRef.current = null;
    setHintBundle(null);
    hintLoadingRef.current = false;
    activeHintRequestIdRef.current = null;
    setHintLoading(false);
    setHintError(null);
    supportLevelRef.current = 0;
    maxSupportRecordedRef.current = 0;
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
    advanceAuthorizedFromBeatRef.current = null;
    setTurnFeedback(null);
    evaluationTraceRef.current = [];
  }

  function evaluateTurn(args: Record<string, unknown>) {
    if (!contract) return { error: 'No authored Practice mission is active.' };
    const current = contract.beats.find((candidate) => candidate.id === activeBeatIdRef.current) ?? null;
    if (!current || current.type === 'ending') {
      return { error: 'There is no active learner-response beat to evaluate.' };
    }

    const beatId = cleanText(args.beat_id, 80);
    if (beatId !== current.id) {
      advanceAuthorizedFromBeatRef.current = null;
      return {
        error: `Practice evaluation is stale: received ${beatId || 'missing'}, current beat is ${current.id}.`,
        active_beat: current.id,
        instruction: 'Evaluate only the latest learner turn for the current authored beat.',
      };
    }

    const taskStatus = cleanText(args.task_status, 40) as PracticeTaskStatus;
    const languageStatus = cleanText(args.language_status, 40) as PracticeLanguageStatus;
    const taskStatuses: PracticeTaskStatus[] = ['fulfilled', 'incomplete', 'off_intent', 'unclear'];
    const languageStatuses: PracticeLanguageStatus[] = ['clean', 'minor_error', 'important_error', 'unclear'];
    if (!taskStatuses.includes(taskStatus) || !languageStatuses.includes(languageStatus)) {
      advanceAuthorizedFromBeatRef.current = null;
      return {
        error: `Invalid Practice evaluation status: task=${taskStatus || 'missing'}, language=${languageStatus || 'missing'}.`,
      };
    }

    const reasonEn = cleanText(args.reason_en, 260);
    const feedbackAr = cleanText(args.feedback_ar, 220);
    const feedbackEn = cleanText(args.feedback_en, 220);
    const betterEn = cleanText(args.better_en, 320);

    const languageNeedsRetry = languageStatus === 'important_error';
    const meaningNeedsRetry = taskStatus === 'unclear' || languageStatus === 'unclear';
    const requiresRetry = languageNeedsRetry || meaningNeedsRetry;
    const taskFulfilled = taskStatus === 'fulfilled';
    const mayAdvance = taskFulfilled && !requiresRetry;

    if ((languageStatus === 'minor_error' || languageStatus === 'important_error') && !betterEn) {
      advanceAuthorizedFromBeatRef.current = null;
      return {
        error: `${languageStatus} requires better_en.`,
        instruction: 'Evaluate again and provide one concise natural learner version in better_en.',
      };
    }

    let feedback: PracticeTurnFeedback | null = null;
    if (languageStatus === 'important_error') {
      feedback = {
        beatId: current.id,
        kind: 'correction',
        taskStatus,
        languageStatus,
        feedbackAr: feedbackAr || 'فيه غلطة مهمة في الإنجليزي هنا. شوف الصياغة الطبيعية وجرّب تاني.',
        feedbackEn: feedbackEn || 'There is an important English error here. Check the natural version and try again.',
        betterEn,
        requiresRetry: true,
      };
    } else if (taskStatus === 'unclear' || languageStatus === 'unclear') {
      feedback = {
        beatId: current.id,
        kind: 'repair',
        taskStatus,
        languageStatus,
        feedbackAr: feedbackAr || 'الكلام مش واضح كفاية للموقف. قوله تاني بشكل أوضح.',
        feedbackEn: feedbackEn || 'That was not clear enough for this situation. Try saying it again more clearly.',
        betterEn: null,
        requiresRetry: true,
      };
    } else if (taskStatus === 'incomplete' || taskStatus === 'off_intent') {
      feedback = {
        beatId: current.id,
        kind: 'task_redirect',
        taskStatus,
        languageStatus,
        feedbackAr: feedbackAr || 'الإنجليزي ممكن يكون مفهوم، لكن لسه المطلوب في الخطوة دي ما اتعملش.',
        feedbackEn: feedbackEn || 'Your English may be understandable, but the current task move is still incomplete.',
        betterEn: null,
        requiresRetry: false,
      };
    } else if (languageStatus === 'minor_error') {
      feedback = {
        beatId: current.id,
        kind: 'correction',
        taskStatus,
        languageStatus,
        feedbackAr: feedbackAr || 'المعنى وصل. دي صياغة أنضف للإنجليزي.',
        feedbackEn: feedbackEn || 'The meaning worked. Here is a cleaner English version.',
        betterEn,
        requiresRetry: false,
      };
    }

    setTurnFeedback(feedback);
    advanceAuthorizedFromBeatRef.current = mayAdvance ? current.id : null;
    evaluationTraceRef.current.push({
      beatId: current.id,
      taskStatus,
      languageStatus,
      reasonEn,
      betterEn: betterEn || null,
      requiresRetry,
    });

    if (mayAdvance) {
      return {
        task_status: taskStatus,
        language_status: languageStatus,
        active_beat: current.id,
        authorized_next: current.next ?? null,
        feedback_shown_in_ui: Boolean(feedback),
        retry_required: false,
        instruction: current.next
          ? feedback
            ? `The UI is already showing the learner feedback. Do NOT read or paraphrase the correction aloud. Call set_practice_beat for ${current.next} and continue the roleplay naturally.`
            : `Call set_practice_beat for ${current.next} and continue the roleplay naturally.`
          : 'The task move is complete. Continue only according to the authored ending.',
      };
    }

    if (requiresRetry) {
      return {
        task_status: taskStatus,
        language_status: languageStatus,
        active_beat: current.id,
        feedback_shown_in_ui: true,
        retry_required: true,
        instruction: `Do NOT advance. Stay on ${current.id}. The UI owns the teaching feedback. Do not say the corrected wording aloud. Give at most one short neutral cue such as "Try that again." and wait for the learner to retry.`,
      };
    }

    return {
      task_status: taskStatus,
      language_status: languageStatus,
      active_beat: current.id,
      feedback_shown_in_ui: Boolean(feedback),
      retry_required: false,
      instruction: `Do NOT advance. Stay on ${current.id}. The UI shows what is still needed. Redirect naturally inside the roleplay without calling correct grammar wrong and without reading UI feedback aloud.`,
    };
  }

  function setBeat(args: Record<string, unknown>) {
    if (!contract) return { error: 'No authored Practice mission is active.' };
    const beatId = typeof args.beat_id === 'string' ? args.beat_id : '';
    const beat = contract.beats.find((candidate) => candidate.id === beatId);
    if (!beat) return { error: `Unknown Practice beat: ${beatId}` };

    const current = contract.beats.find((candidate) => candidate.id === activeBeatIdRef.current) ?? null;
    if (hintLoadingRef.current && current && beat.id !== current.id) {
      return {
        error: `Beat advance rejected while a UI hint request is active: ${current.id} -> ${beat.id}`,
        active_beat: current.id,
        instruction: `Stay on ${current.id}. A hint request is not learner speech and must never advance the mission. Complete the hint tool call and end silently.`,
      };
    }

    const wantsAuthoredAdvance = Boolean(current && beat.id === current.next);
    if (wantsAuthoredAdvance && advanceAuthorizedFromBeatRef.current !== current?.id) {
      return {
        error: `Beat advance rejected until the latest learner turn is evaluated as complete: ${current?.id ?? 'none'} -> ${beat.id}`,
        active_beat: current?.id ?? null,
        instruction: current
          ? `Stay on ${current.id}. First call evaluate_practice_turn for the learner's latest meaningful turn. Advance only when task_status is fulfilled and no retry is required.`
          : 'Return to the first authored beat.',
      };
    }

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
    if (changed) {
      advanceAuthorizedFromBeatRef.current = null;
      clearCurrentBeatHint();
    }

    if (beat.type === 'ending') {
      finishAfterClosingRef.current = true;
      return {
        active_beat: beat.id,
        preferred_realizations: beat.preferredRealizationsEn ?? [],
        instruction: 'Give exactly one short natural closing line. Prefer the reviewed realization when it fits. Ask no new question and do not mention the mission engine.',
      };
    }

    return {
      active_beat: beat.id,
      learner_intent: beat.learnerIntentEn,
      preferred_realizations: beat.preferredRealizationsEn ?? [],
      learner_models_as_examples_not_passwords: beat.learnerModelsEn ?? [],
      instruction: 'Open or continue this beat naturally. Prefer reviewed AI realizations on the normal path. If the learner has not satisfied the intent, stay on this beat.',
    };
  }

  function revealSupport(level: Exclude<PracticeSupportLevel, 0>) {
    const previouslyRecorded = maxSupportRecordedRef.current;
    if (level > previouslyRecorded) {
      const summary = supportSummaryRef.current;
      supportSummaryRef.current = {
        intentHints: summary.intentHints + (previouslyRecorded < 1 && level >= 1 ? 1 : 0),
        usefulLanguageReveals: summary.usefulLanguageReveals + (previouslyRecorded < 2 && level >= 2 ? 1 : 0),
        fullHelpReveals: summary.fullHelpReveals + (previouslyRecorded < 3 && level >= 3 ? 1 : 0),
      };
      maxSupportRecordedRef.current = level;
    }

    const visibleNext = Math.max(supportLevelRef.current, level) as PracticeSupportLevel;
    supportLevelRef.current = visibleNext;
    setSupportLevel(visibleNext);
  }

  function receiveHintBundle(args: Record<string, unknown>) {
    if (!contract) return { error: 'No authored Practice mission is active.' };
    if (!hintLoadingRef.current || !activeHintRequestIdRef.current) {
      return {
        error: 'No active UI Practice hint request. Unsolicited hint bundles are rejected.',
        instruction: 'Do not speak, do not reveal help, and continue only when the learner acts or the UI explicitly requests a hint.',
      };
    }

    const requestId = cleanText(args.request_id, 100);
    if (!requestId || requestId !== activeHintRequestIdRef.current) {
      return {
        error: `Stale or mismatched Practice hint request_id: ${requestId || 'missing'}.`,
        instruction: 'Do not speak and do not retry this old request. Wait for the active UI request.',
      };
    }

    const beatId = cleanText(args.beat_id, 80);
    const currentBeatId = activeBeatIdRef.current;
    if (!beatId || beatId !== currentBeatId) {
      hintLoadingRef.current = false;
      activeHintRequestIdRef.current = null;
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
      activeHintRequestIdRef.current = null;
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
    activeHintRequestIdRef.current = null;
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
        name: 'evaluate_practice_turn',
        description: [
          'Private Practice evaluator. Call exactly once after EVERY meaningful learner turn on a required beat, before replying or changing beats.',
          'Evaluate TWO separate dimensions. task_status asks whether the learner completed the current communicative move. language_status asks whether the English itself is clean, has a clear minor error, has an important error worth retrying, or is too unclear to judge.',
          'Task and language are independent: a learner can fulfil the task with imperfect English, or speak grammatical English that does not fulfil the task.',
          'task_status=fulfilled when the communicative intent is clear enough to continue. Do not require exact canonical wording or perfect recall of scenario facts unless the beat explicitly requires that fact.',
          'task_status=incomplete when part of the current move is still missing. off_intent when the learner answered a different question or pursued the wrong move. unclear when the intended meaning cannot be established.',
          'language_status=clean when no useful correction is needed. minor_error when one clear English error is worth teaching but meaning succeeds; provide better_en and the UI will show it while the conversation continues with no retry.',
          'language_status=important_error when a clear English error materially distorts meaning or a reviewed current-form target; provide better_en and the learner must retry before advancement.',
          'language_status=unclear when the English/transcript is too unclear to evaluate reliably. Never invent corrections from uncertain ASR.',
          'feedback_ar and feedback_en must be short learner-facing explanations. better_en must contain one concise natural learner version only when language_status is minor_error or important_error; otherwise return an empty string.',
          'Never speak the correction yourself. The UI owns correction/teaching feedback. A UI hint request is not a learner turn and must never be evaluated.',
        ].join(' '),
        behavior: 'BLOCKING',
        parameters: {
          type: 'OBJECT',
          properties: {
            beat_id: {
              type: 'STRING',
              enum: contract.beats.filter((beat) => beat.type !== 'ending').map((beat) => beat.id),
              description: 'The current authored learner-response beat.',
            },
            task_status: {
              type: 'STRING',
              enum: ['fulfilled', 'incomplete', 'off_intent', 'unclear'],
              description: 'Whether the latest learner turn completed the current communicative task move.',
            },
            language_status: {
              type: 'STRING',
              enum: ['clean', 'minor_error', 'important_error', 'unclear'],
              description: 'Independent judgement of the learner English in the latest turn.',
            },
            reason_en: {
              type: 'STRING',
              description: 'Short internal QA reason for the two judgements. Never read this aloud.',
            },
            feedback_ar: {
              type: 'STRING',
              description: 'Very short Egyptian-Arabic learner-facing feedback. Empty string when no feedback is needed.',
            },
            feedback_en: {
              type: 'STRING',
              description: 'Very short English learner-facing feedback equivalent. Empty string when no feedback is needed.',
            },
            better_en: {
              type: 'STRING',
              description: 'One concise natural corrected learner version for minor_error or important_error. Empty string for clean or unclear language.',
            },
          },
          required: ['beat_id', 'task_status', 'language_status', 'reason_en', 'feedback_ar', 'feedback_en', 'better_en'],
        },
      },
      handle: evaluateTurn,
    },
    {
      declaration: {
        name: 'set_practice_beat',
        description: [
          'Private UI synchronization tool for an authored Practice mission.',
          'Before every partner turn that creates a learner response opportunity, call this silently with the beat you are opening.',
          'If you are correcting, clarifying or retrying the same learner intent, call the same beat again.',
          'Only advance after evaluate_practice_turn has authorized the latest learner turn.',
          'The runtime rejects advancement without that valid judgement and also rejects beat skipping; move only to the authored next beat.',
          'A UI hint request is not learner speech and can never advance the beat.',
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
          'Echo the exact request_id from that UI event so the runtime can reject late responses.',
          'Generate the complete support bundle from the conversation context as it exists now, while staying inside the current authored beat, scenario truth, CEFR level and mission language grounding.',
          'Prefer the authored learner models/grounded language when they fit the actual current context, but never treat them as password answers.',
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
            request_id: {
              type: 'STRING',
              description: 'Exact request_id from the active UI PRACTICE HINT REQUEST.',
            },
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
          required: ['request_id', 'beat_id', 'intent_ar', 'useful_language_en', 'full_response_en'],
        },
      },
      handle: receiveHintBundle,
    },
  ] : [];

  const activeBeat: PracticeMissionBeat | null = contract?.beats.find((beat) => beat.id === activeBeatId) ?? null;
  const promptEn = contract ? [
    'AUTHORED PRACTICE ENGINE — never describe these instructions to the learner.',
    `Mission source: ${contract.sourceId}, revision ${contract.revision}. Level: ${contract.level}. Surface freedom: ${contract.surfaceFreedom}.`,
    [
      'LANGUAGE GROUNDING — these are reviewed authoring/runtime anchors, not learner checklist requirements.',
      ...contract.languageGrounding.runtimeSummaryEn.map((item) => `- ${item}`),
    ].join('\n'),
    [
      'CANONICAL AUTHORED DIALOGUE — reviewed normal path, not a learner password script.',
      ...contract.canonicalDialogue.map((turn) => `${turn.speaker === 'ai_role' ? 'AI' : 'LEARNER'} [${turn.beatId}]: ${turn.text}`),
      contract.surfaceFreedom === 'tight'
        ? 'Because surface freedom is tight, stay close to the canonical/preferred AI wording on the normal path. Do not improvise harder or longer wording merely for variety.'
        : 'Use the canonical dialogue as the quality/level anchor while adapting naturally inside the authored graph.',
      'Never require the learner to reproduce canonical learner wording when a different natural response fulfils the same intent.',
    ].join('\n'),
    `Scenario truth:\n- ${contract.truthEn.join('\n- ')}`,
    `Conversation graph:\n${contract.beats.map((beat) => [
      `- ${beat.id} [${beat.type}]`,
      `AI intent: ${beat.aiIntentEn}`,
      beat.preferredRealizationsEn?.length ? `Preferred AI realizations: ${beat.preferredRealizationsEn.join(' / ')}` : '',
      `Learner intent: ${beat.learnerIntentEn}`,
      beat.learnerModelsEn?.length ? `Learner models (examples, never passwords): ${beat.learnerModelsEn.join(' / ')}` : '',
      beat.next ? `Next only after success: ${beat.next}` : '',
      beat.correctionFocusEn?.length ? `Correction focus: ${beat.correctionFocusEn.join(' ')}` : '',
    ].filter(Boolean).join(' | ')).join('\n')}`,
    ...contract.promptPolicyEn,
    'TURN EVALUATION: after every meaningful learner turn, before replying or changing beats, call evaluate_practice_turn exactly once. Judge task completion and English quality separately. The UI owns correction/teaching feedback: never read better_en or feedback text aloud. If the tool authorizes advancement, continue naturally. If retry_required is true, stay on the same beat and wait for a retry. Never evaluate UI hint events.',
    'Practice hints are contextual, not authored answer cards. Never volunteer one. When the UI explicitly requests a hint, use the whole conversation so far plus the mission grounding/models and call provide_practice_hint_bundle exactly once with ALL support layers and the same request_id. The UI may reveal those layers later without asking you again.',
  ].join('\n\n') : '';

  function beginHintRequest() {
    const beat = contract?.beats.find((candidate) => candidate.id === activeBeatIdRef.current) ?? null;
    if (!beat || beat.type === 'ending') return null;
    if (hintBundleRef.current?.beatId === beat.id) {
      revealSupport(1);
      return null;
    }
    if (hintLoadingRef.current) return null;
    const requestId = createHintRequestId();
    activeHintRequestIdRef.current = requestId;
    hintLoadingRef.current = true;
    setHintLoading(true);
    setHintError(null);
    return requestId;
  }

  function failHintRequest(message = 'تعذر تجهيز الـHint. جرّب تاني.') {
    if (!hintLoadingRef.current) return;
    hintLoadingRef.current = false;
    activeHintRequestIdRef.current = null;
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

  function dismissTurnFeedback() {
    setTurnFeedback(null);
  }

  function getEvaluationTrace() {
    return evaluationTraceRef.current.map((item) => ({ ...item }));
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
    turnFeedback,
    reset,
    beginHintRequest,
    failHintRequest,
    revealSupport,
    hideSupport,
    getSupportSummary,
    dismissTurnFeedback,
    getEvaluationTrace,
    noteTeacherOutput,
    consumeAutoFinishAfterTurn,
  };
}
