import { Link, useParams } from 'react-router-dom';
import { useProductCatalog } from '../catalog/client';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { lessonArabicTitle, lessonProductTitle } from '../productV2/course';
import { isProductLessonUnlocked, productUnitProgress, readProductCourseProgress } from '../productV2/progress';
import { readLearnerProfile } from '../product/profile';

export function UnitScreen() {
  const { unitId } = useParams();
  const catalog = useProductCatalog();
  const unit = catalog.levels.flatMap((level) => level.connectedUnits).find((item) => item.id === unitId)
    ?? catalog.levels[0]?.connectedUnits[0];
  const progress = readProductCourseProgress();
  const profile = readLearnerProfile();
  const character = getCharacterDefinition(profile?.characterId);

  if (!unit || unit.lessons.length === 0) {
    return <section className="v2-empty-screen" dir="rtl"><h1>الوحدة مش متاحة</h1><p>مفيش دروس منشورة في الوحدة دي.</p><Link to="/learn">ارجع للمسار</Link></section>;
  }

  const summary = productUnitProgress(unit, progress);
  const level = catalog.levels.find((item) => item.id === unit.levelId);
  const levelLabel = level?.title ?? unit.levelId.toUpperCase();

  return (
    <section className="v3-unit-screen" dir="rtl">
      <div className="v3-page-topline">
        <Link className="v3-back-link" to={`/learn/level/${unit.levelId}`} aria-label="العودة لوحدات المستوى">
          <ProductIcon name="chevron" size={20} />
          <span>وحدات {levelLabel}</span>
        </Link>
      </div>

      <header className="v3-unit-hero">
        <span className="v3-unit-orb">{String(unit.order).padStart(2, '0')}</span>
        <div>
          <span className="v3-kicker">{levelLabel} · الوحدة {unit.order}</span>
          <h1>{unit.arabicTitle}</h1>
          <p>{unit.description}</p>
        </div>
      </header>

      <div className="v3-unit-progress-panel">
        <div>
          <small>تقدمك في الوحدة</small>
          <strong>{summary.completedCount} من {summary.totalCount} دروس منشورة</strong>
          <span>{summary.unitComplete ? 'خلصت كل الدروس المنشورة دلوقتي.' : `الدرس التالي: ${lessonProductTitle(summary.nextLesson)}`}</span>
        </div>
        <Link className="v3-primary-cta" to={`/scene-lesson/${summary.nextLesson.id}?character=${character.id}`}>
          <ProductIcon name="play" size={21} />
          <span>{summary.unitComplete ? 'راجع آخر درس' : progress.lessons[summary.nextLesson.id]?.startedAt ? 'كمّل الدرس' : 'ابدأ الدرس'}</span>
        </Link>
      </div>

      <section className="v3-lessons-section">
        <div className="v3-section-heading">
          <div><span className="v3-kicker">{unit.lessons.length} دروس منشورة</span><h2>الدروس</h2></div>
          <small>أي درس جديد يتنشر من Englotti هيتضاف هنا تلقائيًا.</small>
        </div>

        <div className="v3-lesson-list">
          {unit.lessons.map((lesson, index) => {
            const saved = progress.lessons[lesson.id];
            const completed = Boolean(saved?.completedAt);
            const current = lesson.id === summary.nextLesson.id && !summary.unitComplete;
            const unlocked = isProductLessonUnlocked(unit, lesson.id, progress);
            const body = (
              <>
                <span className={`v3-lesson-number${completed ? ' is-complete' : current ? ' is-current' : ''}`}>
                  {completed ? <ProductIcon name="check" size={21} /> : lesson.order || index + 1}
                </span>
                <span className="v3-lesson-copy">
                  <small>الدرس {lesson.order || index + 1}</small>
                  <strong>{lessonProductTitle(lesson)}</strong>
                  <span>{lessonArabicTitle(lesson)}</span>
                </span>
                <span className="v3-lesson-status">
                  {!unlocked ? <ProductIcon name="lock" size={18} /> : <ProductIcon name="chevron" size={20} />}
                </span>
              </>
            );

            return unlocked ? (
              <Link key={lesson.id} className={`v3-lesson-row${current ? ' is-current' : ''}`} to={`/scene-lesson/${lesson.id}?character=${character.id}`}>
                {body}
              </Link>
            ) : (
              <div key={lesson.id} className="v3-lesson-row is-locked" aria-disabled="true">{body}</div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
