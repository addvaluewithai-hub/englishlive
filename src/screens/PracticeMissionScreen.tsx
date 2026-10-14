import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { useI18n } from '../i18n/LocaleProvider';
import type { PracticeWorldId } from '../practice/catalog';
import { practiceJourneyCopy } from '../practice/journeyCopy';
import { PracticeOttiNarrator } from '../practice/PracticeOttiNarrator';
import { briefingNarration } from '../practice/ottiNarration';
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
  const { locale } = useI18n();
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

  const missionVisual = missionVisualForWorld(mission.worldId);
  const narration = briefingNarration(mission, locale === 'ar' ? 'ar' : 'en');

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
          <span aria-hidden="true">🎯</span>
          <div>
            <small>{locale === 'ar' ? 'هدف المحادثة' : 'Your mission'}</small>
            <strong lang="ar" dir="rtl">{mission.goalAr}</strong>
          </div>
        </section>
        {mission.briefing?.facts?.length ? (
          <div className="practice-start-brief-facts">
            {mission.briefing.facts.map((fact) => (
              <div key={fact.value}>
                <small>{locale === 'ar' ? fact.labelAr : fact.labelEn}</small>
                <strong dir="ltr">{fact.value}</strong>
              </div>
            ))}
          </div>
        ) : null}
        <PracticeOttiNarrator instruction={narration.instruction} message={narration.text} purpose="briefing" />
        <p className="practice-review-evidence-note">
          {locale === 'ar'
            ? 'Otti هيشرحلك الموقف ويسمّعك نموذج حوار. المثال للتوضيح فقط؛ إنت هتتكلم بطريقتك.'
            : 'Otti will explain the situation and speak an example. Use your own words in the real conversation.'}
        </p>

        <label className="practice-pause-choice">
          <input type="checkbox" checked={relaxed} onChange={(event) => setRelaxed(event.target.checked)} />
          <span>{locale === 'ar' ? 'وقت تفكير أطول بين الجمل' : 'More thinking time between phrases'}</span>
        </label>

        <Link className="practice-start-button" to={`/practice/live/${mission.slug}${relaxed ? '?pace=relaxed' : ''}`}>
          <ProductIcon name="speak" size={30} />
          <span>{copy.start}</span>
          <ProductIcon name="chevron" size={23} />
        </Link>
      </article>
    </section>
  );
}

