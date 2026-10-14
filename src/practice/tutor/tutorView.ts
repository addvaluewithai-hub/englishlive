import type { TutorCopy } from './tutorCopy';
import type { TutorPhase, TutorState } from './types';

export type StatusKey = keyof TutorCopy['status'];
export type MicAction = 'start' | 'cancel' | 'resume' | 'interrupt' | 'done' | 'hold' | 'none';

/** Roleplay and review are manual push-to-talk; briefing is no longer a Live route. */
export function deriveTutorView(state: TutorState, ending: boolean, phase: TutorPhase, copy: TutorCopy) {
  const connecting = state.status === 'connecting' || state.status === 'reconnecting';
  const isHoldMode = phase !== 'briefing';
  const speaking = state.status === 'speaking' && !state.holding;
  const learnerTurn = isHoldMode
    ? state.status === 'listening' && !state.holding && !state.paused && !state.waiting && !ending
    : state.micOpen && !state.paused && !state.waiting && !ending;
  const canHold = isHoldMode && !ending && !connecting && !state.paused &&
    state.status !== 'idle' && state.status !== 'error';
  const statusKey: StatusKey = ending ? (phase === 'roleplay' ? 'ending' : 'connecting')
    : state.status === 'error' ? 'error'
      : state.paused ? 'paused'
        : connecting ? 'connecting'
          : state.holding ? 'holding'
            : speaking ? 'speaking'
              : state.waiting ? 'waiting'
                : learnerTurn ? 'listening'
                  : phase === 'briefing' ? 'idleBriefing' : 'idle';
  const mic: { action: MicAction; label: string } =
    ending ? { action: 'none', label: copy.wait }
      : statusKey === 'connecting' ? { action: 'cancel', label: copy.connecting }
        : statusKey === 'paused' ? { action: 'resume', label: copy.resume }
          : statusKey === 'error' ? { action: 'start', label: copy.retry }
            : isHoldMode ? { action: 'hold', label: state.holding ? copy.releaseToSend : copy.holdToSpeak }
              : statusKey === 'speaking' ? { action: 'interrupt', label: copy.interrupt }
                : statusKey === 'listening' ? { action: 'done', label: copy.doneSpeaking }
                  : statusKey === 'waiting' ? { action: 'none', label: copy.wait }
                    : { action: 'start', label: copy.startLesson };
  const [statusTitle, statusBody] = copy.status[statusKey];
  const active = state.status !== 'idle' && state.status !== 'error';
  return { connecting, speaking, learnerTurn, canHold, statusKey, statusTitle, statusBody, mic, active };
}
