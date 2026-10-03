import { Link } from 'react-router-dom';
import { OttiMark } from '../character/otti/OttiMark';
import { ProductIcon } from '../components/ProductIcon';
import { learnArt } from '../learn/assets';
import { availableLearnLessons, learnRoadmapLevelById } from '../learnV2/roadmap';
import { readLearnerProfile } from '../product/profile';
import { readLearnLessonProgress } from '../speaking/roadmapProgress';

export function HomeScreen() {
  const profile = readLearnerProfile();

  if (!profile) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <div className="v2-empty-mark"><OttiMark /></div>
        <h1>ابدأ رحلتك في Englotti</h1>
        <p>اختار هدفك، اتعرف على Otti، وبعدها هنبدأ معاك من أول درس مناسب.</p>
        <Link className="v2-primary-button" to="/onboarding">ابدأ الإعداد</Link>
      </section>
    );
  }

  const level = learnRoadmapLevelById('a1');
  const lessons = level ? availableLearnLessons(level) : [];
  if (!level || !lessons.length) {
    return <section className="v2-empty-screen" dir="rtl"><h1>المسار بيتجهز</h1><p>مفيش دروس جاهزة في المسار دلوقتي.</p></section>;
  }

  const completed = new Set(readLearnLessonProgress());
  const nextLesson = lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons.at(-1)!;
  const unit = level.units.find((candidate) => candidate.order === nextLesson.unit) ?? level.units[0];
  const unitCompleted = unit.lessons.filter((lesson) => completed.has(lesson.id)).length;
  const greeting = profile.firstName ? `أهلًا يا ${profile.firstName}!` : 'أهلًا بيك!';
  const lessonHref = `/learn/lesson/${nextLesson.id}`;

  return (
    <section className="v2-home-screen home-ref-screen" dir="rtl">
      <section className="home-ref-hero" aria-label="ترحيب">
        <div className="home-ref-bubble">
          <h1>{greeting}</h1>
          <p>نواصل رحلتك في<br />تعلم الإنجليزية</p>
        </div>
        <div className="home-ref-mascot" aria-hidden="true">
          <img src={learnArt.mascotReading} alt="" />
          <span className="home-ref-cloud home-ref-cloud-one" />
          <span className="home-ref-cloud home-ref-cloud-two" />
        </div>
      </section>

      <Link className="home-ref-course-card" to={lessonHref}>
        <div className="home-ref-course-copy">
          <div className="home-ref-course-index" dir="ltr">
            <span>{level.code}</span>
            <strong>Unit {nextLesson.unit}</strong>
            <strong>Lesson {nextLesson.lesson}</strong>
          </div>
          <p className="home-ref-arabic-title">{nextLesson.titleAr}</p>
          <p className="home-ref-english-title" dir="ltr">{nextLesson.titleEn}</p>
        </div>

        <div className="home-ref-course-art" aria-hidden="true">
          <img className="home-ref-hi" src={learnArt.hiBubble} alt="" />
          <img className="home-ref-books" src={learnArt.books} alt="" />
        </div>

        <div className="home-ref-continue" dir="rtl">
          <ProductIcon name="play" size={25} />
          <span>{completed.has(nextLesson.id) ? 'راجع الدرس' : 'كمّل المسار'}</span>
        </div>
      </Link>

      <section className="home-ref-progress-card" aria-label="تقدمك في الوحدة">
        <div className="home-ref-progress-copy">
          <span className="home-ref-flame" aria-hidden="true">🔥</span>
          <div>
            <strong>{unitCompleted}</strong>
            <span>دروس مكتملة</span>
          </div>
        </div>

        <div className="home-ref-progress-divider" aria-hidden="true" />

        <div className="home-ref-lesson-dots" aria-label={`${unitCompleted} من ${unit.lessons.length} دروس جاهزة مكتملة`}>
          {unit.lessons.map((lesson) => {
            const done = completed.has(lesson.id);
            const current = lesson.id === nextLesson.id && !done;
            return (
              <span key={lesson.id} className={`${done ? 'is-done' : ''}${current ? ' is-current' : ''}`}>
                {done ? <ProductIcon name="check" size={17} /> : null}
              </span>
            );
          })}
        </div>

        <div className="home-ref-progress-label">
          <strong>{unitCompleted} من {unit.lessons.length}</strong>
          <span>تقدم الوحدة {unit.order}</span>
        </div>
      </section>
    </section>
  );
}
