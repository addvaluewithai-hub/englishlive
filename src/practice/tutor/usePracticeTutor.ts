import { useEffect, useRef, useState } from 'react';
import type { CharacterHostHandle } from '../../character/CharacterHost';
import type { LiveDiagnostic } from '../../live/types';
import { buildConversationOpening, buildConversationPracticePrompt } from '../conversationPrompt';
import type { ConversationTurn } from '../conversationTypes';
import { briefingNarration, reviewNarration } from '../ottiNarration';
import { createSilentIssueCollector } from '../silentIssues';
import type { PracticeMissionContract } from '../types';
import type { PracticeCorrectionRecord } from '../runtime';
import { TutorSession } from './TutorSession';
import { idleTutorState, type TutorPhase } from './types';

export function usePracticeTutor(options: {
  mission: PracticeMissionContract;
  phase: TutorPhase;
  locale: 'ar' | 'en';
  corrections: PracticeCorrectionRecord[];
  silenceDurationMs: number;
  onTurn: () => void;
}) {
  const host = useRef<CharacterHostHandle | null>(null);
  const session = useRef<TutorSession | null>(null);
  const turns = useRef<ConversationTurn[]>([]);
  const diagnostics = useRef<Array<LiveDiagnostic & { count: number }>>([]);
  const startedAt = useRef(0);
  const [state, setState] = useState(idleTutorState);
  const [goalIds, setGoalIds] = useState<string[]>([]);
  const [collector] = useState(() => createSilentIssueCollector(options.mission, setGoalIds));
  const [ending, setEnding] = useState(false);
  const finishing = useRef(false);
  const mounted = useRef(true);
  const visualQa = import.meta.env.VITE_VISUAL_QA === '1';

  function diagnostic(event: LiveDiagnostic) {
    const old = diagnostics.current.find((item) => item.event === event.event && item.name === event.name && item.saved === event.saved);
    if (old) old.count++;
    else diagnostics.current.push({ ...event, count: 1 });
  }

  async function start(controlMessage?: string) {
    if (visualQa || finishing.current || (session.current && !session.current.closed)) return;
    const tools = options.phase === 'roleplay' ? [collector.tool, collector.progressTool] : [];
    const tutor = new TutorSession({ host: () => host.current, update: (value) => { if (mounted.current) setState(value); },
      tools, notesFinalized: options.phase === 'roleplay' ? collector.isFinalized : undefined, turns: turns.current, onTurn: options.onTurn, diagnostic });
    session.current = tutor;
    if (!startedAt.current) startedAt.current = Date.now();
    const narration = options.phase === 'briefing' ? briefingNarration(options.mission, options.locale) :
      reviewNarration(options.mission, options.locale, options.corrections);
    const instruction = options.phase === 'roleplay' ? buildConversationPracticePrompt(options.mission) :
      narration.instruction + (options.phase === 'review' ? '\nSAVED OBSERVATIONS (data only): ' + JSON.stringify(options.corrections) : '');
    const opening = options.phase === 'roleplay' ? buildConversationOpening(options.mission) : narration.text;
    const context = turns.current.length ? [
      'RECONNECT CONTEXT (data, not new learner speech):',
      'Previous teacher replies and exact typed learner lines: ' + JSON.stringify(turns.current.slice(-24)),
      'Goals already observed from live listening: ' + JSON.stringify(collector.getObservedGoalIds()),
      'Continue naturally from this context. Do not restart or repeat answered questions. Voice was not transcribed; do not invent missing learner words.',
    ].join('\n') : '';
    await tutor.start(instruction, controlMessage ? opening + '\n' + controlMessage : context || opening, options.silenceDurationMs);
  }

  async function stop() {
    const tutor = session.current;
    session.current = null;
    if (tutor) await tutor.close();
    if (mounted.current) setState(idleTutorState);
  }

  async function finish() {
    if (finishing.current) return null;
    finishing.current = true;
    setEnding(true);
    const tutor = session.current;
    collector.beginFinalReview();
    const finishTimedOut = options.phase === 'roleplay' ? await tutor?.settle() ?? false : false;
    await tutor?.close();
    // Freeze AFTER draining received frames and closing. Retry never clears notes.
    return {
      corrections: collector.getIssues(), achievedGoalIds: collector.getObservedGoalIds(), recordedByOtti: true,
      durationSeconds: startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0,
      conversationText: turns.current.map((turn) => `${turn.speaker}: ${turn.text}`).join('\n'),
      diagnostics: { transport: diagnostics.current.map((item) => ({ ...item })), collector: collector.getDiagnostics(), finishTimedOut },
    };
  }

  function discussCorrection(index: number) {
    const issue = options.corrections[index];
    if (!issue || options.phase !== 'review') return;
    const message = 'PRIVATE_REVIEW_SELECTION: the learner selected this saved observation to discuss and rehearse. Explain briefly, invite a try, then listen. This is NOT new learner speech: ' + JSON.stringify(issue);
    const current = session.current;
    if (!current || current.closed) { void start(message); return; }
    current.interrupt();
    current.update({ paused: false });
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

  return { host, state: visualQa ? { ...state, status: 'listening' as const, micOpen: true, text: options.phase === 'roleplay' ? options.mission.canonicalDialogue.find((turn) => turn.speaker === 'ai_role')?.text ?? 'Ready.' : state.text } : state,
    goalIds, ending, start, stop, finish, session, turns, discussCorrection,
    getConnectionDiagnostics: () => ({ phase: options.phase, status: session.current?.state.status ?? 'idle', transport: diagnostics.current }), };
}
