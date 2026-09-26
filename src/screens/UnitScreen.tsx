import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { getProductUnit, lessonArabicTitle, lessonProductTitle } from '../productV2/course';
import { isProductLessonUnlocked, productUnitProgress, readProductCourseProgress } from '../productV2/progress';
import { readLearnerProfile } from '../product/profile';
import { getCharacterDefinition } from '../character/registry';

export function UnitScreen() {
  const { unitId } = useParams();
  const unit = getProductUnit(unitId);
  const progress = readProductCourseProgress();
  const summary = productUnitProgress(unit, progress);
  const profile = readLearnerProfile();
  const character = getCharacterDefinition(profile?.characterId);

  return (
    <section className="v2-unit-screen" dir="rtl">
      <header className="v2-unit-hero">
        <div className="v2-unit-kicker">A1 · الوحدة {unit.order}</div>
        <h1>{unit.arabicTitle}</h1>
        <p>{unit.description}</p>

        <div className="v2-unit-progress-card">
          <div className="v2-progress-copy">
            <strong>{summary.completedCount} من {summary.totalCount} دروس</strong>
            <span>{summary.unitComplete ? 'أكملت الدروس المتاحة في الوحدة.' : `الدرس التالي: ${lessonProductTitle(summary.nextLesson)}`}</span>
          </div>
          <div className="v2-segment-progress" aria-label={`${summary.completedCount} of ${summary.totalCount} lessons complete`}>
            {unit.lessons.map((lesson) => (
              <span key={lesson.id} className={progress.lessons[lesson.id]?.completedAt ? 'is-complete' : lesson.id === summary.nextLesson.id ? 'is-current' : ''} />
            ))}
          </div>
          <Link className="v2-primary-button" to={`/scene-lesson/${summary.nextLesson.id}?character=${character.id}`}>
            <ProductIcon name="play" size={22} />
            <span>{summary.unitComplete ? 'إعادة آخر درس' : progress.lessons[summary.nextLesson.id]?.startedAt ? 'متابعة الدرس' : 'ابدأ الدرس'}</span>
          </Link>
        </div>
      </header>

      <div className="v2-unit-lessons">
        <h2>الدروس في هذه الوحدة</h2>
        {unit.lessons.map((lesson, index) => {
          const saved = progress.lessons[lesson.id];
          const completed = Boolean(saved?.completedAt);
          const current = lesson.id === summary.nextLesson.id && !summary.unitComplete;
          const unlocked = isProductLessonUnlocked(unit, lesson.id, progress);
          const body = (
            <>
              <span className={`v2-lesson-number${completed ? ' is-complete' : current ? ' is-current' : ''}`}>
                {completed ? <ProductIcon name="check" size={23} /> : index + 1}
              </span>
              <span className="v2-lesson-list-copy">
                <strong>{lessonProductTitle(lesson)}</strong>
                <small>{lessonArabicTitle(lesson)}</small>
              </span>
              <span className="v2-lesson-trailing">
                {!unlocked ? <ProductIcon name="lock" size={20} /> : <ProductIcon name="chevron" size={20} />}
              </span>
            </>
          );

          return unlocked ? (
            <Link key={lesson.id} className={`v2-lesson-row${current ? ' is-current' : ''}`} to={`/scene-lesson/${lesson.id}?character=${character.id}`}>
              {body}
            </Link>
          ) : (
            <div key={lesson.id} className="v2-lesson-row is-locked" aria-disabled="true">{body}</div>
          );
        })}
      </div>
    </section>
  );
}
