import type { LiveClientTool } from '../live/tools';
import {
  conversationResponseKinds,
  type ConversationEvidence,
  type ConversationEvidenceSource,
  type ConversationResponseKind,
  type ConversationRubricVerdict,
} from '../tutor/types';
import type {
  CourseLessonBeat,
  CourseLessonDefinition,
  CourseLessonProgressSnapshot,
  CourseLessonState,
} from './types';

const rubricVerdicts = new Set<ConversationRubricVerdict>(['meets', 'partial', 'does_not_meet']);
const evidenceSources = new Set<ConversationEvidenceSource>(['live_audio', 'automatic_transcript']);
const LEARNER_AUDIO_ACTIVITY_THRESHOLD = 0.04;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function appendTranscript(previous: string, incoming: string) {
  const next = incoming.trim();
  if (!next) return previous;
  if (!previous) return next.slice(0, 1200);
  if (next.startsWith(previous)) return next.slice(0, 1200);
  if (previous.endsWith(next)) return previous;
  return `${previous} ${next}`.trim().slice(-1200);
}

export interface PartnerTurnResult {
  advanced: boolean;
  readyToFinish: boolean;
}

export class CourseLessonRuntime {
  readonly tools: readonly LiveClientTool[];
  private state: CourseLessonState;
  private learnerAudioObserved = false;
  private readonly listeners = new Set<(state: CourseLessonState) => void>();

  constructor(
    readonly lesson: CourseLessonDefinition,
    options: {
      initialProgress?: CourseLessonProgressSnapshot;
      onStateChange?: (state: CourseLessonState) => void;
    } = {},
  ) {
    if (!lesson.beats.length) throw new Error('Course lesson requires at least one beat.');
    this.state = this.createInitialState(options.initialProgress);
    if (options.onStateChange) this.listeners.add(options.onStateChange);
    this.tools = [this.stateTool(), this.assessmentTool(), this.finishTool()];
  }

  get snapshot(): CourseLessonState {
    return clone(this.state);
  }

  get currentBeat(): CourseLessonBeat {
    return this.lesson.beats.find((beat) => beat.id === this.state.currentBeatId)
      ?? this.lesson.beats[0];
  }

  get systemPrompt() {
    return `
You are teaching one authored EnglishLive course lesson through a live spoken conversation.
Lesson: ${this.lesson.title}
Purpose: ${this.lesson.purpose}
Language focus: ${this.lesson.languageFocus.join('; ')}

The APPLICATION owns lesson order, boards, evidence and completion. You never choose or skip beats yourself.

LESSON LOOP
- Before your first spoken turn call get_lesson_state.
- Use only the currentBeat returned by the tool. Future beats are intentionally hidden.
- For completion="teacher_turn": teach the current teachingBrief naturally in one concise turn. The authored board, if any, is already controlled by the application. Do not invent extra curriculum. When your audible turn finishes, the application advances the beat automatically.
- For completion="evidence": briefly set up the current teachingBrief, then ask currentPrompt once and stop. Let the learner answer.
- After a content-bearing learner answer or attempt, call assess_current_beat BEFORE you speak again.
- If assessment passes, continue only from the NEW currentBeat in the tool result. Never advance from memory.
- If assessment stays, repair the specific gap briefly and create one more natural opportunity.
- Side questions and help requests are welcome: answer briefly, then stay on the same evidence beat.
- When state says readyToFinish=true, call finish_lesson before claiming the lesson is complete.

EVIDENCE
- You hear live audio directly. Automatic transcription is only an approximate audit hint and can be wrong.
- Prefer evidenceSource=live_audio when the spoken meaning is clear. The application independently requires observed microphone activity.
- Never pass silence, filler, room noise, or a help request as evidence.
- Judge the authored communicative evidence, including the lesson's target language when the successEvidence explicitly requires it. Do not require an exact memorized sentence unless the authored evidence says so.
- evidenceSummary should describe the speaking action demonstrated, not preserve personal story details unnecessarily.
- If uncertain, ask for a natural repeat or clarification and stay on the beat.

TEACHING STYLE
- You are a live teacher, not a quiz bot and not a lecture recording.
- Keep explanations short, concrete and spoken. One move at a time.
- React to what the learner actually says.
- Correct selectively: prioritize the current lesson focus, repeated blockers, and meaning-changing errors.
- The board is support, not a transcript. Do not read every board item aloud.
- Never expose beat IDs, tool names, state labels, rubrics, evidence fields, or curriculum mechanics.
`.trim();
  }

