import { hasCachedPublishedCatalog } from '../catalog/cache';
import { loadProductCatalog } from '../catalog/client';
import { hasLoadedPublishedCharacters, loadPublishedCharacters } from '../character/catalog';
import { replaceLearnerProfileCache, type LearnerProfile } from '../product/profile';
import { replaceProductCourseProgressCache } from '../productV2/progress';
import { fetchCloudProfile, fetchCloudProgress } from './userData';

const HYDRATED_USER_KEY = 'englishlive.cloud-hydrated-user.v1';

export interface CloudBootstrapResult {
  profile: LearnerProfile | null;
}

export function isCloudHydratedForUser(userId: string) {
  return typeof window !== 'undefined'
    && window.sessionStorage.getItem(HYDRATED_USER_KEY) === userId
    && hasCachedPublishedCatalog()
    && hasLoadedPublishedCharacters();
}

export function markCloudHydratedForUser(userId: string) {
  if (typeof window !== 'undefined') window.sessionStorage.setItem(HYDRATED_USER_KEY, userId);
}

export function clearCloudHydrationMarker() {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(HYDRATED_USER_KEY);
}

export async function hydrateCloudLearnerState(userId?: string): Promise<CloudBootstrapResult> {
  const [, , profile] = await Promise.all([
    loadProductCatalog(),
    loadPublishedCharacters(),
    fetchCloudProfile(),
  ]);

  if (!profile) {
    replaceLearnerProfileCache(null);
    replaceProductCourseProgressCache(null);
    if (userId) markCloudHydratedForUser(userId);
    return { profile: null };
  }

  replaceLearnerProfileCache(profile);
  const progress = await fetchCloudProgress();
  replaceProductCourseProgressCache(progress);
  if (userId) markCloudHydratedForUser(userId);
  return { profile };
}
