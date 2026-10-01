import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { availableLearnLessons, learnRoadmapLevelById } from '../learnV2/roadmap';
import { readLearnerProfile } from '../product/profile';
import { readLearnLessonProgress } from '../speaking/roadmapProgress';

export function PrimaryProgressScreen() {
  const profile = readLearnerProfile();

  if (!profile) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>ابدأ رحلتك الأول</h1>
        <p>التقدم هيظهر هنا بعد ما تبدأ أول درس.</p>
        <Link className="v2-primary-button" to="/onboarding">ابدأ الإعداد</Link>
      </section>
    );
  }

  const level = learnRoadmapLevelById('a1');
  const lessons = level ? availableLearnLessons(level) : [];
  if (!level || !lessons.length) {
    return <section className="v2-empty-screen" dir="rtl"><h1>المسار بيتجهز</h1><p>التقدم هيظهر أول ما يكون فيه درس جاهز.</p></section>;
  }

  const completed = new Set(readLearnLessonProgress());
  const completedCount = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const nextLesson = lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons.at(-1)!;
  const completionPercent = Math.round((completedCount / lessons.length) * 100);

  return (
    <section className="v2-progress-screen" dir="rtl">
      <header className="v2-progress-heading">
        <span className="v2-kicker">تقدمي</span>
        <h1>خطواتك في {level.code}</h1>
        <p>ده تقدمك في الدروس اللي طبقتها لحد دلوقتي. مش درجة مستوى ولا ادعاء إن كل اللغة بقت ثابتة عندك.</p>
      </header>

      <section className="v2-progress-overview">
        <div>
          <strong>{completedCount}/{lessons.length}</strong>
          <span>دروس جاهزة مكتملة</span>
        </div>
        <div className="v2-progress-ring" style={{ '--progress': `${completionPercent}%` } as CSSProperties} aria-label={`${completedCount} من ${lessons.length} دروس مكتملة`}>
          <span>{completedCount}/{lessons.length}</span>
        </div>
      </section>

      <Link className="v2-progress-next" to={`/learn/lesson/${nextLesson.id}`}>
        <div>
          <span>{completed.has(nextLesson.id) ? 'مراجعة' : 'التالي'}</span>
          <strong><bdi dir="ltr">{nextLesson.titleEn}</bdi></strong>
          <small>{nextLesson.titleAr}</small>
        </div>
        <span className="v2-round-arrow"><ProductIcon name="chevron" size={22} /></span>
      </Link>

      {level.units.filter((unit) => unit.lessons.length > 0).map((unit) => (
        <section className="v2-progress-lessons" key={unit.id}>
          <h2>الوحدة {unit.order} · {unit.titleAr}</h2>
          {unit.lessons.map((lesson, index) => {
            const done = completed.has(lesson.id);
            return (
              <article className="v2-progress-lesson" key={lesson.id}>
                <span className={`v2-progress-status${done ? ' is-complete' : ''}`}>
                  {done ? <ProductIcon name="check" size={22} /> : index + 1}
                </span>
                <div>
                  <strong><bdi dir="ltr">{lesson.titleEn}</bdi></strong>
                  <small>{done ? 'مكتمل — تقدر تعيده وقت ما تحب' : 'جاهز تبدأه'}</small>
                </div>
                <Link to={`/learn/lesson/${lesson.id}`}>{done ? 'إعادة' : 'ابدأ'}</Link>
              </article>
            );
          })}
        </section>
      ))}

      <div className="v2-progress-note">
        <strong>الفكرة:</strong> كل درس بيمر بتجهيز اللغة، فهم الفكرة، Listening، وبعدها Guided + independent speaking. إكمال الدرس يعني إنك خلصت الـlearning loop بتاعه، واللغة هترجع تاني في مراجعات ودروس لاحقة.
      </div>
    </section>
  );
}
