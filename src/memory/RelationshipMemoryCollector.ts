import type { LiveClientTool } from '../live/tools';
import type { RelationshipMemoryKind, RelationshipMemoryProposal } from './types';

const allowedKinds = new Set<RelationshipMemoryKind>(['follow_up', 'preference', 'interest']);
const sensitivePattern = /\b(health|medical|doctor|hospital|diagnos|illness|religion|religious|politic|party|vote|salary|income|bank|password|address|phone|email|sexual|pregnan|crime|criminal|legal|passport|identity|national id)\b/i;

export class RelationshipMemoryCollector {
  private current: RelationshipMemoryProposal | null = null;

  readonly tool: LiveClientTool = {
    declaration: {
      name: 'propose_relationship_memory',
      description: 'Optionally propose one small, non-sensitive continuity note that could make a future conversation feel connected. The app will ask the learner before saving it. Never use for health, religion, politics, finances, legal matters, sex life, precise contact/location details, identifiers, secrets, or other sensitive information.',
      behavior: 'NON_BLOCKING',
      parameters: {
        type: 'OBJECT',
        properties: {
          kind: { type: 'STRING', enum: ['follow_up', 'preference', 'interest'] },
          text: { type: 'STRING', description: 'Short future-facing note, max 160 characters, e.g. Ask how the presentation went.' },
        },
        required: ['kind', 'text'],
      },
    },
    handle: (args) => {
      if (this.current) {
        return { result: 'A relationship-memory proposal is already queued. Do not create another in this session.' };
      }
      const kind = args.kind as RelationshipMemoryKind;
      const text = typeof args.text === 'string' ? args.text.trim().slice(0, 160) : '';
      if (!allowedKinds.has(kind) || !text) return { error: 'Invalid relationship-memory proposal.' };
      if (sensitivePattern.test(text)) return { error: 'Sensitive continuity notes are not eligible for relationship memory.' };
      this.current = { kind, text };
      this.onProposal(this.current);
      return { result: 'Proposal queued for learner confirmation. It is not saved yet.' };
    },
  };

  readonly systemPrompt = `
RELATIONSHIP CONTINUITY
- Product memory is controlled by the application, not by your context window.
- You may call propose_relationship_memory at most once in a session, and only when the learner voluntarily mentions a small non-sensitive fact that creates a genuinely useful future follow-up, preference, or interest.
- Never propose sensitive information: health, religion, politics, finances, legal/criminal matters, sex life, precise contact/location details, identifiers, passwords, or secrets.
- Do not say that you remembered or saved anything. The product UI asks the learner whether to keep the proposal.
- If nothing is naturally worth remembering, do not call the tool.
`.trim();

  constructor(private readonly onProposal: (proposal: RelationshipMemoryProposal) => void) {}

  get proposal() {
    return this.current;
  }

  clear() {
    this.current = null;
  }
}
