import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { characterRegistry } from '../character/registry';
import { saveCloudProfile } from '../cloud/userData';
import { ProductIcon } from '../components/ProductIcon';
import { readLearnerProfile, saveLearnerProfile } from '../product/profile';

const teacherCopy: Record<string, string> = {
  otti: 'مدرس Englotti الأساسي: خفيف، مشجّع، وبيفضل جنبك خطوة بخطوة.',
  hakim: 'هادي، متفهم، وسهل في الكلام.',
  reem: 'دافئة، فضولية، ومشجعة دايمًا.',
  marwan: 'مريح، سريع البديهة، ويحب التحدي.',
  amal: 'واضحة، مليانة طاقة، ومتفاعلة.',
};

export function CharacterSelectScreen() {
  const navigate = useNavigate();
  const profile = readLearnerProfile();
  const [selectedId, setSelectedId] = useState(profile?.characterId ?? characterRegistry[0].id);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function rememberPartner(characterId: string) {
    if (!profile || savingId) return;
    const next = { ...profile, characterId };
    setSelectedId(characterId);
    setSavingId(characterId);
    setError(null);
    try {
      const cloud = await saveCloudProfile(next);
      saveLearnerProfile({ ...next, createdAt: cloud.createdAt || next.createdAt });
      navigate('/home');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر حفظ المدرس. جرّب تاني.');
      setSelectedId(profile.characterId);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="v2-character-screen" dir="rtl">
      <header className="v2-character-heading">
        <span className="v2-kicker">مدرسك</span>
        <h1>مين تحب يكمل معاك؟</h1>
        <p>Otti هو مدرس Englotti الأساسي، وتقدر تبدّل لشخصية تانية في أي وقت من غير ما يتغير ترتيب دروسك أو تقدمك.</p>
      </header>

      {error ? <div className="v2-auth-error" role="alert">{error}</div> : null}

      <div className="v2-character-grid">
        {characterRegistry.map((character) => {
          const selected = character.id === selectedId;
          const isOtti = character.id === 'otti';
          return (
            <button
              key={character.id}
              type="button"
              className={`v2-character-card${isOtti ? ' is-otti' : ''}${selected ? ' is-selected' : ''}`}
              data-character={character.id}
              style={{ '--character-accent': character.accent } as CSSProperties}
              onClick={() => void rememberPartner(character.id)}
              disabled={savingId !== null}
            >
              <span className="v2-character-check">{selected ? <ProductIcon name="check" size={21} /> : null}</span>
              <div className="v2-character-art"><CharacterPortrait character={character} pose={isOtti ? 'wave' : 'idle'} /></div>
              <strong>{character.name}</strong>
              <span>{savingId === character.id ? 'بنحفظ اختيارك…' : teacherCopy[character.id] ?? character.tagline}</span>
            </button>
          );
        })}
      </div>

      <div className="v2-character-hint">المنهج والأهداف التعليمية ثابتة. اللي بيتغير هو حضور المدرس وطريقته في الحوار.</div>
    </section>
  );
}
