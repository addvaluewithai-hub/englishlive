import type { SupportBoard } from '../../presentation/types';

/** Authored by a lesson writer; the Live tutor voices these lines, it does not invent them. */
export interface TeachingBeat {
  id: string;
  line: string;
  board: SupportBoard | null;
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
      line: 'الخطوة التانية: Pick a detail, then continue. امسك كلمة club واسأل: What do you do there? لاحظ إن السؤال جه من الخبر نفسه، مش من سكريبت محفوظ. يلا جرّب: أنا هقول الخبر تاني وإنت رد واسأل سؤال واحد. I joined a photography club last week.',
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
      line: 'بص على البورد. قدامك جملتين. اختار الجملة اللي معناها إني لسه بتعرف على Lina. مش محتاج تتكلم دلوقتي؛ اختار بس، وبعدها هنستخدم التعبير في موقف جديد.',
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
      line: 'دلوقتي اختار من البورد: لو Lina سافرت لكن لسه بتكلمها كل أسبوع، أنهي جملة أنسب؟ بعد الاختيار، هنجرب موقف مختلف بصوتك.',
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
      line: 'عندك موقفين: زميل جديد بدأت تعرفه في الشغل، وصاحب قديم من المدرسة لسه بتكلمه. قول جملة بالإنجليزي عن كل واحد. حاول تستخدم المعنى المناسب، مش مجرد تكرر الأمثلة اللي سمعتها.',
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

/** Visible instruction after a correct choice is authored too, not a generated follow-up. */
export const B1_TEACHER_LAB_AFTER_CHOICE: Record<string, string> = {
  'get-to-know': 'اختيار ممتاز! بس الفهم على البورد حاجة، واستخدامك للجملة حاجة تانية. تخيل إنك انضمّيت لشغل جديد وبقيت بتتعرف على زميل اسمه Karim. احكيلي عنه بجملة إنجليزي من عندك.',
  'keep-in-touch': 'بالضبط. دلوقتي فكر في حد كنت معاه في المدرسة ولسه بتكلمه من وقت للتاني. إزاي توصف إنكم لسه على تواصل؟ قولها بالإنجليزي بطريقتك.',
};
