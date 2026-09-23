import type { ConversationMission } from '../tutor/types';
import type { EnglishLiveMemoryState } from './types';

export function buildRelationshipPrompt(
  memory: EnglishLiveMemoryState,
  characterId: string,
): string {
  const notes = memory.relationshipNotes
    .filter((note) => note.characterId === characterId)
    .slice(-3);

  if (!notes.length) {
    return 'RELATIONSHIP MEMORY: No learner-approved continuity notes are available for this conversation partner yet.';
  }

  return `
RELATIONSHIP MEMORY
These notes were explicitly approved by the learner for this conversation partner. Use them selectively when they make the interaction feel naturally continuous. Never announce that you are reading memory or recite the list.
${notes.map((note) => `- ${note.text}`).join('\n')}
`.trim();
}

export function buildMemoryPrompt(
  memory: EnglishLiveMemoryState,
  mission: ConversationMission,
  characterId: string,
): string {
  const relevant = mission.objectives.flatMap((objective) => {
    const capability = memory.capabilities[objective.capability];
    if (!capability) return [];
    const last = capability.recentEvidence.at(-1);
    return [{
      capability: objective.capability,
      successfulSessions: capability.successfulSessions,
      recycleSuggested: capability.recycleSuggested,
      summary: last?.summary,
    }];
  });

  const relationship = buildRelationshipPrompt(memory, characterId);
  if (!relevant.length) {
    return `PRODUCT MEMORY\nNo prior learning observations are relevant to this mission yet.\n${relationship}`;
  }

  const learning = relevant.map((item) => `- ${item.capability}: ${item.successfulSessions} prior successful session observation(s); recycle=${item.recycleSuggested ? 'yes' : 'no'}${item.summary ? `; latest evidence: ${item.summary}` : ''}`).join('\n');

  return `
PRODUCT MEMORY
Use this only to make the conversation more continuous and to choose useful practice. Never announce memory records, counts, capability ids, or internal labels to the learner.
Learning observations relevant to this mission:
${learning}
${relationship}
If a capability has only one successful observation, treat it as one observation, not mastery. If recycle=yes, create another natural opportunity without telling the learner they previously failed.
`.trim();
}
