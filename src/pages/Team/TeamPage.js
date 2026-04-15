import React, { useState, useEffect, useCallback } from 'react';
import { fetchTeamMembers, fetchAllTeamMembers, updateTeamMember, updateTeamMemberRole } from '../../services/teamApi';
import { inviteUser, deactivateUser, reactivateUser } from '../../services/adminApi';
import { toast } from 'react-hot-toast';
import { useThemeControl } from '../../context/ThemeContext';
import { useRole } from '../../hooks/useRole';
import { usePermission } from '../../hooks/usePermission';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { LucideUsers, LucideActivity, LucidePieChart, LucideRadio, LucidePlus, LucideShield, LucideUserX, LucideUserCheck, LucideX, LucideHistory } from 'lucide-react';
import AnalyticsCard from '../../components/Layout/AnalyticsCard';
import RoleAuditLog from '../../components/Team/RoleAuditLog';
import './TeamPage.less';

/**
 * Team Management page — Phase 2 of the RBAC implementation.
 *
 * Admins see an "Invite Member" button, inline role-change controls,
 * and deactivate/reactivate actions inside the ProfileDrawer.
 */
const ROLE_COLORS = {
  SUPER_ADMIN:     { bg: '#ef4444', text: '#fff', label: 'Super Admin' },
  WORKSPACE_OWNER: { bg: '#f97316', text: '#fff', label: 'Owner' },
  ADMIN:           { bg: '#7c3aed', text: '#fff', label: 'Admin' },
  MANAGER:         { bg: '#0ea5e9', text: '#fff', label: 'Manager' },
  SALES_REP:       { bg: '#10b981', text: '#fff', label: 'Sales Rep' },
  USER:            { bg: '#64748b', text: '#fff', label: 'User' },
  VIEWER:          { bg: '#94a3b8', text: '#fff', label: 'Viewer' },
  GUEST:           { bg: '#cbd5e1', text: '#475569', label: 'Guest' },
};

// Roles selectable when changing an existing member's role (excludes super-admin)
const ASSIGNABLE_ROLES = ['MANAGER', 'SALES_REP', 'VIEWER', 'GUEST', 'ADMIN'];

// Roles for new invite (SUPER_ADMIN / WORKSPACE_OWNER are not self-assignable)
const INVITE_ROLES = ['SALES_REP', 'VIEWER', 'GUEST', 'MANAGER', 'ADMIN'];

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function MemberAvatar({ member, size = 56 }) {
  const src = member.avatarUrl || member.photoUrl;
  const initials = getInitials(member.displayName);
  const color = ROLE_COLORS[member.role] || ROLE_COLORS.USER;

  return src ? (
    <img
      src={src}
      alt={member.displayName}
      className="team-avatar"
      style={{ width: size, height: size }}
      onError={e => { e.target.style.display = 'none'; }}
    />
  ) : (
    <div
      className="team-avatar team-avatar--initials"
      style={{ width: size, height: size, background: color.bg, color: color.text }}
    >
      {initials}
    </div>
  );
}

// ─── Stat Chip ─────────────────────────────────────────────────────────────────

function StatChip({ label, value, icon }) {
  return (
    <div className="team-stat-chip">
      <span className="team-stat-icon">{icon}</span>
      <span className="team-stat-value">{value}</span>
      <span className="team-stat-label">{label}</span>
    </div>
  );
}

