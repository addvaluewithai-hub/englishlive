import { useI18n } from '../i18n/LocaleProvider';
import { availableLearnLessons, learnRoadmapLevelById } from '../learnV2/roadmap';
import { readLearnerProfile } from '../product/profile';
import { readLearnLessonProgress } from '../speaking/roadmapProgress';
import { ButtonLink } from '../ui/primitives/Button';
import { EmptyState } from '../ui/product/EmptyState';
import {
  ProgressIntro,
  ProgressNote,
  ProgressSummaryCard,
  ProgressUnitCard,
} from '../ui/product/LearningProgress';

export function PrimaryProgressScreen() {
  const { t } = useI18n();
  const profile = readLearnerProfile();

  if (!profile) {
    return (
      <EmptyState
        title={t('learn.setupTitle')}
        description={t('learn.setupDescription')}
        action={<ButtonLink to="/onboarding">{t('learn.setupAction')}</ButtonLink>}
      />
    );
  }

  const level = learnRoadmapLevelById('a1');
  const lessons = level ? availableLearnLessons(level) : [];
  if (!level || !lessons.length) {
    return <EmptyState title={t('progress.emptyTitle')} description={t('progress.emptyDescription')} />;
  }

  const completed = new Set(readLearnLessonProgress());
  const completedCount = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const nextLesson = lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons.at(-1)!;
  const isReview = completed.has(nextLesson.id);

  return (
    <>
      <ProgressIntro levelCode={level.code} />
      <ProgressSummaryCard
        completedCount={completedCount}
        total={lessons.length}
        nextLesson={nextLesson}
        isReview={isReview}
      />
      {level.units.filter((unit) => unit.lessons.length > 0).map((unit) => (
        <ProgressUnitCard key={unit.id} unit={unit} completed={completed} />
      ))}
      <ProgressNote />
    </>
  );
}
