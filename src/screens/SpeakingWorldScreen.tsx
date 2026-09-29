import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { speakingAssets } from '../speaking/assets';
import { speakingWorldById, type SpeakingReadiness } from '../speaking/catalog';

const readinessCopy: Record<SpeakingReadiness, string> = {
  ready: 'جاهز ليك',
  challenge: 'تحدي',
  later: 'لسه بعدين',
};

const scenarioIcon: Record<string, string | undefined> = {
  'hotel-check-in': speakingAssets.icons.bell,
  'hotel-room-problem': speakingAssets.icons.bed,
  'change-booking': speakingAssets.icons.calendar,
  'late-checkout': speakingAssets.icons.clock,
  'booking-missing': speakingAssets.icons.warning,
};

export function SpeakingWorldScreen() {
  const { worldId } = useParams();
  const world = speakingWorldById(worldId);
  const defaultOpen = world.groups.find((group) => group.scenarios.length)?.id ?? world.groups[0]?.id ?? '';
  const [openGroup, setOpenGroup] = useState(defaultOpen);

  const featured = useMemo(() => {
    const scenarios = world.groups.flatMap((group) => group.scenarios);
    return scenarios.find((scenario) => scenario.id === 'hotel-room-problem') ?? scenarios[0];
  }, [world]);

  const heroBackdrop = world.id === 'travel'
    ? `linear-gradient(90deg, rgba(239,250,255,.82), rgba(255,242,248,.72)), url(${speakingAssets.airportBanner})`
    : undefined;

  return (
    <section className="sp-world" dir="rtl">
      <header className="sp-world-hero" style={heroBackdrop ? { backgroundImage: heroBackdrop } : undefined}>
        <div className="sp-world-hero-copy">
          <span className="sp-world-hero-icon"><img src={speakingAssets.icons[world.icon]} alt="" /></span>
          <h1>{world.titleAr}</h1>
          <p>{world.subtitleAr}</p>
          <small>مكتبة مواقف للتدريب، مش مسار دروس جديد.</small>
        </div>
        {world.heroImage ? <img src={world.heroImage} alt="" className="sp-world-hero-art" /> : null}
      </header>

      {featured ? (
        <article className="sp-world-featured">
          <img src={featured.image} alt="" />
          <div>
            <span>★ مقترح لك الآن</span>
            <h2>{featured.titleAr}</h2>
            <p>{featured.descriptionAr}</p>
          </div>
          <Link to={`/speak/scenario/${featured.id}`}>ابدأ <ProductIcon name="chevron" size={22} /></Link>
        </article>
      ) : null}

      <div className="sp-group-list">
        {world.groups.map((group) => {
          const isOpen = openGroup === group.id;
          return (
            <section className={`sp-group-card${isOpen ? ' is-open' : ''}`} key={group.id}>
              <button type="button" className="sp-group-head" onClick={() => setOpenGroup(isOpen ? '' : group.id)}>
                <span className="sp-group-thumb">
                  {group.image ? <img src={group.image} alt="" /> : <span>✦</span>}
                </span>
                <span className="sp-group-title"><strong>{group.titleAr}</strong><small>{group.subtitleAr}</small></span>
                <span className="sp-group-toggle">{isOpen ? '⌃' : '⌄'}</span>
              </button>

              {isOpen ? (
                <div className="sp-scenario-list">
                  {group.scenarios.length ? group.scenarios.map((scenario) => {
                    const icon = scenarioIcon[scenario.id];
                    return (
                      <Link key={scenario.id} className="sp-scenario-row" to={`/speak/scenario/${scenario.id}`}>
                        <span className="sp-scenario-mini-icon">
                          {icon ? <img src={icon} alt="" /> : <span aria-hidden="true">📶</span>}
                        </span>
                        <span className="sp-scenario-row-copy">
                          <strong>{scenario.titleAr}</strong>
                          <small>{scenario.descriptionAr}</small>
                        </span>
                        <span className={`sp-readiness is-${scenario.readiness}`}>{readinessCopy[scenario.readiness]}</span>
                        <ProductIcon name="chevron" size={18} />
                      </Link>
                    );
                  }) : (
                    <div className="sp-group-placeholder">المواقف دي هتظهر هنا مع اكتمال ربط المنهج.</div>
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </section>
  );
}
