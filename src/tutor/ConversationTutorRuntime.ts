import type { LiveClientTool } from '../live/tools';
import {
  conversationResponseKinds,
  type ConversationEvidence,
  type ConversationEvidenceSource,
  type ConversationMission,
  type ConversationMissionState,
  type ConversationObjective,
  type ConversationResponseKind,
  type ConversationRubricVerdict,
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
  if (!previous) return next;
  if (next.startsWith(previous)) return next.slice(0, 1200);
  if (previous.endsWith(next)) return previous;
  return `${previous} ${next}`.trim().slice(-1200);
}

export class ConversationTutorRuntime {
  readonly tools: readonly LiveClientTool[];
  private state: ConversationMissionState;
  private learnerAudioObserved = false;
  private readonly listeners = new Set<(state: ConversationMissionState) => void>();

  constructor(
    readonly mission: ConversationMission,
    options: { onStateChange?: (state: ConversationMissionState) => void } = {},
  ) {
    if (!mission.objectives.length) throw new Error('Conversation mission requires at least one objective.');
    this.state = {
      missionId: mission.id,
      currentObjectiveId: mission.objectives[0].id,
      objectives: Object.fromEntries(
        mission.objectives.map((objective, index) => [
          objective.id,
          { status: index === 0 ? 'active' : 'pending', evidence: [] },
        ]),
      ),
      updatedAt: new Date().toISOString(),
    };
    if (options.onStateChange) this.listeners.add(options.onStateChange);
    this.tools = [this.stateTool(), this.assessmentTool(), this.finishTool()];
  }

  get snapshot() {
    return clone(this.state);
  }

  get currentObjective(): ConversationObjective {
    return this.mission.objectives.find((objective) => objective.id === this.state.currentObjectiveId)
      ?? this.mission.objectives[0];
  }

  get systemPrompt() {
    return `
You are running a live English conversation mission. The application owns progression and evidence; you do not.
Mission: ${this.mission.title}
Level: ${this.mission.level}
Purpose: ${this.mission.purpose}
Scenario: ${this.mission.scenario}

MISSION LOOP
- Before the first spoken turn, call get_mission_state.
- Keep the exchange natural. The learner should feel like they are having a conversation, not being marched through a rubric.
- Work only toward the currentObjective returned by the tool. Future objectives are intentionally hidden.
- After any content-bearing learner turn that answers or attempts the current objective, call assess_current_objective BEFORE you respond to that turn.
- Do not assess greetings, filler, silence, room noise, a request for help, or a side question as successful evidence unless the current objective explicitly accepts that conversational action.
- If assessment passes, continue from the NEW currentObjective returned by the tool. Never advance from memory.
- If assessment stays, repair only the missing gap and create another natural chance to demonstrate it.
- Side questions are welcome. Answer briefly, then return to the same objective.
- When state says readyToFinish=true, call finish_mission before claiming the mission is complete.

EVIDENCE
- You hear live audio directly. Automatic transcription is only an approximate audit hint and can be wrong.
- Use evidenceSource=live_audio when the learner meaning is clear from speech even if the transcript is poor or absent.
- The application independently requires observed microphone activity before it will accept live_audio evidence.
- evidenceSummary must describe what the learner actually demonstrated, not quote an invented transcript.
- Never pass an objective because the learner used one keyword. Judge the communicative action and meaning.
- If uncertain, ask a natural clarification and stay on the current objective.

TEACHING STYLE
- Conversation first. Short turns, relevant follow-ups, no lecture voice.
- Correct selectively. Prefer natural recasts or clarification during the conversation; do not interrupt every mistake.
- You may use present_support when a brief visual would genuinely help. It is optional support, never the curriculum state.
- Never expose objective IDs, tool names, evidence fields, rubrics, or internal progression mechanics to the learner.
`.trim();
  }

  subscribe(listener: (state: ConversationMissionState) => void) {
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
    const objective = this.currentObjective;
    const current = this.state.objectives[objective.id];
    current.automaticTranscript = appendTranscript(current.automaticTranscript ?? '', text);
    this.learnerAudioObserved = true;
    this.persistAndEmit();
  }

  markPartnerTurnComplete() {
    this.learnerAudioObserved = false;
    if (this.state.completedAt) return;
    const current = this.state.objectives[this.currentObjective.id];
    if (current?.automaticTranscript) {
      current.automaticTranscript = '';
      this.persistAndEmit();
    }
  }

  private persistAndEmit() {
    this.state.updatedAt = new Date().toISOString();
    const snapshot = this.snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }

  private compactState() {
    const objective = this.currentObjective;
    const objectiveState = this.state.objectives[objective.id];
    const metCount = this.mission.objectives.filter(
      (item) => this.state.objectives[item.id]?.status === 'met',
    ).length;
    return {
      missionId: this.mission.id,
      missionTitle: this.mission.title,
      level: this.mission.level,
      scenario: this.mission.scenario,
      currentObjective: {
        id: objective.id,
        title: objective.title,
        capability: objective.capability,
        brief: objective.brief,
        successEvidence: objective.successEvidence,
        acceptedResponseKinds: objective.acceptedResponseKinds,
        repairHints: objective.repairHints ?? [],
        allowBoard: objective.allowBoard !== false,
      },
      automaticTranscriptHint: objectiveState?.automaticTranscript || undefined,
      evidence: objectiveState?.evidence.slice(-4) ?? [],
      metCount,
      totalObjectives: this.mission.objectives.length,
      readyToFinish: metCount === this.mission.objectives.length,
      finished: Boolean(this.state.completedAt),
    };
  }

