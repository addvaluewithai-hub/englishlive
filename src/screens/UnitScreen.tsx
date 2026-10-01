import { Link, Navigate, useParams } from 'react-router-dom';
import { learnRoadmapUnitById } from '../learnV2/roadmap';

export function UnitScreen() {
  const { unitId } = useParams();
  const match = learnRoadmapUnitById(unitId);

  if (!match) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>الوحدة مش متاحة</h1>
        <p>مفيش وحدة بالمعرّف ده في مسار Learn الحالي.</p>
        <Link to="/learn">ارجع للمستويات</Link>
      </section>
    );
  }

  return <Navigate replace to={`/learn/level/${match.level.id}#unit-${match.unit.id}`} />;
}
