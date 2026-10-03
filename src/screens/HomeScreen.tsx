import { useI18n } from '../i18n/LocaleProvider';
import { availableLearnLessons, learnRoadmapLevelById } from '../learnV2/roadmap';
import { readLearnerProfile } from '../product/profile';
import { readLearnLessonProgress } from '../speaking/roadmapProgress';
import { ButtonLink } from '../ui/primitives/Button';
import { ContinueLessonCard } from '../ui/product/ContinueLessonCard';
import { EmptyState } from '../ui/product/EmptyState';
import { OttiHero } from '../ui/product/OttiHero';
import { QuickActions } from '../ui/product/QuickActions';
import { UnitProgressCard } from '../ui/product/UnitProgressCard';

export function HomeScreen() {
  const { t } = useI18n();
  const profile = readLearnerProfile();

  if (!profile) {
    return <EmptyState title={t('home.setupTitle')} description={t('home.setupDescription')} action={<ButtonLink to="/onboarding">{t('home.setupAction')}</ButtonLink>} />;
  }

  const level = learnRoadmapLevelById('a1');
  const lessons = level ? availableLearnLessons(level) : [];
  if (!level || !lessons.length) {
    return <EmptyState title={t('home.emptyTitle')} description={t('home.emptyDescription')} />;
  }

  // Preserve the adopted Learn roadmap and its evidence-backed progress store.
  const completed = new Set(readLearnLessonProgress());
  const nextLesson = lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons.at(-1)!;
  const unit = level.units.find((candidate) => candidate.order === nextLesson.unit) ?? level.units[0];
  const unitCompleted = unit.lessons.filter((lesson) => completed.has(lesson.id)).length;

  return (
    <>
      <OttiHero name={profile.firstName} />
      <ContinueLessonCard lesson={nextLesson} levelCode={level.code} completed={completed.has(nextLesson.id)} />
      <UnitProgressCard completed={unitCompleted} total={unit.lessons.length} unit={unit.order} />
      <QuickActions />
    </>
  );
}
