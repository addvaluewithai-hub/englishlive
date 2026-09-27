import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useProductCatalog } from '../catalog/client';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { learnArt } from '../learn/assets';
import { lessonArabicTitle, lessonProductTitle } from '../productV2/course';
import { productUnitProgress, readProductCourseProgress } from '../productV2/progress';
import { readLearnerProfile } from '../product/profile';

const UNIT_DECOR = [
  learnArt.treeBushes,
  learnArt.signpost,
  learnArt.cloud,
  learnArt.mountainFlag,
] as const;

function levelCode(id: string, title: string) {
  const normalized = id.trim().toUpperCase();
  return /^[ABC][12]$/.test(normalized) ? normalized : title;
}

export function LevelScreen() {
  const { levelId } = useParams();
  const location = useLocation();
  const catalog = useProductCatalog();
  const level = catalog.levels.find((item) => item.id === levelId) ?? catalog.levels[0];
  const progress = readProductCourseProgress();
  const profile = readLearnerProfile();
  const character = getCharacterDefinition(profile?.characterId);

  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, [location.hash, level?.id]);

  if (!level) {
    return <section className="v2-empty-screen" dir="rtl"><h1>المستوى مش متاح</h1><p>مفيش مستوى منشور بالمعرّف ده.</p><Link to="/learn">ارجع للمسار</Link></section>;
  }

  const code = levelCode(level.id, level.title);
  const allLessons = level.connectedUnits.flatMap((unit) => unit.lessons.map((lesson) => ({ lesson, unit })));
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter(({ lesson }) => Boolean(progress.lessons[lesson.id]?.completedAt)).length;
  const completion = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  const nextLesson = allLessons.find(({ lesson }) => !progress.lessons[lesson.id]?.completedAt)?.lesson ?? allLessons.at(-1)?.lesson;

  function isUnlocked(index: number, lessonId: string) {
    const saved = progress.lessons[lessonId];
    if (index === 0 || saved?.startedAt || saved?.completedAt) return true;
    return Boolean(progress.lessons[allLessons[index - 1]?.lesson.id]?.completedAt);
  }

  let globalLessonIndex = 0;

  return (
    <section className="journey-level" dir="rtl">
      <div className="journey-level-topbar">
        <Link to="/learn" className="journey-back-link"><ProductIcon name="chevron" size={18} /><span>كل المستويات</span></Link>
        <span className="journey-level-progress-label">{completedLessons}/{totalLessons} درس</span>
      </div>

      <header className="journey-course-hero">
        <div className="journey-course-copy">
          <span className="journey-course-code">مستوى {code}</span>
          <h1>{level.arabicTitle}</h1>
          <p>{level.description}</p>
          <div className="journey-course-progress"><span style={{ width: `${completion}%` }} /></div>
          <div className="journey-course-meta">
            <span><strong>{level.unitCount}</strong> وحدات منشورة</span>
            <span><strong>{totalLessons}</strong> دروس منشورة</span>
          </div>
        </div>
        <div className="journey-course-art" aria-hidden="true">
          <img src={learnArt.mascotReading} alt="" />
        </div>
      </header>

      {nextLesson ? (
        <Link className="journey-continue" to={`/scene-lesson/${nextLesson.id}?character=${character.id}`}>
          <span className="journey-continue-icon"><ProductIcon name="play" size={20} /></span>
          <span><small>كمّل رحلتك</small><strong>{lessonProductTitle(nextLesson)}</strong></span>
          <ProductIcon name="chevron" size={20} />
        </Link>
      ) : null}

      <div className="journey-unit-stack">
        {level.connectedUnits.map((unit, unitIndex) => {
          const unitSummary = productUnitProgress(unit, progress);
          const decoration = UNIT_DECOR[unitIndex % UNIT_DECOR.length];
          const unitStartIndex = globalLessonIndex;
          const firstLesson = unit.lessons[0];
          const unitUnlocked = firstLesson ? isUnlocked(unitStartIndex, firstLesson.id) : false;
          const unitCompletion = unitSummary.totalCount > 0
            ? Math.round((unitSummary.completedCount / unitSummary.totalCount) * 100)
            : 0;

          return (
            <section key={unit.id} id={`unit-${unit.id}`} className={`journey-unit${unitUnlocked ? '' : ' is-locked'}`}>
              <header className="journey-unit-header">
                <div>
                  <span>الوحدة {unit.order}</span>
                  <h2>{unit.arabicTitle || unit.title}</h2>
                  <p>{unit.description}</p>
                </div>
                <small>{unitSummary.completedCount}/{unitSummary.totalCount}</small>
              </header>

              <div className="journey-path-wrap">
                <div
                  className="journey-path-line"
                  aria-hidden="true"
                  style={{ background: `linear-gradient(#ff9fb8 0 ${unitCompletion}%, #dedede ${unitCompletion}% 100%)` }}
                />
                <img className={`journey-path-decor decor-${unitIndex % 2 ? 'left' : 'right'}`} src={decoration} alt="" aria-hidden="true" />

                {unit.lessons.map((lesson, localIndex) => {
                  const currentGlobalIndex = globalLessonIndex++;
                  const saved = progress.lessons[lesson.id];
                  const completed = Boolean(saved?.completedAt);
                  const unlocked = isUnlocked(currentGlobalIndex, lesson.id);
                  const current = lesson.id === nextLesson?.id && !completed;
                  const side = localIndex % 2 === 0 ? 'right' : 'left';
                  const lessonNumber = lesson.order || localIndex + 1;

                  const content = (
                    <>
                      <span className={`journey-node${completed ? ' is-complete' : current ? ' is-current' : unlocked ? ' is-open' : ' is-locked'}`}>
                        {completed ? <ProductIcon name="check" size={24} /> : unlocked ? <ProductIcon name="learn" size={23} /> : <ProductIcon name="lock" size={20} />}
                      </span>
                      <span className="journey-lesson-copy">
                        <small>الدرس {lessonNumber}</small>
                        <strong>{lessonProductTitle(lesson)}</strong>
                        <span>{lessonArabicTitle(lesson) || lesson.subtitle}</span>
                      </span>
                      {unlocked ? <span className="journey-lesson-arrow"><ProductIcon name="chevron" size={18} /></span> : null}
                    </>
                  );

                  return unlocked ? (
                    <Link key={lesson.id} className={`journey-lesson-card is-${side}${current ? ' is-current' : ''}${completed ? ' is-complete' : ''}`} to={`/scene-lesson/${lesson.id}?character=${character.id}`}>
                      {content}
                    </Link>
                  ) : (
                    <div key={lesson.id} className={`journey-lesson-card is-${side} is-locked`} aria-disabled="true">{content}</div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="journey-level-finish">
        <img src={learnArt.mascotBushLove} alt="" aria-hidden="true" />
        <div><strong>{completion === 100 ? 'خلصت كل المحتوى المنشور هنا 🎉' : 'كمّل خطوة بخطوة'}</strong><span>كل Lesson جديدة تتنشر هتدخل مكانها في الرحلة تلقائيًا.</span></div>
      </footer>
    </section>
  );
}
