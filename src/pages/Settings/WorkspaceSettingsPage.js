import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { useThemeControl } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthProvider';
import { usePermission } from '../../hooks/usePermission';
import { createWorkspace, updateWorkspace, deleteWorkspace } from '../../services/workspaceApi';
import {
  LucideBuilding2, LucidePlus, LucidePencil, LucideTrash2, LucideX,
  LucideGlobe, LucideLock,
} from 'lucide-react';
import './WorkspaceSettingsPage.less';

// Auto-suggests a URL-safe slug from a display name — the user can still edit it.
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Create / Edit modal ───────────────────────────────────────────────────────

function WorkspaceFormModal({ workspace, onClose, onSaved, isDark }) {
  const isEdit = !!workspace;
  const [form, setForm] = useState({
    name: workspace?.name || '',
    slug: workspace?.slug || '',
    isPublic: workspace?.isPublic ?? false,
  });
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Name and slug are required.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        const updated = await updateWorkspace(workspace.id, form);
        toast.success(`"${updated.name}" updated.`);
      } else {
        const created = await createWorkspace(form);
        toast.success(`Workspace "${created.name}" created.`);
      }
      await onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const modal   = { background: isDark ? '#1e293b' : '#fff', borderRadius: 16, padding: '32px 28px', width: 440, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', position: 'relative' };
  const inp     = { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '0.9rem', boxSizing: 'border-box', marginTop: 6 };
  const label   = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginTop: 16 };

  return createPortal(
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b' }}
          aria-label="Close"
        >
          <LucideX size={18} />
        </button>

        <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: isDark ? '#f1f5f9' : '#0f172a' }}>
          {isEdit ? 'Edit Workspace' : 'Create Workspace'}
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b' }}>
          {isEdit
            ? 'Rename it, change its URL slug, or toggle its visibility.'
            : "You'll be added as this workspace's owner."}
        </p>

        <form onSubmit={handleSubmit}>
          <label style={label}>
            Name
            <input
              value={form.name}
              onChange={handleNameChange}
              placeholder="Acme Corp"
              style={inp}
              disabled={saving}
              required
            />
          </label>
          <label style={label}>
            Slug
            <input
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }}
              placeholder="acme-corp"
              style={inp}
              disabled={saving}
              required
            />
          </label>

          <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
              disabled={saving}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <span>
              Public workspace
              <span style={{ display: 'block', fontWeight: 400, fontSize: '0.78rem', marginTop: 2 }}>
                Discoverable/joinable rather than invite-only. Does not change who can read its data.
              </span>
            </span>
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: 'transparent', color: isDark ? '#cbd5e1' : '#475569', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c69ef,#6c5ce7)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Delete confirmation ───────────────────────────────────────────────────────

