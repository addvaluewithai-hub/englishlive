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

const emptySupportSummary = (): PracticeSupportSummary => ({
  intentHints: 0,
  usefulLanguageReveals: 0,
  fullHelpReveals: 0,
});

export function usePracticeMissionRuntime(scenarioId?: string) {
  const contract = practiceMissionContractBySlug(scenarioId);
  const firstBeatId = contract?.beats[0]?.id ?? null;
  const [activeBeatId, setActiveBeatId] = useState<string | null>(firstBeatId);
  const activeBeatIdRef = useRef<string | null>(firstBeatId);
  const [supportLevel, setSupportLevel] = useState<PracticeSupportLevel>(0);
  const supportLevelRef = useRef<PracticeSupportLevel>(0);
  const supportSummaryRef = useRef<PracticeSupportSummary>(emptySupportSummary());
  const finishAfterClosingRef = useRef(false);
  const finalClosingOutputRef = useRef(false);

  function reset() {
    const next = contract?.beats[0]?.id ?? null;
    activeBeatIdRef.current = next;
    setActiveBeatId(next);
    supportLevelRef.current = 0;
    setSupportLevel(0);
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
    if (changed) {
      supportLevelRef.current = 0;
      setSupportLevel(0);
    }

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

  const tools: LiveClientTool[] = contract ? [{
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
  }] : [];

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
    'The visible hint ladder is controlled by the learner in the UI. Hint examples are support, never password answers.',
  ].join('\n\n') : '';

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
    reset,
    revealSupport,
    hideSupport,
    getSupportSummary,
    noteTeacherOutput,
    consumeAutoFinishAfterTurn,
  };
}
