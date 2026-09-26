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
          <p className="eyebrow">🐙 Englotti · A structured English course, taught live</p>
          <h1>Learn English by actually speaking it.</h1>
          <p className="landing-lead">
            Follow Levels, Units and Lessons with a real-time AI teacher on screen. The teacher explains, uses a board when useful,
            asks you questions, listens to your answer, and turns each lesson into live spoken practice.
          </p>
          <div className="actions">
            <Link className="button primary" to={profile ? '/home' : '/onboarding'}>
              {profile ? 'Continue my course' : 'Start A1'}
            </Link>
            <a className="button quiet" href="#how-it-works">See how it works</a>
          </div>
          <p className="hero-note">Starting from A1 with small live lessons: explain one thing, use it immediately, then build it into conversation.</p>
        </div>

        <div className="landing-character" style={{ '--character-accent': featured.accent } as CSSProperties}>
          <div className="landing-character-frame">
            <CharacterPortrait character={featured} />
          </div>
          <div className="landing-quote">
            <span className="quote-speaker">{featured.name}</span>
            <strong>“هنمشي خطوة خطوة، وبعدها هتستخدمها بنفسك.”</strong>
            <span>Live teaching. Then you speak.</span>
          </div>
        </div>
      </section>

      <section className="landing-band" aria-label="Product promise">
        <p>Levels and Units you can follow.</p>
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
                <h3>Follow Levels, Units and Lessons.</h3>
                <p>Your path is authored by the product. The model does not randomly decide what you should learn next.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Learn one small thing, then use it.</h3>
                <p>Your teacher explains a tiny scene, shows visual support, and gets you speaking instead of reading a page of theory.</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Build the pieces into real conversation.</h3>
                <p>Later scenes combine what you just learned inside a fresh exchange, with help only when you need it.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-statement">
        <p className="eyebrow">Learn when you want structure. Speak when you want freedom.</p>
        <h2>Your course moves forward through authored live lessons. Free Speak stays open beside it whenever you just need a real conversation.</h2>
        <Link className="text-link" to={profile ? '/home' : '/onboarding'}>
          {profile ? 'Open Englotti' : 'Meet your live teacher'} →
        </Link>
      </section>
    </div>
  );
}
