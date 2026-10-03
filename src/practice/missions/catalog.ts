import { A1_ASK_REPEAT_MISSION } from './a1AskRepeat';
import { A1_MEET_SOMEONE_MISSION } from './a1MeetSomeone';
import { A1_ORDER_DRINK_MISSION } from './a1OrderDrink';

export const PRACTICE_MISSION_CONTRACTS = [
  A1_MEET_SOMEONE_MISSION,
  A1_ASK_REPEAT_MISSION,
  A1_ORDER_DRINK_MISSION,
] as const;

export function practiceMissionContractBySlug(slug?: string) {
  return PRACTICE_MISSION_CONTRACTS.find((mission) => mission.slug === slug) ?? null;
}
