import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { useI18n } from '../i18n/LocaleProvider';
import {
  PRACTICE_LEVELS,
  PRACTICE_WORLDS,
  practiceMissionsForLevel,
  readPracticeLevel,
  savePracticeLevel,
  type PracticeLevelId,
} from '../practice/catalog';
import { practiceJourneyCopy } from '../practice/journeyCopy';
import { speakingAssets } from '../speaking/assets';
import styles from './PracticeJourney.module.css';

export function PracticeHomeScreen() {
  const { locale, number } = useI18n();
  const copy = practiceJourneyCopy[locale].home;
  const [level, setLevel] = useState<PracticeLevelId>(() => readPracticeLevel());
  const levelMeta = PRACTICE_LEVELS.find((item) => item.id === level) ?? PRACTICE_LEVELS[0];
  const missions = useMemo(() => practiceMissionsForLevel(level), [level]);

  function chooseLevel(next: PracticeLevelId) {
    setLevel(next);
    savePracticeLevel(next);
  }

  return (
    <section className={`${styles.root} practice-home`}>
      <header className="practice-hero">
        <div className="practice-hero-copy">
          <span className="practice-eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
          <div className="practice-hero-pills" aria-label={copy.featuresLabel}>
            {copy.features.map((feature) => <span key={feature}>{feature}</span>)}
          </div>
        </div>
        <img className="practice-hero-art" src={speakingAssets.ottiHero} alt="" />
      </header>

      <section className="practice-level-section" aria-labelledby="practice-level-heading">
        <div className="practice-section-heading">
          <div>
            <span className="practice-section-kicker">{copy.levelKicker}</span>
            <h2 id="practice-level-heading">{copy.levelTitle}</h2>
          </div>
          <span className="practice-current-level">
            <bdi dir="ltr">{level}</bdi>
            {' • '}
            <span lang="ar" dir="rtl">{levelMeta.titleAr}</span>
          </span>
        </div>

        <div className="practice-level-rail" role="list" aria-label="CEFR">
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
                <span lang="ar" dir="rtl">{item.titleAr}</span>
              </button>
            );
          })}
        </div>
        <p className="practice-level-promise" lang="ar" dir="rtl">{levelMeta.promiseAr}</p>
        <p className="practice-level-note">{copy.levelNote}</p>
      </section>

      <section className="practice-worlds-section" aria-labelledby="practice-worlds-heading">
        <div className="practice-section-heading">
          <div>
            <span className="practice-section-kicker">{copy.worldsKicker}</span>
            <h2 id="practice-worlds-heading">{copy.worldsTitle}</h2>
          </div>
          <span className="practice-library-count">{copy.plannedForLevel(number(missions.length), level)}</span>
        </div>

        <div className="practice-world-grid">
          {PRACTICE_WORLDS.map((world) => {
            const count = missions.filter((mission) => mission.worldId === world.id).length;
            return (
              <Link key={world.id} className="practice-world-card" to={`/practice/${level}/world/${world.id}`}>
                <span className="practice-world-emoji" aria-hidden="true">{world.emoji}</span>
                <div>
                  <strong lang="ar" dir="rtl">{world.titleAr}</strong>
                  <p lang="ar" dir="rtl">{world.subtitleAr}</p>
                  <small>{count ? copy.worldCount(number(count), level) : copy.worldEmpty(level)}</small>
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
            <span className="practice-section-kicker">{copy.openKicker}</span>
            <h2 id="practice-open-heading">{copy.openTitle}</h2>
          </div>
        </div>

        <div className="practice-open-grid">
          <Link className="practice-open-card is-live" to="/speak/just-chat">
            <span className="practice-open-icon"><ProductIcon name="chat" size={28} /></span>
            <div>
              <strong>Free Speak</strong>
              <p>{copy.freeSpeakBody}</p>
              <small>{copy.availableNow}</small>
            </div>
          </Link>

          <article className="practice-open-card is-coming" aria-label={`${copy.customScenario} — ${copy.comingSoon}`}>
            <span className="practice-open-icon">✨</span>
            <div>
              <strong>{copy.customScenario}</strong>
              <p>{copy.customBody}</p>
              <small>{copy.comingSoon}</small>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}