// ─── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({ onClose, onInvited, isDark }) {
  const [form, setForm]     = useState({ email: '', displayName: '', role: 'SALES_REP' });
  const [saving, setSaving] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.displayName) {
      toast.error('Email and name are required.');
      return;
    }
    setSaving(true);
    try {
      const created = await inviteUser(form);
      toast.success(`Invitation sent to ${form.email}!`);
      onInvited(created);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Invite failed');
    } finally {
      setSaving(false);
    }
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const modal   = { background: isDark ? '#1e293b' : '#fff', borderRadius: 16, padding: '32px 28px', width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', position: 'relative' };
  const inp     = { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '0.9rem', boxSizing: 'border-box', marginTop: 6 };
  const label   = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginTop: 16 };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b' }}
          aria-label="Close"
        >
          <LucideX size={18} />
        </button>

        <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: isDark ? '#f1f5f9' : '#0f172a' }}>
          Invite Team Member
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b' }}>
          They'll receive an invitation email and can set their password on first login.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={label}>
            Display Name
            <input name="displayName" value={form.displayName} onChange={handleChange} placeholder="Jane Smith" style={inp} disabled={saving} required />
          </label>
          <label style={label}>
            Email Address
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@company.com" style={inp} disabled={saving} required />
          </label>
          <label style={label}>
            Role
            <select name="role" value={form.role} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }} disabled={saving}>
              {INVITE_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_COLORS[r]?.label || r}</option>
              ))}
            </select>
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
              {saving ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Member Card ───────────────────────────────────────────────────────────────

function MemberCard({ member, onClick }) {
  const color = ROLE_COLORS[member.role] || ROLE_COLORS.USER;

  return (
    <div
      className={`team-card${!member.isActive ? ' team-card--inactive' : ''}`}
      onClick={() => onClick(member)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(member)}
    >
      <div className="team-card__header">
        <MemberAvatar member={member} size={56} />
        <div className="team-card__identity">
          <h3 className="team-card__name">{member.displayName}</h3>
          <p className="team-card__title">{member.jobTitle || '—'}</p>
          <span className="team-card__role-badge" style={{ background: color.bg, color: color.text }}>
            {color.label}
          </span>
        </div>
      </div>

      <div className="team-card__body">
        {member.department && (
          <p className="team-card__dept"><span className="team-card__dept-icon">🏢</span> {member.department}</p>
        )}
        {member.email && (
          <p className="team-card__email"><span>✉️</span> {member.email}</p>
        )}
        {member.phone && (
          <p className="team-card__phone"><span>📞</span> {member.phone}</p>
        )}
      </div>

      <div className="team-card__stats">
        <StatChip label="Open Deals" value={member.openDeals ?? 0} icon="📊" />
        <StatChip label="Activities" value={member.totalActivities ?? 0} icon="⚡" />
      </div>

      {!member.isActive && (
        <div className="team-card__inactive-badge">Inactive</div>
      )}
    </div>
  );
}

// ─── Mock chart data ───────────────────────────────────────────────────────────

const mockPipelineData = [
  { month: 'Jan', deals: 4, value: 45000 },
  { month: 'Feb', deals: 7, value: 80000 },
  { month: 'Mar', deals: 5, value: 60000 },
  { month: 'Apr', deals: 10, value: 120000 },
  { month: 'May', deals: 8, value: 95000 },
  { month: 'Jun', deals: 12, value: 150000 },
];

const mockActivityData = [
  { day: 'Mon', calls: 12, emails: 30, meetings: 3 },
  { day: 'Tue', calls: 18, emails: 45, meetings: 5 },
  { day: 'Wed', calls: 15, emails: 40, meetings: 4 },
  { day: 'Thu', calls: 20, emails: 50, meetings: 6 },
  { day: 'Fri', calls: 10, emails: 25, meetings: 2 },
];

// ─── Profile Drawer ────────────────────────────────────────────────────────────

function ProfileDrawer({ member, onClose, onUpdate, onDeactivate }) {
  const [editing,      setEditing]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [roleChanging, setRoleChanging] = useState(false);
  const [actioning,    setActioning]    = useState(false); // deactivate / reactivate
  const [form, setForm] = useState({
    jobTitle:   member.jobTitle   || '',
    department: member.department || '',
    phone:      member.phone      || '',
    avatarUrl:  member.avatarUrl  || '',
  });

  const { can } = useRole();
  const canEditProfiles  = can('team.edit');        // MANAGER+
  const canAssignRole    = usePermission('TEAM_ROLE_ASSIGN');  // ADMIN+
  const canManageUsers   = usePermission('ADMIN_MANAGE');      // ADMIN+

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateTeamMember(member.id, form);
      onUpdate(updated);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (newRole === member.role) return;
    setRoleChanging(true);
    try {
      const updated = await updateTeamMemberRole(member.id, newRole);
      onUpdate(updated);
      toast.success(`Role changed to ${ROLE_COLORS[newRole]?.label || newRole}`);
    } catch (err) {
      toast.error(err.message || 'Role change failed');
    } finally {
      setRoleChanging(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm(`Deactivate ${member.displayName}? They will no longer be able to sign in.`)) return;
    setActioning(true);
    try {
      await deactivateUser(member.id);
      onDeactivate({ ...member, isActive: false });
      toast.success(`${member.displayName} has been deactivated.`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Deactivate failed');
    } finally {
      setActioning(false);
    }
  };

  const handleReactivate = async () => {
    setActioning(true);
    try {
      const updated = await reactivateUser(member.id);
      onUpdate({ ...member, ...updated, isActive: true });
      toast.success(`${member.displayName} has been reactivated.`);
    } catch (err) {
      toast.error(err.message || 'Reactivate failed');
    } finally {
      setActioning(false);
    }
  };

  const color = ROLE_COLORS[member.role] || ROLE_COLORS.USER;

  return (
    <div className="team-drawer-overlay" onClick={onClose}>
      <div className="team-drawer" onClick={e => e.stopPropagation()}>
        <button className="team-drawer__close" onClick={onClose} aria-label="Close">✕</button>

        {/* Hero */}
        <div className="team-drawer__hero">
          <MemberAvatar member={member} size={80} />
          <div>
            <h2 className="team-drawer__name">{member.displayName}</h2>
            <p className="team-drawer__email">{member.email}</p>
            <span className="team-card__role-badge" style={{ background: color.bg, color: '#fff' }}>
              {color.label}
            </span>
            {!member.isActive && (
              <span style={{ marginLeft: 8, fontSize: '0.75rem', padding: '3px 10px', borderRadius: 999, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="team-drawer__stats-row">
          <StatChip label="Open Deals"  value={member.openDeals      ?? 12}  icon="📊" />
          <StatChip label="Closed Won"  value={member.closedDeals    ?? 45}  icon="🏆" />
          <StatChip label="Activities"  value={member.totalActivities ?? 234} icon="⚡" />
          <StatChip label="Status"      value={member.isActive ? 'Active' : 'Inactive'} icon="🔵" />
        </div>

        {/* ── Admin Actions Panel ── */}
        {(canAssignRole || canManageUsers) && (
          <div className="team-drawer__section team-drawer__admin-panel">
            <div className="team-drawer__section-header">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LucideShield size={15} /> Admin Controls
              </h4>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Role selector */}
              {canAssignRole && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Role:</span>
                  <select
                    value={member.role}
                    onChange={e => handleRoleChange(e.target.value)}
                    disabled={roleChanging || actioning}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: '1px solid #334155',
                      background: '#0f172a',
                      color: '#f1f5f9',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    {ASSIGNABLE_ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_COLORS[r]?.label || r}</option>
                    ))}
                  </select>
                  {roleChanging && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Saving…</span>}
                </label>
              )}

              {/* Deactivate / Reactivate */}
              {canManageUsers && (
                member.isActive ? (
                  <button
                    onClick={handleDeactivate}
                    disabled={actioning}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8,
                      border: '1px solid #fecaca', background: 'rgba(239,68,68,0.08)',
                      color: '#ef4444', cursor: actioning ? 'not-allowed' : 'pointer',
                      fontSize: '0.82rem', fontWeight: 600,
                    }}
                  >
                    <LucideUserX size={14} />
                    {actioning ? 'Deactivating…' : 'Deactivate'}
                  </button>
                ) : (
                  <button
                    onClick={handleReactivate}
                    disabled={actioning}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8,
                      border: '1px solid #bbf7d0', background: 'rgba(16,185,129,0.08)',
                      color: '#10b981', cursor: actioning ? 'not-allowed' : 'pointer',
                      fontSize: '0.82rem', fontWeight: 600,
                    }}
                  >
                    <LucideUserCheck size={14} />
                    {actioning ? 'Reactivating…' : 'Reactivate'}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="team-drawer__section">
          <div className="team-drawer__section-header">
            <h4>Performance Overview</h4>
          </div>
          <div className="team-drawer__charts">
            <div className="team-drawer__chart-box">
              <h5>Deal Pipeline (Value)</h5>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <AreaChart data={mockPipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={color.bg} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={color.bg} stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
                    <RechartsTooltip formatter={val => [`$${val.toLocaleString()}`, 'Pipeline']} labelStyle={{ color: '#333' }} />
                    <Area type="monotone" dataKey="value" stroke={color.bg} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="team-drawer__chart-box" style={{ marginTop: 24 }}>
              <h5>Weekly Activity Breakdown</h5>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <BarChart data={mockActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip labelStyle={{ color: '#333' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="calls"    stackId="a" fill="#0ea5e9" name="Calls"    radius={[0, 0, 4, 4]} />
                    <Bar dataKey="emails"   stackId="a" fill="#8b5cf6" name="Emails"   />
                    <Bar dataKey="meetings" stackId="a" fill="#10b981" name="Meetings" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Attributes */}
        <div className="team-drawer__section">
          <div className="team-drawer__section-header">
            <h4>Profile Attributes</h4>
            {!editing && canEditProfiles && (
              <button className="team-drawer__edit-btn" onClick={() => setEditing(true)}>
                ✏️ Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="team-drawer__form">
              {[
                { label: 'Job Title',  name: 'jobTitle'   },
                { label: 'Department', name: 'department' },
                { label: 'Phone',      name: 'phone'      },
                { label: 'Avatar URL', name: 'avatarUrl'  },
              ].map(({ label, name }) => (
                <label key={name} className="team-form-field">
                  <span>{label}</span>
                  <input name={name} value={form[name]} onChange={handleChange} placeholder={label} disabled={saving} />
                </label>
              ))}
              <div className="team-form-actions">
                <button className="team-btn team-btn--ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                <button className="team-btn team-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <dl className="team-drawer__details">
              {[
                ['Job Title',   member.jobTitle    || '—'],
                ['Department',  member.department  || '—'],
                ['Phone',       member.phone       || '—'],
                ['Member since', member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '—'],
                ['Firebase UID', member.firebaseUid ? `${member.firebaseUid.slice(0, 12)}…` : 'Not linked'],
              ].map(([key, val]) => (
                <React.Fragment key={key}>
                  <dt>{key}</dt>
                  <dd>{val}</dd>
                </React.Fragment>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { mode } = useThemeControl();
  const isDark   = mode === 'dark';

  const canInvite     = usePermission('ADMIN_INVITE');
  const canSeeAll     = usePermission('TEAM_READ_ALL');   // MANAGER+ sees inactive members

  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selected,   setSelected]   = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = canSeeAll && showInactive
        ? await fetchAllTeamMembers()
        : await fetchTeamMembers();
      setMembers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [canSeeAll, showInactive]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleUpdate = useCallback(updated => {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSelected(updated);
  }, []);

  const handleDeactivate = useCallback(updated => {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
  }, []);

  const handleInvited = useCallback(newMember => {
    setMembers(prev => [...prev, newMember]);
  }, []);

  const filtered = members.filter(m => {
    const matchRole   = roleFilter === 'ALL' || m.role === roleFilter;
    const matchSearch = !search || [m.displayName, m.email, m.jobTitle, m.department]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return matchRole && matchSearch;
  });

  const presentRoles = [...new Set(members.map(m => m.role).filter(Boolean))];
  const roles        = ['ALL', ...Object.keys(ROLE_COLORS).filter(r => presentRoles.includes(r))];

  const totalUsers   = members.length;
  const activeUsers  = members.filter(m => m.isActive !== false).length;

  const departmentDistribution = [
    { name: 'Global',  count: members.filter(m => ['Global Sales', 'Global'].includes(m.department)).length },
    { name: 'Inbound', count: members.filter(m => m.department === 'Inbound').length },
    { name: 'Mid-Mkt', count: members.filter(m => ['Mid-Market', 'Mid-Mkt'].includes(m.department)).length },
    { name: 'Other',   count: members.filter(m => !['Global Sales', 'Global', 'Inbound', 'Mid-Market', 'Mid-Mkt'].includes(m.department)).length },
  ];

  const statusDistribution = [
    { name: 'Act',  count: activeUsers },
    { name: 'Ina',  count: members.filter(m => m.isActive === false).length },
    { name: 'Pen',  count: 0 },
    { name: 'Arch', count: 0 },
  ];

  const onlineUsers   = members.filter(m => m.isActive !== false).slice(0, 2);
  const onlineAvatars = onlineUsers.map(m =>
    m.avatarUrl || m.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.displayName || 'User')}&background=7c69ef&color=fff`
  );

  return (
    <div className={`team-page team-page--${mode}`}>

      {/* Page Header */}
      <div className="team-page__header">
        <div className="team-page__title-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="team-page__title">Team Management</h1>
            <p className="team-page__subtitle">
              {members.length} {showInactive ? 'total' : 'active'} members · {members.filter(m => m.openDeals > 0).length} with open deals
            </p>
          </div>

          {/* Header actions (admin only) */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {canSeeAll && (
              <button
                onClick={() => setShowInactive(v => !v)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  background: showInactive ? (isDark ? 'rgba(124,105,239,0.15)' : '#ede9fe') : 'transparent',
                  color: showInactive ? '#7c69ef' : (isDark ? '#94a3b8' : '#64748b'),
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <LucideUsers size={14} />
                {showInactive ? 'Showing All' : 'Show Inactive'}
              </button>
            )}
            {canSeeAll && (
              <button
                onClick={() => setShowAuditLog(true)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  background: 'transparent',
                  color: isDark ? '#94a3b8' : '#64748b',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <LucideHistory size={14} />
                Audit Log
              </button>
            )}
            {canInvite && (
              <button
                id="team-invite-btn"
                onClick={() => setShowInvite(true)}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg,#7c69ef,#6c5ce7)',
                  color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 2px 12px rgba(124,105,239,0.35)',
                }}
              >
                <LucidePlus size={15} />
                Invite Member
              </button>
            )}
          </div>
        </div>

        {/* Analytics Row */}
        {!loading && members.length > 0 && (
          <section className="analytics-grid animate-slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 24, width: '100%' }}>
            <AnalyticsCard title="Total Team Members" value={totalUsers.toLocaleString()} icon={LucideUsers} trend trendValue="12%" />
            <AnalyticsCard title="Users by Status"    value="" icon={LucideActivity}  color="primary"  chartData={statusDistribution}       chartType="bar" dataKey="count" />
            <AnalyticsCard title="Department"          value="" icon={LucidePieChart}  color="warning"  chartData={departmentDistribution}    chartType="pie" dataKey="count" />
            <AnalyticsCard title="Currently Online"    value={onlineUsers.length}      icon={LucideRadio} color="success" avatars={onlineAvatars} />
          </section>
        )}

        {/* Search + Filter Bar */}
        <div className="team-page__controls">
          <div className="team-search-wrapper">
            <span className="team-search-icon">🔍</span>
            <input
              className="team-search"
              placeholder="Search by name, email, title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="team-search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>

          <div className="team-role-filters">
            {roles.map(role => (
              <button
                key={role}
                className={`team-role-btn ${roleFilter === role ? 'active' : ''}`}
                style={roleFilter === role && role !== 'ALL'
                  ? { background: ROLE_COLORS[role]?.bg, color: '#fff', borderColor: 'transparent' }
                  : {}}
                onClick={() => setRoleFilter(role)}
              >
                {role === 'ALL' ? 'All Roles' : (ROLE_COLORS[role]?.label || role)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* State Handling */}
      {loading && (
        <div className="team-page__state">
          <div className="team-spinner" />
          <p>Loading team members…</p>
        </div>
      )}

      {!loading && error && (
        <div className="team-page__state team-page__state--error">
          <p>⚠️ {error}</p>
          <button className="team-btn team-btn--ghost" onClick={loadMembers}>Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="team-page__state">
          <p className="team-page__empty">No team members match your filters.</p>
        </div>
      )}

      {/* Card Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="team-grid">
          {filtered.map(member => (
            <MemberCard key={member.id} member={member} onClick={setSelected} />
          ))}
        </div>
      )}

      {/* Profile Drawer */}
      {selected && (
        <ProfileDrawer
          member={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDeactivate={handleDeactivate}
        />
      )}

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={handleInvited}
          isDark={isDark}
        />
      )}

      {/* Role Audit Log */}
      {showAuditLog && (
        <RoleAuditLog onClose={() => setShowAuditLog(false)} />
      )}
    </div>
  );
}
