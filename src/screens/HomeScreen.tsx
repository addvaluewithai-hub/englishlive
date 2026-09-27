import { Link } from 'react-router-dom';
import { useProductCatalog } from '../catalog/client';
import { publishedCharacterById, usePublishedCharacters } from '../character/catalog';
import { OttiMark } from '../character/otti/OttiMark';
import { ProductIcon } from '../components/ProductIcon';
import { learnArt } from '../learn/assets';
import { lessonArabicTitle, lessonProductTitle } from '../productV2/course';
import { productUnitProgress, readProductCourseProgress } from '../productV2/progress';
import { readLearnerProfile } from '../product/profile';

export function HomeScreen() {
  const profile = readLearnerProfile();
  const catalog = useProductCatalog();
  const characterCatalog = usePublishedCharacters();

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

  const level = catalog.levels[0];
  const unit = level?.connectedUnits[0];
  if (!level || !unit || unit.lessons.length === 0) {
    return <section className="v2-empty-screen" dir="rtl"><h1>المسار بيتجهز</h1><p>مفيش دروس منشورة في المسار دلوقتي.</p></section>;
  }

  const character = publishedCharacterById(characterCatalog.characters, profile.characterId);
  const progress = readProductCourseProgress();
  const summary = productUnitProgress(unit, progress);
  const lessonSaved = progress.lessons[summary.nextLesson.id];
  const greeting = profile.firstName ? `أهلًا يا ${profile.firstName}!` : 'أهلًا بيك!';
  const lessonHref = `/scene-lesson/${summary.nextLesson.id}?character=${character.id}`;

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
            <span>{level.title}</span>
            <strong>Unit {unit.order}</strong>
            <strong>Lesson {summary.nextLesson.order}</strong>
          </div>
          <p className="home-ref-arabic-title">{lessonArabicTitle(summary.nextLesson)}</p>
          <p className="home-ref-english-title" dir="ltr">{lessonProductTitle(summary.nextLesson)}</p>
        </div>

        <div className="home-ref-course-art" aria-hidden="true">
          <img className="home-ref-hi" src={learnArt.hiBubble} alt="" />
          <img className="home-ref-books" src={learnArt.books} alt="" />
        </div>

        <div className="home-ref-continue" dir="rtl">
          <ProductIcon name="play" size={25} />
          <span>{lessonSaved?.startedAt ? 'متابعة الدرس' : 'ابدأ الدرس'}</span>
        </div>
      </Link>

      <section className="home-ref-progress-card" aria-label="تقدمك في الوحدة">
        <div className="home-ref-progress-copy">
          <span className="home-ref-flame" aria-hidden="true">🔥</span>
          <div>
            <strong>{summary.completedCount}</strong>
            <span>دروس مكتملة</span>
          </div>
        </div>

        <div className="home-ref-progress-divider" aria-hidden="true" />

        <div className="home-ref-lesson-dots" aria-label={`${summary.completedCount} of ${summary.totalCount} published lessons complete`}>
          {unit.lessons.map((lesson) => {
            const completed = Boolean(progress.lessons[lesson.id]?.completedAt);
            const current = lesson.id === summary.nextLesson.id && !completed;
            return (
              <span key={lesson.id} className={`${completed ? 'is-done' : ''}${current ? ' is-current' : ''}`}>
                {completed ? <ProductIcon name="check" size={17} /> : null}
              </span>
            );
          })}
        </div>

        <div className="home-ref-progress-label">
          <strong>{summary.completedCount} من {summary.totalCount}</strong>
          <span>تقدم الوحدة</span>
        </div>
      </section>
    </section>
  );
}
