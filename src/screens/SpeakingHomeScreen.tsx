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
  const firstIncompleteIndex = A1_SPEAKING_PILOT_LESSONS.findIndex((lesson) => !completedSet.has(lesson.id));
  const currentIndex = firstIncompleteIndex === -1 ? A1_SPEAKING_PILOT_LESSONS.length - 1 : firstIncompleteIndex;
  const currentLesson = A1_SPEAKING_PILOT_LESSONS[currentIndex];
  const progressPercent = Math.round((completedCount / A1_SPEAKING_PILOT_LESSONS.length) * 100);

  function resetPilot() {
    resetA1SpeakingPilotProgress();
    setCompleted([]);
  }

  return (
    <section className="sp-home sp-roadmap-home" dir="rtl">
      <header className="sp-roadmap-hero">
        <div className="sp-roadmap-hero-copy">
          <span className="sp-eyebrow">Speaking A1</span>
          <h1>مسارك في الكلام</h1>
          <p>امشِ درس ورا درس. كل درس له هدف كلام واضح، والـAI يفضل جوه حدود A1.</p>
          <div className="sp-roadmap-progress-copy">
            <strong>{completedCount} / {A1_SPEAKING_PILOT_LESSONS.length}</strong>
            <span>دروس متجربة من النسخة الأولى</span>
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
            <span className="sp-roadmap-level-chip">A1 • الوحدة 1</span>
            <h2>أول تعارف وبيانات شخصية</h2>
            <p>النسخة دي فيها أول 5 دروس عشان تجرب شكل المسار قبل ما نكمل باقي A1.</p>
          </div>
          <span className="sp-roadmap-unit-count">5 / 7</span>
        </header>

        <div className="sp-roadmap-list">
          {A1_SPEAKING_PILOT_LESSONS.map((lesson, index) => {
            const isComplete = completedSet.has(lesson.id);
            const isUnlocked = index === 0 || completedSet.has(A1_SPEAKING_PILOT_LESSONS[index - 1].id);
            const isCurrent = index === currentIndex && !isComplete;
            const cardClass = `sp-roadmap-lesson${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}${!isUnlocked ? ' is-locked' : ''}`;
            const content = (
              <>
                <span className="sp-roadmap-step" aria-hidden="true">{isComplete ? '✓' : index + 1}</span>
                <div className="sp-roadmap-lesson-copy">
                  <small>{lesson.curriculum?.lessonCode}</small>
                  <strong>{lesson.titleAr}</strong>
                  <p>{lesson.goalAr}</p>
                  <div className="sp-roadmap-lesson-meta">
                    <span>◷ {lesson.durationMinutes} دقائق</span>
                    {isComplete ? <span className="is-done">اتجرب ✓</span> : isCurrent ? <span className="is-now">ابدأ من هنا</span> : null}
                  </div>
                </div>
                <span className="sp-roadmap-arrow" aria-hidden="true">{isUnlocked ? '‹' : '🔒'}</span>
              </>
            );

            return isUnlocked ? (
              <Link key={lesson.id} className={cardClass} to={`/speak/scenario/${lesson.id}`}>{content}</Link>
            ) : (
              <div key={lesson.id} className={cardClass} aria-disabled="true">{content}</div>
            );
          })}

          <div className="sp-roadmap-coming">
            <span>6</span>
            <div><strong>This is my friend…</strong><small>بعد تجربة أول 5 دروس هنقفل تصميم باقي الوحدة.</small></div>
            <em>قريبًا</em>
          </div>
          <div className="sp-roadmap-coming">
            <span>7</span>
            <div><strong>First-contact mission</strong><small>مهمة نهاية الوحدة في موقف جديد.</small></div>
            <em>قريبًا</em>
          </div>
        </div>

        {currentLesson ? (
          <Link className="sp-roadmap-continue" to={`/speak/scenario/${currentLesson.id}`}>
            <ProductIcon name="speak" size={29} />
            <span>{completedCount === A1_SPEAKING_PILOT_LESSONS.length ? 'كرر آخر درس' : `كمّل: ${currentLesson.titleAr}`}</span>
            <ProductIcon name="chevron" size={24} />
          </Link>
        ) : null}
      </section>

      <section className="sp-roadmap-secondary">
        <div>
          <strong>عايز تتكلم من غير المسار؟</strong>
          <span>المحادثة الحرة لسه موجودة، بس مش هي اللي بتحدد تقدمك في المنهج.</span>
        </div>
        <Link to="/speak/just-chat">محادثة حرة</Link>
      </section>

      {completedCount > 0 ? <button className="sp-roadmap-reset" type="button" onClick={resetPilot}>إعادة تجربة المسار من الأول</button> : null}
    </section>
  );
}
