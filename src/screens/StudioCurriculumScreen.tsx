import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  createStudioLesson,
  createStudioLevel,
  createStudioUnit,
  loadStudioCurriculum,
  setStudioCurriculumArchived,
  type StudioCurriculumHierarchy,
} from '../studio/curriculum';

interface UnitDraft { slug: string; code: string; title: string }
interface LessonDraft { slug: string; code: string; title: string }

const emptyUnit = (): UnitDraft => ({ slug: '', code: '', title: '' });
const emptyLesson = (): LessonDraft => ({ slug: '', code: '', title: '' });

export function StudioCurriculumScreen() {
  const [hierarchy, setHierarchy] = useState<StudioCurriculumHierarchy | null>(null);
  const [levelCode, setLevelCode] = useState('');
  const [levelTitle, setLevelTitle] = useState('');
  const [unitDrafts, setUnitDrafts] = useState<Record<string, UnitDraft>>({});
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, LessonDraft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      setHierarchy(await loadStudioCurriculum());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر تحميل هيكل المنهج.');
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function addLevel(event: FormEvent) {
    event.preventDefault();
    if (!levelCode.trim() || !levelTitle.trim() || busy) return;
    setBusy('level'); setError(null); setNotice(null);
    try {
      await createStudioLevel({ code: levelCode, title: levelTitle });
      setLevelCode(''); setLevelTitle('');
      await refresh();
      setNotice('اتضاف Level جديد. مش هيظهر للمتعلمين غير لما يبقى تحته Unit وLesson منشورة.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر إضافة الـLevel.');
    } finally { setBusy(null); }
  }

  async function addUnit(event: FormEvent, levelId: string) {
    event.preventDefault();
    const draft = unitDrafts[levelId] ?? emptyUnit();
    if (!draft.slug.trim() || !draft.code.trim() || !draft.title.trim() || busy) return;
    setBusy(`unit:${levelId}`); setError(null); setNotice(null);
    try {
      await createStudioUnit({ levelId, ...draft });
      setUnitDrafts((current) => ({ ...current, [levelId]: emptyUnit() }));
      await refresh();
      setNotice('اتضافت Unit جديدة.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر إضافة الـUnit.');
    } finally { setBusy(null); }
  }

  async function addLesson(event: FormEvent, unitId: string) {
    event.preventDefault();
    const draft = lessonDrafts[unitId] ?? emptyLesson();
    if (!draft.slug.trim() || !draft.code.trim() || !draft.title.trim() || busy) return;
    setBusy(`lesson:${unitId}`); setError(null); setNotice(null);
    try {
      await createStudioLesson({ unitId, ...draft });
      setLessonDrafts((current) => ({ ...current, [unitId]: emptyLesson() }));
      await refresh();
      setNotice('اتعمل Lesson جديد كـDraft جاهز تعدّل JSON بتاعه من Studio وبعدين تنشره.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر إضافة الـLesson.');
    } finally { setBusy(null); }
  }

  async function toggleArchived(entityType: 'level' | 'unit' | 'lesson', id: string, label: string, archived: boolean) {
    if (busy) return;
    const verb = archived ? 'إرجاع' : 'حذف من التطبيق';
    if (!window.confirm(`${verb} ${label}؟\n\nالحذف هنا أرشفة آمنة: البيانات والـrevisions والجلسات القديمة هتفضل محفوظة.`)) return;
    setBusy(`${entityType}:${id}`); setError(null); setNotice(null);
    try {
      await setStudioCurriculumArchived(entityType, id, !archived);
      await refresh();
      setNotice(archived ? 'رجعنا العنصر للمسار.' : 'اتشال من التطبيق واتحفظ في الأرشيف. تقدر ترجعه في أي وقت.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر تحديث حالة العنصر.');
    } finally { setBusy(null); }
  }

  if (!hierarchy && !error) {
    return <section className="studio-gate" dir="rtl"><h1>بنفتح هيكل المنهج…</h1><p>بنحمّل الـLevels والـUnits والـLessons من Neon.</p></section>;
  }

  if (!hierarchy) {
    return <section className="studio-gate" dir="rtl"><h1>تعذر فتح المنهج</h1><p>{error}</p><Link className="v2-secondary-button" to="/studio">رجوع للـStudio</Link></section>;
  }

  return (
    <section className="studio-shell studio-curriculum-shell" dir="rtl">
      <header className="studio-header">
        <div>
          <span className="studio-mark">Englotti Studio</span>
          <h1>هيكل المنهج</h1>
          <p>Level → Unit → Lesson. الإضافة مباشرة، والحذف أرشفة آمنة قابلة للاسترجاع.</p>
        </div>
        <div className="studio-admin studio-curriculum-nav">
          <Link to="/studio">JSON Authoring</Link>
          <Link to="/home">فتح تطبيق المتعلم</Link>
        </div>
      </header>

      {notice ? <div className="studio-notice is-success">{notice}</div> : null}
      {error ? <div className="studio-notice is-error">{error}</div> : null}

      <section className="studio-curriculum-create">
        <div>
          <small>Course</small>
          <strong>{hierarchy.course.title}</strong>
          <span>{hierarchy.course.slug}</span>
        </div>
        <form onSubmit={addLevel}>
          <input value={levelCode} onChange={(event) => setLevelCode(event.target.value)} placeholder="Code: A2" maxLength={20} />
          <input value={levelTitle} onChange={(event) => setLevelTitle(event.target.value)} placeholder="Level title" maxLength={140} />
          <button type="submit" disabled={busy !== null || !levelCode.trim() || !levelTitle.trim()}>+ إضافة Level</button>
        </form>
      </section>

      <div className="studio-curriculum-levels">
        {hierarchy.levels.map((level) => {
          const levelArchived = level.status === 'archived';
          const unitDraft = unitDrafts[level.id] ?? emptyUnit();
          return (
            <section key={level.id} className={`studio-curriculum-level${levelArchived ? ' is-archived' : ''}`}>
              <header>
                <div><span>LEVEL {level.order}</span><h2>{level.code} · {level.title}</h2><small>{level.units.length} Units</small></div>
                <button type="button" className={levelArchived ? 'is-restore' : 'is-danger'} disabled={busy !== null} onClick={() => void toggleArchived('level', level.id, `${level.code} ${level.title}`, levelArchived)}>{levelArchived ? 'استرجاع' : 'حذف من التطبيق'}</button>
              </header>

              {!levelArchived ? (
                <form className="studio-inline-create" onSubmit={(event) => void addUnit(event, level.id)}>
                  <strong>+ Unit جديدة</strong>
                  <input value={unitDraft.code} onChange={(event) => setUnitDrafts((current) => ({ ...current, [level.id]: { ...unitDraft, code: event.target.value } }))} placeholder="Code: U2" />
                  <input value={unitDraft.slug} onChange={(event) => setUnitDrafts((current) => ({ ...current, [level.id]: { ...unitDraft, slug: event.target.value } }))} placeholder="slug: a1-u2-daily-life" dir="ltr" />
                  <input value={unitDraft.title} onChange={(event) => setUnitDrafts((current) => ({ ...current, [level.id]: { ...unitDraft, title: event.target.value } }))} placeholder="Unit title" />
                  <button type="submit" disabled={busy !== null}>إضافة</button>
                </form>
              ) : null}

              <div className="studio-curriculum-units">
                {level.units.map((unit) => {
                  const unitArchived = unit.status === 'archived';
                  const lessonDraft = lessonDrafts[unit.id] ?? emptyLesson();
                  return (
                    <article key={unit.id} className={`studio-curriculum-unit${unitArchived ? ' is-archived' : ''}`}>
                      <header>
                        <div><span>UNIT {unit.order}</span><h3>{unit.code} · {unit.title}</h3><small>{unit.slug}</small></div>
                        <button type="button" className={unitArchived ? 'is-restore' : 'is-danger'} disabled={busy !== null || levelArchived} onClick={() => void toggleArchived('unit', unit.id, `${unit.code} ${unit.title}`, unitArchived)}>{unitArchived ? 'استرجاع' : 'حذف'}</button>
                      </header>

                      {!levelArchived && !unitArchived ? (
                        <form className="studio-inline-create is-lesson" onSubmit={(event) => void addLesson(event, unit.id)}>
                          <strong>+ Lesson جديدة</strong>
                          <input value={lessonDraft.code} onChange={(event) => setLessonDrafts((current) => ({ ...current, [unit.id]: { ...lessonDraft, code: event.target.value } }))} placeholder="Code: U1-L04" />
                          <input value={lessonDraft.slug} onChange={(event) => setLessonDrafts((current) => ({ ...current, [unit.id]: { ...lessonDraft, slug: event.target.value } }))} placeholder="slug: a1-u1-l04-coffee" dir="ltr" />
                          <input value={lessonDraft.title} onChange={(event) => setLessonDrafts((current) => ({ ...current, [unit.id]: { ...lessonDraft, title: event.target.value } }))} placeholder="Lesson title" />
                          <button type="submit" disabled={busy !== null}>إنشاء Draft</button>
                        </form>
                      ) : null}

                      <div className="studio-curriculum-lessons">
                        {unit.lessons.map((lesson) => {
                          const lessonArchived = lesson.status === 'archived';
                          return (
                            <div key={lesson.id} className={lessonArchived ? 'is-archived' : ''}>
                              <span className="studio-curriculum-order">{lesson.order}</span>
                              <div className="studio-curriculum-lesson-copy">
                                <strong>{lesson.title}</strong>
                                <small>{lesson.code} · {lesson.slug}</small>
                                <span>{lesson.publishedRevisionNumber ? `Published r${lesson.publishedRevisionNumber}` : lesson.draftRevisionNumber ? `Draft r${lesson.draftRevisionNumber}` : 'No revision'}</span>
                              </div>
                              {!lessonArchived ? <Link to="/studio">JSON</Link> : null}
                              <button type="button" className={lessonArchived ? 'is-restore' : 'is-danger'} disabled={busy !== null || levelArchived || unitArchived} onClick={() => void toggleArchived('lesson', lesson.id, lesson.title, lessonArchived)}>{lessonArchived ? 'استرجاع' : 'حذف'}</button>
                            </div>
                          );
                        })}
                        {unit.lessons.length === 0 ? <p>لسه مفيش Lessons في الـUnit دي.</p> : null}
                      </div>
                    </article>
                  );
                })}
                {level.units.length === 0 ? <p className="studio-curriculum-empty">لسه مفيش Units في الـLevel ده.</p> : null}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
