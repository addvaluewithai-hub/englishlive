import { useState } from 'react';
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
  const [relaxed, setRelaxed] = useState(false);

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
  const briefing = mission.briefing;
  const briefingSituation = briefing ? (locale === 'ar' ? briefing.situationAr : briefing.situationEn) : '';
  const briefingMoves = briefing ? (locale === 'ar' ? briefing.requiredMovesAr : briefing.requiredMovesEn) : [];
  const briefingSuccess = briefing ? (locale === 'ar' ? briefing.successAr : briefing.successEn) : '';

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

        {briefing ? (
          <section className="practice-start-brief">
            <header>
              <small>{copy.situation}</small>
              <strong>{briefingSituation}</strong>
            </header>

            {briefing.facts?.length ? (
              <div className="practice-start-brief-facts">
                {briefing.facts.map((fact) => (
                  <div key={fact.value}>
                    <small>{locale === 'ar' ? fact.labelAr : fact.labelEn}</small>
                    <strong dir="ltr">{fact.value}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="practice-start-brief-moves">
              <small>{locale === 'ar' ? 'فرصتك تتدرّب على' : 'Opportunities to practise'}</small>
              <ol>
                {briefingMoves.map((move, index) => (
                  <li key={move}>
                    <span>{number(index + 1)}</span>
                    <strong>{move}</strong>
                  </li>
                ))}
              </ol>
            </div>

            <footer>
              <small>{copy.success}</small>
              <strong>{briefingSuccess}</strong>
            </footer>
          </section>
        ) : (
          <>
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
          </>
        )}

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

        <label className="practice-pause-choice">
          <input type="checkbox" checked={relaxed} onChange={(event) => setRelaxed(event.target.checked)} />
          <span>{locale === 'ar' ? 'وقت تفكير أطول بين الجمل' : 'More thinking time between phrases'}</span>
        </label>
        <p className="practice-start-conversation-note">{locale === 'ar' ? 'اتكلم بطريقتك. الملاحظات هتستناك، وإنت تختار وقت المراجعة.' : 'Use your own words. Feedback can wait; you choose when to review.'}</p>
        <Link className="practice-start-button" to={`/practice/live/${mission.slug}${relaxed ? '?pace=relaxed' : ''}`}>
          <ProductIcon name="speak" size={30} />
          <span>{copy.start}</span>
          <ProductIcon name="chevron" size={23} />
        </Link>
      </article>
    </section>
  );
}

