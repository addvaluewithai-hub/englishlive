import { Link } from 'react-router-dom';
import { ProductIcon } from '../../components/ProductIcon';
import { useI18n } from '../../i18n/LocaleProvider';
import { lessonDisplayTitle } from '../../i18n/format';
import { availableLearnLessons, type LearnRoadmapLevel } from '../../learnV2/roadmap';
import { Card } from '../primitives/Card';
import { ProgressBar } from '../primitives/ProgressBar';
import { useExperience } from '../theme/ExperienceProvider';
import { ContinueLessonCard } from './ContinueLessonCard';
import styles from './learning.module.css';
import { mascotArtwork } from './mascotArtwork';

export function LevelRoadmap({ level, completed }: { level: LearnRoadmapLevel; completed: Set<string> }) {
  const { locale, number, t } = useI18n();
  const { profile } = useExperience();
  const lessons = availableLearnLessons(level);
  const completedCount = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const nextLesson = lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons.at(-1);
  const allAvailableComplete = Boolean(lessons.length) && completedCount === lessons.length;

  return (
    <section className={styles.levelRoadmap}>
      <div className={styles.levelToolbar}>
        <Link className={styles.levelBack} to="/learn">
          <ProductIcon name="chevron" size={18} />
          <span>{t('level.back')}</span>
        </Link>
        <span className={styles.levelToolbarProgress}>{t('learn.progressCount', { completed: completedCount, total: lessons.length })}</span>
      </div>

      <Card tone="raised" className={styles.levelHeroCard}>
        <div className={styles.levelHeroCopy}>
          <p className={styles.pathKicker}>{t('level.kicker')}</p>
          <h1 className={styles.pathTitle}>{t('level.title', { level: level.code })}</h1>
          <p className={styles.levelAuthoredTitle} lang="ar" dir="rtl">{level.titleAr}</p>
          <p className={styles.levelAuthoredDescription} lang="ar" dir="rtl">{level.descriptionAr}</p>
          <div className={styles.levelHeroProgress}>
            <ProgressBar
              value={completedCount}
              max={lessons.length}
              label={t('learn.progressLabel')}
              valueText={t('learn.progressCount', { completed: completedCount, total: lessons.length })}
            />
            <span>{t('learn.progressCount', { completed: completedCount, total: lessons.length })}</span>
          </div>
          <div className={styles.levelStats}>
            <div className={styles.levelStat}><strong>{number(level.units.length)}</strong><span>{t('learn.unitsLabel')}</span></div>
            <div className={styles.levelStat}><strong>{number(level.plannedLessonCount)}</strong><span>{t('learn.plannedLessonsLabel')}</span></div>
            <div className={styles.levelStat}><strong>{number(lessons.length)}</strong><span>{t('learn.availableLessonsLabel')}</span></div>
          </div>
        </div>
        <img className={styles.levelHeroMascot} src={mascotArtwork[profile.mascotFamily]} width={240} height={190} alt="" aria-hidden="true" />
      </Card>

      {nextLesson ? <ContinueLessonCard lesson={nextLesson} levelCode={level.code} completed={completed.has(nextLesson.id)} /> : null}

      <section className={styles.levelUnitStack} aria-label={t('level.unitsAria')}>
        {level.units.map((unit) => {
          const unitTitle = lessonDisplayTitle(locale, unit);
          const unitCompleted = unit.lessons.filter((lesson) => completed.has(lesson.id)).length;
          const unitAvailable = unit.lessons.length;
          const missingCount = Math.max(0, unit.plannedLessonCount - unitAvailable);
          const isAvailable = unitAvailable > 0;

          return (
            <Card key={unit.id} id={`unit-${unit.id}`} className={[styles.roadmapUnit, !isAvailable ? styles.roadmapUnitLocked : ''].filter(Boolean).join(' ')}>
              <header className={styles.roadmapUnitHeader}>
                <div className={styles.roadmapUnitHeading}>
                  <p className={styles.eyebrow}>{t('home.unit', { number: unit.order })}</p>
                  <h2 className={styles.unitTitle} lang={unitTitle.lang} dir={unitTitle.direction}>{unitTitle.text}</h2>
                  {locale === 'ar'
                    ? <p className={styles.unitSecondaryTitle} lang="en" dir="ltr">{unit.titleEn}</p>
                    : <p className={styles.unitSecondaryTitle} lang="ar" dir="rtl">{unit.titleAr}</p>}
                  <p className={styles.roadmapUnitDescription} lang="ar" dir="rtl">{unit.descriptionAr}</p>
                </div>
                <span className={styles.levelAvailability}>{isAvailable ? t('level.availableUnit') : t('learn.comingSoon')}</span>
              </header>

              {isAvailable ? (
                <>
                  <div className={styles.roadmapUnitProgress}>
                    <ProgressBar
                      value={unitCompleted}
                      max={unitAvailable}
                      label={t('level.unitProgressLabel')}
                      valueText={t('learn.progressCount', { completed: unitCompleted, total: unitAvailable })}
                    />
                    <span>{t('learn.progressCount', { completed: unitCompleted, total: unitAvailable })}</span>
                  </div>

                  <ol className={styles.roadmapLessonList}>
                    {unit.lessons.map((lesson) => {
                      const done = completed.has(lesson.id);
                      const current = lesson.id === nextLesson?.id && !done;
                      const lessonTitle = lessonDisplayTitle(locale, lesson);
                      return (
                        <li key={lesson.id}>
                          <Link className={[styles.roadmapLesson, current ? styles.roadmapLessonCurrent : '', done ? styles.roadmapLessonComplete : ''].filter(Boolean).join(' ')} to={`/learn/lesson/${lesson.id}`}>
                            <span className={[styles.roadmapLessonStatus, done ? styles.roadmapLessonStatusComplete : ''].filter(Boolean).join(' ')}>
                              {done ? <ProductIcon name="check" size={20} /> : <ProductIcon name="learn" size={19} />}
                            </span>
                            <span className={styles.roadmapLessonCopy}>
                              <small>{t('home.lesson', { number: lesson.lesson })}{current ? ` · ${t('level.current')}` : ''}</small>
                              <strong lang={lessonTitle.lang} dir={lessonTitle.direction}>{lessonTitle.text}</strong>
                              {locale === 'ar'
                                ? <span lang="en" dir="ltr">{lesson.titleEn}</span>
                                : <span lang="ar" dir="rtl">{lesson.titleAr}</span>}
                              <em>{t('level.minutes', { number: lesson.estimatedMinutes })}</em>
                            </span>
                            <span className={styles.roadmapLessonState}>{done ? t('progress.retake') : t('progress.start')}</span>
                          </Link>
                        </li>
                      );
                    })}

                    {Array.from({ length: missingCount }, (_, index) => {
                      const lessonNumber = unitAvailable + index + 1;
                      return (
                        <li key={`planned-${unit.id}-${lessonNumber}`}>
                          <div className={[styles.roadmapLesson, styles.roadmapLessonPlanned].join(' ')} aria-disabled="true">
                            <span className={styles.roadmapLessonStatus}><ProductIcon name="lock" size={18} /></span>
                            <span className={styles.roadmapLessonCopy}>
                              <small>{t('home.lesson', { number: lessonNumber })}</small>
                              <strong>{t('learn.comingSoon')}</strong>
                              <span>{t('level.plannedLessonHelp')}</span>
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </>
              ) : (
                <div className={styles.lockedMessage}>
                  <ProductIcon name="lock" size={18} />
                  <span>{t('level.lockedUnitHelp')}</span>
                </div>
              )}
            </Card>
          );
        })}
      </section>

      <Card tone="raised" className={styles.levelFinish}>
        <img src={mascotArtwork[profile.mascotFamily]} width={120} height={100} alt="" aria-hidden="true" />
        <div>
          <strong>{t(allAvailableComplete ? 'level.finishComplete' : 'level.finishContinue')}</strong>
          <p>{t('level.finishHelp')}</p>
        </div>
      </Card>
    </section>
  );
}
