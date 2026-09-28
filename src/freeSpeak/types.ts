export type FreeSpeakSpeaker = 'learner' | 'teacher';

export interface FreeSpeakTurn {
  id: string;
  speaker: FreeSpeakSpeaker;
  text: string;
  atMs: number;
}

export interface FreeSpeakCorrection {
  original: string;
  improved: string;
  noteAr: string;
}

export interface FreeSpeakVocabularyItem {
  word: string;
  meaningAr: string;
  source: 'learner' | 'teacher' | 'asked_about';
}

export interface FreeSpeakRecap {
  schemaVersion: 1;
  headlineAr: string;
  conversationTopicAr: string;
  summaryAr: string;
  strengths: string[];
  corrections: FreeSpeakCorrection[];
  vocabulary: FreeSpeakVocabularyItem[];
  nextFocusAr: string | null;
}

export type FreeSpeakAnalysisStatus = 'pending' | 'complete' | 'error';
export type FreeSpeakSessionStatus = 'active' | 'completed' | 'abandoned' | 'error';

export interface FreeSpeakCloudSession {
  id: string;
  modeId: string;
  characterSlug: string;
  characterName: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  status: FreeSpeakSessionStatus;
  transcript: FreeSpeakTurn[];
  analysis: FreeSpeakRecap | null;
  analysisStatus: FreeSpeakAnalysisStatus;
  analysisModel: string | null;
}
