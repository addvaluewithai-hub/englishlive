import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { speakingAssets, speakingWorlds, travelWorld, type SpeakingReadiness } from '../speaking/catalog';

const readinessCopy: Record<SpeakingReadiness, string> = {
  ready: 'جاهز ليك',
  challenge: 'تحدي',
  later: 'لسه بعدين',
};

export function SpeakingWorldScreen() {
  const { worldId } = useParams();
  const [openGroup, setOpenGroup] = useState('hotel');

  if (worldId !== 'travel') {
    const world = speakingWorlds.find((item) => item.id === worldId);
    return (
      <section className="spk3-page spk3-world" dir="rtl">
        <section className="spk3-coming-world">
          <span>{world?.icon ?? '🌐'}</span>
          <h1>{world?.title ?? 'عالم جديد'}</h1>
          <p>المواقف هنا بتتجهز. دلوقتي تقدر تبدأ بعالم السفر أو ترجع للمحادثة.</p>
          <div>
            <Link className="spk3-primary-cta" to="/speak/world/travel">استكشف السفر</Link>
            <Link className="spk3-secondary-link" to="/speak">رجوع للمحادثة</Link>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="spk3-page spk3-world" dir="rtl">
      <section className="spk3-world-hero">
        <div className="spk3-world-hero-copy">
          <span className="spk3-world-hero-icon">✈</span>
          <h1>{travelWorld.title}</h1>
          <p>{travelWorld.subtitle}</p>
        </div>
        <img src={travelWorld.heroAsset} alt="Otti مسافر" />
      </section>

      <Link className="spk3-world-featured" to="/speak/scenario/hotel-problem">
        <img src={speakingAssets.hotelReception} alt="ردهة فندق" />
        <div>
          <span>★ مقترح لك الآن</span>
          <strong>مشكلة في الفندق</strong>
          <p>تدرّب على شرح مشكلة والتحدث مع موظف الفندق للوصول إلى حل.</p>
        </div>
        <b>ابدأ <ProductIcon name="chevron" size={18} /></b>
      </Link>

      <div className="spk3-group-list">
        {travelWorld.groups.map((group) => {
          const isOpen = openGroup === group.id;
          const groupEmoji = group.id === 'airport' ? '✈️' : group.id === 'hotel' ? '🏨' : group.id === 'eating-out' ? '🍔' : '🧳';
          return (
            <section className={`spk3-group-card${isOpen ? ' is-open' : ''}`} key={group.id}>
              <button className="spk3-group-header" type="button" onClick={() => setOpenGroup(isOpen ? '' : group.id)}>
                {group.image ? <img src={group.image} alt="" /> : <span className="spk3-group-emoji" aria-hidden="true">{groupEmoji}</span>}
                <span><strong>{group.title}</strong><small>{group.count} مواقف</small></span>
                <i>{isOpen ? '⌃' : '⌄'}</i>
              </button>
              {isOpen && group.scenarios.length > 0 ? (
                <div className="spk3-scenario-list">
                  {group.scenarios.map((scenario) => (
                    <Link className="spk3-scenario-row" key={scenario.id} to={`/speak/scenario/${scenario.id}`}>
                      <span className="spk3-scenario-symbol">
                        {scenario.id.includes('service') ? '⌁' : scenario.id.includes('booking') ? '▣' : scenario.id.includes('checkout') ? '◷' : scenario.id.includes('missing') ? '!' : '⌂'}
                      </span>
                      <div>
                        <strong>{scenario.title}</strong>
                        <small>{scenario.description}</small>
                      </div>
                      <em className={`spk3-readiness spk3-readiness-${scenario.readiness}`}>{readinessCopy[scenario.readiness]}</em>
                      <ProductIcon name="chevron" size={18} />
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </section>
  );
}
