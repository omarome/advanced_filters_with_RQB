import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LucideShare2, LucideSearch, LucideX } from 'lucide-react';
import { apiJson } from '../../services/apiClient';
import { fetchTeamMembers } from '../../services/teamApi';
import { useThemeControl } from '../../context/ThemeContext';

export default function ShareRecordModal({ opportunityId, onClose }) {
  const { mode } = useThemeControl();
  const isDark = mode === 'dark';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchTeamMembers()
      .then(data => setMembers(data.filter(m => m.isActive)))
      .catch(err => toast.error(err.message || 'Failed to load team members'))
      .finally(() => setLoading(false));
  }, []);

  const handleShare = async (accountId) => {
    setSavingId(accountId);
    try {
      await apiJson(`/sales/opportunities/${opportunityId}/share`, {
        method: 'POST',
        body: JSON.stringify({ accountId, permission: 'READ' })
      });
      toast.success('Opportunity shared successfully!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Share failed');
    } finally {
      setSavingId(null);
    }
  };

  const filtered = members.filter(m => 
    !search || m.displayName?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const modal   = { background: isDark ? '#1e293b' : '#fff', borderRadius: 16, padding: '24px', width: 480, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', position: 'relative' };
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

        <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: textCol, display: 'flex', alignItems: 'center', gap: 8 }}>
          <LucideShare2 size={18} color="#0ea5e9" /> Share Deal
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: subCol }}>
          Select a team member to explicitly grant them view access to this specific opportunity.
        </p>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <LucideSearch size={16} color={subCol} style={{ position: 'absolute', left: 12, top: 10 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: 8, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: isDark ? '#0f172a' : '#f8fafc', color: textCol, fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: subCol, fontSize: '0.9rem' }}>Loading members…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: subCol, fontSize: '0.9rem' }}>No team members found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0ea5e9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
                        {member.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: textCol }}>{member.displayName}</div>
                      <div style={{ fontSize: '0.8rem', color: subCol }}>{member.role.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleShare(member.id)}
                    disabled={savingId === member.id}
                    style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: 'transparent', color: textCol, cursor: savingId === member.id ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
                  >
                    {savingId === member.id ? 'Sharing…' : 'Share'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
