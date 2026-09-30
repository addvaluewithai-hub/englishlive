export type SpeakingTurnSpeaker = 'learner' | 'teacher';

export interface SpeakingTurn {
  id: string;
  speaker: SpeakingTurnSpeaker;
  text: string;
  atMs: number;
}

export type SpeakingEvidenceOutcome = 'demonstrated' | 'emerging' | 'not_observed';

export interface SpeakingEvidenceItem {
  skillId: string;
  outcome: SpeakingEvidenceOutcome;
  evidenceAr: string;
  learnerExcerpt: string | null;
}

export interface SpeakingVocabularyItem {
  word: string;
  meaningAr: string;
  source: 'learner' | 'teacher' | 'asked_about';
}

export interface SpeakingCorrection {
  original: string;
  improved: string;
  noteAr: string;
}

export interface SpeakingRecap {
  schemaVersion: 1;
  headlineAr: string;
  summaryAr: string;
  strengths: string[];
  corrections: SpeakingCorrection[];
  vocabulary: SpeakingVocabularyItem[];
  nextFocusAr: string | null;
  evidence: SpeakingEvidenceItem[];
}

export interface SpeakingScenarioSnapshot {
  titleAr: string;
  learnerRoleAr: string;
  aiRoleAr: string;
  goalAr: string;
  usesAr: string[];
  curriculumRefs: string[];
  interactionFocus: string[];
  curriculumLevel?: string;
  lessonCode?: string;
  targetLanguageEn?: string[];
  correctionFocusEn?: string[];
  boundariesEn?: string[];
}

export type SpeakingSessionStatus = 'active' | 'completed' | 'abandoned' | 'error';
export type SpeakingAnalysisStatus = 'pending' | 'complete' | 'error';

export interface SpeakingCloudSession {
  id: string;
  scenarioId: string;
  difficulty: 'easier' | 'recommended' | 'challenge';
  characterSlug: string;
  characterName: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  status: SpeakingSessionStatus;
  scenarioSnapshot: SpeakingScenarioSnapshot;
  transcript: SpeakingTurn[];
  analysis: SpeakingRecap | null;
  analysisStatus: SpeakingAnalysisStatus;
  analysisModel: string | null;
}

export interface SpeakingProgressSkill {
  skillId: string;
  observations: number;
  demonstrated: number;
  emerging: number;
  lastObservedAt: string | null;
}

export interface SpeakingProgressSnapshot {
  completedSessions: number;
  scenariosPractised: number;
  skillsObserved: number;
  skills: SpeakingProgressSkill[];
}
