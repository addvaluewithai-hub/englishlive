export interface LearnV2GuidedStep {
  partnerIntentEn: string;
  partnerExampleEn: string;
  learnerCardEn: string;
  noteAr?: string;
}

export interface LearnV2GuidedConversation {
  scenarioId: string;
  titleAr: string;
  introAr: string;
  steps: LearnV2GuidedStep[];
  closingMoveEn: string;
}

export const LEARN_V2_A1_GUIDED_CONVERSATIONS: LearnV2GuidedConversation[] = [
  {
    scenarioId: 'learn-v2-a1-u1-l01',
    titleAr: 'أول تعارف — مع كروت مساعدة',
    introAr: 'اسمع Otti، وبعد كل turn اقرأ الكارت الصغير بصوتك. غيّر أي حاجة بين [ ] عشان تناسبك — وممكن تستخدم معلومات خيالية.',
    steps: [
      {
        partnerIntentEn: 'Give only a short friendly morning greeting.',
        partnerExampleEn: 'Hi! Good morning.',
        learnerCardEn: "Hi! I’m [your name]. What’s your name?",
      },
      {
        partnerIntentEn: 'Give your first name, acknowledge the introduction, then ask how the learner is.',
        partnerExampleEn: 'I’m Sam. Nice to meet you. How are you?',
        learnerCardEn: 'I’m [good / fine / okay], thanks. How are you?',
      },
    ],
    closingMoveEn: 'I’m good, thanks. Nice meeting you!',
  },
  {
    scenarioId: 'learn-v2-a1-u1-l02',
    titleAr: 'العمر — مع كروت مساعدة',
    introAr: 'الجولة دي قصيرة جدًا: اسأل عن العمر وبعدين قول عمر حقيقي أو خيالي. اللي بين [ ] إنت اللي تختاره.',
    steps: [
      {
        partnerIntentEn: 'Greet and give only your first name.',
        partnerExampleEn: 'Hi! I’m Sam.',
        learnerCardEn: 'Hi! I’m [your name]. How old are you?',
      },
      {
        partnerIntentEn: 'Say you are nineteen, then ask the learner age.',
        partnerExampleEn: 'I’m nineteen. What about you?',
        learnerCardEn: 'I’m [your age].',
        noteAr: 'ممكن تختار أي عمر خيالي لو مش حابب تقول عمرك الحقيقي.',
      },
    ],
    closingMoveEn: 'Nice! Thanks.',
  },
  {
    scenarioId: 'learn-v2-a1-u1-l03',
    titleAr: 'منين وعايش فين — مع كروت مساعدة',
    introAr: 'هنتدرّب على الفرق بين بلد الأصل ومكان السكن. استخدم أماكن حقيقية أو خيالية براحتك.',
    steps: [
      {
        partnerIntentEn: 'Give a friendly greeting and invite a basic first-contact response without giving origin or residence yet.',
        partnerExampleEn: 'Hi! Nice to meet you.',
        learnerCardEn: 'Hi! Where are you from?',
      },
      {
        partnerIntentEn: 'Say you are from Morocco, then ask where the learner is from.',
        partnerExampleEn: 'I’m from Morocco. Where are you from?',
        learnerCardEn: 'I’m from [your country]. Where do you live?',
      },
      {
        partnerIntentEn: 'Say you live in Cairo, then ask where the learner lives.',
        partnerExampleEn: 'I live in Cairo. What about you?',
        learnerCardEn: 'I live in [your city].',
      },
    ],
    closingMoveEn: 'Nice. Good to meet you!',
  },
  {
    scenarioId: 'learn-v2-a1-u1-l04',
    titleAr: 'الشغل أو الدراسة — مع كروت مساعدة',
    introAr: 'اختار شغل أو دراسة حقيقية أو خيالية. الهدف هو الـpattern، مش بياناتك الشخصية.',
    steps: [
      {
        partnerIntentEn: 'Greet naturally and give your first name only.',
        partnerExampleEn: 'Hi! I’m Alex.',
        learnerCardEn: 'Hi! What do you do?',
      },
      {
        partnerIntentEn: 'Say you are a graphic designer, then ask what the learner does.',
        partnerExampleEn: 'I’m a graphic designer. What about you?',
        learnerCardEn: 'I’m a [your job]. / I study [your subject].',
        noteAr: 'اختار الجملة اللي تناسبك، أو اختر role خيالي.',
      },
    ],
    closingMoveEn: 'Nice. Thanks for telling me!',
  },
  {
    scenarioId: 'learn-v2-a1-u1-l05',
    titleAr: 'Contact details وrepair — مع كروت مساعدة',
    introAr: 'كل البيانات هنا خيالية. هنتدرّب إنك ما تخمّنش: اطلب repeat أو spelling لما detail تبقى مش واضحة.',
    steps: [
      {
        partnerIntentEn: 'Explain briefly that the details are fictional, then give the fictional email sam.nassar@example.com at a natural pace without spelling Nassar.',
        partnerExampleEn: 'We can use made-up details. My email is sam dot nassar at example dot com.',
        learnerCardEn: 'Sorry, can you say that again?',
      },
      {
        partnerIntentEn: 'Repeat the fictional email, still without spelling the surname.',
        partnerExampleEn: 'Sure. Sam dot Nassar at example dot com.',
        learnerCardEn: 'How do you spell Nassar?',
      },
      {
        partnerIntentEn: 'Spell Nassar clearly, one letter at a time.',
        partnerExampleEn: 'N-A-S-S-A-R.',
        learnerCardEn: 'Thanks. My email is [a made-up email].',
        noteAr: 'استخدم أي email خيالي — مش مطلوب بيانات حقيقية.',
      },
    ],
    closingMoveEn: 'Got it. Thanks!',
  },
  {
    scenarioId: 'learn-v2-a1-u1-l06',
    titleAr: 'لقاء اجتماعي — مع كروت مساعدة',
    introAr: 'هتشوف introduction وخبر كويس وخبر مش لطيف وclosing. اقرأ reaction المناسبة بصوتك.',
    steps: [
      {
        partnerIntentEn: 'Introduce your friend Lina in one short social line.',
        partnerExampleEn: 'Hi! This is my friend Lina.',
        learnerCardEn: 'Hi, Lina. Nice to meet you.',
      },
      {
        partnerIntentEn: 'Share simple good news about Lina getting a new job.',
        partnerExampleEn: 'Lina got a new job today!',
        learnerCardEn: 'That’s great!',
      },
      {
        partnerIntentEn: 'Add a small negative update: Lina is worried because her first day starts very early.',
        partnerExampleEn: 'She’s happy, but she’s a little worried about her first day.',
        learnerCardEn: 'Oh no. I’m sorry.',
      },
      {
        partnerIntentEn: 'Say you need to leave now.',
        partnerExampleEn: 'We have to go now.',
        learnerCardEn: 'See you!',
      },
    ],
    closingMoveEn: 'See you!',
  },
  {
    scenarioId: 'learn-v2-a1-u1-l07',
    titleAr: 'Profile transfer — مع كروت مساعدة',
    introAr: 'دي مراجعة للوحدة كلها. اسأل فقط عن المعلومات الناقصة، واعمل repair مرة بدل ما تخمّن.',
    steps: [
      {
        partnerIntentEn: 'Say you have a new fictional profile card with some missing details. Do not volunteer the profile yet.',
        partnerExampleEn: 'I’ve got a new profile card, but some details are missing.',
        learnerCardEn: 'What’s your name?',
      },
      {
        partnerIntentEn: 'Say your fictional name is Sara and you are from Jordan. Do not give residence yet.',
        partnerExampleEn: 'I’m Sara. I’m from Jordan.',
        learnerCardEn: 'Where do you live?',
      },
      {
        partnerIntentEn: 'Say you live in Cairo and work as a designer. Do not volunteer contact details yet.',
        partnerExampleEn: 'I live in Cairo. I work as a designer.',
        learnerCardEn: 'What’s your email address?',
      },
      {
        partnerIntentEn: 'Give the fictional email sara.nabil@example.com without spelling Nabil.',
        partnerExampleEn: 'It’s sara dot nabil at example dot com.',
        learnerCardEn: 'Sorry, how do you spell Nabil?',
      },
      {
        partnerIntentEn: 'Spell Nabil clearly.',
        partnerExampleEn: 'N-A-B-I-L.',
        learnerCardEn: 'So, you’re Sara, you live in Cairo, and you’re a designer.',
      },
    ],
    closingMoveEn: 'Exactly. You got it!',
  },
  {
    scenarioId: 'learn-v2-a1-u2-l01',
    titleAr: 'Family — مع كروت مساعدة',
    introAr: 'استخدم family حقيقية أو خيالية. اللي بين [ ] placeholders عشان تتدرّب على الشكل من غير ما نثبت أي بيانات عنك.',
    steps: [
      {
        partnerIntentEn: 'Ask one simple question about brothers or sisters.',
        partnerExampleEn: 'Have you got any brothers or sisters?',
        learnerCardEn: 'I’ve got [number] [brother / brothers / sister / sisters]. What about you?',
      },
      {
        partnerIntentEn: 'Say you have one brother, then ask who the learner lives with.',
        partnerExampleEn: 'I’ve got one brother. Who do you live with?',
        learnerCardEn: 'I live with [a family member / people you choose].',
        noteAr: 'ممكن تعمل family خيالية بالكامل.',
      },
    ],
    closingMoveEn: 'Nice. Thanks for sharing!',
  },
  {
    scenarioId: 'learn-v2-a1-u2-l02',
    titleAr: 'مين الشخص؟ — مع كروت مساعدة',
    introAr: 'دي receptive practice. اسمع الـclues، والكارت هيوريك شكل إجابة بسيط. الأسماء هنا شخصيات التمرين، مش بيانات شخصية.',
    steps: [
      {
        partnerIntentEn: 'Describe Omar from the lesson roster without saying his name: age 30, driver, tall, glasses. Then ask who it is.',
        partnerExampleEn: 'This person is thirty, works as a driver, is tall, and has glasses. Who is it?',
        learnerCardEn: 'I think it’s Omar.',
      },
      {
        partnerIntentEn: 'Describe Lina from the lesson roster without saying her name: age 22, student, short hair. Then ask who it is.',
        partnerExampleEn: 'This person is twenty-two, is a student, and has short hair. Who is it?',
        learnerCardEn: 'I think it’s Lina.',
      },
    ],
    closingMoveEn: 'Exactly. Nice listening!',
  },
  {
    scenarioId: 'learn-v2-a1-u2-l03',
    titleAr: 'Mystery profile — مع كروت مساعدة',
    introAr: 'هتسأل عن شخص تالت وبعدين تربط معلومتين. الـprofile نفسه خيالي وثابت داخل التمرين.',
    steps: [
      {
        partnerIntentEn: 'Say you are thinking of a woman named Maya and invite the learner to discover her profile.',
        partnerExampleEn: 'I’m thinking of a woman named Maya. Ask me about her.',
        learnerCardEn: 'How old is she?',
      },
      {
        partnerIntentEn: 'Say Maya is twenty-five. Do not add other profile facts.',
        partnerExampleEn: 'She’s twenty-five.',
        learnerCardEn: 'Where does she live?',
      },
      {
        partnerIntentEn: 'Say Maya lives in Alexandria. Do not add her job yet.',
        partnerExampleEn: 'She lives in Alexandria.',
        learnerCardEn: 'What does she do?',
      },
      {
        partnerIntentEn: 'Say Maya is a teacher.',
        partnerExampleEn: 'She’s a teacher.',
        learnerCardEn: 'She’s twenty-five and she lives in Alexandria.',
      },
    ],
    closingMoveEn: 'Exactly. That’s her profile!',
  },
];

const GUIDED_BY_SCENARIO_ID = new Map(
  LEARN_V2_A1_GUIDED_CONVERSATIONS.map((conversation) => [conversation.scenarioId, conversation]),
);

export function learnV2GuidedConversationByScenarioId(id?: string) {
  return id ? GUIDED_BY_SCENARIO_ID.get(id) : undefined;
}
