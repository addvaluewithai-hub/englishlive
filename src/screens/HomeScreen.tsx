import { Link } from 'react-router-dom';

export function HomeScreen() {
  return (
    <section className="screen home-screen">
      <p className="eyebrow">B1 → B2 conversation</p>
      <h1>Speak English like you actually use it.</h1>
      <p className="lead">
        EnglishLive is being built around live character conversations, hidden curriculum goals,
        and memory that makes the next session feel continuous.
      </p>
      <div className="actions">
        <Link className="button primary" to="/characters">Choose a character</Link>
        <Link className="button secondary" to="/session/foundation-demo">Open session shell</Link>
      </div>
      <div className="foundation-grid" aria-label="Foundation status">
        <article><strong>Web</strong><span>React + Vite shell</span></article>
        <article><strong>Native</strong><span>Capacitor-ready</span></article>
        <article><strong>API</strong><span>Cloudflare boundary</span></article>
      </div>
    </section>
  );
}
