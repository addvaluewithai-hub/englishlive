import { MicrophonePcmStream } from '../../audio/MicrophonePcmStream';
import type { PcmPlaybackQueue } from '../../audio/PcmPlaybackQueue';
import type { CharacterHostHandle } from '../../character/CharacterHost';
import { CharacterPerformanceController } from '../../character/CharacterPerformanceController';
import { getCharacterDefinition } from '../../character/registry';
import { loadPublishedCharacter } from '../../content/client';
import { GeminiLiveTransport } from '../../live/GeminiLiveTransport';
import type { LiveClientTool } from '../../live/tools';
import type { LiveDiagnostic } from '../../live/types';
import type { ConversationTurn } from '../conversationTypes';
import { tutorCallbacks } from './tutorCallbacks';
import { createTutorPlayback } from './tutorPlayback';
import { TurnTimers } from './turnTimers';
import { idleTutorState, type TutorState } from './types';

/** How long Otti may stay silent while owing a reply. The learner's own thinking time is never limited. */
const REPLY_TIMEOUT_MS = 25_000;
/** If playback drained but the server never sent turnComplete, hand the turn back after this quiet gap. */
const QUIET_HANDBACK_MS = 1_400;

export type TutorSessionOptions = {
  host: () => CharacterHostHandle | null;
  update: (state: TutorState) => void;
  tools: LiveClientTool[];
  turns: ConversationTurn[];
  onTurn: () => void;
  diagnostic: (event: LiveDiagnostic) => void;
};

/** One disposable media connection. The lesson notebook is owned above this class. */
export class TutorSession {
  state = { ...idleTutorState };
  closed = false;
  finishing = false;
  suppressOutput = false;
  hasAudio = false;
  audioFramesSent = 0;
  serverTurnPending = false;
  generationDone = false;
  teacherDraft = '';
  repeatAfterPause = false;
  live: GeminiLiveTransport | null = null;
  mic: MicrophonePcmStream | null = null;
  queue: PcmPlaybackQueue | null = null;
  readonly performer: CharacterPerformanceController;
  readonly timers = new TurnTimers(REPLY_TIMEOUT_MS, QUIET_HANDBACK_MS);

  constructor(readonly options: TutorSessionOptions) {
    this.performer = new CharacterPerformanceController(options.host);
  }

  update(patch: Partial<TutorState>) {
    if (this.closed) return;
    this.state = { ...this.state, ...patch };
    this.options.update(this.state);
  }

  setMic(enabled: boolean) {
    const open = enabled && !this.closed && !this.finishing && !this.state.paused;
    this.mic?.setEnabled(open);
    this.update({ micOpen: open, ...(!open ? { level: 0 } : {}) });
  }

  log(speaker: ConversationTurn['speaker'], text: string) {
    const turns = this.options.turns;
    if (!text.trim() || turns.at(-1)?.text === text.trim()) return;
    turns.push({ id: `turn-${turns.length + 1}`, speaker, text: text.trim() });
    this.options.onTurn();
  }

  flushTeacher() {
    this.log('otti', this.teacherDraft);
    this.teacherDraft = '';
  }

  async start(instruction: string, opening: string, silenceDurationMs: number) {
    this.update({ status: 'connecting', error: null });
    this.performer.thinking();
    this.queue = createTutorPlayback(this);
    try {
      // Unlock in the button gesture, before network awaits.
      await this.queue.unlock();
      const published = await loadPublishedCharacter(getCharacterDefinition('otti'));
      if (this.closed) return;
      this.live = new GeminiLiveTransport(tutorCallbacks(this), this.options.tools);
      this.mic = new MicrophonePcmStream();
      this.mic.setEnabled(false);
      await this.live.connect(instruction, {
        voiceName: published.content.voiceName ?? undefined,
        silenceDurationMs, disableInputTranscription: true,
      });
      if (this.closed) return;
      const mic = this.mic;
      await mic.start((audio) => {
        if (!this.live?.connected || this.closed) return;
        this.audioFramesSent++;
        this.live.sendAudio(audio);
      }, (level) => { if (!this.closed) this.update({ level }); });
      if (this.closed) { await mic.stop(); return; }
      this.request(opening);
    } catch (reason) {
      if (!this.closed) this.fail(reason instanceof Error ? reason.message : 'Could not start Otti.');
    }
  }

