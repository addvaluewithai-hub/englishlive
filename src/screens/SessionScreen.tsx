import { useParams, useSearchParams } from 'react-router-dom';

export function SessionScreen() {
  const { missionId = 'foundation-demo' } = useParams();
  const [params] = useSearchParams();
  const character = params.get('character') ?? 'not-selected';

  return (
    <section className="screen session-shell">
      <div className="session-hero-placeholder" aria-label="Future live character stage">
        <div className="orb" />
        <strong>CharacterHost mounts here</strong>
        <span>Hero mode is the default stage state.</span>
      </div>
      <aside className="session-debug-card">
        <small>Foundation route</small>
        <strong>{missionId}</strong>
        <span>character: {character}</span>
        <p>Milestones 2–3 replace this shell with the Rive character runtime and Gemini Live transport.</p>
      </aside>
    </section>
  );
}
