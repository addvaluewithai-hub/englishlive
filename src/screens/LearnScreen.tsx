import { Link, Navigate } from 'react-router-dom';
import { useProductCatalog } from '../catalog/client';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { productUnitProgress, readProductCourseProgress, takePendingProductLessonCompletion } from '../productV2/progress';
import { readLearnerProfile } from '../product/profile';

const FUTURE_LEVELS = ['A2', 'B1', 'B2', 'C1', 'C2'];

export function LearnScreen() {
  const profile = readLearnerProfile();
  const catalog = useProductCatalog();

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
  const publishedLevelCodes = new Set(catalog.levels.map((level) => level.title.toUpperCase()));

  return (
    <section className="v3-learn-levels" dir="rtl">
      <header className="v3-learn-hero">
        <span className="v3-kicker">مسار Englotti</span>
        <h1>ابدأ من مستواك</h1>
        <p>كل مستوى متقسم لوحدات ودروس منشورة من Englotti Cloud. أي درس جديد يتنشر هيوصل للمسار من غير تحديث للتطبيق.</p>
      </header>

      {catalog.levels.map((level) => {
        const firstUnit = level.connectedUnits[0];
        const summary = firstUnit ? productUnitProgress(firstUnit, progress) : null;
        return (
          <Link key={level.id} className="v3-level-card is-active" to={`/learn/level/${level.id}`}>
            <div className="v3-level-card-main">
              <span className="v3-level-badge-large">{level.title}</span>
              <div>
                <small>متاح الآن</small>
                <h2>{level.arabicTitle}</h2>
                <p>{level.description}</p>
              </div>
            </div>
            <div className="v3-level-card-footer">
              <span>{level.unitCount} وحدات منشورة · {level.lessonSlotCount} دروس متاحة</span>
              {summary && firstUnit ? <span className="v3-level-progress-copy">الوحدة {firstUnit.order} · {summary.completedCount}/{summary.totalCount} مكتمل</span> : <span />}
              <ProductIcon name="chevron" size={23} />
            </div>
          </Link>
        );
      })}

      <div className="v3-future-levels" aria-label="Future levels">
        {FUTURE_LEVELS.filter((level) => !publishedLevelCodes.has(level)).map((level) => (
          <div key={level} className="v3-future-level-card" aria-disabled="true">
            <span>{level}</span>
            <div><strong>قريبًا</strong><small>هنفتح المستوى ده لما يكون جاهز للتعلم بالكامل.</small></div>
            <ProductIcon name="lock" size={19} />
          </div>
        ))}
      </div>
    </section>
  );
}
