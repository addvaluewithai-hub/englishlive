import { useI18n } from '../i18n/LocaleProvider';
import { usePracticeMissionRuntime } from './runtime';

type PracticeRuntime = ReturnType<typeof usePracticeMissionRuntime>;

export function PracticeHintCard({
  runtime,
  learnerTurn,
  onRequestHint,
}: {
  runtime: PracticeRuntime;
  learnerTurn: boolean;
  onRequestHint: () => void;
}) {
  const { t } = useI18n();
  const { activeBeat, supportLevel, hintBundle, hintLoading, hintError } = runtime;
  if (!learnerTurn || !activeBeat || activeBeat.type === 'ending') return null;

  if (supportLevel === 0) {
    const cached = hintBundle?.beatId === activeBeat.id;
    return (
      <div className="practice-hint-entry">
        <button
          type="button"
          className={`practice-hint-toggle${hintLoading ? ' is-loading' : ''}`}
          onClick={cached ? () => runtime.revealSupport(1) : onRequestHint}
          disabled={hintLoading}
        >
          <span aria-hidden="true">💡</span>
          <strong>{hintLoading ? t('practice.hint.loadingTitle') : t('practice.hint.readyTitle')}</strong>
          <small>
            {hintLoading
              ? t('practice.hint.loadingBody')
              : cached
                ? t('practice.hint.cachedBody')
                : t('practice.hint.requestBody')}
          </small>
        </button>
        {hintError ? <p className="practice-hint-error" role="alert">{hintError}</p> : null}
      </div>
    );
  }

  if (!hintBundle || hintBundle.beatId !== activeBeat.id) return null;

  return (
    <aside className="practice-hint-card" aria-label={t('practice.hint.cardLabel')}>
      <header>
        <div>
          <span aria-hidden="true">💡</span>
          <small>{t('practice.hint.cardEyebrow')}</small>
        </div>
        <button type="button" onClick={runtime.hideSupport} aria-label={t('practice.hint.hide')}>×</button>
      </header>

      {hintBundle.contextAr ? <p className="practice-hint-context" lang="ar" dir="rtl">{hintBundle.contextAr}</p> : null}
      <strong className="practice-hint-intent" lang="ar" dir="rtl">{hintBundle.intentAr}</strong>

      {supportLevel >= 2 && hintBundle.usefulLanguageEn.length ? (
        <div className="practice-hint-language" lang="en" dir="ltr">
          {hintBundle.usefulLanguageEn.map((item) => <span key={item}>{item}</span>)}
        </div>
      ) : null}

      {supportLevel >= 3 ? (
        <div className="practice-hint-full">
          <small>{t('practice.hint.fullExample')}</small>
          <strong lang="en" dir="ltr">{hintBundle.fullResponseEn}</strong>
        </div>
      ) : null}

      <footer>
        {supportLevel < 2 && hintBundle.usefulLanguageEn.length ? (
          <button type="button" onClick={() => runtime.revealSupport(2)}>{t('practice.hint.usefulWords')}</button>
        ) : null}
        {supportLevel < 3 ? (
          <button type="button" onClick={() => runtime.revealSupport(3)}>{t('practice.hint.sayIt')}</button>
        ) : null}
      </footer>
    </aside>
  );
}
