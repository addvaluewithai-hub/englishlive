import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { characterRegistry } from '../character/registry';
import { planNextConversation } from '../curriculum/planner';
import { readEnglishLiveMemory } from '../memory/store';
import { readLearnerProfile, saveLearnerProfile } from '../product/profile';

export function CharacterSelectScreen() {
  const profile = readLearnerProfile();
  const next = planNextConversation(profile?.goals[0], readEnglishLiveMemory());

  function rememberPartner(characterId: string) {
    if (!profile) return;
    saveLearnerProfile({ ...profile, characterId });
  }

  return (
    <section className="screen partners-screen">
      <div className="partners-heading">
        <p className="eyebrow">Conversation partners</p>
        <h1>Pick the energy you want in the room.</h1>
        <p className="lead">Your curriculum state stays the same. The person you practise with changes the feel of the exchange, not which evidence counts.</p>
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
                to={`/session/${next.mission.id}?character=${character.id}`}
                onClick={() => rememberPartner(character.id)}
              >
                Continue with {character.name} →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
