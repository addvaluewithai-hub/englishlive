import type { CharacterDefinition } from './types';

export const characterRegistry = [
  {
    id: 'hakim',
    name: 'Hakim',
    tagline: 'هادي، متفهم، وسهل في الكلام.',
    description: 'A steady conversational partner who gives you space to think and finish your ideas.',
    accent: '#7E9586',
    renderer: { kind: 'svg-human', preset: 'hakim' },
    persona: { style: 'warm, thoughtful, patient, concise' },
  },
  {
    id: 'reem',
    name: 'Reem',
    tagline: 'دافئة، فضولية، ومشجعة دايمًا.',
    description: 'A friendly conversational partner who keeps the exchange moving with natural follow-up questions.',
    accent: '#D8A3AF',
    renderer: { kind: 'svg-human', preset: 'reem' },
    persona: { style: 'warm, curious, supportive, natural' },
  },
  {
    id: 'marwan',
    name: 'Marwan',
    tagline: 'مريح، سريع البديهة، ويحب التحدي.',
    description: 'A confident conversational partner who helps you explain your thinking instead of stopping at short answers.',
    accent: '#9A8570',
    renderer: { kind: 'svg-human', preset: 'marwan' },
    persona: { style: 'relaxed, witty, direct, encouraging' },
  },
  {
    id: 'amal',
    name: 'Amal',
    tagline: 'واضحة، مليانة طاقة، ومتفاعلة.',
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
