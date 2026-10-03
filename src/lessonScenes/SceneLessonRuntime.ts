import { recordRuntimeSceneCompletion } from '../cloud/sessionBridge';
import type { LiveClientTool } from '../live/tools';
import type { SupportBoard } from '../presentation/types';
import { markProductLessonCompleted, markProductLessonStarted } from '../productV2/progress';
import type {
  SceneEvidenceType,
  SceneLessonDefinition,
  SceneLessonEvidence,
  SceneLessonScene,
  SceneLessonSceneState,
  SceneLessonState,
  SceneSupportUsed,
} from './types';
import { sceneVerificationContract } from './verification';

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

function parseEvidenceType(value: unknown): SceneEvidenceType | null {
  if (
    value === 'independent_production'
    || value === 'receptive_comprehension'
    || value === 'multi_turn_interaction'
    || value === 'delayed_retrieval'
    || value === 'integrated_support'
  ) return value;
  return null;
}

function parseSupportUsed(value: unknown): SceneSupportUsed | null {
  if (value === 'none' || value === 'light' || value === 'strong' || value === 'full_model') return value;
  return null;
}

export class SceneLessonRuntime {
  readonly tools: readonly LiveClientTool[];
  private state: SceneLessonState;
  private learnerAudioObserved = false;
  private lessonOpeningComplete = false;
  private activeBoard: SupportBoard | null = null;
  private readonly listeners = new Set<(state: SceneLessonState) => void>();
  private readonly onBoardChange?: (board: SupportBoard | null) => void;
  private readonly policyPrompt: string;
  private readonly adaptiveContext: string;
  private readonly resumedFromCheckpoint: boolean;

