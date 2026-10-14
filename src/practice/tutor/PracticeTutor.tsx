import './tutor.css';
import './tutorReview.css';
import { useState } from 'react';
import { CharacterHost } from '../../character/CharacterHost';
import { getCharacterDefinition } from '../../character/registry';
import { useI18n } from '../../i18n/LocaleProvider';
import { LiveConversationHeader, LiveConversationStatus } from '../../ui/product/LiveConversationChrome';
import { PracticeHintCard } from '../PracticeHintCard';
import { useConversationPracticeRuntime } from '../conversationRuntime';
import type { PracticeMissionContract } from '../types';
import { TutorControls } from './TutorControls';
import { TutorReviewNotes } from './TutorReviewNotes';
import { usePracticeTutor } from './usePracticeTutor';
import type { PracticeCompletionState, TutorPhase } from './types';

export function PracticeTutor({ mission, phase, review, onFinish, onClose }: {
  mission: PracticeMissionContract;
  phase: TutorPhase;
  review?: PracticeCompletionState;
  onFinish?: (state: PracticeCompletionState, relaxed: boolean) => void;
  onClose: () => void;
}) {
  const { locale, t } = useI18n();
  const ar = locale === 'ar';
  const runtime = useConversationPracticeRuntime(mission.slug);
  const [relaxed, setRelaxed] = useState(new URLSearchParams(window.location.search).get('pace') === 'relaxed');
  const [showNotes, setShowNotes] = useState(false);
  const tutor = usePracticeTutor({ mission, phase, locale: ar ? 'ar' : 'en', corrections: review?.corrections ?? [],
    silenceDurationMs: relaxed ? 2400 : 1200, onTurn: runtime.invalidateHint });
  const { state } = tutor;
  const goalIds = phase === 'review' ? review?.achievedGoalIds ?? [] : tutor.goalIds;
  const phases = ar ? ['نتعرّف على الموقف', 'نتكلم', 'نراجع سوا'] : ['Meet the scenario', 'Conversation', 'Review together'];
  const phaseIndex = phase === 'briefing' ? 0 : phase === 'roleplay' ? 1 : 2;
  const title = phases[phaseIndex];
  const statusTitle = tutor.ending ? (ar ? 'بنجهز ملاحظاتك…' : 'Preparing your notes…') :
    state.paused ? (ar ? 'خد وقتك' : 'Take your time') : state.status === 'connecting' || state.status === 'reconnecting' ?
      (ar ? 'بنوصل مع Otti…' : 'Connecting with Otti…') : state.waiting ? (ar ? 'Otti بيفكّر في ردّه…' : 'Otti is responding…') :
        state.status === 'listening' ? t('practice.status.listening.title') : state.status === 'speaking' ?
          (ar ? 'Otti بيتكلم' : 'Otti is speaking') : state.status === 'error' ? t('live.tryAgain') :
            (ar ? 'Otti معاك' : 'Otti is here');
  const body = phase === 'review' ? (ar ? 'اسأل، ناقش، وجرّب الجمل معايا.' : 'Ask questions, discuss, and practise with me.') :
    phase === 'briefing' ? (ar ? 'هنتعلم نعمل إيه، ونجرّب الموقف إزاي.' : 'What we will learn, and the situation we will try.') :
      (ar ? 'اتكلم بطريقتك، وخد وقتك.' : 'Use your own words. Take your time.');
  async function finish() {
    const result = await tutor.finish();
    if (result) onFinish?.({ ...result, support: runtime.getSupportSummary() }, relaxed);
  }
  function discuss(index: number) {
    tutor.discussCorrection(index);
  }
  return <section className="fs-live practice-live tutor-room" aria-label={title}>
    <LiveConversationHeader title={<>{mission.level} • {ar ? mission.titleAr : mission.titleEn}</>}
      brandText="Otti" onClose={phase === 'roleplay' ? () => void finish() : onClose}
      closeLabel={phase === 'roleplay' ? (ar ? 'إنهاء ومراجعة' : 'Finish and review') : (ar ? 'رجوع' : 'Back')}
      disabled={tutor.ending} />
    <div className="tutor-lesson-heading">
      <ol className="tutor-phase-list" aria-label={ar ? 'مراحل الدرس' : 'Lesson phases'}>
        {phases.map((name, index) => <li key={name} aria-current={index === phaseIndex ? 'step' : undefined}>
          <span>{index + 1}</span>{name}
        </li>)}
      </ol>
      <h1>{title}</h1>
      <p>{phase === 'review' ? body : ar ? mission.goalAr : mission.briefing?.successEn}</p>
    </div>
    <div className={`tutor-workspace${phase === 'review' ? ' has-review' : ''}`}>
      <div className="tutor-conversation">
        <div className="tutor-stage">
          <div className="tutor-character">
            <CharacterHost ref={tutor.host} character={getCharacterDefinition('otti')} className="fs-live-character-host" />
          </div>
          <LiveConversationStatus status={state.status} title={statusTitle} body={state.error ? '' : body}
            learnerTurn={state.micOpen && !state.paused && !state.waiting} />
          {state.text ? <article className="tutor-caption" aria-live="polite"><small>Otti</small><p dir="auto">{state.text}</p></article> : null}
        </div>
        <TutorControls tutor={tutor} />
        {phase !== 'review' ? <div className="tutor-facts">
          {mission.briefing?.facts?.map((fact) => <span key={fact.value}>
            <small>{ar ? fact.labelAr : fact.labelEn}</small><bdi dir="ltr">{fact.value}</bdi>
          </span>)}
        </div> : null}
        {phase === 'roleplay' ? <PracticeHintCard runtime={runtime} learnerTurn={state.micOpen && !state.paused && !state.waiting}
          onRequestHint={() => void runtime.requestHint([...tutor.turns.current])} /> : null}
      </div>
      {phase === 'review' && review ? <>
        <button className="tutor-notes-toggle" type="button" onClick={() => setShowNotes((value) => !value)} aria-expanded={showNotes}>
          {ar ? 'ملاحظات المحادثة' : 'Conversation notes'} ({review.corrections?.length ?? 0})
        </button>
        <div className={`tutor-review-column${showNotes ? ' is-expanded' : ''}`}>
          <TutorReviewNotes mission={mission} review={review} onDiscuss={discuss}
            getConnectionDiagnostics={tutor.getConnectionDiagnostics}
            disabled={state.status === 'connecting' || state.status === 'reconnecting'} />
        </div>
      </> : null}
    </div>
    <footer className="tutor-lesson-footer">
      {phase !== 'briefing' ? <div className="practice-conversation-goals tutor-goals" aria-label={ar ? 'فرص الكلام' : 'Speaking opportunities'}>
        {mission.beats.filter((beat) => beat.type === 'required').map((goal) => <span key={goal.id} className={goalIds.includes(goal.id) ? 'is-observed' : ''}>
          {goalIds.includes(goal.id) ? '✓' : '○'} {ar ? goal.overviewAr : goal.learnerIntentEn}
        </span>)}
      </div> : <label className="tutor-pace-choice"><input type="checkbox" checked={relaxed} onChange={(event) => setRelaxed(event.target.checked)} />
        {ar ? 'وقت تفكير أطول بين الجمل' : 'More thinking time between phrases'}</label>}
      {onFinish ? <button type="button" className="tutor-next" disabled={tutor.ending} onClick={() => void finish()}>
        {tutor.ending ? (ar ? 'بنجهز المراجعة…' : 'Preparing review…') : phase === 'briefing' ?
          (ar ? 'ندخل الموقف' : 'Enter the conversation') : (ar ? 'خلصنا؟ نراجع سوا' : 'Done? Review together')}
      </button> : null}
    </footer>
  </section>;
}
