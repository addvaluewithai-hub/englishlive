import { useNavigate, useParams } from 'react-router-dom';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { PracticeTutor } from '../practice/tutor/PracticeTutor';

export function PracticeMissionScreen() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const mission = practiceMissionContractBySlug(missionId);
  if (!mission) return <p>Mission unavailable.</p>;
  return <PracticeTutor key={mission.slug} mission={mission} phase="briefing"
    onClose={() => navigate(`/practice/${mission.level}/world/${mission.worldId}`)}
    onFinish={(_, relaxed) => navigate(`/practice/live/${mission.slug}${relaxed ? '?pace=relaxed' : ''}`)} />;
}
