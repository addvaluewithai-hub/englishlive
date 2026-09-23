import { Link } from 'react-router-dom';
import { getCharacterDefinition } from '../character/registry';
import { B1_UNIT_1, B1_UNIT_1_LESSONS } from '../course/b1/unit1';
import { getNextCourseLessonId, readCourseProgress } from '../course/store';
import { readLearnerProfile } from '../product/profile';

export function ProgressScreen() {
  const profile = readLearnerProfile();
  const progress = readCourseProgress();

  if (!profile) {
    return (
      <section className="screen review-empty">
        <p className="eyebrow">Course progress</p>
        <h1>Set up EnglishLive first.</h1>
        <p className="lead">Your course path starts after onboarding and a conversation partner choice.</p>
        <Link className="button primary" to="/onboarding">Set up EnglishLive</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(profile.characterId);
  const nextLessonId = getNextCourseLessonId(B1_UNIT_1_LESSONS.map((lesson) => lesson.id), progress);
  const completedCount = B1_UNIT_1_LESSONS.filter((lesson) => progress.lessonProgress[lesson.id]?.completedAt).length;
  const recentRuns = progress.recentRuns.filter((run) => run.unitId === B1_UNIT_1.id).slice(-5).reverse();

  return (
    <section className="screen progress-screen course-progress-screen">
      <div className="progress-heading">
        <p className="eyebrow">B1 · Unit 1</p>
        <h1>{B1_UNIT_1.title}</h1>
        <p className="lead">{completedCount} of {B1_UNIT_1_LESSONS.length} authored lessons are complete. That is course progress, not a percentage claim about your overall B1 ability.</p>
      </div>

      <section className="progress-next-card">
        <div>
          <span className="session-meta">{nextLessonId ? 'Continue your course' : 'Unit complete'}</span>
          <h2>{nextLessonId ? B1_UNIT_1_LESSONS.find((lesson) => lesson.id === nextLessonId)?.title : 'Replay the live story challenge'}</h2>
          <p>{nextLessonId ? 'Your next unlocked lesson continues the authored Unit 1 sequence.' : 'All six lessons were completed. More units are not being implied until they are authored and validated.'}</p>
        </div>
        <Link className="button primary" to={nextLessonId ? `/lesson/${nextLessonId}?character=${character.id}` : `/lesson/${B1_UNIT_1_LESSONS.at(-1)?.id}?character=${character.id}`}>
          {nextLessonId ? 'Continue' : 'Replay challenge'}
        </Link>
      </section>

      <div className="mission-path-list course-progress-list">
        {B1_UNIT_1_LESSONS.map((lesson, index) => {
          const saved = progress.lessonProgress[lesson.id];
          const stats = progress.lessonStats[lesson.id];
          const completed = Boolean(saved?.completedAt);
          const current = lesson.id === nextLessonId;
          const locked = !completed && !current;
          const metBeatCount = saved ? Object.values(saved.beatStatuses).filter((status) => status === 'met').length : 0;

          return (
            <article className={`mission-path-card${current ? ' is-next' : ''}`} key={lesson.id}>
              <div className="mission-path-index">{lesson.challenge ? '★' : String(index + 1).padStart(2, '0')}</div>
              <div className="mission-path-copy">
                <div className="mission-path-meta">
                  <span>{lesson.challenge ? 'Unit challenge' : 'Live lesson'}</span>
                  <strong className={`mission-status ${completed ? 'status-observed' : current ? 'status-seen' : ''}`}>
                    {completed ? 'Completed' : current ? (saved ? 'In progress' : 'Next') : 'Locked'}
                  </strong>
                </div>
                <h2>{lesson.title}</h2>
                <p>{lesson.subtitle}</p>
                <div className="mission-path-evidence">
                  {completed
                    ? <span>{stats?.completedRuns ?? 1} completed run{(stats?.completedRuns ?? 1) === 1 ? '' : 's'}</span>
                    : saved
                      ? <span>{metBeatCount}/{lesson.beats.length} authored steps completed · progress saved</span>
                      : <span>{locked ? 'Complete the previous lesson to unlock' : 'Ready to start'}</span>}
                </div>
              </div>
              {!locked || completed ? (
                <Link className="text-link" to={`/lesson/${lesson.id}?character=${character.id}`}>
                  {completed ? 'Practise again' : saved ? 'Continue' : 'Start'} →
                </Link>
              ) : <span className="course-lock">Locked</span>}
            </article>
          );
        })}
      </div>

      {recentRuns.length ? (
        <section className="recent-lesson-runs">
          <p className="eyebrow">Recent lesson runs</p>
          <div className="recent-run-list">
            {recentRuns.map((run) => (
              <article key={run.runId}>
                <div><strong>{run.lessonTitle}</strong><span>{run.completed ? 'Completed' : 'Paused'} · {new Date(run.endedAt).toLocaleDateString()}</span></div>
                <span>{run.observations.filter((item) => item.outcome === 'met').length} spoken step{run.observations.filter((item) => item.outcome === 'met').length === 1 ? '' : 's'} evidenced</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="progress-principle">
        <p className="eyebrow">Two different truths</p>
        <h2>Course completion is not proficiency certification.</h2>
        <p>EnglishLive can truthfully say which authored lessons you completed. It still needs repeated fresh evidence across units and contexts before making broader claims about speaking ability.</p>
      </section>
    </section>
  );
}
