import type { LiveClientTool } from '../live/tools';
import type { ConversationObjective } from '../tutor/types';
import { StageDirector } from './StageDirector';
import type { SupportBoard } from './types';

const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export class ConversationPresentation {
  readonly tool: LiveClientTool;

  constructor(
    private readonly director: StageDirector,
    private readonly currentObjective: () => ConversationObjective,
  ) {
    this.tool = {
      declaration: {
        name: 'present_support',
        description: 'Optional visual support for a brief teaching moment. Call before the explanation. The board appears only while the next spoken turn is audible, then the character returns to hero automatically.',
        behavior: 'BLOCKING',
        parameters: {
          type: 'OBJECT',
          properties: {
            objectiveId: { type: 'STRING', description: 'Exact currentObjective.id from get_mission_state.' },
            visualType: { type: 'STRING', enum: ['note', 'compare', 'examples', 'steps'] },
            title: { type: 'STRING', description: 'Short learner-facing title.' },
            body: { type: 'STRING', description: 'Optional short explanation.' },
            items: {
              type: 'ARRAY',
              maxItems: 4,
              items: {
                type: 'OBJECT',
                properties: {
                  title: { type: 'STRING' },
                  body: { type: 'STRING' },
                },
                required: ['title'],
              },
            },
          },
          required: ['objectiveId', 'visualType', 'title'],
        },
      },
      handle: (args) => this.handle(args),
    };
  }

  private handle(args: Record<string, unknown>) {
    const objective = this.currentObjective();
    if (args.objectiveId !== objective.id) {
      return { error: 'Stale objective. Get mission state before presenting support.' };
    }
    if (objective.allowBoard === false) {
      return { error: 'Visual support is disabled for the current objective.' };
    }

    const title = text(args.title, 100);
    const body = text(args.body, 260);
    if (!title) return { error: 'Board title is required.' };
    const rawItems = Array.isArray(args.items) ? args.items.slice(0, 4) : [];
    const items = rawItems.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
      const entry = item as Record<string, unknown>;
      const itemTitle = text(entry.title, 100);
      if (!itemTitle) return [];
      const itemBody = text(entry.body, 180);
      return [{ title: itemTitle, ...(itemBody ? { body: itemBody } : {}) }];
    });

    let board: SupportBoard;
    if (args.visualType === 'note') {
      board = { type: 'note', title, ...(body ? { body } : {}) };
    } else if (args.visualType === 'compare') {
      if (items.length !== 2) return { error: 'A comparison needs exactly two items.' };
      board = { type: 'compare', title, left: items[0], right: items[1] };
    } else if (args.visualType === 'examples') {
      if (!items.length) return { error: 'Examples need at least one item.' };
      board = { type: 'examples', title, items };
    } else if (args.visualType === 'steps') {
      if (!items.length) return { error: 'Steps need at least one item.' };
      board = { type: 'steps', title, items };
    } else {
      return { error: 'Unsupported visual type.' };
    }

    this.director.queueBoard(board);
    return {
      ready: true,
      instruction: 'Use the visual briefly while speaking, then continue the conversation. Do not repeat all board text aloud.',
    };
  }
}
