import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { A1_UNIT_1_PRODUCT, lessonArabicTitle, lessonProductTitle } from '../productV2/course';
import { isProductLessonUnlocked, productUnitProgress, readProductCourseProgress } from '../productV2/progress';
import { readLearnerProfile } from '../product/profile';

export function ProgressScreen() {
  const profile = readLearnerProfile();

  if (!profile) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>ابدأ رحلتك الأول</h1>
        <p>التقدم هيظهر هنا بعد ما تبدأ أول درس.</p>
        <Link className="v2-primary-button" to="/onboarding">ابدأ الإعداد</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(profile.characterId);
  const progress = readProductCourseProgress();
  const summary = productUnitProgress(A1_UNIT_1_PRODUCT, progress);
  const completionPercent = Math.round((summary.completedCount / summary.totalCount) * 100);

  return (
    <section className="v2-progress-screen" dir="rtl">
      <header className="v2-progress-heading">
        <span className="v2-kicker">تقدمي</span>
        <h1>خطواتك في A1</h1>
        <p>ده تقدمك في الدروس المؤلفة اللي خلصتها، مش درجة مستوى أو نسبة إتقان.</p>
      </header>

      <section className="v2-progress-overview">
        <div>
          <strong>{summary.completedCount}/{summary.totalCount}</strong>
          <span>دروس متاحة مكتملة</span>
        </div>
        <div className="v2-progress-ring" style={{ '--progress': `${completionPercent}%` } as CSSProperties} aria-label={`${summary.completedCount} of ${summary.totalCount} available lessons completed`}>
          <span>{summary.completedCount}/{summary.totalCount}</span>
        </div>
      </section>

      <Link className="v2-progress-next" to={`/scene-lesson/${summary.nextLesson.id}?character=${character.id}`}>
        <div>
          <span>{summary.unitComplete ? 'مراجعة' : 'التالي'}</span>
          <strong>{lessonProductTitle(summary.nextLesson)}</strong>
          <small>{lessonArabicTitle(summary.nextLesson)}</small>
        </div>
        <span className="v2-round-arrow"><ProductIcon name="chevron" size={22} /></span>
      </Link>

      <section className="v2-progress-lessons">
        <h2>الوحدة 1 · {A1_UNIT_1_PRODUCT.arabicTitle}</h2>
        {A1_UNIT_1_PRODUCT.lessons.map((lesson, index) => {
          const saved = progress.lessons[lesson.id];
          const completed = Boolean(saved?.completedAt);
          const started = Boolean(saved?.startedAt);
          const unlocked = isProductLessonUnlocked(A1_UNIT_1_PRODUCT, lesson.id, progress);
          return (
            <article className="v2-progress-lesson" key={lesson.id}>
              <span className={`v2-progress-status${completed ? ' is-complete' : started ? ' is-started' : ''}`}>
                {completed ? <ProductIcon name="check" size={22} /> : !unlocked ? <ProductIcon name="lock" size={18} /> : index + 1}
              </span>
              <div>
                <strong>{lessonProductTitle(lesson)}</strong>
                <small>{completed ? 'مكتمل' : started ? 'بدأته ولسه مكمل' : unlocked ? 'جاهز تبدأه' : 'مقفول لحد ما تخلص اللي قبله'}</small>
              </div>
              {unlocked ? <Link to={`/scene-lesson/${lesson.id}?character=${character.id}`}>{completed ? 'إعادة' : started ? 'متابعة' : 'ابدأ'}</Link> : null}
            </article>
          );
        })}
      </section>

      <div className="v2-progress-note">
        <strong>مهم:</strong> إكمال درس معناه إنك حققت عقد الدرس ده في الجلسة. مش معناه إننا بنقول إنك أتقنت A1 كله.
      </div>
    </section>
  );
}
