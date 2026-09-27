import type { LearningGoal } from '../../product/profile';
import type { ConversationMission } from '../../tutor/types';
import { createUnexpectedChangeMission, FIRST_B1_MISSION_ID } from './unexpectedChange';

export const RECOMMEND_MISSION_ID = 'b1-recommend-and-support';
export const COMPARE_DECIDE_MISSION_ID = 'b1-compare-and-decide';
export const EXPLAIN_PROBLEM_MISSION_ID = 'b1-explain-a-problem';
export const SOCIAL_FLOW_MISSION_ID = 'b1-keep-conversation-moving';
export const EXPLAIN_CLEARLY_MISSION_ID = 'b1-explain-clearly';

export const MVP_B1_MISSION_IDS = [
  FIRST_B1_MISSION_ID,
  RECOMMEND_MISSION_ID,
  COMPARE_DECIDE_MISSION_ID,
  EXPLAIN_PROBLEM_MISSION_ID,
  SOCIAL_FLOW_MISSION_ID,
  EXPLAIN_CLEARLY_MISSION_ID,
] as const;

export type MvpB1MissionId = (typeof MVP_B1_MISSION_IDS)[number];

export interface MvpMissionDescriptor {
  id: MvpB1MissionId;
  order: number;
  family: string;
  promise: string;
  create(goal: LearningGoal | undefined): ConversationMission;
}

const goalContext: Record<LearningGoal, {
  recommendation: string;
  decision: string;
  problem: string;
  social: string;
  explain: string;
}> = {
  work: {
    recommendation: 'a practical way to improve a familiar work task, meeting, process, or team habit',
    decision: 'two realistic ways to handle a work plan, task, meeting, or deadline',
    problem: 'a familiar workplace problem that needs to be explained clearly before deciding what to do next',
    social: 'a relaxed conversation with a colleague before or after work',
    explain: 'a familiar work process, responsibility, tool, or way of doing something',
  },
  interviews: {
    recommendation: 'advice for someone preparing for a familiar work or interview situation',
    decision: 'two reasonable choices someone could make in a work, career, or preparation situation',
    problem: 'a familiar challenge from work, study, or a project that the learner can explain without revealing private details',
    social: 'a relaxed pre-interview or professional small-talk conversation',
    explain: 'a familiar responsibility, project, process, or skill from the learner’s experience',
  },
  travel: {
    recommendation: 'a place, activity, route, or travel choice the learner can genuinely recommend',
    decision: 'two realistic travel plans or options with a new constraint introduced during the conversation',
    problem: 'a familiar travel or service problem such as a change, delay, booking issue, or missing information',
    social: 'a natural conversation with another traveler or someone the learner has just met',
    explain: 'how to do something familiar while travelling, planning a trip, or using a service',
  },
  everyday: {
    recommendation: 'something ordinary the learner genuinely likes or finds useful, such as a place, habit, activity, app, or way to spend time',
    decision: 'two everyday options for a plan, purchase, activity, or shared decision',
    problem: 'an ordinary practical problem that can be explained without sharing sensitive information',
    social: 'a relaxed conversation with a friend or new acquaintance',
    explain: 'a familiar routine, hobby, practical process, or way the learner does something',
  },
  study: {
    recommendation: 'a useful study method, resource, routine, or way to learn something',
    decision: 'two realistic ways to approach a study plan, project, deadline, or learning goal',
    problem: 'a familiar study or project problem that needs clarification and a sensible next step',
    social: 'a relaxed conversation with a classmate or another learner',
    explain: 'a familiar idea, study process, project, or topic the learner already understands reasonably well',
  },
};

function context(goal: LearningGoal | undefined) {
  return goalContext[goal ?? 'everyday'];
}

