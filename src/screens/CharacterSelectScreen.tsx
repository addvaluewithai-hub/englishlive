import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { characterRegistry } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { readLearnerProfile, saveLearnerProfile } from '../product/profile';

const teacherCopy: Record<string, string> = {
  hakim: 'هادي، متفهم، وسهل في الكلام.',
  reem: 'دافئة، فضولية، ومشجعة دايمًا.',
  marwan: 'مريح، سريع البديهة، ويحب التحدي.',
  amal: 'واضحة، مليانة طاقة، ومتفاعلة.',
};

export function CharacterSelectScreen() {
  const profile = readLearnerProfile();
  const selectedId = profile?.characterId ?? characterRegistry[0].id;

  function rememberPartner(characterId: string) {
    if (!profile) return;
    saveLearnerProfile({ ...profile, characterId });
  }

  return (
    <section className="v2-character-screen" dir="rtl">
      <header className="v2-character-heading">
        <span className="v2-kicker">مدرسك</span>
        <h1>اختر مدرسك</h1>
        <p>اختار الشخصية اللي ترتاح معاها. تغيير المدرس ما يغيرش ترتيب الدروس ولا تقدمك.</p>
      </header>

      <div className="v2-character-grid">
        {characterRegistry.map((character) => {
          const selected = character.id === selectedId;
          return (
            <Link
              key={character.id}
              className={`v2-character-card${selected ? ' is-selected' : ''}`}
              style={{ '--character-accent': character.accent } as CSSProperties}
              to="/home"
              onClick={() => rememberPartner(character.id)}
            >
              <span className="v2-character-check">{selected ? <ProductIcon name="check" size={21} /> : null}</span>
              <div className="v2-character-art"><CharacterPortrait character={character} /></div>
              <strong>{character.name}</strong>
              <span>{teacherCopy[character.id] ?? character.tagline}</span>
            </Link>
          );
        })}
      </div>

      <div className="v2-character-hint">شخصية المدرس وطريقته ممكن تتغير، لكن المنهج والأهداف التعليمية ثابتة.</div>
    </section>
  );
}
