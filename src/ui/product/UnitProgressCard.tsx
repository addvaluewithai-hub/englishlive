import { useI18n } from '../../i18n/LocaleProvider';
import { ButtonLink } from '../primitives/Button';
import { Card } from '../primitives/Card';
import { ProgressBar } from '../primitives/ProgressBar';
import styles from './learning.module.css';

export function UnitProgressCard({ completed, total, unit }: { completed: number; total: number; unit: number }) {
  const { t } = useI18n();
  const count = t('home.progressCount', { count: completed, total });
  return (
    <Card aria-labelledby="unit-progress-title" className={styles.progressCard}>
      <div className={styles.progressHeading}>
        <div><h2 id="unit-progress-title" className={styles.sectionTitle}>{t('home.progress')}</h2><p className={styles.support}>{t('home.unit', { number: unit })}</p></div>
        <ButtonLink variant="quiet" to="/progress">{t('home.progressLink')}</ButtonLink>
      </div>
      <ProgressBar value={completed} max={total} label={t('home.progress')} valueText={count} />
      <div className={styles.progressLabels}><p>{t('home.completed', { count: completed })}</p><p className={styles.support}>{count}</p></div>
    </Card>
  );
}
