import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { speakingAssets } from '../speaking/assets';
import { A1_SPEAKING_PILOT_LESSONS } from '../speaking/catalog';
import { readA1SpeakingPilotProgress, resetA1SpeakingPilotProgress } from '../speaking/roadmapProgress';

export function SpeakingHomeScreen() {
  const [completed, setCompleted] = useState(() => readA1SpeakingPilotProgress());
  const completedSet = new Set(completed);
  const completedCount = A1_SPEAKING_PILOT_LESSONS.filter((lesson) => completedSet.has(lesson.id)).length;
  const currentLesson = A1_SPEAKING_PILOT_LESSONS[0];
  const progressPercent = A1_SPEAKING_PILOT_LESSONS.length
    ? Math.round((completedCount / A1_SPEAKING_PILOT_LESSONS.length) * 100)
    : 0;

  function resetPilot() {
    resetA1SpeakingPilotProgress();
    setCompleted([]);
  }

  return (
    <section className="sp-home sp-roadmap-home" dir="rtl">
      <header className="sp-roadmap-hero">
        <div className="sp-roadmap-hero-copy">
          <span className="sp-eyebrow">Speaking A1 • Pilot</span>
          <h1>استخدم اللي اتعلمته</h1>
          <p>النسخة دي فيها درس واحد بس. بناخد لغة Learn اللي اتعلمتها ونخليها تطلع منك جوه محادثة حقيقية، والدرس يقفل لما الـevidence المطلوب يظهر.</p>
          <div className="sp-roadmap-progress-copy">
            <strong>{completedCount} / 1</strong>
            <span>درس تجريبي</span>
          </div>
          <div className="sp-roadmap-progress-bar" aria-label={`اكتملت ${progressPercent}% من النسخة التجريبية`}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <img src={speakingAssets.ottiHero} alt="" className="sp-roadmap-hero-art" />
      </header>

      <section className="sp-roadmap-unit">
        <header className="sp-roadmap-unit-header">
          <div>
            <span className="sp-roadmap-level-chip">A1 • من Learn U1-L01 → U1-L03</span>
            <h2>First contact</h2>
            <p>تحية واسم + الحال + العمر + البلد ومكان السكن. المحادثة حرة نسبيًا، لكن Otti بيلفها بهدوء ناحية الحاجات اللي لسه ما استخدمتهاش.</p>
          </div>
          <span className="sp-roadmap-unit-count">1 / 1</span>
        </header>

        <div className="sp-roadmap-list">
          {A1_SPEAKING_PILOT_LESSONS.map((lesson) => {
            const isComplete = completedSet.has(lesson.id);
            return (
              <Link key={lesson.id} className={`sp-roadmap-lesson is-current${isComplete ? ' is-complete' : ''}`} to={`/speak/scenario/${lesson.id}`}>
                <span className="sp-roadmap-step" aria-hidden="true">{isComplete ? '✓' : '1'}</span>
                <div className="sp-roadmap-lesson-copy">
                  <small>{lesson.curriculum?.lessonCode} • {lesson.skillFocusAr}</small>
                  <strong>{lesson.titleAr}</strong>
                  <p>{lesson.goalAr}</p>
                  <div className="sp-roadmap-lesson-meta">
                    <span>◷ حوالي {lesson.durationMinutes} دقائق</span>
                    {isComplete ? <span className="is-done">الـchecks اكتملت ✓</span> : <span className="is-now">ابدأ من هنا</span>}
                  </div>
                </div>
                <span className="sp-roadmap-arrow" aria-hidden="true">‹</span>
              </Link>
            );
          })}

          <div className="sp-roadmap-coming">
            <span>2</span>
            <div><strong>الدرس اللي بعده</strong><small>هنصممه بعد ما نجرب الـengine ده ونتأكد إن طريقة الـchecks والـsteering صح.</small></div>
            <em>بعد التجربة</em>
          </div>
        </div>

        {currentLesson ? (
          <Link className="sp-roadmap-continue" to={`/speak/scenario/${currentLesson.id}`}>
            <ProductIcon name="speak" size={29} />
            <span>{completedCount ? 'جرّب الدرس تاني' : 'ابدأ درس المحادثة'}</span>
            <ProductIcon name="chevron" size={24} />
          </Link>
        ) : null}
      </section>

      <section className="sp-roadmap-secondary">
        <div>
          <strong>عايز تتكلم من غير الدرس؟</strong>
          <span>المحادثة الحرة لسه موجودة، لكن مفيهاش الـlesson checks دي.</span>
        </div>
        <Link to="/speak/just-chat">محادثة حرة</Link>
      </section>

      {completedCount > 0 ? <button className="sp-roadmap-reset" type="button" onClick={resetPilot}>إعادة تجربة الدرس من الأول</button> : null}
    </section>
  );
}
