import { useState } from 'react';
import { TeacherLabVisual } from './TeacherLabVisual';
import type { SceneBoardActivity } from './types';

type ChoiceResult = { accepted: boolean; correct: boolean; error?: string };

/** A fixed, non-scrolling classroom slide; the speaking scene has no quiz board. */
export function TeacherBoardActivity({
  sceneId, beatId, activity, answered, choiceId, questionReady, onChoose,
}: {
  sceneId: string;
  beatId: string;
  activity: SceneBoardActivity;
  answered: boolean;
  choiceId?: string;
  questionReady: boolean;
  onChoose: (sceneId: string, choiceId: string) => ChoiceResult;
}) {
  const [error, setError] = useState('');
  const [localChoice, setLocalChoice] = useState<string | null>(null);
  const picked = choiceId ?? localChoice;
  const correct = picked === activity.correctOptionId;
  function choose(id: string) {
    if (!questionReady || answered) return;
    const result = onChoose(sceneId, id);
    if (!result.accepted) {
      setError(result.error ?? 'تعذّر تسجيل إجابتك. جرّب تاني.');
      return;
    }
    setLocalChoice(id);
    setError('');
  }
  return (
    <section className="teacher-pilot-card" dir="rtl" aria-label="بورد الفصل التفاعلي">
      <div className="teacher-pilot-eyebrow">
        <span>ENGLISH CLASSROOM</span>
        <span>{answered ? (correct ? 'إجابة صحيحة' : 'نتعلّم من الإجابة') : questionReady ? 'دورك تختار' : 'Otti بيشرح'}</span>
      </div>
      <TeacherLabVisual sceneId={sceneId} beatId={beatId}/>
      {questionReady || answered ? (
        <div className="teacher-pilot-task">
          <strong>{activity.promptAr}</strong>
          <div className="teacher-pilot-options" role="group" aria-label="اختار الإجابة">
            {activity.options.map((option) => (
              <button
                key={option.id}
                type="button"
                lang="en"
                dir="ltr"
                disabled={answered || !questionReady}
                aria-pressed={picked === option.id}
                className={answered && option.id === activity.correctOptionId ? 'is-right'
                  : answered && picked === option.id ? 'is-wrong' : picked === option.id ? 'is-selected' : ''}
                onClick={() => choose(option.id)}
              >
                <span>{option.text}</span>
                {answered && option.id === activity.correctOptionId ? <strong aria-label="الإجابة الصحيحة">✓</strong>
                  : answered && picked === option.id ? <strong aria-label="اختيار غير صحيح">×</strong> : null}
              </button>
            ))}
          </div>
          {answered ? <p role="status" className={correct ? 'teacher-pilot-right' : 'teacher-pilot-retry'}>
            {correct ? activity.successAr : activity.retryAr} <strong>اسمع شرح Otti وبعدين هنكمل.</strong>
          </p> : <small>اختار إجابة واحدة، وOtti هيشرحلك السبب.</small>}
          {error ? <p role="alert">{error}</p> : null}
        </div>
      ) : (
        <p className="teacher-pilot-wait">اسمع Otti، وبعد الشرح السؤال هيظهر هنا.</p>
      )}
    </section>
  );
}
