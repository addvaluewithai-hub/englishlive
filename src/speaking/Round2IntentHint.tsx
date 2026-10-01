import type { SpeakingTurn } from './types';
import { learnV2GuidedConversationByScenarioId } from './learnV2Guided';

export function Round2IntentHint({
  scenarioId,
  round,
  learnerTurn,
  turns,
  stepIndex,
}: {
  scenarioId: string;
  round: string | null;
  learnerTurn: boolean;
  turns: SpeakingTurn[];
  stepIndex: number;
}) {
  if (round !== 'independent' || !learnerTurn) return null;

  const guided = learnV2GuidedConversationByScenarioId(scenarioId);
  if (!guided) return null;

  const lastTurn = turns.at(-1);
  if (lastTurn?.speaker !== 'teacher') return null;

  const step = guided.steps[stepIndex];
  if (!step?.round2HintAr) return null;

  return (
    <aside className="round2-intent-card" aria-label="تلميح الجولة الثانية">
      <span aria-hidden="true">💡</span>
      <div>
        <small>المعنى المطلوب — قولها بالإنجليزي بطريقتك</small>
        <strong>{step.round2HintAr}</strong>
      </div>
    </aside>
  );
}
