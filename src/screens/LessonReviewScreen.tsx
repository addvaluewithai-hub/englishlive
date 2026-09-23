import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getCharacterDefinition } from '../character/registry';
import { getCourseLesson, getNextLesson } from '../course/catalog';
import { readCourseProgress } from '../course/store';
import { keepRelationshipMemory, readEnglishLiveMemory } from '../memory/store';
import type { RelationshipMemoryProposal } from '../memory/types';

interface LessonReviewNavigationState {
  relationshipProposal?: RelationshipMemoryProposal;
}

export function LessonReviewScreen() {
  const { runId = '' } = useParams();
  const location = useLocation();
  const [courseProgress] = useState(() => readCourseProgress());
  const [relationshipMemory, setRelationshipMemory] = useState(() => readEnglishLiveMemory());
  const [proposal, setProposal] = useState<RelationshipMemoryProposal | null>(
    () => (location.state as LessonReviewNavigationState | null)?.relationshipProposal ?? null,
  );

  const run = courseProgress.recentRuns.find((item) => item.runId === runId);
  const lesson = getCourseLesson(run?.lessonId);
  const nextLesson = lesson ? getNextLesson(lesson.id) : undefined;
  const previouslyCompleted = Boolean(lesson && courseProgress.lessonProgress[lesson.id]?.completedAt);

  const observed = useMemo(
    () => run?.observations.filter((item) => item.outcome === 'met') ?? [],
    [run],
  );
  const attempted = useMemo(
    () => run?.observations.filter((item) => item.outcome === 'attempted') ?? [],
    [run],
  );

  if (!run || !lesson) {
    return (
      <section className="screen review-empty">
        <p className="eyebrow">Lesson review</p>
        <h1>This lesson run is no longer in recent local history.</h1>
        <p className="lead">EnglishLive keeps a small recent review window and a separate privacy-minimized course completion state.</p>
        <Link className="button primary" to="/learn">Back to Learn</Link>
      </section>
    );
  }

  const reviewRun = run;
  const reviewLesson = lesson;
  const character = getCharacterDefinition(reviewRun.characterId);

  function keepProposal() {
    if (!proposal) return;
    keepRelationshipMemory(proposal, reviewLesson.id, character.id);
    setProposal(null);
    setRelationshipMemory(readEnglishLiveMemory());
  }

  const partnerNoteCount = relationshipMemory.relationshipNotes.filter((note) => note.characterId === character.id).length;

  return (
    <section className="screen lesson-review-screen">
      <header className="lesson-review-hero">
        <p className="eyebrow">B1 · Unit 1 · Lesson {reviewLesson.order}</p>
        <h1>{reviewRun.completed ? 'Lesson complete.' : previouslyCompleted ? 'Practice run ended.' : 'Your lesson is saved.'}</h1>
        <p className="lead">
          {reviewRun.completed
            ? 'You completed the authored lesson path. The observations below describe this run only — they are not a B1 score.'
            : previouslyCompleted
              ? 'You had already completed this lesson before this replay. That completion is preserved.'
              : 'You can continue from the saved authored beat later. EnglishLive does not make you restart the lesson.'}
        </p>
      </header>

      <div className="review-grid">
        <section className="review-panel">
          <p className="eyebrow">Observed in this run</p>
          <h2>{observed.length ? 'What came through' : 'No assessed beat completed yet'}</h2>
          {observed.length ? (
            <div className="review-observation-list">
              {observed.map((item) => (
                <article key={item.beatId}>
                  <span className="review-mark">✓</span>
                  <div><strong>{item.title}</strong><p>The live teacher collected the authored speaking evidence for this step.</p></div>
                </article>
              ))}
            </div>
          ) : (
            <p className="review-muted">Teacher-only explanation steps may have happened, but no spoken assessment step was completed in this run.</p>
          )}
        </section>

        <section className="review-panel">
          <p className="eyebrow">Keep working on</p>
          <h2>{attempted.length ? 'Useful attempts to revisit' : 'No assessed gap recorded'}</h2>
          {attempted.length ? (
            <div className="review-observation-list">
              {attempted.map((item) => (
                <article key={item.beatId}>
                  <span className="review-mark">↻</span>
                  <div><strong>{item.title}</strong><p>You attempted this speaking step. Continuing the lesson gives the teacher another natural chance to work on it.</p></div>
                </article>
              ))}
            </div>
          ) : (
            <p className="review-muted">Nothing from this run is being shown as a failed score.</p>
          )}
        </section>
      </div>

      {proposal ? (
        <section className="memory-review-card">
          <p className="eyebrow">Optional continuity</p>
          <h2>Should {character.name} remember this for next time?</h2>
          <p>{proposal.text}</p>
          <div className="actions">
            <button type="button" className="button primary" onClick={keepProposal}>Keep with {character.name}</button>
            <button type="button" className="button quiet" onClick={() => setProposal(null)}>Not now</button>
          </div>
          <small>It stays separate from course evidence. {partnerNoteCount ? `${partnerNoteCount} approved note${partnerNoteCount === 1 ? '' : 's'} already belong to ${character.name}.` : 'Nothing personal is saved unless you choose Keep.'}</small>
        </section>
      ) : null}

      <section className="review-next">
        <div>
          <p className="eyebrow">Next step</p>
          <h2>{reviewRun.completed ? (nextLesson?.title ?? 'Unit 1 complete') : previouslyCompleted ? 'Return to your course' : `Continue ${reviewLesson.title}`}</h2>
          <p>
            {reviewRun.completed
              ? nextLesson
                ? nextLesson.subtitle
                : 'You completed all six authored lessons in Unit 1. This is course completion, not a proficiency certification.'
              : previouslyCompleted
                ? 'Your original lesson completion is still intact.'
                : 'The privacy-minimized course state remembers which authored beat comes next.'}
          </p>
        </div>
        <div className="actions">
          {reviewRun.completed && nextLesson ? (
            <Link className="button primary" to={`/lesson/${nextLesson.id}?character=${character.id}`}>Continue course</Link>
          ) : !reviewRun.completed && !previouslyCompleted ? (
            <Link className="button primary" to={`/lesson/${reviewLesson.id}?character=${character.id}`}>Continue lesson</Link>
          ) : (
            <Link className="button primary" to="/learn">Back to Learn</Link>
          )}
          <Link className="button quiet" to="/speak">Free Speak</Link>
          <Link className="text-link" to="/home">Home →</Link>
        </div>
      </section>
    </section>
  );
}
