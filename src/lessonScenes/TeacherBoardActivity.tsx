import { useState } from 'react';
import { ConversationBoard } from '../components/ConversationBoard';
import type { SceneBoardActivity } from './types';
import type { SupportBoard } from '../presentation/types';

type ChoiceResult = { accepted: boolean; correct: boolean; error?: string };

export function TeacherBoardActivity({
  sceneId,
  board,
  activity,
  passed,
  canAnswer,
  onChoose,
}: {
  sceneId: string;
  board: SupportBoard | null;
  activity: SceneBoardActivity;
  passed: boolean;
  canAnswer: boolean;
  onChoose: (sceneId: string, choiceId: string) => ChoiceResult;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState('');
  const correct = passed;
  const message = correct ? activity.successAr : picked ? activity.retryAr : '';
  function choose(id: string) {
    if (!canAnswer || passed) return;
    const result = onChoose(sceneId, id);
    if (!result.accepted) {
      setError(result.error ?? 'جرب تاني.');
      return;
    }
    setPicked(id);
    setError('');
  }
  return (
    <section className="teacher-pilot-card" dir="rtl" aria-label="تدريب على البورد">
      <div className="teacher-pilot-eyebrow">شوف المثال، وبعدها جرّب</div>
      {board ? <ConversationBoard board={board} /> : null}
      {canAnswer || passed ? <div className="teacher-pilot-task">
        <strong>{activity.promptAr}</strong>
        <div className="teacher-pilot-options" role="group" aria-label="اختار الجملة المناسبة">
          {activity.options.map((option) => (
            <button
              key={option.id}
              type="button"
              lang="en"
              dir="ltr"
              disabled={!canAnswer || passed}
              aria-pressed={picked === option.id}
              className={picked === option.id ? (correct ? 'is-right' : 'is-wrong') : ''}
              onClick={() => choose(option.id)}
            >{option.text}</button>
          ))}
        </div>
        {message ? (
          <p className={correct ? 'teacher-pilot-right' : 'teacher-pilot-retry'} role="status">
            {message}
            {correct ? ' دلوقتي استخدم المعنى بصوتك في موقف مختلف مع Otti.' : ''}
          </p>
        ) : (
          <small>{canAnswer ? 'اختار إجابة على البورد؛ وبعدها هنطبّق بصوتك.' : 'استنى لحد ما Otti يخلص كلامه.'}</small>
        )}
        {error ? <p role="alert">{error}</p> : null}
      </div> : <p className="teacher-pilot-wait">اسمع Otti الأول؛ سؤال البورد هيظهر لما ييجي دورك.</p>}
    </section>
  );
}
