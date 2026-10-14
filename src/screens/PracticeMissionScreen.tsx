import { useNavigate, useParams } from 'react-router-dom';
import { practiceMissionContractBySlug } from '../practice/missions/catalog';
import { PracticeIntroduction } from '../practice/tutor/PracticeIntroduction';

export function PracticeMissionScreen() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const mission = practiceMissionContractBySlug(missionId);
  if (!mission) return <p>Mission unavailable.</p>;
  // The introduction and sample are deliberately static/audio-only. Gemini Live
  // starts ONLY on the following roleplay route, preserving its private notebook.
  return <PracticeIntroduction key={mission.slug} mission={mission}
    onClose={() => navigate(`/practice/${mission.level}/world/${mission.worldId}`)}
    onStart={(relaxed) => navigate(`/practice/live/${mission.slug}${relaxed ? '?pace=relaxed' : ''}`)} />;
}
