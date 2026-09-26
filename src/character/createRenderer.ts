import { OttiRenderer } from './otti/OttiRenderer';
import { SvgHumanRenderer } from './svg-engine/SvgHumanRenderer';
import type { CharacterDefinition, CharacterRenderer } from './types';

export function createCharacterRenderer(
  character: CharacterDefinition,
): CharacterRenderer {
  if (character.renderer.kind === 'svg-human') {
    return new SvgHumanRenderer(character.renderer);
  }

  if (character.renderer.kind === 'otti-svg') {
    return new OttiRenderer(character.renderer);
  }

  throw new Error('Unsupported character renderer.');
}
