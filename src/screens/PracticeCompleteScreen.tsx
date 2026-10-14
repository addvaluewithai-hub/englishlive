import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { OttiMark } from '../character/otti/OttiMark';
import { useI18n } from '../i18n/LocaleProvider';
import { practiceJourneyCopy } from '../practice/journeyCopy';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { PracticeOttiNarrator } from '../practice/PracticeOttiNarrator';
import { reviewNarration } from '../practice/ottiNarration';
import type { PracticeCorrectionRecord, PracticeSupportSummary } from '../practice/runtime';
import styles from './PracticeJourney.module.css';

type CompletionState = {
  support?: PracticeSupportSummary;
  corrections?: PracticeCorrectionRecord[];
  durationSeconds?: number;
  conversationText?: string;
  recordedByOtti?: boolean;
};

export function PracticeCompleteScreen() {
  const { locale, number } = useI18n();
  const copy = practiceJourneyCopy[locale].complete;
  const { missionId } = useParams();
  const mission = practiceMissionContractBySlug(missionId);
  const { state: navigationState } = useLocation();
  const state = (navigationState ?? {}) as CompletionState;
  const support = state.support ?? { intentHints: 0, usefulLanguageReveals: 0, fullHelpReveals: 0 };
  // Only high-confidence Live tool observations appear. No separate Coach API call.
  const corrections = state.recordedByOtti && Array.isArray(state.corrections) ? state.corrections : [];
  const [copied, setCopied] = useState(false);

  async function copyReport() {
    if (!mission) return;
    const report = [
      'Practice: ' + mission.level + ' — ' + mission.titleEn,
      'Source: Otti private Live observations (not a verbatim audio transcript)',
      'Confident issues recorded: ' + corrections.length,
      ...corrections.flatMap((item, i) => [
        `${i + 1}. Heard: ${item.originalEn}`,
        `   Better: ${item.betterEn}`,
        `   Why: ${locale === 'ar' ? item.feedbackAr : item.feedbackEn}`,
      ]),
      ...(corrections.length ? [] : ['No confident language issues were recorded. This does not mean the speech was error-free.']),
      'Help opened: ' + support.intentHints,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
    } catch { setCopied(false); }
  }

  if (!mission) return <section className={styles.root}><h1>{copy.missingTitle}</h1><Link to="/practice">{copy.backPractice}</Link></section>;
  const narration = reviewNarration(mission, locale === 'ar' ? 'ar' : 'en', corrections);
  return (
    <section className={styles.root + ' practice-complete'}>
      <div className="practice-complete-mark"><OttiMark /></div>
      <span className="practice-eyebrow">{locale === 'ar' ? 'Otti معاك بعد المحادثة' : 'Otti after your conversation'}</span>
      <h1>{locale === 'ar' ? 'نراجع كلامك سوا' : 'Your speaking review'}</h1>
      <p>{locale === 'ar' ? 'اسمع Otti بيشرح الملاحظات اللي سجّلها وقت الحوار، وشوف التقرير المكتوب تحت.' :
        'Hear Otti explain the mistakes he noted during the conversation and read the written report below.'}</p>
      {state.recordedByOtti ? (
        <>
          <PracticeOttiNarrator purpose="review" instruction={narration.instruction} message={narration.text} />
          <section className="practice-complete-corrections" aria-label={locale === 'ar' ? 'تقرير المحادثة' : 'Conversation report'}>
            <header>
              <small>{locale === 'ar' ? 'تقرير Otti' : 'Otti report'}</small>
              <strong>{locale === 'ar' ? 'الملاحظات المسجلة' : 'Recorded improvements'}</strong>
            </header>
            {corrections.length ? (
              <div className="practice-complete-correction-list">
                {corrections.map((issue, index) => (
                  <article key={issue.originalEn + index}>
                    <div><small>{copy.youSaid}</small><span lang="en" dir="ltr">{issue.originalEn}</span></div>
                    <div><small>{copy.betterEnglish}</small><strong lang="en" dir="ltr">{issue.betterEn}</strong></div>
                    <p>{locale === 'ar' ? issue.feedbackAr : issue.feedbackEn}</p>
                  </article>
                ))}
              </div>
            ) : <p>{locale === 'ar'
              ? 'Otti ما سجّلش أخطاء لغوية مؤكدة في المحاولة دي. ده مش معناه إن كل كلمة كانت صح.'
              : 'Otti recorded no high-confidence issues in this attempt. This does not prove every word was correct.'}</p>}
          </section>
          <p className="practice-review-evidence-note">
            {locale === 'ar'
              ? 'الملاحظات جاية من سماع Otti أثناء الحوار، مش Transcript حرفي، ومش درجة أو تقييم نهائي للمستوى.'
              : 'These are live listening observations, not a verbatim transcript or a proficiency score.'}
          </p>
          <p className="practice-review-evidence-note">
            {locale === 'ar' ? `استخدمت المساعدة ${number(support.intentHints)} مرة.` : `Help used: ${number(support.intentHints)} times.`}
          </p>
          <button type="button" className="practice-complete-copy" onClick={() => void copyReport()}>
            {copied ? copy.copiedConversation : (locale === 'ar' ? 'نسخ تقرير Otti' : 'Copy Otti report')}
          </button>
        </>
      ) : <p className="practice-coach-status" role="status">{locale === 'ar' ? 'مفيش ملاحظات من جلسة Live محفوظة في الصفحة دي. ابدأ محادثة جديدة علشان تحصل على مراجعة.' : 'No Live session notes were passed to this page. Start a conversation for a review.'}</p>}
      <div className="practice-complete-actions">
        <Link className="practice-complete-primary" to={'/practice/mission/' + mission.slug}>{locale === 'ar' ? 'جرّب تاني' : 'Try again'}</Link>
        <Link className="practice-complete-secondary" to={'/practice/' + mission.level + '/world/' + mission.worldId}>{copy.another}</Link>
      </div>
    </section>
  );
}
