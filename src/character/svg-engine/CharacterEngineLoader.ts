import type { RecipeCharacterRendererConfig } from '../types';

export type CharacterRecipe = {
  species: RecipeCharacterRendererConfig['species'];
  name: string;
  fur?: string;
  cream?: string;
  accent?: string;
  eyes?: string;
  head?: number;
  body?: number;
  ears?: number;
  eyeSize?: number;
  accessory?: 'scarf' | 'bow' | 'none';
};

let masterPromise: Promise<string> | undefined;

export function loadCharacterEngineMaster() {
  masterPromise ??= fetch('/character-engine/master.svg')
    .then((response) => {
      if (!response.ok) throw new Error('Bundled PixiLive character master did not load.');
      return response.text();
    })
    .catch((error) => {
      masterPromise = undefined;
      throw error;
    });

  return masterPromise;
}

export async function loadCharacterEngine() {
  if (!window.CharacterEngine) {
    throw new Error('Bundled PixiLive recipe engine did not load.');
  }

  return window.CharacterEngine.createEngine(await loadCharacterEngineMaster());
}

export function recipeForCharacter(
  name: string,
  config: RecipeCharacterRendererConfig,
): CharacterRecipe {
  return {
    ...config.recipe,
    species: config.species,
    name,
  };
}
