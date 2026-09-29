import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { fetchSpeakingProgress } from '../speaking/api';
import { speakingAssets } from '../speaking/assets';
import type { SpeakingProgressSnapshot } from '../speaking/types';

const skillConfig: Record<string, { title: string; icon: string; suggestion: string; scenarioId: string }> = {
  initiate: { title: 'تبدأ الحوار', icon: '👋', suggestion: 'اتعرف على شخص جديد', scenarioId: 'meet-someone-new' },
  respond: { title: 'ترد بشكل مناسب', icon: '↩️', suggestion: 'تسجيل الدخول', scenarioId: 'hotel-check-in' },
  followup: { title: 'تسأل أسئلة متابعة', icon: '❓', suggestion: 'السؤال عن الخدمات', scenarioId: 'hotel-services' },
  maintain: { title: 'تكمل الحوار', icon: '💬', suggestion: 'اتعرف على شخص جديد', scenarioId: 'meet-someone-new' },
  close: { title: 'تنهي الحوار طبيعي', icon: '👋', suggestion: 'تسجيل خروج متأخر', scenarioId: 'late-checkout' },
  clarify: { title: 'تطلب أو تقدم توضيح', icon: '🔎', suggestion: 'الحجز غير موجود', scenarioId: 'booking-missing' },
  repair: { title: 'تتعامل مع سوء الفهم', icon: '💡', suggestion: 'مشكلة في الفندق', scenarioId: 'hotel-room-problem' },
  explain: { title: 'تشرح اللي تقصده', icon: '🗣️', suggestion: 'مشكلة في الفندق', scenarioId: 'hotel-room-problem' },
  request_negotiate: { title: 'تطلب وتتفاوض', icon: '🤝', suggestion: 'تغيير الحجز', scenarioId: 'change-booking' },
  solve: { title: 'توصل لحل', icon: '🧩', suggestion: 'الحجز غير موجود', scenarioId: 'booking-missing' },
  opinion: { title: 'تعبر عن رأيك', icon: '📈', suggestion: 'اتعرف على شخص جديد', scenarioId: 'meet-someone-new' },
};

const emptyProgress: SpeakingProgressSnapshot = {
  completedSessions: 0,
  scenariosPractised: 0,
  skillsObserved: 0,
  skills: [],
};

function skillStatus(observations: number, demonstrated: number) {
  if (observations === 0) return 'محتاجين مواقف أكتر عشان نعرف';
  if (observations === 1) return 'ظهر مرة — محتاجين دليل أكتر';
  if (demonstrated >= 2) return 'ظهر بوضوح في أكتر من محادثة';
  return 'بدأ يظهر وبيتقوى مع الممارسة';
}

export function SpeakingProgressScreen() {
  const [progress, setProgress] = useState<SpeakingProgressSnapshot>(emptyProgress);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchSpeakingProgress()
      .then((value) => {
        if (!cancelled) setProgress(value);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const skills = useMemo(() => {
    const observed = progress.skills
      .filter((item) => skillConfig[item.skillId])
      .sort((a, b) => b.observations - a.observations);
    if (observed.length) return observed;
    return ['maintain', 'followup', 'repair', 'clarify'].map((skillId) => ({
      skillId,
      observations: 0,
      demonstrated: 0,
      emerging: 0,
      lastObservedAt: null,
    }));
  }, [progress.skills]);

  return (
    <section className="sp-progress" dir="rtl">
      <header className="sp-progress-hero">
        <div>
          <span className="sp-eyebrow">تقدمك في المحادثة</span>
          <h1>تقدمك في المحادثة</h1>
          <p>بنجمّع دليل من المواقف اللي بتجربها. موقف واحد لوحده مش معناه إن القدرة اتثبتت.</p>
        </div>
        <img src={speakingAssets.ottiProgress} alt="" />
      </header>

      <div className="sp-progress-stats">
        <article><strong>{loading ? '—' : progress.completedSessions}</strong><span>محادثة</span><i>💬</i></article>
        <article><strong>{loading ? '—' : progress.scenariosPractised}</strong><span>مواقف حقيقية</span><i>📍</i></article>
        <article><strong>{loading ? '—' : progress.skillsObserved}</strong><span>قدرات ظهر عليها دليل</span><i>▥</i></article>
      </div>

      {loadFailed ? <p className="sp-progress-note">مش قادرين نحدّث التحليل دلوقتي. محادثاتك نفسها لسه محفوظة.</p> : null}

      <section className="sp-progress-analysis">
        <div className="sp-section-heading">
          <span className="sp-section-icon">▥</span>
          <div><h2>تحليل مهاراتك في المحادثة</h2><p>مبني على دليل متكرر من المحادثات، مش درجة مستوى منفصلة.</p></div>
        </div>

        <div className="sp-skill-list">
          {skills.map((skill) => {
            const config = skillConfig[skill.skillId];
            const evidenceBlocks = Math.min(5, skill.observations);
            return (
              <article className="sp-skill-card" key={skill.skillId}>
                <span className="sp-skill-icon">{config.icon}</span>
                <div className="sp-skill-main">
                  <div className="sp-skill-copy"><strong>{config.title}</strong><small>{skillStatus(skill.observations, skill.demonstrated)}</small></div>
                  <div className="sp-skill-meter" aria-label={`${skill.observations} ملاحظات فعلية`} title="عدد المحادثات اللي ظهر فيها دليل">
                    {Array.from({ length: 5 }).map((_, index) => <i key={index} className={index < evidenceBlocks ? 'is-on' : ''} />)}
                  </div>
                  <Link to={`/speak/scenario/${config.scenarioId}`} className="sp-skill-suggestion">
                    <span>🧳</span><strong>جرّب موقف مناسب: {config.suggestion}</strong><ProductIcon name="chevron" size={18} />
                  </Link>
                </div>
                <ProductIcon name="chevron" size={22} />
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
