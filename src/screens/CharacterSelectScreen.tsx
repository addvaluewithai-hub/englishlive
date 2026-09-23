import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { characterRegistry } from '../character/registry';
import { FIRST_B1_MISSION_ID } from '../curriculum/catalog';
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
        <p className="eyebrow">Conversation partners</p>
        <h1>Pick the energy you want in the room.</h1>
        <p className="lead">Your goal stays the same. The person you practise with changes how direct, playful, patient, or challenging the conversation feels.</p>
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
                to={`/session/${FIRST_B1_MISSION_ID}?character=${character.id}`}
                onClick={() => rememberPartner(character.id)}
              >
                Talk with {character.name} →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
