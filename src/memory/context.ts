import type { ConversationMission } from '../tutor/types';
import type { EnglishLiveMemoryState } from './types';

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

  const notes = memory.relationshipNotes
    .filter((note) => note.characterId === characterId)
    .slice(-3);
  if (!relevant.length && !notes.length) {
    return 'PRODUCT MEMORY: No prior learning observations or learner-approved continuity notes are available for this conversation yet.';
  }

  const learning = relevant.length
    ? relevant.map((item) => `- ${item.capability}: ${item.successfulSessions} prior successful session observation(s); recycle=${item.recycleSuggested ? 'yes' : 'no'}${item.summary ? `; latest evidence: ${item.summary}` : ''}`).join('\n')
    : '- none relevant to this mission yet';
  const relationship = notes.length
    ? notes.map((note) => `- ${note.text}`).join('\n')
    : '- none for this partner';

  return `
PRODUCT MEMORY
Use this only to make the conversation more continuous and to choose useful practice. Never announce memory records, counts, capability ids, or internal labels to the learner.
Learning observations relevant to this mission:
${learning}
Learner-approved continuity notes for this conversation partner:
${relationship}
If a capability has only one successful observation, treat it as one observation, not mastery. If recycle=yes, create another natural opportunity without telling the learner they previously failed.
`.trim();
}
