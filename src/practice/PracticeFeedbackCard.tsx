import { useState } from 'react';
import { useI18n } from '../i18n/LocaleProvider';
import type { useConversationPracticeRuntime } from './conversationRuntime';

export function PracticeFeedbackCard({ runtime }: { runtime: ReturnType<typeof useConversationPracticeRuntime> }) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  if (!runtime.corrections.length) return null;
  return (
    <section className="practice-feedback-notebook">
      <button type="button" className="practice-notebook-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="practice-feedback-notes">
        {(locale === 'ar' ? 'ملاحظاتك (' : 'Your notes (') + runtime.corrections.length + ')'}
        <small>{locale === 'ar' ? 'افتحها وقت ما تحب' : 'Open when you are ready'}</small>
      </button>
      {open ? (
        <div id="practice-feedback-notes" className="practice-notebook-pages">
          {runtime.corrections.map((item, index) => (
            <article className="practice-feedback-card" key={item.originalEn + index}>
              <div className="practice-feedback-original"><small>{locale === 'ar' ? 'إنت قلت' : 'You said'}</small><span lang="en" dir="ltr">{item.originalEn}</span></div>
              <div className="practice-feedback-better"><small>{locale === 'ar' ? 'الأفضل' : 'Better English'}</small><strong lang="en" dir="ltr">{item.betterEn}</strong></div>
              <p>{locale === 'ar' ? item.feedbackAr : item.feedbackEn}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
