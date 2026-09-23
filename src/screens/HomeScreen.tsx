import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { getCharacterDefinition } from '../character/registry';
import { FIRST_B1_MISSION_ID, resolveConversationMission } from '../curriculum/catalog';
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
  const next = resolveConversationMission(FIRST_B1_MISSION_ID, profile.goals[0]);
  const memory = readEnglishLiveMemory();
  const recentCapabilities = Object.values(memory.capabilities)
    .sort((left, right) => right.lastPractisedAt.localeCompare(left.lastPractisedAt))
    .slice(0, 3);
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
        <p className="lead">You do not need to prepare. The point is to start talking before the perfect sentence arrives.</p>
      </div>

      <article className="next-conversation">
        <div className="next-copy">
          <span className="session-meta">B1 · connected conversation</span>
          <h2>{next.title}</h2>
          <p>{next.purpose}</p>
          <div className="actions">
            <Link className="button primary" to={`/session/${FIRST_B1_MISSION_ID}?character=${character.id}`}>Talk with {character.name}</Link>
            <Link className="button quiet" to="/characters">Change partner</Link>
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

      <section className="path-section">
        <div className="path-heading">
          <p className="eyebrow">What we will practise</p>
          <h2>Conversation skills, not chapter numbers.</h2>
        </div>
        <div className="path-list">
          <article>
            <span>01</span>
            <div><strong>Make the situation easy to follow.</strong><p>Give enough context, then connect what happened without needing a memorized script.</p></div>
          </article>
          <article>
            <span>02</span>
            <div><strong>Explain why it mattered.</strong><p>Add a reason, reaction, or consequence instead of only listing events.</p></div>
          </article>
          <article>
            <span>03</span>
            <div><strong>Handle the question you did not prepare for.</strong><p>Clarify, rephrase, and keep the exchange moving when the conversation changes direction.</p></div>
          </article>
        </div>
      </section>

      {recentCapabilities.length || memory.relationshipNotes.length ? (
        <section className="path-section">
          <div className="path-heading">
            <p className="eyebrow">What carries forward</p>
            <h2>Memory without a fake score.</h2>
            <p className="lead">EnglishLive keeps structured practice observations. Optional personal continuity is saved only after you approve it.</p>
          </div>
          <div className="path-list">
            {recentCapabilities.map((capability, index) => (
              <article key={capability.capabilityId}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{capability.recycleSuggested ? 'Worth another natural try' : 'Seen successfully in practice'}</strong>
                  <p>{capability.successfulSessions} successful session observation{capability.successfulSessions === 1 ? '' : 's'} across {capability.attemptedSessions} attempt{capability.attemptedSessions === 1 ? '' : 's'}. This is evidence, not a mastery score.</p>
                </div>
              </article>
            ))}
            {memory.relationshipNotes.slice(-3).map((note) => (
              <article key={note.id}>
                <span>↗</span>
                <div>
                  <strong>Remembered for conversation</strong>
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
