import { Link, Navigate } from 'react-router-dom';
import { useProductCatalog } from '../catalog/client';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { learnArt } from '../learn/assets';
import { LEARN_V2_LESSONS } from '../learnV2/catalog';
import { productUnitProgress, readProductCourseProgress, takePendingProductLessonCompletion } from '../productV2/progress';
import { readLearnerProfile } from '../product/profile';

interface LevelPresentation {
  code: string;
  arabicTitle: string;
  description: string;
  art: string;
  tone: string;
}

const LEVEL_PRESENTATION: readonly LevelPresentation[] = [
  {
    code: 'A1',
    arabicTitle: 'المبتدئ',
    description: 'أساسيات التواصل في المواقف اليومية: التعارف، الناس، البيت، الوقت، التسوق، السفر والمواقف العملية.',
    art: learnArt.mascotReading,
    tone: 'pink',
  },
  {
    code: 'A2',
    arabicTitle: 'ما قبل المتوسط',
    description: 'بناء ثقتك في التحدث وفهم المواقف اليومية الأكثر تنوعًا.',
    art: learnArt.chatCloud,
    tone: 'peach',
  },
  {
    code: 'B1',
    arabicTitle: 'المتوسط',
    description: 'التواصل بثقة في مواقف الحياة والعمل والدراسة.',
    art: learnArt.bigBen,
    tone: 'blue',
  },
  {
    code: 'B2',
    arabicTitle: 'ما فوق المتوسط',
    description: 'التعبير عن الأفكار المعقدة ومناقشة مواضيع أوسع بوضوح وسلاسة.',
    art: learnArt.purpleNoteCloud,
    tone: 'purple',
  },
  {
    code: 'C1',
    arabicTitle: 'المتقدم',
    description: 'التواصل بطلاقة ومرونة في المواقف المهنية والأكاديمية والاجتماعية.',
    art: learnArt.mountainFlag,
    tone: 'mint',
  },
  {
    code: 'C2',
    arabicTitle: 'المتمكن',
    description: 'فهم وإتقان اللغة في سياقات واسعة بدقة وطلاقة عالية.',
    art: learnArt.trophy,
    tone: 'sky',
  },
];

export function LearnScreen() {
  const profile = readLearnerProfile();
  const catalog = useProductCatalog();

  if (!profile) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>جهز حسابك الأول</h1>
        <p>اختار هدفك ومدرسك قبل ما تبدأ مسار التعلم.</p>
        <Link className="v2-primary-button" to="/onboarding">ابدأ الإعداد</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(profile.characterId);
  const completedLessonHandoff = takePendingProductLessonCompletion();
  if (completedLessonHandoff) {
    return <Navigate replace to={`/lesson-complete/${completedLessonHandoff}?character=${character.id}`} />;
  }

  const progress = readProductCourseProgress();
  const publishedByCode = new Map(catalog.levels.map((level) => [level.id.toUpperCase(), level]));

  return (
    <section className="journey-levels" dir="rtl">
      <header className="journey-levels-hero">
        <div className="journey-levels-hero-art" aria-hidden="true">
          <img src={learnArt.mascotReading} alt="" />
          <span className="journey-hero-star one" />
          <span className="journey-hero-star two" />
        </div>
        <div className="journey-levels-hero-copy">
          <span>رحلتك في الإنجليزية</span>
          <h1>ابدأ من مستواك</h1>
          <p>ستة مستويات مرتبة بعناية، تاخدك خطوة بخطوة من الأساسيات إلى الطلاقة.</p>
        </div>
      </header>

      <section className="learn-v2-pilot">
        <header>
          <div>
            <span>Learn V2 • Pilot</span>
            <h2>جرّب شكل الدرس الجديد</h2>
            <p>محتوى authored ثابت → Listening طبيعي → AI conversation في التطبيق فقط.</p>
          </div>
          <span>تجربة</span>
        </header>
        <div className="learn-v2-pilot-grid">
          {LEARN_V2_LESSONS.map((lesson) => (
            <Link key={lesson.id} className="learn-v2-pilot-card" to={`/learn/pilot/${lesson.id}`}>
              <span>{lesson.level}</span>
              <div>
                <strong><bdi dir="ltr">{lesson.titleEn}</bdi></strong>
                <small>{lesson.titleAr} • حوالي {lesson.estimatedMinutes} دقيقة</small>
              </div>
              <ProductIcon name="chevron" size={23} />
            </Link>
          ))}
        </div>
      </section>

      <div className="journey-level-card-list">
        {LEVEL_PRESENTATION.map((presentation) => {
          const level = publishedByCode.get(presentation.code);
          if (!level) {
            return (
              <article key={presentation.code} className={`journey-level-card is-locked tone-${presentation.tone}`} aria-disabled="true">
                <div className="journey-level-badge">
                  <strong>{presentation.code}</strong>
                  <span>{presentation.arabicTitle}</span>
                </div>
                <img className="journey-level-art" src={presentation.art} alt="" aria-hidden="true" />
                <div className="journey-level-copy">
                  <h2>{presentation.arabicTitle}</h2>
                  <p>{presentation.description}</p>
                </div>
                <span className="journey-level-lock" aria-label="غير متاح حاليًا"><ProductIcon name="lock" size={25} /></span>
              </article>
            );
          }

          const completed = level.connectedUnits.reduce((sum, unit) => sum + productUnitProgress(unit, progress).completedCount, 0);
          const total = level.lessonSlotCount;
          const completion = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

          return (
            <Link key={level.id} className={`journey-level-card is-live tone-${presentation.tone}`} to={`/learn/level/${level.id}`}>
              <div className="journey-level-badge">
                <strong>{presentation.code}</strong>
                <span>{level.arabicTitle || presentation.arabicTitle}</span>
              </div>
              <img className="journey-level-art" src={presentation.art} alt="" aria-hidden="true" />
              <div className="journey-level-copy">
                <span className="journey-now-pill">متاح الآن <i aria-hidden="true">✦</i></span>
                <h2>{level.arabicTitle || presentation.arabicTitle}</h2>
                <p>{level.description || presentation.description}</p>
                <div className="journey-level-progress" aria-hidden="true">
                  <span style={{ width: `${completion}%` }} />
                </div>
              </div>
              <div className="journey-level-stats" aria-label={`${completed} of ${total} lessons complete`}>
                <span><strong>{level.unitCount}</strong><small>وحدات</small></span>
                <span><strong>{total}</strong><small>دروس منشورة</small></span>
                <span><strong>{completed}/{total}</strong><small>مكتمل</small></span>
              </div>
              <span className="journey-level-go" aria-hidden="true"><ProductIcon name="chevron" size={27} /></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
