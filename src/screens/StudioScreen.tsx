import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import {
  createStudioDraft,
  duplicateStudioEntity,
  loadStudioOverview,
  publishStudioDraft,
  saveStudioDraft,
} from '../studio/client';
import type { StudioEntity, StudioOverview, StudioRevision } from '../studio/types';

type StudioTab = 'lesson' | 'character' | 'policy';

function entityLabel(entity: StudioEntity) {
  const content = entity.draft?.content ?? entity.published?.content ?? {};
  if (entity.type === 'lesson') return typeof content.title === 'string' && content.title.trim() ? content.title : entity.code;
  if (entity.type === 'character') return typeof content.displayName === 'string' && content.displayName.trim() ? content.displayName : entity.slug;
  return entity.key;
}

function entitySubline(entity: StudioEntity) {
  if (entity.type === 'lesson') return `${entity.levelCode} · ${entity.unitCode} · ${entity.code}`;
  if (entity.type === 'character') return entity.slug;
  return 'Global teaching policy';
}

function pretty(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function listText(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').join('\n') : '';
}

function splitLines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function previewBlock(entity: StudioEntity, content: Record<string, unknown>) {
  if (entity.type === 'lesson') {
    const scenes = Array.isArray(content.scenes) ? content.scenes : [];
    return (
      <div className="studio-preview-card">
        <span className="studio-preview-kicker">معاينة الدرس</span>
        <h3>{text(content.title) || entity.code}</h3>
        {text(content.subtitle) ? <p>{text(content.subtitle)}</p> : null}
        <div className="studio-preview-stats"><span><strong>{scenes.length}</strong> مشاهد</span></div>
        <div className="studio-preview-scenes">
          {scenes.map((scene, index) => {
            const record = asRecord(scene);
            return (
              <div key={`${String(record.id ?? index)}-${index}`}>
                <span>{index + 1}</span>
                <div><strong>{text(record.title) || text(record.id) || `Scene ${index + 1}`}</strong>{text(record.goal) ? <small>{text(record.goal)}</small> : null}</div>
              </div>
            );
          })}
        </div>
        {entity.published ? <Link className="studio-secondary-link" to={`/scene-lesson/${entity.slug}`}>فتح النسخة المنشورة في التطبيق</Link> : null}
      </div>
    );
  }

  if (entity.type === 'character') {
    return (
      <div className="studio-preview-card">
        <span className="studio-preview-kicker">معاينة الشخصية</span>
        <h3>{text(content.displayName) || entity.slug}</h3>
        {text(content.tagline) ? <p>{text(content.tagline)}</p> : null}
        <dl className="studio-preview-dl">
          <div><dt>Accent</dt><dd>{text(content.accent) || '—'}</dd></div>
          <div><dt>Voice</dt><dd>{text(content.voiceName) || 'default'}</dd></div>
        </dl>
        {text(content.personaPrompt) ? <pre>{text(content.personaPrompt)}</pre> : null}
      </div>
    );
  }

  return (
    <div className="studio-preview-card">
      <span className="studio-preview-kicker">معاينة سياسة التدريس</span>
      <h3>{entity.key}</h3>
      {text(content.prompt) ? <pre>{text(content.prompt)}</pre> : null}
      {text(content.openingPrompt) ? <><h4>Opening</h4><pre>{text(content.openingPrompt)}</pre></> : null}
    </div>
  );
}

function SimpleFields({
  entity,
  content,
  editable,
  onChange,
}: {
  entity: StudioEntity;
  content: Record<string, unknown>;
  editable: boolean;
  onChange: (key: string, value: unknown) => void;
}) {
  if (entity.type === 'character') {
    return (
      <div className="studio-form-grid">
        <label><span>الاسم الظاهر</span><input disabled={!editable} value={text(content.displayName)} onChange={(event) => onChange('displayName', event.target.value)} /></label>
        <label><span>اللون</span><input disabled={!editable} value={text(content.accent)} onChange={(event) => onChange('accent', event.target.value)} placeholder="#AE96CD" /></label>
        <label className="is-wide"><span>الوصف القصير</span><input disabled={!editable} value={text(content.tagline)} onChange={(event) => onChange('tagline', event.target.value)} /></label>
        <label className="is-wide"><span>الوصف</span><textarea disabled={!editable} value={text(content.description)} onChange={(event) => onChange('description', event.target.value)} /></label>
        <label className="is-wide"><span>شخصية المدرس / Persona</span><textarea disabled={!editable} value={text(content.personaPrompt)} onChange={(event) => onChange('personaPrompt', event.target.value)} /></label>
        <label className="is-wide"><span>Teaching style (اختياري)</span><textarea disabled={!editable} value={text(content.teachingStylePrompt)} onChange={(event) => onChange('teachingStylePrompt', event.target.value)} /></label>
        <label><span>Voice name (اختياري)</span><input disabled={!editable} value={text(content.voiceName)} onChange={(event) => onChange('voiceName', event.target.value || null)} /></label>
      </div>
    );
  }

  if (entity.type === 'policy') {
    return (
      <div className="studio-form-grid">
        <label className="is-wide"><span>القواعد العامة للمدرس</span><textarea className="is-tall" disabled={!editable} value={text(content.prompt)} onChange={(event) => onChange('prompt', event.target.value)} /></label>
        <label className="is-wide"><span>رسالة البداية</span><textarea disabled={!editable} value={text(content.openingPrompt)} onChange={(event) => onChange('openingPrompt', event.target.value)} /></label>
        <label className="is-wide"><span>Decision nudge</span><textarea disabled={!editable} value={text(content.decisionNudgePrompt)} onChange={(event) => onChange('decisionNudgePrompt', event.target.value)} /></label>
      </div>
    );
  }

  return (
    <div className="studio-form-grid">
      <label className="is-wide"><span>عنوان الدرس</span><input disabled={!editable} value={text(content.title)} onChange={(event) => onChange('title', event.target.value)} /></label>
      <label className="is-wide"><span>العنوان الفرعي</span><input disabled={!editable} value={text(content.subtitle)} onChange={(event) => onChange('subtitle', event.target.value)} /></label>
      <label className="is-wide"><span>الهدف العملي للدرس</span><textarea disabled={!editable} value={text(content.performance)} onChange={(event) => onChange('performance', event.target.value)} /></label>
      <label><span>Core language — سطر لكل عنصر</span><textarea disabled={!editable} value={listText(content.coreLanguage)} onChange={(event) => onChange('coreLanguage', splitLines(event.target.value))} /></label>
      <label><span>Boundaries — سطر لكل عنصر</span><textarea disabled={!editable} value={listText(content.boundaries)} onChange={(event) => onChange('boundaries', splitLines(event.target.value))} /></label>
      <div className="studio-scenes-note is-wide"><strong>{Array.isArray(content.scenes) ? content.scenes.length : 0} مشاهد</strong><span>تعديل بناء المشاهد نفسه متاح تحت Advanced JSON حاليًا؛ هنحوّله بعد كده لـScene Builder بصري بدل JSON.</span></div>
    </div>
  );
}

export function StudioScreen() {
  const [overview, setOverview] = useState<StudioOverview | null>(null);
  const [tab, setTab] = useState<StudioTab>('lesson');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh(preferred?: { type: StudioTab; id: string }) {
    setLoading(true);
    setError(null);
    try {
      const next = await loadStudioOverview();
      setOverview(next);
      const targetType = preferred?.type ?? tab;
      const pool = targetType === 'lesson' ? next.lessons : targetType === 'character' ? next.characters : next.policies;
      const target = preferred ? pool.find((item) => item.id === preferred.id) : pool.find((item) => item.id === selectedId) ?? pool[0];
      if (preferred) setTab(preferred.type);
      setSelectedId(target?.id ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر فتح Englotti Studio.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const entities = useMemo<StudioEntity[]>(() => {
    if (!overview) return [];
    if (tab === 'lesson') return overview.lessons;
    if (tab === 'character') return overview.characters;
    return overview.policies;
  }, [overview, tab]);

  const selected = useMemo(() => entities.find((item) => item.id === selectedId) ?? entities[0] ?? null, [entities, selectedId]);
  const editableRevision = selected?.draft ?? null;
  const sourceRevision: StudioRevision | null = editableRevision ?? selected?.published ?? null;

  useEffect(() => {
    setEditor(pretty(sourceRevision?.content ?? {}));
    setChangeNote(editableRevision?.changeNote ?? '');
    setError(null);
    setNotice(null);
  }, [selected?.id, sourceRevision?.id]);

  function switchTab(next: StudioTab) {
    setTab(next);
    const pool = next === 'lesson' ? overview?.lessons : next === 'character' ? overview?.characters : overview?.policies;
    setSelectedId(pool?.[0]?.id ?? null);
  }

  function parsedEditor() {
    const value = JSON.parse(editor) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('المحتوى لازم يكون JSON object صالح.');
    return value as Record<string, unknown>;
  }

  function updateField(key: string, value: unknown) {
    try {
      const next = { ...parsedEditor(), [key]: value };
      setEditor(pretty(next));
      setError(null);
    } catch {
      setError('صلّح Advanced JSON الأول قبل تعديل الحقول.');
    }
  }

  async function beginEdit() {
    if (!selected || busy || editableRevision) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await createStudioDraft(selected.type, selected.id);
      await refresh({ type: selected.type, id: selected.id });
      setNotice('جاهز للتعديل. النسخة الحالية محفوظة تلقائيًا في السجل.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر بدء التعديل.');
    } finally { setBusy(false); }
  }

  async function saveChanges() {
    if (!selected || !editableRevision || busy) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await saveStudioDraft({ entityType: selected.type, entityId: selected.id, revisionId: editableRevision.id, content: parsedEditor(), changeNote });
      await refresh({ type: selected.type, id: selected.id });
      setNotice('اتحفظت التغييرات من غير نشرها للمتعلمين.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر حفظ التغييرات.');
    } finally { setBusy(false); }
  }

  async function publishChanges() {
    if (!selected || !editableRevision || busy) return;
    let content: Record<string, unknown>;
    try { content = parsedEditor(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'JSON غير صالح.'); return; }
    if (!window.confirm(`نشر التغييرات على ${entityLabel(selected)} الآن؟`)) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await saveStudioDraft({ entityType: selected.type, entityId: selected.id, revisionId: editableRevision.id, content, changeNote });
      await publishStudioDraft({ entityType: selected.type, entityId: selected.id, revisionId: editableRevision.id });
      await refresh({ type: selected.type, id: selected.id });
      setNotice('تم النشر. التطبيق هيقرأ النسخة الجديدة، والنسخة السابقة محفوظة في الخلفية.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر نشر التغييرات.');
    } finally { setBusy(false); }
  }

  async function addFromTemplate() {
    if (!selected || !selected.published || selected.type === 'policy' || busy) return;
    const slug = window.prompt(selected.type === 'lesson' ? 'Slug للدرس الجديد (مثال: a1-u1-l04-coffee-order)' : 'Slug للشخصية الجديدة (مثال: taylor)', '');
    if (!slug) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      if (selected.type === 'character') {
        const displayName = window.prompt('اسم الشخصية الظاهر', '')?.trim();
        if (!displayName) return;
        const created = await duplicateStudioEntity({ entityType: 'character', sourceEntityId: selected.id, slug: slug.trim(), displayName });
        await refresh({ type: 'character', id: created.entityId });
        setNotice('اتضافت شخصية جديدة كتغييرات غير منشورة. عدّلها وبعدها انشرها لما تكون جاهزة.');
      } else {
        const code = window.prompt('كود الدرس الجديد (مثال: U1-L04)', '')?.trim();
        if (!code) return;
        const title = window.prompt('عنوان الدرس الجديد', '')?.trim();
        if (!title) return;
        const created = await duplicateStudioEntity({ entityType: 'lesson', sourceEntityId: selected.id, slug: slug.trim(), code, title });
        await refresh({ type: 'lesson', id: created.entityId });
        setNotice('اتضاف درس جديد من نفس القالب. عدّل المحتوى والمشاهد قبل النشر.');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر إضافة عنصر جديد.');
    } finally { setBusy(false); }
  }

  if (loading && !overview) return <section className="studio-gate" dir="rtl"><h1>بنفتح Englotti Studio…</h1><p>بنحمّل المحتوى المنشور والتغييرات غير المنشورة من Neon.</p></section>;

  if (error && !overview) {
    return <section className="studio-gate" dir="rtl"><span className="studio-mark">Studio</span><h1>الدخول للـStudio مش متاح للحساب ده</h1><p>{error}</p><div className="studio-config-note">في Cloudflare أضف <code>STUDIO_ADMIN_EMAILS</code> كـserver-side variable في Preview + Production.</div><Link className="v2-secondary-button" to="/home">الرجوع للتطبيق</Link></section>;
  }

  if (!overview) return null;

  let currentContent = sourceRevision?.content ?? {};
  try { currentContent = parsedEditor(); } catch { /* keep last valid content */ }

  return (
    <section className="studio-shell" dir="rtl">
      <header className="studio-header">
        <div><span className="studio-mark">Englotti Studio</span><h1>عدّل المحتوى ببساطة</h1><p>تعديل → مراجعة → نشر. النسخ والتاريخ بيتحفظوا تلقائيًا في الخلفية.</p></div>
        <div className="studio-admin"><small>مفتوح كـ</small><strong>{overview.admin.email ?? overview.admin.name ?? 'Admin'}</strong><Link to="/home">فتح تطبيق المتعلم</Link></div>
      </header>

      <nav className="studio-tabs" aria-label="Studio sections">
        <button type="button" className={tab === 'lesson' ? 'is-active' : ''} onClick={() => switchTab('lesson')}><ProductIcon name="learn" size={19} /> الدروس <span>{overview.lessons.length}</span></button>
        <button type="button" className={tab === 'character' ? 'is-active' : ''} onClick={() => switchTab('character')}><ProductIcon name="profile" size={19} /> الشخصيات <span>{overview.characters.length}</span></button>
        <button type="button" className={tab === 'policy' ? 'is-active' : ''} onClick={() => switchTab('policy')}><ProductIcon name="check" size={19} /> سياسة التدريس <span>{overview.policies.length}</span></button>
      </nav>

      <div className="studio-workspace">
        <aside className="studio-library">
          <div className="studio-library-heading">
            <div><strong>{tab === 'lesson' ? 'الدروس' : tab === 'character' ? 'الشخصيات' : 'السياسات'}</strong><small>{entities.length} عناصر</small></div>
            {tab !== 'policy' ? <button type="button" className="studio-add-button" disabled={!selected?.published || busy} onClick={() => void addFromTemplate()}>＋ إضافة</button> : null}
          </div>
          <div className="studio-library-list">
            {entities.map((entity) => (
              <button key={entity.id} type="button" className={selected?.id === entity.id ? 'is-selected' : ''} onClick={() => setSelectedId(entity.id)}>
                <span className="studio-library-main"><strong>{entityLabel(entity)}</strong><small>{entitySubline(entity)}</small></span>
                <span className="studio-revision-pills"><em className="is-published">Live</em>{entity.draft ? <em className="is-draft">تغييرات</em> : null}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="studio-editor">
          {selected ? <>
            <div className="studio-editor-head">
              <div><span className="studio-type-label">{selected.type}</span><h2>{entityLabel(selected)}</h2><p>{entitySubline(selected)}</p></div>
              <div className="studio-editor-status"><span>{editableRevision ? 'فيه تغييرات غير منشورة' : 'النسخة المعروضة منشورة'}</span></div>
            </div>

            <div className="studio-actions">
              {!editableRevision ? <button type="button" className="studio-primary" disabled={busy || !selected.published} onClick={() => void beginEdit()}>تعديل</button> : null}
              {editableRevision ? <button type="button" className="studio-secondary" disabled={busy} onClick={() => void saveChanges()}>حفظ بدون نشر</button> : null}
              {editableRevision ? <button type="button" className="studio-publish" disabled={busy} onClick={() => void publishChanges()}>نشر التغييرات</button> : null}
              {busy ? <span className="studio-busy">جارِ التنفيذ…</span> : null}
            </div>

            {notice ? <div className="studio-notice is-success">{notice}</div> : null}
            {error ? <div className="studio-notice is-error">{error}</div> : null}

            <div className="studio-edit-grid">
              <section className="studio-simple-panel">
                <div className="studio-panel-title"><div><strong>{editableRevision ? 'التغييرات' : 'المحتوى المنشور'}</strong><small>{editableRevision ? 'عدّل الحقول وانشر لما تكون جاهز.' : 'اضغط تعديل لو محتاج تغيّر حاجة.'}</small></div></div>
                <SimpleFields entity={selected} content={currentContent} editable={Boolean(editableRevision)} onChange={updateField} />
                {editableRevision ? <label className="studio-change-note"><span>ملاحظة اختيارية عن التغيير</span><input value={changeNote} onChange={(event) => setChangeNote(event.target.value)} maxLength={500} placeholder="مثال: تحديث اسم الشخصية ونبرة الحوار" /></label> : null}
                <details className="studio-advanced">
                  <summary>Advanced JSON</summary>
                  <p>للحالات المتقدمة فقط. أغلب التعديلات اليومية اعملها من الحقول اللي فوق.</p>
                  <textarea value={editor} onChange={(event) => setEditor(event.target.value)} readOnly={!editableRevision} spellCheck={false} aria-label="Revision JSON editor" />
                </details>
                <details className="studio-history">
                  <summary>السجل التقني</summary>
                  <p>النسخة المنشورة: {selected.published ? `r${selected.published.revisionNumber}` : 'لا يوجد'} · التغييرات غير المنشورة: {selected.draft ? `r${selected.draft.revisionNumber}` : 'لا يوجد'}</p>
                </details>
              </section>

              <section className="studio-preview-panel"><div className="studio-panel-title"><div><strong>Preview</strong><small>الشكل المقروء قبل النشر</small></div><span>{editableRevision ? 'غير منشور' : 'منشور'}</span></div>{previewBlock(selected, currentContent)}</section>
            </div>
          </> : <div className="studio-empty">اختار عنصر من القائمة.</div>}
        </main>
      </div>
    </section>
  );
}
