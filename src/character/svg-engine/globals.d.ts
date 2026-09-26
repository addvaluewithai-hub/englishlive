import type { CharacterEmotion, CharacterGesture, MouthPose } from '../types';

type CharacterRig = {
  setEmotion: (emotion: CharacterEmotion | 'happy') => void;
  setIntensity: (value: number) => void;
  setEnergy: (value: number) => void;
  setMouthPose: (pose: MouthPose | null) => void;
  setGesture: (gesture: CharacterGesture, duration?: number) => void;
  cancelActions: () => void;
  destroy: () => void;
};

type CharacterRecipe = {
  species: string;
  name?: string;
  [key: string]: unknown;
};

type RecipeEngine = {
  normalize: (input: CharacterRecipe) => CharacterRecipe;
  render: (
    input: CharacterRecipe,
    options?: { portrait?: boolean; prefix?: string },
  ) => string;
  metrics: (input: CharacterRecipe) => Record<string, unknown>;
};

declare global {
  interface Window {
    CharacterGeometry: {
      mouthBase: Record<string, number>;
      expressionMouth: Record<string, Record<string, number>>;
      visemes: Record<string, Record<string, number>>;
      mouth: (raw: Record<string, number>, species?: string) => {
        attributes: Record<string, Record<string, string | number>>;
      };
    };
    CharacterEngine: {
      createEngine: (master: string) => RecipeEngine;
    };
    CharacterFlight: {
      createFlight: () => unknown;
    };
    CharacterMotion: {
      createRig: (
        root: Element,
        options: {
          keyboard?: boolean;
          externalControl?: boolean;
          speechMotionScale?: number;
          appearance?: () => Record<string, unknown>;
        },
      ) => CharacterRig;
    };
    HumanArt: {
      render: (
        id: string,
        options?: { portrait?: boolean; prefix?: string },
      ) => string;
      presets: Record<string, Record<string, unknown>>;
    };
    HumanMotion: {
      createRig: (
        root: Element,
        options: { preset: string; speechMotionScale?: number },
      ) => CharacterRig;
    };
    OctopusAnatomy: {
      rest: Record<string, number>;
      poses: Record<string, Record<string, number>>;
      eyes: Record<string, { x: number; y: number; rx: number; ry: number }>;
      mouth: { x: number; y: number; sx: number; sy: number };
      render: (persona: { name: string }, portrait?: boolean) => string;
      draw: (
        attr: (id: string, key: string, value: string | number) => void,
        state: Record<string, number>,
        time: number,
        reduced: boolean,
      ) => void;
    };
    OctopusMotion: {
      createRig: (
        root: Element,
        options?: { speechMotionScale?: number },
      ) => CharacterRig;
    };
    MascotArt: {
      render: (
        id: 'octo' | 'fustuq',
        options?: { portrait?: boolean; prefix?: string },
      ) => string;
      presets: Record<string, Record<string, unknown>>;
    };
    MascotMotion: {
      createRig: (
        root: Element,
        options: { preset: 'octo' | 'fustuq'; speechMotionScale?: number },
      ) => CharacterRig;
    };
  }
}

export {};
