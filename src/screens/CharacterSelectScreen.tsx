import { Link } from 'react-router-dom';

const placeholders = [
  { id: 'benny', name: 'Benny', note: 'Rive character integration comes in Milestone 2.' },
  { id: 'kiro', name: 'Kiro', note: 'Character runtime is intentionally not coupled to this screen yet.' },
  { id: 'dino', name: 'Dino', note: 'The product shell already treats characters as selectable data.' },
];

export function CharacterSelectScreen() {
  return (
    <section className="screen">
      <p className="eyebrow">Character layer</p>
      <h1>Choose who you want to talk to.</h1>
      <p className="lead">These are placeholders only. Milestone 2 replaces them with the renderer-abstracted Rive CharacterHost.</p>
      <div className="character-grid">
        {placeholders.map((character) => (
          <article className="character-card" key={character.id}>
            <div className="character-placeholder" aria-hidden="true">{character.name.slice(0, 1)}</div>
            <h2>{character.name}</h2>
            <p>{character.note}</p>
            <Link className="text-link" to={`/session/foundation-demo?character=${character.id}`}>Continue →</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
