import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PracticeMissionContract } from '../types';
import type { PracticeCorrectionRecord } from '../runtime';
import { buildReviewReport, notesIncomplete } from './reviewReport';
import type { PracticeCompletionState } from './types';
import './practiceReviewSummary.css';

function ReviewCard({ note, improvement, index, ar, onPractise }: {
  note: PracticeCorrectionRecord;
  improvement: boolean;
  index: number;
  ar: boolean;
  onPractise: (index: number) => void;
}) {
  const reason = ar ? note.feedbackAr : note.feedbackEn;
  return <article className={`practice-recap-note${improvement ? ' is-improvement' : ' is-error'}`}>
    <div className="practice-recap-note-heading">
      <span className="practice-recap-type">
        <span aria-hidden="true">{improvement ? '✦' : '✎'}</span>
        {improvement ? (ar ? 'تعبير أفضل — اختياري' : 'Optional expression improvement')
          : (ar ? 'خطأ لغوي' : 'Language correction')}
      </span>
    </div>
    <div className="practice-recap-comparison">
      <div>
        <span className="practice-recap-label">{improvement
          ? (ar ? 'اللي قلته — صحيح' : 'What you said — valid English')
          : (ar ? 'اللي قلته' : 'What you said')}</span>
        <p dir="ltr" lang="en">{note.originalEn}</p>
      </div>
      <div>
        <span className="practice-recap-label">{improvement
          ? (ar ? 'بديل ممكن تستخدمه' : 'Optional alternative')
          : (ar ? 'التصحيح' : 'Correction')}</span>
        <p dir="ltr" lang="en" className="practice-recap-corrected">{note.betterEn}</p>
      </div>
    </div>
    <div className="practice-recap-explanation">
      <strong>{ar ? 'ليه؟' : 'Why?'}</strong>
      <p>{reason || (ar
        ? 'مافيش تفسير محفوظ للملاحظة دي. ممكن تسأل Otti عن السبب.'
        : 'No explanation was saved for this note. You can ask Otti why.')}</p>
    </div>
    <button className="practice-recap-practise" type="button" onClick={() => onPractise(index)}>
      <span aria-hidden="true">◉</span>
      {ar ? 'اتمرّن عليها مع Otti' : 'Practise with Otti'}
    </button>
  </article>;
}

