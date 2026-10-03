import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { learnArt } from '../learn/assets';
import { availableLearnLessons, learnRoadmapLevelById } from '../learnV2/roadmap';
import { readLearnLessonProgress } from '../speaking/roadmapProgress';

const UNIT_DECOR = [
  learnArt.treeBushes,
  learnArt.signpost,
  learnArt.cloud,
  learnArt.mountainFlag,
] as const;

export function LevelScreen() {
  const { levelId } = useParams();
  const location = useLocation();
  const level = learnRoadmapLevelById(levelId);
  const completed = new Set(readLearnLessonProgress());

  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, [location.hash, level?.id]);

  if (!level || !level.units.length) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>المستوى بيتجهز</h1>
        <p>المسار الكامل للمستوى ده لسه مش متاح.</p>
        <Link to="/learn">ارجع لكل المستويات</Link>
      </section>
    );
  }

  const availableLessons = availableLearnLessons(level);
  const completedLessons = availableLessons.filter((lesson) => completed.has(lesson.id)).length;
  const completion = availableLessons.length ? Math.round((completedLessons / availableLessons.length) * 100) : 0;
  const nextLesson = availableLessons.find((lesson) => !completed.has(lesson.id)) ?? availableLessons.at(-1);

  return (
    <section className="journey-level" dir="rtl">
      <div className="journey-level-topbar">
        <Link to="/learn" className="journey-back-link"><ProductIcon name="chevron" size={18} /><span>كل المستويات</span></Link>
        <span className="journey-level-progress-label">{completedLessons}/{availableLessons.length} من الدروس الجاهزة</span>
      </div>

      <header className="journey-course-hero">
        <div className="journey-course-copy">
          <span className="journey-course-code">مستوى {level.code}</span>
          <h1>{level.titleAr}</h1>
          <p>{level.descriptionAr}</p>
          <div className="journey-course-progress"><span style={{ width: `${completion}%` }} /></div>
          <div className="journey-course-meta">
            <span><strong>{level.units.length}</strong> وحدات في المسار</span>
            <span><strong>{level.plannedLessonCount}</strong> درس مخطط</span>
            <span><strong>{availableLessons.length}</strong> جاهزين الآن</span>
          </div>
        </div>
        <div className="journey-course-art" aria-hidden="true">
          <img src={learnArt.mascotReading} alt="" />
        </div>
      </header>

      {nextLesson ? (
        <Link className="journey-continue" to={`/learn/lesson/${nextLesson.id}`}>
          <span className="journey-continue-icon"><ProductIcon name="play" size={20} /></span>
          <span><small>{completed.has(nextLesson.id) ? 'راجع الدرس' : 'كمّل رحلتك'}</small><strong><bdi dir="ltr">{nextLesson.titleEn}</bdi></strong></span>
          <ProductIcon name="chevron" size={20} />
        </Link>
      ) : null}

      <div className="journey-unit-stack">
        {level.units.map((unit, unitIndex) => {
          const unitCompleted = unit.lessons.filter((lesson) => completed.has(lesson.id)).length;
          const unitAvailable = unit.lessons.length;
          const unitCompletion = unitAvailable ? Math.round((unitCompleted / unitAvailable) * 100) : 0;
          const decoration = UNIT_DECOR[unitIndex % UNIT_DECOR.length];
          const isAvailable = unitAvailable > 0;
          const missingCount = Math.max(0, unit.plannedLessonCount - unitAvailable);

          return (
            <section key={unit.id} id={`unit-${unit.id}`} className={`journey-unit${isAvailable ? '' : ' is-locked'}`}>
              <header className="journey-unit-header">
                <div>
                  <span>الوحدة {unit.order}</span>
                  <h2>{unit.titleAr}</h2>
                  <p>{unit.descriptionAr}</p>
                </div>
                <small>{isAvailable ? `${unitCompleted}/${unitAvailable}` : 'قريبًا'}</small>
              </header>

              <div className="journey-path-wrap">
                <div
                  className="journey-path-line"
                  aria-hidden="true"
                  style={{ background: `linear-gradient(#ff9fb8 0 ${unitCompletion}%, #dedede ${unitCompletion}% 100%)` }}
                />
                <img className={`journey-path-decor decor-${unitIndex % 2 === 0 ? 'left' : 'right'}`} src={decoration} alt="" aria-hidden="true" />

                {unit.lessons.map((lesson, localIndex) => {
                  const done = completed.has(lesson.id);
                  const current = lesson.id === nextLesson?.id && !done;
                  const side = localIndex % 2 === 0 ? 'left' : 'right';
                  return (
                    <Link
                      key={lesson.id}
                      style={{ gridRow: localIndex + 1 }}
                      className={`journey-lesson-card is-${side}${current ? ' is-current' : ''}${done ? ' is-complete' : ''}`}
                      to={`/learn/lesson/${lesson.id}`}
                    >
                      <span className={`journey-node${done ? ' is-complete' : current ? ' is-current' : ' is-open'}`}>
                        {done ? <ProductIcon name="check" size={24} /> : <ProductIcon name="learn" size={23} />}
                      </span>
                      <span className="journey-lesson-copy">
                        <small>الدرس {lesson.lesson}</small>
                        <strong><bdi dir="ltr">{lesson.titleEn}</bdi></strong>
                        <span>{lesson.titleAr} · حوالي {lesson.estimatedMinutes} دقيقة</span>
                      </span>
                      <span className="journey-lesson-arrow"><ProductIcon name="chevron" size={18} /></span>
                    </Link>
                  );
                })}

                {isAvailable && missingCount > 0 ? Array.from({ length: missingCount }, (_, index) => {
                  const localIndex = unitAvailable + index;
                  const side = localIndex % 2 === 0 ? 'left' : 'right';
                  return (
                    <div key={`planned-${unit.id}-${index}`} style={{ gridRow: localIndex + 1 }} className={`journey-lesson-card is-${side} is-locked`} aria-disabled="true">
                      <span className="journey-node is-locked"><ProductIcon name="lock" size={20} /></span>
                      <span className="journey-lesson-copy"><small>الدرس {localIndex + 1}</small><strong>قريبًا</strong><span>الدرس ده لسه بيتجهز.</span></span>
                    </div>
                  );
                }) : null}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="journey-level-finish">
        <img src={learnArt.mascotBushLove} alt="" aria-hidden="true" />
        <div>
          <strong>{completedLessons === availableLessons.length && availableLessons.length ? 'خلصت كل الدروس الجاهزة حاليًا 🎉' : 'كمّل خطوة بخطوة'}</strong>
          <span>كل درس جديد هنضيفه هيدخل مكانه الطبيعي جوه الوحدة، من غير مسار تجريبي منفصل.</span>
        </div>
      </footer>
    </section>
  );
}
