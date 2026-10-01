import { A1_ORDER_DRINK_MISSION } from './a1OrderDrink';

export const PRACTICE_MISSION_CONTRACTS = [A1_ORDER_DRINK_MISSION] as const;

export function practiceMissionContractBySlug(slug?: string) {
  return PRACTICE_MISSION_CONTRACTS.find((mission) => mission.slug === slug) ?? null;
}
