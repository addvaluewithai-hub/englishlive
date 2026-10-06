import { useEffect, useRef, useState } from 'react';
import { practiceMissionContractBySlug } from './missions/catalog';
import { requestPracticeCoach } from './coachClient';
import { buildConversationPracticePrompt } from './conversationPrompt';
import type { CoachResult, ConversationTurn } from './conversationTypes';
import type { PracticeCorrectionRecord, PracticeEvaluationTrace, PracticeHintBundle, PracticeSupportLevel, PracticeSupportSummary, PracticeTurnFeedback } from './runtime';

export function useConversationPracticeRuntime(slug?: string) {
  const contract = practiceMissionContractBySlug(slug);
  const goals = contract?.beats.filter((beat) => beat.type !== 'ending') ?? [];
  const [achievedGoalIds, setAchievedGoalIds] = useState<string[]>([]);
  const achievedRef = useRef(new Set<string>());
  const [corrections, setCorrections] = useState<PracticeCorrectionRecord[]>([]);
  const correctionsRef = useRef<PracticeCorrectionRecord[]>([]);
  const traceRef = useRef<PracticeEvaluationTrace[]>([]);
  const [turnFeedback, setTurnFeedback] = useState<PracticeTurnFeedback | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachError, setCoachError] = useState(false);
  const [hintBundle, setHintBundle] = useState<PracticeHintBundle | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [supportLevel, setSupportLevel] = useState<PracticeSupportLevel>(0);
  const supportRef = useRef<PracticeSupportSummary>({ intentHints: 0, usefulLanguageReveals: 0, fullHelpReveals: 0 });
  const supportMax = useRef(0);
  const contextVersion = useRef(0);
  const generation = useRef(0);
  const reviewAbort = useRef<AbortController | null>(null);
  const hintAbort = useRef<AbortController | null>(null);
  const pending = useRef<ConversationTurn[] | null>(null);
  const reviewedIds = useRef(new Set<string>());
  // Hint layers belong to the current dialogue, not a changing progress gate.
  const activeBeat = goals[0] ?? null;

  function invalidateHint() {
    contextVersion.current++;
    hintAbort.current?.abort();
    hintAbort.current = null;
    setHintLoading(false);
    setHintBundle(null);
    setSupportLevel(0);
    supportMax.current = 0;
  }

  function reset() {
    generation.current++;
    reviewAbort.current?.abort();
    reviewAbort.current = null;
    pending.current = null;
    reviewedIds.current.clear();
    achievedRef.current.clear();
    correctionsRef.current = [];
    traceRef.current = [];
    supportRef.current = { intentHints: 0, usefulLanguageReveals: 0, fullHelpReveals: 0 };
    setAchievedGoalIds([]);
    setCorrections([]);
    setTurnFeedback(null);
    setCoachBusy(false);
    setCoachError(false);
    setHintError(null);
    invalidateHint();
  }

  function applyReview(result: CoachResult) {
    for (const id of result.achievedGoalIds) achievedRef.current.add(id);
    setAchievedGoalIds([...achievedRef.current]);
    for (const correction of result.corrections) {
      if (!correctionsRef.current.some((old) => old.originalEn === correction.originalEn && old.betterEn === correction.betterEn)) correctionsRef.current.push(correction);
    }
    setCorrections([...correctionsRef.current]);
    const correction = result.corrections[0];
    if (correction) setTurnFeedback({ ...correction, kind: 'correction', taskStatus: result.achievedGoalIds.length ? 'fulfilled' : 'incomplete', languageStatus: result.languageStatus });
    traceRef.current.push({ beatId: correction?.beatId || 'conversation', taskStatus: result.achievedGoalIds.length ? 'fulfilled' : 'incomplete', languageStatus: result.languageStatus,
      reasonEn: `Background coach for ${result.turnId}; observed goals: ${result.achievedGoalIds.join(', ') || 'none yet'}.`,
      originalEn: correction?.originalEn || null, betterEn: correction?.betterEn || null, requiresRetry: false });
  }

  async function reviewTurn(transcript: ConversationTurn[]) {
    if (!contract) return;
    const last = transcript.at(-1);
    if (!last || last.speaker !== 'learner' || reviewedIds.current.has(last.id)) return;
    // Keep voice independent. Coalesce a slow coach's backlog; the final recap reviews all turns.
    if (reviewAbort.current) { pending.current = transcript; return; }
    reviewedIds.current.add(last.id);
    const session = generation.current;
    const abort = new AbortController();
    reviewAbort.current = abort;
    setCoachBusy(true);
    try {
      const result = await requestPracticeCoach({ missionSlug: contract.slug, mode: 'turn', turnId: last.id, transcript: transcript.slice(-24) }, abort.signal);
      if (session !== generation.current || abort.signal.aborted || result.turnId !== last.id) return;
      applyReview(result);
      setCoachError(false);
    } catch {
      if (session === generation.current && !abort.signal.aborted) setCoachError(true);
    } finally {
      if (session === generation.current) {
        reviewAbort.current = null;
        setCoachBusy(false);
        const next = pending.current;
        pending.current = null;
        if (next) void reviewTurn(next);
      }
    }
  }

  function revealSupport(level: Exclude<PracticeSupportLevel, 0>) {
    if (level > supportMax.current) {
      if (supportMax.current < 1) supportRef.current.intentHints++;
      if (supportMax.current < 2 && level >= 2) supportRef.current.usefulLanguageReveals++;
      if (supportMax.current < 3 && level >= 3) supportRef.current.fullHelpReveals++;
      supportMax.current = level;
    }
    setSupportLevel((current) => Math.max(current, level) as PracticeSupportLevel);
  }

  async function requestHint(transcript: ConversationTurn[]) {
    if (!contract || !activeBeat || hintAbort.current) return;
    if (hintBundle) { revealSupport(1); return; }
    const version = contextVersion.current;
    const abort = new AbortController();
    hintAbort.current = abort;
    setHintLoading(true);
    setHintError(null);
    try {
      const result = await requestPracticeCoach({ missionSlug: contract.slug, mode: 'hint', turnId: `hint-${version}`, transcript: transcript.slice(-24) }, abort.signal);
      if (abort.signal.aborted || version !== contextVersion.current) return;
      if (!result.hint) throw new Error('Empty hint.');
      setHintBundle({ ...result.hint, beatId: activeBeat.id });
      revealSupport(1);
    } catch {
      if (!abort.signal.aborted && version === contextVersion.current) setHintError('المساعدة مش متاحة دلوقتي. جرّب تاني.');
    } finally {
      if (hintAbort.current === abort) { hintAbort.current = null; setHintLoading(false); }
    }
  }

  useEffect(() => () => {
    generation.current++;
    reviewAbort.current?.abort();
    hintAbort.current?.abort();
  }, []);

  return {
    contract, activeBeat, goals, achievedGoalIds, corrections, coachBusy, coachError, turnFeedback,
    hintBundle, hintLoading, hintError, supportLevel, reset, requestHint, revealSupport,
    hideSupport: () => setSupportLevel(0), invalidateHint, reviewTurn,
    dismissTurnFeedback: () => setTurnFeedback(null),
    getSupportSummary: () => ({ ...supportRef.current }),
    getCorrectionSummary: () => correctionsRef.current.map((item) => ({ ...item })),
    getEvaluationTrace: () => traceRef.current.map((item) => ({ ...item })),
    promptEn: contract ? buildConversationPracticePrompt(contract) : '',
  };
}
