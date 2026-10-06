import { useI18n } from '../i18n/LocaleProvider';
import { availableLearnLessons, LEARN_ROADMAP_LEVELS } from '../learnV2/roadmap';
import { readLearnerProfile } from '../product/profile';
import { readLearnLessonProgress } from '../speaking/roadmapProgress';
import { ButtonLink } from '../ui/primitives/Button';
import { EmptyState } from '../ui/product/EmptyState';
import { LearnPathHero, LevelCard, LevelCardList } from '../ui/product/LearnPath';

export function LearnScreen() {
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

  const completed = new Set(readLearnLessonProgress());

  return (
    <>
      <LearnPathHero />
      <LevelCardList>
        {LEARN_ROADMAP_LEVELS.map((level) => {
          const lessons = availableLearnLessons(level);
          const completedCount = lessons.filter((lesson) => completed.has(lesson.id)).length;
          return (
            <LevelCard
              key={level.id}
              level={level}
              completedCount={completedCount}
              availableCount={lessons.length}
            />
          );
        })}
      </LevelCardList>
    </>
  );
}