export function createRecommendMission(goal: LearningGoal | undefined): ConversationMission {
  const topic = context(goal).recommendation;
  return {
    id: RECOMMEND_MISSION_ID,
    level: 'B1',
    title: 'Recommend something — and make the case',
    purpose: 'State a useful recommendation, support it with reasons or examples, and respond when the listener is not immediately convinced.',
    scenario: `You are having a natural conversation about ${topic}. The learner should recommend something they can talk about from real experience or familiar knowledge.`,
    openingPrompt: 'Open by asking for a genuine recommendation connected to the scenario. Do not ask for a formal speech; make it sound like you actually want their advice.',
    objectives: [
      {
        id: 'state-a-clear-recommendation',
        title: 'Make the recommendation clear',
        capability: 'b1.opinion.state-position',
        brief: 'Create a natural chance for the learner to state what they recommend or prefer clearly enough that the listener knows the position.',
        successEvidence: 'The learner communicates a clear recommendation, preference, or position in their own words rather than only naming a topic.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Ask what they would choose or suggest.', 'If several options appear, ask which one they would actually recommend.'],
        allowBoard: false,
      },
      {
        id: 'support-the-recommendation',
        title: 'Give a useful reason',
        capability: 'b1.reasons.support-view',
        brief: 'Invite enough support that the recommendation makes sense to another person. Judge communicative support, not a required connector or grammar form.',
        successEvidence: 'The learner gives at least one intelligible reason, example, advantage, or relevant detail that supports the recommendation.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Ask what makes it a good choice.', 'If the reason is vague, ask for one concrete example or advantage.'],
        allowBoard: true,
      },
      {
        id: 'respond-to-an-alternative',
        title: 'Respond to another view',
        capability: 'b1.interaction.respond-alternative',
        brief: 'Offer one reasonable alternative or mild challenge and let the learner react naturally without turning the exchange into a debate.',
        successEvidence: 'The learner responds to a different suggestion by agreeing, qualifying, disagreeing politely, or explaining why their recommendation still fits.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Keep the challenge mild and realistic.', 'Accept partial agreement; the learner does not need to defend the original position at all costs.'],
        allowBoard: true,
      },
      {
        id: 'handle-a-followup',
        title: 'Handle the follow-up',
        capability: 'b1.interaction.followup-repair',
        brief: 'Ask one useful unprepared follow-up or clarification about the learner’s recommendation.',
        successEvidence: 'The learner answers, clarifies, paraphrases, or repairs meaning well enough to keep the exchange moving.',
        acceptedResponseKinds: ['answer', 'question', 'continuation'],
        repairHints: ['If a word is missing, give the learner room to paraphrase first.', 'Ask a real clarification if something is unclear.'],
        allowBoard: false,
      },
    ],
  };
}

export function createCompareDecideMission(goal: LearningGoal | undefined): ConversationMission {
  const topic = context(goal).decision;
  return {
    id: COMPARE_DECIDE_MISSION_ID,
    level: 'B1',
    title: 'Compare the options and decide',
    purpose: 'Compare realistic choices, explain what matters, make a decision, and adjust when one condition changes.',
    scenario: `You and the learner need to think through ${topic}. Keep the stakes ordinary and collaborative.`,
    openingPrompt: 'Introduce two simple realistic options connected to the scenario and ask the learner what difference matters most to them. Do not overload the turn with many conditions.',
    objectives: [
      {
        id: 'identify-a-relevant-difference',
        title: 'Compare what matters',
        capability: 'b1.comparison.relevant-difference',
        brief: 'Get the learner to compare the options using at least one meaningful difference rather than merely naming both choices.',
        successEvidence: 'The learner communicates a relevant similarity, difference, advantage, or disadvantage that helps the decision.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Ask what is better or harder about one option.', 'A short compare board may unlock language if the learner knows the idea but cannot phrase it.'],
        allowBoard: true,
      },
      {
        id: 'make-and-support-a-choice',
        title: 'Choose and explain why',
        capability: 'b1.reasons.support-view',
        brief: 'Invite a choice and enough reasoning that the listener understands why it fits.',
        successEvidence: 'The learner makes a clear choice or preference and gives at least one relevant reason or trade-off.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Ask which option they would go with and why.', 'Do not require multiple reasons if one developed reason is enough.'],
        allowBoard: false,
      },
      {
        id: 'adjust-to-a-new-constraint',
        title: 'Adjust when something changes',
        capability: 'b1.planning.adjust-plan',
        brief: 'Introduce one realistic new constraint after the learner chooses, then ask what they would change.',
        successEvidence: 'The learner adapts the plan, keeps the original goal in view, and communicates a workable next choice or compromise.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Change only one condition.', 'If the learner rejects both options, let them propose a third workable option.'],
        allowBoard: false,
      },
      {
        id: 'reach-a-shared-next-step',
        title: 'Reach a practical next step',
        capability: 'b1.interaction.simple-compromise',
        brief: 'End the decision naturally by checking or negotiating one practical next step.',
        successEvidence: 'The learner confirms, modifies, or proposes a practical next step while responding to the partner’s contribution.',
        acceptedResponseKinds: ['answer', 'question', 'continuation'],
        repairHints: ['Use a collaborative question such as what should we do first.', 'Do not force agreement if the learner can explain a workable alternative.'],
        allowBoard: false,
      },
    ],
  };
}