function DeleteWorkspaceModal({ workspace, onClose, onDeleted, isDark }) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const canConfirm = confirmText.trim() === workspace.slug;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteWorkspace(workspace.id);
      toast.success(`"${workspace.name}" deleted.`);
      await onDeleted();
      onClose();
    } catch (err) {
      // The backend returns 409 with a message naming exactly what's still there
      // (e.g. "...still has data (3 organizations, 1 contacts...)").
      toast.error(err.message || 'Delete failed', { duration: 6000 });
    } finally {
      setDeleting(false);
    }
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const modal   = { background: isDark ? '#1e293b' : '#fff', borderRadius: 16, padding: '32px 28px', width: 440, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', position: 'relative' };
  const inp     = { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '0.9rem', boxSizing: 'border-box', marginTop: 6 };

  return createPortal(
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b' }}
          aria-label="Close"
        >
          <LucideX size={18} />
        </button>

        <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#ef4444' }}>Delete Workspace</h2>
        <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b' }}>
          This permanently deletes <strong>{workspace.name}</strong> and its membership list. This
          cannot be undone. It's only allowed while the workspace has no organizations, contacts,
          opportunities, or activities — remove those first if it's rejected.
        </p>

        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
          Type <code>{workspace.slug}</code> to confirm
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={workspace.slug}
            style={inp}
            disabled={deleting}
            autoFocus
          />
        </label>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: 'transparent', color: isDark ? '#cbd5e1' : '#475569', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canConfirm || deleting}
            style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: canConfirm ? '#ef4444' : '#94a3b8', color: '#fff', cursor: canConfirm && !deleting ? 'pointer' : 'not-allowed', fontSize: '0.9rem', fontWeight: 600 }}
          >
            {deleting ? 'Deleting…' : 'Delete Workspace'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Workspace row ──────────────────────────────────────────────────────────

function WorkspaceRow({ workspace, canUpdate, canDelete, onEdit, onDelete }) {
  return (
    <div className="ws-row">
      <div className="ws-row__icon">
        {workspace.name.substring(0, 2).toUpperCase()}
      </div>
      <div className="ws-row__info">
        <div className="ws-row__name-line">
          <span className="ws-row__name">{workspace.name}</span>
          <span className={`ws-visibility-badge ${workspace.isPublic ? 'is-public' : 'is-private'}`}>
            {workspace.isPublic ? <LucideGlobe size={11} /> : <LucideLock size={11} />}
            {workspace.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
        <span className="ws-row__slug">/{workspace.slug}</span>
      </div>
      <span className="ws-row__role">{workspace.role.replace('_', ' ')}</span>
      <div className="ws-row__actions">
        {canUpdate && (
          <button className="ws-icon-btn" title="Edit workspace" onClick={() => onEdit(workspace)}>
            <LucidePencil size={15} />
          </button>
        )}
        {canDelete && (
          <button className="ws-icon-btn ws-icon-btn--danger" title="Delete workspace" onClick={() => onDelete(workspace)}>
            <LucideTrash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

const WorkspaceSettingsPage = () => {
  const { mode } = useThemeControl();
  const isDark = mode === 'dark';
  const { workspaces, refreshWorkspaces, activeWorkspaceId } = useAuth();

  const canCreate = usePermission('WORKSPACE_CREATE');
  const canUpdate = usePermission('WORKSPACE_UPDATE');
  const canDelete = usePermission('WORKSPACE_DELETE');

  const [formModal, setFormModal] = useState(null);   // null | 'create' | workspace object (edit)
  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <div className="workspace-settings-page">
      <div className="workspace-settings-page__header">
        <div>
          <h1 className="page-title-gradient" style={{ margin: 0 }}>Workspaces</h1>
          <p className="workspace-settings-page__subtitle">
            Every workspace you belong to, and your role in each.
          </p>
        </div>
        {canCreate && (
          <button className="ws-create-btn" onClick={() => setFormModal('create')}>
            <LucidePlus size={16} /> New Workspace
          </button>
        )}
      </div>

      {(!workspaces || workspaces.length === 0) ? (
        <div className="workspace-settings-page__empty">
          <LucideBuilding2 size={32} />
          <p>Loading your workspaces…</p>
        </div>
      ) : (
        <div className="ws-list">
          {workspaces.map((ws) => (
            <WorkspaceRow
              key={ws.id}
              workspace={ws}
              // Row-level role only unlocks the buttons for your OWN role in
              // that workspace as a UI hint — the backend re-checks per
              // workspace regardless, so this can never over-grant access.
              canUpdate={canUpdate}
              canDelete={canDelete && ws.id !== activeWorkspaceId /* avoid deleting the one you're standing in */}
              onEdit={setFormModal}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {formModal && (
        <WorkspaceFormModal
          workspace={formModal === 'create' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={refreshWorkspaces}
          isDark={isDark}
        />
      )}

      {deleteTarget && (
        <DeleteWorkspaceModal
          workspace={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={refreshWorkspaces}
          isDark={isDark}
        />
      )}
    </div>
  );
};

export default WorkspaceSettingsPage;
