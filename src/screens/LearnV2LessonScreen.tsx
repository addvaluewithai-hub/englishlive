import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { apiUrl } from '../config/api';
import { lessonDisplayTitle } from '../i18n/format';
import { useI18n } from '../i18n/LocaleProvider';
import { learnV2LessonById, type LearnV2ListeningClip } from '../learnV2/catalog';
import { learnUnitForLesson } from '../learnV2/roadmap';
import { Button, ButtonLink } from '../ui/primitives/Button';
import { Card } from '../ui/primitives/Card';
import { EmptyState } from '../ui/product/EmptyState';
import styles from '../ui/product/LearnLesson.module.css';

const STEP_DEFINITIONS = [
  { key: 'goal', labelKey: 'lesson.step.goal' },
  { key: 'prepare', labelKey: 'lesson.step.prepare' },
  { key: 'move', labelKey: 'lesson.step.move' },
  { key: 'listen', labelKey: 'lesson.step.listen' },
  { key: 'mission', labelKey: 'lesson.step.mission' },
] as const;

type StepKey = (typeof STEP_DEFINITIONS)[number]['key'];

function nextStep(step: StepKey): StepKey | null {
  const index = STEP_DEFINITIONS.findIndex((item) => item.key === step);
  return STEP_DEFINITIONS[index + 1]?.key ?? null;
}

function previousStep(step: StepKey): StepKey | null {
  const index = STEP_DEFINITIONS.findIndex((item) => item.key === step);
  return STEP_DEFINITIONS[index - 1]?.key ?? null;
}

