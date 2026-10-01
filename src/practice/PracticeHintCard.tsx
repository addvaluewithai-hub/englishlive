import { usePracticeMissionRuntime } from './runtime';

type PracticeRuntime = ReturnType<typeof usePracticeMissionRuntime>;

export function PracticeHintCard({
  runtime,
  learnerTurn,
}: {
  runtime: PracticeRuntime;
  learnerTurn: boolean;
}) {
  const { activeBeat, supportLevel } = runtime;
  if (!learnerTurn || !activeBeat || activeBeat.type === 'ending' || !activeBeat.intentHintAr) return null;

  if (supportLevel === 0) {
    return (
      <button type="button" className="practice-hint-toggle" onClick={() => runtime.revealSupport(1)}>
        <span aria-hidden="true">💡</span>
        <strong>محتاج Hint؟</strong>
        <small>افتح المعنى بالعربي</small>
      </button>
    );
  }

  return (
    <aside className="practice-hint-card" aria-label="مساعدة للموقف">
      <header>
        <div>
          <span aria-hidden="true">💡</span>
          <small>قول المعنى ده بالإنجليزي بطريقتك</small>
        </div>
        <button type="button" onClick={runtime.hideSupport} aria-label="إخفاء التلميح">×</button>
      </header>

      <strong className="practice-hint-intent">{activeBeat.intentHintAr}</strong>

      {supportLevel >= 2 && activeBeat.usefulLanguageEn?.length ? (
        <div className="practice-hint-language" dir="ltr">
          {activeBeat.usefulLanguageEn.map((item) => <span key={item}>{item}</span>)}
        </div>
      ) : null}

      {supportLevel >= 3 && activeBeat.fullHelpExamplesEn?.length ? (
        <div className="practice-hint-full" dir="ltr">
          <small>Example — مش لازم تقولها بنفس الصياغة</small>
          <strong>{activeBeat.fullHelpExamplesEn[0]}</strong>
        </div>
      ) : null}

      <footer>
        {supportLevel < 2 && activeBeat.usefulLanguageEn?.length ? (
          <button type="button" onClick={() => runtime.revealSupport(2)}>كلمات تساعدني</button>
        ) : null}
        {supportLevel < 3 && activeBeat.fullHelpExamplesEn?.length ? (
          <button type="button" onClick={() => runtime.revealSupport(3)}>ساعدني أقولها</button>
        ) : null}
      </footer>
    </aside>
  );
}
