import { Link } from 'react-router-dom';
import { CharacterPortrait } from '../character/CharacterPortrait';
import { OttiMark } from '../character/otti/OttiMark';
import { getCharacterDefinition } from '../character/registry';
import { ProductIcon } from '../components/ProductIcon';
import { readLearnerProfile } from '../product/profile';

export function LandingScreen() {
  const profile = readLearnerProfile();
  const featured = getCharacterDefinition('otti');
  const primaryHref = profile ? '/home' : '/onboarding';

  return (
    <div className="qa-landing" dir="rtl">
      <header className="qa-landing-header">
        <Link className="qa-landing-brand" to="/" aria-label="Englotti">
          <span aria-hidden="true"><OttiMark /></span>
          <strong>Englotti</strong>
        </Link>
        <Link className="qa-landing-header-cta" to={primaryHref}>{profile ? 'كمّل تعلمك' : 'ابدأ الآن'}</Link>
      </header>

      <main>
        <section className="qa-landing-hero">
          <div className="qa-landing-copy">
            <span className="qa-landing-kicker">منهج منظم · Otti معاك Live · كلام من أول درس</span>
            <h1>اتعلم الإنجليزي<br />وأنت <em>بتتكلم فعلًا.</em></h1>
            <p>امشِ في Levels وUnits ودروس مرتبة. Otti يشرح بالعربي لما تحتاج، يستخدم السبورة، يسمع إجابتك، وبعدها يحوّل اللي اتعلمته لمحادثة حقيقية.</p>
            <div className="qa-landing-actions">
              <Link className="qa-landing-primary" to={primaryHref}>
                <ProductIcon name="play" size={21} />
                <span>{profile ? 'كمّل من مكانك' : 'ابدأ A1'}</span>
              </Link>
              <a className="qa-landing-secondary" href="#how">شوف التجربة</a>
            </div>
            <div className="qa-landing-proof">
              <span><ProductIcon name="check" size={17} /> شرح صغير</span>
              <span><ProductIcon name="check" size={17} /> تطبيق بصوتك</span>
              <span><ProductIcon name="check" size={17} /> محادثة Live</span>
            </div>
          </div>

          <div className="qa-landing-teacher-card qa-landing-otti-card">
            <div className="qa-landing-teacher-art"><CharacterPortrait character={featured} pose="wave" /></div>
            <div className="qa-landing-teacher-copy">
              <small>قابل Otti، مدرسك الأساسي</small>
              <strong>“ناخد حاجة صغيرة، نجربها سوا، وبعدها تستخدمها في الكلام.”</strong>
              <span>{featured.name} · مدرس Englotti ورفيق رحلتك</span>
            </div>
          </div>
        </section>

        <section className="qa-landing-flow" id="how">
          <div className="qa-landing-section-heading">
            <span>شكل الدرس</span>
            <h2>مش فيديو وبعده شات.<br />الشرح والممارسة نفس التجربة.</h2>
          </div>
          <div className="qa-landing-flow-grid">
            <article><b>01</b><strong>افهم</strong><p>شرح قصير وواضح بالعربي، والإنجليزي المستهدف ظاهر قدامك.</p></article>
            <article><b>02</b><strong>جرّب</strong><p>Otti يسألك أو يعمل معاك موقف صغير، ويستنى إجابتك بصوتك.</p></article>
            <article><b>03</b><strong>اتكلم</strong><p>نجمع اللي اتعلمته في حوار طبيعي، مع تصحيح ومساعدة وقت الحاجة.</p></article>
          </div>
        </section>

        <section className="qa-landing-split">
          <div><span>Learn</span><h2>عارف دايمًا إيه الخطوة الجاية.</h2><p>مستوى، وحدة، درس. المنهج هو اللي يحدد المسار، وOtti يقدمه بشكل حي.</p></div>
          <div><span>Free Speak</span><h2>ولما تحب تتكلم بس… اتكلم.</h2><p>محادثة حرة جنب المنهج، من غير ما نزوّر تقدم درس ماخدتوش.</p></div>
        </section>

        <section className="qa-landing-final">
          <OttiMark className="qa-landing-final-mark" />
          <h2>جاهز تبدأ أول محادثة مع Otti؟</h2>
          <p>A1 بيبدأ بخطوات صغيرة جدًا، وكل خطوة بتستخدمها فورًا بصوتك.</p>
          <Link className="qa-landing-primary" to={primaryHref}>{profile ? 'افتح Englotti' : 'ابدأ أول درس'}</Link>
        </section>
      </main>
    </div>
  );
}
