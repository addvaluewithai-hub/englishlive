import { OttiRenderer } from './otti/OttiRenderer';
import { RecipeCharacterRenderer } from './svg-engine/RecipeCharacterRenderer';
import { SvgHumanRenderer } from './svg-engine/SvgHumanRenderer';
import { SvgMascotRenderer } from './svg-engine/SvgMascotRenderer';
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

  if (character.renderer.kind === 'svg-mascot') {
    return new SvgMascotRenderer(character.renderer);
  }

  if (character.renderer.kind === 'svg-recipe') {
    return new RecipeCharacterRenderer(character.name, character.renderer);
  }

  throw new Error('Unsupported character renderer.');
}
