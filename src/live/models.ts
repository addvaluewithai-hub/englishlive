export const DEFAULT_LIVE_MODEL = 'gemini-3.8-live' as const;
export type LiveModel = typeof DEFAULT_LIVE_MODEL;

export function isLiveModel(value: unknown): value is LiveModel {
  return value === DEFAULT_LIVE_MODEL;
}
