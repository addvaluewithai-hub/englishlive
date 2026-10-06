import { useId } from 'react';
import { Link } from 'react-router-dom';
import { OttiMark } from '../../character/otti/OttiMark';
import { ProductIcon } from '../../components/ProductIcon';
import { useI18n } from '../../i18n/LocaleProvider';
import { locales } from '../../i18n/locales';
import { IconLink } from '../primitives/IconButton';
import controls from '../primitives/controls.module.css';
import styles from './navigation.module.css';

export function AppHeader() {
  const { locale, setLocale, t } = useI18n();
  const languageId = useId();
  return (
    <header className={styles.header}>
      <Link to="/home" className={styles.brand} aria-label={t('nav.brand')}>
        <span className={styles.mark} aria-hidden="true"><OttiMark /></span>
        <bdi>Englotti</bdi>
      </Link>
      <div className={styles.actions}>
        <label htmlFor={languageId} className={controls.srOnly}>{t('locale.label')}</label>
        <select id={languageId} className={controls.select} value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)}>
          {Object.entries(locales).map(([code, definition]) => <option key={code} value={code} lang={code}>{definition.nativeName}</option>)}
        </select>
        <IconLink to="/account" label={t('nav.account')}><ProductIcon name="profile" /></IconLink>
      </div>
    </header>
  );
}
