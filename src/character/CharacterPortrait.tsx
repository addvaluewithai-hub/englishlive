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
  if (character.renderer.kind === 'otti-svg') {
    const svg = renderOttiSvg({ pose });
    return (
      <div
        className={`character-portrait otti-character-portrait ${className}`.trim()}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  const svg = window.HumanArt.render(character.renderer.preset, {
    portrait: true,
    prefix: `portrait-${character.id}-`,
  });

  return (
    <div
      className={`character-portrait ${className}`.trim()}
      aria-hidden="true"
      // The markup comes only from the bundled, pinned character engine.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
