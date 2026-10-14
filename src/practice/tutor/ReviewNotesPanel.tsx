import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PracticeMissionContract } from '../types';
import { buildReviewReport, notesIncomplete } from './reviewReport';
import type { TutorCopy } from './tutorCopy';
import type { PracticeCompletionState } from './types';

/**
 * Written notes that sit beside Otti (desktop) or slide up over the stage (phone).
 * Each note can be handed to Otti for spoken discussion and practice.
 */
export function ReviewNotesPanel({ mission, review, ar, copy, open, onClose, onPractise, practiseDisabled, getConnectionDiagnostics }: {
  mission: PracticeMissionContract;
  review: PracticeCompletionState;
  ar: boolean;
  copy: TutorCopy;
  open: boolean;
  onClose: () => void;
  onPractise: (index: number) => void;
  practiseDisabled: boolean;
  getConnectionDiagnostics: () => unknown;
}) {
  const [copied, setCopied] = useState(false);
  const [details, setDetails] = useState(false);
  const issues = review.corrections ?? [];
  async function copyReport() {
    try {
      await navigator.clipboard.writeText(buildReviewReport(mission, review, ar, getConnectionDiagnostics()));
      setCopied(true);
    } catch { setCopied(false); }
  }
  return <>
    {open ? <button type="button" className="tutor-notes-backdrop" aria-label={copy.close} onClick={onClose} /> : null}
    <aside className={`tutor-notes${open ? ' is-open' : ''}`} aria-label={copy.reviewTitle}>
      <header>
        <div><h2>{copy.reviewTitle} <span>{issues.length}</span></h2><p>{copy.reviewIntro}</p></div>
        <button type="button" className="tutor-notes-close" onClick={onClose} aria-label={copy.close}>×</button>
      </header>
      {issues.length ? <ol className="tutor-note-list">
        {issues.map((issue, index) => <li key={`${issue.originalEn}-${issue.betterEn}`}>
          <p className="tutor-note-heard"><small>{copy.heard}</small><span lang="en" dir="ltr">{issue.originalEn}</span></p>
          <p className="tutor-note-better"><small>{copy.better}</small><strong lang="en" dir="ltr">{issue.betterEn}</strong></p>
          {(ar ? issue.feedbackAr : issue.feedbackEn) ? <p className="tutor-note-why">{ar ? issue.feedbackAr : issue.feedbackEn}</p>
            : <p className="tutor-note-why">{ar ? 'اسأل Otti ليه دي غلط؛ الملاحظة دي مفيهاش تفسير محفوظ.' : 'Ask Otti why: no explanation was saved for this note.'}</p>}
          <button type="button" disabled={practiseDisabled} onClick={() => onPractise(index)}>{copy.practise}</button>
        </li>)}
      </ol> : <p className="tutor-empty-note">{notesIncomplete(review) ? copy.emptyIncomplete : copy.emptyComplete}</p>}
      <p className="tutor-notes-source">{copy.notesSource}</p>
      <footer>
        <Link to={`/practice/mission/${mission.slug}`}>{copy.again}</Link>
        <Link to={`/practice/${mission.level}/world/${mission.worldId}`}>{copy.another}</Link>
        <button type="button" onClick={() => setDetails((value) => !value)} aria-expanded={details}>{copy.details}</button>
      </footer>
      {details ? <section className="tutor-debug-trace" aria-label="Live tool diagnostic log">
        <pre>{JSON.stringify({
          finalReview: review.diagnostics?.finalReview ?? 'unknown',
          notebook: review.diagnostics?.notebook ?? {},
          timeline: review.diagnostics?.timeline ?? [],
        }, null, 2)}</pre>
        <button type="button" className="tutor-copy-details" onClick={() => void copyReport()}>
          {copied ? copy.copied : copy.copy}
        </button>
      </section> : null}
    </aside>
  </>;
}
