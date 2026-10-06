import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { useI18n } from '../i18n/LocaleProvider';
import {
  PRACTICE_LEVELS,
  isPracticeLevelId,
  practiceMissionsForWorld,
  practiceWorldById,
  savePracticeLevel,
  type PracticeLevelId,
} from '../practice/catalog';
import { practiceJourneyCopy } from '../practice/journeyCopy';
import styles from './PracticeJourney.module.css';

export function PracticeWorldScreen() {
  const { locale, number } = useI18n();
  const copy = practiceJourneyCopy[locale].world;
  const { levelId, worldId } = useParams();
  const level: PracticeLevelId = isPracticeLevelId(levelId) ? levelId : 'A1';
  const world = practiceWorldById(worldId);
  const missions = practiceMissionsForWorld(level, world.id);

  return (
    <section className={`${styles.root} practice-world-screen`}>
      <header className="practice-world-header">
        <Link className="practice-back-link" to="/practice">
          <span aria-hidden="true">{locale === 'ar' ? '→' : '←'}</span>
          <span>{copy.back}</span>
        </Link>

        <div className="practice-world-title-row">
          <span className="practice-world-hero-emoji" aria-hidden="true">{world.emoji}</span>
          <div>
            <span className="practice-eyebrow">Practice • <bdi dir="ltr">{level}</bdi></span>
            <h1 lang="ar" dir="rtl">{world.titleAr}</h1>
            <p lang="ar" dir="rtl">{world.subtitleAr}</p>
          </div>
        </div>
      </header>

      <section className="practice-world-levels" aria-label={copy.changeLevel}>
        <span>{copy.levelLabel}</span>
        <div>
          {PRACTICE_LEVELS.map((item) => (
            <Link
              key={item.id}
              className={item.id === level ? 'is-selected' : ''}
              to={`/practice/${item.id}/world/${world.id}`}
              onClick={() => savePracticeLevel(item.id)}
              dir="ltr"
            >
              {item.id}
            </Link>
          ))}
        </div>
      </section>

      <section className="practice-mission-section" aria-labelledby="practice-missions-heading">
        <div className="practice-section-heading">
          <div>
            <span className="practice-section-kicker">{copy.situationsKicker(level)}</span>
            <h2 id="practice-missions-heading">{copy.chooseMission}</h2>
          </div>
          <span className="practice-library-count">{missions.length ? copy.plannedCount(number(missions.length)) : copy.libraryBuilding}</span>
        </div>

        {missions.length ? (
          <div className="practice-mission-grid">
            {missions.map((mission) => {
              const body = (
                <>
                  <div className="practice-mission-topline">
                    <span className="practice-mission-level" dir="ltr">{mission.level}</span>
                    <span className={`practice-mission-status is-${mission.status}`}>{mission.status === 'live' ? copy.live : copy.planned}</span>
                  </div>
                  <h3 lang="ar" dir="rtl">{mission.titleAr}</h3>
                  <strong lang="en" dir="ltr">{mission.titleEn}</strong>
                  <p lang="ar" dir="rtl">{mission.descriptionAr}</p>
                  <footer>
                    <span>◷ {copy.minutes(number(mission.durationMinutes))}</span>
                    {mission.status === 'live'
                      ? <span className="practice-mission-go">{copy.start} <ProductIcon name="chevron" size={17} /></span>
                      : <span>{copy.blueprint}</span>}
                  </footer>
                </>
              );

              return mission.status === 'live' && mission.livePath ? (
                <Link key={mission.id} className="practice-mission-card is-live" to={mission.livePath}>{body}</Link>
              ) : (
                <article key={mission.id} className="practice-mission-card is-planned">{body}</article>
              );
            })}
          </div>
        ) : (
          <div className="practice-empty-world">
            <span aria-hidden="true">🧩</span>
            <h3>{copy.emptyTitle}</h3>
            <p>{copy.emptyBody(level)}</p>
            <Link to="/practice">{copy.anotherWorld}</Link>
          </div>
        )}
      </section>

      <aside className="practice-world-note">
        <strong>{copy.hintTitle}</strong>
        <p>{copy.hintBody}</p>
      </aside>
    </section>
  );
}