  constructor(
    readonly lesson: SceneLessonDefinition,
    options: {
      onStateChange?: (state: SceneLessonState) => void;
      onBoardChange?: (board: SupportBoard | null) => void;
      policyPrompt?: string;
      adaptiveContext?: string;
      restoredState?: SceneLessonState | null;
    } = {},
  ) {
    if (!lesson.scenes.length) throw new Error('Scene lesson requires at least one scene.');
    this.state = this.createInitialState(options.restoredState ?? null);
    this.resumedFromCheckpoint = Boolean(
      options.restoredState
      && Object.values(options.restoredState.scenes).some((scene) => scene.status === 'met'),
    );
    if (options.onStateChange) this.listeners.add(options.onStateChange);
    this.onBoardChange = options.onBoardChange;
    this.policyPrompt = options.policyPrompt?.trim() ?? '';
    this.adaptiveContext = options.adaptiveContext?.trim() ?? '';
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

  get isResuming() {
    return this.resumedFromCheckpoint;
  }

  get completedSceneCount() {
    return this.lesson.scenes.filter((scene) => this.state.scenes[scene.id]?.status === 'met').length;
  }

  get systemPrompt() {
    const publishedPolicy = this.policyPrompt
      ? `\nPUBLISHED TEACHING POLICY\n${this.policyPrompt}\n`
      : '';
    const adaptive = this.adaptiveContext
      ? `\n${this.adaptiveContext}\n`
      : '';
    const opening = this.resumedFromCheckpoint
      ? `
RESUME OPENING
- This session is resuming an interrupted lesson. Please avoid repeating the original welcome, lesson overview, or already completed scenes.
- For the first audible turn, a short Egyptian-Arabic reconnection such as "رجعنا، نكمل من هنا." is enough. Mention the current practical point in a few words, then stop.
- The application will then invite you to continue the CURRENT SCENE.
`
      : `
OPENING
- For the first audible turn, please give only a short human welcome in Egyptian Arabic: greet the learner, say today's lesson title and practical outcome, explain that you will go step by step, and reassure them briefly about mistakes.
- Around 15–25 seconds is ideal. Please stop before beginning the current scene in the same turn.
- The application will then invite you to begin the CURRENT SCENE.
`;

    return `
You are delivering one authored Englotti lesson as a natural live lesson with very small application-owned scenes. We rely on your judgement and teaching skill to make those scenes feel like one coherent human conversation.
${publishedPolicy}${adaptive}
LESSON
${this.lesson.levelId.toUpperCase()} · ${this.lesson.unitTitle} · ${this.lesson.title}
Primary learner performance: ${this.lesson.performance}
Core language: ${this.lesson.coreLanguage.join('; ')}

YOUR ROLE
- Please keep your teaching focused on the CURRENT SCENE shown below. Each scene is intentionally small: one teaching idea and one short interaction.
- Explanations are mainly concise Egyptian Arabic, while target English, models and roleplay remain in English.
- A calm teach-then-use rhythm works well. When successful use can show understanding, it is more useful than an abstract "did you understand?" question.
- If the learner struggles, the authored support ladder is available from lightest to strongest support. After answer-bearing help, a changed retry is especially valuable.
- Corrections should stay focused on the current target so the interaction remains human and conversational.
- Please leave future curriculum and hidden scenes for later rather than expanding into unrelated grammar or vocabulary.
- Micro-scene boundaries are internal. The learner should experience a smooth lesson, not a sequence of announced mini-tests.

SCENE COMPLETION — TEACHER JUDGEMENT
- The application deliberately does not grade semantic success. You are the live teacher making that decision, and we trust you to use the CURRENT SCENE verification contract carefully.
- Before calling complete_scene, please take a brief silent evidence audit against what the learner actually said and did in this scene.
- Participation alone is not target evidence. A ready/yes/okay/mhm response can be friendly and useful, but it should not justify completion unless it actually performs the scene goal.
- If you supplied the answer or a full English model, immediate learner repetition is useful practice rather than independent proof. A changed context and fresher attempt provide stronger evidence.
- If your latest feedback still described the learner response as incorrect, incomplete, inappropriate, or needing guidance, please continue teaching and invite another attempt before completion.
- For scenes whose goal is sustained interaction, please count actual learner turns rather than teacher turns. One good learner sentence should not be summarised as a multi-turn performance.
- For receptive scenes, accurate understanding is the evidence; production is optional unless the scene explicitly asks for it. Partial answers should be described as partial until the missing requested meaning/fact is resolved.
- complete_scene asks for a small structured self-audit. These fields are for your reflection and for review logs; the application does not use them to semantically overrule your judgement.
- Once you are genuinely satisfied, please call complete_scene. If it succeeds, follow only the nextScene returned by the tool and let the transition feel natural rather than announcing a new chapter.
- If the tool says lessonComplete=true, one short warm closing is enough.

BOARD
- The authored board for the CURRENT SCENE appears automatically, so you do not need a tool simply to reveal it.
- The board is support rather than a completion gate.
- If another visual would genuinely help, show_board can replace the current board with one small note, example set, or comparison that stays inside the current scene language.
- The authored board is usually preferable unless the learner really needs a simpler example or tiny comparison.

TEXT CHAT AND QUICK HELP
- Typed learner chat and quick-help actions can clarify the lesson, but they are not spoken evidence.
- If typed text answers a speaking task, please acknowledge it and invite the learner to say the answer aloud before completion.
- "مش فاهم" means the learner would like the current point explained more simply in Egyptian Arabic.
- "عيد تاني" means repeat the last point more slowly.
- "مثال تاني" means give one short example using only current-scene language.
${opening}
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

  markLessonOpeningComplete() {
    if (this.lessonOpeningComplete) return;
    this.lessonOpeningComplete = true;
    this.showAuthoredBoard();
    this.persistAndEmit();
  }

  markPartnerTurnComplete() {}

  private createInitialState(restored: SceneLessonState | null): SceneLessonState {
    const scenes: Record<string, SceneLessonSceneState> = {};
    for (const scene of this.lesson.scenes) {
      const previous = restored?.lessonId === this.lesson.id ? restored.scenes[scene.id] : undefined;
      const met = previous?.status === 'met';
      scenes[scene.id] = {
        status: met ? 'met' : 'pending',
        evidence: met ? clone(previous?.evidence ?? []) : [],
        metAt: met ? previous?.metAt : undefined,
      };
    }

    const restoredCurrent = restored?.lessonId === this.lesson.id
      && this.lesson.scenes.some((scene) => scene.id === restored.currentSceneId)
      ? restored.currentSceneId
      : null;
    const firstUnmet = this.lesson.scenes.find((scene) => scenes[scene.id].status !== 'met')?.id;
    const currentSceneId = restoredCurrent && scenes[restoredCurrent]?.status !== 'met'
      ? restoredCurrent
      : firstUnmet ?? this.lesson.scenes.at(-1)!.id;

    if (!restored?.completedAt) scenes[currentSceneId].status = 'active';

    return {
      lessonId: this.lesson.id,
      currentSceneId,
      scenes,
      completedAt: restored?.completedAt,
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
      verification: sceneVerificationContract(this.lesson.id, scene.id, scene.interaction.kind),
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
        description: 'Complete the current tiny teaching scene only after your own brief evidence audit says the learner has met the CURRENT SCENE verification contract. The application trusts your pedagogical judgement; these fields help you reflect accurately rather than acting as a semantic grader.',
        behavior: 'BLOCKING',
        parameters: {
          type: 'OBJECT',
          properties: {
            evidenceType: {
              type: 'STRING',
              enum: [
                'independent_production',
                'receptive_comprehension',
                'multi_turn_interaction',
                'delayed_retrieval',
                'integrated_support',
              ],
              description: 'Choose the evidence category that best matches what the learner actually demonstrated in this scene.',
            },
            supportUsed: {
              type: 'STRING',
              enum: ['none', 'light', 'strong', 'full_model'],
              description: 'The strongest answer-bearing support you used before the evidence that justified completion. If a full model was used earlier, report full_model even when a later fresh retry succeeded.',
            },
            freshIndependentRetry: {
              type: 'BOOLEAN',
              description: 'True only if, after answer-bearing help or a full model, the learner later succeeded again in a changed context with substantially less support. If no answer-bearing help was needed, false is fine.',
            },
            learnerTurnsObserved: {
              type: 'INTEGER',
              description: 'Number of learner speaking turns that materially contributed to the evidence. Please count learner turns only, not teacher turns or generic ready/okay acknowledgements.',
            },
            summary: {
              type: 'STRING',
              description: 'One short content-minimized factual summary of what the learner actually understood or used. Please do not upgrade one turn into multi-turn performance or attribute teacher language to the learner.',
            },
          },
          required: ['evidenceType', 'supportUsed', 'freshIndependentRetry', 'learnerTurnsObserved', 'summary'],
        },
      },
      handle: (args) => {
        if (this.state.completedAt) {
          return { lessonComplete: true, result: 'The lesson is already complete.' };
        }
        if (!this.lessonOpeningComplete) {
          return {
            error: 'The spoken lesson opening has not finished yet.',
            nextAction: 'Please finish the short welcome first and assess the scene afterwards.',
          };
        }
        if (!this.learnerAudioObserved) {
          return {
            error: 'No real learner voice activity has been observed in this scene.',
            nextAction: 'Please invite a spoken attempt on the current scene target, listen, support if needed, and then make the pedagogical decision.',
            currentScene: this.scenePayload(this.currentScene),
          };
        }

        const evidenceType = parseEvidenceType(args.evidenceType);
        const supportUsed = parseSupportUsed(args.supportUsed);
        const freshIndependentRetry = typeof args.freshIndependentRetry === 'boolean'
          ? args.freshIndependentRetry
          : null;
        const learnerTurnsObserved = typeof args.learnerTurnsObserved === 'number'
          && Number.isInteger(args.learnerTurnsObserved)
          && args.learnerTurnsObserved >= 0
          ? args.learnerTurnsObserved
          : null;
        const summary = compactString(args.summary, 360);

        if (!evidenceType || !supportUsed || freshIndependentRetry === null || learnerTurnsObserved === null || !summary) {
          return {
            error: 'The teacher evidence audit is incomplete.',
            nextAction: 'Please complete the factual self-audit fields from what actually happened in the current scene, then decide again. The application is not judging the learner semantically.',
            currentScene: this.scenePayload(this.currentScene),
          };
        }

        const scene = this.currentScene;
        const sceneIndex = this.lesson.scenes.findIndex((value) => value.id === scene.id);
        const evidence: SceneLessonEvidence = {
          id: crypto.randomUUID(),
          sceneId: scene.id,
          summary,
          evidenceType,
          supportUsed,
          freshIndependentRetry,
          learnerTurnsObserved,
          recordedAt: new Date().toISOString(),
        };
        const current = this.state.scenes[scene.id];
        current.evidence = [...current.evidence, evidence].slice(-3);
        current.status = 'met';
        current.metAt ??= new Date().toISOString();
        delete current.automaticTranscript;
        this.learnerAudioObserved = false;

        if (this.advanceFrom(scene.id)) {
          recordRuntimeSceneCompletion({
            lessonId: this.lesson.id,
            sceneId: scene.id,
            sceneIndex,
            summary,
            lessonComplete: false,
          });
          this.persistAndEmit();
          return {
            result: 'Scene complete. Thank you for the careful evidence check. Please continue naturally with the next tiny scene and use only the nextScene below.',
            completedSceneId: scene.id,
            lessonComplete: false,
            nextScene: this.scenePayload(this.currentScene),
          };
        }

        this.state.completedAt ??= new Date().toISOString();
        this.activeBoard = null;
        this.onBoardChange?.(null);
        markProductLessonCompleted(this.lesson.id);
        recordRuntimeSceneCompletion({
          lessonId: this.lesson.id,
          sceneId: scene.id,
          sceneIndex,
          summary,
          lessonComplete: true,
        });
        this.persistAndEmit();
        return {
          result: 'Lesson complete. Thank you for the careful teaching. Please give one short warm Arabic closing that mentions the practical English win, then stop.',
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
        description: 'Replace the current board with one small visual support for the CURRENT scene only when another visual explanation would genuinely help.',
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
        if (!this.lessonOpeningComplete) return { error: 'Please keep teaching-board content for after the welcome.' };

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
        this.onBoardChange?.(this.activeBoard ? clone(this.activeBoard) : null);
        return {
          result: 'Board replaced. Please explain this visual support briefly, then continue the SAME current scene.',
          board,
          currentSceneId: this.currentScene.id,
        };
      },
    };
  }
}
