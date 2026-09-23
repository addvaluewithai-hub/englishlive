import { Link } from 'react-router-dom';
import { getCharacterDefinition } from '../character/registry';
import { buildMissionPath, planNextConversation, type MissionPathStatus } from '../curriculum/planner';
import { readEnglishLiveMemory } from '../memory/store';
import { readLearnerProfile } from '../product/profile';

const statusCopy: Record<MissionPathStatus, string> = {
  new: 'New conversation',
  seen: 'Tried — more evidence needed',
  observed: 'Evidence collected',
  revisit: 'Worth revisiting',
};

export function ProgressScreen() {
  const profile = readLearnerProfile();
  const memory = readEnglishLiveMemory();

  if (!profile) {
    return (
      <section className="screen review-empty">
        <p className="eyebrow">Your speaking path</p>
        <h1>Set up EnglishLive first.</h1>
        <p className="lead">Your path is built around the situations where you want speaking to feel easier.</p>
        <Link className="button primary" to="/onboarding">Set up EnglishLive</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(profile.characterId);
  const path = buildMissionPath(profile.goals[0], memory);
  const next = planNextConversation(profile.goals[0], memory);

  return (
    <section className="screen progress-screen">
      <div className="progress-heading">
        <p className="eyebrow">B1 conversation path</p>
        <h1>Six speaking jobs. Recycled in fresh situations.</h1>
        <p className="lead">This is not a percentage-to-B1 meter. The path makes sure you practise different kinds of connected, independent conversation and brings weak evidence back later.</p>
      </div>

      <section className="progress-next-card">
        <div>
          <span className="session-meta">Recommended next</span>
          <h2>{next.mission.title}</h2>
          <p>{next.reasonLabel}</p>
        </div>
        <Link className="button primary" to={`/session/${next.mission.id}?character=${character.id}`}>
          Talk with {character.name}
        </Link>
      </section>

      <div className="mission-path-list">
        {path.map((item) => {
          const isNext = item.mission.id === next.mission.id;
          return (
            <article className={isNext ? 'mission-path-card is-next' : 'mission-path-card'} key={item.mission.id}>
              <div className="mission-path-index">{String(item.order).padStart(2, '0')}</div>
              <div className="mission-path-copy">
                <div className="mission-path-meta">
                  <span>{item.family}</span>
                  <strong className={`mission-status status-${item.status}`}>{statusCopy[item.status]}</strong>
                </div>
                <h2>{item.mission.title}</h2>
                <p>{item.promise}</p>
                <div className="mission-path-evidence">
                  {item.observedSessions > 0 ? (
                    <span>{item.observedSessions} session observation{item.observedSessions === 1 ? '' : 's'}</span>
                  ) : item.attemptedSessions > 0 ? (
                    <span>Attempted, but not enough structured evidence yet</span>
                  ) : (
                    <span>No observation yet</span>
                  )}
                  {item.completedSessions > 0 ? <span> · completed naturally {item.completedSessions} time{item.completedSessions === 1 ? '' : 's'}</span> : null}
                </div>
              </div>
              <Link className="text-link" to={`/session/${item.mission.id}?character=${character.id}`}>
                {item.status === 'new' ? 'Start' : 'Practise again'} →
              </Link>
            </article>
          );
        })}
      </div>

      <section className="progress-principle">
        <p className="eyebrow">How progress works</p>
        <h2>Fresh evidence beats a fake score.</h2>
        <p>EnglishLive remembers which conversation capabilities were observed and which need another natural opportunity. A single successful session never becomes a claim that you “mastered B1”.</p>
      </section>
    </section>
  );
}
