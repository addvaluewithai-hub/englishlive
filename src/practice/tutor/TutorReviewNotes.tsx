import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LocaleProvider';
import type { PracticeCompletionState } from './types';
import type { PracticeMissionContract } from '../types';

export function TutorReviewNotes({ mission, review, onDiscuss, getConnectionDiagnostics, disabled }: {
  mission: PracticeMissionContract; review: PracticeCompletionState; onDiscuss: (index: number) => void;
  getConnectionDiagnostics: () => unknown; disabled: boolean;
}) {
  const { locale } = useI18n();
  const ar = locale === 'ar';
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const issues = review.corrections ?? [];
  async function copy() {
    try {
      await navigator.clipboard.writeText([
        `Practice: ${mission.level} — ${mission.titleEn}`,
        'Source: Otti Live listening observations, not a verbatim transcript or proficiency score.',
        `Confident issues recorded: ${issues.length}`,
        ...issues.map((issue) => `Heard: ${issue.originalEn}\nBetter: ${issue.betterEn}\nWhy: ${ar ? issue.feedbackAr : issue.feedbackEn}`),
        'Observed goals: ' + (review.achievedGoalIds ?? []).join(', '),
        'Notebook diagnostics: ' + JSON.stringify(review.diagnostics ?? {}),
        'Review connection diagnostics: ' + JSON.stringify(getConnectionDiagnostics()),
      ].join('\n\n'));
      setCopied(true);
    } catch { setCopied(false); }
  }
  return <aside className="tutor-review-notes" aria-label={ar ? 'ملاحظات المحادثة' : 'Conversation notes'}>
    <header><small>{ar ? 'من محادثتك' : 'From your conversation'}</small>
      <h2>{ar ? 'نراجع ونجرّب' : 'Review and practise'}</h2>
      <p>{ar ? 'اسأل Otti عن أي جملة، أو جرّب تقولها بطريقتك.' : 'Ask Otti about a phrase, or try saying it your way.'}</p>
    </header>
    {issues.length ? <div className="tutor-note-list">
      {issues.map((issue, index) => <article key={`${issue.originalEn}-${index}`}>
        <small>{ar ? 'اللي اتسمع' : 'Heard'}</small><p lang="en" dir="ltr">{issue.originalEn}</p>
        <small>{ar ? 'جرّب كده' : 'Try this'}</small><strong lang="en" dir="ltr">{issue.betterEn}</strong>
        <p>{ar ? issue.feedbackAr : issue.feedbackEn}</p>
        <button type="button" disabled={disabled} onClick={() => onDiscuss(index)}>{ar ? 'نتمرّن عليها مع Otti' : 'Practise with Otti'}</button>
      </article>)}
    </div> : <p className="tutor-empty-note">{review.diagnostics?.finishTimedOut || !review.diagnostics?.collector.languageReviews?.checks ?
      (ar ? 'ملاحظات اللغة ما وصلتش بشكل كامل. ده مش تقييم لكلامك. تقدر تسأل Otti أو تتمرّن على أي جملة.' :
        'The language notes did not arrive completely. This is not an assessment of your speech. Ask Otti about any phrase to practise.') :
      (ar ? 'مفيش تصحيحات مؤكدة محفوظة. نقدر نتمرّن على الجمل اللي إنت تختارها.' : 'No confirmed corrections were saved. We can practise phrases you choose.')}</p>}
    <button type="button" className="tutor-text-button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
      {ar ? 'تفاصيل الجلسة' : 'Session details'}
    </button>
    {expanded ? <div className="tutor-session-details">
      <p>{ar ? 'دي ملاحظات سماع، مش تفريغ حرفي أو درجة للمستوى.' : 'Listening observations, not a verbatim transcript or proficiency score.'}</p>
      <p>{ar ? 'لو في مشكلة، انسخ التفاصيل وابعتها مع وصف اللي حصل.' : 'If something failed, copy these details with a description of what happened.'}</p>
      <button type="button" onClick={() => void copy()}>{copied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ الملاحظات وتفاصيل التشخيص' : 'Copy notes and diagnostics')}</button>
    </div> : null}
    <footer>
      <Link to={`/practice/mission/${mission.slug}`}>{ar ? 'نجرب الموقف تاني' : 'Try the scenario again'}</Link>
      <Link to={`/practice/${mission.level}/world/${mission.worldId}`}>{ar ? 'موقف تاني' : 'Another scenario'}</Link>
    </footer>
  </aside>;
}
