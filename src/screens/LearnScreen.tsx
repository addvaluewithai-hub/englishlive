import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { learnArt } from '../learn/assets';
import { availableLearnLessons, LEARN_ROADMAP_LEVELS } from '../learnV2/roadmap';
import { readLearnerProfile } from '../product/profile';
import { readLearnLessonProgress } from '../speaking/roadmapProgress';

const LEVEL_ART: Record<string, string> = {
  A1: learnArt.mascotReading,
  A2: learnArt.chatCloud,
  B1: learnArt.bigBen,
  B2: learnArt.purpleNoteCloud,
  C1: learnArt.mountainFlag,
  C2: learnArt.trophy,
};

export function LearnScreen() {
  const profile = readLearnerProfile();

  if (!profile) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>جهز حسابك الأول</h1>
        <p>اختار هدفك ومدرسك قبل ما تبدأ مسار التعلم.</p>
        <Link className="v2-primary-button" to="/onboarding">ابدأ الإعداد</Link>
      </section>
    );
  }

  const completed = new Set(readLearnLessonProgress());

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
          <p>منهج متقسم لمستويات ووحدات ودروس واضحة: تتجهز للغة، تسمعها، وبعدها تستخدمها بنفسك في محادثة حقيقية.</p>
        </div>
      </header>

      <div className="journey-level-card-list">
        {LEARN_ROADMAP_LEVELS.map((level) => {
          const lessons = availableLearnLessons(level);
          const isAvailable = lessons.length > 0;
          const completedCount = lessons.filter((lesson) => completed.has(lesson.id)).length;
          const completion = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
          const art = LEVEL_ART[level.code] ?? learnArt.mascotReading;

          if (!isAvailable) {
            return (
              <article key={level.id} className={`journey-level-card is-locked tone-${level.tone}`} aria-disabled="true">
                <div className="journey-level-badge">
                  <strong>{level.code}</strong>
                  <span>{level.titleAr}</span>
                </div>
                <img className="journey-level-art" src={art} alt="" aria-hidden="true" />
                <div className="journey-level-copy">
                  <h2>{level.titleAr}</h2>
                  <p>{level.descriptionAr}</p>
                </div>
                <span className="journey-level-lock" aria-label="قريبًا"><ProductIcon name="lock" size={25} /></span>
              </article>
            );
          }

          return (
            <Link key={level.id} className={`journey-level-card is-live tone-${level.tone}`} to={`/learn/level/${level.id}`}>
              <div className="journey-level-badge">
                <strong>{level.code}</strong>
                <span>{level.titleAr}</span>
              </div>
              <img className="journey-level-art" src={art} alt="" aria-hidden="true" />
              <div className="journey-level-copy">
                <span className="journey-now-pill">ابدأ المسار <i aria-hidden="true">✦</i></span>
                <h2>{level.titleAr}</h2>
                <p>{level.descriptionAr}</p>
                <div className="journey-level-progress" aria-hidden="true">
                  <span style={{ width: `${completion}%` }} />
                </div>
              </div>
              <div className="journey-level-stats" aria-label={`${completedCount} من ${lessons.length} دروس جاهزة مكتملة`}>
                <span><strong>{level.units.length}</strong><small>وحدات</small></span>
                <span><strong>{level.plannedLessonCount}</strong><small>درس في المسار</small></span>
                <span><strong>{completedCount}/{lessons.length}</strong><small>من الجاهز</small></span>
              </div>
              <span className="journey-level-go" aria-hidden="true"><ProductIcon name="chevron" size={27} /></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
