import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import {
  PRACTICE_LEVELS,
  isPracticeLevelId,
  practiceMissionsForWorld,
  practiceWorldById,
  savePracticeLevel,
  type PracticeLevelId,
} from '../practice/catalog';

export function PracticeWorldScreen() {
  const { levelId, worldId } = useParams();
  const level: PracticeLevelId = isPracticeLevelId(levelId) ? levelId : 'A1';
  const world = practiceWorldById(worldId);
  const missions = practiceMissionsForWorld(level, world.id);

  return (
    <section className="practice-world-screen" dir="rtl">
      <header className="practice-world-header">
        <Link className="practice-back-link" to="/practice">
          <span aria-hidden="true">→</span>
          <span>كل العوالم</span>
        </Link>

        <div className="practice-world-title-row">
          <span className="practice-world-hero-emoji" aria-hidden="true">{world.emoji}</span>
          <div>
            <span className="practice-eyebrow">Practice • {level}</span>
            <h1>{world.titleAr}</h1>
            <p>{world.subtitleAr}</p>
          </div>
        </div>
      </header>

      <section className="practice-world-levels" aria-label="غيّر مستوى المواقف">
        <span>المستوى</span>
        <div>
          {PRACTICE_LEVELS.map((item) => (
            <Link
              key={item.id}
              className={item.id === level ? 'is-selected' : ''}
              to={`/practice/${item.id}/world/${world.id}`}
              onClick={() => savePracticeLevel(item.id)}
              dir="ltr"
            >
              {item.id}
            </Link>
          ))}
        </div>
      </section>

      <section className="practice-mission-section" aria-labelledby="practice-missions-heading">
        <div className="practice-section-heading">
          <div>
            <span className="practice-section-kicker">مواقف {level}</span>
            <h2 id="practice-missions-heading">اختار Mission</h2>
          </div>
          <span className="practice-library-count">{missions.length ? `${missions.length} مخطط لها` : 'المكتبة لسه بتتبني'}</span>
        </div>

        {missions.length ? (
          <div className="practice-mission-grid">
            {missions.map((mission) => {
              const body = (
                <>
                  <div className="practice-mission-topline">
                    <span className="practice-mission-level" dir="ltr">{mission.level}</span>
                    <span className={`practice-mission-status is-${mission.status}`}>{mission.status === 'live' ? 'متاح' : 'قريبًا'}</span>
                  </div>
                  <h3>{mission.titleAr}</h3>
                  <strong dir="ltr">{mission.titleEn}</strong>
                  <p>{mission.descriptionAr}</p>
                  <footer>
                    <span>◷ حوالي {mission.durationMinutes} دقائق</span>
                    {mission.status === 'live' ? <span className="practice-mission-go">ابدأ <ProductIcon name="chevron" size={17} /></span> : <span>بنبني الـblueprint</span>}
                  </footer>
                </>
              );

              return mission.status === 'live' && mission.livePath ? (
                <Link key={mission.id} className="practice-mission-card is-live" to={mission.livePath}>{body}</Link>
              ) : (
                <article key={mission.id} className="practice-mission-card is-planned">{body}</article>
              );
            })}
          </div>
        ) : (
          <div className="practice-empty-world">
            <span aria-hidden="true">🧩</span>
            <h3>المكان جاهز للمحتوى</h3>
            <p>هنضيف Missions {level} هنا واحدة واحدة من مكتبة Practice الجديدة، من غير ما نملأها بمواقف لمجرد العدد.</p>
            <Link to="/practice">جرّب عالم تاني</Link>
          </div>
        )}
      </section>

      <aside className="practice-world-note">
        <strong>الـHints جزء من الـMission نفسها</strong>
        <p>لما الـmission تبقى live، كل beat هيكون عنده intent واضح، Hint بالعربي، useful words، وfull help عند الحاجة.</p>
      </aside>
    </section>
  );
}
