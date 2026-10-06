import { useI18n } from '../i18n/LocaleProvider';
import { usePracticeMissionRuntime } from './runtime';

type PracticeRuntime = ReturnType<typeof usePracticeMissionRuntime>;

export function PracticeFeedbackCard({ runtime }: { runtime: PracticeRuntime }) {
  const { locale } = useI18n();
  const feedback = runtime.turnFeedback;
  if (!feedback) return null;

  const copy = locale === 'ar'
    ? {
        correction: feedback.requiresRetry ? 'صحّح دي الأول' : 'Better English',
        task_redirect: 'المطلوب دلوقتي',
        repair: 'قولها تاني',
        original: 'إنت قلت',
        better: 'الأفضل',
        retry: 'جرّبها تاني بطريقتك قبل ما نكمل.',
        dismiss: 'إخفاء الملاحظة',
      }
    : {
        correction: feedback.requiresRetry ? 'Fix this first' : 'Better English',
        task_redirect: 'What you need to do now',
        repair: 'Try that again',
        original: 'You said',
        better: 'Better English',
        retry: 'Try the same move again in your own words before continuing.',
        dismiss: 'Hide feedback',
      };

  const icon = feedback.kind === 'correction' ? '✨' : feedback.kind === 'task_redirect' ? '↩️' : '🎧';
  const title = copy[feedback.kind];
  const body = locale === 'ar' ? feedback.feedbackAr : feedback.feedbackEn;

  return (
    <aside
      className={`practice-feedback-card is-${feedback.kind}${feedback.requiresRetry ? ' requires-retry' : ''}`}
      aria-live="polite"
      aria-label={title}
    >
      <header>
        <div>
          <span aria-hidden="true">{icon}</span>
          <strong>{title}</strong>
        </div>
        <button type="button" onClick={runtime.dismissTurnFeedback} aria-label={copy.dismiss}>×</button>
      </header>

      {body ? <p>{body}</p> : null}

      {feedback.originalEn ? (
        <div className="practice-feedback-original">
          <small>{copy.original}</small>
          <span lang="en" dir="ltr">{feedback.originalEn}</span>
        </div>
      ) : null}

      {feedback.betterEn ? (
        <div className="practice-feedback-better">
          <small>{copy.better}</small>
          <strong lang="en" dir="ltr">{feedback.betterEn}</strong>
        </div>
      ) : null}

      {feedback.requiresRetry ? <footer>{copy.retry}</footer> : null}
    </aside>
  );
}
