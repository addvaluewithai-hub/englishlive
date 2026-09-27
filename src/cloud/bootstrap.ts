import { fetchCloudProfile, fetchCloudProgress } from './userData';
import { replaceLearnerProfileCache, type LearnerProfile } from '../product/profile';
import { replaceProductCourseProgressCache } from '../productV2/progress';

export interface CloudBootstrapResult {
  profile: LearnerProfile | null;
}

export async function hydrateCloudLearnerState(): Promise<CloudBootstrapResult> {
  const profile = await fetchCloudProfile();
  if (!profile) {
    replaceLearnerProfileCache(null);
    replaceProductCourseProgressCache(null);
    return { profile: null };
  }

  replaceLearnerProfileCache(profile);
  const progress = await fetchCloudProgress();
  replaceProductCourseProgressCache(progress);
  return { profile };
}
