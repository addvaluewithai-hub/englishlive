import { SvgHumanRenderer } from './svg-engine/SvgHumanRenderer';
import type { CharacterDefinition, CharacterRenderer } from './types';

export function createCharacterRenderer(
  character: CharacterDefinition,
): CharacterRenderer {
  if (character.renderer.kind === 'svg-human') {
    return new SvgHumanRenderer(character.renderer);
  }

  throw new Error('Unsupported character renderer.');
}
