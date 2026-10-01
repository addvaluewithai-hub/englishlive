import { Link, useLocation, useParams } from 'react-router-dom';
import { OttiMark } from '../character/otti/OttiMark';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import type { PracticeSupportSummary } from '../practice/runtime';

type CompletionState = {
  support?: PracticeSupportSummary;
  durationSeconds?: number;
};

export function PracticeCompleteScreen() {
  const { missionId } = useParams();
  const mission = practiceMissionContractBySlug(missionId);
  const location = useLocation();
  const state = (location.state ?? {}) as CompletionState;
  const support = state.support ?? { intentHints: 0, usefulLanguageReveals: 0, fullHelpReveals: 0 };
  const usedHelp = support.intentHints + support.usefulLanguageReveals + support.fullHelpReveals > 0;

  if (!mission) return <section className="practice-mission-missing" dir="rtl"><h1>Mission completed</h1><Link to="/practice">الرجوع لـPractice</Link></section>;

  return (
    <section className="practice-complete" dir="rtl">
      <div className="practice-complete-mark"><OttiMark /></div>
      <span className="practice-eyebrow">Mission complete</span>
      <h1>خلصت موقف «{mission.titleAr}»</h1>
      <p>وصلت لنهاية الموقف بنجاح. ده معناه إنك تعاملت مع الـMission دي — مش حكم إن اللغة كلها بقت mastery.</p>

      <div className="practice-complete-summary">
        <div>
          <small>Hints بالعربي</small>
          <strong>{support.intentHints}</strong>
        </div>
        <div>
          <small>Useful words</small>
          <strong>{support.usefulLanguageReveals}</strong>
        </div>
        <div>
          <small>Full help</small>
          <strong>{support.fullHelpReveals}</strong>
        </div>
      </div>

      <section className="practice-complete-note">
        <strong>{usedHelp ? 'استخدمت مساعدة؟ ممتاز — ده جزء من التدريب.' : 'المرة دي خلصتها من غير ما تفتح Hint.'}</strong>
        <p>{usedHelp ? 'لو حابب تقوّي الاستقلال، أعد نفس الموقف وحاول تستخدم مساعدة أقل. مفيش عقوبة على إنك فتحت Hint.' : 'ممكن تعيدها تاني وتشوف هل نفس اللغة هتطلع بسهولة، أو ترجع للمكتبة لموقف جديد.'}</p>
      </section>

      <div className="practice-complete-actions">
        <Link className="practice-complete-primary" to={`/practice/mission/${mission.slug}`}>أعيد الـMission</Link>
        <Link className="practice-complete-secondary" to={`/practice/${mission.level}/world/${mission.worldId}`}>موقف تاني</Link>
      </div>
    </section>
  );
}