  private advanceFrom(objectiveId: string) {
    const index = this.mission.objectives.findIndex((objective) => objective.id === objectiveId);
    const next = this.mission.objectives.slice(index + 1).find(
      (objective) => this.state.objectives[objective.id]?.status !== 'met',
    );
    if (!next) return;
    this.state.currentObjectiveId = next.id;
    this.state.objectives[next.id] = {
      ...this.state.objectives[next.id],
      status: 'active',
      automaticTranscript: '',
    };
  }

  private stateTool(): LiveClientTool {
    return {
      declaration: {
        name: 'get_mission_state',
        description: 'Get the authoritative current conversation objective. Call before speaking at mission start and whenever you lose your place.',
        behavior: 'BLOCKING',
        parameters: { type: 'OBJECT', properties: {} },
      },
      handle: () => ({
        result: this.state.completedAt
          ? 'Mission is already finished.'
          : 'Use only the current objective below. Keep the curriculum invisible inside a natural conversation.',
        state: this.compactState(),
      }),
    };
  }

  private assessmentTool(): LiveClientTool {
    return {
      declaration: {
        name: 'assess_current_objective',
        description: 'Semantically assess the learner’s current voice turn before responding when that turn answers or attempts the current objective.',
        behavior: 'BLOCKING',
        parameters: {
          type: 'OBJECT',
          properties: {
            objectiveId: { type: 'STRING', description: 'Exact currentObjective.id returned by get_mission_state.' },
            decision: { type: 'STRING', enum: ['pass', 'stay'] },
            responseKind: { type: 'STRING', enum: [...conversationResponseKinds] },
            rubricVerdict: { type: 'STRING', enum: ['meets', 'partial', 'does_not_meet'] },
            evidenceSource: { type: 'STRING', enum: ['live_audio', 'automatic_transcript'] },
            evidenceSummary: { type: 'STRING', description: 'Short semantic summary of what the learner actually demonstrated.' },
            misconception: { type: 'STRING', description: 'Optional concise gap that still needs repair.' },
          },
          required: ['objectiveId', 'decision', 'responseKind', 'rubricVerdict', 'evidenceSource', 'evidenceSummary'],
        },
      },
      handle: (args) => {
        if (this.state.completedAt) return { finished: true, state: this.compactState() };
        const objective = this.currentObjective;
        if (args.objectiveId !== objective.id) {
          return { error: 'Stale objective. Call get_mission_state and use the returned currentObjective.', state: this.compactState() };
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
        const summary = typeof args.evidenceSummary === 'string' ? args.evidenceSummary.trim().slice(0, 800) : '';
        const misconception = typeof args.misconception === 'string' ? args.misconception.trim().slice(0, 240) : '';

        if ((decision !== 'pass' && decision !== 'stay') || !responseKind || !rubricVerdict || !source || !summary) {
          return { error: 'Invalid assessment. Supply the required semantic evidence fields.', state: this.compactState() };
        }
        if (source === 'live_audio' && !this.learnerAudioObserved) {
          return { error: 'No learner microphone activity was observed for this turn. Do not invent live-audio evidence.', state: this.compactState() };
        }
        if (source === 'automatic_transcript' && !this.state.objectives[objective.id]?.automaticTranscript) {
          return { error: 'No automatic transcript evidence is available. Use live_audio only if the spoken meaning was clear and learner audio was observed; otherwise clarify.', state: this.compactState() };
        }
        if (decision === 'pass' && !objective.acceptedResponseKinds.includes(responseKind)) {
          return { error: `Pass rejected: ${responseKind} is not valid evidence for this objective.`, state: this.compactState() };
        }
        if (decision === 'pass' && rubricVerdict !== 'meets') {
          return { error: 'Pass rejected: the evidence does not yet meet the authored success evidence.', state: this.compactState() };
        }

        const evidence: ConversationEvidence = {
          id: crypto.randomUUID(),
          objectiveId: objective.id,
          responseKind,
          rubricVerdict,
          source,
          summary,
          ...(misconception ? { misconception } : {}),
          recordedAt: new Date().toISOString(),
        };
        const current = this.state.objectives[objective.id];
        current.evidence = [...current.evidence, evidence].slice(-8);
        this.learnerAudioObserved = false;

        if (decision === 'pass') {
          current.status = 'met';
          current.metAt = current.metAt ?? new Date().toISOString();
          this.advanceFrom(objective.id);
        }
        this.persistAndEmit();
        const readyToFinish = this.mission.objectives.every(
          (item) => this.state.objectives[item.id]?.status === 'met',
        );
        return {
          result: decision === 'pass'
            ? readyToFinish
              ? 'Objective passed. All objectives now have evidence; call finish_mission before closing.'
              : 'Objective passed. Continue only from the new currentObjective returned below.'
            : 'Objective stays active. Repair the specific gap briefly and create another natural opportunity.',
          state: this.compactState(),
        };
      },
    };
  }

  private finishTool(): LiveClientTool {
    return {
      declaration: {
        name: 'finish_mission',
        description: 'Mandatory completion gate. Call only when every authored objective has valid evidence.',
        behavior: 'BLOCKING',
        parameters: { type: 'OBJECT', properties: {} },
      },
      handle: () => {
        const unresolved = this.mission.objectives.filter(
          (objective) => this.state.objectives[objective.id]?.status !== 'met',
        );
        if (unresolved.length) {
          return {
            error: 'Mission is not complete. Continue from the current objective.',
            unresolved: unresolved.map((objective) => ({ id: objective.id, title: objective.title })),
            state: this.compactState(),
          };
        }
        this.state.completedAt ??= new Date().toISOString();
        this.persistAndEmit();
        return {
          result: 'Mission complete. Give one brief natural closing line; do not add another test.',
          finished: true,
          state: this.compactState(),
        };
      },
    };
  }
}
