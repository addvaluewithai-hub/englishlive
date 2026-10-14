import type { PracticeMissionContract } from '../types';
import type { TutorCopy } from './tutorCopy';

/** Informational checklist: observed goals never gate the conversation or imply mastery. */
export function GoalStrip({ mission, goalIds, ar, copy }: {
  mission: PracticeMissionContract;
  goalIds: readonly string[];
  ar: boolean;
  copy: TutorCopy;
}) {
  const goals = mission.beats.filter((beat) => beat.type === 'required');
  if (!goals.length) return null;
  return <div className="practice-conversation-goals tutor-goals" aria-label={`${copy.goalsLabel}. ${copy.goalsNote}`}>
    {goals.map((goal) => {
      const observed = goalIds.includes(goal.id);
      return <span key={goal.id} className={observed ? 'is-observed' : ''}>
        <span aria-hidden="true">{observed ? '✓' : '○'}</span> {ar ? goal.overviewAr : goal.learnerIntentEn}
      </span>;
    })}
  </div>;
}
