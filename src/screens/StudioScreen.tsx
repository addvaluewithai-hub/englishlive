import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { createStudioDraft, loadStudioOverview, publishStudioDraft, saveStudioDraft } from '../studio/client';
import type { StudioEntity, StudioEntityType, StudioOverview, StudioRevision } from '../studio/types';

type StudioTab = 'lesson' | 'character' | 'policy';

function entityLabel(entity: StudioEntity) {
  const content = entity.draft?.content ?? entity.published?.content ?? {};
  if (entity.type === 'lesson') {
    return typeof content.title === 'string' && content.title.trim() ? content.title : `${entity.code} · ${entity.slug}`;
  }
  if (entity.type === 'character') {
    return typeof content.displayName === 'string' && content.displayName.trim() ? content.displayName : entity.slug;
  }
  return entity.key;
}

function entitySubline(entity: StudioEntity) {
  if (entity.type === 'lesson') return `${entity.levelCode} · ${entity.unitCode} · ${entity.code}`;
  if (entity.type === 'character') return entity.rendererKey;
  return 'Global teaching policy';
}

function revisionLabel(revision: StudioRevision | null) {
  return revision ? `r${revision.revisionNumber}` : '—';
}

function pretty(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function previewBlock(entity: StudioEntity, content: Record<string, unknown>) {
  if (entity.type === 'lesson') {
    const scenes = Array.isArray(content.scenes) ? content.scenes : [];
    return (
      <div className="studio-preview-card">
        <span className="studio-preview-kicker">Lesson preview</span>
        <h3>{typeof content.title === 'string' ? content.title : entity.code}</h3>
        {typeof content.subtitle === 'string' ? <p>{content.subtitle}</p> : null}
        <div className="studio-preview-stats">
          <span><strong>{scenes.length}</strong> scenes</span>
          <span><strong>{typeof content.performance === 'string' ? content.performance.length : 0}</strong> performance chars</span>
        </div>
        <div className="studio-preview-scenes">
          {scenes.map((scene, index) => {
            const record = scene && typeof scene === 'object' && !Array.isArray(scene) ? scene as Record<string, unknown> : {};
            return (
              <div key={`${String(record.id ?? index)}-${index}`}>
                <span>{index + 1}</span>
                <div>
                  <strong>{String(record.title ?? record.id ?? `Scene ${index + 1}`)}</strong>
                  {typeof record.goal === 'string' ? <small>{record.goal}</small> : null}
                </div>
              </div>
            );
          })}
        </div>
        <Link className="studio-secondary-link" to={`/scene-lesson/${entity.slug}`}>افتح النسخة المنشورة في الـruntime</Link>
      </div>
    );
  }

  if (entity.type === 'character') {
    return (
      <div className="studio-preview-card">
        <span className="studio-preview-kicker">Character preview</span>
        <h3>{String(content.displayName ?? entity.slug)}</h3>
        {typeof content.tagline === 'string' ? <p>{content.tagline}</p> : null}
        <dl className="studio-preview-dl">
          <div><dt>Accent</dt><dd>{String(content.accent ?? '—')}</dd></div>
          <div><dt>Voice</dt><dd>{String(content.voiceName ?? 'default')}</dd></div>
        </dl>
        {typeof content.personaPrompt === 'string' ? <pre>{content.personaPrompt.slice(0, 900)}</pre> : null}
      </div>
    );
  }

  return (
    <div className="studio-preview-card">
      <span className="studio-preview-kicker">Teaching policy preview</span>
      <h3>{entity.key}</h3>
      {typeof content.prompt === 'string' ? <pre>{content.prompt}</pre> : null}
      {typeof content.openingPrompt === 'string' ? <><h4>Opening prompt</h4><pre>{content.openingPrompt}</pre></> : null}
      {typeof content.decisionNudgePrompt === 'string' ? <><h4>Decision nudge</h4><pre>{content.decisionNudgePrompt}</pre></> : null}
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
      const pool = preferred?.type === 'lesson' ? next.lessons : preferred?.type === 'character' ? next.characters : preferred?.type === 'policy' ? next.policies : next.lessons;
      const target = preferred ? pool.find((item) => item.id === preferred.id) : pool[0];
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
  const sourceRevision = editableRevision ?? selected?.published ?? null;

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

  async function createDraft() {
    if (!selected || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await createStudioDraft(selected.type, selected.id);
      await refresh({ type: selected.type, id: selected.id });
      setNotice('اتعمل Draft جديد من النسخة المنشورة.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر إنشاء Draft.');
    } finally {
      setBusy(false);
    }
  }

  function parsedEditor() {
    const value = JSON.parse(editor) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('المحتوى لازم يكون JSON object صالح.');
    return value as Record<string, unknown>;
  }

  async function saveDraft() {
    if (!selected || !editableRevision || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const content = parsedEditor();
      await saveStudioDraft({
        entityType: selected.type,
        entityId: selected.id,
        revisionId: editableRevision.id,
        content,
        changeNote,
      });
      await refresh({ type: selected.type, id: selected.id });
      setNotice('Draft اتحفظ في Neon.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر حفظ Draft.');
    } finally {
      setBusy(false);
    }
  }

  async function publishDraft() {
    if (!selected || !editableRevision || busy) return;
    let content: Record<string, unknown>;
    try {
      content = parsedEditor();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'JSON غير صالح.');
      return;
    }

    if (!window.confirm(`نشر ${entityLabel(selected)} revision ${editableRevision.revisionNumber}؟ النسخة المنشورة هتبقى immutable.`)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await saveStudioDraft({
        entityType: selected.type,
        entityId: selected.id,
        revisionId: editableRevision.id,
        content,
        changeNote,
      });
      await publishStudioDraft({ entityType: selected.type, entityId: selected.id, revisionId: editableRevision.id });
      await refresh({ type: selected.type, id: selected.id });
      setNotice('تم النشر. الـpublished pointer اتحرك للـrevision الجديدة.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر نشر Draft.');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !overview) {
    return <section className="studio-gate" dir="rtl"><h1>بنفتح Englotti Studio…</h1><p>بنحمّل الـpublished content والـdrafts من Neon.</p></section>;
  }

  if (error && !overview) {
    return (
      <section className="studio-gate" dir="rtl">
        <span className="studio-mark">Studio</span>
        <h1>الدخول للـStudio مش متاح للحساب ده</h1>
        <p>{error}</p>
        <div className="studio-config-note">في Cloudflare أضف <code>STUDIO_ADMIN_EMAILS</code> كـserver-side variable في Preview + Production، والقيمة تكون إيميل الأدمن المسموح له. ممكن تضيف أكتر من إيميل بفاصلة.</div>
        <Link className="v2-secondary-button" to="/home">الرجوع للتطبيق</Link>
      </section>
    );
  }

  if (!overview) return null;

  let previewContent: Record<string, unknown> = sourceRevision?.content ?? {};
  try { previewContent = parsedEditor(); } catch { /* keep last valid source revision */ }

  return (
    <section className="studio-shell" dir="rtl">
      <header className="studio-header">
        <div>
          <span className="studio-mark">Englotti Studio</span>
          <h1>Authoring & Publishing</h1>
          <p>Draft → Preview → Publish، والنسخ المنشورة immutable.</p>
        </div>
        <div className="studio-admin">
          <small>مفتوح كـ</small>
          <strong>{overview.admin.email ?? overview.admin.name ?? 'Admin'}</strong>
          <Link to="/home">فتح تطبيق المتعلم</Link>
        </div>
      </header>

      <nav className="studio-tabs" aria-label="Studio sections">
        <button type="button" className={tab === 'lesson' ? 'is-active' : ''} onClick={() => switchTab('lesson')}><ProductIcon name="learn" size={19} /> Lessons <span>{overview.lessons.length}</span></button>
        <button type="button" className={tab === 'character' ? 'is-active' : ''} onClick={() => switchTab('character')}><ProductIcon name="profile" size={19} /> Characters <span>{overview.characters.length}</span></button>
        <button type="button" className={tab === 'policy' ? 'is-active' : ''} onClick={() => switchTab('policy')}><ProductIcon name="check" size={19} /> Teaching Policy <span>{overview.policies.length}</span></button>
      </nav>

      <div className="studio-workspace">
        <aside className="studio-library">
          <div className="studio-library-heading"><strong>{tab === 'lesson' ? 'الدروس' : tab === 'character' ? 'الشخصيات' : 'السياسات'}</strong><small>{entities.length} records</small></div>
          <div className="studio-library-list">
            {entities.map((entity) => (
              <button key={entity.id} type="button" className={selected?.id === entity.id ? 'is-selected' : ''} onClick={() => setSelectedId(entity.id)}>
                <span className="studio-library-main"><strong>{entityLabel(entity)}</strong><small>{entitySubline(entity)}</small></span>
                <span className="studio-revision-pills">
                  <em className="is-published">P {revisionLabel(entity.published)}</em>
                  {entity.draft ? <em className="is-draft">D {revisionLabel(entity.draft)}</em> : null}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className="studio-editor">
          {selected ? (
            <>
              <div className="studio-editor-head">
                <div>
                  <span className="studio-type-label">{selected.type}</span>
                  <h2>{entityLabel(selected)}</h2>
                  <p>{entitySubline(selected)}</p>
                </div>
                <div className="studio-editor-status">
                  <span>Published <strong>{revisionLabel(selected.published)}</strong></span>
                  <span>Draft <strong>{revisionLabel(selected.draft)}</strong></span>
                </div>
              </div>

              <div className="studio-actions">
                {!editableRevision ? <button type="button" className="studio-primary" disabled={busy || !selected.published} onClick={createDraft}>Create draft</button> : null}
                {editableRevision ? <button type="button" className="studio-secondary" disabled={busy} onClick={saveDraft}>Save draft</button> : null}
                {editableRevision ? <button type="button" className="studio-publish" disabled={busy} onClick={publishDraft}>Publish {revisionLabel(editableRevision)}</button> : null}
                {busy ? <span className="studio-busy">جارِ التنفيذ…</span> : null}
              </div>

              {notice ? <div className="studio-notice is-success">{notice}</div> : null}
              {error ? <div className="studio-notice is-error">{error}</div> : null}

              <div className="studio-edit-grid">
                <section className="studio-json-panel">
                  <div className="studio-panel-title">
                    <div><strong>{editableRevision ? 'Draft JSON' : 'Published JSON'}</strong><small>{editableRevision ? 'قابل للتعديل' : 'اعمل Draft الأول عشان تعدّل'}</small></div>
                    <span>schema v{sourceRevision?.schemaVersion ?? 1}</span>
                  </div>
                  <textarea value={editor} onChange={(event) => setEditor(event.target.value)} readOnly={!editableRevision} spellCheck={false} aria-label="Revision JSON editor" />
                  {editableRevision ? (
                    <label className="studio-change-note"><span>Change note</span><input value={changeNote} onChange={(event) => setChangeNote(event.target.value)} maxLength={500} placeholder="إيه اللي اتغير في الـrevision دي؟" /></label>
                  ) : null}
                </section>

                <section className="studio-preview-panel">
                  <div className="studio-panel-title"><div><strong>Preview</strong><small>قراءة منظمة للـJSON الحالي قبل النشر</small></div><span>{editableRevision ? 'draft' : 'published'}</span></div>
                  {previewBlock(selected, previewContent)}
                </section>
              </div>
            </>
          ) : <div className="studio-empty">مفيش records في القسم ده.</div>}
        </main>
      </div>
    </section>
  );
}
