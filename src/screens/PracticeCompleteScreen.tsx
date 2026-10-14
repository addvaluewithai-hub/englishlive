import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../i18n/LocaleProvider';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { PracticeTutor } from '../practice/tutor/PracticeTutor';
import type { PracticeCompletionState } from '../practice/tutor/types';

export function PracticeCompleteScreen() {
  const { missionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const mission = practiceMissionContractBySlug(missionId);
  const review = (state ?? {}) as PracticeCompletionState;
  if (!mission || !review.recordedByOtti) return <section className="tutor-missing">
    <h1>{locale === 'ar' ? 'ابدأ محادثة مع Otti' : 'Start a conversation with Otti'}</h1>
    <p>{locale === 'ar' ? 'مفيش جلسة محفوظة نراجعها هنا.' : 'There is no saved session to review here.'}</p>
    <Link to={mission ? `/practice/mission/${mission.slug}` : '/practice'}>{locale === 'ar' ? 'نبدأ' : 'Start'}</Link>
  </section>;
  const allowed = new Set(mission.beats.filter((beat) => beat.type === 'required').map((beat) => beat.id));
  const safeReview = { ...review,
    corrections: Array.isArray(review.corrections) ? review.corrections : [],
    achievedGoalIds: Array.isArray(review.achievedGoalIds) ? review.achievedGoalIds.filter((id) => allowed.has(id)) : [],
  };
  return <PracticeTutor key={mission.slug} mission={mission} phase="review" review={safeReview}
    onClose={() => navigate(`/practice/${mission.level}/world/${mission.worldId}`)} />;
}
