import type { LiveClientTool } from '../live/tools';
import { boardRevealChunk, boardRevealTotal } from '../presentation/boardReveal';
import { markProductLessonCompleted, markProductLessonStarted } from '../productV2/progress';
import {
  conversationResponseKinds,
  type ConversationEvidenceSource,
  type ConversationResponseKind,
} from '../tutor/types';
import type {
  SceneLessonDefinition,
  SceneLessonEvidence,
  SceneLessonScene,
  SceneLessonSceneState,
  SceneLessonState,
} from './types';

const evidenceSources = new Set<ConversationEvidenceSource>([
  'live_audio',
  'automatic_transcript',
]);
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

export class SceneLessonRuntime {
  readonly tools: readonly LiveClientTool[];
  private state: SceneLessonState;
  private learnerAudioObserved = false;
  private lessonOpeningComplete = false;
  private readonly listeners = new Set<(state: SceneLessonState) => void>();

  constructor(
    readonly lesson: SceneLessonDefinition,
    options: {
      onStateChange?: (state: SceneLessonState) => void;
    } = {},
  ) {
    if (!lesson.scenes.length) throw new Error('Scene lesson requires at least one scene.');
    this.state = this.createInitialState();
    if (options.onStateChange) this.listeners.add(options.onStateChange);
    markProductLessonStarted(lesson.id);
    this.tools = [
      this.stateTool(),
      this.revealBoardTool(),
      this.completeSceneTool(),
      this.finishLessonTool(),
    ];
  }

  get snapshot(): SceneLessonState {
    return clone(this.state);
  }

  get currentScene(): SceneLessonScene {
    return this.lesson.scenes.find((scene) => scene.id === this.state.currentSceneId)
      ?? this.lesson.scenes[0];
  }

