import type { PracticeMissionContract } from '../types';
import type { TutorCopy } from './tutorCopy';

/** Phase 1 companion card: what we learn today and the scene facts, beside Otti's spoken intro. */
export function LessonCard({ mission, ar, copy, relaxed, onRelaxed }: {
  mission: PracticeMissionContract;
  ar: boolean;
  copy: TutorCopy;
  relaxed: boolean;
  onRelaxed: (value: boolean) => void;
}) {
  const steps = (ar ? mission.briefing?.requiredMovesAr : mission.briefing?.requiredMovesEn)
    ?? mission.beats.filter((beat) => beat.type === 'required').map((beat) => (ar ? beat.overviewAr : beat.learnerIntentEn));
  return <section className="tutor-lesson-card" aria-label={copy.todayLabel}>
    <small>{copy.todayLabel}</small>
    <strong>{ar ? mission.goalAr : mission.briefing?.successEn ?? mission.titleEn}</strong>
    {steps.length ? <ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol> : null}
    {mission.briefing?.facts?.length ? <div className="tutor-facts">
      {mission.briefing.facts.map((fact) => <span key={fact.value}>
        <small>{ar ? fact.labelAr : fact.labelEn}</small><bdi dir="ltr">{fact.value}</bdi>
      </span>)}
    </div> : null}
    <label className="tutor-pace-choice">
      <input type="checkbox" checked={relaxed} onChange={(event) => onRelaxed(event.target.checked)} />
      {copy.pace}
    </label>
  </section>;
}
