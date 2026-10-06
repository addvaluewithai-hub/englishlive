import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { readPresentationPreference, savePresentationPreference } from '../../app/presentationPreferences';
import { experienceProfiles, resolveExperienceProfile, type ExperienceDefinition, type ExperienceProfile } from './profiles';

export const experienceStorageKey = 'englotti.ui.experience.v1';
interface ExperienceContextValue {
  profile: ExperienceDefinition;
  setProfile: (profile: ExperienceProfile) => void;
}
const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileId] = useState(() => resolveExperienceProfile(readPresentationPreference(experienceStorageKey)));
  const value = useMemo<ExperienceContextValue>(() => ({
    profile: experienceProfiles[profileId],
    setProfile: (next) => {
      const resolved = resolveExperienceProfile(next);
      setProfileId(resolved);
      savePresentationPreference(experienceStorageKey, resolved);
    },
  }), [profileId]);
  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const value = useContext(ExperienceContext);
  if (!value) throw new Error('useExperience requires ExperienceProvider');
  return value;
}
