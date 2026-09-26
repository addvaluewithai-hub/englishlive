import { useEffect, useId, useRef } from 'react';
import { renderOttiSvg, type OttiPortraitPose } from './otti/OttiArt';
import type { CharacterDefinition } from './types';

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
      speechMotionScale: 0.42,
    });
    rig.setEmotion('excited');
    rig.setIntensity(0.95);
    rig.setGesture('celebrate', 6);

    return () => rig.destroy();
  }, [animateCelebration]);

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

  const svg = window.HumanArt.render(character.renderer.preset, {
    portrait: true,
    prefix: `portrait-${character.id}-${instanceId}-`,
  });

  return (
    <div
      ref={hostRef}
      className={`character-portrait ${className}`.trim()}
      aria-hidden="true"
      // The markup comes only from the bundled, pinned character engine.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
