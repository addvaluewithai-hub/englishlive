import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { speakingAssets } from '../speaking/assets';
import { FEATURED_SPEAKING_SCENARIO, SPEAKING_WORLDS } from '../speaking/catalog';

export function SpeakingHomeScreen() {
  const scenario = FEATURED_SPEAKING_SCENARIO;

  return (
    <section className="sp-home" dir="rtl">
      <header className="sp-home-hero">
        <div className="sp-home-hero-copy">
          <span className="sp-eyebrow">المحادثة</span>
          <h1>تكلم بثقة</h1>
          <p>تدرّب على مواقف الحياة الحقيقية باستخدام ما تعلمته في دروسك، وحوّل معرفتك إلى محادثات واقعية.</p>
        </div>
        <img src={speakingAssets.ottiHero} alt="" className="sp-home-hero-art" />
      </header>

      <section className="sp-recommend-card">
        <div className="sp-recommend-media">
          <img src={scenario.image} alt="" />
        </div>
        <div className="sp-recommend-copy">
          <span className="sp-course-chip"><ProductIcon name="learn" size={18} /> {scenario.courseSourceAr ?? 'من آخر دروسك'}</span>
          <h2>استخدم اللي اتعلمته</h2>
          <strong>{scenario.titleAr}</strong>
          <p>{scenario.descriptionAr}</p>
          <div className="sp-meta-row">
            <span className="sp-ready-chip">▥ مناسب لمستواك</span>
            <span className="sp-time-chip">◷ 5 - 8 دقائق</span>
          </div>
        </div>
        <Link className="sp-primary-cta" to={`/speak/scenario/${scenario.id}`}>
          <ProductIcon name="speak" size={32} />
          <span>ابدأ</span>
          <ProductIcon name="chevron" size={25} />
        </Link>
      </section>

      <section className="sp-worlds-section">
        <div className="sp-section-heading">
          <span className="sp-section-icon">◎</span>
          <div>
            <h2>اتدرّب في موقف حقيقي</h2>
            <p>اختار عالم من مواقف الحياة واتدرّب باستخدام ما تعلمته.</p>
          </div>
        </div>
        <div className="sp-world-grid">
          {SPEAKING_WORLDS.map((world) => (
            <Link key={world.id} className={`sp-world-card is-${world.id}`} to={`/speak/world/${world.id}`}>
              <span className="sp-world-icon"><img src={speakingAssets.icons[world.icon]} alt="" /></span>
              <strong>{world.titleAr}</strong>
            </Link>
          ))}
        </div>
      </section>

      <Link className="sp-resume-card" to="/speak/scenario/hotel-room-problem">
        <span className="sp-resume-arrow"><ProductIcon name="chevron" size={23} /></span>
        <div>
          <strong>كمّل محادثتك السابقة</strong>
          <span>مشكلة في الفندق</span>
          <small>آخر مرة: اليوم</small>
        </div>
        <img src={speakingAssets.hotelReception} alt="" />
      </Link>

      <Link className="sp-progress-teaser" to="/speak/progress">
        <span className="sp-progress-compass">◉</span>
        <div>
          <strong>كل محادثة تقربك من هدفك</strong>
          <small>شوف مهاراتك في المحادثة والمواقف المقترحة ليك.</small>
        </div>
        <ProductIcon name="chevron" size={25} />
      </Link>
    </section>
  );
}
