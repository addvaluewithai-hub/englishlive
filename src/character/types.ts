export type CharacterMode = 'idle' | 'listening' | 'thinking' | 'speaking';

export const characterEmotions = [
  'neutral',
  'happy',
  'sad',
  'crying',
  'surprised',
  'thinking',
  'angry',
  'sleepy',
  'laughing',
  'excited',
] as const;

export type CharacterEmotion = (typeof characterEmotions)[number];

export const characterGestures = [
  'none',
  'wave',
  'blink',
  'jump',
  'explain',
  'think',
  'celebrate',
] as const;

export type CharacterGesture = (typeof characterGestures)[number];

export type MouthViseme =
  | 'REST'
  | 'MBP'
  | 'AA'
  | 'EE'
  | 'IH'
  | 'OH'
  | 'OO'
  | 'FV'
  | 'L'
  | 'S'
  | 'CH'
  | 'WQ';

export interface MouthPose {
  viseme: MouthViseme;
  energy: number;
  open: number;
  width?: number;
  round?: number;
}

export interface SvgHumanRendererConfig {
  kind: 'svg-human';
  preset: 'hakim' | 'reem' | 'marwan' | 'amal';
}

export interface OttiSvgRendererConfig {
  kind: 'otti-svg';
  preset: 'otti';
}

export type CharacterRendererConfig = SvgHumanRendererConfig | OttiSvgRendererConfig;

export interface CharacterDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  renderer: CharacterRendererConfig;
  persona: {
    style: string;
  };
}

export interface CharacterRenderer {
  mount(container: HTMLElement): Promise<void> | void;
  unmount(): Promise<void> | void;
  setMode(mode: CharacterMode): void;
  setEmotion(emotion: CharacterEmotion, intensity?: number): void;
  setGesture(gesture: CharacterGesture, durationSeconds?: number): void;
  setMouth(pose: MouthPose | null): void;
  cancel(): void;
}

export const restMouth: MouthPose = {
  viseme: 'REST',
  energy: 0,
  open: 0,
};
