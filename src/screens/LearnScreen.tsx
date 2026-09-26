import { Link, Navigate } from 'react-router-dom';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { A1_UNIT_1_PRODUCT, lessonArabicTitle, lessonProductTitle } from '../productV2/course';
import { isProductLessonUnlocked, productUnitProgress, readProductCourseProgress, takePendingProductLessonCompletion } from '../productV2/progress';
import { readLearnerProfile } from '../product/profile';

export function LearnScreen() {
  const profile = readLearnerProfile();

  if (!profile) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>جهز حسابك الأول</h1>
        <p>اختار هدفك ومدرسك قبل ما تبدأ مسار التعلم.</p>
        <Link className="v2-primary-button" to="/onboarding">ابدأ الإعداد</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(profile.characterId);
  const completedLessonHandoff = takePendingProductLessonCompletion();
  if (completedLessonHandoff) {
    return <Navigate replace to={`/lesson-complete/${completedLessonHandoff}?character=${character.id}`} />;
  }

  const progress = readProductCourseProgress();
  const summary = productUnitProgress(A1_UNIT_1_PRODUCT, progress);

  return (
    <section className="v2-learn-screen" dir="rtl">
      <header className="v2-learn-heading">
        <div>
          <span className="v2-kicker">A1</span>
          <h1>الوحدة 1</h1>
          <p>{A1_UNIT_1_PRODUCT.arabicTitle}</p>
        </div>
        <Link className="v2-unit-button" to={`/learn/unit/${A1_UNIT_1_PRODUCT.id}`}>تفاصيل الوحدة</Link>
      </header>

      <div className="v2-roadmap" aria-label="Unit 1 lesson path">
        <div className="v2-roadmap-line" aria-hidden="true" />
        {A1_UNIT_1_PRODUCT.lessons.map((lesson, index) => {
          const saved = progress.lessons[lesson.id];
          const completed = Boolean(saved?.completedAt);
          const current = lesson.id === summary.nextLesson.id && !summary.unitComplete;
          const unlocked = isProductLessonUnlocked(A1_UNIT_1_PRODUCT, lesson.id, progress);
          const node = (
            <>
              <span className={`v2-roadmap-node${completed ? ' is-complete' : current ? ' is-current' : ''}${!unlocked ? ' is-locked' : ''}`}>
                {completed ? <ProductIcon name="check" size={30} /> : !unlocked ? <ProductIcon name="lock" size={24} /> : current ? <ProductIcon name="learn" size={27} /> : index + 1}
              </span>
              <span className="v2-roadmap-copy">
                <small>Lesson {lesson.order}</small>
                <strong>{lessonProductTitle(lesson)}</strong>
                <span>{lessonArabicTitle(lesson)}</span>
              </span>
            </>
          );

          return unlocked ? (
            <Link key={lesson.id} className={`v2-roadmap-item${current ? ' is-current' : ''}`} to={`/scene-lesson/${lesson.id}?character=${character.id}`}>
              {node}
            </Link>
          ) : (
            <div key={lesson.id} className="v2-roadmap-item is-locked">{node}</div>
          );
        })}

        <div className="v2-roadmap-item is-future">
          <span className="v2-roadmap-node is-locked"><ProductIcon name="lock" size={24} /></span>
          <span className="v2-roadmap-copy">
            <small>Unit path</small>
            <strong>المزيد من الدروس قريبًا</strong>
            <span>هنوصل بقية دروس الوحدة من مصدر المنهج بعد اعتمادها في التطبيق.</span>
          </span>
        </div>
      </div>

      <Link className="v2-unit-summary-link" to={`/learn/unit/${A1_UNIT_1_PRODUCT.id}`}>
        <span><strong>{summary.completedCount}/{summary.totalCount}</strong> دروس مكتملة حاليًا</span>
        <ProductIcon name="chevron" size={21} />
      </Link>
    </section>
  );
}
