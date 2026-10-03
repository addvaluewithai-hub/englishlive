import { useParams, useSearchParams } from 'react-router-dom';
import { learnV2GuidedConversationByScenarioId } from '../speaking/learnV2Guided';
import { GuidedSpeakingLiveScreen } from './GuidedSpeakingLiveScreen';
import { SpeakingLiveScreen } from './SpeakingLiveScreen';

export function SpeakingLiveEntryScreen() {
  const { scenarioId } = useParams();
  const [params] = useSearchParams();
  const guided = learnV2GuidedConversationByScenarioId(scenarioId);
  const round = params.get('round');

  if (guided && round !== 'independent') return <GuidedSpeakingLiveScreen />;
  return <SpeakingLiveScreen />;
}
