import type { ConversationMission } from './types';

/**
 * Integration fixture only. The next curriculum milestone replaces this with the
 * first authored B1 mission; keeping it small lets us validate runtime behavior now.
 */
export function createFoundationDemoMission(title: string, description: string): ConversationMission {
  return {
    id: 'foundation-demo',
    title,
    level: 'B1',
    purpose: description,
    scenario: 'A relaxed one-to-one conversation connected to the learner’s real goal.',
    openingPrompt: 'Open with one easy, specific question. Do not explain the mission or assessment.',
    objectives: [
      {
        id: 'develop-a-thought',
        title: 'Develop one thought',
        capability: 'sustain-a-turn',
        brief: 'Create a natural chance for the learner to answer with a complete thought plus at least one relevant detail, reason, or example.',
        successEvidence: 'The learner communicates a connected idea beyond a bare one-line answer and the meaning is clear enough to continue naturally.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Ask one concrete follow-up.', 'Offer a short recast if a language gap blocks the idea, then let the learner finish.'],
        allowBoard: true,
      },
      {
        id: 'handle-the-exchange',
        title: 'Handle a follow-up exchange',
        capability: 'interaction-management',
        brief: 'Create a second exchange where the learner responds to a follow-up, asks a relevant question, clarifies, or repairs a misunderstanding without abandoning the conversation.',
        successEvidence: 'The learner actively manages the exchange rather than only producing an isolated answer.',
        acceptedResponseKinds: ['answer', 'question', 'continuation'],
        repairHints: ['Use a natural clarification request.', 'If they freeze, give a short phrase starter rather than the full answer.'],
        allowBoard: true,
      },
    ],
  };
}
