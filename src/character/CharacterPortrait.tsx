import type { CharacterDefinition } from './types';

export function CharacterPortrait({
  character,
}: {
  character: CharacterDefinition;
}) {
  if (character.renderer.kind !== 'svg-human') return null;

  const svg = window.HumanArt.render(character.renderer.preset, {
    portrait: true,
    prefix: `portrait-${character.id}-`,
  });

  return (
    <div
      className="character-portrait"
      aria-hidden="true"
      // The markup comes only from the bundled, pinned character engine.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
