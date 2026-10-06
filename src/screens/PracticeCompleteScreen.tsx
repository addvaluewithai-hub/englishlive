import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { OttiMark } from '../character/otti/OttiMark';
import { useI18n } from '../i18n/LocaleProvider';
import { practiceJourneyCopy } from '../practice/journeyCopy';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import type { PracticeCorrectionRecord, PracticeSupportSummary } from '../practice/runtime';
import styles from './PracticeJourney.module.css';

type CompletionState = {
  support?: PracticeSupportSummary;
  corrections?: PracticeCorrectionRecord[];
  durationSeconds?: number;
  conversationText?: string;
};

export function PracticeCompleteScreen() {
  const { locale, number } = useI18n();
  const copy = practiceJourneyCopy[locale].complete;
  const { missionId } = useParams();
  const mission = practiceMissionContractBySlug(missionId);
  const location = useLocation();
  const state = (location.state ?? {}) as CompletionState;
  const support = state.support ?? { intentHints: 0, usefulLanguageReveals: 0, fullHelpReveals: 0 };
  const usedHelp = support.intentHints + support.usefulLanguageReveals + support.fullHelpReveals > 0;
  const corrections = state.corrections ?? [];
  const [copied, setCopied] = useState(false);

  async function copyConversation() {
    if (!state.conversationText) return;
    await navigator.clipboard.writeText(state.conversationText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!mission) {
    return (
      <section className={`${styles.root} practice-mission-missing`}>
        <h1>{copy.missingTitle}</h1>
        <Link to="/practice">{copy.backPractice}</Link>
      </section>
    );
  }

  return (
    <section className={`${styles.root} practice-complete`}>
      <div className="practice-complete-mark"><OttiMark /></div>
      <span className="practice-eyebrow">{copy.eyebrow}</span>
      <h1>{copy.title} <span lang="ar" dir="rtl">«{mission.titleAr}»</span></h1>
      <p>{copy.body}</p>

      <div className="practice-complete-summary">
        <div>
          <small>{copy.arabicHints}</small>
          <strong>{number(support.intentHints)}</strong>
        </div>
        <div>
          <small>{copy.usefulWords}</small>
          <strong>{number(support.usefulLanguageReveals)}</strong>
        </div>
        <div>
          <small>{copy.fullHelp}</small>
          <strong>{number(support.fullHelpReveals)}</strong>
        </div>
      </div>

      <section className="practice-complete-note">
        <strong>{usedHelp ? copy.usedHelpTitle : copy.noHelpTitle}</strong>
        <p>{usedHelp ? copy.usedHelpBody : copy.noHelpBody}</p>
      </section>

      {corrections.length ? (
        <section className="practice-complete-corrections">
          <header>
            <small>{copy.correctionsEyebrow}</small>
            <strong>{copy.correctionsTitle}</strong>
            <p>{copy.correctionsBody}</p>
          </header>
          <div className="practice-complete-correction-list">
            {corrections.map((item, index) => (
              <article key={`${item.beatId}-${index}`}>
                <div>
                  <small>{copy.youSaid}</small>
                  <span lang="en" dir="ltr">{item.originalEn}</span>
                </div>
                <div>
                  <small>{copy.betterEnglish}</small>
                  <strong lang="en" dir="ltr">{item.betterEn}</strong>
                </div>
                {item.requiresRetry ? <em>{copy.retried}</em> : null}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="practice-complete-corrections is-empty">
          <strong>{copy.noCorrections}</strong>
        </section>
      )}

      {state.conversationText ? (
        <button type="button" className="practice-complete-copy" onClick={() => void copyConversation()}>
          {copied ? copy.copiedConversation : copy.copyConversation}
        </button>
      ) : null}

      <div className="practice-complete-actions">
        <Link className="practice-complete-primary" to={`/practice/mission/${mission.slug}`}>{copy.retry}</Link>
        <Link className="practice-complete-secondary" to={`/practice/${mission.level}/world/${mission.worldId}`}>{copy.another}</Link>
      </div>
    </section>
  );
}
