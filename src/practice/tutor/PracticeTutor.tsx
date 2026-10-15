import './tutor.css';
import './tutorReview.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LocaleProvider';
import { LiveConversationHeader } from '../../ui/product/LiveConversationChrome';
import { PracticeHintCard } from '../PracticeHintCard';
import { useConversationPracticeRuntime } from '../conversationRuntime';
import type { PracticeMissionContract } from '../types';
import { GoalStrip } from './GoalStrip';
import { LessonCard } from './LessonCard';
import { ReviewNotesPanel } from './ReviewNotesPanel';
import { notesIncomplete } from './reviewReport';
import { TutorDock } from './TutorDock';
import { TutorStage } from './TutorStage';
import { phaseIndex, tutorCopy } from './tutorCopy';
import { deriveTutorView } from './tutorView';
import { usePracticeTutor } from './usePracticeTutor';
import { useWideLayout } from './useWideLayout';
import type { PracticeCompletionState, TutorPhase } from './types';
import type { PracticeCorrectionRecord } from '../runtime';

/** One lesson with Otti in three phases, all on the same animated speaking stage. */
export function PracticeTutor({ mission, phase, review, onFinish, onClose, initialReviewNote }: {
  mission: PracticeMissionContract;
  phase: TutorPhase;
  review?: PracticeCompletionState;
  initialReviewNote?: PracticeCorrectionRecord;
  onFinish?: (state: PracticeCompletionState, relaxed: boolean) => void;
  onClose: () => void;
}) {
  const { locale } = useI18n();
  const ar = locale === 'ar';
  const copy = tutorCopy(locale);
  const runtime = useConversationPracticeRuntime(mission.slug);
  const [relaxed, setRelaxed] = useState(new URLSearchParams(window.location.search).get('pace') === 'relaxed');
  const [notesOpen, setNotesOpen] = useState(false);
  const [debugCopied, setDebugCopied] = useState(false);
  const showDebugTrace = phase === 'roleplay' && new URLSearchParams(window.location.search).get('debug') === '1';
  const tutor = usePracticeTutor({
    mission, phase, locale: ar ? 'ar' : 'en', corrections: [...(review?.corrections ?? []), ...(review?.improvements ?? []).map((note) => ({ ...note, noteType: 'improvement' as const }))],
    initialReviewIssue: initialReviewNote,
    notesIncomplete: review ? notesIncomplete(review) : false,
    silenceDurationMs: relaxed ? 2400 : 1200, onTurn: runtime.invalidateHint,
  });
  const view = deriveTutorView(tutor.state, tutor.ending, phase, copy);
  const step = phaseIndex(phase);
  const wide = useWideLayout();
  const goalIds = phase === 'review' ? review?.achievedGoalIds ?? [] : tutor.goalIds;

  async function finish() {
    const result = await tutor.finish();
    if (result) onFinish?.({ ...result, support: runtime.getSupportSummary() }, relaxed);
  }
  async function copyLiveDebugTrace() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(tutor.getConnectionDiagnostics(), null, 2));
      setDebugCopied(true);
    } catch {
      setDebugCopied(false);
    }
  }
  function practise(index: number) {
    setNotesOpen(false);
    tutor.discussCorrection(index);
  }

  const action = phase === 'briefing'
    ? <button type="button" className="fs-help-control tutor-action is-primary" disabled={tutor.ending} onClick={() => void finish()}>
      <strong>{copy.startConversation}</strong></button>
    : phase === 'roleplay'
      ? <button type="button" className="fs-help-control tutor-action" disabled={tutor.ending} onClick={() => void finish()}>
        <strong>{copy.done}</strong></button>
      : <>
        <button type="button" className="fs-help-control tutor-action tutor-notes-toggle" onClick={() => setNotesOpen(true)}>
          <strong>{copy.notes} ({(review?.corrections?.length ?? 0) + (review?.improvements?.length ?? 0)})</strong></button>
        <Link className="fs-help-control tutor-action tutor-again-link" to={`/practice/mission/${mission.slug}`}>
          <strong>{copy.again}</strong></Link>
      </>;

  const lessonCard = phase === 'briefing'
    ? <LessonCard mission={mission} ar={ar} copy={copy} relaxed={relaxed} onRelaxed={setRelaxed} /> : null;
  const notes = phase === 'review' && review ? <ReviewNotesPanel mission={mission} review={review} ar={ar} copy={copy}
    open={notesOpen} onClose={() => setNotesOpen(false)} onPractise={practise}
    practiseDisabled={view.connecting || tutor.ending}
    getConnectionDiagnostics={tutor.getConnectionDiagnostics} /> : null;
  const side = notes ?? (wide ? lessonCard : null);

  return <section className={`fs-live sp-scenario-live practice-live tutor-live is-${phase}${side && wide ? ' has-side' : ''}`}
    aria-label={copy.phases[step]}>
    <LiveConversationHeader
      title={ar ? mission.titleAr : mission.titleEn}
      meta={<b dir="ltr">{mission.level}</b>}
      metaClassName="fs-live-mode tutor-phase-meta"
      brandText="Otti"
      onClose={phase === 'roleplay' ? () => void finish() : onClose}
      closeLabel={phase === 'roleplay' ? copy.finishAndReview : copy.back}
      disabled={tutor.ending}
    />
    <div className="tutor-body">
      <div className="tutor-main">
        <TutorStage host={tutor.host} text={tutor.state.text} status={tutor.state.status}
          title={view.statusTitle} body={view.statusBody} learnerTurn={view.learnerTurn}>
          {phase === 'briefing' ? (wide ? null : lessonCard) : <>
            <GoalStrip mission={mission} goalIds={goalIds} ar={ar} copy={copy} />
            {phase === 'roleplay' ? <PracticeHintCard runtime={runtime} learnerTurn={view.learnerTurn}
              onRequestHint={() => void runtime.requestHint([...tutor.turns.current])} /> : null}
          </>}
        </TutorStage>
        <TutorDock tutor={tutor} view={view} copy={copy} action={action} />
        {showDebugTrace ? <button type="button" className="tutor-copy-details tutor-live-debug"
          onClick={() => void copyLiveDebugTrace()}>
          {debugCopied ? 'Live tool log copied' : 'Copy live tool log'}
        </button> : null}
      </div>
      {side ? <div className="tutor-side">{side}</div> : null}
    </div>
  </section>;
}
