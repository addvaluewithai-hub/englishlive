import { SvgHumanRenderer } from './svg-engine/SvgHumanRenderer';
import type { CharacterDefinition, CharacterRenderer } from './types';

export function createCharacterRenderer(
  character: CharacterDefinition,
): CharacterRenderer {
  switch (character.renderer.kind) {
    case 'svg-human':
      return new SvgHumanRenderer(character.renderer);
    default: {
      const exhaustive: never = character.renderer;
      throw new Error(`Unsupported character renderer: ${String(exhaustive)}`);
    }
  }
}
