import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { useI18n } from '../i18n/LocaleProvider';
import type { PracticeWorldId } from '../practice/catalog';
import { practiceJourneyCopy } from '../practice/journeyCopy';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { speakingAssets } from '../speaking/assets';
import styles from './PracticeJourney.module.css';

function missionVisualForWorld(worldId: PracticeWorldId) {
  switch (worldId) {
    case 'people-social':
      return speakingAssets.meetingPeople;
    case 'food-shopping':
      return speakingAssets.foodOut;
    case 'travel-transport':
      return speakingAssets.ottiTravel;
    case 'work-study':
      return speakingAssets.ottiProgress;
    case 'home-services':
      return speakingAssets.ottiReceptionist;
    case 'plans-leisure':
    case 'everyday':
    default:
      return speakingAssets.ottiHero;
  }
}

export function PracticeMissionScreen() {
  const { locale, number } = useI18n();
  const copy = practiceJourneyCopy[locale].mission;
  const { missionId } = useParams();
  const mission = practiceMissionContractBySlug(missionId);

  if (!mission) {
    return (
      <section className={`${styles.root} practice-mission-missing`}>
        <span aria-hidden="true">🧩</span>
        <h1>{copy.missingTitle}</h1>
        <p>{copy.missingBody}</p>
        <Link to="/practice">{copy.backPractice}</Link>
      </section>
    );
  }

  const responseBeats = mission.beats.filter((beat) => beat.type === 'required');
  const missionVisual = missionVisualForWorld(mission.worldId);

  return (
    <section className={`${styles.root} practice-start-page`}>
      <div className="practice-start-visual" aria-hidden="true">
        <img src={missionVisual} alt="" />
      </div>

      <article className="practice-start-card">
        <Link className="practice-start-back" to={`/practice/${mission.level}/world/${mission.worldId}`}>
          <span aria-hidden="true">{locale === 'ar' ? '→' : '←'}</span>
          <span>{copy.backSituations}</span>
        </Link>

        <div className="practice-start-heading">
          <span className="practice-start-level" dir="ltr">{mission.level}</span>
          <div>
            <small>{copy.eyebrow}</small>
            <h1 lang="ar" dir="rtl">{mission.titleAr}</h1>
            <strong lang="en" dir="ltr">{mission.titleEn}</strong>
          </div>
        </div>

        <div className="practice-start-role-row">
          <span>👤 {copy.learnerRole}: <strong lang="ar" dir="rtl">{mission.learnerRoleAr}</strong></span>
          <span>🐙 {copy.ottiRole}: <strong lang="ar" dir="rtl">{mission.aiRoleAr}</strong></span>
          <span>📍 <span lang="ar" dir="rtl">{mission.settingAr}</span></span>
        </div>

        <section className="practice-start-goal">
          <span aria-hidden="true">◎</span>
          <div>
            <small>{copy.goal}</small>
            <strong lang="ar" dir="rtl">{mission.goalAr}</strong>
          </div>
        </section>

        <section className="practice-start-flow">
          <header>
            <small>{copy.flowKicker}</small>
            <strong>{copy.flowTitle}</strong>
          </header>
          <ol>
            {responseBeats.map((beat, index) => (
              <li key={beat.id}>
                <span>{number(index + 1)}</span>
                <div>
                  <strong lang="ar" dir="rtl">{beat.overviewAr ?? copy.defaultBeat}</strong>
                  <small>{index === 0 ? copy.firstBeatHelp : copy.nextBeatHelp}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="practice-start-hints">
          <div className="practice-start-hint-icon" aria-hidden="true">💡</div>
          <div>
            <strong>{copy.hintTitle}</strong>
            <p>{copy.hintBody}</p>
          </div>
        </section>

        <div className="practice-start-meta">
          <span>◷ {copy.minutes(number(mission.durationMinutes))}</span>
          <span>🎙️ {copy.liveConversation}</span>
          <span>✓ {copy.correction}</span>
        </div>

        <Link className="practice-start-button" to={`/practice/live/${mission.slug}`}>
          <ProductIcon name="speak" size={30} />
          <span>{copy.start}</span>
          <ProductIcon name="chevron" size={23} />
        </Link>
      </article>
    </section>
  );
}
