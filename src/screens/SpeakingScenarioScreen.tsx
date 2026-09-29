import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { speakingAssets } from '../speaking/assets';
import { speakingScenarioById, type SpeakingDifficulty } from '../speaking/catalog';

const difficultyCopy: Record<SpeakingDifficulty, { title: string; icon: string }> = {
  easier: { title: 'أسهل', icon: '🌱' },
  recommended: { title: 'مناسب لي', icon: '🎯' },
  challenge: { title: 'تحدي', icon: '💪' },
};

export function SpeakingScenarioScreen() {
  const { scenarioId } = useParams();
  const scenario = speakingScenarioById(scenarioId);
  const [difficulty, setDifficulty] = useState<SpeakingDifficulty>('recommended');

  return (
    <section
      className="sp-start-page"
      dir="rtl"
      style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.22),rgba(255,255,255,.22)), url(${speakingAssets.airportBanner})` }}
    >
      <div className="sp-start-backdrop" />
      <article className="sp-start-sheet">
        <Link to={`/speak/world/${scenario.worldId}`} className="sp-start-close" aria-label="إغلاق"><ProductIcon name="close" size={28} /></Link>
        <span className="sp-sheet-handle" />

        <div className="sp-start-art">
          <img src={scenario.liveCharacterImage ?? scenario.image} alt="" />
        </div>

        <h1>{scenario.titleAr}</h1>

        <div className="sp-role-row">
          <span>👤 أنت: <strong>{scenario.learnerRoleAr}</strong></span>
          <span>🐙 Otti: <strong>{scenario.aiRoleAr}</strong></span>
        </div>

        <section className="sp-goal-card">
          <span className="sp-goal-icon">◎</span>
          <div><strong>الهدف</strong><p>{scenario.goalAr}</p></div>
        </section>

        <section className="sp-uses-card">
          <div className="sp-uses-title"><strong>هتستخدم:</strong><span>✦</span></div>
          <div className="sp-use-chips">
            {scenario.usesAr.map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        <div className="sp-duration">◷ حوالي {scenario.durationMinutes} دقائق</div>

        <section className="sp-difficulty-section">
          <div className="sp-difficulty-heading"><strong>اختر مستوى الصعوبة</strong><span>▥</span></div>
          <div className="sp-difficulty-options">
            {(Object.keys(difficultyCopy) as SpeakingDifficulty[]).map((key) => (
              <button key={key} type="button" className={difficulty === key ? 'is-selected' : ''} onClick={() => setDifficulty(key)}>
                <span>{difficultyCopy[key].icon}</span>{difficultyCopy[key].title}
              </button>
            ))}
          </div>
          <p>✨ {scenario.readinessReasonAr} ✨</p>
        </section>

        <Link className="sp-start-button" to={`/speak/live/${scenario.id}?difficulty=${difficulty}`}>
          <ProductIcon name="speak" size={32} />
          <span>ابدأ المحادثة</span>
          <ProductIcon name="chevron" size={25} />
        </Link>
      </article>
    </section>
  );
}
