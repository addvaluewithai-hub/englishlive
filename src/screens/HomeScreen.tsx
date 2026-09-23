import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { getCharacterDefinition } from '../character/registry';
import { nextConversationForGoal, readLearnerProfile } from '../product/profile';

export function HomeScreen() {
  const profile = readLearnerProfile();

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
  const next = nextConversationForGoal(profile.goals[0]);
  const greeting = profile.firstName ? `Ready, ${profile.firstName}?` : 'Ready to speak?';

  return (
    <section className="screen product-home">
      <div className="home-heading">
        <p className="eyebrow">Your next conversation</p>
        <h1>{greeting}</h1>
        <p className="lead">You do not need to prepare. The point is to start talking before the perfect sentence arrives.</p>
      </div>

      <article className="next-conversation">
        <div className="next-copy">
          <span className="session-meta">8 min · warm-up conversation</span>
          <h2>{next.title}</h2>
          <p>{next.description}</p>
          <div className="actions">
            <Link className="button primary" to={`/session/foundation-demo?character=${character.id}`}>Talk with {character.name}</Link>
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
            <div><strong>Keep talking when a word disappears.</strong><p>Clarify, rephrase, and repair instead of giving up the turn.</p></div>
          </article>
          <article>
            <span>02</span>
            <div><strong>Make longer answers feel organized.</strong><p>Tell stories, give reasons, and connect one idea to the next.</p></div>
          </article>
          <article>
            <span>03</span>
            <div><strong>Sound like a person, not a worksheet.</strong><p>Ask back, react naturally, disagree politely, and handle interruptions.</p></div>
          </article>
        </div>
      </section>
    </section>
  );
}
