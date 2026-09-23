import type { CharacterEmotion, CharacterGesture, MouthPose } from '../types';

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
      ) => {
        setEmotion: (emotion: CharacterEmotion) => void;
        setIntensity: (value: number) => void;
        setEnergy: (value: number) => void;
        setMouthPose: (pose: MouthPose | null) => void;
        setGesture: (gesture: CharacterGesture, duration?: number) => void;
        cancelActions: () => void;
        destroy: () => void;
      };
    };
  }
}

export {};
