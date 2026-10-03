import type { ReactNode } from 'react';
import { ProductIcon } from '../../components/ProductIcon';
import { useI18n } from '../../i18n/LocaleProvider';
import type { LearnRoadmapLevel } from '../../learnV2/roadmap';
import { ButtonLink } from '../primitives/Button';
import { Card } from '../primitives/Card';
import { ProgressBar } from '../primitives/ProgressBar';
import { useExperience } from '../theme/ExperienceProvider';
import styles from './learning.module.css';
import { mascotArtwork } from './mascotArtwork';

export function LearnPathHero() {
  const { t } = useI18n();
  const { profile } = useExperience();

  return (
    <section className={styles.pathHero}>
      <div className={styles.pathHeroCopy}>
        <p className={styles.pathKicker}>{t('learn.kicker')}</p>
        <h1 className={styles.pathTitle}>{t('learn.title')}</h1>
        <p className={styles.pathDescription}>{t('learn.description')}</p>
      </div>
      <img
        className={styles.pathMascot}
        src={mascotArtwork[profile.mascotFamily]}
        width={220}
        height={180}
        alt=""
        aria-hidden="true"
      />
    </section>
  );
}

export function LevelCardList({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return <section className={styles.levelList} aria-label={t('learn.levelsLabel')}>{children}</section>;
}

export function LevelCard({
  level,
  completedCount,
  availableCount,
}: {
  level: LearnRoadmapLevel;
  completedCount: number;
  availableCount: number;
}) {
  const { number, t } = useI18n();
  const isAvailable = availableCount > 0;

  return (
    <Card className={[styles.levelCard, !isAvailable ? styles.levelCardLocked : ''].filter(Boolean).join(' ')} tone={isAvailable ? 'raised' : 'default'} aria-disabled={!isAvailable || undefined}>
      <div className={styles.levelTop}>
        <bdi className={styles.levelCode} lang="en" dir="ltr">{level.code}</bdi>
        <span className={styles.levelAvailability}>
          {isAvailable ? t('learn.available') : t('learn.comingSoon')}
        </span>
      </div>

      <div className={styles.levelCopy}>
        <h2 className={styles.levelTitle} lang="ar" dir="rtl">{level.titleAr}</h2>
        <p className={styles.levelDescription} lang="ar" dir="rtl">{level.descriptionAr}</p>
      </div>

      <div className={styles.levelStats}>
        <div className={styles.levelStat}>
          <strong>{number(level.units.length)}</strong>
          <span>{t('learn.unitsLabel')}</span>
        </div>
        <div className={styles.levelStat}>
          <strong>{number(level.plannedLessonCount)}</strong>
          <span>{t('learn.plannedLessonsLabel')}</span>
        </div>
        <div className={styles.levelStat}>
          <strong>{number(availableCount)}</strong>
          <span>{t('learn.availableLessonsLabel')}</span>
        </div>
      </div>

      {isAvailable ? (
        <>
          <div className={styles.levelProgress}>
            <ProgressBar
              value={completedCount}
              max={availableCount}
              label={t('learn.progressLabel')}
              valueText={t('learn.progressCount', { completed: completedCount, total: availableCount })}
            />
            <span>{t('learn.progressCount', { completed: completedCount, total: availableCount })}</span>
          </div>
          <div className={styles.levelActions}>
            <ButtonLink to={`/learn/level/${level.id}`} variant="secondary">
              {t('learn.openLevel')}
            </ButtonLink>
          </div>
        </>
      ) : (
        <div className={styles.lockedMessage}>
          <ProductIcon name="lock" size={18} />
          <span>{t('learn.lockedHelp')}</span>
        </div>
      )}
    </Card>
  );
}
