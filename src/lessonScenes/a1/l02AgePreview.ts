import type { SceneLessonDefinition } from '../types';
import type { TeachingBeat } from '../b1/teacherLabScript';
import type { LessonAudioPackage } from './listeningAudioPilot';
/** A1 L02 isolated review; 13 source roles remain owner-blocked, audio awaiting factory. */
export const A1_L02_LESSON:SceneLessonDefinition = {
  "id": "a1-u1-l02-age-review",
  "levelId": "a1",
  "unitId": "a1-u1-first-contact",
  "unitTitle": "First Contact: Me and You",
  "order": 2,
  "title": "How old are you? · L02 preview",
  "subtitle": "First candidate test: age, numbers and an independent recorded phone message. 13 source-scope decisions pending.",
  "performance": "Ask/say age, hear and recognize basic functional numbers, and read age-related cards without turning the number list into a single dialogue.",
  "coreLanguage": [
    "How old are you?",
    "I'm nineteen years old",
    "What about you?",
    "thirteen / thirty",
    "nineteen / ninety",
    "Are you nineteen?",
    "Who is nineteen?"
  ],
  "boundaries": [
    "Owner-authorized PREVIEW, not course acceptance/official progress.",
    "13 original source introduction conflicts remain. Do not mark source IDs mastered from dialogue.",
    "Recorded message is a separate fiction with eight spoken digits. Audio needs real WAV.",
    "The learner can give a fictional age; no personal-age disclosure required."
  ],
  "source": {
    "repository": "addvaluewithai-hub/english-course",
    "branch": "draft/a1-u1-l02-age-and-numbers-20261017",
    "path": "interactive-content-production/drafts/A1/U1-L02/LESSON-v01.CANDIDATE.json",
    "sourceLessonId": "U1-L02"
  },
  "scenes": [
    {
      "id": "listen-first",
      "title": "Listen first · اسمع",
      "goal": "Recognize the broad practical situation by listening, with no spoiler",
      "teaching": {
        "explainInArabic": [
          "هتسمع دلوقتي اتنين بيتكلموا بالإنجليزي. مش مطلوب تفهم كل كلمة. اسمع، وبعدين اختار هما بيعملوا إيه.",
          "دلوقتي جاوب حسب اللي سمعته. لو محتاج، اسمعه تاني."
        ],
        "englishTargets": [
          "LISTEN",
          "WHAT IS HAPPENING?"
        ],
        "constraints": [
          "Only authored source, meaning-first board and real recorded audio count as evidence."
        ]
      },
      "interaction": {
        "kind": "elicitation",
        "setup": "Otti uses exact authored narration and waits for recorded source clips to complete; no answer leak on visual.",
        "learnerTask": "هما بيعملوا إيه في الحوار؟",
        "supportLadder": [
          "Replay relevant clip or ask for careful listening",
          "Give a short Arabic correction after attempt"
        ]
      },
      "activity": {
        "promptAr": "هما بيعملوا إيه في الحوار؟",
        "options": [
          {
            "id": "finished",
            "text": "بيتكلموا عن كلاس خلص"
          },
          {
            "id": "card",
            "text": "بيكتبوا بياناتهم على بطاقة للكلاس"
          },
          {
            "id": "tickets",
            "text": "بيشتروا تذاكر بأرقام مختلفة"
          }
        ],
        "correctOptionId": "card",
        "successAr": "صح. Maya بتساعد Leo يكتب بياناته على بطاقة الكلاس، ومن ضمنها السن.",
        "retryAr": "مش بالضبط. في التسجيل فيه class card وwrite وage. دول بيدلوا على بطاقة فيها بيانات، مش تذاكر أو كلاس انتهى."
      }
    },
    {
      "id": "age-meaning",
      "title": "How old? · السؤال عن السن",
      "goal": "Understand and use How old are you? and X years old as a social information exchange",
      "teaching": {
        "explainInArabic": [
          "نسمع الجزء اللي Maya بتسأل فيه عن السن، وLeo بيرد.",
          "How old are you؟ يعني عندك كام سنة؟ ده سؤال عن السن. بنستخدمه لما الموقف مناسب، زي استمارة الكلاس.",
          "Leo قال I'm nineteen years old. يعني عندي تسعتاشر سنة. عبارة years old بتيجي بعد الرقم عشان نقول السن.",
          "Maya قالت I'm twenty-one. الرد الأقصر طبيعي برضه لما السياق واضح. وLeo سأل What about you? يعني وإنت؟ تعبير بنرجع بيه نفس السؤال لصاحبنا.",
          "سمعت Leo قال عمره كام في الحوار؟ افتكر الرقم اللي قاله بعد I'm، ولو محتاج اسمع مقطع السن تاني."
        ],
        "englishTargets": [
          "AGE QUESTION",
          "How old are you?",
          "I'm nineteen years old.",
          "What about you?",
          "WHAT AGE DID LEO SAY?"
        ],
        "constraints": [
          "Only authored source, meaning-first board and real recorded audio count as evidence."
        ]
      },
      "interaction": {
        "kind": "micro_practice",
        "setup": "Otti uses exact authored narration and waits for recorded source clips to complete; no answer leak on visual.",
        "learnerTask": "Leo قال عمره كام سنة في التسجيل؟",
        "supportLadder": [
          "Replay relevant clip or ask for careful listening",
          "Give a short Arabic correction after attempt"
        ]
      },
      "activity": {
        "promptAr": "Leo قال عمره كام سنة في التسجيل؟",
        "options": [
          {
            "id": "19",
            "text": "19"
          },
          {
            "id": "21",
            "text": "21"
          },
          {
            "id": "90",
            "text": "90"
          }
        ],
        "correctOptionId": "19",
        "successAr": "مظبوط. Leo قال I'm nineteen years old، يعني عنده 19 سنة. Maya سنها 21.",
        "retryAr": "اسمع Leo في مقطع السن تاني. هو قال nineteen يعني 19، لكن twenty-one هي Maya."
      }
    },
    {
      "id": "number-patterns",
      "title": "Numbers · الأرقام",
      "goal": "Hear and distinguish functional numbers 11–100, without turning every word into a production objective",
      "teaching": {
        "explainInArabic": [
          "الأرقام مهمة هنا. اسمع ثلاثة عشر وتلاتين بالإنجليزي: thirteen وthirty. اسمع الفرق في النهاية.",
          "اسمع مكان النبرة: thirTEEN بنأكد على النهاية، لكن THIRty بنأكد على أول الكلمة. ونفس الفرق بين nineTEEN وNINEty. عشان كده مش بس الحروف مهمة، النبرة نفسها مهمة.",
          "أما twenty-one فهي عشرين وواحد. رقم 21. ونقدر نقول thirty-two يعني 32. ومئة نقول one hundred؛ دي معرفة الرقم مش سن واحد.",
          "دلوقتي هقول رقم مرة جديدة من غير ما أوريك الكتابة الأول: ninety. اختار الرقم اللي سمعته."
        ],
        "englishTargets": [
          "HEAR TWO NUMBERS",
          "thirTEEN · THIRty",
          "twenty + one = 21",
          "LISTEN TO THE NUMBER"
        ],
        "constraints": [
          "Only authored source, meaning-first board and real recorded audio count as evidence."
        ]
      },
      "interaction": {
        "kind": "micro_practice",
        "setup": "Otti uses exact authored narration and waits for recorded source clips to complete; no answer leak on visual.",
        "learnerTask": "سمعت كلمة ninety. ده أنهي رقم؟",
        "supportLadder": [
          "Replay relevant clip or ask for careful listening",
          "Give a short Arabic correction after attempt"
        ]
      },
      "activity": {
        "promptAr": "سمعت كلمة ninety. ده أنهي رقم؟",
        "options": [
          {
            "id": "19",
            "text": "19"
          },
          {
            "id": "9",
            "text": "9"
          },
          {
            "id": "90",
            "text": "90"
          }
        ],
        "correctOptionId": "90",
        "successAr": "مظبوط. Ninety هي تسعين. Nineteen هي تسعتاشر؛ اسمع نهاية الكلمة.",
        "retryAr": "Ninety نهايتها ty ودي 90. لكن nineteen نهايتها teen ودي 19. جرّب تسمع الفرق مرة تانية."
      }
    },
    {
      "id": "pictured-cards",
      "title": "Number cards · البطاقات",
      "goal": "Answer a basic question about a visible numbered object/card",
      "teaching": {
        "explainInArabic": [
          "قدامك تلات بطاقات أرقام. هسألك عن بطاقة محددة. بص على الأرقام واسمع السؤال.",
          "Which card shows nineteen? يعني أنهي بطاقة عليها رقم تسعتاشر؟ اختار البطاقة المناسبة."
        ],
        "englishTargets": [
          "NUMBER CARDS",
          "WHICH CARD?"
        ],
        "constraints": [
          "Only authored source, meaning-first board and real recorded audio count as evidence."
        ]
      },
      "interaction": {
        "kind": "micro_practice",
        "setup": "Otti uses exact authored narration and waits for recorded source clips to complete; no answer leak on visual.",
        "learnerTask": "Which card shows nineteen?",
        "supportLadder": [
          "Replay relevant clip or ask for careful listening",
          "Give a short Arabic correction after attempt"
        ]
      },
      "activity": {
        "promptAr": "Which card shows nineteen?",
        "options": [
          {
            "id": "19",
            "text": "19"
          },
          {
            "id": "13",
            "text": "13"
          },
          {
            "id": "90",
            "text": "90"
          }
        ],
        "correctOptionId": "19",
        "successAr": "صح. Nineteen يعني 19. بطاقتها مختلفة عن 90 اللي هي ninety.",
        "retryAr": "شوف الرقم 19. Nineteen فيها teen. لو اخترت 90 فدي ninety."
      }
    },
    {
      "id": "voicemail",
      "title": "Voice message · تسجيل الأرقام",
      "goal": "Understand a simple phone number from a separate recorded message, not from age conversation",
      "teaching": {
        "explainInArabic": [
          "نشاط مختلف شوية: هتسمع رسالة مسجلة فيها رقم تليفون للتدريب. دي أرقام خيالية ومش بيانات شخص حقيقي. اسمع من غير أرقام مكتوبة.",
          "إيه آخر رقمين سمعتهم في التسجيل؟ لو محتاج تقدر تعيد الرسالة."
        ],
        "englishTargets": [
          "LISTEN TO A MESSAGE",
          "LAST TWO DIGITS?"
        ],
        "constraints": [
          "Only authored source, meaning-first board and real recorded audio count as evidence."
        ]
      },
      "interaction": {
        "kind": "micro_practice",
        "setup": "Otti uses exact authored narration and waits for recorded source clips to complete; no answer leak on visual.",
        "learnerTask": "آخر رقمين في الرسالة المسجلة كانوا إيه؟",
        "supportLadder": [
          "Replay relevant clip or ask for careful listening",
          "Give a short Arabic correction after attempt"
        ]
      },
      "activity": {
        "promptAr": "آخر رقمين في الرسالة المسجلة كانوا إيه؟",
        "options": [
          {
            "id": "86",
            "text": "86"
          },
          {
            "id": "63",
            "text": "63"
          },
          {
            "id": "68",
            "text": "68"
          }
        ],
        "correctOptionId": "68",
        "successAr": "مظبوط. آخر رقمين اتقالوا هما six, eight يعني 6 وبعدها 8.",
        "retryAr": "اسمع نهاية الرسالة تاني. هتسمع six وبعدها eight، يعني 68 بالترتيب، مش 86."
      }
    },
    {
      "id": "be-questions",
      "title": "Age questions · الأسئلة",
      "goal": "Bounded everyday be questions for age, no whole grammar-system lecture",
      "teaching": {
        "explainInArabic": [
          "في السن ممكن تسأل Are you nineteen? يعني هل عندك تسعتاشر سنة؟ دي صيغة سؤال للتأكيد غير How old are you اللي بيسأل عن الرقم من الأول.",
          "ولما قدامك بطاقتين لشخصين، تسأل Who is nineteen? يعني مين اللي عنده 19؟ هنا Who هي اللي بتسأل عن الشخص. هنستخدمها في سياق واضح وبس.",
          "قدامك بطاقة سن مكتوب عليها 19، وعايز تتأكد إن صاحبها سنه 19. اختار سؤال التأكيد."
        ],
        "englishTargets": [
          "How old are you?",
          "Who is nineteen?",
          "CONFIRM THE AGE"
        ],
        "constraints": [
          "Only authored source, meaning-first board and real recorded audio count as evidence."
        ]
      },
      "interaction": {
        "kind": "micro_practice",
        "setup": "Otti uses exact authored narration and waits for recorded source clips to complete; no answer leak on visual.",
        "learnerTask": "زميلك كتب 19، وإنت عايز تتأكد من سنه. تقول إيه؟",
        "supportLadder": [
          "Replay relevant clip or ask for careful listening",
          "Give a short Arabic correction after attempt"
        ]
      },
      "activity": {
        "promptAr": "زميلك كتب 19، وإنت عايز تتأكد من سنه. تقول إيه؟",
        "options": [
          {
            "id": "who",
            "text": "Who is nineteen?"
          },
          {
            "id": "are",
            "text": "Are you nineteen?"
          },
          {
            "id": "how",
            "text": "How old are you?"
          }
        ],
        "correctOptionId": "are",
        "successAr": "صح. Are you nineteen? معناها هل عندك تسعتاشر سنة؟ دي مناسبة للتأكد من الرقم اللي شفته.",
        "retryAr": "How old are you? هتسأل عن الرقم من البداية. Who is nineteen? هتسأل مين الشخص. لكن للتأكد: Are you nineteen?"
      }
    },
    {
      "id": "fresh-speaking",
      "title": "Your turn · اتكلم",
      "goal": "Independently ask and give age with a new fictional identity, not reading a complete answer",
      "teaching": {
        "explainInArabic": [
          "دلوقتي موقف جديد: إنت بتملأ بطاقة دخول لكلاس جديد، وشخص اسمه Sam بيسألك عن سنك. البطاقة الخيالية مكتوب فيها 24. جاوبه بجملة طبيعية من غير ما أظهرلك الجملة كاملة.",
          "دلوقتي إنت اسأل Sam عن سنّه. وبعد رده، اسأله سؤال تأكيد مناسب لو محتاج. أنا هسمع ردّك وأسئلتك."
        ],
        "englishTargets": [
          "ROLE CARD · 24",
          "ASK SAM"
        ],
        "constraints": [
          "Only authored source, meaning-first board and real recorded audio count as evidence."
        ]
      },
      "interaction": {
        "kind": "fresh_transfer",
        "setup": "Otti is Sam, a fictional new classmate; age of learner persona is 24. Distinct from Maya/Leo class-card conversation. Ask/answer independently; do not show the complete English target answer.",
        "learnerTask": "Say fictional age 24 naturally and ask Sam his age, with an optional confirmation follow-up.",
        "teacherMoves": [
          "Wait for independent English learner turn",
          "If answer is just okay, ask a relevant follow-up",
          "If mic missing do not mark Speaking mastered"
        ],
        "supportLadder": [
          "Ask a smaller age question without quoting the answer",
          "Offer age sentence model only after failed attempts, then ask an independent new age response"
        ]
      }
    }
  ]
};
export const A1_L02_BEATS:Readonly<Record<string,readonly TeachingBeat[]>> = {
  "listen-first": [
    {
      "id": "listen-neutral",
      "line": "هتسمع دلوقتي اتنين بيتكلموا بالإنجليزي. مش مطلوب تفهم كل كلمة. اسمع، وبعدين اختار هما بيعملوا إيه.",
      "board": {
        "type": "note",
        "title": "LISTEN",
        "body": "اسمع من غير ما تعرف الإجابة"
      },
      "audioClipId": "full-conversation"
    },
    {
      "id": "listen-question",
      "line": "دلوقتي جاوب حسب اللي سمعته. لو محتاج، اسمعه تاني.",
      "board": {
        "type": "note",
        "title": "WHAT IS HAPPENING?",
        "body": "فكر في الموقف قبل الإجابة"
      }
    }
  ],
  "age-meaning": [
    {
      "id": "replay-age",
      "line": "نسمع الجزء اللي Maya بتسأل فيه عن السن، وLeo بيرد.",
      "board": {
        "type": "note",
        "title": "AGE QUESTION",
        "body": "اسمع السؤال والرد"
      },
      "audioClipId": "age-exchange"
    },
    {
      "id": "ask-age",
      "line": "How old are you؟ يعني عندك كام سنة؟ ده سؤال عن السن. بنستخدمه لما الموقف مناسب، زي استمارة الكلاس.",
      "board": {
        "type": "note",
        "title": "How old are you?",
        "body": "عندك كام سنة؟"
      }
    },
    {
      "id": "answer-age",
      "line": "Leo قال I'm nineteen years old. يعني عندي تسعتاشر سنة. عبارة years old بتيجي بعد الرقم عشان نقول السن.",
      "board": {
        "type": "note",
        "title": "I'm nineteen years old.",
        "body": "أنا عندي ١٩ سنة"
      }
    },
    {
      "id": "two-ages",
      "line": "Maya قالت I'm twenty-one. الرد الأقصر طبيعي برضه لما السياق واضح. وLeo سأل What about you? يعني وإنت؟ تعبير بنرجع بيه نفس السؤال لصاحبنا.",
      "board": {
        "type": "note",
        "title": "What about you?",
        "body": "وإنت؟ · I'm twenty-one."
      }
    },
    {
      "id": "age-choice",
      "line": "سمعت Leo قال عمره كام في الحوار؟ افتكر الرقم اللي قاله بعد I'm، ولو محتاج اسمع مقطع السن تاني.",
      "board": {
        "type": "note",
        "title": "WHAT AGE DID LEO SAY?",
        "body": "اسمع · افتكر · اختار"
      },
      "audioClipId": "age-exchange"
    }
  ],
  "number-patterns": [
    {
      "id": "number-hear",
      "line": "الأرقام مهمة هنا. اسمع ثلاثة عشر وتلاتين بالإنجليزي: thirteen وthirty. اسمع الفرق في النهاية.",
      "board": {
        "type": "note",
        "title": "HEAR TWO NUMBERS",
        "body": "اسمع الأول"
      }
    },
    {
      "id": "teen-ty",
      "line": "اسمع مكان النبرة: thirTEEN بنأكد على النهاية، لكن THIRty بنأكد على أول الكلمة. ونفس الفرق بين nineTEEN وNINEty. عشان كده مش بس الحروف مهمة، النبرة نفسها مهمة.",
      "board": {
        "type": "note",
        "title": "thirTEEN · THIRty",
        "body": "13 ≠ 30 / 19 ≠ 90"
      }
    },
    {
      "id": "twenty-one",
      "line": "أما twenty-one فهي عشرين وواحد. رقم 21. ونقدر نقول thirty-two يعني 32. ومئة نقول one hundred؛ دي معرفة الرقم مش سن واحد.",
      "board": {
        "type": "note",
        "title": "twenty + one = 21",
        "body": "one hundred = 100"
      }
    },
    {
      "id": "number-choice",
      "line": "دلوقتي هقول رقم مرة جديدة من غير ما أوريك الكتابة الأول: ninety. اختار الرقم اللي سمعته.",
      "board": {
        "type": "note",
        "title": "LISTEN TO THE NUMBER",
        "body": "اختار اللي سمعت"
      }
    }
  ],
  "pictured-cards": [
    {
      "id": "picture-set",
      "line": "قدامك تلات بطاقات أرقام. هسألك عن بطاقة محددة. بص على الأرقام واسمع السؤال.",
      "board": {
        "type": "note",
        "title": "NUMBER CARDS",
        "body": "13   ·   19   ·   90"
      }
    },
    {
      "id": "picture-query",
      "line": "Which card shows nineteen? يعني أنهي بطاقة عليها رقم تسعتاشر؟ اختار البطاقة المناسبة.",
      "board": {
        "type": "note",
        "title": "WHICH CARD?",
        "body": "اختار البطاقة بعد السؤال"
      }
    }
  ],
  "voicemail": [
    {
      "id": "voicemail-context",
      "line": "نشاط مختلف شوية: هتسمع رسالة مسجلة فيها رقم تليفون للتدريب. دي أرقام خيالية ومش بيانات شخص حقيقي. اسمع من غير أرقام مكتوبة.",
      "board": {
        "type": "note",
        "title": "LISTEN TO A MESSAGE",
        "body": "الرقم مش ظاهر قبل الاستماع"
      },
      "audioClipId": "phone-message"
    },
    {
      "id": "voicemail-question",
      "line": "إيه آخر رقمين سمعتهم في التسجيل؟ لو محتاج تقدر تعيد الرسالة.",
      "board": {
        "type": "note",
        "title": "LAST TWO DIGITS?",
        "body": "اختار من اللي سمعت"
      }
    }
  ],
  "be-questions": [
    {
      "id": "are-you",
      "line": "في السن ممكن تسأل Are you nineteen? يعني هل عندك تسعتاشر سنة؟ دي صيغة سؤال للتأكيد غير How old are you اللي بيسأل عن الرقم من الأول.",
      "board": {
        "type": "note",
        "title": "How old are you?",
        "body": "Are you nineteen?"
      }
    },
    {
      "id": "who-is",
      "line": "ولما قدامك بطاقتين لشخصين، تسأل Who is nineteen? يعني مين اللي عنده 19؟ هنا Who هي اللي بتسأل عن الشخص. هنستخدمها في سياق واضح وبس.",
      "board": {
        "type": "note",
        "title": "Who is nineteen?",
        "body": "مين عنده 19؟"
      }
    },
    {
      "id": "question-check",
      "line": "قدامك بطاقة سن مكتوب عليها 19، وعايز تتأكد إن صاحبها سنه 19. اختار سؤال التأكيد.",
      "board": {
        "type": "note",
        "title": "CONFIRM THE AGE",
        "body": "مش مطلوب تقول رقم جديد"
      }
    }
  ],
  "fresh-speaking": [
    {
      "id": "sam-role",
      "line": "دلوقتي موقف جديد: إنت بتملأ بطاقة دخول لكلاس جديد، وشخص اسمه Sam بيسألك عن سنك. البطاقة الخيالية مكتوب فيها 24. جاوبه بجملة طبيعية من غير ما أظهرلك الجملة كاملة.",
      "board": {
        "type": "note",
        "title": "ROLE CARD · 24",
        "body": "YOU ↔ SAM"
      }
    },
    {
      "id": "ask-sam",
      "line": "دلوقتي إنت اسأل Sam عن سنّه. وبعد رده، اسأله سؤال تأكيد مناسب لو محتاج. أنا هسمع ردّك وأسئلتك.",
      "board": {
        "type": "note",
        "title": "ASK SAM",
        "body": "سؤالك بصوتك"
      }
    }
  ]
};
export const A1_L02_FEEDBACK:Readonly<Record<string,{correct:string;wrong:string}>> = {
  "listen-first": {
    "correct": "صح. Maya بتساعد Leo يكتب بياناته على بطاقة الكلاس، ومن ضمنها السن.",
    "wrong": "مش بالضبط. في التسجيل فيه class card وwrite وage. دول بيدلوا على بطاقة فيها بيانات، مش تذاكر أو كلاس انتهى."
  },
  "age-meaning": {
    "correct": "مظبوط. Leo قال I'm nineteen years old، يعني عنده 19 سنة. Maya سنها 21.",
    "wrong": "اسمع Leo في مقطع السن تاني. هو قال nineteen يعني 19، لكن twenty-one هي Maya."
  },
  "number-patterns": {
    "correct": "مظبوط. Ninety هي تسعين. Nineteen هي تسعتاشر؛ اسمع نهاية الكلمة.",
    "wrong": "Ninety نهايتها ty ودي 90. لكن nineteen نهايتها teen ودي 19. جرّب تسمع الفرق مرة تانية."
  },
  "pictured-cards": {
    "correct": "صح. Nineteen يعني 19. بطاقتها مختلفة عن 90 اللي هي ninety.",
    "wrong": "شوف الرقم 19. Nineteen فيها teen. لو اخترت 90 فدي ninety."
  },
  "voicemail": {
    "correct": "مظبوط. آخر رقمين اتقالوا هما six, eight يعني 6 وبعدها 8.",
    "wrong": "اسمع نهاية الرسالة تاني. هتسمع six وبعدها eight، يعني 68 بالترتيب، مش 86."
  },
  "be-questions": {
    "correct": "صح. Are you nineteen? معناها هل عندك تسعتاشر سنة؟ دي مناسبة للتأكد من الرقم اللي شفته.",
    "wrong": "How old are you? هتسأل عن الرقم من البداية. Who is nineteen? هتسأل مين الشخص. لكن للتأكد: Are you nineteen?"
  }
};
export const A1_L02_AUDIO:LessonAudioPackage = {
  "lessonId": "a1-u1-l02-age-review",
  "factoryJobId": "englotti-a1-u1-l02-dialogue-v01-20261017",
  "audioUrl": null,
  "transcriptUrl": null,
  "vttUrl": null,
  "approved": false,
  "turns": [
    {
      "id": "t01",
      "speaker": "maya",
      "english": "Here's your English class card, Leo."
    },
    {
      "id": "t02",
      "speaker": "leo",
      "english": "Thanks! What do I write?"
    },
    {
      "id": "t03",
      "speaker": "maya",
      "english": "Your name and age. How old are you?"
    },
    {
      "id": "t04",
      "speaker": "leo",
      "english": "I'm nineteen years old. What about you?"
    },
    {
      "id": "t05",
      "speaker": "maya",
      "english": "I'm twenty-one."
    },
    {
      "id": "t06",
      "speaker": "leo",
      "english": "Nineteen goes here, right?"
    },
    {
      "id": "t07",
      "speaker": "maya",
      "english": "Yes. Write nineteen in this box."
    },
    {
      "id": "t08",
      "speaker": "leo",
      "english": "Great, thank you!"
    },
    {
      "id": "phone-01",
      "speaker": "recording",
      "english": "Hello. This is a practice number: five, zero, two, six, eight, three, six, eight. Thank you."
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
      "explanation": "الحوار الكامل عن بطاقة السن، مش رسالة التليفون"
    },
    {
      "id": "age-exchange",
      "turnIds": [
        "t03",
        "t04",
        "t05"
      ],
      "explanation": "سؤال السن والإجابات القصيرة والطويلة"
    },
    {
      "id": "phone-message",
      "turnIds": [
        "phone-01"
      ],
      "explanation": "رسالة مسجلة منفصلة فيها رقم تليفون تدريبي من 8 خانات"
    }
  ]
};
