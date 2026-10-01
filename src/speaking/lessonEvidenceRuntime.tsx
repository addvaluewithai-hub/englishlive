import { useRef, useState } from 'react';
import type { LiveClientTool } from '../live/tools';
import {
  createLessonEvidenceState,
  speakingLessonContractByScenarioId,
  summarizeLessonEvidence,
  type LessonEvidenceLevel,
  type LessonEvidenceState,
} from './lessonContracts';
import { markA1SpeakingPilotLessonComplete } from './roadmapProgress';
import { useRound2PracticeRuntime } from './round2PracticeRuntime';

function normalizedEvidence(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

export function useLessonEvidenceRuntime(scenarioId: string) {
  const contract = speakingLessonContractByScenarioId(scenarioId);
  // Learn V2 A1 guided conversations only reach this runtime in Round 2;
  // Round 1 uses GuidedSpeakingLiveScreen and has no lesson evidence runtime.
  const round2 = useRound2PracticeRuntime(scenarioId, true);
  const evidenceRef = useRef<LessonEvidenceState>(createLessonEvidenceState(contract));
  const [evidence, setEvidence] = useState<LessonEvidenceState>(() => createLessonEvidenceState(contract));
  const lessonCompleteRef = useRef(false);
  const finishAfterClosingRef = useRef(false);
  const finalClosingOutputRef = useRef(false);

  function reset() {
    const next = createLessonEvidenceState(contract);
    evidenceRef.current = next;
    setEvidence(next);
    lessonCompleteRef.current = false;
    finishAfterClosingRef.current = false;
    finalClosingOutputRef.current = false;
    round2.reset();
  }

  function recordEvidence(args: Record<string, unknown>) {
    if (!contract) return { error: 'No lesson evidence contract is active.' };
    const checkId = typeof args.check_id === 'string' ? args.check_id : '';
    const level: LessonEvidenceLevel = args.level === 'independent' ? 'independent' : 'supported';
    const excerpt = typeof args.learner_excerpt === 'string' ? args.learner_excerpt.trim().slice(0, 280) : '';
    const check = contract.checks.find((candidate) => candidate.id === checkId);
    if (!check) return { error: `Unknown lesson check: ${checkId}` };
    if (!excerpt) return { error: 'learner_excerpt is required and must come from the learner.' };

    const current = evidenceRef.current;
    const currentBucket = current[check.id] ?? { independent: [], supported: [] };
    const nextBucket = {
      independent: [...currentBucket.independent],
      supported: [...currentBucket.supported],
    };
    const target = level === 'independent' ? nextBucket.independent : nextBucket.supported;
    const key = normalizedEvidence(excerpt);
    if (!target.some((item) => normalizedEvidence(item) === key)) target.push(excerpt);

    const next = { ...current, [check.id]: nextBucket };
    evidenceRef.current = next;
    setEvidence(next);

    const summary = summarizeLessonEvidence(contract, next);
    if (summary.lessonComplete && !lessonCompleteRef.current) {
      lessonCompleteRef.current = true;
      finishAfterClosingRef.current = true;
      markA1SpeakingPilotLessonComplete(scenarioId, true);
    }

    const normalInstruction = summary.lessonComplete
      ? 'All required lesson evidence is complete. Ask no new question. Give one short natural closing line for the conversation without mentioning checks, progress, scores or the tool, then end your turn.'
      : 'Continue the conversation naturally. Do not mention this check.';

    return {
      recorded: true,
      check_id: check.id,
      evidence_level: level,
      lesson_complete: summary.lessonComplete,
      completed_units: summary.completedUnits,
      total_units: summary.totalUnits,
      remaining_check_ids: summary.remainingCheckIds,
      instruction: round2.active
        ? 'STOP before speaking. This evidence result does NOT authorize any partner response or step advance. You MUST now call judge_round2_attempt on this same learner attempt. Follow only that gate tool response for correction/retry or progression.'
        : normalInstruction,
    };
  }

  const evidenceTools: LiveClientTool[] = contract ? [{
    declaration: {
      name: 'record_lesson_evidence',
      description: [
        'Private bookkeeping tool for the current Speaking lesson.',
        'Call it silently after a learner turn whenever that turn genuinely provides evidence for one lesson check.',
        'A turn may satisfy more than one check, so call separately for each applicable check.',
        'independent = learner produced the required behaviour/form without being given the exact answer immediately beforehand.',
        'supported = meaning/attempt appeared but the learner copied supplied wording, needed the exact model, or did not yet produce the required form independently.',
        'Never call from partner/Otti speech and never invent evidence.',
        'This tool NEVER advances a gated Round 2 step. Only judge_round2_attempt may do that.',
      ].join(' '),
      behavior: 'BLOCKING',
      parameters: {
        // This object is sent directly over the raw v1beta WebSocket, not via an SDK.
        // Use protobuf enum spellings and only fields supported by FunctionDeclaration.parameters.
        type: 'OBJECT',
        properties: {
          check_id: {
            type: 'STRING',
            enum: contract.checks.map((check) => check.id),
            description: 'The lesson check evidenced by the learner turn.',
          },
          level: {
            type: 'STRING',
            enum: ['supported', 'independent'],
            description: 'How independently the learner demonstrated the check.',
          },
          learner_excerpt: {
            type: 'STRING',
            description: 'Exact short excerpt from the learner turn that supports this evidence.',
          },
        },
        required: ['check_id', 'level', 'learner_excerpt'],
      },
    },
    handle: recordEvidence,
  }] : [];

  const tools: LiveClientTool[] = [...round2.tools, ...evidenceTools];

  const progress = contract ? summarizeLessonEvidence(contract, evidence) : null;
  const evidencePromptEn = contract ? [
    'PRIVATE LESSON ENGINE — never read or describe this bookkeeping to the learner.',
    `This Speaking lesson is built from reviewed Learn lessons ${contract.sourceLessonIds.join(', ')}. Their source-introduction load is ${contract.sourceLoad.abilities} abilities, ${contract.sourceLoad.phrases} phrases, ${contract.sourceLoad.grammar} grammar records, ${contract.sourceLoad.words} word records and ${contract.sourceLoad.pronunciation} pronunciation records. This source load defines the available ground; it does NOT mean every record is a separate spoken requirement.`,
    `Available language ground:\n- ${contract.languageGroundEn.join('\n- ')}`,
    `Required live evidence checks:\n${contract.checks.map((check) => `- ${check.id} (${check.requiredIndependent} independent): ${check.descriptionEn}`).join('\n')}`,
    contract.coachPromptEn,
  ].join('\n\n') : '';

  const promptEn = [round2.promptEn, evidencePromptEn].filter(Boolean).join('\n\n');

  function noteTeacherOutput() {
    if (finishAfterClosingRef.current) finalClosingOutputRef.current = true;
  }

  function consumeAutoFinishAfterTurn() {
    if (round2.active && !round2.isCompleteNow()) return false;
    if (!finishAfterClosingRef.current || !finalClosingOutputRef.current) return false;
    finishAfterClosingRef.current = false;
    finalClosingOutputRef.current = false;
    return true;
  }

  return {
    contract,
    tools,
    progress,
    promptEn,
    reset,
    noteTeacherOutput,
    consumeAutoFinishAfterTurn,
  };
}

export function LessonEvidenceProgress({ runtime }: { runtime: ReturnType<typeof useLessonEvidenceRuntime> }) {
  const { contract, progress } = runtime;
  if (!contract || !progress) return null;
  const percent = progress.totalUnits ? Math.round((progress.completedUnits / progress.totalUnits) * 100) : 0;

  return (
    <aside className="sp-live-lesson-progress" aria-label={`تقدم الدرس ${progress.completedUnits} من ${progress.totalUnits}`}>
      <header>
        <span>تقدم الدرس</span>
        <strong>{progress.completedUnits}/{progress.totalUnits}</strong>
      </header>
      <div className="sp-live-lesson-progress-bar" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
      <div className="sp-live-lesson-checks">
        {progress.checkProgress.map((check) => {
          const partial = !check.isComplete && check.supported > 0;
          return (
            <span key={check.id} className={`sp-live-lesson-check${check.isComplete ? ' is-complete' : partial ? ' is-supported' : ''}`}>
              <i aria-hidden="true">{check.isComplete ? '✓' : partial ? '◐' : '○'}</i>
              <b>{check.labelAr}</b>
              {check.requiredIndependent > 1 ? <small>{check.completed}/{check.requiredIndependent}</small> : null}
            </span>
          );
        })}
      </div>
    </aside>
  );
}
