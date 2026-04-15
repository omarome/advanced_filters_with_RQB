import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LucideShieldAlert, LucideX } from 'lucide-react';
import { apiJson } from '../../services/apiClient';
import { useAuth } from '../../context/AuthProvider';
import { useThemeControl } from '../../context/ThemeContext';
import '../../pages/Team/TeamPage.less';

export default function RoleAuditLog({ onClose }) {
  const { currentWorkspace } = useAuth();
  const { mode } = useThemeControl();
  const isDark = mode === 'dark';
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace) return;
    setLoading(true);
    apiJson(`/workspaces/${currentWorkspace.id}/audit/roles`)
      .then(data => {
        setLogs(data);
      })
      .catch(err => toast.error(err.message || 'Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [currentWorkspace]);

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const modal   = { background: isDark ? '#1e293b' : '#fff', borderRadius: 16, padding: '32px 28px', width: 640, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', position: 'relative' };
  const textCol = isDark ? '#f1f5f9' : '#0f172a';
  const subCol  = isDark ? '#94a3b8' : '#64748b';

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: subCol }}
          aria-label="Close"
        >
          <LucideX size={18} />
        </button>

        <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', color: textCol, display: 'flex', alignItems: 'center', gap: 8 }}>
          <LucideShieldAlert size={20} color="#7c3aed" /> Role Audit Logs
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: subCol }}>
          A chronological history of all role assignments in {currentWorkspace?.name || 'this workspace'}.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: subCol }}>Loading audit logs…</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: subCol }}>No role changes recorded yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {logs.map(log => (
              <div key={log.id} style={{ padding: '12px 16px', borderRadius: 8, background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ color: textCol, fontSize: '0.9rem' }}>
                    {log.actorName} changed {log.targetAccountName}'s role
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: subCol }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: subCol, display: 'flex', gap: 8, alignItems: 'center' }}>
                  {log.oldRole ? (
                    <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{log.oldRole}</span>
                  ) : <span>None</span>}
                  <span>→</span>
                  <strong style={{ color: '#10b981' }}>{log.newRole || 'None'}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
