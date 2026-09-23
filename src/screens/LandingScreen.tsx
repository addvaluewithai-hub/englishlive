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
          <p className="eyebrow">A structured English speaking course, taught live</p>
          <h1>Learn English by actually speaking it.</h1>
          <p className="landing-lead">
            Follow Units and Lessons with a real-time AI teacher on screen. The teacher explains, uses a board when useful,
            asks you questions, listens to your answer, and turns each lesson into live spoken practice.
          </p>
          <div className="actions">
            <Link className="button primary" to={profile ? '/home' : '/onboarding'}>
              {profile ? 'Continue my course' : 'Start Unit 1'}
            </Link>
            <a className="button quiet" href="#how-it-works">See how it works</a>
          </div>
          <p className="hero-note">Starting with B1 speaking: structured lessons for people who already understand more English than they comfortably say.</p>
        </div>

        <div className="landing-character" style={{ '--character-accent': featured.accent } as CSSProperties}>
          <div className="landing-character-frame">
            <CharacterPortrait character={featured} />
          </div>
          <div className="landing-quote">
            <span className="quote-speaker">{featured.name}</span>
            <strong>“Let’s make that story easier to follow.”</strong>
            <span>Live teaching. Then you speak.</span>
          </div>
        </div>
      </section>

      <section className="landing-band" aria-label="Product promise">
        <p>Units you can follow.</p>
        <p>A teacher you can interrupt.</p>
        <p>Free Speak when you just want to talk.</p>
      </section>

      <section className="landing-section" id="how-it-works">
        <div className="section-kicker">The course happens through conversation</div>
        <div className="landing-section-grid">
          <h2>Structure like a course. Delivery like a private live teacher.</h2>
          <div className="process-list">
            <article>
              <span>01</span>
              <div>
                <h3>Follow Units and Lessons.</h3>
                <p>Your path is authored by the product. The model does not randomly decide what you should learn next.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Learn with a character on screen and a real board.</h3>
                <p>Your teacher explains one idea, shows short visual support, then gets you speaking instead of reading a page of theory.</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Finish with a live conversation challenge.</h3>
                <p>Each Unit combines the lesson skills inside a fresh conversation. No fake fluency percentage and no scripted learner answer.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-statement">
        <p className="eyebrow">Learn when you want structure. Speak when you want freedom.</p>
        <h2>Your course moves forward through authored live lessons. Free Speak stays open beside it whenever you just need a real conversation.</h2>
        <Link className="text-link" to={profile ? '/home' : '/onboarding'}>
          {profile ? 'Open EnglishLive' : 'Meet your live teacher'} →
        </Link>
      </section>
    </div>
  );
}
