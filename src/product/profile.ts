export const learningGoals = ['work', 'interviews', 'travel', 'everyday', 'study'] as const;
export type LearningGoal = (typeof learningGoals)[number];

export const speakingComfortLevels = ['freeze', 'manage', 'natural', 'challenge'] as const;
export type SpeakingComfort = (typeof speakingComfortLevels)[number];

export interface LearnerProfile {
  version: 1;
  firstName: string;
  goals: LearningGoal[];
  comfort: SpeakingComfort;
  characterId: string;
  createdAt: string;
}

const STORAGE_KEY = 'englishlive.learner-profile.v1';

const goalLabels: Record<LearningGoal, string> = {
  work: 'Work & meetings',
  interviews: 'Interviews',
  travel: 'Travel',
  everyday: 'Everyday confidence',
  study: 'Study & ideas',
};

const comfortLabels: Record<SpeakingComfort, string> = {
  freeze: 'I understand English, but I freeze when I speak.',
  manage: 'I can manage simple conversations.',
  natural: 'I can speak, but I want to sound more natural.',
  challenge: 'I am comfortable speaking and want more challenge.',
};

const goalPrompts: Record<LearningGoal, string> = {
  work: 'be more comfortable speaking in meetings, updates, and workplace conversations',
  interviews: 'answer interview questions clearly and tell useful stories about their experience',
  travel: 'handle spontaneous travel conversations without switching back to their first language',
  everyday: 'feel relaxed and natural in everyday English conversations',
  study: 'explain ideas, opinions, and what they are learning in clear spoken English',
};

const nextConversation: Record<LearningGoal, { title: string; description: string }> = {
  work: {
    title: 'Explain an update clearly',
    description: 'Practice giving context, explaining what changed, and answering a follow-up question.',
  },
  interviews: {
    title: 'Tell a strong story about yourself',
    description: 'Turn a real experience into a clear beginning, middle, and outcome.',
  },
  travel: {
    title: 'Handle a plan changing',
    description: 'Stay calm, clarify details, and make a new plan without rehearsed lines.',
  },
  everyday: {
    title: 'Keep a conversation moving',
    description: 'Say more than the safe answer, ask back, and recover when you lose a word.',
  },
  study: {
    title: 'Explain an idea in your own words',
    description: 'Build a longer answer, clarify what you mean, and respond to a challenge.',
  },
};

function isGoal(value: unknown): value is LearningGoal {
  return typeof value === 'string' && (learningGoals as readonly string[]).includes(value);
}

function isComfort(value: unknown): value is SpeakingComfort {
  return typeof value === 'string' && (speakingComfortLevels as readonly string[]).includes(value);
}

export function readLearnerProfile(): LearnerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<LearnerProfile>;
    if (
      value.version !== 1 ||
      typeof value.firstName !== 'string' ||
      !Array.isArray(value.goals) ||
      !value.goals.every(isGoal) ||
      !isComfort(value.comfort) ||
      typeof value.characterId !== 'string' ||
      typeof value.createdAt !== 'string'
    ) return null;
    return value as LearnerProfile;
  } catch {
    return null;
  }
}

export function saveLearnerProfile(profile: LearnerProfile) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearLearnerProfile() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function goalLabel(goal: LearningGoal) {
  return goalLabels[goal];
}

export function comfortLabel(comfort: SpeakingComfort) {
  return comfortLabels[comfort];
}

export function goalPrompt(goal: LearningGoal) {
  return goalPrompts[goal];
}

export function nextConversationForGoal(goal: LearningGoal | undefined) {
  return nextConversation[goal ?? 'everyday'];
}
