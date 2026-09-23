import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CharacterHost,
  type CharacterHostHandle,
} from '../character/CharacterHost';
import { getCharacterDefinition } from '../character/registry';
import {
  characterEmotions,
  characterGestures,
  type CharacterEmotion,
  type CharacterGesture,
  type MouthPose,
} from '../character/types';

const speechPreview: readonly MouthPose[] = [
  { viseme: 'AA', energy: 0.6, open: 0.85, width: 0.58 },
  { viseme: 'EE', energy: 0.52, open: 0.3, width: 0.9 },
  { viseme: 'MBP', energy: 0.2, open: 0.02, width: 0.45 },
  { viseme: 'OH', energy: 0.62, open: 0.72, round: 0.86 },
  { viseme: 'L', energy: 0.5, open: 0.5, width: 0.55 },
  { viseme: 'S', energy: 0.45, open: 0.15, width: 0.82 },
];

export function SessionScreen() {
  const { missionId = 'foundation-demo' } = useParams();
  const [params] = useSearchParams();
  const character = getCharacterDefinition(params.get('character'));
  const host = useRef<CharacterHostHandle | null>(null);
  const [emotion, setEmotion] = useState<CharacterEmotion>('happy');
  const [speakingPreview, setSpeakingPreview] = useState(false);

  useEffect(() => {
    host.current?.setEmotion(emotion, 0.75);
  }, [emotion, character.id]);

  useEffect(() => {
    if (!speakingPreview) {
      host.current?.setMode('idle');
      host.current?.setMouth(null);
      return;
    }

    host.current?.setMode('speaking');
    let index = 0;
    host.current?.setMouth(speechPreview[index]);
    const timer = window.setInterval(() => {
      index = (index + 1) % speechPreview.length;
      host.current?.setMouth(speechPreview[index]);
    }, 135);

    return () => {
      window.clearInterval(timer);
      host.current?.setMouth(null);
      host.current?.setMode('idle');
    };
  }, [speakingPreview, character.id]);

  function perform(gesture: CharacterGesture) {
    host.current?.setGesture(gesture, 2.4);
  }

  return (
    <section className="screen session-shell character-runtime-demo">
      <div
        className="character-hero-stage"
        style={{ '--character-accent': character.accent } as React.CSSProperties}
      >
        <div className="stage-glow" aria-hidden="true" />
        <CharacterHost ref={host} character={character} />
        <div className="character-identity">
          <strong>{character.name}</strong>
          <span>{speakingPreview ? 'speaking preview' : 'ready to talk'}</span>
        </div>
      </div>

      <aside className="character-lab-card">
        <p className="eyebrow">Milestone 2 · runtime check</p>
        <h2>{character.name}</h2>
        <p>{character.tagline}</p>

        <fieldset>
          <legend>Expression</legend>
          <div className="control-chips">
            {characterEmotions.map((value) => (
              <button
                type="button"
                key={value}
                className={emotion === value ? 'control-chip is-active' : 'control-chip'}
                onClick={() => setEmotion(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Gesture</legend>
          <div className="control-chips">
            {characterGestures.filter((value) => value !== 'none').map((value) => (
              <button
                type="button"
                key={value}
                className="control-chip"
                onClick={() => perform(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          className={speakingPreview ? 'button primary' : 'button secondary'}
          onClick={() => setSpeakingPreview((value) => !value)}
        >
          {speakingPreview ? 'Stop mouth preview' : 'Preview speech motion'}
        </button>

        <small className="runtime-note">
          Mission: {missionId}. This preview is local and silent; Gemini Live audio
          drives these same renderer methods in Milestone 3.
        </small>
      </aside>
    </section>
  );
}