export function createExplainProblemMission(goal: LearningGoal | undefined): ConversationMission {
  const topic = context(goal).problem;
  return {
    id: EXPLAIN_PROBLEM_MISSION_ID,
    level: 'B1',
    title: 'Explain the problem clearly',
    purpose: 'Describe a familiar problem, make the important details clear, respond to clarification, and propose or request a sensible next step.',
    scenario: `The learner needs to explain ${topic} to a cooperative person who can help think through the next step.`,
    openingPrompt: 'Invite a familiar non-sensitive example of a practical problem. Make clear that a hypothetical or ordinary example is fine; never push for private details.',
    objectives: [
      {
        id: 'state-the-problem',
        title: 'Make the problem clear',
        capability: 'b1.problem.explain-core',
        brief: 'Let the learner explain what is wrong or what is not working, with enough context for the listener to understand the issue.',
        successEvidence: 'The learner communicates the core problem and relevant situation clearly enough that the listener knows what needs attention.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Ask what exactly is not working or what changed.', 'Avoid supplying the problem for the learner.'],
        allowBoard: false,
      },
      {
        id: 'add-impact-or-detail',
        title: 'Explain why it matters',
        capability: 'b1.problem.explain-impact',
        brief: 'Invite one useful consequence, impact, constraint, or detail that changes how the problem should be handled.',
        successEvidence: 'The learner adds a relevant consequence, impact, or condition that helps the listener understand why the problem matters.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Ask what happens if nothing changes.', 'Ask which detail is most important, not for every detail.'],
        allowBoard: true,
      },
      {
        id: 'clarify-after-a-question',
        title: 'Clarify a detail',
        capability: 'b1.interaction.clarify-detail',
        brief: 'Ask one genuine clarification about an ambiguous or missing detail.',
        successEvidence: 'The learner clarifies, rephrases, specifies, or corrects the detail sufficiently for shared understanding.',
        acceptedResponseKinds: ['answer', 'question', 'continuation'],
        repairHints: ['If everything is already clear, ask a detail that would genuinely affect the next step.', 'Do not manufacture a misunderstanding just to test repair.'],
        allowBoard: false,
      },
      {
        id: 'move-to-a-next-step',
        title: 'Move toward a solution',
        capability: 'b1.planning.propose-next-step',
        brief: 'Ask what should happen next or what help the learner would request.',
        successEvidence: 'The learner proposes, requests, or negotiates a practical next step that connects to the problem they explained.',
        acceptedResponseKinds: ['answer', 'question', 'continuation'],
        repairHints: ['Let the learner ask for help if that is more natural than proposing the full solution.', 'Accept a simple workable next step.'],
        allowBoard: false,
      },
    ],
  };
}

export function createSocialFlowMission(goal: LearningGoal | undefined): ConversationMission {
  const topic = context(goal).social;
  return {
    id: SOCIAL_FLOW_MISSION_ID,
    level: 'B1',
    title: 'Keep the conversation moving',
    purpose: 'React naturally, ask back, develop an answer, and recover when a small gap or misunderstanding appears.',
    scenario: `You are having ${topic}. There is no task to solve; the goal is a genuine two-way exchange on familiar topics.`,
    openingPrompt: 'Start with one ordinary, specific conversational topic connected loosely to the learner’s goal or an approved relationship note. Avoid a sequence of interview questions.',
    objectives: [
      {
        id: 'react-to-the-partner',
        title: 'React to what you heard',
        capability: 'b1.interaction.react-relevantly',
        brief: 'Share a small conversational detail or opinion and give the learner space to react to the meaning before moving on.',
        successEvidence: 'The learner gives a relevant reaction, comment, or response that shows they are engaging with the partner rather than only waiting for the next question.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Make the partner contribution short enough to react to.', 'Accept a brief but meaningful reaction.'],
        allowBoard: false,
      },
      {
        id: 'ask-a-relevant-followup',
        title: 'Ask back naturally',
        capability: 'b1.interaction.ask-followup',
        brief: 'Create a natural opening where asking a related question would move the exchange forward, without explicitly instructing the learner to ask a question.',
        successEvidence: 'The learner asks a relevant question or invites the partner to add something in a way that makes the exchange genuinely two-way.',
        acceptedResponseKinds: ['question'],
        repairHints: ['If they never ask back, pause after a personally relevant detail and leave conversational space.', 'As rescue support, offer a short question starter rather than a full question.'],
        allowBoard: true,
      },
      {
        id: 'develop-own-turn',
        title: 'Develop your own turn',
        capability: 'b1.discourse.develop-turn',
        brief: 'When the topic returns to the learner, invite enough detail, reason, or example for a connected contribution.',
        successEvidence: 'The learner develops a familiar-topic turn beyond a bare answer with connected relevant detail, reason, example, or short narrative.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Ask one genuine follow-up rather than saying “say more”.', 'Do not require a long monologue.'],
        allowBoard: false,
      },
      {
        id: 'repair-a-small-gap',
        title: 'Recover from a small gap',
        capability: 'b1.interaction.followup-repair',
        brief: 'Use a naturally occurring missing word, unclear reference, or minor misunderstanding as a chance for repair. If no real gap occurs, ask one clarification about meaning.',
        successEvidence: 'The learner repeats, rephrases, clarifies, checks meaning, or otherwise repairs the exchange without abandoning the conversation.',
        acceptedResponseKinds: ['answer', 'question', 'continuation'],
        repairHints: ['Do not fake hearing problems.', 'Let paraphrase count even if the final wording is not perfect.'],
        allowBoard: false,
      },
    ],
  };
}

