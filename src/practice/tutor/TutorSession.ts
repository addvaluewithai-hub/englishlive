import { MicrophonePcmStream } from '../../audio/MicrophonePcmStream';
import { PcmPlaybackQueue } from '../../audio/PcmPlaybackQueue';
import type { CharacterHostHandle } from '../../character/CharacterHost';
import { CharacterPerformanceController } from '../../character/CharacterPerformanceController';
import { getCharacterDefinition } from '../../character/registry';
import { loadPublishedCharacter } from '../../content/client';
import { GeminiLiveTransport } from '../../live/GeminiLiveTransport';
import type { LiveClientTool } from '../../live/tools';
import type { LiveDiagnostic } from '../../live/types';
import type { ConversationTurn } from '../conversationTypes';
import { tutorCallbacks } from './tutorCallbacks';
import { idleTutorState, type TutorState } from './types';

/** One disposable media connection. The lesson notebook is owned above this class. */
export class TutorSession {
  state = { ...idleTutorState };
  closed = false;
  finishing = false;
  suppressOutput = false;
  hasAudio = false;
  serverTurnPending = false;
  teacherDraft = '';
  repeatAfterPause = false;
  lastSpeech = 0;
  live: GeminiLiveTransport | null = null;
  mic: MicrophonePcmStream | null = null;
  queue: PcmPlaybackQueue | null = null;
  readonly performer: CharacterPerformanceController;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private turns: ConversationTurn[];

  constructor(private readonly options: {
    host: () => CharacterHostHandle | null;
    update: (state: TutorState) => void;
    tools: LiveClientTool[];
    turns: ConversationTurn[];
    onTurn: () => void;
    diagnostic: (event: LiveDiagnostic) => void;
    notesFinalized?: () => boolean;
  }) {
    this.performer = new CharacterPerformanceController(options.host);
    this.turns = options.turns;
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
    if (!text.trim() || this.turns.at(-1)?.text === text.trim()) return;
    this.turns.push({ id: `turn-${this.turns.length + 1}`, speaker, text: text.trim() });
    this.options.onTurn();
  }

  flushTeacher() {
    this.log('otti', this.teacherDraft);
    this.teacherDraft = '';
  }

  async start(instruction: string, opening: string, silenceDurationMs: number) {
    this.update({ status: 'connecting', error: null });
    this.performer.thinking();
    this.armWatchdog();
    this.queue = new PcmPlaybackQueue({
      onMouthPose: (pose) => { if (!this.closed) this.performer.setMouth(pose); },
      onSpeechStart: () => {
        if (this.closed) return;
        this.setMic(false);
        this.update({ status: 'speaking', waiting: false });
        this.performer.speechStart();
      },
      onSpeechEnd: () => { if (!this.closed) { this.performer.speechEnd(); this.listen(); } },
      onTurnComplete: () => this.listen(),
    });
    try {
      // Unlock in the button gesture, before network awaits.
      await this.queue.unlock();
      const published = await loadPublishedCharacter(getCharacterDefinition('otti'));
      if (this.closed) return;
      this.live = new GeminiLiveTransport(tutorCallbacks(this, this.options.diagnostic), this.options.tools);
      this.mic = new MicrophonePcmStream();
      this.mic.setEnabled(false);
      await this.live.connect(instruction, {
        voiceName: published.content.voiceName ?? undefined,
        silenceDurationMs, disableInputTranscription: true,
      });
      if (this.closed) return;
      const mic = this.mic;
      await mic.start((audio) => this.live?.sendAudio(audio), (level) => {
        if (this.closed) return;
        this.update({ level });
        if (level > 0.045) {
          this.serverTurnPending = true;
          this.lastSpeech = Date.now();
          if (!this.watchdog) this.armWatchdog();
        }
      });
      if (this.closed) { await mic.stop(); return; }
      this.request(opening);
    } catch (reason) {
      if (!this.closed) this.fail(reason instanceof Error ? reason.message : 'Could not start Otti.');
    }
  }

  request(text: string) {
    if (!this.live?.connected || this.closed) return;
    this.suppressOutput = false;
    this.hasAudio = false;
    this.serverTurnPending = true;
    this.setMic(false);
    this.update({ waiting: true, status: 'listening' });
    this.live.sendText(text);
    this.armWatchdog();
  }

  send(text: string) {
    if (!this.state.micOpen || this.state.paused || this.state.waiting) return;
    this.log('learner', text);
    this.request(text);
  }

  listen() {
    if (this.closed || this.serverTurnPending || this.state.paused) return;
    this.clearWatchdog();
    this.lastSpeech = 0;
    this.setMic(true);
    this.update({ status: 'listening', waiting: false });
    this.performer.listening();
  }

  interrupt() {
    if (this.closed) return;
    this.flushTeacher();
    this.suppressOutput = true;
    this.queue?.interrupt();
    this.performer.interrupt();
    this.serverTurnPending = false;
    this.listen();
  }

  doneSpeaking() {
    if (!this.state.micOpen || !this.live?.connected) return;
    this.setMic(false);
    this.serverTurnPending = true;
    this.update({ waiting: true });
    this.live.endAudioStream();
    this.armWatchdog();
  }

  togglePause() {
    const paused = !this.state.paused;
    this.update({ paused });
    if (paused) {
      this.repeatAfterPause = this.state.status === 'speaking' || this.state.waiting;
      this.clearWatchdog();
      this.interrupt();
      this.setMic(false);
    } else if (this.repeatAfterPause) {
      this.repeatAfterPause = false;
      this.request('PRIVATE UI RESUME: briefly repeat your last reply, then wait. Control event, not learner speech.');
    } else this.listen();
  }

  clearWatchdog() {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = null;
  }

  armWatchdog() {
    this.clearWatchdog();
    this.watchdog = setTimeout(() => {
      this.watchdog = null;
      if (this.closed || this.state.paused) return;
      if (this.state.micOpen && Date.now() - this.lastSpeech < 25_000) { this.armWatchdog(); return; }
      this.fail('Otti did not respond in time. Your notes are safe. Reconnect or finish and review.');
    }, 25_000);
  }

  fail(message: string) {
    this.update({ status: 'error', error: message, waiting: false, micOpen: false, level: 0 });
    void this.close();
  }

  /** Allow the final response/tools to arrive before freezing the roleplay notebook. */
  async settle() {
    this.finishing = true;
    this.clearWatchdog();
    this.setMic(false);
    this.suppressOutput = true;
    this.queue?.interrupt();
    this.live?.endAudioStream();
    const needsFinalReview = Boolean(this.options.notesFinalized && this.live?.connected && !this.closed);
    if (needsFinalReview) {
      this.live?.sendText('PRIVATE_FINISH_NOTES: the learner ended roleplay. No more spoken roleplay. Silently audit the ACTUAL learner English heard in this session, including minor genuine errors not yet saved. Call record_practice_progress with language_review, goal_ids and final_review:true. Preserve exact originals; do not invent errors or use prompt examples as evidence. If no clear issues or uncertain, state that honestly in the tool.');
    }
    const deadline = Date.now() + 8000;
    while (!this.closed && needsFinalReview && !this.options.notesFinalized?.() && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await this.live?.flushPendingMessages();
    this.flushTeacher();
    return needsFinalReview && !this.options.notesFinalized?.();
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.clearWatchdog();
    this.live?.close();
    this.performer.close();
    await Promise.allSettled([this.mic?.stop(), this.queue?.close()]);
  }
}
