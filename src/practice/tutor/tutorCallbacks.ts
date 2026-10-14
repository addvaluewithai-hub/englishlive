import type { LiveCallbacks } from '../../live/types';
import type { TutorSession } from './TutorSession';

function append(previous: string, piece: string) {
  if (!previous || piece.startsWith(previous)) return piece;
  return previous.endsWith(piece) ? previous : `${previous} ${piece}`;
}

/** Bridge Live provider events into the tutor turn-taking state machine. */
export function tutorCallbacks(session: TutorSession): LiveCallbacks {
  const silenced = () => session.closed || session.finishing || session.suppressOutput || session.holding || session.state.paused;
  return {
    onDiagnostic: (event) => {
      if (session.closed) return;
      if (event.event === 'tool_call') session.noteServerActivity();
      session.options.diagnostic(event);
    },
    onStatus: (status) => {
      if (status === 'connecting' || status === 'reconnecting') {
        if (session.holding) session.endHold(true);
        session.setMic(false);
        session.update({ status });
        session.performer.thinking();
      }
    },
    onInputTranscript: () => undefined,
    onOutputTranscript: (piece) => {
      if (silenced()) return;
      session.noteServerActivity();
      session.serverTurnPending = true;
      session.setMic(false);
      session.queue?.pushTranscript(piece);
      session.teacherDraft = append(session.teacherDraft, piece);
      session.update({ text: session.teacherDraft });
    },
    onAudio: (audio, mime) => {
      if (silenced()) return;
      session.noteServerActivity();
      session.serverTurnPending = true;
      session.hasAudio = true;
      session.setMic(false);
      void session.queue?.enqueue(audio, Number(mime.match(/rate=(\d+)/i)?.[1] ?? 24000))
        .catch(() => session.fail('Could not play Otti audio. Reconnect to continue.'));
    },
    onInterrupted: () => {
      if (session.closed || session.holding) return;
      session.flushTeacher();
      session.queue?.interrupt();
      session.performer.interrupt();
      session.suppressOutput = session.finishing;
      session.serverTurnPending = false;
      session.hasAudio = false;
      session.listen();
    },
    onGenerationComplete: () => {
      if (session.closed) return;
      session.noteServerActivity();
      session.options.diagnostic({ event: 'provider_generation_complete' });
      session.generationDone = true;
      if (session.holding) return;
      // Text-only or tool-only generations have nothing to play: hand the turn back now.
      if (!session.hasAudio && !session.queue?.isPlaying) { session.serverTurnPending = false; session.flushTeacher(); session.listen(); }
    },
    onTurnComplete: () => {
      if (session.closed) return;
      session.noteServerActivity();
      session.options.diagnostic({ event: 'provider_turn_complete' });
      if (session.holding) return;
      session.serverTurnPending = false;
      session.suppressOutput = session.finishing;
      session.flushTeacher();
      const queue = session.queue;
      queue?.markTurnComplete();
      // Audio can drain via starvation before the server sends turnComplete.
      // Recheck after queued enqueues; do not wait for a playback callback already fired.
      void queue?.drainEnqueues().then(() => { if (!queue.isPlaying) session.listen(); });
      if (!session.hasAudio) session.listen();
      session.hasAudio = false;
    },
    onError: (message) => session.fail(message),
  };
}
