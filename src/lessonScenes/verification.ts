import type { SceneInteractionKind } from './types';

export type SceneEvidenceRole =
  | 'productive'
  | 'receptive'
  | 'interactive'
  | 'retrieval'
  | 'integrated_support';

export interface SceneVerificationContract {
  evidenceRole: SceneEvidenceRole;
  enoughWhen: string;
  afterAnswerBearingSupport: string;
  notEnough: readonly string[];
}

function productive(enoughWhen: string, notEnough: readonly string[] = []): SceneVerificationContract {
  return {
    evidenceRole: 'productive',
    enoughWhen,
    afterAnswerBearingSupport: 'Treat the supported response as practice. Please change the person, topic, fact, or communicative need and look for a fresh less-supported use before completing.',
    notEnough: ['Immediate echo of the teacher model', 'A yes/ready/okay turn that does not perform the target', ...notEnough],
  };
}

function receptive(enoughWhen: string, notEnough: readonly string[] = []): SceneVerificationContract {
  return {
    evidenceRole: 'receptive',
    enoughWhen,
    afterAnswerBearingSupport: 'If the meaning or answer was revealed, please use a fresh spoken example before treating comprehension as established.',
    notEnough: ['Teacher explanation by itself', 'A generic acknowledgement with no evidence of the requested meaning or fact', ...notEnough],
  };
}

function interactive(enoughWhen: string, notEnough: readonly string[] = []): SceneVerificationContract {
  return {
    evidenceRole: 'interactive',
    enoughWhen,
    afterAnswerBearingSupport: 'If you supplied the next move or answer-bearing wording, please continue in a changed situation until the learner carries the interaction with less support.',
    notEnough: ['One isolated good sentence when the goal is sustained interaction', 'Teacher turns counted as learner performance', ...notEnough],
  };
}

function retrieval(enoughWhen: string, notEnough: readonly string[] = []): SceneVerificationContract {
  return {
    evidenceRole: 'retrieval',
    enoughWhen,
    afterAnswerBearingSupport: 'Once the target has been revealed, please repair briefly and create a changed delayed opportunity. The reveal itself should not close the scene.',
    notEnough: ['Repeating a phrase immediately after it was revealed', 'Calling a heavily cued answer independent retrieval', ...notEnough],
  };
}

function integratedSupport(enoughWhen: string, notEnough: readonly string[] = []): SceneVerificationContract {
  return {
    evidenceRole: 'integrated_support',
    enoughWhen,
    afterAnswerBearingSupport: 'A model can teach the pattern, but a fresh communicative need should follow before deciding the support is usable.',
    notEnough: ['Mechanical repetition with no communicative need', 'Teacher production counted as learner evidence', ...notEnough],
  };
}

