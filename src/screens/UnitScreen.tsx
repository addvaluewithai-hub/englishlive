import { Link, Navigate, useParams } from 'react-router-dom';
import { useProductCatalog } from '../catalog/client';

export function UnitScreen() {
  const { unitId } = useParams();
  const catalog = useProductCatalog();
  const match = catalog.levels
    .flatMap((level) => level.connectedUnits.map((unit) => ({ level, unit })))
    .find(({ unit }) => unit.id === unitId);

  if (!match) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>الوحدة مش متاحة</h1>
        <p>مفيش وحدة منشورة بالمعرّف ده.</p>
        <Link to="/learn">ارجع للمستويات</Link>
      </section>
    );
  }

  return <Navigate replace to={`/learn/level/${match.level.id}#unit-${match.unit.id}`} />;
}
