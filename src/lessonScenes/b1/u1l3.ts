import type { SceneLessonDefinition } from '../types';

export const B1_U1_L03_SCENE_LESSON: SceneLessonDefinition = {
  id: 'b1-u1-l03-personal-updates-feelings-reactions',
  levelId: 'b1',
  unitId: 'b1-u1-independent-conversation',
  unitTitle: 'From Routine Exchange to Independent Conversation',
  order: 3,
  title: 'Share Personal Updates, Feelings and Reactions',
  subtitle: 'Share recent personal news, show how you feel about it, react appropriately to someone else, and keep the exchange moving.',
  performance: 'Exchange fresh familiar personal updates and feelings, respond with appropriate interest or stance, and add a natural follow-up or brief reason so the conversation develops.',
  coreLanguage: [
    'react appropriately to ordinary good and bad personal news using a small useful repertoire',
    'make a polite excuse when a familiar social situation needs one',
    'break up; have something in common; respect for somebody/something',
    'productive context vocabulary: annoyed, brave, confident, disappointing, engaged, gentle, honest, passion, relaxed, worry',
    'bounded support for describing an event or situation currently in progress',
    'consonant clarity and intonation/stance support intelligibility and social meaning; no accent target',
  ],
  boundaries: [
    'The primary outcome is a real exchange of personal news, feelings and reactions, not a vocabulary recital.',
    'Please keep emotion and personality language bounded to familiar concrete situations; this is not a broad personality-vocabulary lesson.',
    'Teach the three authored phrases as usable social resources inside meaningful updates rather than as an isolated phrase list.',
    'The ten context words are productive here, but each should be learned through a concrete personal situation and later integrated naturally rather than requested as dictionary definitions.',
    'The events-in-progress grammar row is support for giving a current update, not a general present-continuous chapter.',
    'Pronunciation support is about intelligibility and making stance easy to hear; please avoid accent imitation or claims of precise phonetic mastery.',
    'The final transfer should use a genuinely fresh personal-news context and should let the learner react, expand and follow up without being handed the next line.',
  ],
  source: {
    repository: 'addvaluewithai-hub/english-course',
    branch: '801114fdd860e8b9c1e7b137a0af1c3b3cc0e9cb',
    path: 'curriculum/levels/b1/design-review/07-lesson-briefs/lesson-briefs.md#u1-l03--share-personal-updates-feelings-and-reactions',
    sourceLessonId: 'U1-L03',
  },
  scenes: [
    {
      id: 'personal-update-diagnostic',
      title: 'Turn personal news into a real exchange',
      goal: 'The learner can respond to a fresh personal update, show an appropriate stance, and create a natural next move rather than stopping after one reaction.',
      teaching: {
        explainInArabic: [
          'خلّي البداية اختبار خفيف بعد مقدمة الدرس: شارك update شخصي مألوف، وسيب المتعلم يتفاعل مع المعنى ويعمل follow-up طبيعي من نفسه.',
          'الفكرة الأساسية هنا إن الخبر الشخصي مش محتاج رد محفوظ؛ محتاج reaction يناسب الخبر وبعدها move يخلي الكلام يكمل.',
        ],
        englishTargets: ['personal update', 'appropriate reaction', 'one natural follow-up'],
        constraints: [
          'Please do not model a complete learner response before the first attempt.',
          'Please use one positive or neutral update first, then a meaningfully different update later before completing when practical.',
          'Please let the exchange run for several actual learner turns when the learner is able to carry it.',
        ],
      },
      board: {
        type: 'steps',
        title: 'Make personal news a conversation',
        items: [
          { title: 'Hear the update', body: 'what actually happened?' },
          { title: 'React', body: 'show the right feeling or stance' },
          { title: 'Follow up', body: 'ask or add one connected thought' },
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Give a fresh familiar personal update that does not reuse the hobby vocabulary from earlier lessons. Respond naturally to the learner and introduce one more detail so they have a real chance to continue.',
        learnerTask: 'React naturally to my update and help the conversation continue.',
        supportLadder: [
          'قل بالعربي باختصار: ركز الأول هل الخبر كويس، وحش، ولا mixed.',
          'Name only the functions: reaction + follow-up.',
          'Offer one short reaction starter, then change the update before judging independent interaction.',
        ],
      },
    },
    {
      id: 'good-bad-news-reactions',
      title: 'Match the reaction to the news',
      goal: 'The learner can use a small natural fixed-reaction repertoire appropriately for ordinary good and bad news, then continue with interest.',
      teaching: {
        explainInArabic: [
          'وضح إن نفس الحماس ماينفعش مع كل خبر: good news محتاجة reaction إيجابية، وbad news محتاجة sympathy أو acknowledgement مناسب.',
          'استخدم أمثلة قصيرة بالإنجليزي زي “That’s great news.” و“I’m sorry to hear that.” كموارد، مش كإجابات وحيدة لازم تتحفظ حرفيًا.',
        ],
        englishTargets: ["That's great news.", "I'm glad to hear that.", "I'm sorry to hear that.", 'That sounds disappointing.'],
        constraints: [
          'Please treat the English lines as a small useful repertoire, not as an exhaustive list.',
          'Please accept natural equivalent reactions that fit the news socially.',
          'After any full model, please change the news before deciding the learner can react independently.',
        ],
      },
      board: {
        type: 'compare',
        title: 'Match the reaction to the news',
        left: { title: 'Good news', body: "That's great news. / I'm glad to hear that." },
        right: { title: 'Bad news', body: "I'm sorry to hear that. / That sounds disappointing." },
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give short ordinary personal-news updates with different emotional directions. After the learner reacts, ask one tiny natural question or add one detail so the response is not a detached phrase drill.',
        learnerTask: 'React in a way that fits the news, then add one small connected move.',
        supportLadder: [
          'Ask in Arabic whether this is good news or bad news.',
          'Point to the appropriate side of the visible board without choosing the exact sentence.',
          'Model one reaction, then switch to a different update for a fresh attempt.',
        ],
      },
    },
    {
      id: 'break-up-teach-use',
      title: 'Use break up for a relationship ending',
      goal: 'The learner can understand and independently use break up when a romantic relationship ends in a familiar personal-news context.',
      teaching: {
        explainInArabic: [
          'قدّم break up كـchunk اجتماعي شائع لما علاقة عاطفية تنتهي، وخليه يظهر كخبر شخصي طبيعي مش كدرس phrasal verbs.',
        ],
        englishTargets: ['They broke up last month.', 'My friend just broke up with her partner.'],
        constraints: [
          'Please keep the meaning bounded to the relationship context in this lesson.',
          'Please do not expand into a broad phrasal-verb lesson.',
          'If you provide the full sentence, please change the people and situation for the independent retry.',
        ],
      },
      board: { type: 'examples', title: 'A relationship ended', items: [{ title: 'break up', body: 'end a romantic relationship' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Use one supported personal-news example, then a different person/context where the learner reports that the relationship ended.',
        learnerTask: 'Use break up naturally to report what happened.',
        supportLadder: ['Explain the social meaning in Arabic.', 'Give break up only.', 'Model one sentence, then change the people before the retry.'],
      },
    },
    {
      id: 'have-in-common-teach-use',
      title: 'Notice a shared interest with have in common',
      goal: 'The learner can independently use have something in common to describe a meaningful shared interest, quality or experience.',
      teaching: {
        explainInArabic: [
          'قدّم have something in common لما شخصين بينهم اهتمام أو صفة أو تجربة مشتركة، وخلي المشترك محدد وواضح.',
        ],
        englishTargets: ['We have a lot in common.', 'We both love cooking, so we have that in common.'],
        constraints: [
          'Please keep the example concrete rather than asking for a dictionary definition.',
          'Please accept natural variation such as have a lot/something in common.',
          'Use a changed pair of people or shared detail after answer-bearing support.',
        ],
      },
      board: { type: 'examples', title: 'Something is shared', items: [{ title: 'have … in common', body: 'share an interest, quality or experience' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Describe two people with one clear shared interest or experience, then later change both the people and the shared detail.',
        learnerTask: 'Describe naturally what the two people have in common.',
        supportLadder: ['Say in Arabic: بينهم حاجة مشتركة.', 'Give have … in common only.', 'Model once, then use a fresh pair.'],
      },
    },
    {
      id: 'respect-for-teach-use',
      title: 'Express respect for someone or something',
      goal: 'The learner can use respect for to express a positive stance toward a person, quality, effort or achievement in a familiar context.',
      teaching: {
        explainInArabic: [
          'قدّم respect for لما بنقول إن عندنا تقدير حقيقي لشخص أو مجهود أو موقف، وخلّي السبب واضح من السياق.',
        ],
        englishTargets: ['I have a lot of respect for her.', 'I respect him for being honest.'],
        constraints: [
          'Please keep the focus on the communicative stance rather than noun-versus-verb grammar.',
          'A fresh person or reason should follow any full model before completion.',
        ],
      },
      board: { type: 'examples', title: 'Show genuine respect', items: [{ title: 'respect for …', body: 'real admiration or regard' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give a short situation where someone did something worthy of respect, then change the person or reason.',
        learnerTask: 'Express your respect naturally and say briefly what it is for.',
        supportLadder: ['Explain the stance in Arabic.', 'Give respect for only.', 'Model once, then change person/reason for a fresh use.'],
      },
    },
    {
      id: 'personal-phrase-retrieval',
      title: 'Bring back the social phrases naturally',
      goal: 'The learner can recover earlier L03 phrases from meaning after a gap without being told which English phrase is needed.',
      teaching: {
        explainInArabic: ['ما تعلنش revision. اعمل مواقف شخصية قصيرة تخلي احتياج break up أو have in common أو respect for يظهر طبيعيًا.'],
        englishTargets: ['break up', 'have something in common', 'respect for'],
        constraints: [
          'Please test at least two different phrase functions in changed contexts.',
          'Please do not name the target phrase before the first attempt.',
          'If a phrase has to be revealed, repair briefly and create another changed opportunity for that function.',
        ],
      },
      interaction: {
        kind: 'micro_practice',
        setup: 'Create two short fresh personal situations selected from a relationship ending, discovering a shared trait, and expressing admiration. Let the meaning cue the language.',
        learnerTask: 'Respond naturally to each situation.',
        supportLadder: ['Give the communicative meaning only.', 'Give a partial phrase shape.', 'Reveal the phrase, then switch context before the retry.'],
      },
    },
    {
      id: 'word-engaged-teach-use',
      title: 'Use engaged as personal relationship news',
      goal: 'The learner can understand and use engaged for the familiar personal-news meaning of having agreed to marry someone.',
      teaching: {
        explainInArabic: ['قدّم engaged هنا كخبر شخصي: شخصين قرروا يتجوزوا رسميًا، من غير ما نفتح باقي معاني الكلمة.'],
        englishTargets: ["They're engaged.", 'My sister just got engaged.'],
        constraints: [
          'Please keep this lesson to the relationship-news meaning of engaged.',
          'Please use a different person or update after any full model.',
        ],
      },
      board: { type: 'examples', title: 'Personal news', items: [{ title: 'engaged', body: 'agreed to get married' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Share one engagement update, then give a changed person/situation and ask the learner to report the news naturally.',
        learnerTask: 'Use engaged naturally in the personal update.',
        supportLadder: ['Explain the relationship meaning in Arabic.', 'Give engaged only.', 'Model once, then change person for the retry.'],
      },
    },
    {
      id: 'word-annoyed-teach-use',
      title: 'Say when someone feels annoyed',
      goal: 'The learner can use annoyed for a familiar situation where someone feels irritated or bothered.',
      teaching: {
        explainInArabic: ['قدّم annoyed كإحساس تضايق أو irritation بسبب موقف مزعج، وخلي السبب واضح في المثال.'],
        englishTargets: ['I was annoyed because the bus was forty minutes late.'],
        constraints: ['Please keep the cause concrete.', 'Use a changed inconvenience after any model.'],
      },
      board: { type: 'examples', title: 'A bothered feeling', items: [{ title: 'annoyed', body: 'irritated or bothered' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give one ordinary inconvenience, then a different one. Ask the learner to describe the feeling and brief reason.',
        learnerTask: 'Say naturally that you or the person felt annoyed and why.',
        supportLadder: ['Give the feeling meaning in Arabic.', 'Give annoyed only.', 'Model one cause, then change the inconvenience.'],
      },
    },
    {
      id: 'word-disappointing-teach-use',
      title: 'Describe a disappointing result or experience',
      goal: 'The learner can use disappointing for a familiar result, event or experience that was worse than hoped.',
      teaching: {
        explainInArabic: ['فرّق بسرعة بين feeling الشخص وبين وصف الحدث: هنا disappointing بتوصف النتيجة أو التجربة اللي خيبت التوقع.'],
        englishTargets: ['The result was disappointing.'],
        constraints: ['Please keep the adjective distinction practical rather than turning it into a morphology lesson.', 'Use a fresh result or event for the independent attempt.'],
      },
      board: { type: 'compare', title: 'Person vs result', left: { title: 'I felt disappointed', body: 'the person’s feeling' }, right: { title: 'It was disappointing', body: 'the result or experience' } },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give a familiar expectation and an underwhelming result. Then change the event and ask the learner to describe the result itself.',
        learnerTask: 'Use disappointing to describe the result or experience.',
        supportLadder: ['Say in Arabic: بنوصف الحدث نفسه.', 'Give disappointing only.', 'Model once, then change the result.'],
      },
    },
    {
      id: 'word-confident-teach-use',
      title: 'Express feeling confident',
      goal: 'The learner can use confident for feeling reasonably sure about their ability or likely performance in a familiar situation.',
      teaching: {
        explainInArabic: ['قدّم confident لما الشخص حاسس إنه قادر يعمل حاجة أو متوقع أداء كويس، في موقف محدد ومألوف.'],
        englishTargets: ['I feel confident about the interview.'],
        constraints: ['Please keep confidence tied to a concrete situation.', 'Use a changed task or event after support.'],
      },
      board: { type: 'examples', title: 'Feeling ready and able', items: [{ title: 'confident', body: 'sure enough about your ability or performance' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Use two different familiar tasks such as a presentation, test, interview or performance.',
        learnerTask: 'Say whether the person feels confident and what it is about.',
        supportLadder: ['Explain the feeling in Arabic.', 'Give confident only.', 'Model one situation, then change the task.'],
      },
    },
    {
      id: 'word-brave-teach-use',
      title: 'Describe a brave action',
      goal: 'The learner can use brave for someone who faces a difficult or frightening situation with courage.',
      teaching: {
        explainInArabic: ['قدّم brave من خلال فعل فيه خوف أو صعوبة لكن الشخص واجهه بشجاعة، مش كصفة عامة من غير دليل.'],
        englishTargets: ['It was brave of him to speak up.'],
        constraints: ['Please anchor the word in an observable action.', 'Use a new action after any full model.'],
      },
      board: { type: 'examples', title: 'Courage in action', items: [{ title: 'brave', body: 'faces something difficult or frightening' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Describe a person doing something difficult despite fear, then change the person/action.',
        learnerTask: 'Describe the person or action using brave.',
        supportLadder: ['Explain courage in Arabic.', 'Give brave only.', 'Model once, then change the action.'],
      },
    },
    {
      id: 'word-gentle-teach-use',
      title: 'Describe someone as gentle',
      goal: 'The learner can use gentle for calm, kind or careful behaviour toward another person or animal in a familiar context.',
      teaching: {
        explainInArabic: ['قدّم gentle من خلال تصرف هادي ولطيف وحريص مع شخص أو حيوان، بدل تعريف مجرد.'],
        englishTargets: ['She was very gentle with the nervous child.'],
        constraints: ['Please use concrete behaviour.', 'Use a changed person or situation after support.'],
      },
      board: { type: 'examples', title: 'Kind and careful behaviour', items: [{ title: 'gentle', body: 'calm, kind and careful' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give one situation involving careful kind behaviour, then another with a different person or animal.',
        learnerTask: 'Describe the behaviour or person using gentle.',
        supportLadder: ['Explain the behaviour in Arabic.', 'Give gentle only.', 'Model once, then change the situation.'],
      },
    },
    {
      id: 'word-honest-teach-use',
      title: 'Use honest for truthful behaviour',
      goal: 'The learner can use honest for someone telling the truth or being open about a familiar situation.',
      teaching: {
        explainInArabic: ['قدّم honest من خلال شخص قال الحقيقة أو كان صريح حتى لو ده كان صعب شوية.'],
        englishTargets: ['He was honest about the mistake.'],
        constraints: ['Please keep the situation concrete.', 'Use a changed truth-telling situation after any model.'],
      },
      board: { type: 'examples', title: 'Telling the truth', items: [{ title: 'honest', body: 'truthful and open' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Describe a person who admitted something truthfully, then change the situation.',
        learnerTask: 'Describe the person or behaviour using honest.',
        supportLadder: ['Explain the meaning in Arabic.', 'Give honest only.', 'Model once, then change what happened.'],
      },
    },
    {
      id: 'word-passion-teach-use',
      title: 'Talk about a real passion',
      goal: 'The learner can use passion for a strong lasting interest or enthusiasm in a familiar activity or field.',
      teaching: {
        explainInArabic: ['قدّم passion كاهتمام قوي ومستمر بحاجة الشخص بيحبها فعلًا، مش مجرد حاجة عاجباه النهاردة.'],
        englishTargets: ['Music is one of her biggest passions.', 'He has a real passion for cooking.'],
        constraints: ['Please keep the distinction practical rather than abstract.', 'Use a fresh interest after support.'],
      },
      board: { type: 'examples', title: 'A strong lasting interest', items: [{ title: 'passion for …', body: 'deep enthusiasm or strong interest' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give a person with a deep long-term interest, then change the activity and person.',
        learnerTask: 'Describe the strong interest naturally using passion.',
        supportLadder: ['Explain strong long-term interest in Arabic.', 'Give passion for only.', 'Model once, then change the interest.'],
      },
    },
    {
      id: 'word-relaxed-teach-use',
      title: 'Say when someone feels relaxed',
      goal: 'The learner can use relaxed for feeling calm and not tense in a familiar situation.',
      teaching: {
        explainInArabic: ['قدّم relaxed كحالة هدوء وقلة توتر، وخلي السياق يوضح إيه اللي خلّى الشخص يحس كده.'],
        englishTargets: ['I felt much more relaxed after the meeting.'],
        constraints: ['Please keep the situation familiar and concrete.', 'Use a changed calming context after support.'],
      },
      board: { type: 'examples', title: 'Calm, not tense', items: [{ title: 'relaxed', body: 'calm and comfortable' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Use one situation where tension reduces, then a different one.',
        learnerTask: 'Describe the feeling using relaxed and give a short reason.',
        supportLadder: ['Explain calm/not tense in Arabic.', 'Give relaxed only.', 'Model once, then change the situation.'],
      },
    },
    {
      id: 'word-worry-teach-use',
      title: 'Express a familiar worry',
      goal: 'The learner can use worry naturally to talk about being concerned about a familiar situation.',
      teaching: {
        explainInArabic: ['قدّم worry كقلق أو concern عن حاجة ممكن تحصل أو نتيجة الشخص مش مطمن لها، في موضوع يومي بسيط.'],
        englishTargets: ["I'm worried about tomorrow's presentation.", "Don't worry about it."],
        constraints: ['Please keep the examples ordinary and non-clinical.', 'Use a fresh concern after any full model.'],
      },
      board: { type: 'examples', title: 'A concern on your mind', items: [{ title: 'worry / worried about …', body: 'feel concerned about something' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give one familiar concern, then change the situation and ask the learner to express the worry naturally.',
        learnerTask: 'Say what the person is worried about or reassure them naturally.',
        supportLadder: ['Explain concern in Arabic.', 'Give worry / worried about only.', 'Model once, then change the concern.'],
      },
    },
    {
      id: 'personal-vocabulary-integration',
      title: 'Use the feeling and people words inside real updates',
      goal: 'The learner can use several L03 context words naturally across a multi-turn exchange when their meanings become relevant, without turning the conversation into a vocabulary checklist.',
      teaching: {
        explainInArabic: ['اعمل سلسلة updates قصيرة ومترابطة عن ناس ومواقف حقيقية، وخلي الكلمات المناسبة تظهر من المعنى بدل ما تطلب list.'],
        englishTargets: ['annoyed', 'brave', 'confident', 'disappointing', 'engaged', 'gentle', 'honest', 'passion', 'relaxed', 'worry'],
        constraints: [
          'Please create separate natural opportunities across several turns rather than asking for all ten words at once.',
          'The learner does not need to force every word into one story; the aim is functional use across the interaction.',
          'Please sample broadly enough to revisit words from different meaning groups, especially any that needed strong support earlier.',
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Run a compact exchange involving several fresh personal updates about relationships, a challenge, a result and a current feeling. Let each detail create a natural place for different context vocabulary.',
        learnerTask: 'Respond to the updates, describe the people or feelings, and keep the exchange natural.',
        supportLadder: ['Give the intended meaning in Arabic only.', 'Offer a first-letter or category cue for one missing word.', 'Reveal one word if needed, then create a different fresh use before treating it as recovered.'],
      },
    },
    {
      id: 'events-in-progress-support',
      title: 'Give an update about something happening now',
      goal: 'The learner can use a simple in-progress form to make a current personal update when that is the natural meaning.',
      teaching: {
        explainInArabic: [
          'اربط الـpresent continuous بوظيفة بسيطة هنا: update عن حاجة شغالة دلوقتي أو الفترة الحالية، من غير ما نحولها لشرح زمن كامل.',
        ],
        englishTargets: ["I'm preparing for a new course this week.", "We're looking for a new apartment."],
        constraints: [
          'Please keep grammar explanation minimal and meaning-led.',
          'Please do not contrast every present tense or teach a full tense system.',
          'After a model, use a changed current situation for the learner-generated update.',
        ],
      },
      board: { type: 'examples', title: 'A current update', items: [{ title: "I'm / We're …-ing", body: 'something in progress now or around now' }] },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give one current-life situation and ask for a short update, then change to a different person/activity.',
        learnerTask: 'Give a short natural update about what is happening now or around now.',
        supportLadder: ['Explain the in-progress meaning in Arabic.', "Give I'm/We're …-ing only.", 'Model once, then change the activity.'],
      },
    },
    {
      id: 'polite-excuse-teach-use',
      title: 'Make a polite excuse without killing the conversation',
      goal: 'The learner can make a polite familiar excuse, give a brief reason when useful, and keep the social tone intact.',
      teaching: {
        explainInArabic: [
          'وضح إن excuse المهذبة مش مجرد “no”: اعتذار قصير + سبب بسيط لو مناسب + tone يحافظ على العلاقة.',
          'استخدم English examples صغيرة كموارد، وسيب المتعلم يختار صياغته الطبيعية.',
        ],
        englishTargets: ["I'm sorry, I can't make it tonight.", "I'd love to, but I have an early start tomorrow.", "Sorry, something came up."],
        constraints: [
          'Please accept natural polite equivalents; the examples are not a fixed script.',
          'Please avoid requiring elaborate excuses or personal disclosure.',
          'Use at least two changed social situations when practical before completing.',
        ],
      },
      board: {
        type: 'steps',
        title: 'A polite excuse',
        items: [
          { title: 'Acknowledge', body: "I'm sorry / I'd love to" },
          { title: 'Brief reason', body: 'only as much as the situation needs' },
          { title: 'Keep it warm', body: 'leave the relationship intact' },
        ],
      },
      interaction: {
        kind: 'roleplay',
        setup: 'Invite or ask the learner to join two different ordinary social activities. In one, make the timing easy; in the other, give a reason they plausibly need to decline.',
        learnerTask: 'Give a polite excuse and keep the exchange friendly.',
        supportLadder: ['Name the three functions in Arabic.', 'Offer a short opening such as I’m sorry… or I’d love to, but…', 'Model one excuse, then change the activity and reason for a fresh attempt.'],
      },
    },
    {
      id: 'follow-everyday-update-conversation',
      title: 'Follow a personal-news conversation even with one repetition',
      goal: 'The learner can follow an everyday conversation about personal news and identify the main update plus a key feeling or reason, with repetition available when genuinely needed.',
      teaching: {
        explainInArabic: ['وضح إن الهدف listening طبيعي: امسك الخبر الأساسي وإحساس أو سبب مهم، ومفيش مشكلة تطلب إعادة جزء لو احتجت.'],
        englishTargets: ['main personal update', 'key feeling or reason'],
        constraints: [
          'Please keep the dialogue non-idiomatic and at B1 familiar-topic difficulty.',
          'A requested repetition is allowed and should not be treated as failure.',
          'Please ask for the main update and one key feeling/reason rather than many tiny details.',
        ],
      },
      board: { type: 'steps', title: 'Listen for two things', items: [{ title: 'What changed?', body: 'the main personal update' }, { title: 'How / why?', body: 'one feeling or reason' }] },
      interaction: {
        kind: 'elicitation',
        setup: 'Give a short natural two-speaker-style everyday exchange about fresh personal news. Allow one natural repetition if requested, then ask for the update and one key feeling/reason.',
        learnerTask: 'Tell me the main update and one important feeling or reason you heard.',
        supportLadder: ['Repeat the whole exchange once slowly.', 'Repeat only the sentence containing the missing information.', 'Give two meaning choices, then use a new short exchange for the retry.'],
      },
    },
    {
      id: 'consonant-clarity-support',
      title: 'Keep key words clear enough to understand',
      goal: 'The learner can say selected L03 words or a short update intelligibly enough that key consonants do not obscure the intended word or message.',
      teaching: {
        explainInArabic: [
          'خلّي pronunciation هنا لخدمة الفهم فقط: اختار كلمة أو اتنين من الدرس حصل فيهم ambiguity فعلية، وركز على وضوح الكلمة جوه جملة قصيرة.',
        ],
        englishTargets: ['brave', 'break up', 'confident', 'respect'],
        constraints: [
          'Please do not run an accent lesson or demand native-like pronunciation.',
          'Please choose only one or two words that are actually useful for this learner rather than drilling the full list.',
          'Judge intelligibility in a meaningful short phrase or update, not isolated perfection.',
        ],
      },
      board: { type: 'note', title: 'Clear enough to understand', body: 'One or two useful words inside a real sentence — no accent imitation.' },
      interaction: {
        kind: 'micro_practice',
        setup: 'Choose one or two relevant L03 words, model them once only if needed, then place them in a short meaningful update and let the learner say their own version.',
        learnerTask: 'Say the short update clearly enough that the key word is easy to understand.',
        supportLadder: ['Slow the word slightly without exaggerating an accent.', 'Break only the difficult word into a small chunk if genuinely needed.', 'Model once, then return to a fresh meaningful sentence.'],
      },
    },
    {
      id: 'intonation-stance-support',
      title: 'Let your reaction sound like the stance you mean',
      goal: 'The learner can make the broad social stance of a short reaction easy to hear, such as warm interest, sympathy or mild disappointment, without an accent-performance requirement.',
      teaching: {
        explainInArabic: [
          'اربط intonation بالمعنى الاجتماعي: reaction للخبر الكويس مايبقاش بنفس tone خبر محبط، لكن من غير تقليد accent أو قياس phonetics بدقة.',
        ],
        englishTargets: ["That's great news!", "I'm sorry to hear that.", 'That sounds disappointing.'],
        constraints: [
          'Please focus on whether the intended stance is perceptible, not on a specific native contour.',
          'Please keep this inside short meaningful reactions rather than isolated pitch drills.',
        ],
      },
      board: { type: 'compare', title: 'Let the stance be heard', left: { title: 'Warm / positive', body: 'interest, happiness, encouragement' }, right: { title: 'Sympathetic / negative', body: 'care, disappointment, concern' } },
      interaction: {
        kind: 'micro_practice',
        setup: 'Give one ordinary positive update and one ordinary negative update. Let the learner react in their own words and keep the stance clear enough to fit each message.',
        learnerTask: 'React naturally so the listener can hear the stance you mean.',
        supportLadder: ['Name the stance in Arabic only.', 'Give one short reaction option without asking for imitation.', 'Model once, then change the news for a fresh reaction.'],
      },
    },
    {
      id: 'mixed-surprise-retrieval',
      title: 'Recover earlier L03 language without a checklist',
      goal: 'The learner can recover a phrase, a context word and a social reaction or excuse after a gap when fresh personal situations naturally call for them.',
      teaching: {
        explainInArabic: ['خليها conversation طبيعية فيها كام update جديد، ومن غير ما تسمي targets مسبقًا خلي الاحتياج يرجّع phrase وكلمة ورد فعل أو excuse.'],
        englishTargets: ['one earlier phrase', 'one earlier context word', 'one good/bad-news reaction or polite excuse'],
        constraints: [
          'Please do not announce this as a review or list the targets.',
          'Please create at least three meaningfully different retrieval moments.',
          'If an item needs answer-bearing support, create a later changed opportunity before counting it as recovered.',
        ],
      },
      interaction: {
        kind: 'guided_dialogue',
        setup: 'Run a short fresh exchange containing new personal news, a person-description moment and one social request or invitation. Let earlier language become useful naturally.',
        learnerTask: 'Keep responding naturally to what happens in the conversation.',
        supportLadder: ['Give the communicative meaning only.', 'Give a very light category or first-word cue.', 'Reveal one item if needed, then create a later fresh need for it or an equivalent target.'],
      },
    },
    {
      id: 'fresh-personal-update-transfer',
      title: 'Have a fresh personal-news conversation',
      goal: 'The learner can sustain a genuinely fresh personal-news conversation for several turns by sharing or responding to updates, expressing stance or feeling, following up, and using relevant L03 language naturally.',
      teaching: {
        explainInArabic: [
          'دي المحادثة الأساسية: افتح موضوع شخصي مألوف جديد تمامًا، وخلي الخبر والمشاعر والردود تتطور من الحوار نفسه من غير checklist ظاهرة.',
        ],
        englishTargets: ['fresh update', 'appropriate reaction', 'feeling or stance', 'natural follow-up', 'relevant L03 phrase/vocabulary when useful'],
        constraints: [
          'Please use a fresh context not used in the teaching examples and avoid reusing the earlier-lesson hobby vocabulary as the conversation identity.',
          'Keep a quiet internal map of the lesson language, but please do not tell the learner which words or phrases to use.',
          'Let the exchange run for several genuine learner turns and include both reacting to news and contributing a personal update or stance.',
          'If an important area still has weak evidence, create one more natural turn rather than turning the ending into a quiz.',
        ],
      },
      board: { type: 'note', title: 'Real conversation', body: 'Share the update · react to meaning · show your stance · keep it moving' },
      interaction: {
        kind: 'fresh_transfer',
        setup: 'Start a new familiar personal-life conversation around something like a change at work/study, moving home, a family update, a social plan or a recent result. Respond as a real conversation partner and let the learner both react and contribute.',
        learnerTask: 'Have the conversation naturally. Share, react, explain and follow up as the meaning develops.',
        supportLadder: ['Clarify the communicative situation in Arabic only.', 'Give a function cue such as reaction / feeling / follow-up, without target wording.', 'Model one tiny move only if necessary, then change the detail and return control to the learner.'],
      },
    },
  ],
};
