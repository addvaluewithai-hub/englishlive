import { Link, useParams } from 'react-router-dom';
import { useProductCatalog } from '../catalog/client';
import { ProductIcon } from '../components/ProductIcon';
import { productUnitProgress, readProductCourseProgress } from '../productV2/progress';

export function LevelScreen() {
  const { levelId } = useParams();
  const catalog = useProductCatalog();
  const level = catalog.levels.find((item) => item.id === levelId) ?? catalog.levels[0];
  const progress = readProductCourseProgress();

  if (!level) {
    return <section className="v2-empty-screen" dir="rtl"><h1>المستوى مش متاح</h1><p>مفيش مستوى منشور بالمعرّف ده.</p><Link to="/learn">ارجع للمسار</Link></section>;
  }

  const publishedCompleted = level.connectedUnits.reduce((sum, unit) => sum + productUnitProgress(unit, progress).completedCount, 0);

  return (
    <section className="v3-level-screen" dir="rtl">
      <div className="v3-page-topline">
        <Link className="v3-back-link" to="/learn" aria-label="العودة للمستويات">
          <ProductIcon name="chevron" size={20} />
          <span>كل المستويات</span>
        </Link>
      </div>

      <header className="v3-level-hero">
        <span className="v3-level-orb">{level.title}</span>
        <div>
          <span className="v3-kicker">مستواك الحالي</span>
          <h1>{level.arabicTitle}</h1>
          <p>{level.description}</p>
        </div>
      </header>

      <div className="v3-level-stats" aria-label={`${level.title} course structure`}>
        <div><strong>{level.unitCount}</strong><span>وحدات منشورة</span></div>
        <div><strong>{level.lessonSlotCount}</strong><span>دروس متاحة</span></div>
        <div><strong>{publishedCompleted}/{level.lessonSlotCount}</strong><span>دروس مكتملة</span></div>
      </div>

      <section className="v3-unit-browser">
        <div className="v3-section-heading">
          <div>
            <span className="v3-kicker">خريطة {level.title}</span>
            <h2>الوحدات</h2>
          </div>
          <small>القائمة دي جاية من الوحدات المنشورة في Englotti Cloud.</small>
        </div>

        <div className="v3-unit-list">
          {level.connectedUnits.map((unit) => (
            <Link key={unit.id} className="v3-unit-card is-live" to={`/learn/unit/${unit.id}`}>
              <span className="v3-unit-number is-live">{unit.order}</span>
              <span className="v3-unit-copy">
                <small>الوحدة {unit.order} · {unit.lessons.length} دروس</small>
                <strong>{unit.arabicTitle}</strong>
                <span>{unit.title}</span>
              </span>
              <span className="v3-unit-tail"><ProductIcon name="chevron" size={21} /></span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
