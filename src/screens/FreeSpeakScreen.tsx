import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { publishedCharacterById, usePublishedCharacters } from '../character/catalog';
import { ProductIcon } from '../components/ProductIcon';
import { fetchLatestFreeSpeakSession } from '../freeSpeak/api';
import { FREE_SPEAK_MODES } from '../freeSpeak/modes';
import type { FreeSpeakCloudSession } from '../freeSpeak/types';
import { readLearnerProfile } from '../product/profile';

const modeCopy: Record<string, { title: string; body: string }> = {
  'just-chat': { title: 'دردشة عادية', body: 'الكلام اليومي عن أي موضوع ييجي في بالك.' },
  work: { title: 'محادثة عمل', body: 'اجتماعات، خطط، قرارات ومواقف الشغل اليومية.' },
  travel: { title: 'السفر والمواقف اليومية', body: 'تمرّن على الكلام في المطاعم والفنادق والمواصلات.' },
  interview: { title: 'تدريب مقابلة', body: 'مقابلة واقعية وأسئلة شائعة بشكل داعم.' },
};

export function FreeSpeakScreen() {
  const profile = readLearnerProfile();
  const { characters } = usePublishedCharacters();
  const [latest, setLatest] = useState<FreeSpeakCloudSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchLatestFreeSpeakSession()
      .then((session) => {
        if (!cancelled) setLatest(session);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  if (!profile) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>جهز Englotti الأول</h1>
        <p>اختار مدرسك وهدفك، وبعدها تقدر تدخل محادثة حرة في أي وقت.</p>
        <Link className="v2-primary-button" to="/onboarding">ابدأ الإعداد</Link>
      </section>
    );
  }

  const character = publishedCharacterById(characters, profile.characterId);
  const primaryHref = `/speak/just-chat?character=${encodeURIComponent(character.id)}`;

  return (
    <section className="fs-home" dir="rtl">
      <header className="fs-home-hero">
        <div className="fs-home-hero-copy">
          <span>Free Speak</span>
          <h1>اتكلم براحتك</h1>
          <p>محادثة حرة مع <bdi dir="ltr">{character.name}</bdi> بعيدًا عن ترتيب الدروس. ابدأ الحوار اللي يناسبك النهاردة.</p>
          <Link to="/characters">تغيير المدرس <ProductIcon name="chevron" size={17} /></Link>
        </div>
        <div className="fs-home-hero-art" aria-hidden="true">
          <CharacterPortrait character={character} pose="wave" />
        </div>
      </header>

      <Link className="fs-primary-chat" to={primaryHref}>
        <span className="fs-primary-chat-arrow"><ProductIcon name="chevron" size={27} /></span>
        <span className="fs-primary-chat-copy">
          <strong>ابدأ دردشة عادية</strong>
          <small>ابدأ محادثة مفتوحة في أي موضوع.</small>
        </span>
        <span className="fs-primary-chat-mic"><ProductIcon name="speak" size={42} /></span>
      </Link>

      <div className="fs-mode-grid">
        {FREE_SPEAK_MODES.map((mode) => {
          const copy = modeCopy[mode.id] ?? { title: mode.title, body: mode.description };
          return (
            <Link
              key={mode.id}
              className="fs-mode-card"
              to={`/speak/${mode.id}?character=${encodeURIComponent(character.id)}`}
            >
              <span className="fs-mode-icon"><ProductIcon name="speak" size={21} /></span>
              <strong>{copy.title}</strong>
              <p>{copy.body}</p>
              <span className="fs-mode-chevron"><ProductIcon name="chevron" size={18} /></span>
            </Link>
          );
        })}
      </div>

      {latest ? (
        <section className="fs-resume-card">
          <div className="fs-resume-art" aria-hidden="true">
            <CharacterPortrait character={publishedCharacterById(characters, latest.characterSlug)} pose="wave" />
          </div>
          <div className="fs-resume-copy">
            <small>مواصلة المحادثة الأخيرة</small>
            <strong>{latest.analysis?.conversationTopicAr ? `كمّل كلامك عن ${latest.analysis.conversationTopicAr}` : 'كمّل من آخر محادثة'}</strong>
            <span>{latest.analysis?.summaryAr || `آخر محادثة كانت ${modeCopy[latest.modeId]?.title ?? 'محادثة حرة'}.`}</span>
            <Link className="fs-last-recap" to={`/speak/recap/${latest.id}`}>شوف الملخص</Link>
          </div>
          <Link
            className="fs-resume-go"
            aria-label="كمّل المحادثة"
            to={`/speak/${latest.modeId}?character=${encodeURIComponent(latest.characterSlug)}&resume=${encodeURIComponent(latest.id)}`}
          >
            <ProductIcon name="chevron" size={22} />
          </Link>
        </section>
      ) : null}
    </section>
  );
}