  get systemPrompt() {
    return `
You are delivering one authored EnglishLive lesson as a sequence of application-owned teaching scenes.

LESSON
${this.lesson.levelId.toUpperCase()} · ${this.lesson.unitTitle} · ${this.lesson.title}
Primary learner performance: ${this.lesson.performance}
Core language: ${this.lesson.coreLanguage.join('; ')}

AUTHORITY
- The APPLICATION owns lesson order, scene content, board reveal order, success criteria and completion.
- You own only natural phrasing, warmth, calm pacing inside the current scene, and how you react to the learner.
- Future scenes are intentionally hidden. Never invent, preview, merge, skip or reorder them.
- Before your first spoken turn, call get_scene_state.
- After a scene is completed, use only the new currentScene returned by the tool.

SESSION OPENING — FIRST AUDIBLE TURN ONLY
- If get_scene_state returns openingRequired=true, do NOT teach or test currentScene yet.
- Give a short, human teacher welcome in Egyptian Arabic using this fixed four-move shape:
  1. Welcome the learner warmly in one short sentence. Do not use a stored profile name in the welcome.
  2. Say: "النهارده عندنا درس اسمه ${this.lesson.title}." Then explain the practical lesson outcome in ONE simple Arabic sentence using only the Primary learner performance above; do not add curriculum.
  3. Say that you will take it step by step: a small explanation, then speaking practice together.
  4. Give ONE short reassurance about mistakes, such as that mistakes are normal and you will help.
- Keep the whole opening around 15–25 seconds. No motivational speech, no unrelated small talk, and no learner test yet.
- Stop after the opening. Do not start currentScene in the same turn. The application will confirm that the welcome was heard and then tell you to begin the scene.

A1 PACING
- Teach at a calm beginner-teacher pace. Do NOT deliver a paragraph of Arabic followed by many English targets.
- One teaching chunk = ONE small idea, normally 1–2 short Arabic sentences plus at most one or two English examples.
- Say important target English clearly and unhurriedly, with short natural spoken pauses around it.
- IMPORTANT: slow teaching means slower speech and small chunks, NOT long silence and NOT ending your turn after every board item.
- Keep the same teacher turn flowing across consecutive explanation-only chunks when no learner response is required between them.
- Hand the turn to the learner ONLY when the authored teacherMoves / learnerTask actually asks them to repeat, answer, choose, ask, or speak, or when you need a real comprehension check.
- If the learner sounds unsure, slow down further. Simpler is better than more explanation.

PROGRESSIVE BOARD
- Authored board content starts hidden for every scene.
- If currentScene.board is not null, call reveal_board_next immediately BEFORE explaining the corresponding next board chunk.
- reveal_board_next is presentation-only and non-blocking: after calling it, continue speaking immediately in the SAME teacher turn.
- Reveal only ONE board chunk at a time and explain that newly revealed chunk before revealing another.
- If the next authored chunk is also explanation-only, call reveal_board_next again after a brief spoken transition and continue. Do NOT wait for learner input merely because a board chunk finished.
- If the authored interaction requires learner input at that point, ask for it and then wait normally.
- Do not verbally list hidden board content before it is revealed.
- Do not invent, rewrite, reorder, or mutate board content.
- Before completing a scene that has a board, every authored board chunk must have been revealed.

LANGUAGE AND TEACHING STYLE
- For this A1 delivery pilot, explain concepts MOSTLY in concise Egyptian Arabic.
- Keep target English expressions, examples, pronunciation models and roleplay language in English.
- Do not translate everything. Arabic is scaffolding; English is the thing being learned and used.
- Teach one small idea at a time, then make the learner use it at the next authored interaction point.
- Do not expand into grammar tables, vocabulary dumps, or extra curriculum outside the current scene.
- Never reveal scene IDs, tool names, criteria IDs, evidence fields, or lesson mechanics.

TEXT CHAT
- Messages prefixed with [LEARNER TEXT CHAT] are typed by the learner, not spoken.
- Answer typed questions naturally and use them to clarify or support learning.
- Typed text is NEVER valid speaking evidence for complete_scene.
- If the learner types a correct target answer, acknowledge it briefly, then ask them to SAY the answer aloud before you consider the speaking criterion demonstrated.

QUICK ACTIONS
- [LEARNER QUICK ACTION: DONT_UNDERSTAND] means: stay in the same scene, explain the CURRENT point again in simpler Egyptian Arabic, slowly, using only already-authored content. Do not advance.
- [LEARNER QUICK ACTION: REPEAT] means: repeat the LAST teaching point more slowly and more clearly. Do not add a new target and do not advance.
- [LEARNER QUICK ACTION: ANOTHER_EXAMPLE] means: give ONE short new example that uses only the current scene's authorized English. Do not add curriculum and do not advance.
- A quick action is help/context, never evidence. Never call complete_scene merely because the learner tapped a quick action.

SCENE LOOP
1. Read currentScene carefully.
2. If there is a board, reveal one authored chunk immediately before explaining it; the reveal call must not create a learner wait.
3. Explain that chunk calmly. If the next authored move is still teacher explanation, reveal the next chunk and continue in the same teacher turn.
4. Stop and give the learner real speaking space only at an authored interaction point that asks them to do something.
5. Model only the English targets authorized in the scene.
6. Run the interaction kind and teacherMoves in order, skipping only a move the learner has already clearly demonstrated.
7. If the learner struggles, use supportLadder in order. Use the lightest support that works, then ask for another attempt.
8. Stay in the SAME scene until the learner has demonstrated every required success criterion.
9. Only then call complete_scene BEFORE you continue speaking.
10. If complete_scene succeeds, continue only from the returned new currentScene. If all scenes are complete, call finish_scene_lesson.

EVIDENCE RULES
- Never complete a scene from your own example, typed chat, quick action, silence, filler, room noise, or a help request.
- Prefer evidenceSource=live_audio when you clearly heard the learner. The application separately requires observed microphone activity.
- Automatic transcription is only an approximate fallback hint and may be wrong.
- metCriteria must contain ONLY criteria genuinely demonstrated during this scene.
- Equivalent natural English can satisfy a communicative criterion unless the criterion specifically requires target production.
- Keep evidenceSummary content-minimized: describe the speaking action, not private story details.
- If uncertain, stay in the scene and create one more natural opportunity.

CORRECTION
- Correct selectively and immediately enough to help the current scene.
- For a small error, prefer a brief recast plus retry rather than a lecture.
- If an error blocks the current target, explain the minimum needed in Arabic, point to the currently visible board content if available, and let the learner try again.
- Do not punish accent variation. Prioritize intelligibility and the authored language goal.

FRESH TRANSFER
- When interaction.kind is fresh_transfer, do not give a complete model before the learner's first attempt.
- Do not recreate the earlier guided script. Let the new context test whether the learner can use the lesson language with reduced support.
`.trim();
  }

