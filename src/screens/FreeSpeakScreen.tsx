import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { FREE_SPEAK_MODES } from '../freeSpeak/modes';
import { readLearnerProfile } from '../product/profile';

const modeCopy: Record<string, { title: string; body: string }> = {
  'just-chat': { title: 'دردشة عادية', body: 'اتكلم براحتك في موضوع مألوف من غير درس أو اختبار.' },
  work: { title: 'محادثة للعمل', body: 'اجتماعات، خطط، قرارات ومواقف الشغل اليومية.' },
  travel: { title: 'السفر والمواقف اليومية', body: 'تمرّن على الكلام العفوي في السفر والخدمات والمواقف الجديدة.' },
  interview: { title: 'تدريب مقابلة', body: 'مقابلة واقعية لكن داعمة، من غير درجات أو ادعاء مستوى.' },
};

export function FreeSpeakScreen() {
  const profile = readLearnerProfile();

  if (!profile) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>جهز EnglishLive الأول</h1>
        <p>اختار مدرسك وهدفك، وبعدها تقدر تدخل محادثة حرة في أي وقت.</p>
        <Link className="v2-primary-button" to="/onboarding">ابدأ الإعداد</Link>
      </section>
    );
  }

  const character = getCharacterDefinition(profile.characterId);

  return (
    <section className="v2-speak-screen" dir="rtl">
      <header className="v2-speak-hero">
        <div className="v2-speak-copy">
          <span className="v2-kicker">Free Speak</span>
          <h1>اتكلم براحتك</h1>
          <p>محادثة حرة مع {character.name} بعيد عن ترتيب الدروس. اتكلم في اللي تحتاجه النهاردة.</p>
          <Link className="v2-teacher-inline" to="/characters">تغيير المدرس</Link>
        </div>
        <div className="v2-speak-character"><CharacterPortrait character={character} /></div>
      </header>

      <div className="v2-speak-mode-grid">
        {FREE_SPEAK_MODES.map((mode) => {
          const copy = modeCopy[mode.id] ?? { title: mode.title, body: mode.description };
          return (
            <Link key={mode.id} className="v2-speak-mode-card" to={`/speak/${mode.id}?character=${character.id}`}>
              <span className="v2-speak-mode-icon"><ProductIcon name="speak" size={24} /></span>
              <strong>{copy.title}</strong>
              <p>{copy.body}</p>
              <span className="v2-speak-mode-arrow"><ProductIcon name="chevron" size={20} /></span>
            </Link>
          );
        })}
      </div>

      <div className="v2-speak-boundary">
        <strong>المحادثة الحرة ممارسة، مش إكمال درس.</strong>
        <p>الـFree Speak مش هيفتح Lesson أو يغير ترتيب المنهج. تقدمك الدراسي يفضل مرتبط بالدروس المؤلفة.</p>
      </div>
    </section>
  );
}
