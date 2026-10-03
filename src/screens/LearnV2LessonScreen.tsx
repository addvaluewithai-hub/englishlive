import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { apiUrl } from '../config/api';
import { learnV2LessonById, type LearnV2ListeningClip } from '../learnV2/catalog';
import { learnUnitForLesson } from '../learnV2/roadmap';

const STEP_LABELS = [
  { key: 'goal', title: 'الهدف', icon: '◎' },
  { key: 'prepare', title: 'جهّز اللغة', icon: '▤' },
  { key: 'move', title: 'افهم الفكرة', icon: '✦' },
  { key: 'listen', title: 'اسمع', icon: '◉' },
  { key: 'mission', title: 'اتكلم', icon: '●' },
] as const;

type StepKey = (typeof STEP_LABELS)[number]['key'];

function nextStep(step: StepKey): StepKey | null {
  const index = STEP_LABELS.findIndex((item) => item.key === step);
  return STEP_LABELS[index + 1]?.key ?? null;
}

function previousStep(step: StepKey): StepKey | null {
  const index = STEP_LABELS.findIndex((item) => item.key === step);
  return STEP_LABELS[index - 1]?.key ?? null;
}

export function LearnV2LessonScreen() {
  const { lessonId } = useParams();
  const lesson = learnV2LessonById(lessonId);
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
      <section className="v2-empty-screen" dir="rtl">
        <h1>الدرس مش موجود</h1>
        <p>ارجع لخريطة Learn واختار درس متاح من المستوى.</p>
        <Link className="v2-primary-button" to="/learn">الرجوع لـ Learn</Link>
      </section>
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
        [clip.id]: reason instanceof Error ? reason.message : 'الصوت مش متاح دلوقتي.',
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

  return (
    <section className="lv2-lesson" dir="rtl">
      <header className="lv2-hero">
        <Link className="lv2-back" to={backPath} aria-label="الرجوع لخريطة المستوى"><ProductIcon name="chevron" size={22} /></Link>
        <div className="lv2-hero-copy">
          <span className="lv2-code">{lesson.code}</span>
          <h1><bdi dir="ltr">{lesson.titleEn}</bdi></h1>
          <p>{lesson.titleAr} • حوالي {lesson.estimatedMinutes} دقيقة</p>
        </div>
        <span className={`lv2-level is-${lesson.level.toLowerCase()}`}>{lesson.level}</span>
      </header>

      <nav className="lv2-steps" aria-label="مراحل الدرس">
        {STEP_LABELS.map((item, index) => {
          const activeIndex = STEP_LABELS.findIndex((candidate) => candidate.key === step);
          const isActive = item.key === step;
          const isPast = index < activeIndex;
          return (
            <button key={item.key} type="button" className={`${isActive ? 'is-active' : ''}${isPast ? ' is-past' : ''}`} onClick={() => setStep(item.key)}>
              <i aria-hidden="true">{isPast ? '✓' : item.icon}</i>
              <span>{item.title}</span>
            </button>
          );
        })}
      </nav>

      <main className="lv2-stage">
        {step === 'goal' ? (
          <article className="lv2-panel lv2-goal-panel">
            <span className="lv2-eyebrow">هتطلع بإيه؟</span>
            <h2>{lesson.goalAr}</h2>
            <div className="lv2-goal-example" dir="ltr">
              {lesson.goalExample.map((line) => <p key={line}>{line}</p>)}
            </div>
            <div className="lv2-principle">
              <strong>طريقة الدرس</strong>
              <p>هنجهّز اللغة الأول، نفهم الفكرة المهمة، نسمعها في موقف طبيعي، وبعدها تستخدمها بنفسك في محادثة حقيقية.</p>
            </div>
          </article>
        ) : null}

        {step === 'prepare' ? (
          <article className="lv2-panel">
            <span className="lv2-eyebrow">Prepare</span>
            <h2>جهّز اللغة قبل ما تتكلم</h2>
            <p className="lv2-lead">{lesson.prepIntroAr}</p>

            <section className="lv2-language-section">
              <header><div><strong>Language you'll USE</strong><span>دي اللغة اللي مفيد تطلع منك في الكلام.</span></div><em>{useItems.length}</em></header>
              <div className="lv2-language-grid">
                {useItems.map((item) => {
                  const isKnown = known.has(item.id);
                  return (
                    <article key={item.id} className={`lv2-language-card${isKnown ? ' is-known' : ''}`}>
                      <div className="lv2-language-top">
                        <strong dir="ltr">{item.english}</strong>
                        <button type="button" onClick={() => toggleKnown(item.id)}>{isKnown ? '✓ عارفها' : 'عارفها؟'}</button>
                      </div>
                      <span>{item.meaningAr}</span>
                      <p dir="ltr">{item.exampleEn}</p>
                      {item.noteAr ? <small>{item.noteAr}</small> : null}
                    </article>
                  );
                })}
              </div>
            </section>

            {hearItems.length ? (
              <section className="lv2-language-section is-receptive">
                <header><div><strong>Language you'll HEAR</strong><span>المطلوب هنا إنك تفهمها لما تظهر؛ مش لازم تحشرها في كلامك.</span></div><em>{hearItems.length}</em></header>
                <div className="lv2-language-grid compact">
                  {hearItems.map((item) => {
                    const isKnown = known.has(item.id);
                    return (
                      <article key={item.id} className={`lv2-language-card${isKnown ? ' is-known' : ''}`}>
                        <div className="lv2-language-top"><strong dir="ltr">{item.english}</strong><button type="button" onClick={() => toggleKnown(item.id)}>{isKnown ? '✓ عارفها' : 'عارفها؟'}</button></div>
                        <span>{item.meaningAr}</span>
                        <p dir="ltr">{item.exampleEn}</p>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </article>
        ) : null}

        {step === 'move' ? (
          <article className="lv2-panel">
            <span className="lv2-eyebrow">{lesson.move.eyebrowAr}</span>
            <h2>{lesson.move.titleAr}</h2>
            <p className="lv2-lead">{lesson.move.introAr}</p>
            <div className="lv2-move-steps">
              {lesson.move.steps.map((moveStep, index) => (
                <div key={moveStep.labelEn}>
                  <span>{index + 1}</span>
                  <strong dir="ltr">{moveStep.labelEn}</strong>
                  <p>{moveStep.explanationAr}</p>
                </div>
              ))}
            </div>
            <section className="lv2-dialogue-demo">
              <strong>شوفها في مثال</strong>
              {lesson.move.example.map((turn, index) => (
                <p key={`${turn.speaker}-${index}`} dir="ltr"><b>{turn.speaker}:</b> {turn.text}</p>
              ))}
            </section>
            <p className="lv2-note">{lesson.move.noteAr}</p>
            {lesson.move.languageNote?.length ? (
              <section className="lv2-language-note">
                <strong>Language note</strong>
                {lesson.move.languageNote.map((note) => <div key={note.form}><b dir="ltr">{note.form}</b><span>{note.explanationAr}</span></div>)}
              </section>
            ) : null}
          </article>
        ) : null}

        {step === 'listen' ? (
          <article className="lv2-panel">
            <span className="lv2-eyebrow">Listening</span>
            <h2>اسمع اللغة وهي عايشة</h2>
            <p className="lv2-lead">{lesson.listeningIntroAr}</p>
            <div className="lv2-listening-stack">
              {lesson.listeningClips.map((clip, clipIndex) => (
                <section className="lv2-listening-card" key={clip.id}>
                  <header>
                    <span>{clipIndex + 1}</span>
                    <div><strong>{clip.titleAr}</strong><p>{clip.subtitleAr}</p></div>
                  </header>
                  {!audioUrls[clip.id] ? (
                    <button className="lv2-listen-button" type="button" onClick={() => void loadAudio(clip)} disabled={audioLoading[clip.id]}>
                      <span aria-hidden="true">▶</span>
                      {audioLoading[clip.id] ? 'بنحضّر الصوت…' : 'اسمع المحادثة'}
                    </button>
                  ) : (
                    <audio className="lv2-audio" controls preload="metadata" src={audioUrls[clip.id]} />
                  )}
                  {audioErrors[clip.id] ? <p className="lv2-audio-error">{audioErrors[clip.id]} — تقدر تكمل بالنص لو حبيت.</p> : null}

                  <div className="lv2-questions">
                    {clip.questions.map((question) => {
                      const selected = answers[question.id];
                      const hasAnswer = selected !== undefined;
                      const correct = selected === question.answerIndex;
                      return (
                        <div className="lv2-question" key={question.id}>
                          <strong>{question.promptAr}</strong>
                          <div>
                            {question.options.map((option, optionIndex) => (
                              <button
                                key={option}
                                type="button"
                                className={hasAnswer && optionIndex === selected ? (correct ? 'is-correct' : 'is-wrong') : ''}
                                onClick={() => answerQuestion(question.id, optionIndex)}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                          {hasAnswer ? <small className={correct ? 'is-correct' : 'is-wrong'}>{correct ? question.feedbackAr : 'جرّب تسمع الجزء ده تاني وبص على المعنى العام.'}</small> : null}
                        </div>
                      );
                    })}
                  </div>

                  <button className="lv2-transcript-toggle" type="button" onClick={() => toggleTranscript(clip.id)}>
                    {transcriptsOpen[clip.id] ? 'اخفي النص' : 'اعرض النص بعد ما تسمع'}
                  </button>
                  {transcriptsOpen[clip.id] ? (
                    <div className="lv2-transcript" dir="ltr">
                      {clip.turns.map((turn, index) => <p key={`${turn.speaker}-${index}`}><strong>{turn.speaker}:</strong> {turn.text}</p>)}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </article>
        ) : null}

        {step === 'mission' ? (
          <article className="lv2-panel lv2-mission-panel">
            <span className="lv2-eyebrow">Speaking Mission</span>
            <h2>{lesson.missionTitleAr}</h2>
            <p className="lv2-lead">{lesson.missionSetupAr}</p>
            <section className="lv2-mission-language">
              <strong>Useful language — مرجع سريع، مش checklist</strong>
              <div>{lesson.missionUsefulLanguage.map((item) => <span key={item} dir="ltr">{item}</span>)}</div>
            </section>
            <section className="lv2-help-explainer">
              <span>2×</span>
              <div>
                <strong>هتعمل المحادثة مرتين</strong>
                <p>أول مرة الردود الإنجليزية هتظهر لك ككروت صغيرة. بعدها تعيد نفس الموقف والمعنى يظهر بالعربي وإنت تنتج الإنجليزي بنفسك. ولو احتجت تفهم كلام Otti، زر «اشرح بالعربي» موجود جوه المحادثة.</p>
              </div>
            </section>
            <Link className="lv2-mission-button" to={`/speak/live/${lesson.missionScenarioId}`}>
              <ProductIcon name="speak" size={28} />
              <span>ابدأ المحادثة</span>
              <ProductIcon name="chevron" size={22} />
            </Link>
            <small className="lv2-source-note">{lesson.sourceNoteAr}</small>
          </article>
        ) : null}
      </main>

      <footer className="lv2-footer">
        {previous ? <button type="button" className="lv2-secondary" onClick={() => setStep(previous)}>السابق</button> : <Link className="lv2-secondary" to={backPath}>المستوى</Link>}
        {next ? <button type="button" className="lv2-primary" onClick={() => setStep(next)}>التالي <span>←</span></button> : null}
      </footer>
    </section>
  );
}
