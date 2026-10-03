import { useI18n } from '../../i18n/LocaleProvider';
import { learnArt } from '../../learn/assets';
import { useExperience } from '../theme/ExperienceProvider';
import styles from './learning.module.css';

// Existing approved art is a temporary fallback until dedicated families exist.
const artwork = { adult: learnArt.mascotNeutral, teen: learnArt.mascotWave };
export function OttiHero({ name }: { name: string }) {
  const { t } = useI18n();
  const { profile } = useExperience();
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <h1 className={styles.greeting}>{name ? t('home.greeting', { name }) : t('home.greetingAnonymous')}</h1>
        <p className={styles.intro}>{t('home.intro')}</p>
        <p className={styles.support}>{t('home.support')}</p>
      </div>
      <img className={styles.mascot} src={artwork[profile.mascotFamily]} width={280} height={210} alt="" aria-hidden="true" />
    </section>
  );
}
