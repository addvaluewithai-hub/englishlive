import { useMemo, useState, type CSSProperties } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { getCharacterDefinition } from '../character/registry';
import { planNextConversation } from '../curriculum/planner';
import { keepRelationshipMemory, readEnglishLiveMemory } from '../memory/store';
import type { RelationshipMemoryProposal } from '../memory/types';
import { readLearnerProfile } from '../product/profile';

interface ReviewNavigationState {
  relationshipProposal?: RelationshipMemoryProposal;
}

export function ReviewScreen() {
  const { sessionId = '' } = useParams();
  const location = useLocation();
  const profile = readLearnerProfile();
  const [memory, setMemory] = useState(() => readEnglishLiveMemory());
  const [proposal, setProposal] = useState<RelationshipMemoryProposal | null>(
    () => (location.state as ReviewNavigationState | null)?.relationshipProposal ?? null,
  );
  const session = memory.recentSessions.find((item) => item.sessionId === sessionId);

  const next = useMemo(
    () => planNextConversation(profile?.goals[0], memory),
    [memory, profile?.goals],
  );

  if (!session) {
    return (
      <section className="screen review-screen review-empty">
        <p className="eyebrow">Session review</p>
        <h1>This conversation is no longer in recent local history.</h1>
        <p className="lead">EnglishLive keeps a small recent session window, not a permanent transcript archive.</p>
        <Link className="button primary" to="/home">Back to my plan</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(session.characterId);
  const observations = session.observations ?? [];
  const met = observations.filter((item) => item.outcome === 'met');
  const attempted = observations.filter((item) => item.outcome === 'attempted');

  function keepProposal() {
    if (!proposal) return;
    keepRelationshipMemory(proposal, session.missionId, character.id);
    setProposal(null);
    setMemory(readEnglishLiveMemory());
  }

  return (
    <section className="screen review-screen">
      <div className="review-hero">
        <div className="review-copy">
          <p className="eyebrow">Conversation review</p>
          <h1>{session.completed ? 'You finished the conversation.' : 'You gave us something useful to work with.'}</h1>
          <p className="lead">
            This is a short evidence review, not a level score. One good conversation is one observation; skills earn confidence by showing up again in fresh situations.
          </p>
        </div>
        <div className="review-character" style={{ '--character-accent': character.accent } as CSSProperties}>
          <CharacterPortrait character={character} />
          <div><strong>{character.name}</strong><span>{session.missionTitle}</span></div>
        </div>
      </div>

      <div className="review-grid">
        <section className="review-panel">
          <p className="eyebrow">Observed today</p>
          <h2>{met.length ? 'What came through clearly' : 'No completed evidence yet'}</h2>
          {met.length ? (
            <div className="review-observation-list">
              {met.map((item) => (
                <article key={item.objectiveId}>
                  <span className="review-mark">✓</span>
                  <div><strong>{item.title}</strong><p>You met the authored conversation evidence for this speaking job today.</p></div>
                </article>
              ))}
            </div>
          ) : (
            <p className="review-muted">The session did not collect enough structured evidence to call any objective met. That is not a failure score; the planner can create another natural chance later.</p>
          )}
        </section>

        <section className="review-panel">
          <p className="eyebrow">Worth another look</p>
          <h2>{attempted.length ? 'Keep these in circulation' : 'Nothing was marked incomplete'}</h2>
          {attempted.length ? (
            <div className="review-observation-list">
              {attempted.map((item) => (
                <article key={item.objectiveId}>
                  <span className="review-mark">↻</span>
                  <div><strong>{item.title}</strong><p>You attempted this speaking job. EnglishLive can bring it back in a different conversation instead of drilling the same prompt.</p></div>
                </article>
              ))}
            </div>
          ) : (
            <p className="review-muted">No structured objective from this session is currently asking for a recycle.</p>
          )}
        </section>
      </div>

      {proposal ? (
        <section className="memory-review-card">
          <p className="eyebrow">Optional continuity</p>
          <h2>Should {character.name} remember this for next time?</h2>
          <p>{proposal.text}</p>
          <div className="actions">
            <button type="button" className="button primary" onClick={keepProposal}>Keep with {character.name}</button>
            <button type="button" className="button quiet" onClick={() => setProposal(null)}>Not now</button>
          </div>
          <small>This is separate from learning evidence. It is not saved unless you choose Keep.</small>
        </section>
      ) : null}

      <section className="review-next">
        <div>
          <p className="eyebrow">Next conversation</p>
          <h2>{next.mission.title}</h2>
          <p>{next.reasonLabel}</p>
        </div>
        <div className="actions">
          <Link className="button primary" to={`/session/${next.mission.id}?character=${character.id}`}>Talk with {character.name}</Link>
          <Link className="button quiet" to="/progress">See my path</Link>
          <Link className="text-link" to="/home">Home →</Link>
        </div>
      </section>
    </section>
  );
}
