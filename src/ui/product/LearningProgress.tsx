import { Link } from 'react-router-dom';
import { ProductIcon } from '../../components/ProductIcon';
import { useI18n } from '../../i18n/LocaleProvider';
import { lessonDisplayTitle } from '../../i18n/format';
import type { LearnV2Lesson } from '../../learnV2/catalog';
import type { LearnRoadmapUnit } from '../../learnV2/roadmap';
import { ButtonLink } from '../primitives/Button';
import { Card } from '../primitives/Card';
import { ProgressBar } from '../primitives/ProgressBar';
import styles from './learning.module.css';

export function ProgressIntro({ levelCode }: { levelCode: string }) {
  const { t } = useI18n();
  return (
    <header className={styles.progressIntro}>
      <p className={styles.pathKicker}>{t('progress.kicker')}</p>
      <h1 className={styles.progressTitle}>{t('progress.title', { level: levelCode })}</h1>
      <p className={styles.progressDescription}>{t('progress.description')}</p>
    </header>
  );
}

export function ProgressSummaryCard({
  completedCount,
  total,
  nextLesson,
  isReview,
}: {
  completedCount: number;
  total: number;
  nextLesson: LearnV2Lesson;
  isReview: boolean;
}) {
  const { locale, t } = useI18n();
  const title = lessonDisplayTitle(locale, nextLesson);
  const secondary = locale === 'ar'
    ? { text: nextLesson.titleEn, lang: 'en', direction: 'ltr' as const }
    : { text: nextLesson.titleAr, lang: 'ar', direction: 'rtl' as const };
  const countText = t('progress.completedCount', { count: completedCount, total });

  return (
    <Card tone="raised" className={styles.summaryCard}>
      <div className={styles.summaryTop}>
        <div className={styles.summaryMetric}>
          <strong><bdi dir="ltr">{completedCount}/{total}</bdi></strong>
          <span>{countText}</span>
        </div>
        <div className={styles.summaryProgress}>
          <ProgressBar
            value={completedCount}
            max={total}
            label={t('progress.summaryLabel')}
            valueText={countText}
          />
        </div>
      </div>

      <div className={styles.summaryNext}>
        <div className={styles.summaryNextCopy}>
          <p className={styles.eyebrow}>{t(isReview ? 'progress.review' : 'progress.next')}</p>
          <h2 className={styles.lessonTitle} lang={title.lang} dir={title.direction}>{title.text}</h2>
          <p className={styles.englishTitle} lang={secondary.lang} dir={secondary.direction}>{secondary.text}</p>
        </div>
        <ButtonLink to={`/learn/lesson/${nextLesson.id}`} size="lg">
          <ProductIcon name={isReview ? 'refresh' : 'play'} size={20} />
          {t(isReview ? 'progress.retake' : 'progress.start')}
        </ButtonLink>
      </div>
    </Card>
  );
}

export function ProgressUnitCard({
  unit,
  completed,
}: {
  unit: LearnRoadmapUnit;
  completed: Set<string>;
}) {
  const { locale, number, t } = useI18n();
  const unitTitle = locale === 'ar'
    ? { text: unit.titleAr, lang: 'ar', direction: 'rtl' as const }
    : { text: unit.titleEn, lang: 'en', direction: 'ltr' as const };
  const secondaryUnitTitle = locale === 'ar'
    ? { text: unit.titleEn, lang: 'en', direction: 'ltr' as const }
    : { text: unit.titleAr, lang: 'ar', direction: 'rtl' as const };

  return (
    <Card className={styles.unitCard} aria-labelledby={`progress-unit-${unit.id}`}>
      <div className={styles.unitHeading}>
        <p className={styles.eyebrow}>{t('progress.unitTitle', { number: unit.order })}</p>
        <h2 id={`progress-unit-${unit.id}`} className={styles.unitTitle} lang={unitTitle.lang} dir={unitTitle.direction}>{unitTitle.text}</h2>
        <p className={styles.unitSecondaryTitle} lang={secondaryUnitTitle.lang} dir={secondaryUnitTitle.direction}>{secondaryUnitTitle.text}</p>
      </div>

      <div className={styles.lessonList}>
        {unit.lessons.map((lesson, index) => {
          const done = completed.has(lesson.id);
          const title = lessonDisplayTitle(locale, lesson);
          const secondary = locale === 'ar'
            ? { text: lesson.titleEn, lang: 'en', direction: 'ltr' as const }
            : { text: lesson.titleAr, lang: 'ar', direction: 'rtl' as const };

          return (
            <article className={styles.lessonRow} key={lesson.id}>
              <span className={[styles.lessonStatus, done ? styles.lessonStatusComplete : ''].filter(Boolean).join(' ')} aria-label={done ? t('progress.completeState') : t('progress.readyState')}>
                {done ? <ProductIcon name="check" size={19} /> : number(index + 1)}
              </span>
              <div className={styles.lessonRowCopy}>
                <strong className={styles.lessonPrimary} lang={title.lang} dir={title.direction}>{title.text}</strong>
                <span className={styles.lessonSecondary} lang={secondary.lang} dir={secondary.direction}>{secondary.text}</span>
                <small className={styles.lessonState}>{done ? t('progress.completeState') : t('progress.readyState')}</small>
              </div>
              <Link className={styles.lessonAction} to={`/learn/lesson/${lesson.id}`}>
                {t(done ? 'progress.retake' : 'progress.start')}
              </Link>
            </article>
          );
        })}
      </div>
    </Card>
  );
}

export function ProgressNote() {
  const { t } = useI18n();
  return (
    <aside className={styles.progressNote}>
      <strong>{t('progress.noteTitle')}</strong>
      <p>{t('progress.noteBody')}</p>
    </aside>
  );
}
