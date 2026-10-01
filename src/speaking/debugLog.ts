import type { SpeakingTurn } from './types';

export interface SpeakingDebugLogInput {
  title: string;
  lessonCode?: string;
  roundLabel: string;
  teacherName: string;
  status: string;
  turns: SpeakingTurn[];
  learnerDraft?: string;
  teacherDraft?: string;
}

export function buildSpeakingDebugLog(input: SpeakingDebugLogInput) {
  const rows = [
    'Englotti compact speaking log',
    `Lesson: ${input.lessonCode ? `${input.lessonCode} — ` : ''}${input.title}`,
    `Round: ${input.roundLabel}`,
    `Teacher: ${input.teacherName}`,
    `Status: ${input.status}`,
    '',
  ];

  for (const turn of input.turns) {
    rows.push(`${turn.speaker === 'teacher' ? 'AI' : 'YOU'}: ${turn.text}`);
  }

  const learnerDraft = input.learnerDraft?.trim();
  const teacherDraft = input.teacherDraft?.trim();
  if (learnerDraft) rows.push(`YOU: ${learnerDraft} <live draft>`);
  if (teacherDraft) rows.push(`AI: ${teacherDraft} <live draft>`);

  return rows.join('\n');
}

export async function copyTextWithFallback(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}
