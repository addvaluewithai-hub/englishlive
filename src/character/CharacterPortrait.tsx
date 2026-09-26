import { useEffect, useId, useRef, useState } from 'react';
import { renderOttiSvg, type OttiPortraitPose } from './otti/OttiArt';
import { loadCharacterEngine, recipeForCharacter } from './svg-engine/CharacterEngineLoader';
import type { CharacterDefinition, RecipeCharacterRendererConfig } from './types';

function RecipePortrait({
  character,
  config,
  className,
  prefix,
}: {
  character: CharacterDefinition;
  config: RecipeCharacterRendererConfig;
  className: string;
  prefix: string;
}) {
  const [svg, setSvg] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadCharacterEngine()
      .then((engine) => {
        if (cancelled) return;
        setSvg(
          engine.render(recipeForCharacter(character.name, config), {
            portrait: true,
            prefix,
          }),
        );
      })
      .catch(() => {
        if (!cancelled) setSvg('');
      });

    return () => {
      cancelled = true;
    };
  }, [character.name, config, prefix]);

  return (
    <div
      className={`character-portrait recipe-character-portrait ${className}`.trim()}
      aria-hidden="true"
      data-character={character.id}
      data-species={config.species}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function CharacterPortrait({
  character,
  pose = 'idle',
  className = '',
}: {
  character: CharacterDefinition;
  pose?: OttiPortraitPose;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const isOtti = character.renderer.kind === 'otti-svg';
  const animateCelebration = isOtti && pose === 'celebrate';

  useEffect(() => {
    if (!animateCelebration || !hostRef.current) return;
    if (!window.OctopusMotion || !window.OctopusAnatomy || !window.CharacterGeometry) return;

    const rig = window.OctopusMotion.createRig(hostRef.current, {
      speechMotionScale: character.renderer.kind === 'otti-svg' ? character.renderer.motionScale ?? 0.5 : 0.5,
    });
    rig.setEmotion('excited');
    rig.setIntensity(0.95);
    rig.setGesture('celebrate', 6);

    return () => rig.destroy();
  }, [animateCelebration, character.renderer]);

  if (isOtti) {
    const svg = renderOttiSvg({
      pose,
      portrait: true,
      // The live PixiLive rig queries stable source IDs. Only the one animated
      // completion portrait keeps them; every static copy is namespaced.
      prefix: animateCelebration ? '' : `otti-portrait-${instanceId}-`,
    });
    return (
      <div
        ref={hostRef}
        className={`character-portrait otti-character-portrait ${className}`.trim()}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  if (character.renderer.kind === 'svg-human') {
    const svg = window.HumanArt.render(character.renderer.preset, {
      portrait: true,
      prefix: `portrait-${character.id}-${instanceId}-`,
    });

    return (
      <div
        ref={hostRef}
        className={`character-portrait ${className}`.trim()}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  if (character.renderer.kind === 'svg-mascot') {
    const svg = window.MascotArt.render(character.renderer.preset, {
      portrait: true,
      prefix: `portrait-${character.id}-${instanceId}-`,
    });

    return (
      <div
        ref={hostRef}
        className={`character-portrait mascot-character-portrait ${className}`.trim()}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <RecipePortrait
      character={character}
      config={character.renderer}
      className={className}
      prefix={`portrait-${character.id}-${instanceId}-`}
    />
  );
}
