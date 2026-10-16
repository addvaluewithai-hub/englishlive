import type { SupportBoard } from '../../presentation/types';

/** Authored by a lesson writer; the Live tutor voices these lines, it does not invent them. */
export interface TeachingBeat {
  id: string;
  line: string;
  board: SupportBoard | null;
  /** Play this authored listening clip AFTER the spoken line has finished, before proceeding. */
  audioClipId?: string;
}

/** Each beat is one short audible turn. The final beat ends at a learner checkpoint. */
export const B1_TEACHER_LAB_SCRIPT: Record<string, readonly TeachingBeat[]> = {
  'warm-up': [
    {
      id: 'story',
      line: 'النهاردة هنتعلم إزاي نكمل محادثة بدل ما نرد ونقف. تخيل إن صاحبك بيقول لك: I joined a photography club last week. يعني اشتركت في نادي تصوير الأسبوع اللي فات.',
      board: { type: 'note', title: 'A friend has news', body: 'I joined a photography club last week.' },
    },
    {
      id: 'reaction',
      line: 'أول خطوة: React. يعني تبيّن إنك سمعت الخبر. ممكن تقول: Really? أو That sounds interesting. الاتنين ردود قصيرة، بس لسه ما كملناش الحوار.',
      board: { type: 'examples', title: '1 · React', items: [{ title: 'Really?', body: 'surprise / interest' }, { title: 'That sounds interesting!', body: 'positive interest' }] },
    },
    {
      id: 'follow-up',
      line: 'الخطوة التانية: Pick a detail, then continue. امسك كلمة club واسأل: What do you do there? السؤال جه من الخبر نفسه. بص على البورد واختار أحسن رد يكمل الكلام.',
      board: { type: 'steps', title: 'React → Pick → Continue', items: [{ title: 'React', body: 'Really?' }, { title: 'Pick', body: 'photography club' }, { title: 'Continue', body: 'What do you do there?' }] },
    },
  ],
  'get-to-know': [
    {
      id: 'meaning',
      line: 'في نادي التصوير قابلت واحدة اسمها Lina. في الأول ما كناش نعرف بعض كويس، بس مع الوقت بدأنا نتكلم ونتعرف على بعض. بالإنجليزي بنستخدم get to know عشان نحكي عن التعارف اللي بيحصل بالتدريج.',
      board: { type: 'note', title: 'get to know', body: 'become familiar with someone over time' },
    },
    {
      id: 'model',
      line: 'اسمع الجملة: I am getting to know Lina at the club. يعني أنا بتعرف على لينا في النادي. ركز على get to know؛ دي مش نفس فكرة إننا نفضل على تواصل بعد ما نبعد.',
      board: { type: 'examples', title: 'New relationship', items: [{ title: 'I am getting to know Lina.', body: 'We have only recently met.' }] },
    },
    {
      id: 'choice',
      line: 'بص على البورد. قدامك جملتين. اختار اللي معناها إني لسه بتعرف على Lina. هنشوف مع بعض ليه الإجابة صح أو غلط.',
      board: { type: 'examples', title: 'get to know = new connection', items: [{ title: 'get to know', body: 'a relationship is beginning' }] },
    },
  ],
  'keep-in-touch': [
    {
      id: 'after-club',
      line: 'نكمل حكاية Lina. بعد كام شهر سافرت مدينة تانية. إحنا خلاص نعرف بعض، بس لسه بنتكلم كل أسبوع ونتطمن على بعض.',
      board: { type: 'note', title: 'Lina moved away', body: 'They still message each other every week.' },
    },
    {
      id: 'meaning',
      line: 'هنا هنقول keep in touch. معناها إن ناس عارفين بعض وبيفضلوا على اتصال حتى لو بعيد. اسمع: We still keep in touch. بنفضل على تواصل لحد دلوقتي.',
      board: { type: 'examples', title: 'Contact continues', items: [{ title: 'We still keep in touch.', body: 'We still message or call each other.' }] },
    },
    {
      id: 'choice',
      line: 'دلوقتي اختار من البورد: لو Lina سافرت لكن لسه بتكلمها كل أسبوع، أنهي جملة أنسب؟ Otti هيشرح اختيارك وبعدها نكمل.',
      board: { type: 'note', title: 'keep in touch', body: 'continue communicating after being apart' },
    },
  ],
  'compare-and-use': [
    {
      id: 'comparison',
      line: 'تعالى نقارن التعبيرين. get to know يعني العلاقة بتبدأ وتتطور. keep in touch يعني العلاقة موجودة وعايزين نحافظ على التواصل.',
      board: { type: 'compare', title: 'Two relationship moments', left: { title: 'get to know', body: 'new / developing relationship' }, right: { title: 'keep in touch', body: 'ongoing contact' } },
    },
    {
      id: 'ask',
      line: 'قدامك موقفين: زميل جديد في الشغل، وصاحب قديم من المدرسة لسه بتكلمه. اختار الجملتين اللي يناسبوا الموقفين. وبعد شرح الاختيار هنروح لمحادثة Speaking حقيقية.',
      board: { type: 'compare', title: 'Which moment?', left: { title: 'New coworker', body: 'get to know' }, right: { title: 'Old school friend', body: 'keep in touch' } },
    },
  ],
  'fresh-transfer': [
    {
      id: 'new-context',
      line: 'دلوقتي هنسيب حكاية نادي التصوير خالص. هنتكلم في موضوع جديد من غير بورد ولا جمل جاهزة. تخيل إني زميلك في الشغل وبقول لك: Our team changed this month, and I met three new colleagues. رد عليّ بشكل طبيعي، واسألني عن تفصيلة تخلي الكلام يكمل.',
      board: null,
    },
  ],
};

/** The correct key is graded by the app. Otti READS one of these exact feedback lines. */
export const B1_TEACHER_LAB_QUIZ_FEEDBACK: Record<string, { correct: string; wrong: string }> = {
  'warm-up': {
    correct: 'برافو! Really? بتبين اهتمامك، و What do you do there? سؤال عن الخبر نفسه. كده المحادثة بتكمل.',
    wrong: 'خلينا نفهمها: Okay لوحدها بتقفّل الموضوع، والكلام عن البيتزا بعيد عن الخبر. الأفضل نقول Really? What do you do there? لأننا بنتفاعل وبنسأل عن النادي.',
  },
  'get-to-know': {
    correct: 'ممتاز! I am getting to know Lina معناها إن المعرفة بتتكوّن بالتدريج، مش إنكم كنتم أصحاب من زمان.',
    wrong: 'مش الاختيار المناسب هنا. We keep in touch للعلاقة اللي موجودة وبنكمل التواصل فيها. لكن Lina شخص لسه بنتعرف عليه، فالأصح: I am getting to know Lina.',
  },
  'keep-in-touch': {
    correct: 'صح جدًا! We still keep in touch لأن Lina سافرت، بس التواصل بينكم مستمر.',
    wrong: 'بما إنك عارف Lina من قبل وبتكلمها بعد السفر، مش بنتعرف عليها لأول مرة. التعبير اللي يصف استمرار التواصل هو: We still keep in touch.',
  },
  'compare-and-use': {
    correct: 'إجابة ممتازة! Getting to know للشخص الجديد، و keep in touch للصديق القديم. المعنى اللي بيحكم اختيار التعبير.',
    wrong: 'خلينا نثبت الفرق: الشخص الجديد بنقول عنه I am getting to know my coworker. أما الصديق القديم اللي لسه بنتواصل معاه بنقول I keep in touch with my old friend. اختيار التعبير بيتحدد من سياق العلاقة.',
  },
};
