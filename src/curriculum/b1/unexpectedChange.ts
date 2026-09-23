import type { LearningGoal } from '../../product/profile';
import type { ConversationMission } from '../../tutor/types';

export const FIRST_B1_MISSION_ID = 'b1-unexpected-change-story';

const variants: Record<LearningGoal, Pick<ConversationMission, 'title' | 'purpose' | 'scenario' | 'openingPrompt'>> = {
  work: {
    title: 'When the plan changed',
    purpose: 'Tell a connected story about a familiar work situation that changed, explain what you did, and handle an unprepared follow-up.',
    scenario: 'You are catching up with a colleague about a recent time a plan, task, meeting, or deadline changed unexpectedly.',
    openingPrompt: 'Start like a colleague catching up, not an interviewer. Ask about a recent time something at work did not go exactly as planned. Accept another familiar real-life example if the learner prefers.',
  },
  interviews: {
    title: 'Tell me about a time you adapted',
    purpose: 'Tell a connected real experience, explain a decision or reaction, and respond naturally when the listener asks for more detail.',
    scenario: 'You are having a relaxed pre-interview conversation about a real time the learner had to adapt when something changed.',
    openingPrompt: 'Ask for a real example of a time a plan changed and the learner had to adapt. Keep it conversational rather than turning it into a formal interview question.',
  },
  travel: {
    title: 'When a plan changed',
    purpose: 'Narrate an unexpected change clearly, explain the response, and manage a natural clarification or follow-up.',
    scenario: 'You are chatting about a trip, outing, booking, journey, or plan that changed unexpectedly.',
    openingPrompt: 'Ask whether the learner has ever had a trip or plan change unexpectedly. If not, invite any familiar situation where a plan changed.',
  },
  everyday: {
    title: 'Tell me what happened',
    purpose: 'Build a connected story from a familiar experience, explain a reaction or reason, and keep the exchange moving through a follow-up.',
    scenario: 'You are catching up as friends about a recent or memorable time something did not go as planned.',
    openingPrompt: 'Ask for a recent or memorable time something did not go as planned. Sound curious, not instructional.',
  },
  study: {
    title: 'When your plan changed',
    purpose: 'Explain a familiar change as a connected narrative, give a reason or reaction, and handle an unprepared follow-up.',
    scenario: 'You are talking about a time a study plan, project, course, deadline, or learning goal changed unexpectedly.',
    openingPrompt: 'Ask about a time a study or project plan changed. Accept a work or everyday example if that is easier for the learner to talk about naturally.',
  },
};

/**
 * First production B1 mission. It elicits one fresh observation of B1-style connected
 * narration and interaction; completing it must never be treated as B1 mastery.
 */
export function createUnexpectedChangeMission(goal: LearningGoal | undefined): ConversationMission {
  const variant = variants[goal ?? 'everyday'];
  return {
    id: FIRST_B1_MISSION_ID,
    level: 'B1',
    ...variant,
    objectives: [
      {
        id: 'establish-context',
        title: 'Make the situation clear',
        capability: 'b1.narrative.establish-context',
        brief: 'Invite the learner to establish enough context that a listener can understand the situation and what was expected before the change. Do not demand a checklist of who/where/when if the context is already clear.',
        successEvidence: 'The learner independently gives enough relevant context to identify the familiar situation and the original plan, expectation, or normal state. Meaning is clear without the partner supplying the story.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: [
          'Ask one concrete contextual follow-up such as what the original plan was.',
          'If the learner is very brief, invite one more detail instead of supplying one.',
        ],
        allowBoard: false,
      },
      {
        id: 'connect-the-events',
        title: 'Connect what happened',
        capability: 'b1.narrative.sequence-events',
        brief: 'Get the learner to continue the same story through the change and what happened next. Judge chronological control and connected meaning, not a required tense or connector.',
        successEvidence: 'The learner links at least two relevant events or stages into a comprehensible sequence so the listener can follow how the situation changed and developed.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: [
          'Ask what happened next rather than requesting a grammar form.',
          'If sequencing is hard to follow, ask one natural clarification about order.',
          'A brief board with sequencing options may be used only as rescue support, never as a model answer.',
        ],
        allowBoard: true,
      },
      {
        id: 'explain-the-response',
        title: 'Explain the response',
        capability: 'b1.reasons.explain-response',
        brief: 'Create a natural chance for the learner to explain why they acted, decided, or felt a certain way, or what effect the change had.',
        successEvidence: 'The learner gives at least one intelligible reason, reaction, consequence, or short explanation that goes beyond listing events and makes their response understandable.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: [
          'Ask why that choice made sense or how the change affected them.',
          'If language blocks the reason, offer a short phrase starter, not the content of the answer.',
        ],
        allowBoard: true,
      },
      {
        id: 'handle-an-unprepared-followup',
        title: 'Handle a real follow-up',
        capability: 'b1.interaction.followup-repair',
        brief: 'Ask one genuinely useful follow-up or clarification that has not already been answered. Let the learner manage the exchange without a rehearsed script.',
        successEvidence: 'The learner responds meaningfully to an unprepared follow-up, clarification, or small misunderstanding and keeps the shared meaning moving forward; natural hesitation or self-repair is acceptable.',
        acceptedResponseKinds: ['answer', 'question', 'continuation'],
        repairHints: [
          'If you did not understand something, ask a real clarification instead of pretending.',
          'If the learner loses a word, let them paraphrase or repair before offering vocabulary.',
        ],
        allowBoard: false,
      },
    ],
  };
}
