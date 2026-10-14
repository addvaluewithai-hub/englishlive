import './tutor.css';
import { CharacterHost } from '../../character/CharacterHost';
import { getCharacterDefinition } from '../../character/registry';
import { useI18n } from '../../i18n/LocaleProvider';
import { LiveConversationHeader, LiveConversationStatus } from '../../ui/product/LiveConversationChrome';
import { PracticeHintCard } from '../PracticeHintCard';
import { useConversationPracticeRuntime } from '../conversationRuntime';
import type { PracticeMissionContract } from '../types';
import type { PracticeCorrectionRecord } from '../runtime';
import { TutorControls } from './TutorControls';
import { usePracticeTutor } from './usePracticeTutor';
import type { PracticeCompletionState, TutorPhase } from './types';
import { useState } from 'react';

const noCorrections: PracticeCorrectionRecord[] = [];
export function PracticeTutor({ mission, phase, corrections = noCorrections, observedGoalIds = [], onFinish, onClose }: {
  mission: PracticeMissionContract;
  phase: TutorPhase;
  corrections?: PracticeCorrectionRecord[];
  observedGoalIds?: string[];
  onFinish?: (state: PracticeCompletionState, relaxed: boolean) => void;
  onClose: () => void;
}) {
  const { locale, t } = useI18n();
  const ar = locale === 'ar';
  const runtime = useConversationPracticeRuntime(mission.slug);
  const [relaxed, setRelaxed] = useState(new URLSearchParams(window.location.search).get('pace') === 'relaxed');
  const [copied, setCopied] = useState(false);
  const tutor = usePracticeTutor({ mission, phase, locale: ar ? 'ar' : 'en', corrections,
    silenceDurationMs: relaxed ? 2400 : 1200, onTurn: runtime.invalidateHint });
  const { state } = tutor;
  const goalIds = phase === 'review' ? observedGoalIds : tutor.goalIds;
  const goals = mission.beats.filter((beat) => beat.type === 'required');
  const title = phase === 'briefing' ? (ar ? 'نبدأ الدرس مع Otti' : 'Start your lesson with Otti') :
    phase === 'review' ? (ar ? 'نراجع كلامك سوا' : 'Your speaking review') : t('practice.headerTitle');
  const statusTitle = state.paused ? (ar ? 'خد وقتك' : 'Take your time') : state.waiting ?
    (ar ? 'Otti بيرد عليك' : 'Otti is responding') : state.status === 'listening' ?
      t('practice.status.listening.title') : state.status === 'speaking' ? t('practice.status.speaking.title') :
      state.status === 'error' ? t('live.tryAgain') : (ar ? 'اتكلم مع Otti' : 'Talk with Otti');

  async function finish() {
    const result = await tutor.finish();
    if (result) onFinish?.({ ...result, support: runtime.getSupportSummary() }, relaxed);
  }
  async function copyConversation() {
    try {
      const notes = tutor.session.current;
      notes?.flushTeacher();
      await navigator.clipboard.writeText([
        `Practice: ${mission.titleEn}`,
        ...tutor.turns.current.map((turn) => `${turn.speaker}: ${turn.text}`),
        'Only typed learner lines are verbatim. Voice is not transcribed.',
      ].join('\n'));
      setCopied(true);
    } catch { setCopied(false); }
  }

  return <section className="fs-live sp-scenario-live practice-live" aria-label={title}>
    <LiveConversationHeader title={<>{mission.level} • <span lang="ar" dir="rtl">{mission.titleAr}</span></>}
      brandText={title} onClose={phase === 'roleplay' ? () => void finish() : onClose}
      closeLabel={phase === 'roleplay' ? (ar ? 'إنهاء ومراجعة' : 'Finish and review') : (ar ? 'رجوع' : 'Back')} disabled={tutor.ending}
      className="sp-scenario-live-header" />
    <aside className="practice-live-task" aria-label={ar ? 'ملخص المهمة' : 'Mission summary'}>
      <div><small>{ar ? 'هدفك' : 'Your goal'}</small><strong>{ar ? mission.goalAr : mission.briefing?.successEn}</strong></div>
      {mission.briefing?.facts?.map((fact) => <span key={fact.value}>
        <small>{ar ? fact.labelAr : fact.labelEn}</small><bdi dir="ltr">{fact.value}</bdi>
      </span>)}
    </aside>
    <div className="fs-live-stage sp-scenario-stage practice-live-stage">
      {state.text ? <article className="sp-otti-transcript" aria-live="polite">
        <small>Otti • <span lang="ar" dir="rtl">{mission.aiRoleAr}</span></small><p dir="auto">{state.text}</p>
      </article> : null}
      <div className="fs-live-character sp-scenario-character">
        <CharacterHost ref={tutor.host} character={getCharacterDefinition('otti')} className="fs-live-character-host" />
      </div>
      <LiveConversationStatus status={state.status} title={statusTitle}
        body={phase === 'review' ? (ar ? 'اسأل عن أي ملاحظة وجرّب الجمل مع Otti.' : 'Ask about any correction and practise phrases with Otti.') :
          phase === 'briefing' ? (ar ? 'Otti هيشرح الدرس، وتقدر تسأله عن الموقف.' : 'Otti introduces the lesson. Ask about the scenario anytime.') :
            (ar ? 'الملاحظات هتتراجع بعد الحوار.' : 'Private notes are reviewed after the conversation.')}
        learnerTurn={state.micOpen && !state.paused && !state.waiting} />
    </div>
    <div className="fs-live-controls practice-live-controls">
      {phase !== 'briefing' ? <>
        <div className="practice-conversation-goals" aria-label={ar ? 'فرص الكلام' : 'Speaking opportunities'}>
          {goals.map((goal) => <span key={goal.id} className={goalIds.includes(goal.id) ? 'is-observed' : ''}>
            {goalIds.includes(goal.id) ? '✓' : '○'} {ar ? goal.overviewAr : goal.learnerIntentEn}
          </span>)}
        </div>
        <p className="practice-review-evidence-note">{ar ? 'دي ملاحظات على الحوار، مش إثبات إتقان ولا شروط للكلام.' :
          'These observations do not gate conversation or prove mastery.'}</p>
      </> : <label className="practice-pause-choice">
        <input type="checkbox" checked={relaxed} onChange={(event) => setRelaxed(event.target.checked)} />
        {ar ? 'وقت تفكير أطول في المحادثة' : 'More thinking time in roleplay'}
      </label>}
      <TutorControls tutor={tutor} />
      {phase === 'roleplay' ? <>
        <PracticeHintCard runtime={runtime} learnerTurn={state.micOpen && !state.paused && !state.waiting}
          onRequestHint={() => void runtime.requestHint([...tutor.turns.current])} />
        <button type="button" className="practice-copy-log" onClick={() => void copyConversation()}>
          {copied ? (ar ? 'تم النسخ' : 'Copied') : ar ? 'نسخ الحوار' : 'Copy conversation'}
        </button>
      </> : null}
      {onFinish ? <button type="button" className="practice-start-button" disabled={tutor.ending} onClick={() => void finish()}>
        {tutor.ending ? (ar ? 'بنجهز المراجعة…' : 'Preparing review…') : phase === 'briefing' ?
          (ar ? 'نبدأ المحادثة' : 'Start roleplay') : (ar ? 'إنهاء ومراجعة' : 'Finish and review')}
      </button> : null}
    </div>
  </section>;
}
