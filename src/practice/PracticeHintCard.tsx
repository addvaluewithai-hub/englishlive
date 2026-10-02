import { usePracticeMissionRuntime } from './runtime';

type PracticeRuntime = ReturnType<typeof usePracticeMissionRuntime>;

export function PracticeHintCard({
  runtime,
  learnerTurn,
  onRequestHint,
}: {
  runtime: PracticeRuntime;
  learnerTurn: boolean;
  onRequestHint: () => void;
}) {
  const { activeBeat, supportLevel, hintBundle, hintLoading, hintError } = runtime;
  if (!learnerTurn || !activeBeat || activeBeat.type === 'ending') return null;

  if (supportLevel === 0) {
    const cached = hintBundle?.beatId === activeBeat.id;
    return (
      <div className="practice-hint-entry">
        <button
          type="button"
          className={`practice-hint-toggle${hintLoading ? ' is-loading' : ''}`}
          onClick={cached ? () => runtime.revealSupport(1) : onRequestHint}
          disabled={hintLoading}
        >
          <span aria-hidden="true">💡</span>
          <strong>{hintLoading ? 'Otti بيجهّز Hint…' : 'محتاج Hint؟'}</strong>
          <small>
            {hintLoading
              ? 'على حسب اللي حصل فعلًا في المحادثة'
              : cached
                ? 'الـHint جاهزة من نفس السياق — من غير request جديدة'
                : 'هتتعمل على سياق المحادثة الحالية'}
          </small>
        </button>
        {hintError ? <p className="practice-hint-error" role="alert">{hintError}</p> : null}
      </div>
    );
  }

  if (!hintBundle || hintBundle.beatId !== activeBeat.id) return null;

  return (
    <aside className="practice-hint-card" aria-label="مساعدة للموقف">
      <header>
        <div>
          <span aria-hidden="true">💡</span>
          <small>Hint ذكية من سياق المحادثة الحالية</small>
        </div>
        <button type="button" onClick={runtime.hideSupport} aria-label="إخفاء التلميح">×</button>
      </header>

      {hintBundle.contextAr ? <p className="practice-hint-context">{hintBundle.contextAr}</p> : null}
      <strong className="practice-hint-intent">{hintBundle.intentAr}</strong>

      {supportLevel >= 2 && hintBundle.usefulLanguageEn.length ? (
        <div className="practice-hint-language" dir="ltr">
          {hintBundle.usefulLanguageEn.map((item) => <span key={item}>{item}</span>)}
        </div>
      ) : null}

      {supportLevel >= 3 ? (
        <div className="practice-hint-full" dir="ltr">
          <small>Example for this exact moment — مش لازم تقولها بنفس الصياغة</small>
          <strong>{hintBundle.fullResponseEn}</strong>
        </div>
      ) : null}

      <footer>
        {supportLevel < 2 && hintBundle.usefulLanguageEn.length ? (
          <button type="button" onClick={() => runtime.revealSupport(2)}>كلمات تساعدني</button>
        ) : null}
        {supportLevel < 3 ? (
          <button type="button" onClick={() => runtime.revealSupport(3)}>ساعدني أقولها</button>
        ) : null}
      </footer>
    </aside>
  );
}