  subscribe(listener: (state: CourseLessonState) => void) {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  recordLearnerAudioLevel(level: number) {
    if (this.state.completedAt || !Number.isFinite(level)) return;
    if (level >= LEARNER_AUDIO_ACTIVITY_THRESHOLD) this.learnerAudioObserved = true;
  }

  recordAutomaticTranscript(text: string) {
    if (this.state.completedAt || this.currentBeat.completion !== 'evidence') return;
    const current = this.state.beats[this.currentBeat.id];
    current.automaticTranscript = appendTranscript(current.automaticTranscript ?? '', text);
    this.learnerAudioObserved = true;
    this.persistAndEmit();
  }

  /**
   * Called only after an audible partner turn completes. Teacher-only beats advance here,
   * so interruption never silently marks authored teaching as delivered.
   */
  markPartnerTurnComplete(): PartnerTurnResult {
    this.learnerAudioObserved = false;
    if (this.state.completedAt) return { advanced: false, readyToFinish: false };

    const beat = this.currentBeat;
    const beatState = this.state.beats[beat.id];

    if (beat.completion === 'teacher_turn') {
      beatState.status = 'met';
      beatState.metAt ??= new Date().toISOString();
      delete beatState.automaticTranscript;
      const advanced = this.advanceFrom(beat.id);
      this.persistAndEmit();
      return { advanced, readyToFinish: this.readyToFinish() };
    }

    if (beatState.automaticTranscript) {
      beatState.automaticTranscript = '';
      this.persistAndEmit();
    }
    return { advanced: false, readyToFinish: this.readyToFinish() };
  }

  toProgressSnapshot(): CourseLessonProgressSnapshot {
    return {
      lessonId: this.lesson.id,
      currentBeatId: this.state.currentBeatId,
      beatStatuses: Object.fromEntries(
        this.lesson.beats.map((beat) => [beat.id, this.state.beats[beat.id]?.status ?? 'pending']),
      ),
      ...(this.state.completedAt ? { completedAt: this.state.completedAt } : {}),
      updatedAt: this.state.updatedAt,
    };
  }

  private createInitialState(progress?: CourseLessonProgressSnapshot): CourseLessonState {
    const validProgress = progress?.lessonId === this.lesson.id ? progress : undefined;
    const beats = Object.fromEntries(this.lesson.beats.map((beat, index) => {
      const saved = validProgress?.beatStatuses[beat.id];
      const status = saved === 'met' ? 'met' : saved === 'active' ? 'active' : 'pending';
      return [beat.id, { status: index === 0 && !validProgress ? 'active' : status, evidence: [] }];
    }));

    let currentBeatId = validProgress?.currentBeatId;
    if (!currentBeatId || !this.lesson.beats.some((beat) => beat.id === currentBeatId)) {
      currentBeatId = this.lesson.beats.find((beat) => beats[beat.id].status !== 'met')?.id
        ?? this.lesson.beats.at(-1)?.id
        ?? '';
    }
    if (!validProgress?.completedAt && beats[currentBeatId] && beats[currentBeatId].status !== 'met') {
      beats[currentBeatId].status = 'active';
    }

    return {
      lessonId: this.lesson.id,
      currentBeatId,
      beats,
      ...(validProgress?.completedAt ? { completedAt: validProgress.completedAt } : {}),
      updatedAt: new Date().toISOString(),
    };
  }

  private persistAndEmit() {
    this.state.updatedAt = new Date().toISOString();
    const snapshot = this.snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }

  private readyToFinish() {
    return this.lesson.beats.every((beat) => this.state.beats[beat.id]?.status === 'met');
  }

  private advanceFrom(beatId: string) {
    const index = this.lesson.beats.findIndex((beat) => beat.id === beatId);
    const next = this.lesson.beats.slice(index + 1).find(
      (beat) => this.state.beats[beat.id]?.status !== 'met',
    );
    if (!next) return false;
    this.state.currentBeatId = next.id;
    this.state.beats[next.id] = {
      ...this.state.beats[next.id],
      status: 'active',
      automaticTranscript: '',
    };
    return true;
  }

  private compactState() {
    const beat = this.currentBeat;
    const beatState = this.state.beats[beat.id];
    const metCount = this.lesson.beats.filter(
      (item) => this.state.beats[item.id]?.status === 'met',
    ).length;
    return {
      lessonId: this.lesson.id,
      lessonTitle: this.lesson.title,
      lessonPurpose: this.lesson.purpose,
      languageFocus: this.lesson.languageFocus,
      currentBeat: {
        id: beat.id,
        title: beat.title,
        kind: beat.kind,
        completion: beat.completion,
        teachingBrief: beat.teachingBrief,
        currentPrompt: beat.prompt,
        capability: beat.capability,
        successEvidence: beat.successEvidence,
        acceptedResponseKinds: beat.acceptedResponseKinds ?? [],
        repairHints: beat.repairHints ?? [],
        hasAuthoredBoard: Boolean(beat.board),
      },
      automaticTranscriptHint: beatState?.automaticTranscript || undefined,
      evidence: beatState?.evidence.slice(-4) ?? [],
      metCount,
      totalBeats: this.lesson.beats.length,
      readyToFinish: this.readyToFinish(),
      finished: Boolean(this.state.completedAt),
    };
  }

  private stateTool(): LiveClientTool {
    return {
      declaration: {
        name: 'get_lesson_state',
        description: 'Get the authoritative current authored lesson beat. Call before speaking at lesson start and whenever you lose your place.',
        behavior: 'BLOCKING',
        parameters: { type: 'OBJECT', properties: {} },
      },
      handle: () => ({
        result: this.state.completedAt
          ? 'Lesson is already finished.'
          : 'Use only the current beat below. The application owns progression and the authored board.',
        state: this.compactState(),
      }),
    };
  }

  private assessmentTool(): LiveClientTool {
    return {
      declaration: {
        name: 'assess_current_beat',
        description: 'Semantically assess the learner’s current spoken answer before responding when the current lesson beat requires evidence.',
        behavior: 'BLOCKING',
        parameters: {
          type: 'OBJECT',
          properties: {
            beatId: { type: 'STRING', description: 'Exact currentBeat.id returned by get_lesson_state.' },
            decision: { type: 'STRING', enum: ['pass', 'stay'] },
            responseKind: { type: 'STRING', enum: [...conversationResponseKinds] },
            rubricVerdict: { type: 'STRING', enum: ['meets', 'partial', 'does_not_meet'] },
            evidenceSource: { type: 'STRING', enum: ['live_audio', 'automatic_transcript'] },
            evidenceSummary: { type: 'STRING', description: 'Short content-minimized semantic summary of what the learner demonstrated.' },
            misconception: { type: 'STRING', description: 'Optional concise gap that still needs repair.' },
          },
          required: ['beatId', 'decision', 'responseKind', 'rubricVerdict', 'evidenceSource', 'evidenceSummary'],
        },
      },
      handle: (args) => {
        if (this.state.completedAt) return { finished: true, state: this.compactState() };
        const beat = this.currentBeat;
        if (beat.completion !== 'evidence') {
          return { error: 'The current beat is teacher-led and is advanced only after its audible teaching turn completes.', state: this.compactState() };
        }
        if (args.beatId !== beat.id) {
          return { error: 'Stale beat. Call get_lesson_state and use the returned currentBeat.', state: this.compactState() };
        }

        const decision = args.decision;
        const responseKind = conversationResponseKinds.includes(args.responseKind as ConversationResponseKind)
          ? args.responseKind as ConversationResponseKind
          : null;
        const rubricVerdict = rubricVerdicts.has(args.rubricVerdict as ConversationRubricVerdict)
          ? args.rubricVerdict as ConversationRubricVerdict
          : null;
        const source = evidenceSources.has(args.evidenceSource as ConversationEvidenceSource)
          ? args.evidenceSource as ConversationEvidenceSource
          : null;
        const summary = typeof args.evidenceSummary === 'string' ? args.evidenceSummary.trim().slice(0, 600) : '';
        const misconception = typeof args.misconception === 'string' ? args.misconception.trim().slice(0, 220) : '';

        if ((decision !== 'pass' && decision !== 'stay') || !responseKind || !rubricVerdict || !source || !summary) {
          return { error: 'Invalid assessment. Supply the required semantic evidence fields.', state: this.compactState() };
        }
        if (source === 'live_audio' && !this.learnerAudioObserved) {
          return { error: 'No learner microphone activity was observed for this turn. Do not invent live-audio evidence.', state: this.compactState() };
        }
        if (source === 'automatic_transcript' && !this.state.beats[beat.id]?.automaticTranscript) {
          return { error: 'No automatic transcript evidence is available. Clarify if the spoken meaning is uncertain.', state: this.compactState() };
        }
        if (decision === 'pass' && !(beat.acceptedResponseKinds ?? []).includes(responseKind)) {
          return { error: `Pass rejected: ${responseKind} is not valid evidence for this beat.`, state: this.compactState() };
        }
        if (decision === 'pass' && rubricVerdict !== 'meets') {
          return { error: 'Pass rejected: the evidence does not yet meet the authored success evidence.', state: this.compactState() };
        }

        const evidence: ConversationEvidence = {
          id: crypto.randomUUID(),
          objectiveId: beat.id,
          responseKind,
          rubricVerdict,
          source,
          summary,
          ...(misconception ? { misconception } : {}),
          recordedAt: new Date().toISOString(),
        };
        const current = this.state.beats[beat.id];
        current.evidence = [...current.evidence, evidence].slice(-6);
        this.learnerAudioObserved = false;

        if (decision === 'pass') {
          current.status = 'met';
          current.metAt ??= new Date().toISOString();
          delete current.automaticTranscript;
          this.advanceFrom(beat.id);
        }
        this.persistAndEmit();

        return {
          result: decision === 'pass'
            ? this.readyToFinish()
              ? 'Beat passed. All authored beats are now complete; call finish_lesson.'
              : 'Beat passed. Continue only from the new currentBeat returned below.'
            : 'Beat stays active. Repair the specific gap briefly and create another natural attempt.',
          state: this.compactState(),
        };
      },
    };
  }

  private finishTool(): LiveClientTool {
    return {
      declaration: {
        name: 'finish_lesson',
        description: 'Mandatory completion gate. Call only after every authored lesson beat has completed.',
        behavior: 'BLOCKING',
        parameters: { type: 'OBJECT', properties: {} },
      },
      handle: () => {
        if (!this.readyToFinish()) {
          return {
            error: 'Lesson is not complete. Continue from the current beat.',
            state: this.compactState(),
          };
        }
        this.state.completedAt ??= new Date().toISOString();
        this.persistAndEmit();
        return {
          result: 'Lesson complete. Give one brief natural closing line; do not add another test.',
          finished: true,
          state: this.compactState(),
        };
      },
    };
  }
}
