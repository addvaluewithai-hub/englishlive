import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { characterRegistry } from '../character/registry';

export function CharacterSelectScreen() {
  return (
    <section className="screen">
      <p className="eyebrow">Choose your conversation partner</p>
      <h1>Pick the person you want to talk to.</h1>
      <p className="lead">
        The visual renderer is separate from the tutor and curriculum. These four
        adult characters all use the same SVG character contract today, and we can
        add other renderers later without changing the learning runtime.
      </p>
      <div className="character-grid">
        {characterRegistry.map((character) => (
          <article
            className="character-card"
            key={character.id}
            style={{ '--character-accent': character.accent } as React.CSSProperties}
          >
            <CharacterPortrait character={character} />
            <h2>{character.name}</h2>
            <strong className="character-tagline">{character.tagline}</strong>
            <p>{character.description}</p>
            <Link
              className="text-link"
              to={`/session/foundation-demo?character=${character.id}`}
            >
              Talk with {character.name} →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
