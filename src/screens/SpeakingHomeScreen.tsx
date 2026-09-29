import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { speakingAssets, speakingWorlds } from '../speaking/catalog';

export function SpeakingHomeScreen() {
  return (
    <section className="spk3-page spk3-home" dir="rtl">
      <section className="spk3-hero spk3-home-hero">
        <div className="spk3-hero-copy">
          <span className="spk3-kicker">محادثة حقيقية</span>
          <h1>اتكلم بثقة</h1>
          <p>تدرّب على مواقف الحياة الحقيقية باستخدام ما تعلمته في دروسك، وحوّل معرفتك إلى كلام طبيعي.</p>
        </div>
        <img className="spk3-home-hero-otti" src={speakingAssets.ottiHero} alt="" />
      </section>

      <section className="spk3-recommendation-card">
        <div className="spk3-recommendation-art">
          <img src={speakingAssets.meetingPeople} alt="شخصان يتعارفان" />
        </div>
        <div className="spk3-recommendation-copy">
          <span className="spk3-source-chip">📖 من آخر دروسك</span>
          <h2>استخدم اللي اتعلمته</h2>
          <h3>اتعرف على شخص جديد</h3>
          <p>تدرّب على التحيات والتعريف بنفسك اللي أخدتها في Unit 1.</p>
          <div className="spk3-meta-row">
            <span className="spk3-fit-chip">▥ مناسب لمستواك</span>
            <span>◷ 5 - 8 دقائق</span>
          </div>
        </div>
        <Link className="spk3-primary-cta" to="/speak/scenario/first-meeting">
          <ProductIcon name="speak" size={28} />
          <span>ابدأ</span>
          <ProductIcon name="chevron" size={22} />
        </Link>
      </section>

      <section className="spk3-section">
        <div className="spk3-section-heading">
          <span className="spk3-section-icon">🌐</span>
          <div>
            <h2>اتدرّب في موقف حقيقي</h2>
            <p>اختار عالم من مواقف الحياة واستخدم الإنجليزي اللي اتعلمته.</p>
          </div>
        </div>
        <div className="spk3-world-grid">
          {speakingWorlds.map((world) => (
            <Link className="spk3-world-card" key={world.id} to={`/speak/world/${world.id}`}>
              <span className="spk3-world-emoji" aria-hidden="true">{world.icon}</span>
              <span>{world.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <Link className="spk3-resume-card" to="/speak/scenario/hotel-problem">
        <img src={speakingAssets.hotelReception} alt="" />
        <div>
          <strong>كمّل محادثتك السابقة</strong>
          <span>مشكلة في الفندق</span>
          <small>آخر مرة: اليوم</small>
        </div>
        <span className="spk3-round-arrow"><ProductIcon name="chevron" size={20} /></span>
      </Link>

      <Link className="spk3-insight-card" to="/speak/progress">
        <span className="spk3-insight-icon">⌁</span>
        <div>
          <strong>كل محادثة تقرّبك من هدفك</strong>
          <span>شوف المهارات اللي بتتحسن من كلامك الحقيقي.</span>
        </div>
        <ProductIcon name="chevron" size={22} />
      </Link>
    </section>
  );
}
