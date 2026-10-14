import type { PracticeMissionContract } from '../types';
import type { TutorCopy } from './tutorCopy';

/** Optional observed opportunities; never a grade or roleplay gate. */
export function GoalStrip({ mission, goalIds, ar, copy }: {
  mission: PracticeMissionContract;
  goalIds: readonly string[];
  ar: boolean;
  copy: TutorCopy;
}) {
  const goals = mission.beats.filter((beat) => beat.type === 'required');
  if (!goals.length) return null;
  const seen = goals.filter((goal) => goalIds.includes(goal.id)).length;
  return <details className="practice-conversation-goals tutor-goals" aria-label={`${copy.goalsLabel}. ${copy.goalsNote}`}>
    <summary>
      <span aria-hidden="true">◎</span>
      <strong>{copy.goalsLabel}</strong>
      <small>{seen}/{goals.length}</small>
      <span className="tutor-goals-chevron" aria-hidden="true">⌄</span>
    </summary>
    <p className="tutor-goals-explainer">{copy.goalsNote}</p>
    <div className="tutor-goal-items">
      {goals.map((goal) => {
        const observed = goalIds.includes(goal.id);
        return <span key={goal.id} className={observed ? 'is-observed' : ''}>
          <span aria-hidden="true">{observed ? '✓' : '○'}</span> {ar ? goal.overviewAr : goal.learnerIntentEn}
        </span>;
      })}
    </div>
  </details>;
}
