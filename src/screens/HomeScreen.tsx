import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { getCharacterDefinition } from '../character/registry';
import { B1_UNIT_1, B1_UNIT_1_LESSONS } from '../course/b1/unit1';
import { getNextCourseLessonId, readCourseProgress } from '../course/store';
import { readEnglishLiveMemory, removeRelationshipMemory } from '../memory/store';
import { readLearnerProfile } from '../product/profile';

export function HomeScreen() {
  const profile = readLearnerProfile();
  const [, setMemoryRevision] = useState(0);

  if (!profile) {
    return (
      <section className="screen empty-home">
        <p className="eyebrow">Your speaking course starts with one short setup</p>
        <h1>Build a course around the English you actually need.</h1>
        <p className="lead">Tell us what you want English for, how speaking feels today, and who you want to learn with first.</p>
        <Link className="button primary" to="/onboarding">Set up EnglishLive</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(profile.characterId);
  const relationshipMemory = readEnglishLiveMemory();
  const courseProgress = readCourseProgress();
  const nextLessonId = getNextCourseLessonId(B1_UNIT_1_LESSONS.map((lesson) => lesson.id), courseProgress);
  const nextLesson = B1_UNIT_1_LESSONS.find((lesson) => lesson.id === nextLessonId) ?? B1_UNIT_1_LESSONS.at(-1)!;
  const completedCount = B1_UNIT_1_LESSONS.filter((lesson) => courseProgress.lessonProgress[lesson.id]?.completedAt).length;
  const unitComplete = completedCount === B1_UNIT_1_LESSONS.length;
  const partnerNotes = relationshipMemory.relationshipNotes.filter((note) => note.characterId === character.id).slice(-3);
  const greeting = profile.firstName ? `Ready, ${profile.firstName}?` : 'Ready to learn?';

  function forgetNote(noteId: string) {
    removeRelationshipMemory(noteId);
    setMemoryRevision((value) => value + 1);
  }

  return (
    <section className="screen product-home course-home">
      <div className="home-heading">
        <p className="eyebrow">Your EnglishLive course</p>
        <h1>{greeting}</h1>
        <p className="lead">Follow a real lesson path with a live teacher, authored boards and spoken practice — or jump into Free Speak whenever you just want to talk.</p>
      </div>

      <article className="next-conversation course-next-lesson">
        <div className="next-copy">
          <span className="session-meta">B1 · Unit 1 · {unitComplete ? 'Unit complete' : `Lesson ${nextLesson.order} of ${B1_UNIT_1_LESSONS.length}`}</span>
          <h2>{unitComplete ? B1_UNIT_1.title : nextLesson.title}</h2>
          <p>{unitComplete ? 'You completed every authored lesson in Unit 1. Replay the challenge or use Free Speak while the next unit is authored.' : nextLesson.subtitle}</p>
          <div className="actions">
            <Link className="button primary" to={`/lesson/${nextLesson.id}?character=${character.id}`}>
              {unitComplete ? 'Replay the challenge' : courseProgress.lessonProgress[nextLesson.id] ? 'Continue lesson' : 'Start lesson'}
            </Link>
            <Link className="button quiet" to="/learn">Open Unit 1</Link>
            <Link className="text-link" to="/characters">Change teacher →</Link>
          </div>
        </div>
        <div className="next-character" style={{ '--character-accent': character.accent } as CSSProperties}>
          <CharacterPortrait character={character} />
          <div><strong>{character.name}</strong><span>{character.tagline}</span></div>
        </div>
      </article>

      <section className="home-dual-path">
        <article className="home-mode-card learn-mode-card">
          <p className="eyebrow">Learn</p>
          <h2>{completedCount}/{B1_UNIT_1_LESSONS.length} lessons complete</h2>
          <p>{B1_UNIT_1.promise}</p>
          <div className="home-course-dots" aria-label={`${completedCount} of ${B1_UNIT_1_LESSONS.length} lessons completed`}>
            {B1_UNIT_1_LESSONS.map((lesson) => <span key={lesson.id} className={courseProgress.lessonProgress[lesson.id]?.completedAt ? 'is-complete' : lesson.id === nextLessonId ? 'is-current' : ''} />)}
          </div>
          <Link className="text-link" to="/learn">Go to Learn →</Link>
        </article>

        <article className="home-mode-card speak-mode-card">
          <p className="eyebrow">Free Speak</p>
          <h2>Talk about whatever you need today.</h2>
          <p>Chat, work, travel or interview practice with {character.name}. Free Speak stays outside course completion.</p>
          <Link className="button quiet" to="/speak">Start Free Speak</Link>
        </article>
      </section>

      <section className="path-section">
        <div className="path-heading">
          <p className="eyebrow">How Learn works</p>
          <h2>A course delivered by a live teacher.</h2>
        </div>
        <div className="path-list">
          <article><span>01</span><div><strong>Short teaching.</strong><p>{character.name} introduces one useful speaking idea naturally instead of reading a page of theory.</p></div></article>
          <article><span>02</span><div><strong>Board + spoken questions.</strong><p>The board appears only when it helps. You answer out loud and the application owns lesson progression.</p></div></article>
          <article><span>03</span><div><strong>Real conversation challenge.</strong><p>Each unit ends by combining the lesson skills inside one fresh live conversation.</p></div></article>
        </div>
      </section>

      {partnerNotes.length ? (
        <section className="path-section">
          <div className="path-heading">
            <p className="eyebrow">Continuity with {character.name}</p>
            <h2>Only the personal notes you chose to keep.</h2>
            <p className="lead">These stay separate from course evidence and belong to this conversation partner only.</p>
          </div>
          <div className="path-list">
            {partnerNotes.map((note) => (
              <article key={note.id}>
                <span>↗</span>
                <div><strong>{character.name} can follow up on this</strong><p>{note.text}</p><button type="button" className="button quiet" onClick={() => forgetNote(note.id)}>Forget this</button></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
