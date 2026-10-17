import type { SceneLessonDefinition } from '../types';
import type { TeachingBeat } from '../b1/teacherLabScript';
import type { LessonAudioPackage } from './listeningAudioPilot';

/** Isolated A1 U1-L01 v04 PREVIEW: no paid sound, no production enrolment, no owner acceptance.
 * Source: english-course PR #13, U1-L01-NATURAL-FIRST-CONTACT-v04.CANDIDATE.json.
 * Not an authority to move the seven source IDs or mark curriculum "ready".
 */
export const A1_U1_L01_V04_LESSON: SceneLessonDefinition = {
  "id": "a1-u1-l01-v04-review",
  "levelId": "a1",
  "unitId": "a1-u1-first-contact",
  "unitTitle": "First Contact: Me and You",
  "order": 1,
  "title": "Hello. I'm … · v04 review only",
  "subtitle": "Unreleased natural first-contact trial; recorded listening is unavailable until media approval.",
  "performance": "Meet someone new; greet, say and ask a name, handle wellbeing politely.",
  "coreLanguage": [
    "Hello / Hi",
    "Good morning",
    "I'm…",
    "My name is…",
    "What's your name?",
    "How are you?",
    "pretty good / really good",
    "Thank you",
    "excited / feeling"
  ],
  "boundaries": [
    "EDITORIAL REVIEW: not curriculum approval, no production progress or mastered source IDs.",
    "A1 Stage-07 scope; no photograph/advice/its/negative be inserted into source dialogue.",
    "Recorded source audio is REQUIRED and unavailable; do not simulate playback or silently skip listening.",
    "Source 12 decisions pending; seven rehomes are only proposals."
  ],
  "source": {
    "repository": "addvaluewithai-hub/english-course",
    "branch": "review/a1-u1-l01-source-scope-decision-brief-20261017",
    "path": "interactive-content-production/coverage/A1/U1-L01-NATURAL-FIRST-CONTACT-v04.CANDIDATE.json",
    "sourceLessonId": "U1-L01"
  },
  "scenes": [
    {
      "id": "s01-first-listen",
      "title": "First listening · تعرف على الموقف",
      "goal": "Understand the social situation from a heard two-person first contact.",
      "teaching": {
        "explainInArabic": [
          "هتسمع دلوقتي حوار قصير بين اتنين. ركّز في سبب كلامهم مع بعض، مش كل كلمة. مش لازم تفهم كل حاجة من أول مرة.",
          "اسمع الحوار كامل. ولو محتاج تسمعه تاني، استخدم زر إعادة الاستماع."
        ],
        "englishTargets": [
          "B01-neutral",
          "B01-listening",
          "B01-question"
        ],
        "constraints": [
          "Editorial v04 preview only; do not count source presence as mastery."
        ]
      },
      "interaction": {
        "kind": "elicitation",
        "setup": "Otti reads exactly named beats and asks the authored single choice after sound/text depending on scene.",
        "learnerTask": "الموقف الأساسي في الحوار إيه؟",
        "supportLadder": [
          "Re-read or replay only the relevant authored source",
          "Give a short Arabic explanation after attempting"
        ]
      },
      "activity": {
        "promptAr": "الموقف الأساسي في الحوار إيه؟",
        "options": [
          {
            "id": "talk-last-class",
            "text": "صاحبين بيتكلموا عن كلاس إنجليزي خلص"
          },
          {
            "id": "teacher-intro",
            "text": "مدرس بيشرح نظام الكلاس لطالب"
          },
          {
            "id": "new-classmates",
            "text": "اتنين بيتعرفوا على بعض قبل كلاس إنجليزي"
          }
        ],
        "correctOptionId": "new-classmates",
        "successAr": "صح. هما بيتعرفوا قبل كلاس إنجليزي. عرفت ده من سؤال الاسم وحديثهم عن الكلاس، مش من شكل البورد.",
        "retryAr": "هم بيتكلموا قبل بداية الكلاس، مش عن كلاس خلص. اسمع عبارة excited about our English class، وبعدين See you inside."
      }
    },
    {
      "id": "s02-greet-names",
      "title": "Good morning · التحية والاسم",
      "goal": "Recognize greetings, names, and the correct name question.",
      "teaching": {
        "explainInArabic": [
          "نسمع أول تلات جمل تاني، وبعدين ناخد التحية والاسم واحدة واحدة.",
          "Maya بدأت Good morning، تحية بنقولها الصبح. Leo رد Hi. الاتنين طرق طبيعية لبدء الكلام.",
          "Maya قالت I'm Maya، وLeo قال My name is Leo. الاتنين بيقولوا الاسم. I'm اختصار I am؛ مش محتاجين جدول قواعد كامل دلوقتي.",
          "Maya سألت What's your name? يعني اسمك إيه؟ عشان تسأل عن اسم حد، استخدم نفس السؤال؛ ولما تجاوب قول اسمك أنت."
        ],
        "englishTargets": [
          "B02-replay",
          "B02-greeting-arrow",
          "B02-two-name-cards",
          "B02-question-to-name",
          "B02-question"
        ],
        "constraints": [
          "Editorial v04 preview only; do not count source presence as mastery."
        ]
      },
      "interaction": {
        "kind": "micro_practice",
        "setup": "Otti reads exactly named beats and asks the authored single choice after sound/text depending on scene.",
        "learnerTask": "إنت عايز تسأل زميل جديد عن اسمه. هتقول إيه؟",
        "supportLadder": [
          "Re-read or replay only the relevant authored source",
          "Give a short Arabic explanation after attempting"
        ]
      },
      "activity": {
        "promptAr": "إنت عايز تسأل زميل جديد عن اسمه. هتقول إيه؟",
        "options": [
          {
            "id": "what-name",
            "text": "What's your name?"
          },
          {
            "id": "how-you",
            "text": "How are you?"
          },
          {
            "id": "name-of-teacher",
            "text": "What's the teacher's name?"
          }
        ],
        "correctOptionId": "what-name",
        "successAr": "بالضبط. What's your name? معناها اسمك إيه؟ وبعدها ممكن الشخص يقول I'm Sara أو My name is Sara.",
        "retryAr": "How are you? معناها إزيك، مش اسمك إيه. سؤال الاسم هو What's your name?"
      }
    },
    {
      "id": "s03-wellbeing",
      "title": "How are you? · السؤال عن الحال",
      "goal": "Distinguish basic polite wellbeing replies and first-day excitement.",
      "teaching": {
        "explainInArabic": [
          "نسمع تاني الجزء اللي بيسألوا فيه عن الحال. اسمع رد Leo ورد Maya، وبعدين هنفهم الفرق.",
          "How are you? يعني إزيك؟ السؤال هنا عن حالك، مش عن اسمك.",
          "Leo رد Pretty good, thanks؛ يعني كويس إلى حد كبير، شكرًا. Maya قالت Really good, thank you؛ يعني كويسة جدًا، شكرًا. دي ردود طبيعية، مش درجات لازم تحفظ ترتيبها.",
          "Leo قال I'm feeling excited about our English class، يعني أنا حاسس بحماس للكلاس. Maya كمان قالت I'm excited, too. Excited إحساس بالحماس، وfeeling هنا بمعنى حاسس.",
          "Thanks وThank you للتعبير عن الشكر. وAnd you? بترجع نفس السؤال للشخص التاني."
        ],
        "englishTargets": [
          "B03-unlabelled-two-bubbles",
          "B03-question-to-two-bubbles",
          "B03-pretty-vs-really",
          "B03-person-feeling",
          "B03-polite-return",
          "B03-question"
        ],
        "constraints": [
          "Editorial v04 preview only; do not count source presence as mastery."
        ]
      },
      "interaction": {
        "kind": "micro_practice",
        "setup": "Otti reads exactly named beats and asks the authored single choice after sound/text depending on scene.",
        "learnerTask": "زميلة بتقول Really good, thank you. هي تقصد إيه؟",
        "supportLadder": [
          "Re-read or replay only the relevant authored source",
          "Give a short Arabic explanation after attempting"
        ]
      },
      "activity": {
        "promptAr": "زميلة بتقول Really good, thank you. هي تقصد إيه؟",
        "options": [
          {
            "id": "name-good",
            "text": "هي بتقول إنها كويسة شوية، لكن مش قوي"
          },
          {
            "id": "feels-very-good",
            "text": "هي بتقول إنها كويسة جدًا وبتشكره"
          },
          {
            "id": "asks-about-you",
            "text": "هي بتسأله هو عامل إيه"
          }
        ],
        "correctOptionId": "feels-very-good",
        "successAr": "مظبوط. Really good هنا معناها إني كويسة جدًا، وThank you للشكر. الرد مش سؤال عن الاسم.",
        "retryAr": "Pretty good معناها كويس إلى حد كبير، لكن Really good أقوى وبتعني كويس جدًا."
      }
    },
    {
      "id": "s04-reading-note",
      "title": "Read a note · قراءة قصيرة",
      "goal": "Read a new short classroom note and understand yourself.",
      "teaching": {
        "explainInArabic": [
          "دلوقتي في ورقة قصيرة من الكلاس. اقراها بنفسك من غير ما أقولك محتواها، وبعدها جاوب."
        ],
        "englishTargets": [
          "B04-actual-written-note",
          "B04-note-question"
        ],
        "constraints": [
          "Editorial v04 preview only; do not count source presence as mastery."
        ]
      },
      "interaction": {
        "kind": "micro_practice",
        "setup": "Otti reads exactly named beats and asks the authored single choice after sound/text depending on scene.",
        "learnerTask": "الورقة بتقول Introduce yourself. مين المفروض يعرّف بنفسه؟",
        "supportLadder": [
          "Re-read or replay only the relevant authored source",
          "Give a short Arabic explanation after attempting"
        ]
      },
      "activity": {
        "promptAr": "الورقة بتقول Introduce yourself. مين المفروض يعرّف بنفسه؟",
        "options": [
          {
            "id": "new-classmate",
            "text": "زميل تاني هيعرّفك بالناس"
          },
          {
            "id": "the-teacher",
            "text": "المدرس بس هو اللي هيعرّف بنفسه"
          },
          {
            "id": "you",
            "text": "أنت هتعرّف بنفسك لشخص تاني"
          }
        ],
        "correctOptionId": "you",
        "successAr": "صح. Introduce yourself يعني عرّف بنفسك أنت. الورقة بتطلب منك تقول اسمك لشخص تاني.",
        "retryAr": "التعليمات بتقول yourself؛ المقصود أنت اللي تعرّف بنفسك، مش حد يعملها بدالك."
      }
    },
    {
      "id": "s05-short-variant",
      "title": "Another reply · رد جديد",
      "goal": "Recognize a simple alternative wellbeing response without making it a productive goal.",
      "teaching": {
        "explainInArabic": [
          "فيه رد طبيعي تاني لسؤال How are you؟ اسمع الجملة دي: I'm tired today. وخمّن معناها."
        ],
        "englishTargets": [
          "B05-no-emotion-answer",
          "B05-question"
        ],
        "constraints": [
          "Editorial v04 preview only; do not count source presence as mastery."
        ]
      },
      "interaction": {
        "kind": "micro_practice",
        "setup": "Otti reads exactly named beats and asks the authored single choice after sound/text depending on scene.",
        "learnerTask": "حد قال I'm tired today. ده معناه إيه؟",
        "supportLadder": [
          "Re-read or replay only the relevant authored source",
          "Give a short Arabic explanation after attempting"
        ]
      },
      "activity": {
        "promptAr": "حد قال I'm tired today. ده معناه إيه؟",
        "options": [
          {
            "id": "low-energy",
            "text": "حاسس بتعب ومحتاج راحة"
          },
          {
            "id": "very-excited",
            "text": "حاسس بحماس شديد"
          },
          {
            "id": "feels-fine",
            "text": "كويس إلى حد كبير"
          }
        ],
        "correctOptionId": "low-energy",
        "successAr": "بالضبط. Tired يعني تعبان أو محتاج راحة. ده رد ممكن تسمعه على How are you؟",
        "retryAr": "Excited معناها متحمس. Tired معناها تعبان."
      }
    },
    {
      "id": "s06-pronunciation",
      "title": "Listen and repeat · النطق",
      "goal": "Hear/repeat question rhythm; MC recognition does not certify pronunciation.",
      "teaching": {
        "explainInArabic": [
          "اسمع نبرة How are you? زي ما اتقالت في التسجيل، وخد بالك من إيقاع الكلمات. نبرة السؤال مش لازم تكون طالعة دايمًا. بعدها جرّب تقولها بصوتك لو الميكروفون متاح.",
          "دلوقتي قول How are you? وسجّل المحاولة لو الميكروفون شغال. بعد كده جرّب Thanks بنبرة لطيفة. مش هسجل إتقان نطق من مجرد ضغط زر."
        ],
        "englishTargets": [
          "B06-question-contour",
          "B06-intonation-active"
        ],
        "constraints": [
          "Editorial v04 preview only; do not count source presence as mastery."
        ]
      },
      "interaction": {
        "kind": "micro_practice",
        "setup": "Otti reads exactly named beats and asks the authored single choice after sound/text depending on scene.",
        "learnerTask": "How are you? معناها أنهي سؤال؟",
        "supportLadder": [
          "Re-read or replay only the relevant authored source",
          "Give a short Arabic explanation after attempting"
        ]
      },
      "activity": {
        "promptAr": "How are you? معناها أنهي سؤال؟",
        "options": [
          {
            "id": "what-is-name",
            "text": "اسمك إيه؟"
          },
          {
            "id": "what-is-feeling",
            "text": "إزيك؟"
          },
          {
            "id": "when-class",
            "text": "الكلاس إمتى؟"
          }
        ],
        "correctOptionId": "what-is-feeling",
        "successAr": "تمام، How are you? معناها إزيك. دلوقتي جرّب تنطق السؤال بنفسك.",
        "retryAr": "How are you? بنسأل بيها عن الحال. هي مش سؤال عن الاسم أو الوقت."
      }
    },
    {
      "id": "s07-new-speaking",
      "title": "Your turn · محادثة جديدة",
      "goal": "Greet a different person, exchange names, and use polite wellbeing in natural spoken turns.",
      "teaching": {
        "explainInArabic": [
          "هتقابل زميل جديد اسمه Sam في صباح يوم مختلف. اتكلم معاه بالإنجليزي من غير جمل جاهزة على البورد: سلّم، عرّف بنفسك، اسأل عن اسمه وحاله، ورد بأدب.",
          "بعد التعارف، هنجرب مواقف قصيرة جديدة: زميل بيسألك عن حالك قبل الكلاس، وبعد الكلاس، وبعدها عن إحساسك باليوم. كل مرة تجاوب بطريقتك."
        ],
        "englishTargets": [
          "Good morning",
          "How are you?",
          "pretty good",
          "really good",
          "Thank you",
          "excited",
          "feeling"
        ],
        "constraints": [
          "Editorial v04 preview only; do not count source presence as mastery."
        ]
      },
      "interaction": {
        "kind": "fresh_transfer",
        "setup": "Role-play Sam: a new classmate meeting the learner in the morning, then a second changed after-class moment to elicit different positive replies and feelings. Never award seven exact phrase targets from generic completion.",
        "learnerTask": "Introduce yourself, ask Sam's name and wellbeing, answer politely, and respond to distinct after-class feeling prompts.",
        "teacherMoves": [
          "Pause and allow learner initiative",
          "Ask a relevant question without model answer",
          "Do not pass silence, Okay-only or Bye loop"
        ],
        "supportLadder": [
          "One small function hint",
          "One spoken model, then retry without it"
        ]
      }
    }
  ]
};
export const A1_V04_BEATS: Readonly<Record<string,readonly TeachingBeat[]>> = {
  "s01-first-listen": [
    {
      "id": "neutral-instruction",
      "line": "هتسمع دلوقتي حوار قصير بين اتنين. ركّز في سبب كلامهم مع بعض، مش كل كلمة. مش لازم تفهم كل حاجة من أول مرة.",
      "board": {
        "type": "note",
        "title": "Listen first",
        "body": "اسمع قبل ما تختار. محتوى التسجيل مش ظاهر."
      }
    },
    {
      "id": "play-full",
      "line": "اسمع الحوار كامل. ولو محتاج تسمعه تاني، استخدم زر إعادة الاستماع.",
      "board": {
        "type": "note",
        "title": "Audio active",
        "body": "اسمع قبل ما تختار. محتوى التسجيل مش ظاهر."
      },
      "audioClipId": "full-conversation"
    },
    {
      "id": "gist-choice",
      "line": "دلوقتي اختار وصف الموقف اللي سمعته. الإجابة مش موجودة على البورد.",
      "board": {
        "type": "note",
        "title": "What is happening?",
        "body": "فكر في الموقف واختار من الإجابات بعد ما تخلص الشرح."
      }
    }
  ],
  "s02-greet-names": [
    {
      "id": "replay-intro",
      "line": "نسمع أول تلات جمل تاني، وبعدين ناخد التحية والاسم واحدة واحدة.",
      "board": {
        "type": "note",
        "title": "Hear greetings",
        "body": "Two unnamed speech bubbles with playback indicator; no word labels before replay."
      },
      "audioClipId": "greetings-names"
    },
    {
      "id": "greet",
      "line": "Maya بدأت Good morning، تحية بنقولها الصبح. Leo رد Hi. الاتنين طرق طبيعية لبدء الكلام.",
      "board": {
        "type": "note",
        "title": "Morning greeting",
        "body": "Sunrise icon by Maya; greeting arrow to Leo; reveal Good morning and Hi only with Otti narration."
      }
    },
    {
      "id": "give-name",
      "line": "Maya قالت I'm Maya، وLeo قال My name is Leo. الاتنين بيقولوا الاسم. I'm اختصار I am؛ مش محتاجين جدول قواعد كامل دلوقتي.",
      "board": {
        "type": "note",
        "title": "Names",
        "body": "Identity badges with Maya / Leo and their distinct I'm / My name is expressions."
      }
    },
    {
      "id": "ask-name",
      "line": "Maya سألت What's your name? يعني اسمك إيه؟ عشان تسأل عن اسم حد، استخدم نفس السؤال؛ ولما تجاوب قول اسمك أنت.",
      "board": {
        "type": "note",
        "title": "Name question",
        "body": "What's your name? points to empty learner name slot, not an already chosen correct answer."
      }
    },
    {
      "id": "name-choice",
      "line": "جرّب تميّز سؤال الاسم عن سؤال الحال في موقف مختلف.",
      "board": {
        "type": "note",
        "title": "Choose question",
        "body": "فكر في الموقف واختار من الإجابات بعد ما تخلص الشرح."
      }
    }
  ],
  "s03-wellbeing": [
    {
      "id": "replay-how",
      "line": "نسمع تاني الجزء اللي بيسألوا فيه عن الحال. اسمع رد Leo ورد Maya، وبعدين هنفهم الفرق.",
      "board": {
        "type": "note",
        "title": "Listen for replies",
        "body": "Question symbol plus two blank speaker-answer bubbles during replay, no pretty/really labels yet."
      },
      "audioClipId": "wellbeing"
    },
    {
      "id": "how-question",
      "line": "How are you? يعني إزيك؟ السؤال هنا عن حالك، مش عن اسمك.",
      "board": {
        "type": "note",
        "title": "How are you",
        "body": "How are you? question and arrows to two possible replies; answer text still hidden until next beat."
      }
    },
    {
      "id": "two-replies",
      "line": "Leo رد Pretty good, thanks؛ يعني كويس إلى حد كبير، شكرًا. Maya قالت Really good, thank you؛ يعني كويسة جدًا، شكرًا. دي ردود طبيعية، مش درجات لازم تحفظ ترتيبها.",
      "board": {
        "type": "note",
        "title": "Two natural replies",
        "body": "Leo pretty good, thanks versus Maya really good, thank you. No ranked mastery meter."
      }
    },
    {
      "id": "feeling-excited",
      "line": "Leo قال I'm feeling excited about our English class، يعني أنا حاسس بحماس للكلاس. Maya كمان قالت I'm excited, too. Excited إحساس بالحماس، وfeeling هنا بمعنى حاسس.",
      "board": {
        "type": "note",
        "title": "Excited about class",
        "body": "Single student's speech and class icon with 'I'm feeling excited'; show Maya's 'I'm excited, too' as response."
      }
    },
    {
      "id": "thank-you",
      "line": "Thanks وThank you للتعبير عن الشكر. وAnd you? بترجع نفس السؤال للشخص التاني.",
      "board": {
        "type": "note",
        "title": "Polite answer",
        "body": "Speech exchange: Thanks/Thank you then And you? return arrow."
      }
    },
    {
      "id": "wellbeing-choice",
      "line": "دلوقتي اختار معنى رد مناسب في موقف جديد.",
      "board": {
        "type": "note",
        "title": "How is she?",
        "body": "فكر في الموقف واختار من الإجابات بعد ما تخلص الشرح."
      }
    }
  ],
  "s04-reading-note": [
    {
      "id": "read-silently",
      "line": "دلوقتي في ورقة قصيرة من الكلاس. اقراها بنفسك من غير ما أقولك محتواها، وبعدها جاوب.",
      "board": {
        "type": "note",
        "title": "Class note",
        "body": "WELCOME TO ENGLISH CLASS\nMeet new people.\nWrite your name on this card.\nIntroduce yourself to one person.\nThank you!"
      }
    },
    {
      "id": "reading-choice",
      "line": "اختار مين المطلوب منه يعرّف بنفسه حسب التعليمات المكتوبة.",
      "board": {
        "type": "note",
        "title": "Read and choose",
        "body": "فكر في الموقف واختار من الإجابات بعد ما تخلص الشرح."
      }
    }
  ],
  "s05-short-variant": [
    {
      "id": "tired-variant",
      "line": "فيه رد طبيعي تاني لسؤال How are you؟ اسمع الجملة دي: I'm tired today. وخمّن معناها.",
      "board": {
        "type": "note",
        "title": "Hear tired",
        "body": "اسمع الجملة من Otti قبل ما تختار المعنى."
      }
    },
    {
      "id": "tired-choice",
      "line": "اختار المعنى المناسب للجملة القصيرة اللي سمعتها.",
      "board": {
        "type": "note",
        "title": "Tired meaning",
        "body": "فكر في الموقف واختار من الإجابات بعد ما تخلص الشرح."
      }
    }
  ],
  "s06-pronunciation": [
    {
      "id": "listen-question",
      "line": "اسمع نبرة How are you? زي ما اتقالت في التسجيل، وخد بالك من إيقاع الكلمات. نبرة السؤال مش لازم تكون طالعة دايمًا. بعدها جرّب تقولها بصوتك لو الميكروفون متاح.",
      "board": {
        "type": "note",
        "title": "Natural question rhythm",
        "body": "A modest stress/rhythm line tied to a REVIEWED audible clip, not an invented always-rising pitch contour; WH questions like How are you? often fall naturally."
      },
      "audioClipId": "how-are-you-question"
    },
    {
      "id": "student-repeat",
      "line": "دلوقتي قول How are you? وسجّل المحاولة لو الميكروفون شغال. بعد كده جرّب Thanks بنبرة لطيفة. مش هسجل إتقان نطق من مجرد ضغط زر.",
      "board": {
        "type": "note",
        "title": "Your spoken attempt",
        "body": "Microphone readiness status, question text optionally once playback ended; no artificial pass confetti."
      }
    }
  ],
  "s07-new-speaking": [
    {
      "id": "new-person",
      "line": "هتقابل زميل جديد اسمه Sam في صباح يوم مختلف. اتكلم معاه بالإنجليزي من غير جمل جاهزة على البورد: سلّم، عرّف بنفسك، اسأل عن اسمه وحاله، ورد بأدب.",
      "board": null
    },
    {
      "id": "changed-moments",
      "line": "بعد التعارف، هنجرب مواقف قصيرة جديدة: زميل بيسألك عن حالك قبل الكلاس، وبعد الكلاس، وبعدها عن إحساسك باليوم. كل مرة تجاوب بطريقتك.",
      "board": null
    }
  ]
};
export const A1_V04_FEEDBACK: Readonly<Record<string,{correct:string;wrong:string;wrongByOption?:Record<string,string>}>> = {
  "s01-first-listen": {
    "correct": "صح. هما بيتعرفوا قبل كلاس إنجليزي. عرفت ده من سؤال الاسم وحديثهم عن الكلاس، مش من شكل البورد.",
    "wrong": "هم بيتكلموا قبل بداية الكلاس، مش عن كلاس خلص. اسمع عبارة excited about our English class، وبعدين See you inside.",
    "wrongByOption": {
      "talk-last-class": "هم بيتكلموا قبل بداية الكلاس، مش عن كلاس خلص. اسمع عبارة excited about our English class، وبعدين See you inside.",
      "teacher-intro": "الاتنين بيتعرفوا على بعض كزمايل، ومفيش حد فيهم بيشرح الكلاس. اسمع What's your name? وMy name is Leo."
    }
  },
  "s02-greet-names": {
    "correct": "بالضبط. What's your name? معناها اسمك إيه؟ وبعدها ممكن الشخص يقول I'm Sara أو My name is Sara.",
    "wrong": "How are you? معناها إزيك، مش اسمك إيه. سؤال الاسم هو What's your name?",
    "wrongByOption": {
      "how-you": "How are you? معناها إزيك، مش اسمك إيه. سؤال الاسم هو What's your name?",
      "name-of-teacher": "What's the teacher's name? بيسأل عن اسم المدرس، مش الشخص اللي قدامك. قول What's your name?"
    }
  },
  "s03-wellbeing": {
    "correct": "مظبوط. Really good هنا معناها إني كويسة جدًا، وThank you للشكر. الرد مش سؤال عن الاسم.",
    "wrong": "Pretty good معناها كويس إلى حد كبير، لكن Really good أقوى وبتعني كويس جدًا.",
    "wrongByOption": {
      "name-good": "Pretty good معناها كويس إلى حد كبير، لكن Really good أقوى وبتعني كويس جدًا.",
      "asks-about-you": "الجملة رد عن حالها، مش سؤال. السؤال نفسه How are you?"
    }
  },
  "s04-reading-note": {
    "correct": "صح. Introduce yourself يعني عرّف بنفسك أنت. الورقة بتطلب منك تقول اسمك لشخص تاني.",
    "wrong": "التعليمات بتقول yourself؛ المقصود أنت اللي تعرّف بنفسك، مش حد يعملها بدالك.",
    "wrongByOption": {
      "new-classmate": "التعليمات بتقول yourself؛ المقصود أنت اللي تعرّف بنفسك، مش حد يعملها بدالك.",
      "the-teacher": "المطلوب منك أنت، مش من المدرس فقط. كلمة yourself هنا بتشير لنفس الشخص اللي بياخد التعليمات."
    }
  },
  "s05-short-variant": {
    "correct": "بالضبط. Tired يعني تعبان أو محتاج راحة. ده رد ممكن تسمعه على How are you؟",
    "wrong": "Excited معناها متحمس. Tired معناها تعبان.",
    "wrongByOption": {
      "very-excited": "Excited معناها متحمس. Tired معناها تعبان.",
      "feels-fine": "Pretty good معناها كويس، أما tired معناها تعبان أو مجهد."
    }
  },
  "s06-pronunciation": {
    "correct": "تمام، How are you? معناها إزيك. دلوقتي جرّب تنطق السؤال بنفسك.",
    "wrong": "How are you? بنسأل بيها عن الحال. هي مش سؤال عن الاسم أو الوقت."
  }
};
export const A1_U1_L01_V04_AUDIO: LessonAudioPackage = {
  "lessonId": "a1-u1-l01-v04-review",
  "factoryJobId": "NOT-COMMISSIONED-v04-editorial-review",
  "audioUrl": null,
  "transcriptUrl": null,
  "vttUrl": null,
  "approved": false,
  "turns": [
    {
      "id": "t01",
      "speaker": "maya",
      "english": "Good morning! I'm Maya. What's your name?"
    },
    {
      "id": "t02",
      "speaker": "leo",
      "english": "Hi! My name is Leo."
    },
    {
      "id": "t03",
      "speaker": "maya",
      "english": "Nice to meet you, Leo. How are you?"
    },
    {
      "id": "t04",
      "speaker": "leo",
      "english": "Pretty good, thanks. I'm feeling excited about our English class. And you?"
    },
    {
      "id": "t05",
      "speaker": "maya",
      "english": "Really good, thank you. I'm excited, too."
    },
    {
      "id": "t06",
      "speaker": "leo",
      "english": "Great! Is this your first class?"
    },
    {
      "id": "t07",
      "speaker": "maya",
      "english": "Yes, it is. See you inside!"
    },
    {
      "id": "t08",
      "speaker": "leo",
      "english": "See you, Maya!"
    }
  ],
  "clips": [
    {
      "id": "full-conversation",
      "turnIds": [
        "t01",
        "t02",
        "t03",
        "t04",
        "t05",
        "t06",
        "t07",
        "t08"
      ],
      "explanation": "V04 candidate, source-audio unavailable until paid WAV approval"
    },
    {
      "id": "greetings-names",
      "turnIds": [
        "t01",
        "t02",
        "t03"
      ],
      "explanation": "V04 candidate, source-audio unavailable until paid WAV approval"
    },
    {
      "id": "wellbeing",
      "turnIds": [
        "t03",
        "t04",
        "t05"
      ],
      "explanation": "V04 candidate, source-audio unavailable until paid WAV approval"
    },
    {
      "id": "closing",
      "turnIds": [
        "t06",
        "t07",
        "t08"
      ],
      "explanation": "V04 candidate, source-audio unavailable until paid WAV approval"
    },
    {
      "id": "how-are-you-question",
      "turnIds": [
        "t03"
      ],
      "explanation": "V04 candidate, source-audio unavailable until paid WAV approval"
    }
  ]
};
