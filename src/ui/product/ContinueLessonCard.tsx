import { ProductIcon } from '../../components/ProductIcon';
import { useI18n } from '../../i18n/LocaleProvider';
import { lessonDisplayTitle } from '../../i18n/format';
import type { LearnV2Lesson } from '../../learnV2/catalog';
import { ButtonLink } from '../primitives/Button';
import { Card } from '../primitives/Card';
import styles from './learning.module.css';

export function ContinueLessonCard({ lesson, levelCode, completed }: { lesson: LearnV2Lesson; levelCode: string; completed: boolean }) {
  const { locale, t } = useI18n();
  const title = lessonDisplayTitle(locale, lesson);
  return (
    <Card tone="raised" className={styles.continue} aria-labelledby="next-lesson-title">
      <div className={styles.lessonCopy}>
        <p className={styles.eyebrow}>{t('home.nextLesson')}</p>
        <div className={styles.metadata}>
          <bdi className={styles.level} lang="en">{levelCode}</bdi>
          <span>{t('home.unit', { number: lesson.unit })}</span>
          <span>{t('home.lesson', { number: lesson.lesson })}</span>
        </div>
        <h2 id="next-lesson-title" className={styles.lessonTitle} lang={title.lang} dir={title.direction}>{title.text}</h2>
        {locale === 'ar' ? <p className={styles.englishTitle} lang="en" dir="ltr">{lesson.titleEn}</p> : null}
      </div>
      <ButtonLink to={`/learn/lesson/${lesson.id}`} size="lg"><ProductIcon name={completed ? 'refresh' : 'play'} size={20} />{t(completed ? 'home.review' : 'home.continue')}</ButtonLink>
    </Card>
  );
}
