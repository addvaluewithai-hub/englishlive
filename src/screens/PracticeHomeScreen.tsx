import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import {
  PRACTICE_LEVELS,
  PRACTICE_WORLDS,
  practiceMissionsForLevel,
  readPracticeLevel,
  savePracticeLevel,
  type PracticeLevelId,
} from '../practice/catalog';
import { speakingAssets } from '../speaking/assets';

export function PracticeHomeScreen() {
  const [level, setLevel] = useState<PracticeLevelId>(() => readPracticeLevel());
  const levelMeta = PRACTICE_LEVELS.find((item) => item.id === level) ?? PRACTICE_LEVELS[0];
  const missions = useMemo(() => practiceMissionsForLevel(level), [level]);

  function chooseLevel(next: PracticeLevelId) {
    setLevel(next);
    savePracticeLevel(next);
  }

  return (
    <section className="practice-home" dir="rtl">
      <header className="practice-hero">
        <div className="practice-hero-copy">
          <span className="practice-eyebrow">Practice</span>
          <h1>اتدرّب في موقف حقيقي</h1>
          <p>اختار مستواك والموقف. إحنا بنصمم المحادثة، وGemini Live بيخليها تتحرك طبيعي معاك.</p>
          <div className="practice-hero-pills" aria-label="مميزات التدريب">
            <span>مواقف حسب المستوى</span>
            <span>Hints وقت ما تحتاج</span>
            <span>مفيش إجابة واحدة محفوظة</span>
          </div>
        </div>
        <img className="practice-hero-art" src={speakingAssets.ottiHero} alt="" />
      </header>

      <section className="practice-level-section" aria-labelledby="practice-level-heading">
        <div className="practice-section-heading">
          <div>
            <span className="practice-section-kicker">مستوى التدريب</span>
            <h2 id="practice-level-heading">إيه المناسب ليك دلوقتي؟</h2>
          </div>
          <span className="practice-current-level">{level} • {levelMeta.titleAr}</span>
        </div>

        <div className="practice-level-rail" role="list" aria-label="مستويات CEFR">
          {PRACTICE_LEVELS.map((item) => {
            const selected = item.id === level;
            return (
              <button
                key={item.id}
                type="button"
                className={`practice-level-card${selected ? ' is-selected' : ''}`}
                onClick={() => chooseLevel(item.id)}
                aria-pressed={selected}
              >
                <strong dir="ltr">{item.id}</strong>
                <span>{item.titleAr}</span>
              </button>
            );
          })}
        </div>
        <p className="practice-level-promise">{levelMeta.promiseAr}</p>
        <p className="practice-level-note">المستوى فلتر يساعدك تلاقي المناسب بسرعة، مش قفل. تقدر تستكشف أي مستوى وقت ما تحب.</p>
      </section>

      <section className="practice-worlds-section" aria-labelledby="practice-worlds-heading">
        <div className="practice-section-heading">
          <div>
            <span className="practice-section-kicker">العوالم</span>
            <h2 id="practice-worlds-heading">عايز تتدرّب على إيه؟</h2>
          </div>
          <span className="practice-library-count">{missions.length} مواقف مخطط لها في {level}</span>
        </div>

        <div className="practice-world-grid">
          {PRACTICE_WORLDS.map((world) => {
            const count = missions.filter((mission) => mission.worldId === world.id).length;
            return (
              <Link key={world.id} className="practice-world-card" to={`/practice/${level}/world/${world.id}`}>
                <span className="practice-world-emoji" aria-hidden="true">{world.emoji}</span>
                <div>
                  <strong>{world.titleAr}</strong>
                  <p>{world.subtitleAr}</p>
                  <small>{count ? `${count} ${count === 1 ? 'موقف' : 'مواقف'} في ${level}` : `هنضيف مواقف ${level} هنا`}</small>
                </div>
                <ProductIcon name="chevron" size={21} />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="practice-open-section" aria-labelledby="practice-open-heading">
        <div className="practice-section-heading">
          <div>
            <span className="practice-section-kicker">من غير Mission جاهزة</span>
            <h2 id="practice-open-heading">اتكلم بطريقتك</h2>
          </div>
        </div>

        <div className="practice-open-grid">
          <Link className="practice-open-card is-live" to="/speak/just-chat">
            <span className="practice-open-icon"><ProductIcon name="chat" size={28} /></span>
            <div>
              <strong>Free Speak</strong>
              <p>محادثة مفتوحة من غير blueprint أو hints جاهزة.</p>
              <small>متاح دلوقتي</small>
            </div>
          </Link>

          <article className="practice-open-card is-coming" aria-label="Custom scenario قريبًا">
            <span className="practice-open-icon">✨</span>
            <div>
              <strong>Custom scenario</strong>
              <p>اكتب الموقف اللي عايز تتدرب عليه وخليه يتولد ليك.</p>
              <small>قريبًا</small>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}
