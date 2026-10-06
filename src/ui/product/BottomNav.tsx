import { NavLink } from 'react-router-dom';
import { ProductIcon } from '../../components/ProductIcon';
import { useI18n } from '../../i18n/LocaleProvider';
import type { MessageKey } from '../../i18n/messages';
import styles from './navigation.module.css';

const destinations = [
  { to: '/home', label: 'nav.home', icon: 'home' },
  { to: '/learn', label: 'nav.learn', icon: 'learn' },
  { to: '/practice', label: 'nav.practice', icon: 'speak' },
  { to: '/account', label: 'nav.account', icon: 'profile' },
] as const satisfies readonly { to: string; label: MessageKey; icon: 'home' | 'learn' | 'speak' | 'profile' }[];

export function BottomNav() {
  const { t } = useI18n();
  return (
    <nav className={styles.nav} aria-label={t('nav.label')}>
      {destinations.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>
          <ProductIcon name={icon} /><span>{t(label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
