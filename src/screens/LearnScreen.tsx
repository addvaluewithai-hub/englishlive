import { Link, Navigate } from 'react-router-dom';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { A1_LEVEL_PRODUCT, A1_UNIT_1_PRODUCT } from '../productV2/course';
import { productUnitProgress, readProductCourseProgress, takePendingProductLessonCompletion } from '../productV2/progress';
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
    <section className="v3-learn-levels" dir="rtl">
      <header className="v3-learn-hero">
        <span className="v3-kicker">مسار التعلم</span>
        <h1>اختار مستواك</h1>
        <p>كل مستوى متقسم لوحدات ودروس مترتبة. هنفتح المحتوى تدريجيًا من المنهج المعتمد.</p>
      </header>

      <Link className="v3-level-card is-active" to={`/learn/level/${A1_LEVEL_PRODUCT.id}`}>
        <div className="v3-level-card-main">
          <span className="v3-level-badge-large">A1</span>
          <div>
            <small>المستوى الحالي</small>
            <h2>{A1_LEVEL_PRODUCT.arabicTitle}</h2>
            <p>{A1_LEVEL_PRODUCT.description}</p>
          </div>
        </div>
        <div className="v3-level-card-footer">
          <span>{A1_LEVEL_PRODUCT.unitCount} وحدات · {A1_LEVEL_PRODUCT.lessonSlotCount} خانة درس في المنهج</span>
          <span className="v3-level-progress-copy">الوحدة 1: {summary.completedCount}/{summary.totalCount} موصل حاليًا</span>
          <ProductIcon name="chevron" size={23} />
        </div>
      </Link>

      <div className="v3-future-levels" aria-label="Future levels">
        {['A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
          <div key={level} className="v3-future-level-card" aria-disabled="true">
            <span>{level}</span>
            <div><strong>قريبًا</strong><small>هيظهر هنا لما محتواه يتوصل بالـdelivery runtime.</small></div>
            <ProductIcon name="lock" size={19} />
          </div>
        ))}
      </div>
    </section>
  );
}
