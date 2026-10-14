import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../i18n/LocaleProvider';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { PracticeTutor } from '../practice/tutor/PracticeTutor';
import { PracticeReviewSummary } from '../practice/tutor/PracticeReviewSummary';
import type { PracticeCompletionState } from '../practice/tutor/types';

/** Static deterministic QA state, only compiled into the dedicated visual-QA build. */
function visualReview(missionSlug: string): PracticeCompletionState | null {
  if (import.meta.env.VITE_VISUAL_QA !== '1' || missionSlug !== 'b1-resolve-wrong-order') return null;
  return {
    recordedByOtti: true, achievedGoalIds: ['report_problem', 'discuss_needs'],
    corrections: [
      { beatId: 'report_problem', originalEn: 'I have a problem with order.',
        betterEn: 'I have a problem with my order.',
        feedbackAr: 'محتاج ضمير الملكية my قبل order علشان توضح إنك بتتكلم عن طلبك أنت.',
        feedbackEn: 'Use my before order to show that you mean your own order.', requiresRetry: false },
    ],
    improvements: [
      { beatId: 'explore_options', originalEn: 'I want a refund.',
        betterEn: 'Could I get a refund, please?',
        feedbackAr: 'الجملة الأصلية صحيحة. البديل ألطف لو بتطلب خدمة من موظف.',
        feedbackEn: 'The original is correct; the alternative sounds more polite when asking a staff member.', requiresRetry: false },
    ],
    diagnostics: { transport: [], timeline: [], notebook: { turnNotes: 2, finalReviewCalls: 1,
      finalStatus: 'issues', saved: 1, fromTurns: 1, fromFinal: 0, rejected: 0, reasons: {} },
      finalReview: 'received', finalWaitMs: 0 },
  };
}

export function PracticeCompleteScreen() {
  const { missionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const [selected, setSelected] = useState<number | null>(null);
  const mission = practiceMissionContractBySlug(missionId);
  const preview = mission && new URLSearchParams(window.location.search).get('visualReview') === '1'
    ? visualReview(mission.slug) : null;
  const review = (state ?? preview ?? {}) as PracticeCompletionState;
  if (!mission || !review.recordedByOtti) return <section className="tutor-missing">
    <h1>{locale === 'ar' ? 'ابدأ محادثة مع Otti' : 'Start a conversation with Otti'}</h1>
    <p>{locale === 'ar' ? 'مفيش جلسة محفوظة نراجعها هنا.' : 'There is no saved session to review here.'}</p>
    <Link to={mission ? `/practice/mission/${mission.slug}` : '/practice'}>{locale === 'ar' ? 'نبدأ' : 'Start'}</Link>
  </section>;

  const allowed = new Set(mission.beats.filter((beat) => beat.type === 'required').map((beat) => beat.id));
  const safeReview = {
    ...review,
    corrections: Array.isArray(review.corrections) ? review.corrections : [],
    improvements: Array.isArray(review.improvements) ? review.improvements : [],
    achievedGoalIds: Array.isArray(review.achievedGoalIds) ? review.achievedGoalIds.filter((id) => allowed.has(id)) : [],
  };
  const allNotes = [...safeReview.corrections, ...safeReview.improvements];
  if (selected !== null) return <PracticeTutor key={mission.slug} mission={mission} phase="review"
    review={safeReview} initialReviewNote={allNotes[selected]}
    onClose={() => setSelected(null)} />;
  return <PracticeReviewSummary mission={mission} review={safeReview} ar={locale === 'ar'}
    onClose={() => navigate(`/practice/${mission.level}/world/${mission.worldId}`)}
    onPractise={(index) => setSelected(index)} />;
}
