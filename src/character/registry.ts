import type { CharacterDefinition } from './types';

export const characterRegistry = [
  {
    id: 'hakim',
    name: 'Hakim',
    tagline: 'Calm, thoughtful, and easy to talk to.',
    description: 'A steady conversational partner who gives you space to think and finish your ideas.',
    accent: '#7E9586',
    renderer: { kind: 'svg-human', preset: 'hakim' },
    persona: { style: 'warm, thoughtful, patient, concise' },
  },
  {
    id: 'reem',
    name: 'Reem',
    tagline: 'Warm, curious, and encouraging.',
    description: 'A friendly conversational partner who keeps the exchange moving with natural follow-up questions.',
    accent: '#D8A3AF',
    renderer: { kind: 'svg-human', preset: 'reem' },
    persona: { style: 'warm, curious, supportive, natural' },
  },
  {
    id: 'marwan',
    name: 'Marwan',
    tagline: 'Relaxed, quick, and a little challenging.',
    description: 'A confident conversational partner who helps you explain your thinking instead of stopping at short answers.',
    accent: '#9A8570',
    renderer: { kind: 'svg-human', preset: 'marwan' },
    persona: { style: 'relaxed, witty, direct, encouraging' },
  },
  {
    id: 'amal',
    name: 'Amal',
    tagline: 'Energetic, clear, and optimistic.',
    description: 'An upbeat conversational partner who helps you keep speaking when you hesitate or lose your words.',
    accent: '#AE96CD',
    renderer: { kind: 'svg-human', preset: 'amal' },
    persona: { style: 'energetic, clear, positive, concise' },
  },
] as const satisfies readonly CharacterDefinition[];

export const DEFAULT_CHARACTER_ID = 'reem';

export function getCharacterDefinition(id: string | null | undefined): CharacterDefinition {
  return characterRegistry.find((character) => character.id === id) ?? characterRegistry.find((character) => character.id === DEFAULT_CHARACTER_ID)!;
}
