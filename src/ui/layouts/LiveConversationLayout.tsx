import type { CSSProperties, ReactNode } from 'react';
import { useI18n } from '../../i18n/LocaleProvider';
import { useExperience } from '../theme/ExperienceProvider';
import styles from './LiveConversationLayout.module.css';

/**
 * Presentation boundary for immersive conversation routes.
 * Runtime screens continue to own Gemini, audio, turn-taking and persistence.
 */
export function LiveConversationLayout({ children }: { children: ReactNode }) {
  const { locale, direction, t } = useI18n();
  const { profile } = useExperience();
  const theme = {
    ...profile.tokens,
    '--fs-pink': 'var(--color-primary)',
    '--fs-pink-strong': 'var(--color-primary-hover)',
    '--fs-ink': 'var(--color-text)',
    '--fs-muted': 'var(--color-text-muted)',
    '--sp-pink': 'var(--color-primary)',
  } as CSSProperties;

  return (
    <div
      className={styles.root}
      data-englotti-ui
      data-englotti-live-ui
      data-experience={profile.id}
      lang={locale}
      dir={direction}
      style={theme}
    >
      <a className={styles.skip} href="#englotti-live-main">{t('nav.skip')}</a>
      <main className={styles.main} id="englotti-live-main" tabIndex={-1}>{children}</main>
    </div>
  );
}
