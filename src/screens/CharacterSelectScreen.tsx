import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { characterRegistry } from '../character/registry';
import { readLearnerProfile, saveLearnerProfile } from '../product/profile';

export function CharacterSelectScreen() {
  const profile = readLearnerProfile();

  function rememberPartner(characterId: string) {
    if (!profile) return;
    saveLearnerProfile({ ...profile, characterId });
  }

  return (
    <section className="screen partners-screen">
      <div className="partners-heading">
        <p className="eyebrow">Live teachers</p>
        <h1>Pick the person you want to learn and speak with.</h1>
        <p className="lead">Your Unit, Lesson and authored evidence stay exactly where they are. Changing teacher changes the relationship and delivery style, not the course truth.</p>
      </div>

      <div className="character-grid">
        {characterRegistry.map((character, index) => (
          <article
            className="character-card"
            key={character.id}
            style={{ '--character-accent': character.accent } as CSSProperties}
          >
            <div className="character-card-index">0{index + 1}</div>
            <CharacterPortrait character={character} />
            <div className="character-card-copy">
              <h2>{character.name}</h2>
              <strong className="character-tagline">{character.tagline}</strong>
              <p>{character.description}</p>
              <Link
                className="text-link"
                to="/home"
                onClick={() => rememberPartner(character.id)}
              >
                Choose {character.name} →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
