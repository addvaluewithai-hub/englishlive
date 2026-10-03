import { learnArt } from '../../learn/assets';
import type { ExperienceProfile } from '../theme/profiles';

export const mascotArtwork: Record<ExperienceProfile, string> = {
  adult: learnArt.mascotNeutral,
  teen: learnArt.mascotWave,
};
