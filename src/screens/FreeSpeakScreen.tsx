import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { getCharacterDefinition } from '../character/registry';
import { FREE_SPEAK_MODES } from '../freeSpeak/modes';
import { readLearnerProfile } from '../product/profile';

export function FreeSpeakScreen() {
  const profile = readLearnerProfile();

  if (!profile) {
    return (
      <section className="screen course-empty">
        <p className="eyebrow">Free Speak</p>
        <h1>Set up EnglishLive first.</h1>
        <p className="lead">Pick your conversation partner and speaking goal, then you can jump into free conversation any time.</p>
        <Link className="button primary" to="/onboarding">Set up EnglishLive</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(profile.characterId);

  return (
    <section className="screen free-speak-screen">
      <header className="free-speak-heading">
        <div>
          <p className="eyebrow">Free Speak</p>
          <h1>Talk without changing your course path.</h1>
          <p className="lead">Use English freely with {character.name}. Free Speak can remember only the personal continuity you explicitly approve; it does not complete lessons or move Unit progress.</p>
        </div>
        <div className="free-speak-partner">
          <CharacterPortrait character={character} />
          <div><strong>{character.name}</strong><span>{character.tagline}</span><Link className="text-link" to="/characters">Change partner →</Link></div>
        </div>
      </header>

      <div className="free-speak-grid">
        {FREE_SPEAK_MODES.map((mode, index) => (
          <article className="free-speak-card" key={mode.id}>
            <span className="free-speak-index">0{index + 1}</span>
            <h2>{mode.title}</h2>
            <p>{mode.description}</p>
            <Link className="button quiet" to={`/speak/${mode.id}?character=${character.id}`}>Start with {character.name}</Link>
          </article>
        ))}
      </div>

      <section className="free-speak-boundary">
        <p className="eyebrow">Course boundary</p>
        <h2>Free conversation is practice, not lesson completion.</h2>
        <p>We may use the conversation to make the experience feel more natural, but only authored Learn lessons move your course path. That keeps progress meaningful instead of letting an open-ended chat accidentally “pass” a lesson.</p>
      </section>
    </section>
  );
}