const PILOT_CONTRACTS: Record<string, Record<string, SceneVerificationContract>> = {
  'b1-u1-l01-reconnect-without-script': {
    'cold-entry-diagnostic': interactive(
      'The learner has reacted to meaning and created a connected next move across two changed openings, or has already shown unusually strong multi-turn evidence that clearly covers both functions.',
      ['A single follow-up question with no evidence across a changed opening'],
    ),
    'hear-of-teach-use': productive('The learner independently recovers Have you heard of…? in a changed topic after any teaching/model support.'),
    'get-on-with-teach-use': productive('The learner uses get on with appropriately in a changed relationship context with little or no answer-bearing support.'),
    'too-bad-teach-use': productive('The learner distinguishes a minor setback from serious news and independently uses Too bad in a fresh minor-setback context.'),
    'phrase-surprise-retrieval': retrieval('Two different earlier phrases are recovered from meaning in two changed mini-contexts without the exact English being named first.'),
    'react-to-feeling': interactive('Across two different feelings or stances, the learner gives an appropriate reaction and creates a connected next move.'),
    'word-talented-receptive': receptive('The learner shows the key meaning of talented from a fresh spoken context; production of the word is not required.'),
    'word-photography-receptive': receptive('The learner identifies photography as the activity/art of taking photos from a fresh spoken update.'),
    'word-competitor-receptive': receptive('The learner identifies who is competing against whom in a fresh familiar context.'),
    'word-rugby-receptive': receptive('The learner recognises from a fresh update that rugby is the sport/activity being discussed; detailed sport knowledge is not required.'),
    'word-entertainment-receptive': receptive('The learner understands entertainment as the fun/leisure part of a fresh event or activity context.'),
    'phone-key-fact': receptive('The learner extracts the requested central fact from two short changed phone-style snippets; missing the specific requested fact should be repaired rather than over-credited.'),
    'rhetorical-question-receptive': receptive('The learner distinguishes information-seeking from point-making across fresh rhetorical-question examples.'),
    'sound-perception-check': receptive('The learner recognises the requested key word/chunk or meaning inside fresh connected speech; no pronunciation-quality claim is needed.'),
    'guided-reconnection': interactive('The learner carries several actual learner turns, reacts to changing details, creates next moves, and handles at least one natural earlier-language opportunity without being fed the next full question.'),
    'late-surprise-retrieval': retrieval('The learner independently recovers one earlier productive phrase and demonstrates understanding of one earlier receptive item/skill after a gap.'),
    'fresh-reconnection-transfer': interactive(
      'The learner sustains a genuinely changed conversation for several learner turns, shows initiative, responds to meaning, and naturally recovers more than one earlier lesson resource when the context invites it.',
      ['A conversation where the teacher supplies the target language and the learner only reacts to it'],
    ),
  },
  'b1-u1-l02-keep-conversation-going': {
    'maintain-conversation-diagnostic': interactive('The learner listens to new details and keeps the exchange alive for several learner turns, normally at least three, without relying on a supplied next question.'),
    'get-to-know-teach-use': productive('The learner independently uses get to know in a changed person/context after any teaching model.'),
    'in-touch-teach-use': productive('The learner independently uses be/keep in touch in a changed contact situation after any support.'),
    'you-see-teach-use': productive('The learner uses You see to introduce a meaningful explanation in a fresh reason/background context, not simply by repeating the teacher model.'),
    'continuation-phrase-retrieval': retrieval('Two different earlier continuation phrases are recovered from meaning in changed contexts without naming the exact target first.'),
    'wonder-teach-use': productive('The learner uses wonder naturally to raise a thought, possibility, or polite planning question in a changed context.'),
    'encourage-teach-use': productive('The learner independently uses encourage in a changed person/action context.'),
    'reject-teach-use': productive('The learner independently uses reject for an unaccepted idea/proposal/option in a changed context.'),
    'agreement-teach-use': productive('The learner independently uses agreement to describe a fresh shared decision or arrangement.'),
    'conclude-teach-use': productive('The learner independently uses conclude/concluded to state a result or judgement from a fresh set of facts.'),
    'planning-vocabulary-integration': interactive(
      'Across a real multi-turn planning exchange, the learner uses wonder, encourage, reject, agreement, and conclude when their functions naturally arise at separate moments.',
      ['Putting all five target words into one meta sentence without actually performing the planning functions'],
    ),
    'emphatic-do-support': integratedSupport('The learner uses emphatic do intelligibly when a real contrast, doubt, or emphasis need makes it useful in a fresh context.'),
    'let-me-support': integratedSupport('The learner naturally holds the turn with Let me… while genuinely thinking/organising, then continues the answer.'),
    'negative-tag-support': integratedSupport('The learner uses or meaningfully handles a simple negative tag in a fresh shared-fact check after any model.'),
    'speech-act-verb-support': integratedSupport('The learner makes the intended conversational act clear in fresh suggestion and promise moments rather than only repeating a model.'),
    'connected-speech-support': integratedSupport(
      'The learner demonstrates recognition of earlier chunks in connected speech and then produces two selected chunks intelligibly in meaningful turns.',
      ['A ready/okay acknowledgement before the listening prompt', 'Teacher-only production of the chunk'],
    ),
    'formal-invitation-accepted': interactive('The learner makes a polite invitation and then continues the exchange naturally after acceptance with at least one relevant follow-up turn.'),
    'formal-invitation-declined': interactive(
      'The learner makes a fresh polite invitation and responds appropriately enough to a decline/hesitation to keep the relationship and conversation intact.',
      ['The same attempt immediately after the teacher has described that response as inappropriate or incomplete'],
    ),
    'follow-everyday-conversation': receptive('The learner identifies both the main topic and the requested changed detail from a fresh multi-turn everyday dialogue; a partially correct answer should not be described as complete evidence.'),
    'mixed-surprise-retrieval': retrieval('Across a natural exchange, the learner handles three changed retrieval needs: one earlier phrase, one planning word, and one interaction-support pattern, without being told the exact targets first.'),
    'fresh-maintained-conversation': interactive(
      'The learner sustains a new familiar conversation for several learner turns with active listening, initiative, relevant follow-up, turn management, and natural recovery of at least one phrase, one planning item, and one interaction-support move when those needs arise.',
      ['Teacher use of a target counted as learner evidence', 'A visible checklist-style request to use named targets'],
    ),
  },
  'b1-u1-l03-personal-updates-feelings-reactions': {
    'personal-update-diagnostic': interactive(
      'Across changed personal updates, the learner responds to the meaning with an appropriate stance and creates a natural connected next move over several actual learner turns.',
      ['A generic “okay” or “nice” with no meaningful reaction or continuation', 'A single teacher-supplied follow-up repeated by the learner'],
    ),
    'good-bad-news-reactions': interactive(
      'The learner responds appropriately to both ordinary positive and negative personal news and adds a small connected move rather than only naming a memorised phrase.',
      ['Using the same enthusiastic reaction for clearly negative news', 'Repeating the model immediately with no changed news'],
    ),
    'break-up-teach-use': productive('The learner independently uses break up appropriately in a changed relationship-ending personal-news context.'),
    'have-in-common-teach-use': productive('The learner independently uses have … in common to describe a concrete shared interest, quality or experience in a changed pair/context.'),
    'respect-for-teach-use': productive('The learner independently expresses respect for a fresh person, quality, effort or achievement and makes the reason understandable.'),
    'personal-phrase-retrieval': retrieval('At least two different L03 phrases are recovered from meaning in changed personal situations without naming the exact English first.'),
    'word-engaged-teach-use': productive('The learner independently uses engaged for the agreed-to-marry personal-news meaning in a changed person/context.'),
    'word-annoyed-teach-use': productive('The learner independently uses annoyed for a fresh concrete irritation and makes the cause understandable.'),
    'word-disappointing-teach-use': productive('The learner independently uses disappointing to describe a fresh result or experience that was worse than hoped, rather than only echoing the teacher.'),
    'word-confident-teach-use': productive('The learner independently uses confident about a fresh concrete task, event or performance situation.'),
    'word-brave-teach-use': productive('The learner independently uses brave for a fresh person/action that faces something difficult or frightening with courage.'),
    'word-gentle-teach-use': productive('The learner independently uses gentle for fresh calm, kind or careful behaviour in a concrete situation.'),
    'word-honest-teach-use': productive('The learner independently uses honest for fresh truthful or open behaviour in a concrete situation.'),
    'word-passion-teach-use': productive('The learner independently uses passion for a fresh strong lasting interest or enthusiasm.'),
    'word-relaxed-teach-use': productive('The learner independently uses relaxed for a fresh calm/not-tense state and gives enough context for the meaning to be clear.'),
    'word-worry-teach-use': productive('The learner independently uses worry/worried to express or respond to a fresh ordinary concern in a natural way.'),
    'personal-vocabulary-integration': interactive(
      'Across a real multi-turn sequence of personal updates, the learner uses several different L03 context words for their actual meanings, including items from more than one meaning group and any weak earlier items that the teacher intentionally revisits.',
      ['Listing vocabulary words without using them to describe the people, feelings or events in the exchange', 'Teacher descriptions counted as learner vocabulary use'],
    ),
    'events-in-progress-support': integratedSupport(
      'The learner gives a fresh current personal update using a simple in-progress form when the meaning calls for something happening now or around now.',
      ['Reciting a tense rule without producing a meaningful current update'],
    ),
    'polite-excuse-teach-use': interactive(
      'Across at least two changed familiar social situations when practical, the learner makes a polite excuse with an appropriate brief acknowledgement/reason and keeps the social tone intact.',
      ['A bare “no” with no polite social move when the situation calls for one', 'Immediate repetition of the teacher’s full excuse as the only evidence'],
    ),
    'follow-everyday-update-conversation': receptive(
      'The learner identifies both the main personal update and one key feeling or reason from a fresh everyday exchange. Requesting a reasonable repetition does not count against success.',
      ['Only identifying the general topic while missing the requested update or feeling/reason'],
    ),
    'consonant-clarity-support': integratedSupport(
      'In a meaningful short update, the learner makes one or two selected L03 words intelligible enough that the intended word/message is clear; native-like accent or isolated perfection is not required.',
      ['Teacher-only pronunciation', 'A claim of precise accent quality without communicative evidence'],
    ),
    'intonation-stance-support': integratedSupport(
      'Across changed positive and negative updates, the learner’s broad intended stance is perceptible in their natural short reactions, without requiring a specific native intonation contour.',
      ['Accent imitation by itself', 'Teacher modelling counted as learner stance evidence'],
    ),
    'mixed-surprise-retrieval': retrieval(
      'Across fresh personal situations, the learner recovers at least three delayed needs from different categories: one L03 phrase, one context word, and one social reaction or polite excuse, without being told the exact target first.',
      ['A visible checklist request naming the targets', 'Counting a revealed answer as delayed retrieval without a changed retry'],
    ),
    'fresh-personal-update-transfer': interactive(
      'The learner sustains a genuinely fresh personal-news conversation for several learner turns, both reacts and contributes, expresses a feeling or stance, follows up naturally, and recovers relevant L03 language when the evolving meaning invites it.',
      ['A conversation dominated by teacher target-language production', 'A final quiz where the learner is told which vocabulary items to insert'],
    ),
  },
};

const FALLBACK_BY_KIND: Record<SceneInteractionKind, SceneVerificationContract> = {
  elicitation: productive('The learner performs the stated scene goal in a learner-generated attempt; if answer-bearing help was needed, a changed retry gives the stronger evidence.'),
  micro_practice: productive('The learner performs the stated target in a fresh meaningful attempt with the level of support appropriate to the goal.'),
  guided_dialogue: interactive('The learner demonstrates the stated goal across the actual interaction rather than in one isolated sentence.'),
  roleplay: interactive('The learner performs the stated role/function inside the roleplay and responds to what the partner actually says.'),
  fresh_transfer: interactive('The learner demonstrates the stated goal in a new context with reduced support across enough turns to make the transfer credible.'),
};

export function sceneVerificationContract(
  lessonId: string,
  sceneId: string,
  interactionKind: SceneInteractionKind,
): SceneVerificationContract {
  return PILOT_CONTRACTS[lessonId]?.[sceneId] ?? FALLBACK_BY_KIND[interactionKind];
}
