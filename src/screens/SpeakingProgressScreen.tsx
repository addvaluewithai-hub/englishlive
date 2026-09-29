import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { speakingAssets } from '../speaking/assets';

const skills = [
  { id: 'maintain', title: 'تكمل الحوار', status: 'بتتحسن بشكل كويس', progress: 4, icon: '💬', suggestion: 'تغيير حجز', scenarioId: 'change-booking' },
  { id: 'followup', title: 'تسأل أسئلة متابعة', status: 'محتاج شوية ممارسة', progress: 2, icon: '❓', suggestion: 'السؤال عن قائمة الطعام', scenarioId: 'hotel-services' },
  { id: 'repair', title: 'تتعامل مع سوء الفهم', status: 'محتاجين مواقف أكتر', progress: 2, icon: '💡', suggestion: 'مشكلة في مطعم', scenarioId: 'hotel-room-problem' },
  { id: 'opinion', title: 'تعبر عن رأيك', status: 'بتتحسن خطوة بخطوة', progress: 3, icon: '📈', suggestion: 'ما رأيك في السفر؟', scenarioId: 'hotel-room-problem' },
];

export function SpeakingProgressScreen() {
  return (
    <section className="sp-progress" dir="rtl">
      <header className="sp-progress-hero">
        <div>
          <span className="sp-eyebrow">تقدمك في المحادثة</span>
          <h1>تقدمك في المحادثة</h1>
          <p>من خلال محادثاتك، بنلاحظ إنك بتتقدم خطوة بخطوة.</p>
        </div>
        <img src={speakingAssets.ottiProgress} alt="" />
      </header>

      <div className="sp-progress-stats">
        <article><strong>14</strong><span>محادثة</span><i>💬</i></article>
        <article><strong>6</strong><span>مواقف حقيقية</span><i>📍</i></article>
        <article><strong>4</strong><span>قدرات بتتحسن</span><i>▥</i></article>
      </div>

      <section className="sp-progress-analysis">
        <div className="sp-section-heading">
          <span className="sp-section-icon">▥</span>
          <div><h2>تحليل مهاراتك في المحادثة</h2><p>مبني على المحادثات الحقيقية اللي جربتها مؤخرًا.</p></div>
        </div>

        <div className="sp-skill-list">
          {skills.map((skill) => (
            <article className="sp-skill-card" key={skill.id}>
              <span className="sp-skill-icon">{skill.icon}</span>
              <div className="sp-skill-main">
                <div className="sp-skill-copy"><strong>{skill.title}</strong><small>{skill.status}</small></div>
                <div className="sp-skill-meter" aria-label={`${skill.progress} من 5`}>
                  {Array.from({ length: 5 }).map((_, index) => <i key={index} className={index < skill.progress ? 'is-on' : ''} />)}
                </div>
                <Link to={`/speak/scenario/${skill.scenarioId}`} className="sp-skill-suggestion">
                  <span>🧳</span><strong>جرّب موقف مناسب: {skill.suggestion}</strong><ProductIcon name="chevron" size={18} />
                </Link>
              </div>
              <ProductIcon name="chevron" size={22} />
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
