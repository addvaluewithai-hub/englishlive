import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { OttiMark } from '../character/otti/OttiMark';
import { useI18n } from '../i18n/LocaleProvider';
import { practiceJourneyCopy } from '../practice/journeyCopy';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { requestPracticeCoach } from '../practice/coachClient';
import type { ConversationTurn } from '../practice/conversationTypes';
import type { PracticeCorrectionRecord, PracticeSupportSummary } from '../practice/runtime';
import styles from './PracticeJourney.module.css';

type CompletionState = {
  support?: PracticeSupportSummary; corrections?: PracticeCorrectionRecord[];
  durationSeconds?: number; conversationText?: string; transcript?: ConversationTurn[]; achievedGoalIds?: string[];
  /** Count of microphone segments not captured or not transcribed in full. */
  missingAudioCount?: number;
};

export function PracticeCompleteScreen() {
  const { locale, number } = useI18n();
  const copy = practiceJourneyCopy[locale].complete;
  const { missionId } = useParams();
  const mission = practiceMissionContractBySlug(missionId);
  const location = useLocation();
  const state = (location.state ?? {}) as CompletionState;
  const support = state.support ?? { intentHints: 0, usefulLanguageReveals: 0, fullHelpReveals: 0 };
  const [corrections, setCorrections] = useState(state.corrections ?? []);
  const [achieved, setAchieved] = useState(state.missingAudioCount ? [] : (state.achievedGoalIds ?? []));
  const [reviewing, setReviewing] = useState(!state.missingAudioCount && Boolean(state.transcript?.some((turn) => turn.speaker === 'learner')));
  const [reviewError, setReviewError] = useState(false);
  const [nextFocus, setNextFocus] = useState({ ar: '', en: '' });
  const [copied, setCopied] = useState(false);
  const [reviewAttempt, setReviewAttempt] = useState(0);

  useEffect(() => {
    const transcript = state.transcript;
    // Never award completed goals or grammar corrections from an incomplete mic recording.
    if (state.missingAudioCount || !mission || !transcript?.some((turn) => turn.speaker === 'learner')) return;
    const abort = new AbortController();
    setReviewing(true);
    setReviewError(false);
    void requestPracticeCoach({ missionSlug: mission.slug, mode: 'recap', turnId: 'recap', transcript: transcript.slice(-80) }, abort.signal)
      .then((result) => {
        if (abort.signal.aborted) return;
        setCorrections((old) => [...old, ...result.corrections].filter((item, index, all) => all.findIndex((row) => row.originalEn === item.originalEn && row.betterEn === item.betterEn) === index));
        setAchieved((old) => [...new Set([...old, ...result.achievedGoalIds])]);
        setNextFocus({ ar: result.nextFocusAr, en: result.nextFocusEn });
      }).catch(() => { if (!abort.signal.aborted) setReviewError(true); })
      .finally(() => { if (!abort.signal.aborted) setReviewing(false); });
    return () => abort.abort();
    // Each navigation state owns one transcript; retry is explicitly learner-triggered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, mission?.slug, reviewAttempt]);

  async function copyConversation() {
    if (!state.conversationText) return;
    try {
      await navigator.clipboard.writeText([
        state.conversationText, '', '--- Review ---',
        ...corrections.map((item) => 'You said: ' + item.originalEn + '\nBetter: ' + item.betterEn),
        'Observed goals: ' + (achieved.join(', ') || 'No goals confirmed by coach yet'),
        'Review: ' + (state.missingAudioCount ? `incomplete audio (${state.missingAudioCount} segments missing)` : reviewing ? 'pending' : reviewError ? 'unavailable' : 'finished'),
      ].join('\n'));
      setCopied(true);
    } catch { setCopied(false); }
  }

  if (!mission) return <section className={styles.root}><h1>{copy.missingTitle}</h1><Link to="/practice">{copy.backPractice}</Link></section>;

  return (
    <section className={styles.root + ' practice-complete'}>
      <div className="practice-complete-mark"><OttiMark /></div>
      <span className="practice-eyebrow">{locale === 'ar' ? 'وقفة للتعلم' : 'A moment to learn'}</span>
      <h1>{locale === 'ar' ? 'مراجعة محادثتك' : 'Your conversation review'}</h1>
      <p>{locale === 'ar' ? 'دي ملاحظات من الكلام اللي قلته، وفرص تجرّبها المرة الجاية.' : 'Notes from what you said, and opportunities for your next conversation.'}</p>
      <p className="practice-review-duration">{number(Math.round((state.durationSeconds ?? 0) / 60))} {locale === 'ar' ? 'دقيقة كلام وتفكير' : 'minutes of speaking and thinking'}</p>
      <div className="practice-conversation-goals is-recap" aria-label={locale === 'ar' ? 'فرص الكلام اللي ظهرت' : 'Observed speaking opportunities'}>
        {mission.beats.filter((goal) => goal.type !== 'ending').map((goal) => <span key={goal.id} className={achieved.includes(goal.id) ? 'is-observed' : ''}>
          <span aria-hidden="true">{achieved.includes(goal.id) ? '✓' : '○'}</span>{' '}{locale === 'ar' ? goal.overviewAr : goal.learnerIntentEn}
        </span>)}
      </div>
      <small className="practice-review-evidence-note">{locale === 'ar' ? 'العلامات ملاحظات عن المحادثة دي، مش درجة أو إثبات إتقان.' : 'These observations describe this conversation, not a score or proof of mastery.'}</small>
      {state.missingAudioCount ? <p className="practice-coach-status" role="alert">{locale === 'ar' ? `في ${number(state.missingAudioCount)} مقطع صوتي ما اتسجلش أو ما اتفرغش بالكامل. علشان مانقيّمش محادثة ناقصة، مش هنعرض تصحيح أو أهداف مُنجزة للمحاولة دي. جرب مرة تانية.` : `${state.missingAudioCount} voice segment(s) were not captured or transcribed. No language corrections or goal assessment will be generated from an incomplete conversation. Please try again.`}</p> : null}
      {reviewing ? <p className="practice-coach-status" role="status">{locale === 'ar' ? 'بنراجع باقي كلامك… تقدر تشوف الملاحظات اللي جاهزة.' : 'Reviewing the rest of your conversation… Available notes are below.'}</p> : null}
      {reviewError ? <p className="practice-coach-status" role="alert">{locale === 'ar' ? 'المراجعة الكاملة ما وصلتش. الملاحظات المتاحة محفوظة هنا.' : 'The full review is unavailable. Your existing notes are still here.'} <button type="button" onClick={() => setReviewAttempt((value) => value + 1)}>{locale === 'ar' ? 'حاول تاني' : 'Retry review'}</button></p> : null}
      {!state.missingAudioCount && corrections.length ? (
        <section className="practice-complete-corrections">
          <header><small>{copy.correctionsEyebrow}</small><strong>{copy.correctionsTitle}</strong></header>
          <div className="practice-complete-correction-list">
            {corrections.map((item, index) => <article key={item.originalEn + index}>
              <div><small>{copy.youSaid}</small><span lang="en" dir="ltr">{item.originalEn}</span></div>
              <div><small>{copy.betterEnglish}</small><strong lang="en" dir="ltr">{item.betterEn}</strong></div>
              <p>{locale === 'ar' ? item.feedbackAr : item.feedbackEn}</p>
            </article>)}
          </div>
        </section>
      ) : !state.missingAudioCount && !reviewing && !reviewError ? <section className="practice-complete-corrections is-empty"><strong>{state.transcript?.some((turn) => turn.speaker === 'learner') ? (locale === 'ar' ? 'مفيش تصحيح واضح محتاجين نضيفه من المحادثة دي.' : 'No clear correction to add from this conversation.') : (locale === 'ar' ? 'لسه مفيش كلام كفاية للمراجعة. جرّب الموقف وارجع هنا.' : 'There is not enough speech to review yet. Try the conversation first.')}</strong></section> : null}
      {(locale === 'ar' ? nextFocus.ar : nextFocus.en) ? <section className="practice-complete-note"><strong>{locale === 'ar' ? 'جرّب المرة الجاية' : 'Try next time'}</strong><p>{locale === 'ar' ? nextFocus.ar : nextFocus.en}</p></section> : null}
      <p className="practice-review-evidence-note">{locale === 'ar' ? 'فتحت مساعدة ' + number(support.intentHints) + ' مرة. المساعدة جزء من التعلّم.' : 'You opened help ' + number(support.intentHints) + ' times. Help is part of learning.'}</p>
      {state.conversationText ? <button type="button" className="practice-complete-copy" onClick={() => void copyConversation()}>{copied ? copy.copiedConversation : copy.copyConversation}</button> : null}
      <div className="practice-complete-actions">
        <Link className="practice-complete-primary" to={'/practice/mission/' + mission.slug}>{locale === 'ar' ? 'جرّب تاني بطريقتك' : 'Try again in your own words'}</Link>
        <Link className="practice-complete-secondary" to={'/practice/' + mission.level + '/world/' + mission.worldId}>{copy.another}</Link>
      </div>
    </section>
  );
}
