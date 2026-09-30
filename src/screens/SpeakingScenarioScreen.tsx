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
  const isCurriculumLesson = Boolean(scenario.curriculum);
  const closeTo = isCurriculumLesson ? '/speak' : `/speak/world/${scenario.worldId}`;
  const liveTo = isCurriculumLesson
    ? `/speak/live/${scenario.id}`
    : `/speak/live/${scenario.id}?difficulty=${difficulty}`;

  return (
    <section
      className="sp-start-page"
      dir="rtl"
      style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.22),rgba(255,255,255,.22)), url(${isCurriculumLesson ? scenario.image : speakingAssets.airportBanner})` }}
    >
      <div className="sp-start-backdrop" />
      <article className="sp-start-sheet">
        <Link to={closeTo} className="sp-start-close" aria-label="إغلاق"><ProductIcon name="close" size={28} /></Link>
        <span className="sp-sheet-handle" />

        <div className="sp-start-art">
          <img src={scenario.liveCharacterImage ?? scenario.image} alt="" />
        </div>

        {scenario.curriculum ? (
          <div className="sp-curriculum-chip">
            {scenario.curriculum.level} • الوحدة {scenario.curriculum.unit} • الدرس {scenario.curriculum.position} من {scenario.curriculum.totalInUnit}
          </div>
        ) : null}

        <h1>{scenario.titleAr}</h1>

        {isCurriculumLesson && scenario.skillFocusAr ? (
          <div className="sp-curriculum-chip">مهارة الكلام: {scenario.skillFocusAr}</div>
        ) : (
          <div className="sp-role-row">
            <span>👤 أنت: <strong>{scenario.learnerRoleAr}</strong></span>
            <span>🐙 Otti: <strong>{scenario.aiRoleAr}</strong></span>
          </div>
        )}

        <section className="sp-goal-card">
          <span className="sp-goal-icon">◎</span>
          <div><strong>{isCurriculumLesson ? 'هدف التدريب' : 'الهدف'}</strong><p>{scenario.goalAr}</p></div>
        </section>

        <section className="sp-uses-card">
          <div className="sp-uses-title"><strong>{isCurriculumLesson ? 'هتتدرّب على:' : 'هتستخدم:'}</strong><span>✦</span></div>
          <div className="sp-use-chips">
            {scenario.usesAr.map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        {isCurriculumLesson && scenario.practiceStepsAr?.length ? (
          <section className="sp-uses-card">
            <div className="sp-uses-title"><strong>شكل الدرس:</strong><span>↗</span></div>
            <div className="sp-use-chips">
              {scenario.practiceStepsAr.map((item, index) => <span key={item}>{index + 1}. {item}</span>)}
            </div>
          </section>
        ) : null}

        <div className="sp-duration">◷ حوالي {scenario.durationMinutes} دقائق</div>

        {isCurriculumLesson ? (
          <section className="sp-curriculum-fixed">
            <strong>اللغة مش موضوع الدرس</strong>
            <p>Otti هيستخدم لغة A1 موجودة عندك كأداة للتدريب. الحكم هنا على مهارة الكلام نفسها، مش إنك تكرر جملة من Learn.</p>
          </section>
        ) : (
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
        )}

        <Link className="sp-start-button" to={liveTo}>
          <ProductIcon name="speak" size={32} />
          <span>{isCurriculumLesson ? 'ابدأ تدريب الكلام' : 'ابدأ المحادثة'}</span>
          <ProductIcon name="chevron" size={25} />
        </Link>
      </article>
    </section>
  );
}
