import type { PracticeMissionContract } from '../types';

/** Reviewed example lines, never learner speech. No model-authored scene facts. */
export function lessonDialogue(mission: PracticeMissionContract) {
  const turns = mission.canonicalDialogue.slice(0, 10);
  if (!turns.some((turn) => turn.speaker === 'learner') ||
      !turns.some((turn) => turn.speaker === 'ai_role')) return [];
  const setting = (mission.titleEn + ' ' + mission.openingMoveEn).toLowerCase();
  const problem = /wrong|problem|complaint|refund|repeat|understand/.test(setting);
  const social = /meet|friend|plan|introduc/.test(setting);
  return turns.map((turn) => ({
    speaker: turn.speaker === 'ai_role' ? 'Partner' : 'Learner',
    text: turn.text,
    style: turn.speaker === 'ai_role'
      ? problem ? 'attentive, sympathetic and reassuring' : social ? 'bright, curious and friendly' : 'welcoming, helpful and natural'
      : problem ? 'polite, concerned but composed' : social ? 'interested, relaxed and upbeat' : 'polite, curious and natural',
  }));
}

export const LESSON_TTS_MODEL = 'gemini-3.8-flash-tts';

/** Human-reviewed reference translations, index-aligned with canonical dialogue.
 * A missing translation stays hidden; never fabricate a translation to fill it.
 */
const arabic: Record<string, string[]> = {
  'a1-ask-place-location': [
    'أهلًا.', 'لو سمحت، فين البنك؟', 'امشي شمال. البنك جنب الكافيه.', 'شمال، جنب الكافيه؟',
    'أيوه، بالضبط.', 'شكرًا.', 'العفو.',
  ],
  'a1-ask-repeat': [
    'أهلًا. الحصة بتبدأ الساعة ستة في أوضة رقم خمستاشر.',
    'معلش، ممكن تقول رقم الأوضة تاني، لو سمحت؟', 'أوضة رقم خمستاشر.',
    'أوضة رقم خمستاشر؟', 'أيوه، صح. العفو.',
  ],
  'a1-make-simple-plan': [
    'تحب نتفرج على فيلم يوم السبت؟', 'آه، فكرة حلوة.', 'الساعة ستة ولا سبعة؟',
    'ستة، لو سمحت.', 'نتقابل عند السينما؟', 'آه، عند السينما.',
    'تمام. السبت الساعة ستة عند السينما.', 'جميل. أشوفك.',
  ],
  'a1-meet-someone-new': [
    'أهلًا، أنا مايا. إيه اسمك؟', 'أهلًا، أنا أليكس.',
    'تشرفت بيك يا أليكس. عامل إيه؟', 'كويس، شكرًا. وإنت؟',
    'أنا كويس، شكرًا. تشرفت بيك.', 'وأنا كمان اتشرفت بيك.', 'أشوفك جوه.',
  ],
  'a1-order-drink': [
    'أهلًا. تحب تطلب إيه؟', 'ممكن قهوة لو سمحت؟', 'صغير ولا كبير؟',
    'صغير، لو سمحت.', 'تلاتة دولار، لو سمحت.', 'تمام، شكرًا.', 'شكرًا ليك.',
  ],
  'a2-order-with-preferences': [
    'أهلًا. تحب تطلب إيه؟', 'عايز قهوة لو سمحت.', 'تحب أي حجم؟',
    'كبير، لو سمحت.', 'سخنة ولا ساقعة؟', 'سخنة، لو سمحت.',
    'تحب لبن أو سكر؟', 'لبن، لو سمحت. من غير سكر.',
    'تمام. أربعة دولار، لو سمحت.', 'شكرًا.',
  ],
  'b1-resolve-wrong-order': [
    'أهلًا. إيه المشكلة؟', 'أنا طلبت قهوة سخنة، بس دي شاي ساقع.',
    'آسف على اللي حصل. ممكن أعمل لك القهوة تاني، بس هتاخد عشر دقايق.',
    'أنا لازم أمشي بعد خمس دقايق. فيه حل أسرع؟',
    'ممكن أعمل لك قهوة وسط دلوقتي وأرجع لك دولار، أو أرجع لك فلوسك كلها.',
    'ينفع القهوة الوسط تبقى بلبن ومن غير سكر؟', 'طبعًا. كده ينفع معاك؟',
    'أيوه، هاخدها، لو سمحت.',
    'قهوة وسط بلبن ومن غير سكر، ودولار راجع لك. آسف على اللخبطة.',
  ],
};

export function dialogueTranslation(mission: PracticeMissionContract, index: number): string | null {
  return arabic[mission.slug]?.[index] || null;
}
