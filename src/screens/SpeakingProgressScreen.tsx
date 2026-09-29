import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { speakingAssets } from '../speaking/catalog';

const skills = [
  { title: 'تكمل الحوار', status: 'بتتحسن بشكل كويس', value: 4, suggestion: 'تغيير حجز', href: '/speak/scenario/change-booking', icon: '💬' },
  { title: 'تسأل أسئلة متابعة', status: 'محتاج شوية ممارسة', value: 2, suggestion: 'السؤال عن الخدمات', href: '/speak/scenario/hotel-services', icon: '?' },
  { title: 'تتعامل مع سوء الفهم', status: 'محتاجين مواقف أكتر', value: 2, suggestion: 'مشكلة في الغرفة', href: '/speak/scenario/hotel-problem', icon: '💡' },
  { title: 'تعبر عن رأيك', status: 'بتتحسن خطوة بخطوة', value: 3, suggestion: 'محادثة عن السفر', href: '/speak/world/travel', icon: '↗' },
];

export function SpeakingProgressScreen() {
  return (
    <section className="spk3-page spk3-progress" dir="rtl">
      <section className="spk3-progress-hero">
        <div><h1>تقدمك في المحادثة</h1><p>من خلال محادثاتك، بنلاحظ إنك بتتقدم خطوة بخطوة.</p></div>
        <img src={speakingAssets.ottiProgress} alt="Otti يعرض تقدم المحادثة" />
      </section>
      <div className="spk3-stat-grid">
        <div><b>14</b><span>محادثة</span></div>
        <div><b>6</b><span>مواقف حقيقية</span></div>
        <div><b>4</b><span>قدرات بتتحسن</span></div>
      </div>
      <div className="spk3-progress-heading"><span>▥</span><div><h2>تحليل مهاراتك في المحادثة</h2><p>مبني على المحادثات الحقيقية اللي جربتها مؤخرًا.</p></div></div>
      <div className="spk3-skill-list">
        {skills.map((skill) => (
          <article className="spk3-skill-card" key={skill.title}>
            <span className="spk3-skill-icon">{skill.icon}</span>
            <div className="spk3-skill-main">
              <h3>{skill.title}</h3>
              <p>{skill.status}</p>
              <div className="spk3-segment-bar" aria-label={`${skill.value} من 5`}>
                {[1, 2, 3, 4, 5].map((segment) => <i key={segment} className={segment <= skill.value ? 'is-on' : ''} />)}
              </div>
              <Link to={skill.href}>جرّب موقف مناسب: {skill.suggestion} <ProductIcon name="chevron" size={16} /></Link>
            </div>
            <ProductIcon name="chevron" size={20} />
          </article>
        ))}
      </div>
    </section>
  );
}
