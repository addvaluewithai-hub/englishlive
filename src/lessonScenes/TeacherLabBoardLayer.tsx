import { TeacherBoardActivity } from './TeacherBoardActivity';
import type { SceneBoardActivity } from './types';

export type TeacherLabChoiceResult = { accepted: boolean; correct: boolean; error?: string };

/** Same production board in Live and fixture: no mock drawing or layout fork. */
export function TeacherLabBoardLayer({
  sceneId, beatId, activity, answered, choiceId, questionReady, onChoose,
}: {
  sceneId: string;
  beatId: string;
  activity: SceneBoardActivity;
  answered: boolean;
  choiceId?: string;
  questionReady: boolean;
  onChoose: (sceneId: string, choiceId: string) => TeacherLabChoiceResult;
}) {
  return (
    <div className="premium-board-layer has-teacher-activity"
      data-lesson-board data-scene-id={sceneId} data-beat-id={beatId}
      aria-live="polite">
      <TeacherBoardActivity
        key={sceneId}
        sceneId={sceneId} beatId={beatId} activity={activity}
        answered={answered} choiceId={choiceId} questionReady={questionReady}
        onChoose={onChoose}
      />
    </div>
  );
}
