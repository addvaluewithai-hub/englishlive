import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { getCharacterDefinition } from '../character/registry';
import { readLearnerProfile } from '../product/profile';

export function LandingScreen() {
  const profile = readLearnerProfile();
  const featured = getCharacterDefinition('reem');

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Conversation practice for people who already know English</p>
          <h1>Stop studying English. Start using it.</h1>
          <p className="landing-lead">
            Talk with a real-time conversation partner who keeps you speaking, follows your pace,
            and turns the awkward part of English into something you do every day.
          </p>
          <div className="actions">
            <Link className="button primary" to={profile ? '/home' : '/onboarding'}>
              {profile ? 'Continue speaking' : 'Start speaking'}
            </Link>
            <a className="button quiet" href="#how-it-works">See how it works</a>
          </div>
          <p className="hero-note">Built first for B1–B2 speakers who understand more than they comfortably say.</p>
        </div>

        <div className="landing-character" style={{ '--character-accent': featured.accent } as CSSProperties}>
          <div className="landing-character-frame">
            <CharacterPortrait character={featured} />
          </div>
          <div className="landing-quote">
            <span className="quote-speaker">{featured.name}</span>
            <strong>“So — what happened next?”</strong>
            <span>No script. Just keep going.</span>
          </div>
        </div>
      </section>

      <section className="landing-band" aria-label="Product promise">
        <p>For meetings.</p>
        <p>For travel.</p>
        <p>For the moment your mind goes blank.</p>
      </section>

      <section className="landing-section" id="how-it-works">
        <div className="section-kicker">The conversation is the lesson</div>
        <div className="landing-section-grid">
          <h2>You do not need another pile of exercises.</h2>
          <div className="process-list">
            <article>
              <span>01</span>
              <div>
                <h3>Choose someone you actually want to talk to.</h3>
                <p>Different personalities, same goal: keep you speaking.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Talk before you feel ready.</h3>
                <p>The partner adapts the exchange so you keep producing English instead of waiting for the perfect sentence.</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Build the skills that make conversation easier.</h3>
                <p>Storytelling, clarification, opinions, follow-ups, repair, and the language that supports them.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-statement">
        <p className="eyebrow">No blank chatbot. No classroom theatre.</p>
        <h2>Just a person on screen, a reason to talk, and enough structure underneath to move you forward.</h2>
        <Link className="text-link" to={profile ? '/home' : '/onboarding'}>
          {profile ? 'Open EnglishLive' : 'Meet your conversation partner'} →
        </Link>
      </section>
    </div>
  );
}
