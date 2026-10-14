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
/** Buffer the onset of speech before notifying Gemini, so accidental taps send nothing. */
const MIN_HOLD_MS = 140;

export type TutorSessionOptions = {
  host: () => CharacterHostHandle | null;
  update: (state: TutorState) => void;
  tools: LiveClientTool[];
  turns: ConversationTurn[];
  onTurn: () => void;
  diagnostic: (event: LiveDiagnostic) => void;
  /** Manually framed speech turns; never auto-open the learner mic. */
  pushToTalk?: boolean;
};

/** One disposable media connection. The lesson notebook is owned above this class. */
export class TutorSession {
  state = { ...idleTutorState };
  closed = false;
  finishing = false;
  suppressOutput = false;
  hasAudio = false;
  audioFramesSent = 0;
  holding = false;
  private activityStarted = false;
  private holdBeganAt = 0;
  private bufferedFrames: string[] = [];
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
        manualActivityDetection: this.options.pushToTalk === true,
        voiceName: published.content.voiceName ?? undefined,
        silenceDurationMs, disableInputTranscription: true,
      });
      if (this.closed) return;
      const mic = this.mic;
      await mic.start((audio) => {
        if (!this.live?.connected || this.closed) return;
        if (this.options.pushToTalk) {
          if (!this.holding || !this.state.micOpen) return;
          this.bufferedFrames.push(audio);
          // Flush the buffered first phonemes after confirming an intentional hold.
          if (!this.activityStarted && Date.now() - this.holdBeganAt >= MIN_HOLD_MS) {
            this.activityStarted = true;
            this.live.startUserActivity();
            for (const chunk of this.bufferedFrames) this.live.sendAudio(chunk);
            this.audioFramesSent += this.bufferedFrames.length;
            this.bufferedFrames = [];
          } else if (this.activityStarted) {
            // The current chunk was appended above; stream it once.
            for (const chunk of this.bufferedFrames) this.live.sendAudio(chunk);
            this.audioFramesSent += this.bufferedFrames.length;
            this.bufferedFrames = [];
          }
          return;
        }
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
    if ((this.options.pushToTalk ? this.state.status !== 'listening' : !this.state.micOpen) || this.state.paused || this.state.waiting) return;
    this.options.diagnostic({ event: 'text_submitted' });
    this.log('learner', text);
    this.request(text);
  }

  /** Otti finished a turn. Hold-to-speak sessions stay muted until the next press. */
  listen() {
    if (this.closed || this.finishing || this.serverTurnPending || this.state.paused || this.holding) return;
    this.clearTimers();
    if (this.options.pushToTalk) {
      this.setMic(false);
    } else {
      if (!this.state.micOpen) {
        this.audioFramesSent = 0;
        this.options.diagnostic({ event: 'mic_open' });
      }
      this.setMic(true);
    }
    this.update({ status: 'listening', waiting: false });
    this.performer.listening();
  }

  /** Immediate local barge-in; explicit provider activity starts after buffered PCM. */
  beginHold(): boolean {
    if (!this.options.pushToTalk || this.closed || this.finishing || this.holding ||
        this.state.paused || !this.live?.connected || !this.mic) return false;
    this.holding = true;
    this.suppressOutput = true;
    this.activityStarted = false;
    this.bufferedFrames = [];
    this.audioFramesSent = 0;
    this.holdBeganAt = Date.now();
    this.clearTimers();
    this.queue?.interrupt();
    this.performer.interrupt();
    this.flushTeacher();
    this.serverTurnPending = false;
    this.generationDone = false;
    this.hasAudio = false;
    this.setMic(true);
    this.update({ status: 'listening', waiting: false, holding: true });
    this.performer.listening();
    this.options.diagnostic({ event: 'hold_started' });
    this.options.diagnostic({ event: 'mic_open' });
    return true;
  }

  /** Pointer/key release or cancellation. A short accidental press never reaches Gemini. */
  endHold(cancelled = false): boolean {
    if (!this.holding) return false;
    this.holding = false;
    this.setMic(false);
    this.update({ holding: false });
    const hadSpeech = this.activityStarted;
    this.bufferedFrames = [];
    this.activityStarted = false;
    if (hadSpeech) this.live?.endUserActivity();
    this.suppressOutput = false;
    if (!hadSpeech) {
      this.serverTurnPending = false;
      this.hasAudio = false;
      this.update({ status: 'listening', waiting: false });
      this.performer.listening();
      this.options.diagnostic({ event: 'hold_cancelled' });
      return false;
    }
    this.serverTurnPending = true;
    this.generationDone = false;
    this.update({ status: 'listening', waiting: true });
    this.options.diagnostic({ event: cancelled ? 'hold_cancelled' : 'hold_released', frames: this.audioFramesSent });
    this.options.diagnostic({ event: 'audio_submitted', frames: this.audioFramesSent });
    this.awaitReply();
    return true;
  }

  noteServerActivity() {
    this.timers.activity();
  }

  /** Playback ran dry. Some provider turns never send turnComplete; do not strand the learner. */
  playbackDrained() {
    if (this.holding) return;
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
    if (this.holding) this.endHold(true);
    this.flushTeacher();
    // Mute only the rest of a reply still being generated; a finished reply must not mute the next one.
    this.suppressOutput = this.serverTurnPending && !this.generationDone;
    this.queue?.interrupt();
    this.performer.interrupt();
    this.serverTurnPending = false;
    this.listen();
  }

  doneSpeaking() {
    if (this.options.pushToTalk) { this.endHold(); return; }
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
    if (this.holding) this.endHold(true);
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
    if (this.holding) this.endHold(true);
    this.live?.close();
    this.performer.close();
    await Promise.allSettled([this.mic?.stop(), this.queue?.close()]);
  }
}
