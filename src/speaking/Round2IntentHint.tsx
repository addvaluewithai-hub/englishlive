import { useI18n } from '../i18n/LocaleProvider';
import type { SpeakingTurn } from './types';
import { learnV2GuidedConversationByScenarioId } from './learnV2Guided';
import { useRound2StepIndex } from './round2PracticeRuntime';

export function Round2IntentHint({
  scenarioId,
  round,
  learnerTurn,
  turns,
}: {
  scenarioId: string;
  round: string | null;
  learnerTurn: boolean;
  turns: SpeakingTurn[];
}) {
  const { t } = useI18n();
  const stepIndex = useRound2StepIndex(scenarioId);
  if (round !== 'independent' || !learnerTurn) return null;

  const guided = learnV2GuidedConversationByScenarioId(scenarioId);
  if (!guided) return null;

  const lastTurn = turns.at(-1);
  if (lastTurn?.speaker !== 'teacher') return null;

  const step = guided.steps[stepIndex];
  if (!step?.round2HintAr) return null;

  return (
    <aside className="round2-intent-card" aria-label={t('independent.hintLabel')}>
      <span aria-hidden="true">💡</span>
      <div>
        <small>{t('independent.hintHelp')}</small>
        <strong lang="ar" dir="rtl">{step.round2HintAr}</strong>
      </div>
    </aside>
  );
}
