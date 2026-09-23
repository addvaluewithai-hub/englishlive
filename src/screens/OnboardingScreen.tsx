import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { characterRegistry, DEFAULT_CHARACTER_ID } from '../character/registry';
import {
  goalLabel,
  learningGoals,
  readLearnerProfile,
  saveLearnerProfile,
  speakingComfortLevels,
  comfortLabel,
  type LearningGoal,
  type SpeakingComfort,
} from '../product/profile';

const goalDescriptions: Record<LearningGoal, string> = {
  work: 'Meetings, updates, clients, and everyday workplace talk.',
  interviews: 'Answer naturally instead of translating a memorized response.',
  travel: 'Handle plans, questions, and small surprises on the spot.',
  everyday: 'Feel less tense in ordinary social conversations.',
  study: 'Explain ideas and opinions out loud with more control.',
};

const comfortShort: Record<SpeakingComfort, string> = {
  freeze: 'I freeze',
  manage: 'I can manage',
  natural: 'I want to sound natural',
  challenge: 'I want a challenge',
};

export function OnboardingScreen() {
  const navigate = useNavigate();
  const existing = useMemo(() => readLearnerProfile(), []);
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(existing?.firstName ?? '');
  const [goals, setGoals] = useState<LearningGoal[]>(existing?.goals ?? []);
  const [comfort, setComfort] = useState<SpeakingComfort | null>(existing?.comfort ?? null);
  const [characterId, setCharacterId] = useState(existing?.characterId ?? DEFAULT_CHARACTER_ID);

  function toggleGoal(goal: LearningGoal) {
    setGoals((current) => {
      if (current.includes(goal)) return current.filter((value) => value !== goal);
      if (current.length >= 2) return [current[1], goal];
      return [...current, goal];
    });
  }

  function finish() {
    if (!comfort || goals.length === 0) return;
    saveLearnerProfile({
      version: 1,
      firstName: firstName.trim().slice(0, 40),
      goals,
      comfort,
      characterId,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    navigate(`/session/foundation-demo?character=${characterId}&onboarding=1`);
  }

  const canContinue = step === 0 || (step === 1 && goals.length > 0) || (step === 2 && comfort !== null);
  const selectedCharacter = characterRegistry.find((character) => character.id === characterId) ?? characterRegistry[0];

  return (
    <section className="onboarding-screen">
      <aside className="onboarding-rail">
        <div>
          <p className="eyebrow">Set up your conversations</p>
          <h1>Make speaking the easy part.</h1>
        </div>
        <div className="onboarding-progress" aria-label={`Step ${step + 1} of 4`}>
          {[0, 1, 2, 3].map((value) => (
            <span key={value} className={value <= step ? 'is-active' : ''} />
          ))}
        </div>
        <p className="rail-note">Four quick choices. Then you talk.</p>
      </aside>

      <div className="onboarding-panel">
        {step === 0 ? (
          <div className="onboarding-step">
            <span className="step-number">01</span>
            <h2>What should your partner call you?</h2>
            <p className="step-lead">Optional. We only use it to make the conversation feel less mechanical.</p>
            <label className="field-label" htmlFor="first-name">First name</label>
            <input
              id="first-name"
              className="text-field"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Your name"
              autoComplete="given-name"
              maxLength={40}
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="onboarding-step">
            <span className="step-number">02</span>
            <h2>Where do you want English to feel easier?</h2>
            <p className="step-lead">Choose one or two. This changes the situations your partner brings into conversation.</p>
            <div className="choice-list">
              {learningGoals.map((goal) => {
                const selected = goals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    className={selected ? 'choice-row is-selected' : 'choice-row'}
                    aria-pressed={selected}
                    onClick={() => toggleGoal(goal)}
                  >
                    <span className="choice-check" aria-hidden="true">{selected ? '✓' : ''}</span>
                    <span>
                      <strong>{goalLabel(goal)}</strong>
                      <small>{goalDescriptions[goal]}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="onboarding-step">
            <span className="step-number">03</span>
            <h2>How does speaking feel right now?</h2>
            <p className="step-lead">No test yet. Pick the sentence that sounds most like you.</p>
            <div className="choice-list comfort-list">
              {speakingComfortLevels.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={comfort === value ? 'choice-row is-selected' : 'choice-row'}
                  aria-pressed={comfort === value}
                  onClick={() => setComfort(value)}
                >
                  <span className="choice-kicker">{comfortShort[value]}</span>
                  <span>{comfortLabel(value)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="onboarding-step partner-step">
            <span className="step-number">04</span>
            <h2>Who do you want to talk to first?</h2>
            <p className="step-lead">You can switch any time. Personality changes the feel of the conversation, not what you are here to practise.</p>
            <div className="onboarding-character-grid">
              {characterRegistry.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  className={characterId === character.id ? 'partner-choice is-selected' : 'partner-choice'}
                  style={{ '--character-accent': character.accent } as CSSProperties}
                  aria-pressed={characterId === character.id}
                  onClick={() => setCharacterId(character.id)}
                >
                  <CharacterPortrait character={character} />
                  <span>
                    <strong>{character.name}</strong>
                    <small>{character.tagline}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="mic-note">
              <strong>Next: a short live conversation with {selectedCharacter.name}.</strong>
              <span>Microphone access is requested only when you press Start conversation.</span>
            </div>
          </div>
        ) : null}

        <div className="onboarding-actions">
          {step > 0 ? (
            <button type="button" className="button quiet" onClick={() => setStep((value) => value - 1)}>Back</button>
          ) : <span />}
          {step < 3 ? (
            <button
              type="button"
              className="button primary"
              disabled={!canContinue}
              onClick={() => canContinue && setStep((value) => value + 1)}
            >
              Continue
            </button>
          ) : (
            <button type="button" className="button primary" onClick={finish}>
              Meet {selectedCharacter.name}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
