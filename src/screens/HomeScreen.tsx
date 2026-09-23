import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { getCharacterDefinition } from '../character/registry';
import { buildMissionPath, planNextConversation } from '../curriculum/planner';
import { readEnglishLiveMemory, removeRelationshipMemory } from '../memory/store';
import { readLearnerProfile } from '../product/profile';

export function HomeScreen() {
  const profile = readLearnerProfile();
  const [, setMemoryRevision] = useState(0);

  if (!profile) {
    return (
      <section className="screen empty-home">
        <p className="eyebrow">Your speaking practice starts with one short setup</p>
        <h1>Build a plan around the conversations you actually need.</h1>
        <p className="lead">Tell us what you want English for, how speaking feels today, and who you want to practise with first.</p>
        <Link className="button primary" to="/onboarding">Set up EnglishLive</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(profile.characterId);
  const memory = readEnglishLiveMemory();
  const next = planNextConversation(profile.goals[0], memory);
  const path = buildMissionPath(profile.goals[0], memory);
  const observedCount = path.filter((item) => item.observedSessions > 0).length;
  const revisitCount = path.filter((item) => item.status === 'revisit').length;
  const partnerNotes = memory.relationshipNotes
    .filter((note) => note.characterId === character.id)
    .slice(-3);
  const greeting = profile.firstName ? `Ready, ${profile.firstName}?` : 'Ready to speak?';

  function forgetNote(noteId: string) {
    removeRelationshipMemory(noteId);
    setMemoryRevision((value) => value + 1);
  }

  return (
    <section className="screen product-home">
      <div className="home-heading">
        <p className="eyebrow">Your next conversation</p>
        <h1>{greeting}</h1>
        <p className="lead">You do not need to prepare. EnglishLive picks a speaking job, listens for usable evidence, and brings skills back later in a fresh situation.</p>
      </div>

      <article className="next-conversation">
        <div className="next-copy">
          <span className="session-meta">B1 path · {next.reason === 'recycle' ? 'fresh recycle' : `conversation ${next.pathIndex + 1} of ${path.length}`}</span>
          <h2>{next.mission.title}</h2>
          <p>{next.mission.purpose}</p>
          <p className="planner-reason">{next.reasonLabel}</p>
          <div className="actions">
            <Link className="button primary" to={`/session/${next.mission.id}?character=${character.id}`}>Talk with {character.name}</Link>
            <Link className="button quiet" to="/progress">See my path</Link>
            <Link className="text-link" to="/characters">Change partner →</Link>
          </div>
        </div>
        <div className="next-character" style={{ '--character-accent': character.accent } as CSSProperties}>
          <CharacterPortrait character={character} />
          <div>
            <strong>{character.name}</strong>
            <span>{character.tagline}</span>
          </div>
        </div>
      </article>

      <section className="home-path-summary">
        <div>
          <p className="eyebrow">B1 conversation path</p>
          <h2>{observedCount} of {path.length} speaking jobs have session evidence.</h2>
          <p>That is coverage, not a level percentage. {revisitCount ? `${revisitCount} speaking job${revisitCount === 1 ? '' : 's'} currently deserve another natural observation.` : 'Nothing is currently flagged for an immediate revisit.'}</p>
        </div>
        <div className="home-path-dots" aria-label={`${observedCount} of ${path.length} conversation jobs observed`}>
          {path.map((item) => (
            <span
              key={item.mission.id}
              className={`path-dot status-${item.status}${item.mission.id === next.mission.id ? ' is-next' : ''}`}
              title={`${item.family}: ${item.status}`}
            />
          ))}
        </div>
        <Link className="text-link" to="/progress">Open the full path →</Link>
      </section>

      <section className="path-section">
        <div className="path-heading">
          <p className="eyebrow">What this path covers</p>
          <h2>Different speaking jobs, not chapter numbers.</h2>
        </div>
        <div className="path-list">
          <article>
            <span>01</span>
            <div><strong>Connected language.</strong><p>Tell a story, explain something, compare options, and make your reasoning easy to follow.</p></div>
          </article>
          <article>
            <span>02</span>
            <div><strong>Two-way interaction.</strong><p>React, ask back, clarify, handle follow-ups, and keep shared meaning moving.</p></div>
          </article>
          <article>
            <span>03</span>
            <div><strong>Familiar independence.</strong><p>Handle ordinary work, travel, study, and everyday situations without relying on a memorized script.</p></div>
          </article>
        </div>
      </section>

      {partnerNotes.length ? (
        <section className="path-section">
          <div className="path-heading">
            <p className="eyebrow">Continuity with {character.name}</p>
            <h2>Only the personal notes you chose to keep.</h2>
            <p className="lead">These are separate from learning evidence and belong to this conversation partner only.</p>
          </div>
          <div className="path-list">
            {partnerNotes.map((note) => (
              <article key={note.id}>
                <span>↗</span>
                <div>
                  <strong>{character.name} can follow up on this</strong>
                  <p>{note.text}</p>
                  <button type="button" className="button quiet" onClick={() => forgetNote(note.id)}>Forget this</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
