import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { A1_UNIT_1_PRODUCT, lessonArabicTitle, lessonProductTitle } from '../productV2/course';
import { productUnitProgress, readProductCourseProgress } from '../productV2/progress';
import { readLearnerProfile } from '../product/profile';

export function HomeScreen() {
  const profile = readLearnerProfile();

  if (!profile) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <div className="v2-empty-mark">E</div>
        <h1>ابدأ رحلتك في EnglishLive</h1>
        <p>اختار هدفك ومدرسك، وبعدها هنبدأ معاك من أول درس مناسب.</p>
        <Link className="v2-primary-button" to="/onboarding">ابدأ الإعداد</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(profile.characterId);
  const progress = readProductCourseProgress();
  const summary = productUnitProgress(A1_UNIT_1_PRODUCT, progress);
  const lessonSaved = progress.lessons[summary.nextLesson.id];
  const greeting = profile.firstName ? `مرحبًا ${profile.firstName}!` : 'مرحبًا بك!';

  return (
    <section className="v2-home-screen" dir="rtl">
      <div className="v2-welcome-panel">
        <div className="v2-welcome-copy">
          <span className="v2-kicker">جاهز نكمل؟</span>
          <h1>{greeting}</h1>
          <p>خطوة صغيرة كل يوم، ومع كل درس هتتكلم أكتر بثقة.</p>
        </div>
        <div className="v2-home-character" style={{ '--character-accent': character.accent } as React.CSSProperties}>
          <CharacterPortrait character={character} />
        </div>
      </div>

      <Link className="v2-continue-card" to={`/scene-lesson/${summary.nextLesson.id}?character=${character.id}`}>
        <div className="v2-card-heading-row">
          <span className="v2-level-badge">A1</span>
          <span className="v2-small-muted">الوحدة 1 · الدرس {summary.nextLesson.order}</span>
        </div>
        <h2>{lessonProductTitle(summary.nextLesson)}</h2>
        <p>{lessonArabicTitle(summary.nextLesson)}</p>
        <div className="v2-continue-footer">
          <div className="v2-mini-progress" aria-label={`${summary.completedCount} of ${summary.totalCount} lessons complete`}>
            {A1_UNIT_1_PRODUCT.lessons.map((lesson) => (
              <span key={lesson.id} className={progress.lessons[lesson.id]?.completedAt ? 'is-complete' : lesson.id === summary.nextLesson.id ? 'is-current' : ''} />
            ))}
          </div>
          <span className="v2-inline-cta"><ProductIcon name="play" size={20} />{lessonSaved?.startedAt ? 'متابعة الدرس' : 'ابدأ الدرس'}</span>
        </div>
      </Link>

      <section className="v2-streak-card">
        <div>
          <strong>سلسلة التعلم</strong>
          <span>ابدأ النهاردة وحافظ على الاستمرارية.</span>
        </div>
        <div className="v2-streak-days" aria-label="Weekly learning streak">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <span key={day} className={day < Math.min(summary.completedCount, 7) ? 'is-done' : ''}>
              {day < Math.min(summary.completedCount, 7) ? <ProductIcon name="check" size={18} /> : null}
            </span>
          ))}
        </div>
      </section>

      <Link className="v2-free-speak-card" to="/speak">
        <div>
          <span className="v2-kicker">Free Speak</span>
          <h2>ممارسة المحادثة الحرة</h2>
          <p>اتكلم مع {character.name} في أي موضوع تحبه، من غير ما يأثر على ترتيب المنهج.</p>
        </div>
        <span className="v2-round-arrow"><ProductIcon name="chevron" size={22} /></span>
      </Link>

      <Link className="v2-teacher-link" to="/characters">
        <span>مدرسك الحالي: <strong>{character.name}</strong></span>
        <span>تغيير المدرس</span>
      </Link>
    </section>
  );
}
