import { Link } from 'react-router-dom';
import { ProductIcon } from '../../components/ProductIcon';
import { useI18n } from '../../i18n/LocaleProvider';
import styles from './learning.module.css';

export function QuickActions() {
  const { t } = useI18n();
  return (
    <div className={styles.quickActions}>
      <Link className={styles.quickLink} to="/learn"><ProductIcon name="learn" /><div><h2 className={styles.quickTitle}>{t('home.learn')}</h2><p>{t('home.learnDescription')}</p></div></Link>
      <Link className={styles.quickLink} to="/practice"><ProductIcon name="speak" /><div><h2 className={styles.quickTitle}>{t('home.practice')}</h2><p>{t('home.practiceDescription')}</p></div></Link>
    </div>
  );
}
