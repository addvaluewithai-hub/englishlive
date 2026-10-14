import type { LiveCallbacks, LiveDiagnostic } from '../../live/types';
import type { TutorSession } from './TutorSession';

function append(previous: string, piece: string) {
  if (!previous || piece.startsWith(previous)) return piece;
  return previous.endsWith(piece) ? previous : `${previous} ${piece}`;
}

export function tutorCallbacks(session: TutorSession, diagnostic: (event: LiveDiagnostic) => void): LiveCallbacks {
  return {
    onDiagnostic: (event) => { if (!session.closed) diagnostic(event); },
    onStatus: (status) => {
      if (status === 'connecting' || status === 'reconnecting') {
        session.setMic(false);
        session.update({ status });
        session.performer.thinking();
      }
    },
    onInputTranscript: () => undefined,
    onOutputTranscript: (piece) => {
      if (session.closed || session.finishing || session.suppressOutput || session.state.paused) return;
      session.serverTurnPending = true;
      session.setMic(false);
      session.queue?.pushTranscript(piece);
      session.teacherDraft = append(session.teacherDraft, piece);
      session.update({ text: session.teacherDraft });
    },
    onAudio: (audio, mime) => {
      if (session.closed || session.finishing || session.suppressOutput || session.state.paused) return;
      session.serverTurnPending = true;
      session.hasAudio = true;
      session.setMic(false);
      session.armWatchdog();
      void session.queue?.enqueue(audio, Number(mime.match(/rate=(\d+)/i)?.[1] ?? 24000))
        .catch(() => session.fail('Could not play Otti audio. Reconnect to continue.'));
    },
    onInterrupted: () => {
      if (session.closed) return;
      session.flushTeacher();
      session.queue?.interrupt();
      session.performer.interrupt();
      session.suppressOutput = session.finishing;
      session.serverTurnPending = false;
      session.hasAudio = false;
      session.listen();
    },
    onTurnComplete: () => {
      if (session.closed) return;
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
