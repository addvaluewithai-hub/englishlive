import { Link } from 'react-router-dom';
import { getCharacterDefinition } from '../character/registry';
import { B1_UNIT_1, B1_UNIT_1_LESSONS } from '../course/b1/unit1';
import { getNextCourseLessonId, readCourseProgress } from '../course/store';
import { SCENE_LESSON_PILOT } from '../lessonScenes/catalog';
import { readLearnerProfile } from '../product/profile';

export function LearnScreen() {
  const profile = readLearnerProfile();
  const progress = readCourseProgress();

  if (!profile) {
    return (
      <section className="screen course-empty">
        <p className="eyebrow">Learn</p>
        <h1>Set up your speaking course first.</h1>
        <p className="lead">Choose your goal, speaking comfort and conversation partner before your first live lesson.</p>
        <Link className="button primary" to="/onboarding">Set up EnglishLive</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(profile.characterId);
  const lessonIds = B1_UNIT_1_LESSONS.map((lesson) => lesson.id);
  const nextLessonId = getNextCourseLessonId(lessonIds, progress);
  const completedCount = B1_UNIT_1_LESSONS.filter(
    (lesson) => Boolean(progress.lessonProgress[lesson.id]?.completedAt),
  ).length;
  const unitComplete = completedCount === B1_UNIT_1_LESSONS.length;

  return (
    <section className="screen learn-screen">
      <section className="course-unit-complete">
        <p className="eyebrow">A1 scene delivery pilot · curriculum source of truth</p>
        <h2>{SCENE_LESSON_PILOT.title}</h2>
        <p>
          Try the first authored lesson from <strong>english-course</strong> using the new scene runtime:
          short Arabic teaching, an authored board, guided speaking, then a fresh first-contact conversation.
        </p>
        <Link
          className="button primary"
          to={`/scene-lesson/${SCENE_LESSON_PILOT.id}?character=${character.id}`}
        >
          Try Lesson 1 with {character.name}
        </Link>
      </section>

      <header className="course-heading">
        <div>
          <p className="eyebrow">B1 · Unit 1</p>
          <h1>{B1_UNIT_1.title}</h1>
          <p className="lead">{B1_UNIT_1.promise}</p>
        </div>
        <div className="course-heading-meta">
          <strong>{completedCount}/{B1_UNIT_1_LESSONS.length}</strong>
          <span>lessons completed</span>
          <small>Course completion, not a B1 proficiency score.</small>
        </div>
      </header>

      <section className="course-unit-card">
        <div className="course-unit-intro">
          <span className="course-unit-number">01</span>
          <div>
            <strong>Unit 1</strong>
            <h2>{B1_UNIT_1.title}</h2>
            <p>Each lesson happens live with {character.name}: short teaching, an authored board when useful, spoken questions, practice, then a real unit challenge.</p>
          </div>
        </div>

        <div className="course-lesson-list">
          {B1_UNIT_1_LESSONS.map((lesson, index) => {
            const saved = progress.lessonProgress[lesson.id];
            const completed = Boolean(saved?.completedAt);
            const isCurrent = lesson.id === nextLessonId;
            const previousComplete = index === 0 || Boolean(progress.lessonProgress[B1_UNIT_1_LESSONS[index - 1].id]?.completedAt);
            const unlocked = completed || isCurrent || previousComplete && !nextLessonId;
            const label = completed ? 'Completed' : isCurrent ? (saved ? 'Continue' : 'Next lesson') : lesson.challenge ? 'Unit challenge' : 'Locked';

            return (
              <article className={`course-lesson-row${isCurrent ? ' is-current' : ''}${completed ? ' is-complete' : ''}`} key={lesson.id}>
                <div className="course-lesson-index">{lesson.challenge ? '★' : String(index + 1).padStart(2, '0')}</div>
                <div className="course-lesson-copy">
                  <div className="course-lesson-meta">
                    <span>{lesson.challenge ? 'Challenge' : 'Live lesson'}</span>
                    <strong>{label}</strong>
                  </div>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.subtitle}</p>
                  <div className="course-focus-tags">
                    {lesson.languageFocus.slice(0, 3).map((focus) => <span key={focus}>{focus}</span>)}
                  </div>
                </div>
                {completed || isCurrent || unlocked ? (
                  <Link className={isCurrent ? 'button primary' : 'button quiet'} to={`/lesson/${lesson.id}?character=${character.id}`}>
                    {completed ? 'Practise again' : saved ? 'Continue' : lesson.challenge ? 'Start challenge' : 'Start'}
                  </Link>
                ) : (
                  <span className="course-lock" aria-label="Complete the previous lesson first">Locked</span>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {unitComplete ? (
        <section className="course-unit-complete">
          <p className="eyebrow">Unit complete</p>
          <h2>You finished the authored Unit 1 path.</h2>
          <p>This means the six live lessons were completed. It does not claim B1 mastery; later units and fresh evidence are still required.</p>
          <Link className="button quiet" to={`/lesson/${B1_UNIT_1_LESSONS.at(-1)?.id}?character=${character.id}`}>Replay the challenge</Link>
        </section>
      ) : null}
    </section>
  );
}
