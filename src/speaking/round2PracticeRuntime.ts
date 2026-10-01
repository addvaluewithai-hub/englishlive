import { useRef, useState } from 'react';
import type { LiveClientTool } from '../live/tools';
import { learnV2GuidedConversationByScenarioId } from './learnV2Guided';

export type Round2AttemptOutcome = 'accepted' | 'retry_required';

export function useRound2PracticeRuntime(scenarioId: string, round: string | null) {
  const guided = round === 'independent' ? learnV2GuidedConversationByScenarioId(scenarioId) : undefined;
  const stepRef = useRef(0);
  const [stepIndex, setStepIndex] = useState(0);

  function reset() {
    stepRef.current = 0;
    setStepIndex(0);
  }

  function judgeAttempt(args: Record<string, unknown>) {
    if (!guided) return { error: 'No Round 2 guided plan is active.' };

    const requestedStep = typeof args.step_index === 'number' ? Math.trunc(args.step_index) : -1;
    const outcome: Round2AttemptOutcome = args.outcome === 'accepted' ? 'accepted' : 'retry_required';
    const excerpt = typeof args.learner_excerpt === 'string' ? args.learner_excerpt.trim().slice(0, 280) : '';
    const currentStep = stepRef.current;
    const step = guided.steps[currentStep];

    if (!step) {
      return {
        error: 'Round 2 is already complete. Do not create another practice step.',
        round_complete: true,
      };
    }
    if (requestedStep !== currentStep) {
      return {
        error: `Wrong Round 2 step. The active step is ${currentStep}.`,
        active_step_index: currentStep,
        instruction: 'Stay on the active step. Do not advance the conversation.',
      };
    }
    if (!excerpt) {
      return {
        error: 'learner_excerpt is required and must come from the learner attempt.',
        active_step_index: currentStep,
        instruction: 'Do not advance the conversation.',
      };
    }

    if (outcome === 'retry_required') {
      return {
        recorded: true,
        outcome,
        step_advanced: false,
        active_step_index: currentStep,
        arabic_intent: step.round2HintAr,
        reference_model: step.learnerCardEn,
        instruction: [
          'DO NOT advance to the next partner step.',
          'Briefly correct the genuine CURRENT-TARGET English error. Preserve any learner-chosen personal or fictional details.',
          'Give one correct natural English form, then explicitly ask the learner to say it again.',
          'STOP after asking for the retry. Wait for a fresh learner attempt.',
          'Do not call this attempt accepted merely because the learner can now hear your correction.',
        ].join(' '),
      };
    }

    const nextIndex = currentStep + 1;
    stepRef.current = nextIndex;
    setStepIndex(nextIndex);
    const nextStep = guided.steps[nextIndex];

    if (!nextStep) {
      return {
        recorded: true,
        outcome,
        step_advanced: true,
        active_step_index: nextIndex,
        round_complete: true,
        instruction: `The final Round 2 learner step is accepted. Give one short natural closing close to: “${guided.closingMoveEn}” Do not ask a new question or add another target.`,
      };
    }

    return {
      recorded: true,
      outcome,
      step_advanced: true,
      active_step_index: nextIndex,
      next_partner_intent: nextStep.partnerIntentEn,
      next_partner_example: nextStep.partnerExampleEn,
      instruction: `The learner passed the current step. Continue ONLY with partner step ${nextIndex + 1}, staying close to the supplied partner intent/example, then stop and give the learner the turn.`,
    };
  }

  const tools: LiveClientTool[] = guided ? [{
    declaration: {
      name: 'judge_round2_attempt',
      description: [
        'Mandatory private gate for every learner attempt in Learn A1 Round 2.',
        'Call this tool after EVERY completed learner attempt before you decide what to say next.',
        'Use accepted when the learner expresses the CURRENT Arabic intent in genuinely acceptable English. Different natural wording is accepted; exact rehearsal wording is NOT required.',
        'Use retry_required only for a genuine CURRENT-TARGET English error: wrong core question/statement structure, wrong auxiliary/order, wrong target form, or wording that fails/changes the intended meaning.',
        'Do not use retry_required for accent, harmless hesitation, optional style differences, contractions, or a different correct English formulation.',
        'You are forbidden to move to the next authored partner step unless this tool returns step_advanced=true.',
      ].join(' '),
      behavior: 'BLOCKING',
      parameters: {
        type: 'OBJECT',
        properties: {
          step_index: {
            type: 'INTEGER',
            description: 'Zero-based active Round 2 step index. Use the active step stated in the prompt/tool response.',
          },
          outcome: {
            type: 'STRING',
            enum: ['accepted', 'retry_required'],
            description: 'Whether the learner produced acceptable English for the current intent or must retry after correction.',
          },
          learner_excerpt: {
            type: 'STRING',
            description: 'Exact short learner excerpt being judged.',
          },
        },
        required: ['step_index', 'outcome', 'learner_excerpt'],
      },
    },
    handle: judgeAttempt,
  }] : [];

  const sequence = guided?.steps.map((step, index) => [
    `ROUND 2 STEP ${index} (human step ${index + 1})`,
    `Arabic learner intent shown by the UI: ${step.round2HintAr}`,
    `Partner intent: ${step.partnerIntentEn}`,
    `Partner-side example: “${step.partnerExampleEn}”`,
    `Reference learner model from Round 1 (NOT an exact-match requirement): “${step.learnerCardEn}”`,
  ].join('\n')).join('\n\n') ?? '';

  const promptEn = guided ? [
    'ROUND 2 GATED PRACTICE — this protocol is mandatory and overrides generic advice about simply keeping the conversation moving.',
    'The UI shows the learner only the Arabic meaning/communicative intent. They must produce the English themselves.',
    'After EVERY learner attempt, call judge_round2_attempt BEFORE producing your next spoken turn.',
    'If the tool outcome is retry_required: correct the current target briefly, provide the correct English form once, explicitly ask the learner to repeat/say it again, and STOP. Stay on the same step until a fresh attempt is accepted.',
    'If the learner says a different but correct/natural English formulation, mark accepted immediately. Never force verbatim recall of the Round 1 card.',
    'Do not advance because the learner merely spoke. Advance only when judge_round2_attempt returns step_advanced=true.',
    'A corrected model you supplied does not itself prove success. The learner must make a fresh spoken attempt after the correction.',
    'Do not nitpick non-target mistakes that do not block the current communicative intent. This gate is for the CURRENT TARGET only.',
    sequence,
  ].join('\n\n') : '';

  return {
    active: Boolean(guided),
    guided,
    stepIndex,
    isComplete: Boolean(guided && stepIndex >= guided.steps.length),
    tools,
    promptEn,
    reset,
  };
}
