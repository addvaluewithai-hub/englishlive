import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { getProductLevel, A1_UNIT_1_PRODUCT } from '../productV2/course';
import { productUnitProgress, readProductCourseProgress } from '../productV2/progress';

export function LevelScreen() {
  const { levelId } = useParams();
  const level = getProductLevel(levelId);
  const progress = readProductCourseProgress();
  const unitOneProgress = productUnitProgress(A1_UNIT_1_PRODUCT, progress);

  return (
    <section className="v3-level-screen" dir="rtl">
      <div className="v3-page-topline">
        <Link className="v3-back-link" to="/learn" aria-label="العودة للمستويات">
          <ProductIcon name="chevron" size={20} />
          <span>المستويات</span>
        </Link>
      </div>

      <header className="v3-level-hero">
        <span className="v3-level-orb">{level.title}</span>
        <div>
          <span className="v3-kicker">المستوى الحالي</span>
          <h1>{level.arabicTitle}</h1>
          <p>{level.description}</p>
        </div>
      </header>

      <div className="v3-level-stats" aria-label="A1 course structure">
        <div><strong>{level.unitCount}</strong><span>وحدات</span></div>
        <div><strong>{level.lessonSlotCount}</strong><span>خانة درس في المنهج</span></div>
        <div><strong>{unitOneProgress.completedCount}/{unitOneProgress.totalCount}</strong><span>دروس موصلة حاليًا</span></div>
      </div>

      <section className="v3-unit-browser">
        <div className="v3-section-heading">
          <div>
            <span className="v3-kicker">خريطة A1</span>
            <h2>الوحدات</h2>
          </div>
          <small>المحتوى غير الموصل يظهر كقريبًا</small>
        </div>

        <div className="v3-unit-list">
          {level.outline.map((unit) => {
            const body = (
              <>
                <span className={`v3-unit-number${unit.connected ? ' is-live' : ''}`}>{unit.order}</span>
                <span className="v3-unit-copy">
                  <small>Unit {unit.order} · {unit.lessonCount} lessons</small>
                  <strong>{unit.arabicTitle}</strong>
                  <span>{unit.title}</span>
                </span>
                <span className="v3-unit-tail">
                  {unit.connected ? <ProductIcon name="chevron" size={21} /> : <><ProductIcon name="lock" size={18} /><small>قريبًا</small></>}
                </span>
              </>
            );

            return unit.connected ? (
              <Link key={unit.id} className="v3-unit-card is-live" to={`/learn/unit/${unit.id}`}>{body}</Link>
            ) : (
              <div key={unit.id} className="v3-unit-card is-locked" aria-disabled="true">{body}</div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