export function createExplainClearlyMission(goal: LearningGoal | undefined): ConversationMission {
  const topic = context(goal).explain;
  return {
    id: EXPLAIN_CLEARLY_MISSION_ID,
    level: 'B1',
    title: 'Explain it so someone can follow',
    purpose: 'Give a connected explanation of something familiar, organize the key parts, use an example when useful, and answer an unprepared question.',
    scenario: `The learner explains ${topic} to an interested person who does not already know it as well as they do.`,
    openingPrompt: 'Ask the learner to choose one familiar thing from the scenario that they can explain comfortably. Keep the topic concrete enough for spoken B1; do not demand expert knowledge.',
    objectives: [
      {
        id: 'give-an-overview',
        title: 'Give the listener a clear starting point',
        capability: 'b1.explanation.overview',
        brief: 'Invite a short overview that tells the listener what the thing is, what it is for, or what the explanation will cover.',
        successEvidence: 'The learner gives enough orientation for the listener to understand the topic before details begin.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Ask what it is or why someone would use or care about it.', 'Do not require a dictionary-style definition.'],
        allowBoard: false,
      },
      {
        id: 'organize-the-explanation',
        title: 'Connect the main parts',
        capability: 'b1.discourse.sequence-explanation',
        brief: 'Get the learner to connect at least two relevant steps, parts, or ideas in an order the listener can follow.',
        successEvidence: 'The learner links the main parts into a comprehensible sequence or structure rather than giving disconnected fragments.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Ask what happens first or what the main parts are.', 'A short steps board may support language without supplying the content.'],
        allowBoard: true,
      },
      {
        id: 'make-it-concrete',
        title: 'Make the explanation concrete',
        capability: 'b1.explanation.use-example',
        brief: 'Invite an example, comparison, or concrete detail when it would help the listener understand.',
        successEvidence: 'The learner adds a relevant example, comparison, or concrete detail that makes the explanation easier to understand.',
        acceptedResponseKinds: ['answer', 'continuation'],
        repairHints: ['Ask for a simple example rather than more abstract explanation.', 'If the explanation is already concrete, accept another clarifying detail.'],
        allowBoard: true,
      },
      {
        id: 'answer-an-unprepared-question',
        title: 'Answer the listener’s question',
        capability: 'b1.interaction.followup-repair',
        brief: 'Ask one genuine question a curious listener might have after the explanation.',
        successEvidence: 'The learner answers, clarifies, or repairs meaning sufficiently to address the unprepared question and preserve the explanation.',
        acceptedResponseKinds: ['answer', 'question', 'continuation'],
        repairHints: ['Ask about something actually missing or interesting.', 'If the learner is unsure, let them say so and explain what they do know.'],
        allowBoard: false,
      },
    ],
  };
}

export const MVP_B1_MISSIONS: readonly MvpMissionDescriptor[] = [
  {
    id: FIRST_B1_MISSION_ID,
    order: 1,
    family: 'Connected story',
    promise: 'Make a real experience easy to follow and handle a natural follow-up.',
    create: createUnexpectedChangeMission,
  },
  {
    id: RECOMMEND_MISSION_ID,
    order: 2,
    family: 'Opinions & reasons',
    promise: 'Recommend something, support the idea, and react to another view.',
    create: createRecommendMission,
  },
  {
    id: COMPARE_DECIDE_MISSION_ID,
    order: 3,
    family: 'Compare & plan',
    promise: 'Compare choices, decide, then adapt when one condition changes.',
    create: createCompareDecideMission,
  },
  {
    id: EXPLAIN_PROBLEM_MISSION_ID,
    order: 4,
    family: 'Problems & repair',
    promise: 'Explain a practical problem clearly and move toward a useful next step.',
    create: createExplainProblemMission,
  },
  {
    id: SOCIAL_FLOW_MISSION_ID,
    order: 5,
    family: 'Two-way conversation',
    promise: 'React, ask back, develop a turn, and recover from small gaps.',
    create: createSocialFlowMission,
  },
  {
    id: EXPLAIN_CLEARLY_MISSION_ID,
    order: 6,
    family: 'Connected explanation',
    promise: 'Explain something familiar in an organized way and answer a real question.',
    create: createExplainClearlyMission,
  },
];
