import type { PracticeMissionContract } from './types';
import type { PracticeCorrectionRecord } from './runtime';

export function briefingNarration(mission: PracticeMissionContract, locale: 'ar' | 'en') {
  const brief = mission.briefing;
  const scene = locale === 'ar' ? brief?.situationAr || mission.goalAr : brief?.situationEn || mission.titleEn;
  const success = locale === 'ar' ? brief?.successAr || mission.goalAr : brief?.successEn || mission.titleEn;
  const steps = locale === 'ar' ? brief?.requiredMovesAr : brief?.requiredMovesEn;
  const facts = brief?.facts?.map((f) => (locale === 'ar' ? f.labelAr : f.labelEn) + ': ' + f.value) ?? [];
  const sample = mission.canonicalDialogue.slice(0, 12).map((turn) =>
    (turn.speaker === 'ai_role' ? 'Staff' : 'Learner') + ': ' + turn.text).join('\n');
  const instruction = [
    'You are Otti, the speaking tutor introducing a short English roleplay.',
    locale === 'ar' ? 'Explain the scene in friendly Egyptian Arabic. Speak the model dialogue in clear, simple English.' :
      'Explain in friendly, simple English. Speak the model dialogue clearly.',
    'Be warm but concise. Speak directly to the learner. No microphone input is active.',
    'State only the authored facts, goal and moves. Do not invent prices, details or surprise challenges.',
    'Demonstrate BOTH characters of the sample by saying Staff and Learner before their lines, with a little pause between lines.',
    'This is only a SAMPLE; tell the learner they can say things differently. This is not their actual conversation and must not be evaluated.',
    'No grades, no tests, no tool use.',
  ].join(' ');
  const text = [
    'Read this short Otti introduction aloud in a natural voice. Start speaking now.',
    'SETTING: ' + scene,
    'KNOWN FACTS: ' + (facts.length ? facts.join('; ') : mission.truthEn.join('; ')),
    'LEARNER GOAL: ' + success,
    'PRACTISE THESE: ' + (steps?.length ? steps.join('; ') : mission.beats.filter((x) => x.type === 'required').map((x) => x.learnerIntentEn).join('; ')),
    'EXAMPLE CONVERSATION (demonstrate this in English, not a real learner):\n' + sample,
    locale === 'ar' ? 'END: دي مجرد أمثلة. اتكلم بطريقتك، ولما تبقى جاهز ابدأ المحادثة.' :
      'END: That is just an example. Use your own words when you start.',
  ].join('\n\n');
  return { instruction, text };
}

export function reviewNarration(mission: PracticeMissionContract, locale: 'ar' | 'en', corrections: PracticeCorrectionRecord[]) {
  const items = corrections.slice(0, 8).map((issue, index) =>
    `${index + 1}. HEARD: ${JSON.stringify(issue.originalEn)}. BETTER: ${JSON.stringify(issue.betterEn)}. WHY: ${locale === 'ar' ? issue.feedbackAr : issue.feedbackEn}`);
  const instruction = [
    'You are Otti, the same kind voice the learner just spoke with, now giving a spoken review.',
    locale === 'ar' ? 'Speak in friendly Egyptian Arabic, reading original and improved English lines in clear English.' :
      'Speak friendly, clear English.',
    'Only discuss the attached tool-recorded issues. They are observations, not guaranteed perfect transcripts.',
    'Do not invent errors, achievements, scores, or quoted learner speech. If there are no issues, say only that none were recorded, NOT that the learner was flawless.',
    'Speak briefly, encourage another try, no tool use, no interactive questions.',
  ].join(' ');
  const text = [
    'Give the learner a short friendly spoken review of the finished mission ' + mission.titleEn + '.',
    items.length ? 'OBSERVED ISSUES:\n' + items.join('\n') : 'NO CONFIDENT LANGUAGE ISSUES WERE RECORDED IN THIS SESSION.',
    locale === 'ar' ? 'اختتم بجملة تشجيع على المحاولة مرة تانية.' : 'Finish with a brief friendly invitation to try again.',
  ].join('\n\n');
  return { instruction, text };
}
