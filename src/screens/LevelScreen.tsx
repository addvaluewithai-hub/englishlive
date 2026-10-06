import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useI18n } from '../i18n/LocaleProvider';
import { learnRoadmapLevelById } from '../learnV2/roadmap';
import { readLearnLessonProgress } from '../speaking/roadmapProgress';
import { ButtonLink } from '../ui/primitives/Button';
import { EmptyState } from '../ui/product/EmptyState';
import { LevelRoadmap } from '../ui/product/LevelRoadmap';

export function LevelScreen() {
  const { levelId } = useParams();
  const location = useLocation();
  const { t } = useI18n();
  const level = learnRoadmapLevelById(levelId);

  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const timer = window.setTimeout(() => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.hash, level?.id]);

  if (!level || !level.units.length) {
    return (
      <EmptyState
        title={t('level.emptyTitle')}
        description={t('level.emptyDescription')}
        action={<ButtonLink to="/learn" variant="secondary">{t('level.back')}</ButtonLink>}
      />
    );
  }

  return <LevelRoadmap level={level} completed={new Set(readLearnLessonProgress())} />;
}
