import type { CSSProperties, ReactNode } from 'react';
import { useI18n } from '../../i18n/LocaleProvider';
import { AppHeader } from '../product/AppHeader';
import { BottomNav } from '../product/BottomNav';
import { useExperience } from '../theme/ExperienceProvider';
import styles from './AppLayout.module.css';

export function AppLayout({ children }: { children: ReactNode }) {
  const { locale, direction, t } = useI18n();
  const { profile } = useExperience();
  return (
    <div className={styles.root} data-englotti-ui data-experience={profile.id} lang={locale} dir={direction} style={profile.tokens as CSSProperties}>
      <a className={styles.skip} href="#englotti-main">{t('nav.skip')}</a>
      <AppHeader />
      <main className={styles.main} id="englotti-main" tabIndex={-1}>{children}</main>
      <BottomNav />
    </div>
  );
}
