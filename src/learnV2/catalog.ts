import { A1_LEARN_V2_LESSONS } from './a1Lessons';
import { B1_LEARN_V2_LESSONS } from './b1Lessons';

export type LearnV2PrepRole = 'use' | 'hear';

export interface LearnV2PrepItem {
  id: string;
  english: string;
  meaningAr: string;
  exampleEn: string;
  noteAr?: string;
  role: LearnV2PrepRole;
}

export interface LearnV2MoveStep {
  labelEn: string;
  explanationAr: string;
}

export interface LearnV2ListeningTurn {
  speaker: string;
  text: string;
  style?: string;
}

export interface LearnV2ListeningQuestion {
  id: string;
  promptAr: string;
  options: string[];
  answerIndex: number;
  feedbackAr: string;
}

export interface LearnV2ListeningClip {
  id: string;
  titleAr: string;
  subtitleAr: string;
  speakers: Array<{ speaker: string; voice: string }>;
  turns: LearnV2ListeningTurn[];
  questions: LearnV2ListeningQuestion[];
}

export interface LearnV2Lesson {
  id: string;
  level: 'A1' | 'B1';
  unit: number;
  lesson: number;
  code: string;
  titleEn: string;
  titleAr: string;
  estimatedMinutes: number;
  goalAr: string;
  goalExample: string[];
  prepIntroAr: string;
  prepItems: LearnV2PrepItem[];
  move: {
    eyebrowAr: string;
    titleAr: string;
    introAr: string;
    steps: LearnV2MoveStep[];
    example: Array<{ speaker: string; text: string }>;
    noteAr: string;
    languageNote?: Array<{ form: string; explanationAr: string }>;
  };
  listeningIntroAr: string;
  listeningClips: LearnV2ListeningClip[];
  missionScenarioId: string;
  missionTitleAr: string;
  missionSetupAr: string;
  missionUsefulLanguage: string[];
  sourceNoteAr: string;
}

export const LEARN_V2_LESSONS: LearnV2Lesson[] = [
  ...A1_LEARN_V2_LESSONS,
  ...B1_LEARN_V2_LESSONS,
];

const LESSONS_BY_ID = new Map(LEARN_V2_LESSONS.map((lesson) => [lesson.id, lesson]));
const CLIPS_BY_ID = new Map(
  LEARN_V2_LESSONS.flatMap((lesson) => lesson.listeningClips.map((clip) => [clip.id, clip] as const)),
);

export function learnV2LessonById(id?: string) {
  return id ? LESSONS_BY_ID.get(id) : undefined;
}

export function learnV2ListeningClipById(id?: string) {
  return id ? CLIPS_BY_ID.get(id) : undefined;
}
