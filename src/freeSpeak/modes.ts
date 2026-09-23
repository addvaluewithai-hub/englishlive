export const FREE_SPEAK_MODES = [
  {
    id: 'just-chat',
    title: 'Just chat',
    description: 'A relaxed conversation about familiar things, with no lesson path or score.',
    prompt: 'Have a natural two-way conversation on familiar topics. Follow the learner’s interests, ask genuine follow-ups, and avoid turning the chat into a lesson unless they explicitly ask for help.',
  },
  {
    id: 'work',
    title: 'Work conversation',
    description: 'Talk through ordinary work situations, plans, decisions, meetings, and ideas.',
    prompt: 'Have a natural work-related conversation at the learner’s level. Keep it realistic and collaborative rather than running an interview or assessment.',
  },
  {
    id: 'travel',
    title: 'Travel & everyday situations',
    description: 'Practise the kind of spontaneous English that happens while travelling or using services.',
    prompt: 'Create a natural travel or everyday-service conversation. Let the learner choose direction and recover from small misunderstandings naturally.',
  },
  {
    id: 'interview',
    title: 'Interview practice',
    description: 'A flexible interview-style conversation without changing course progress.',
    prompt: 'Run a realistic but supportive interview-style conversation. Ask one question at a time, react naturally, and give brief help only when useful. Do not score or claim proficiency.',
  },
] as const;

export type FreeSpeakModeId = (typeof FREE_SPEAK_MODES)[number]['id'];

export function getFreeSpeakMode(value: string | null | undefined) {
  return FREE_SPEAK_MODES.find((mode) => mode.id === value) ?? FREE_SPEAK_MODES[0];
}