  subscribe(listener: (state: SceneLessonState) => void) {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  recordLearnerAudioLevel(level: number) {
    if (this.state.completedAt || !Number.isFinite(level)) return;
    if (level >= LEARNER_AUDIO_ACTIVITY_THRESHOLD) this.learnerAudioObserved = true;
  }

  recordAutomaticTranscript(text: string) {
    if (this.state.completedAt) return;
    const current = this.state.scenes[this.currentScene.id];
    current.automaticTranscript = appendTranscript(current.automaticTranscript ?? '', text);
    this.learnerAudioObserved = true;
    this.persistAndEmit();
  }

  /** The UI calls this only after the short lesson welcome was audibly played. */
  markLessonOpeningComplete() {
    if (this.lessonOpeningComplete) return;
    this.lessonOpeningComplete = true;
    this.persistAndEmit();
  }

  /** Playback completion is presentation timing only; scene evidence stays valid until the scene is completed. */
  markPartnerTurnComplete() {
    // Intentionally no curriculum transition and no evidence reset.
  }

  private createInitialState(): SceneLessonState {
    const scenes: Record<string, SceneLessonSceneState> = {};
    this.lesson.scenes.forEach((scene, index) => {
      scenes[scene.id] = {
        status: index === 0 ? 'active' : 'pending',
        evidence: [],
        boardRevealCount: 0,
      };
    });
    return {
      lessonId: this.lesson.id,
      currentSceneId: this.lesson.scenes[0].id,
      scenes,
      updatedAt: new Date().toISOString(),
    };
  }

  private persistAndEmit() {
    this.state.updatedAt = new Date().toISOString();
    const snapshot = this.snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }

  private readyToFinish() {
    return this.lesson.scenes.every((scene) => this.state.scenes[scene.id]?.status === 'met');
  }

  private advanceFrom(sceneId: string) {
    const index = this.lesson.scenes.findIndex((scene) => scene.id === sceneId);
    const next = this.lesson.scenes.slice(index + 1).find(
      (scene) => this.state.scenes[scene.id]?.status !== 'met',
    );
    if (!next) return false;
    this.state.currentSceneId = next.id;
    this.state.scenes[next.id] = {
      ...this.state.scenes[next.id],
      status: 'active',
      automaticTranscript: '',
      boardRevealCount: 0,
    };
    return true;
  }

  private compactState() {
    const scene = this.currentScene;
    const sceneState = this.state.scenes[scene.id];
    const metCount = this.lesson.scenes.filter(
      (item) => this.state.scenes[item.id]?.status === 'met',
    ).length;
    const boardTotal = boardRevealTotal(scene.board);
    const boardVisible = Math.min(sceneState?.boardRevealCount ?? 0, boardTotal);

    return {
      lessonId: this.lesson.id,
      lessonTitle: this.lesson.title,
      primaryPerformance: this.lesson.performance,
      boundaries: this.lesson.boundaries,
      openingRequired: !this.lessonOpeningComplete,
      currentScene: {
        id: scene.id,
        title: scene.title,
        goal: scene.goal,
        teaching: scene.teaching,
        board: scene.board ?? null,
        boardReveal: {
          visibleCount: boardVisible,
          totalCount: boardTotal,
          hasMore: boardVisible < boardTotal,
        },
        interaction: scene.interaction,
      },
      automaticTranscriptHint: sceneState?.automaticTranscript || undefined,
      metCount,
      totalScenes: this.lesson.scenes.length,
      readyToFinish: this.readyToFinish(),
      finished: Boolean(this.state.completedAt),
    };
  }

  private stateTool(): LiveClientTool {
    return {
      declaration: {
        name: 'get_scene_state',
        description: 'Get the authoritative current teaching scene, board reveal progress, and whether the short lesson opening is still required. Call before speaking at lesson start and whenever you lose your place.',
        behavior: 'BLOCKING',
        parameters: { type: 'OBJECT', properties: {} },
      },
      handle: () => ({
        result: this.state.completedAt
          ? 'The scene lesson is already finished.'
          : !this.lessonOpeningComplete
            ? 'Deliver ONLY the short authored lesson opening first. Do not teach or assess currentScene yet. The application will notify you after the welcome was audibly completed.'
            : 'Teach and practise only the currentScene below. Future scenes are hidden and application-owned. Reveal authored board chunks progressively with reveal_board_next.',
        state: this.compactState(),
      }),
    };
  }

  private revealBoardTool(): LiveClientTool {
    return {
      declaration: {
        name: 'reveal_board_next',
        description: 'Presentation-only: reveal exactly the next authored board chunk in the current scene, then continue speaking immediately in the same teacher turn. Never reveal multiple chunks at once.',
        behavior: 'NON_BLOCKING',
        parameters: {
          type: 'OBJECT',
          properties: {
            sceneId: { type: 'STRING', description: 'Exact currentScene.id returned by get_scene_state.' },
          },
          required: ['sceneId'],
        },
      },
      handle: (args) => {
        if (this.state.completedAt) return { finished: true, state: this.compactState() };
        if (!this.lessonOpeningComplete) {
          return {
            error: 'The lesson opening has not audibly completed yet. Do not reveal teaching-board content.',
            state: this.compactState(),
          };
        }
        const scene = this.currentScene;
        if (args.sceneId !== scene.id) {
          return {
            error: 'Stale scene. Call get_scene_state and use only the returned currentScene.',
            state: this.compactState(),
          };
        }
        const total = boardRevealTotal(scene.board);
        if (!total) {
          return {
            error: 'The current scene has no authored board. Continue the scene without board reveal calls.',
            state: this.compactState(),
          };
        }
        const current = this.state.scenes[scene.id];
        if (current.boardRevealCount >= total) {
          return {
            error: 'All authored board chunks are already visible. Continue teaching or practise the current scene.',
            state: this.compactState(),
          };
        }
        const nextIndex = current.boardRevealCount;
        current.boardRevealCount += 1;
        const revealedChunk = boardRevealChunk(scene.board, nextIndex);
        this.persistAndEmit();
        return {
          result: `Revealed board chunk ${current.boardRevealCount} of ${total}. Continue speaking immediately in this same teacher turn. Explain only this newly visible chunk calmly; do not wait merely because the reveal happened.`,
          revealedChunk,
          state: this.compactState(),
        };
      },
    };
  }

  private completeSceneTool(): LiveClientTool {
    return {
      declaration: {
        name: 'complete_scene',
        description: 'Advance the authored lesson ONLY after the learner has genuinely demonstrated every required success criterion in the current scene.',
        behavior: 'BLOCKING',
        parameters: {
          type: 'OBJECT',
          properties: {
            sceneId: { type: 'STRING', description: 'Exact currentScene.id returned by get_scene_state.' },
            responseKind: { type: 'STRING', enum: [...conversationResponseKinds] },
            evidenceSource: { type: 'STRING', enum: ['live_audio', 'automatic_transcript'] },
            evidenceSummary: { type: 'STRING', description: 'Short content-minimized description of what the learner demonstrated.' },
            metCriteria: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Exact successCriteria ids genuinely demonstrated in this scene.',
            },
          },
          required: ['sceneId', 'responseKind', 'evidenceSource', 'evidenceSummary', 'metCriteria'],
        },
      },
      handle: (args) => {
        if (this.state.completedAt) return { finished: true, state: this.compactState() };
        if (!this.lessonOpeningComplete) {
          return {
            error: 'The lesson opening has not audibly completed yet. Do not assess or advance the first scene.',
            state: this.compactState(),
          };
        }
        const scene = this.currentScene;
        if (args.sceneId !== scene.id) {
          return {
            error: 'Stale scene. Call get_scene_state and use only the returned currentScene.',
            state: this.compactState(),
          };
        }

        const boardTotal = boardRevealTotal(scene.board);
        const boardVisible = this.state.scenes[scene.id]?.boardRevealCount ?? 0;
        if (boardTotal && boardVisible < boardTotal) {
          return {
            error: `Scene stays active. The authored board was not fully taught yet (${boardVisible}/${boardTotal} chunks visible). Reveal and teach the remaining chunks progressively.`,
            state: this.compactState(),
          };
        }

        const responseKind = conversationResponseKinds.includes(args.responseKind as ConversationResponseKind)
          ? args.responseKind as ConversationResponseKind
          : null;
        const source = evidenceSources.has(args.evidenceSource as ConversationEvidenceSource)
          ? args.evidenceSource as ConversationEvidenceSource
          : null;
        const summary = typeof args.evidenceSummary === 'string'
          ? args.evidenceSummary.trim().slice(0, 500)
          : '';
        const metCriteria = Array.isArray(args.metCriteria)
          ? args.metCriteria.filter((value): value is string => typeof value === 'string')
          : [];

        if (!responseKind || !source || !summary) {
          return {
            error: 'Invalid scene evidence. Supply a valid response kind, source and concise evidence summary.',
            state: this.compactState(),
          };
        }
        if (!scene.interaction.acceptedResponseKinds.includes(responseKind)) {
          return {
            error: `Scene cannot complete from responseKind=${responseKind}. Continue the authored interaction.`,
            state: this.compactState(),
          };
        }
        if (source === 'live_audio' && !this.learnerAudioObserved) {
          return {
            error: 'No learner microphone activity was observed in the current scene. Do not invent live-audio evidence.',
            state: this.compactState(),
          };
        }
        if (source === 'automatic_transcript' && !this.state.scenes[scene.id]?.automaticTranscript) {
          return {
            error: 'No automatic transcript evidence is available. Stay in the scene and clarify naturally.',
            state: this.compactState(),
          };
        }

        const allowedCriteria = new Set(scene.interaction.successCriteria.map((criterion) => criterion.id));
        const unknownCriteria = metCriteria.filter((criterion) => !allowedCriteria.has(criterion));
        if (unknownCriteria.length) {
          return {
            error: `Unknown success criteria: ${unknownCriteria.join(', ')}. Use only currentScene.successCriteria ids.`,
            state: this.compactState(),
          };
        }
        const requiredCriteria = scene.interaction.successCriteria
          .filter((criterion) => criterion.required !== false)
          .map((criterion) => criterion.id);
        const missingCriteria = requiredCriteria.filter((criterion) => !metCriteria.includes(criterion));
        if (missingCriteria.length) {
          return {
            error: `Scene stays active. Required criteria not yet demonstrated: ${missingCriteria.join(', ')}. Use the authored support ladder and create another natural opportunity.`,
            state: this.compactState(),
          };
        }

        const evidence: SceneLessonEvidence = {
          id: crypto.randomUUID(),
          sceneId: scene.id,
          responseKind,
          source,
          summary,
          metCriteria: [...new Set(metCriteria)],
          recordedAt: new Date().toISOString(),
        };
        const current = this.state.scenes[scene.id];
        current.evidence = [...current.evidence, evidence].slice(-4);
        current.status = 'met';
        current.metAt ??= new Date().toISOString();
        delete current.automaticTranscript;
        this.learnerAudioObserved = false;
        this.advanceFrom(scene.id);
        this.persistAndEmit();

        return {
          result: this.readyToFinish()
            ? 'Scene complete. All authored scenes are now met; call finish_scene_lesson before claiming lesson completion.'
            : 'Scene complete. Continue only from the NEW currentScene returned below. Its board starts hidden again.',
          state: this.compactState(),
        };
      },
    };
  }

  private finishLessonTool(): LiveClientTool {
    return {
      declaration: {
        name: 'finish_scene_lesson',
        description: 'Mandatory final gate. Call only after every authored scene has completed.',
        behavior: 'BLOCKING',
        parameters: { type: 'OBJECT', properties: {} },
      },
      handle: () => {
        if (!this.readyToFinish()) {
          return {
            error: 'Lesson is not complete. Continue only from the current authored scene.',
            state: this.compactState(),
          };
        }
        this.state.completedAt ??= new Date().toISOString();
        markProductLessonCompleted(this.lesson.id);
        this.persistAndEmit();
        return {
          result: 'Lesson complete. Give one short warm closing in Arabic with the key English win, then stop teaching. Do not add another test.',
          finished: true,
          state: this.compactState(),
        };
      },
    };
  }
}
