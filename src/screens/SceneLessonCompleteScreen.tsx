import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { getRequiredSceneLesson } from '../lessonScenes/catalog';
import { A1_UNIT_1_PRODUCT, lessonCompletionWins, lessonProductTitle } from '../productV2/course';
import { productUnitProgress, readProductCourseProgress } from '../productV2/progress';
import { readLearnerProfile } from '../product/profile';

export function SceneLessonCompleteScreen() {
  const { lessonId } = useParams();
  const [params] = useSearchParams();
  const lesson = getRequiredSceneLesson(lessonId);
  const profile = readLearnerProfile();
  const character = getCharacterDefinition(params.get('character') ?? profile?.characterId);
  const progress = readProductCourseProgress();

  if (!progress.lessons[lesson.id]?.completedAt) {
    return <Navigate replace to="/learn" />;
  }

  const summary = productUnitProgress(A1_UNIT_1_PRODUCT, progress);
  const lessonIndex = A1_UNIT_1_PRODUCT.lessons.findIndex((item) => item.id === lesson.id);
  const nextLesson = A1_UNIT_1_PRODUCT.lessons[lessonIndex + 1];
  const wins = lessonCompletionWins(lesson);

  return (
    <section className="v2-complete-screen" dir="rtl">
      <div className="v2-complete-celebration">
        <div className="v2-complete-character"><CharacterPortrait character={character} /></div>
        <div className="v2-complete-burst" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
      </div>

      <header className="v2-complete-heading">
        <span className="v2-kicker">الدرس {lesson.order} اكتمل</span>
        <h1>أحسنت!</h1>
        <p>خلصت <strong>{lessonProductTitle(lesson)}</strong> بنجاح.</p>
      </header>

      <section className="v2-complete-wins">
        <h2>دلوقتي تقدر:</h2>
        <div>
          {wins.map((win) => (
            <article key={win}>
              <span><ProductIcon name="check" size={20} /></span>
              <p>{win}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="v2-complete-progress" aria-label={`${summary.completedCount} of ${summary.totalCount} available lessons complete`}>
        <div><strong>{summary.completedCount}/{summary.totalCount}</strong><span>دروس مكتملة من الدروس المتاحة في الوحدة</span></div>
        <div className="v2-mini-progress">
          {A1_UNIT_1_PRODUCT.lessons.map((item) => (
            <span key={item.id} className={progress.lessons[item.id]?.completedAt ? 'is-complete' : item.id === summary.nextLesson.id ? 'is-current' : ''} />
          ))}
        </div>
      </div>

      <div className="v2-complete-actions">
        {nextLesson ? (
          <Link className="v2-primary-button" to={`/scene-lesson/${nextLesson.id}?character=${character.id}`}>
            <span>الدرس التالي</span>
            <ProductIcon name="chevron" size={22} />
          </Link>
        ) : (
          <Link className="v2-primary-button" to={`/learn/unit/${A1_UNIT_1_PRODUCT.id}`}>
            <span>الرجوع للوحدة</span>
            <ProductIcon name="chevron" size={22} />
          </Link>
        )}
        <Link className="v2-replay-button" to={`/scene-lesson/${lesson.id}?character=${character.id}`}>
          <ProductIcon name="refresh" size={20} />
          <span>أعد الدرس</span>
        </Link>
      </div>

      <Link className="v2-complete-home-link" to="/home">العودة للرئيسية</Link>
    </section>
  );
}
