import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { findSpeakingScenario, speakingAssets, type SpeakingDifficulty } from '../speaking/catalog';

const difficultyLabels: Record<SpeakingDifficulty, string> = {
  easier: 'أسهل',
  recommended: 'مناسب لي',
  challenge: 'تحدي',
};

export function SpeakingScenarioScreen() {
  const { scenarioId } = useParams();
  const [difficulty, setDifficulty] = useState<SpeakingDifficulty>('recommended');
  const scenario = scenarioId ? findSpeakingScenario(scenarioId) : null;
  if (!scenario) return <Navigate replace to="/speak" />;

  const isHotel = scenario.id !== 'first-meeting';
  const art = isHotel ? speakingAssets.hotelReception : speakingAssets.meetingPeople;

  return (
    <section className="spk3-scenario-stage" dir="rtl">
      <div
        className="spk3-scenario-backdrop"
        aria-hidden="true"
        style={{ backgroundImage: `linear-gradient(rgba(11,29,58,.18),rgba(11,29,58,.3)), url("${speakingAssets.ottiTravel}")` }}
      />
      <div className="spk3-start-sheet">
        <span className="spk3-sheet-handle" />
        <Link className="spk3-sheet-close" to={isHotel ? '/speak/world/travel' : '/speak'} aria-label="إغلاق">
          <ProductIcon name="close" size={25} />
        </Link>
        <div className="spk3-sheet-art">
          <img src={art} alt="" />
        </div>
        <h1>{scenario.title}</h1>
        <div className="spk3-role-row">
          <span>🐙 Otti · {scenario.aiRole ?? 'شريك محادثة'}</span>
          <span>أنت: {scenario.learnerRole ?? 'متعلم'}</span>
        </div>
        <section className="spk3-goal-card">
          <span className="spk3-goal-symbol" aria-hidden="true">🎯</span>
          <div><strong>الهدف</strong><p>{scenario.goal}</p></div>
        </section>
        <section className="spk3-uses-card">
          <strong>هتستخدم:</strong>
          <div>{scenario.uses?.map((item) => <span key={item}>{item}</span>)}</div>
        </section>
        <div className="spk3-duration">◷ {scenario.duration}</div>
        <div className="spk3-difficulty-heading"><strong>اختر مستوى الصعوبة</strong><span>▥</span></div>
        <div className="spk3-difficulty-grid">
          {(['easier', 'recommended', 'challenge'] as SpeakingDifficulty[]).map((item) => (
            <button
              key={item}
              className={difficulty === item ? 'is-selected' : ''}
              type="button"
              onClick={() => setDifficulty(item)}
            >
              {item === 'easier' ? '🌱' : item === 'challenge' ? '💪' : '🎯'} {difficultyLabels[item]}
            </button>
          ))}
        </div>
        <p className="spk3-difficulty-note">✨ مقترح لك بناءً على تقدمك في المنهج ومحادثاتك</p>
        <Link className="spk3-primary-cta spk3-start-cta" to={`/speak/live/${scenario.id}?difficulty=${difficulty}`}>
          <ProductIcon name="speak" size={30} /><span>ابدأ المحادثة</span><ProductIcon name="chevron" size={22} />
        </Link>
      </div>
    </section>
  );
}
