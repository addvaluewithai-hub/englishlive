import { useNavigate, useParams } from 'react-router-dom';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { PracticeTutor } from '../practice/tutor/PracticeTutor';

export function PracticeLiveScreen() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const mission = practiceMissionContractBySlug(missionId);
  if (!mission) return <p>Mission unavailable.</p>;
  return <PracticeTutor key={mission.slug} mission={mission} phase="roleplay"
    onClose={() => navigate(`/practice/mission/${mission.slug}`)}
    onFinish={(state) => navigate(`/practice/complete/${mission.slug}`, { replace: true, state })} />;
}