export function LearnV2LessonScreen() {
  const { lessonId } = useParams();
  const lesson = learnV2LessonById(lessonId);
  const { locale, number, t } = useI18n();
  const [step, setStep] = useState<StepKey>('goal');
  const [known, setKnown] = useState<Set<string>>(() => new Set());
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [audioLoading, setAudioLoading] = useState<Record<string, boolean>>({});
  const [audioErrors, setAudioErrors] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [transcriptsOpen, setTranscriptsOpen] = useState<Record<string, boolean>>({});
  const audioUrlsRef = useRef<Record<string, string>>({});

  useEffect(() => () => {
    Object.values(audioUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  if (!lesson) {
    return (
      <EmptyState
        title={t('lesson.notFoundTitle')}
        description={t('lesson.notFoundDescription')}
        action={<ButtonLink to="/learn">{t('lesson.backLearn')}</ButtonLink>}
      />
    );
  }

  function toggleKnown(itemId: string) {
    setKnown((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  async function loadAudio(clip: LearnV2ListeningClip) {
    if (audioUrls[clip.id] || audioLoading[clip.id]) return;
    setAudioLoading((current) => ({ ...current, [clip.id]: true }));
    setAudioErrors((current) => ({ ...current, [clip.id]: '' }));
    try {
      const response = await fetch(apiUrl(`/api/learn-listening?clip=${encodeURIComponent(clip.id)}`), {
        headers: { accept: 'audio/wav' },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || `Listening audio failed (${response.status}).`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioUrlsRef.current[clip.id] = url;
      setAudioUrls((current) => ({ ...current, [clip.id]: url }));
    } catch (reason) {
      setAudioErrors((current) => ({
        ...current,
        [clip.id]: reason instanceof Error ? reason.message : t('lesson.audioUnavailable'),
      }));
    } finally {
      setAudioLoading((current) => ({ ...current, [clip.id]: false }));
    }
  }

  function answerQuestion(questionId: string, optionIndex: number) {
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }));
  }

  function toggleTranscript(clipId: string) {
    setTranscriptsOpen((current) => ({ ...current, [clipId]: !current[clipId] }));
  }

  const unit = learnUnitForLesson(lesson);
  const backPath = unit
    ? `/learn/level/${lesson.level.toLowerCase()}#unit-${unit.id}`
    : `/learn/level/${lesson.level.toLowerCase()}`;
  const useItems = lesson.prepItems.filter((item) => item.role === 'use');
  const hearItems = lesson.prepItems.filter((item) => item.role === 'hear');
  const next = nextStep(step);
  const previous = previousStep(step);
  const activeIndex = STEP_DEFINITIONS.findIndex((item) => item.key === step);
  const primaryTitle = lessonDisplayTitle(locale, lesson);
  const secondaryTitle = locale === 'ar'
    ? { text: lesson.titleEn, lang: 'en', direction: 'ltr' as const }
    : { text: lesson.titleAr, lang: 'ar', direction: 'rtl' as const };

  return (
    <section className={styles.lesson} data-lesson-step={step}>
      <Card tone="raised" className={styles.hero}>
        <Link className={styles.back} to={backPath} aria-label={t('lesson.back')}>
          <ProductIcon name="chevron" size={22} />
        </Link>
        <div className={styles.heroCopy}>
          <div className={styles.heroMeta}>
            <span className={styles.code}>{lesson.code}</span>
            <span className={styles.levelBadge}>{lesson.level}</span>
          </div>
          <h1 className={styles.title} lang={primaryTitle.lang} dir={primaryTitle.direction}>{primaryTitle.text}</h1>
          <p className={styles.subtitle}>
            <span lang={secondaryTitle.lang} dir={secondaryTitle.direction}>{secondaryTitle.text}</span>
            <span aria-hidden="true">•</span>
            <span>{t('lesson.minutes', { number: lesson.estimatedMinutes })}</span>
          </p>
        </div>
      </Card>

      <nav className={styles.steps} aria-label={t('lesson.stepsLabel')}>
        {STEP_DEFINITIONS.map((item, index) => {
          const isActive = item.key === step;
          const isPast = index < activeIndex;
          return (
            <button
              key={item.key}
              type="button"
              className={[styles.stepButton, isActive ? styles.stepActive : '', isPast ? styles.stepPast : ''].filter(Boolean).join(' ')}
              onClick={() => setStep(item.key)}
              aria-current={isActive ? 'step' : undefined}
              data-lesson-step-target={item.key}
            >
              <span className={styles.stepMarker} aria-hidden="true">
                {isPast ? <ProductIcon name="check" size={15} /> : number(index + 1)}
              </span>
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      <main className={styles.stage}>
        {step === 'goal' ? (
          <Card className={styles.panel}>
            <span className={styles.eyebrow}>{t('lesson.goalEyebrow')}</span>
            <h2 className={styles.panelTitle} lang="ar" dir="rtl">{lesson.goalAr}</h2>
            <div className={styles.goalExample} lang="en" dir="ltr">
              {lesson.goalExample.map((line) => <p key={line}>{line}</p>)}
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutIcon} aria-hidden="true"><ProductIcon name="learn" size={22} /></span>
              <div>
                <strong>{t('lesson.methodTitle')}</strong>
                <p>{t('lesson.methodBody')}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {step === 'prepare' ? (
          <Card className={styles.panel}>
            <span className={styles.eyebrow}>{t('lesson.prepareEyebrow')}</span>
            <h2 className={styles.panelTitle}>{t('lesson.prepareTitle')}</h2>
            <p className={styles.lead} lang="ar" dir="rtl">{lesson.prepIntroAr}</p>

            <section className={styles.languageSection}>
              <header className={styles.sectionHeader}>
                <div className={styles.sectionHeaderCopy}>
                  <strong>{t('lesson.useLanguageTitle')}</strong>
                  <span>{t('lesson.useLanguageBody')}</span>
                </div>
                <em className={styles.countBadge}>{number(useItems.length)}</em>
              </header>
              <div className={styles.languageGrid}>
                {useItems.map((item) => {
                  const isKnown = known.has(item.id);
                  return (
                    <article key={item.id} className={[styles.languageCard, isKnown ? styles.languageKnown : ''].filter(Boolean).join(' ')}>
                      <div className={styles.languageTop}>
                        <strong lang="en" dir="ltr">{item.english}</strong>
                        <button
                          className={styles.knownToggle}
                          type="button"
                          onClick={() => toggleKnown(item.id)}
                          aria-pressed={isKnown}
                          data-known-toggle={item.id}
                        >
                          {isKnown ? t('lesson.known') : t('lesson.markKnown')}
                        </button>
                      </div>
                      <span className={styles.meaning} lang="ar" dir="rtl">{item.meaningAr}</span>
                      <p className={styles.example} lang="en" dir="ltr">{item.exampleEn}</p>
                      {item.noteAr ? <small className={styles.note} lang="ar" dir="rtl">{item.noteAr}</small> : null}
                    </article>
                  );
                })}
              </div>
            </section>

            {hearItems.length ? (
              <section className={styles.languageSection}>
                <header className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderCopy}>
                    <strong>{t('lesson.hearLanguageTitle')}</strong>
                    <span>{t('lesson.hearLanguageBody')}</span>
                  </div>
                  <em className={styles.countBadge}>{number(hearItems.length)}</em>
                </header>
                <div className={[styles.languageGrid, styles.languageGridCompact].join(' ')}>
                  {hearItems.map((item) => {
                    const isKnown = known.has(item.id);
                    return (
                      <article key={item.id} className={[styles.languageCard, isKnown ? styles.languageKnown : ''].filter(Boolean).join(' ')}>
                        <div className={styles.languageTop}>
                          <strong lang="en" dir="ltr">{item.english}</strong>
                          <button
                            className={styles.knownToggle}
                            type="button"
                            onClick={() => toggleKnown(item.id)}
                            aria-pressed={isKnown}
                            data-known-toggle={item.id}
                          >
                            {isKnown ? t('lesson.known') : t('lesson.markKnown')}
                          </button>
                        </div>
                        <span className={styles.meaning} lang="ar" dir="rtl">{item.meaningAr}</span>
                        <p className={styles.example} lang="en" dir="ltr">{item.exampleEn}</p>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </Card>
        ) : null}

        {step === 'move' ? (
          <Card className={styles.panel}>
            <span className={styles.eyebrow} lang="ar" dir="rtl">{lesson.move.eyebrowAr}</span>
            <h2 className={styles.panelTitle} lang="ar" dir="rtl">{lesson.move.titleAr}</h2>
            <p className={styles.lead} lang="ar" dir="rtl">{lesson.move.introAr}</p>
            <div className={styles.moveSteps}>
              {lesson.move.steps.map((moveStep, index) => (
                <div className={styles.moveStep} key={moveStep.labelEn}>
                  <span className={styles.moveStepNumber}>{number(index + 1)}</span>
                  <strong lang="en" dir="ltr">{moveStep.labelEn}</strong>
                  <p lang="ar" dir="rtl">{moveStep.explanationAr}</p>
                </div>
              ))}
            </div>
            <section className={styles.dialogue}>
              <strong>{t('lesson.moveExample')}</strong>
              {lesson.move.example.map((turn, index) => (
                <p key={`${turn.speaker}-${index}`} lang="en" dir="ltr"><b>{turn.speaker}:</b> {turn.text}</p>
              ))}
            </section>
            <p className={styles.authoredNote} lang="ar" dir="rtl">{lesson.move.noteAr}</p>
            {lesson.move.languageNote?.length ? (
              <section className={styles.languageNote}>
                <strong>{t('lesson.languageNote')}</strong>
                {lesson.move.languageNote.map((note) => (
                  <div key={note.form}>
                    <b lang="en" dir="ltr">{note.form}</b>
                    <span lang="ar" dir="rtl">{note.explanationAr}</span>
                  </div>
                ))}
              </section>
            ) : null}
          </Card>
        ) : null}

        {step === 'listen' ? (
          <Card className={styles.panel}>
            <span className={styles.eyebrow}>{t('lesson.listeningEyebrow')}</span>
            <h2 className={styles.panelTitle}>{t('lesson.listeningTitle')}</h2>
            <p className={styles.lead} lang="ar" dir="rtl">{lesson.listeningIntroAr}</p>
            <div className={styles.listeningStack}>
              {lesson.listeningClips.map((clip, clipIndex) => (
                <section className={styles.listeningCard} key={clip.id}>
                  <header className={styles.listeningHeader}>
                    <span className={styles.listeningIndex}>{number(clipIndex + 1)}</span>
                    <div>
                      <strong lang="ar" dir="rtl">{clip.titleAr}</strong>
                      <p lang="ar" dir="rtl">{clip.subtitleAr}</p>
                    </div>
                  </header>
                  {!audioUrls[clip.id] ? (
                    <Button
                      className={styles.audioButton}
                      type="button"
                      onClick={() => void loadAudio(clip)}
                      loading={audioLoading[clip.id]}
                      data-audio-load={clip.id}
                    >
                      <ProductIcon name="play" size={18} />
                      {audioLoading[clip.id] ? t('lesson.audioPreparing') : t('lesson.audioPlay')}
                    </Button>
                  ) : (
                    <audio className={styles.audio} controls preload="metadata" src={audioUrls[clip.id]} />
                  )}
                  {audioErrors[clip.id] ? (
                    <p className={styles.audioError}>{audioErrors[clip.id]} — {t('lesson.audioFallback')}</p>
                  ) : null}

                  <div className={styles.questions}>
                    {clip.questions.map((question) => {
                      const selected = answers[question.id];
                      const hasAnswer = selected !== undefined;
                      const correct = selected === question.answerIndex;
                      return (
                        <div className={styles.question} key={question.id}>
                          <strong lang="ar" dir="rtl">{question.promptAr}</strong>
                          <div className={styles.options}>
                            {question.options.map((option, optionIndex) => {
                              const isSelected = hasAnswer && optionIndex === selected;
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  dir="auto"
                                  className={[
                                    styles.option,
                                    isSelected && correct ? styles.optionCorrect : '',
                                    isSelected && !correct ? styles.optionWrong : '',
                                  ].filter(Boolean).join(' ')}
                                  onClick={() => answerQuestion(question.id, optionIndex)}
                                  data-question-option={`${question.id}-${optionIndex}`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                          {hasAnswer ? (
                            <small
                              className={[styles.feedback, correct ? styles.feedbackCorrect : styles.feedbackWrong].join(' ')}
                              lang={correct ? 'ar' : undefined}
                              dir={correct ? 'rtl' : undefined}
                            >
                              {correct ? question.feedbackAr : t('lesson.tryAgain')}
                            </small>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    className={styles.transcriptToggle}
                    type="button"
                    onClick={() => toggleTranscript(clip.id)}
                    aria-expanded={Boolean(transcriptsOpen[clip.id])}
                    data-transcript-toggle={clip.id}
                  >
                    {transcriptsOpen[clip.id] ? t('lesson.hideTranscript') : t('lesson.showTranscript')}
                  </button>
                  {transcriptsOpen[clip.id] ? (
                    <div className={styles.transcript} lang="en" dir="ltr" data-transcript={clip.id}>
                      {clip.turns.map((turn, index) => (
                        <p key={`${turn.speaker}-${index}`}><strong>{turn.speaker}:</strong> {turn.text}</p>
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </Card>
        ) : null}

        {step === 'mission' ? (
          <Card className={styles.panel}>
            <span className={styles.eyebrow}>{t('lesson.missionEyebrow')}</span>
            <h2 className={styles.panelTitle} lang="ar" dir="rtl">{lesson.missionTitleAr}</h2>
            <p className={styles.lead} lang="ar" dir="rtl">{lesson.missionSetupAr}</p>
            <section className={styles.missionLanguage}>
              <strong>{t('lesson.usefulLanguage')}</strong>
              <div className={styles.phraseList}>
                {lesson.missionUsefulLanguage.map((item) => <span className={styles.phrase} key={item} lang="en" dir="ltr">{item}</span>)}
              </div>
            </section>
            <div className={styles.callout}>
              <span className={styles.calloutIcon} aria-hidden="true">2×</span>
              <div>
                <strong>{t('lesson.missionTwoRoundsTitle')}</strong>
                <p>{t('lesson.missionTwoRoundsBody')}</p>
              </div>
            </div>
            <ButtonLink className={styles.missionAction} size="lg" to={`/speak/live/${lesson.missionScenarioId}`}>
              <ProductIcon name="speak" size={24} />
              <span>{t('lesson.startConversation')}</span>
            </ButtonLink>
            <small className={styles.sourceNote} lang="ar" dir="rtl">{lesson.sourceNoteAr}</small>
          </Card>
        ) : null}
      </main>

      <footer className={styles.footer}>
        {previous ? (
          <Button variant="secondary" onClick={() => setStep(previous)}>{t('lesson.previous')}</Button>
        ) : (
          <ButtonLink variant="secondary" to={backPath}>{t('lesson.level')}</ButtonLink>
        )}
        {next ? <Button onClick={() => setStep(next)}>{t('lesson.next')}</Button> : <span />}
      </footer>
    </section>
  );
}
