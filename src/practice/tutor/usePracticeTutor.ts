import { useEffect, useRef, useState } from 'react';
import type { CharacterHostHandle } from '../../character/CharacterHost';
import type { LiveDiagnostic } from '../../live/types';
import type { ConversationTurn } from '../conversationTypes';
import { createSilentIssueCollector } from '../silentIssues';
import type { PracticeMissionContract } from '../types';
import type { PracticeCorrectionRecord } from '../runtime';
import { finishRoleplay, type FinalReviewOutcome } from './finishRoleplay';
import { phaseScript } from './phaseScript';
import { briefingAudioTool } from './briefingAudioTool';
import { TutorSession } from './TutorSession';
import { idleTutorState, type CountedDiagnostic, type TimedDiagnostic, type PracticeCompletionState, type TutorPhase } from './types';

export function usePracticeTutor(options: {
  mission: PracticeMissionContract;
  phase: TutorPhase;
  locale: 'ar' | 'en';
  corrections: PracticeCorrectionRecord[];
  notesIncomplete?: boolean;
  silenceDurationMs: number;
  onTurn: () => void;
}) {
  const host = useRef<CharacterHostHandle | null>(null);
  const session = useRef<TutorSession | null>(null);
  const turns = useRef<ConversationTurn[]>([]);
  const diagnostics = useRef<CountedDiagnostic[]>([]);
  const timeline = useRef<TimedDiagnostic[]>([]);
  const startedAt = useRef(0);
  const [state, setState] = useState(idleTutorState);
  const [goalIds, setGoalIds] = useState<string[]>([]);
  // The notebook outlives any single connection: reconnecting never erases notes.
  const [collector] = useState(() => createSilentIssueCollector(options.mission, setGoalIds));
  const [ending, setEnding] = useState(false);
  const finishing = useRef(false);
  const mounted = useRef(true);
  const visualQa = import.meta.env.VITE_VISUAL_QA === '1';

  function diagnostic(event: LiveDiagnostic) {
    const old = diagnostics.current.find((item) => item.event === event.event && item.name === event.name && item.saved === event.saved);
    if (old) old.count++;
    else diagnostics.current.push({ ...event, count: 1 });
    // Only metadata. Never log audio, API credentials, tool arguments or learner text.
    timeline.current.push({ ...event, elapsedMs: Math.max(0, Date.now() - (startedAt.current || Date.now())) });
    if (timeline.current.length > 500) timeline.current.shift();
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('debug') === '1') {
      console.debug('[Otti Live]', timeline.current.at(-1));
    }
  }

  async function start(controlMessage?: string) {
    if (visualQa || finishing.current || (session.current && !session.current.closed)) return;
    const tutor = new TutorSession({
      host: () => host.current, update: (value) => { if (mounted.current) setState(value); },
      tools: options.phase === 'roleplay' ? collector.tools : [], turns: turns.current, onTurn: options.onTurn, diagnostic,
    });
    session.current = tutor;
    if (options.phase === 'briefing') tutor.options.tools.push(briefingAudioTool(options.mission.slug, tutor));
    if (!startedAt.current) startedAt.current = Date.now();
    const script = phaseScript(options, turns.current, collector.getObservedGoalIds());
    await tutor.start(script.instruction, controlMessage ? `${script.opening}\n${controlMessage}` : script.opening, options.silenceDurationMs);
  }

  async function stop() {
    const tutor = session.current;
    session.current = null;
    if (tutor) await tutor.close();
    if (mounted.current) setState(idleTutorState);
  }

  /** Roleplay: ask the same connection for its final review, drain, close, THEN freeze the notebook. */
  async function finish(): Promise<PracticeCompletionState | null> {
    if (finishing.current) return null;
    finishing.current = true;
    setEnding(true);
    const tutor = session.current;
    let finalReview: { outcome: FinalReviewOutcome; waitedMs: number } = { outcome: 'offline', waitedMs: 0 };
    if (options.phase === 'roleplay') {
      collector.beginFinalReview();
      finalReview = await finishRoleplay(tutor, collector.isFinalized);
    }
    await tutor?.close();
    return {
      corrections: collector.getIssues(), achievedGoalIds: collector.getObservedGoalIds(), recordedByOtti: true,
      durationSeconds: startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0,
      conversationText: turns.current.map((turn) => `${turn.speaker}: ${turn.text}`).join('\n'),
      diagnostics: { transport: diagnostics.current.map((item) => ({ ...item })),
        timeline: timeline.current.map((item) => ({ ...item })), notebook: collector.getDiagnostics(),
        finalReview: finalReview.outcome, finalWaitMs: finalReview.waitedMs },
    };
  }

  function discussCorrection(index: number) {
    const issue = options.corrections[index];
    if (!issue || options.phase !== 'review') return;
    const message = 'PRIVATE_REVIEW_SELECTION: the learner tapped this saved note to discuss and practise. Explain it briefly, model the better sentence, invite them to say it, then listen. This is NOT new learner speech: ' + JSON.stringify({ heard: issue.originalEn, better: issue.betterEn });
    const current = session.current;
    if (!current || current.closed) { void start(message); return; }
    if (current.state.paused) current.update({ paused: false });
    current.interrupt();
    current.request(message);
  }

  useEffect(() => {
    mounted.current = true;
    const timer = options.phase !== 'briefing' ? window.setTimeout(() => void start(), 0) : null;
    return () => {
      mounted.current = false;
      if (timer !== null) window.clearTimeout(timer);
      void session.current?.close();
    };
  }, []);

  const qaState = { ...state, status: 'listening' as const, micOpen: options.phase !== 'briefing',
    text: options.phase === 'briefing' ? '' : options.phase === 'roleplay'
      ? options.mission.canonicalDialogue.find((turn) => turn.speaker === 'ai_role')?.text ?? 'Ready.'
      : 'Let us look at your first note together. Want to try the better sentence?' };
  return {
    host, state: visualQa ? qaState : state, goalIds, ending, start, stop, finish, session, turns, discussCorrection,
    getConnectionDiagnostics: () => ({
      phase: options.phase, status: session.current?.state.status ?? 'idle',
      transport: diagnostics.current.map((item) => ({ ...item })),
      timeline: timeline.current.map((item) => ({ ...item })),
      notebook: collector.getDiagnostics(),
    }),
  };
}