/** A real written recap. Otti Live only starts when the learner chooses voice practice. */
export function PracticeReviewSummary({ mission, review, ar, onPractise, onClose }: {
  mission: PracticeMissionContract;
  review: PracticeCompletionState;
  ar: boolean;
  onPractise: (index: number) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const errors = review.corrections ?? [];
  const improvements = review.improvements ?? [];
  const count = errors.length + improvements.length;
  const possibleGoals = mission.beats.filter((beat) => beat.type === 'required');
  const observed = possibleGoals.filter((beat) => review.achievedGoalIds?.includes(beat.id)).length;
  const incomplete = notesIncomplete(review);
  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(buildReviewReport(mission, review, ar, {}));
      setCopied(true);
    } catch { setCopied(false); }
  }
  return <main className="practice-recap" dir={ar ? 'rtl' : 'ltr'}>
    <header className="practice-recap-top">
      <button type="button" onClick={onClose} aria-label={ar ? 'رجوع للمواقف' : 'Back to scenarios'}>×</button>
      <strong>{ar ? mission.titleAr : mission.titleEn}</strong>
      <span className="practice-recap-level" dir="ltr">{mission.level}</span>
    </header>
    <section className="practice-recap-hero" aria-label={ar ? 'ملخص المحادثة' : 'Conversation summary'}>
      <div className="practice-recap-success" aria-hidden="true">✓</div>
      <h1>{ar ? 'أحسنت! ملاحظاتك جاهزة' : 'Nice work! Your notes are ready'}</h1>
      <p>{ar ? 'خلّصت الموقف. راجع اللي Otti سجّله من كلامك، واتمرّن على اللي تحب تحسّنه.' :
        'You finished the scenario. Review what Otti heard and choose what you want to practise.'}</p>
    </section>
    <section className="practice-recap-stats" aria-label={ar ? 'إحصائيات المراجعة' : 'Review summary'}>
      <div><strong>{errors.length}</strong><span>{ar ? 'أخطاء مسجّلة' : 'Saved errors'}</span></div>
      <div><strong>{improvements.length}</strong><span>{ar ? 'تعبيرات اختيارية' : 'Optional improvements'}</span></div>
      <div><strong>{observed}<small>/{possibleGoals.length}</small></strong>
        <span>{ar ? 'فرص كلام اتدرّبت عليها' : 'Speaking opportunities observed'}</span></div>
    </section>
    {incomplete ? <p className="practice-recap-warning" role="status">
      {ar ? 'تنبيه: مراجعة Otti النهائية ما وصلتش كاملة. دي ملاحظات جزئية، مش تقييم لمستواك.' :
        'Otti’s final review did not arrive completely. These are partial notes, not a score.'}
    </p> : null}
    <section className="practice-recap-notes" aria-label={ar ? 'ملاحظات اللغة' : 'Language feedback'}>
      <header>
        <h2>{ar ? 'ملاحظات اللغة' : 'Your language notes'}</h2>
        <p>{ar ? 'دي ملاحظات من سماع Otti، مش تفريغ حرفي أو امتحان.' :
          'These are Otti’s listening notes, not a verbatim transcript or a test.'}</p>
      </header>
      {count ? <div className="practice-recap-lists">
        {errors.length ? <section aria-label={ar ? 'الأخطاء اللغوية' : 'Actual language errors'}>
          <h3>{ar ? 'أخطاء لغوية' : 'Language mistakes'} <span>{errors.length}</span></h3>
          <div>{errors.map((note, index) => <ReviewCard
            key={`error-${note.originalEn}-${index}`} note={note} improvement={false}
            index={index} ar={ar} onPractise={onPractise}/>)}</div>
        </section> : null}
        {improvements.length ? <section aria-label={ar ? 'التعبيرات الاختيارية' : 'Optional improvements'}>
          <h3>{ar ? 'تعبيرات أحسن — مش أخطاء' : 'Better expressions — not mistakes'}
            <span>{improvements.length}</span></h3>
          <div>{improvements.map((note, index) => <ReviewCard
            key={`improvement-${note.originalEn}-${index}`} note={note} improvement
            index={errors.length + index} ar={ar} onPractise={onPractise}/>)}</div>
        </section> : null}
      </div> : <div className="practice-recap-empty">
        <span aria-hidden="true">✧</span>
        <strong>{incomplete ? (ar ? 'الملاحظات لسه مش كاملة' : 'Notes are incomplete')
          : (ar ? 'ما اتسجلتش أخطاء مؤكدة' : 'No confident errors recorded')}</strong>
        <p>{ar ? 'ده مش معناه إن كل كلمة كانت صح. تقدر تتدرّب مع Otti على أي تعبير.' :
          'This does not mean every word was perfect. You can practise any expression with Otti.'}</p>
      </div>}
    </section>
    {possibleGoals.length ? <details className="practice-recap-goals">
      <summary>{ar ? 'الحاجات اللي اتدرّبت عليها' : 'Speaking opportunities'}
        <span dir="ltr">{observed}/{possibleGoals.length}</span></summary>
      <p>{ar ? 'ملاحظات على اللي ظهر في الكلام؛ مش درجة أو شروط لازم تخلصها.' :
        'Observations from the conversation, not a grade or mandatory checklist.'}</p>
      <ul>{possibleGoals.map((beat) => <li key={beat.id}>
        <span aria-hidden="true">{review.achievedGoalIds?.includes(beat.id) ? '✓' : '○'}</span>
        {ar ? beat.overviewAr : beat.learnerIntentEn}
      </li>)}</ul>
    </details> : null}
    <div className="practice-recap-actions">
      <button type="button" className="practice-recap-voice" onClick={() => onPractise(0)}>
        {ar ? 'اتدرّب مع Otti على الملاحظات' : 'Practise notes with Otti'}
      </button>
      <Link to={`/practice/mission/${mission.slug}`}>{ar ? 'جرّب الموقف تاني' : 'Try the scenario again'}</Link>
      <Link to={`/practice/${mission.level}/world/${mission.worldId}`}>{ar ? 'موقف تاني' : 'Another scenario'}</Link>
    </div>
    <details className="practice-recap-support" open={showDetails}
      onToggle={(event) => setShowDetails(event.currentTarget.open)}>
      <summary>{ar ? 'تفاصيل للدعم الفني' : 'Details for support'}</summary>
      <p>{ar ? 'التفاصيل بتتضمن ملاحظاتك المكتوبة وأحداث اتصال بدون صوت مسجّل.' :
        'Includes saved text notes and connection events, not recorded audio.'}</p>
      <button type="button" onClick={() => void copyDetails()}>{copied
        ? (ar ? 'تم النسخ ✓' : 'Copied ✓') : (ar ? 'نسخ اللوج والملاحظات' : 'Copy log and notes')}</button>
    </details>
  </main>;
}
