import type { LiveClientTool } from '../live/tools';
import type { SupportBoard } from '../presentation/types';
import { markProductLessonCompleted, markProductLessonStarted } from '../productV2/progress';
import type {
  SceneLessonDefinition,
  SceneLessonEvidence,
  SceneLessonScene,
  SceneLessonSceneState,
  SceneLessonState,
} from './types';

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

function compactString(value: unknown, max = 180) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export class SceneLessonRuntime {
  readonly tools: readonly LiveClientTool[];
  private state: SceneLessonState;
  private learnerAudioObserved = false;
  private lessonOpeningComplete = false;
  private activeBoard: SupportBoard | null = null;
  private readonly listeners = new Set<(state: SceneLessonState) => void>();
  private readonly onBoardChange?: (board: SupportBoard | null) => void;

  constructor(
    readonly lesson: SceneLessonDefinition,
    options: {
      onStateChange?: (state: SceneLessonState) => void;
      onBoardChange?: (board: SupportBoard | null) => void;
    } = {},
  ) {
    if (!lesson.scenes.length) throw new Error('Scene lesson requires at least one scene.');
    this.state = this.createInitialState();
    if (options.onStateChange) this.listeners.add(options.onStateChange);
    this.onBoardChange = options.onBoardChange;
    markProductLessonStarted(lesson.id);
    this.tools = [this.completeSceneTool(), this.showBoardTool()];
  }

  get snapshot(): SceneLessonState {
    return clone(this.state);
  }

  get currentScene(): SceneLessonScene {
    return this.lesson.scenes.find((scene) => scene.id === this.state.currentSceneId)
      ?? this.lesson.scenes[0];
  }

  get currentBoard(): SupportBoard | null {
    return this.activeBoard;
  }

  get systemPrompt() {
    return `
You are delivering one authored Englotti lesson as a natural live lesson with very small application-owned scenes.

LESSON
${this.lesson.levelId.toUpperCase()} · ${this.lesson.unitTitle} · ${this.lesson.title}
Primary learner performance: ${this.lesson.performance}
Core language: ${this.lesson.coreLanguage.join('; ')}

YOUR JOB
- Teach ONLY the CURRENT SCENE shown below.
- Each scene is intentionally small: one teaching idea and one short interaction.
- Explain mostly in concise Egyptian Arabic. Keep target English, models and roleplay in English.
- Teach calmly, then let the learner USE the target. Do not ask abstract "did you understand?" questions when successful use can show understanding.
- If the learner struggles, use the scene support ladder from lightest to strongest support and let them retry.
- Correct only what helps the current target. Keep the interaction human and conversational.
- Do not invent future curriculum, preview hidden scenes, or expand into unrelated grammar/vocabulary.

SCENE COMPLETION
- The application does NOT grade semantic criteria for you. You are the live teacher making the pedagogical decision.
- Stay in the scene until the learner can use the scene target successfully enough in the intended interaction.
- When you are genuinely satisfied, call complete_scene with one short content-minimized summary of what the learner could do.
- complete_scene has only a mechanical safeguard: the app must have observed real learner voice activity in this scene.
- If complete_scene is rejected because no learner voice was observed, ask for a spoken attempt and continue naturally.
- After complete_scene succeeds, immediately follow ONLY the nextScene returned by the tool. Do not continue the old scene.
- If the tool says lessonComplete=true, give one short warm closing and stop teaching.

BOARD
- The authored board for the CURRENT SCENE appears automatically. You do not need a tool to reveal it.
- The board is support, never a completion gate.
- If extra visual explanation would genuinely help, you may call show_board.
- show_board REPLACES the current board; it never appends to it.
- show_board may contain only 1–4 short items and must stay inside the current scene language. Never introduce a new curriculum target through the board.
- Prefer the authored board unless the learner actually needs another example, a tiny comparison, or a simpler note.

TEXT CHAT AND QUICK HELP
- Typed learner chat and quick-help actions can be used for clarification, but they are not spoken evidence.
- If typed text answers the speaking task, acknowledge it and ask the learner to say the answer aloud before completing the scene.
- "مش فاهم" means explain the current point again more simply in Egyptian Arabic.
- "عيد تاني" means repeat the last point more slowly.
- "مثال تاني" means give one short example using only current-scene language.

OPENING
- Your FIRST audible turn is only a short human welcome in Egyptian Arabic: greet the learner, say today's lesson title and practical outcome, explain that you will go step by step, and reassure them briefly about mistakes.
- Keep it around 15–25 seconds and stop. Do NOT begin the current scene in the same turn.
- The application will then tell you to begin the CURRENT SCENE.

CURRENT SCENE
${JSON.stringify(this.scenePayload(this.currentScene), null, 2)}
`.trim();
  }

  recordLearnerAudioLevel(level: number) {
    if (this.state.completedAt || !Number.isFinite(level)) return;
    if (level >= LEARNER_AUDIO_ACTIVITY_THRESHOLD) this.learnerAudioObserved = true;
  }

  recordAutomaticTranscript(text: string) {
    if (this.state.completedAt) return;
    const current = this.state.scenes[this.currentScene.id];
    current.automaticTranscript = appendTranscript(current.automaticTranscript ?? '', text);
    if (text.trim()) this.learnerAudioObserved = true;
    this.persistAndEmit();
  }

  /** Called only after the welcome was actually played to the learner. */
  markLessonOpeningComplete() {
    if (this.lessonOpeningComplete) return;
    this.lessonOpeningComplete = true;
    this.showAuthoredBoard();
    this.persistAndEmit();
  }

  /** Presentation timing only; no curriculum transition happens on playback completion. */
  markPartnerTurnComplete() {}

  private createInitialState(): SceneLessonState {
    const scenes: Record<string, SceneLessonSceneState> = {};
    this.lesson.scenes.forEach((scene, index) => {
      scenes[scene.id] = {
        status: index === 0 ? 'active' : 'pending',
        evidence: [],
      };
    });
    return {
      lessonId: this.lesson.id,
      currentSceneId: this.lesson.scenes[0].id,
      scenes,
      updatedAt: new Date().toISOString(),
    };
  }

  private scenePayload(scene: SceneLessonScene) {
    return {
      id: scene.id,
      title: scene.title,
      goal: scene.goal,
      teaching: scene.teaching,
      interaction: scene.interaction,
      authoredBoard: scene.board ?? null,
    };
  }

  private showAuthoredBoard() {
    this.activeBoard = this.currentScene.board ?? null;
    this.onBoardChange?.(this.activeBoard ? clone(this.activeBoard) : null);
  }

  private persistAndEmit() {
    this.state.updatedAt = new Date().toISOString();
    const snapshot = this.snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }

  private advanceFrom(sceneId: string) {
    const index = this.lesson.scenes.findIndex((scene) => scene.id === sceneId);
    const next = this.lesson.scenes[index + 1];
    if (!next) return false;
    this.state.currentSceneId = next.id;
    this.state.scenes[next.id] = {
      ...this.state.scenes[next.id],
      status: 'active',
      automaticTranscript: '',
    };
    this.learnerAudioObserved = false;
    this.showAuthoredBoard();
    return true;
  }

  private completeSceneTool(): LiveClientTool {
    return {
      declaration: {
        name: 'complete_scene',
        description: 'Complete the current tiny teaching scene when, as the live teacher, you are satisfied the learner can use its target successfully enough in the intended interaction.',
        behavior: 'BLOCKING',
        parameters: {
          type: 'OBJECT',
          properties: {
            summary: {
              type: 'STRING',
              description: 'One short content-minimized summary of what the learner successfully understood or used in this scene.',
            },
          },
          required: ['summary'],
        },
      },
      handle: (args) => {
        if (this.state.completedAt) {
          return { lessonComplete: true, result: 'The lesson is already complete.' };
        }
        if (!this.lessonOpeningComplete) {
          return {
            error: 'The spoken lesson opening has not finished yet.',
            nextAction: 'Finish the short welcome first; do not assess the scene yet.',
          };
        }
        if (!this.learnerAudioObserved) {
          return {
            error: 'No real learner voice activity has been observed in this scene.',
            nextAction: 'Ask the learner for one spoken attempt on the current scene target, listen, help if needed, then decide again.',
            currentScene: this.scenePayload(this.currentScene),
          };
        }
        const summary = compactString(args.summary, 360);
        if (!summary) {
          return {
            error: 'A short teacher summary is required.',
            nextAction: 'Summarize what the learner could actually use, then call complete_scene again.',
            currentScene: this.scenePayload(this.currentScene),
          };
        }

        const scene = this.currentScene;
        const evidence: SceneLessonEvidence = {
          id: crypto.randomUUID(),
          sceneId: scene.id,
          summary,
          recordedAt: new Date().toISOString(),
        };
        const current = this.state.scenes[scene.id];
        current.evidence = [...current.evidence, evidence].slice(-3);
        current.status = 'met';
        current.metAt ??= new Date().toISOString();
        delete current.automaticTranscript;
        this.learnerAudioObserved = false;

        if (this.advanceFrom(scene.id)) {
          this.persistAndEmit();
          return {
            result: 'Scene complete. Move directly into the next tiny scene and teach only that scene.',
            completedSceneId: scene.id,
            lessonComplete: false,
            nextScene: this.scenePayload(this.currentScene),
          };
        }

        this.state.completedAt ??= new Date().toISOString();
        this.activeBoard = null;
        this.onBoardChange?.(null);
        markProductLessonCompleted(this.lesson.id);
        this.persistAndEmit();
        return {
          result: 'Lesson complete. Give one short warm closing in Arabic that mentions the practical English win, then stop.',
          completedSceneId: scene.id,
          lessonComplete: true,
        };
      },
    };
  }

  private showBoardTool(): LiveClientTool {
    return {
      declaration: {
        name: 'show_board',
        description: 'Replace the current board with one small visual support for the CURRENT scene only. Use only when extra visual explanation genuinely helps.',
        behavior: 'NON_BLOCKING',
        parameters: {
          type: 'OBJECT',
          properties: {
            mode: { type: 'STRING', enum: ['note', 'examples', 'compare'] },
            title: { type: 'STRING' },
            items: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'One to four short board items. compare requires exactly two.',
            },
          },
          required: ['mode', 'title', 'items'],
        },
      },
      handle: (args) => {
        if (this.state.completedAt) return { error: 'The lesson is already complete.' };
        if (!this.lessonOpeningComplete) return { error: 'Do not show teaching-board content during the welcome.' };

        const mode = args.mode === 'note' || args.mode === 'examples' || args.mode === 'compare'
          ? args.mode
          : null;
        const title = compactString(args.title, 80);
        const items = Array.isArray(args.items)
          ? args.items.map((item) => compactString(item, 120)).filter(Boolean).slice(0, 4)
          : [];
        if (!mode || !title || !items.length) {
          return { error: 'show_board requires a valid mode, short title, and 1–4 short items.' };
        }
        if (mode === 'compare' && items.length !== 2) {
          return { error: 'compare mode requires exactly two short items.' };
        }

        const board: SupportBoard = mode === 'note'
          ? { type: 'note', title, body: items.join(' · ') }
          : mode === 'compare'
            ? { type: 'compare', title, left: { title: items[0] }, right: { title: items[1] } }
            : { type: 'examples', title, items: items.map((item) => ({ title: item })) };

        this.activeBoard = board;
        this.onBoardChange?.(clone(board));
        return {
          result: 'Board replaced. Explain this visual support briefly, then continue the SAME current scene.',
          board,
          currentSceneId: this.currentScene.id,
        };
      },
    };
  }
}
