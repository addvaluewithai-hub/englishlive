import type { TutorCopy } from './tutorCopy';
import type { TutorPhase, TutorState } from './types';

export type StatusKey = keyof TutorCopy['status'];
export type MicAction = 'start' | 'cancel' | 'resume' | 'interrupt' | 'done' | 'none';

/** Pure mapping from runtime state to what the learner sees and what the mic button does. */
export function deriveTutorView(state: TutorState, ending: boolean, phase: TutorPhase, copy: TutorCopy) {
  const connecting = state.status === 'connecting' || state.status === 'reconnecting';
  const speaking = state.status === 'speaking' || state.examplePlaying;
  const learnerTurn = state.micOpen && !state.paused && !state.waiting && !ending;
  // Only the roleplay has a notes review on finish; other phases simply move on.
  const statusKey: StatusKey = ending ? (phase === 'roleplay' ? 'ending' : 'connecting')
    : state.status === 'error' ? 'error'
      : state.paused ? 'paused'
        : connecting ? 'connecting'
          : state.examplePlaying ? 'exampleAudio'
          : speaking ? 'speaking'
            : state.waiting ? 'waiting'
              : learnerTurn ? 'listening'
                : phase === 'briefing' ? 'idleBriefing' : 'idle';
  const mic: { action: MicAction; label: string } =
    ending ? { action: 'none', label: copy.wait }
      : statusKey === 'connecting' ? { action: 'cancel', label: copy.connecting }
        : statusKey === 'exampleAudio' ? { action: 'interrupt', label: copy.interrupt }
        : statusKey === 'paused' ? { action: 'resume', label: copy.resume }
          : statusKey === 'speaking' ? { action: 'interrupt', label: copy.interrupt }
            : statusKey === 'listening' ? { action: 'done', label: copy.doneSpeaking }
              : statusKey === 'waiting' ? { action: 'none', label: copy.wait }
                : statusKey === 'error' ? { action: 'start', label: copy.retry }
                  : { action: 'start', label: phase === 'briefing' ? copy.startLesson : copy.resume };
  const [statusTitle, statusBody] = copy.status[statusKey];
  const active = state.status !== 'idle' && state.status !== 'error';
  return { connecting, speaking, learnerTurn, statusKey, statusTitle, statusBody, mic, active };
}
