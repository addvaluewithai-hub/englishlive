import { speakingAssets } from '../speaking/assets';
import type { SpeakingScenario } from '../speaking/catalog';
import { practiceMissionContractBySlug } from './missions/catalog';

export function practiceScenarioById(scenarioId?: string): SpeakingScenario | null {
  const mission = practiceMissionContractBySlug(scenarioId);
  if (!mission) return null;

  return {
    id: mission.slug,
    worldId: mission.worldId,
    groupId: 'authored-practice',
    titleAr: mission.titleAr,
    descriptionAr: mission.goalAr,
    learnerRoleAr: mission.learnerRoleAr,
    aiRoleAr: mission.aiRoleAr,
    goalAr: mission.goalAr,
    durationMinutes: mission.durationMinutes,
    readiness: 'ready',
    readinessReasonAr: `مصمم لمستوى ${mission.level}.`,
    usesAr: ['اطلب مشروب', 'اختار الحجم', 'كمّل الدفع'],
    image: speakingAssets.foodOut,
    liveCharacterImage: speakingAssets.ottiHero,
    modeId: 'just-chat',
    applicationType: 'practice',
    interactionFocus: ['initiate', 'respond', 'close'],
    partnerBriefEn: `You are the cafe cashier in this authored Practice mission. The mission runtime supplies the exact semantic graph, truth and correction policy. Stay in role and follow it.`,
    openingMoveEn: mission.openingMoveEn,
    hideEvidenceProgress: true,
    returnPath: `/practice/mission/${mission.slug}`,
  };
}
