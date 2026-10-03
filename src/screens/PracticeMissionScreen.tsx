import { Link, useParams } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import type { PracticeWorldId } from '../practice/catalog';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { speakingAssets } from '../speaking/assets';

function missionVisualForWorld(worldId: PracticeWorldId) {
  switch (worldId) {
    case 'people-social':
      return speakingAssets.meetingPeople;
    case 'food-shopping':
      return speakingAssets.foodOut;
    case 'travel-transport':
      return speakingAssets.ottiTravel;
    case 'work-study':
      return speakingAssets.ottiProgress;
    case 'home-services':
      return speakingAssets.ottiReceptionist;
    case 'plans-leisure':
    case 'everyday':
    default:
      return speakingAssets.ottiHero;
  }
}

export function PracticeMissionScreen() {
  const { missionId } = useParams();
  const mission = practiceMissionContractBySlug(missionId);

  if (!mission) {
    return (
      <section className="practice-mission-missing" dir="rtl">
        <span aria-hidden="true">🧩</span>
        <h1>الـMission دي لسه مش جاهزة</h1>
        <p>ارجع للمكتبة واختار موقف متاح.</p>
        <Link to="/practice">الرجوع لـPractice</Link>
      </section>
    );
  }

  const responseBeats = mission.beats.filter((beat) => beat.type === 'required');
  const missionVisual = missionVisualForWorld(mission.worldId);

  return (
    <section className="practice-start-page" dir="rtl">
      <div className="practice-start-visual" aria-hidden="true">
        <img src={missionVisual} alt="" />
      </div>

      <article className="practice-start-card">
        <Link className="practice-start-back" to={`/practice/${mission.level}/world/${mission.worldId}`}>
          <span aria-hidden="true">→</span>
          <span>رجوع للمواقف</span>
        </Link>

        <div className="practice-start-heading">
          <span className="practice-start-level" dir="ltr">{mission.level}</span>
          <div>
            <small>Practice Mission</small>
            <h1>{mission.titleAr}</h1>
            <strong dir="ltr">{mission.titleEn}</strong>
          </div>
        </div>

        <div className="practice-start-role-row">
          <span>👤 أنت: <strong>{mission.learnerRoleAr}</strong></span>
          <span>🐙 Otti: <strong>{mission.aiRoleAr}</strong></span>
          <span>📍 {mission.settingAr}</span>
        </div>

        <section className="practice-start-goal">
          <span aria-hidden="true">◎</span>
          <div>
            <small>هدفك</small>
            <strong>{mission.goalAr}</strong>
          </div>
        </section>

        <section className="practice-start-flow">
          <header>
            <small>المحادثة مصممة — مش محفوظة</small>
            <strong>إيه اللي هتتمرّن عليه؟</strong>
          </header>
          <ol>
            {responseBeats.map((beat, index) => (
              <li key={beat.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{beat.overviewAr ?? 'اتصرف في الموقف بطريقتك'}</strong>
                  <small>{index === 0 ? 'مش لازم تقول جملة بعينها' : 'المهم توصل المعنى وتكمل الموقف طبيعي'}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="practice-start-hints">
          <div className="practice-start-hint-icon" aria-hidden="true">💡</div>
          <div>
            <strong>الـHint ذكية وبتتعمل وقتها</strong>
            <p>لو وقفت واضغطت Hint، Otti يبني المساعدة على اللي حصل فعلًا في المحادثة. بنجيب المعنى والكلمات والمثال مرة واحدة، وبعدها أنت تكشف المستوى اللي محتاجه من غير requests زيادة.</p>
          </div>
        </section>

        <div className="practice-start-meta">
          <span>◷ حوالي {mission.durationMinutes} دقائق</span>
          <span>🎙️ Live conversation</span>
          <span>✓ التصحيح للغلط الحقيقي فقط</span>
        </div>

        <Link className="practice-start-button" to={`/practice/live/${mission.slug}`}>
          <ProductIcon name="speak" size={30} />
          <span>ابدأ الـMission</span>
          <ProductIcon name="chevron" size={23} />
        </Link>
      </article>
    </section>
  );
}
