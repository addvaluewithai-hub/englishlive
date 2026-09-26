import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { A1_UNIT_1_LESSON_SLOTS, getProductUnit, lessonArabicTitle, lessonProductTitle } from '../productV2/course';
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
    <section className="v3-unit-screen" dir="rtl">
      <div className="v3-page-topline">
        <Link className="v3-back-link" to={`/learn/level/${unit.levelId}`} aria-label="العودة لوحدات المستوى">
          <ProductIcon name="chevron" size={20} />
          <span>وحدات A1</span>
        </Link>
      </div>

      <header className="v3-unit-hero">
        <span className="v3-unit-orb">01</span>
        <div>
          <span className="v3-kicker">A1 · الوحدة 1</span>
          <h1>{unit.arabicTitle}</h1>
          <p>{unit.description}</p>
        </div>
      </header>

      <div className="v3-unit-progress-panel">
        <div>
          <small>تقدمك في الوحدة</small>
          <strong>{summary.completedCount} من {summary.totalCount} دروس متاحة</strong>
          <span>{summary.unitComplete ? 'خلصت كل الدروس المتاحة دلوقتي.' : `الدرس التالي: ${lessonProductTitle(summary.nextLesson)}`}</span>
        </div>
        <Link className="v3-primary-cta" to={`/scene-lesson/${summary.nextLesson.id}?character=${character.id}`}>
          <ProductIcon name="play" size={21} />
          <span>{summary.unitComplete ? 'راجع آخر درس' : progress.lessons[summary.nextLesson.id]?.startedAt ? 'كمّل الدرس' : 'ابدأ الدرس'}</span>
        </Link>
      </div>

      <section className="v3-lessons-section">
        <div className="v3-section-heading">
          <div><span className="v3-kicker">7 دروس في الوحدة</span><h2>الدروس</h2></div>
          <small>3 دروس متاحة الآن، والباقي هيفتح تدريجيًا.</small>
        </div>

        <div className="v3-lesson-list">
          {A1_UNIT_1_LESSON_SLOTS.map((slot) => {
            const connectedLesson = unit.lessons.find((lesson) => lesson.id === slot.connectedLessonId);
            if (!connectedLesson) {
              return (
                <div key={slot.sourceLessonId} className="v3-lesson-row is-coming" aria-disabled="true">
                  <span className="v3-lesson-number">{slot.order}</span>
                  <span className="v3-lesson-copy"><small>الدرس {slot.order}</small><strong>{slot.title}</strong><span>{slot.arabicTitle}</span></span>
                  <span className="v3-lesson-status"><ProductIcon name="lock" size={18} /><small>قريبًا</small></span>
                </div>
              );
            }

            const saved = progress.lessons[connectedLesson.id];
            const completed = Boolean(saved?.completedAt);
            const current = connectedLesson.id === summary.nextLesson.id && !summary.unitComplete;
            const unlocked = isProductLessonUnlocked(unit, connectedLesson.id, progress);
            const body = (
              <>
                <span className={`v3-lesson-number${completed ? ' is-complete' : current ? ' is-current' : ''}`}>
                  {completed ? <ProductIcon name="check" size={21} /> : slot.order}
                </span>
                <span className="v3-lesson-copy">
                  <small>الدرس {slot.order}</small>
                  <strong>{lessonProductTitle(connectedLesson)}</strong>
                  <span>{lessonArabicTitle(connectedLesson)}</span>
                </span>
                <span className="v3-lesson-status">
                  {!unlocked ? <ProductIcon name="lock" size={18} /> : <ProductIcon name="chevron" size={20} />}
                </span>
              </>
            );

            return unlocked ? (
              <Link key={slot.sourceLessonId} className={`v3-lesson-row${current ? ' is-current' : ''}`} to={`/scene-lesson/${connectedLesson.id}?character=${character.id}`}>
                {body}
              </Link>
            ) : (
              <div key={slot.sourceLessonId} className="v3-lesson-row is-locked" aria-disabled="true">{body}</div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