  /** Send an app or typed learner turn and wait for Otti. */
  request(text: string) {
    if (!this.live?.connected || this.closed) return;
    this.suppressOutput = false;
    this.hasAudio = false;
    this.generationDone = false;
    this.serverTurnPending = true;
    this.setMic(false);
    this.update({ waiting: true, status: 'listening' });
    this.live.sendText(text);
    this.awaitReply();
  }

  send(text: string) {
    if (!this.state.micOpen || this.state.paused || this.state.waiting) return;
    this.options.diagnostic({ event: 'text_submitted' });
    this.log('learner', text);
    this.request(text);
  }

  /** Give the turn to the learner. Never while finishing or paused. */
  listen() {
    if (this.closed || this.finishing || this.serverTurnPending || this.state.paused) return;
    this.clearTimers();
    if (!this.state.micOpen) {
      this.audioFramesSent = 0;
      this.options.diagnostic({ event: 'mic_open' });
    }
    this.setMic(true);
    this.update({ status: 'listening', waiting: false });
    this.performer.listening();
  }

  noteServerActivity() {
    this.timers.activity();
  }

  /** Playback ran dry. Some provider turns never send turnComplete; do not strand the learner. */
  playbackDrained() {
    if (!this.serverTurnPending) { this.listen(); return; }
    if (this.generationDone) { this.serverTurnPending = false; this.listen(); return; }
    this.timers.quiet(() => {
      if (this.closed || this.finishing || this.queue?.isPlaying || !this.serverTurnPending || !this.hasAudio) return;
      this.options.diagnostic({ event: 'missing_turn_complete' });
      this.serverTurnPending = false;
      this.hasAudio = false;
      this.flushTeacher();
      this.listen();
    });
  }

  interrupt() {
    if (this.closed) return;
    this.flushTeacher();
    // Mute only the rest of a reply still being generated; a finished reply must not mute the next one.
    this.suppressOutput = this.serverTurnPending && !this.generationDone;
    this.queue?.interrupt();
    this.performer.interrupt();
    this.serverTurnPending = false;
    this.listen();
  }

  doneSpeaking() {
    if (!this.state.micOpen || !this.live?.connected) return;
    this.setMic(false);
    this.serverTurnPending = true;
    this.generationDone = false;
    this.update({ waiting: true });
    this.live.endAudioStream();
    this.options.diagnostic({ event: 'audio_submitted', frames: this.audioFramesSent });
    this.awaitReply();
  }

  togglePause() {
    const paused = !this.state.paused;
    this.update({ paused });
    if (paused) {
      this.repeatAfterPause = this.state.status === 'speaking' || this.state.waiting;
      this.clearTimers();
      this.interrupt();
      this.setMic(false);
    } else if (this.repeatAfterPause) {
      this.repeatAfterPause = false;
      this.request('PRIVATE UI RESUME: briefly repeat your last reply, then wait. Control event, not learner speech.');
    } else this.listen();
  }

  /** Time out only while Otti owes a reply; an open mic is the learner's thinking time. */
  awaitReply() {
    this.timers.awaitReply(() => !(this.closed || this.finishing || this.state.paused || this.state.micOpen),
      () => this.fail('Otti did not respond in time. Your notes are safe. Reconnect or finish and review.'));
  }

  clearTimers() {
    this.timers.clear();
  }

  fail(message: string) {
    this.update({ status: 'error', error: message, waiting: false, micOpen: false, level: 0 });
    void this.close();
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.options.diagnostic({ event: 'session_closed' });
    this.clearTimers();
    this.live?.close();
    this.performer.close();
    await Promise.allSettled([this.mic?.stop(), this.queue?.close()]);
  }
}
