import React, { useState, useEffect, useCallback } from 'react';
import { fetchTeamMembers, updateTeamMember } from '../../services/teamApi';
import { toast } from 'react-hot-toast';
import { useThemeControl } from '../../context/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { LucideUsers, LucideActivity, LucidePieChart, LucideRadio } from 'lucide-react';
import AnalyticsCard from '../../components/Layout/AnalyticsCard';
import './TeamPage.less';

/**
 * Team Management page — Phase 3 of the CRM Transformation.
 *
 * Displays active team members in a premium card grid with:
 *  - Name, avatar, role badge, department, job title
 *  - Open deals + total activities stats
 *  - Inline role filter and search
 *  - Click-to-expand profile drawer
 */
const ROLE_COLORS = {
  ADMIN:     { bg: '#7c3aed', text: '#fff', label: 'Admin' },
  MANAGER:   { bg: '#0ea5e9', text: '#fff', label: 'Manager' },
  SALES_REP: { bg: '#10b981', text: '#fff', label: 'Sales Rep' },
  USER:      { bg: '#64748b', text: '#fff', label: 'User' },
};

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
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

// ─── Member Card ───────────────────────────────────────────────────────────────

function MemberCard({ member, onClick }) {
  const color = ROLE_COLORS[member.role] || ROLE_COLORS.USER;

  return (
    <div className="team-card" onClick={() => onClick(member)} role="button" tabIndex={0}
         onKeyDown={e => e.key === 'Enter' && onClick(member)}>
      <div className="team-card__header">
        <MemberAvatar member={member} size={56} />
        <div className="team-card__identity">
          <h3 className="team-card__name">{member.displayName}</h3>
          <p className="team-card__title">{member.jobTitle || '—'}</p>
          <span
            className="team-card__role-badge"
            style={{ background: color.bg, color: color.text }}
          >
            {color.label}
          </span>
        </div>
      </div>

      <div className="team-card__body">
        {member.department && (
          <p className="team-card__dept">
            <span className="team-card__dept-icon">🏢</span> {member.department}
          </p>
        )}
        {member.email && (
          <p className="team-card__email">
            <span>✉️</span> {member.email}
          </p>
        )}
        {member.phone && (
          <p className="team-card__phone">
            <span>📞</span> {member.phone}
          </p>
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

// ─── Profile Drawer ────────────────────────────────────────────────────────────



// Mock chart data arrays
const mockPipelineData = [
  { month: 'Jan', deals: 4, value: 45000 },
  { month: 'Feb', deals: 7, value: 80000 },
  { month: 'Mar', deals: 5, value: 60000 },
  { month: 'Apr', deals: 10, value: 120000 },
  { month: 'May', deals: 8, value: 95000 },
  { month: 'Jun', deals: 12, value: 150000 }
];

const mockActivityData = [
  { day: 'Mon', calls: 12, emails: 30, meetings: 3 },
  { day: 'Tue', calls: 18, emails: 45, meetings: 5 },
  { day: 'Wed', calls: 15, emails: 40, meetings: 4 },
  { day: 'Thu', calls: 20, emails: 50, meetings: 6 },
  { day: 'Fri', calls: 10, emails: 25, meetings: 2 }
];

function ProfileDrawer({ member, onClose, onUpdate }) {
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [form, setForm] = useState({
    jobTitle:   member.jobTitle   || '',
    department: member.department || '',
    phone:      member.phone      || '',
    avatarUrl:  member.avatarUrl  || '',
  });

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

  return (
    <div className="team-drawer-overlay" onClick={onClose}>
      <div className="team-drawer" onClick={e => e.stopPropagation()}>
        <button className="team-drawer__close" onClick={onClose} aria-label="Close">✕</button>

        <div className="team-drawer__hero">
          <MemberAvatar member={member} size={80} />
          <div>
            <h2 className="team-drawer__name">{member.displayName}</h2>
            <p className="team-drawer__email">{member.email}</p>
            <span
              className="team-card__role-badge"
              style={{
                background: (ROLE_COLORS[member.role] || ROLE_COLORS.USER).bg,
                color: '#fff',
              }}
            >
              {(ROLE_COLORS[member.role] || ROLE_COLORS.USER).label}
            </span>
          </div>
        </div>

        <div className="team-drawer__stats-row">
          <StatChip label="Open Deals" value={member.openDeals ?? 12} icon="📊" />
          <StatChip label="Closed Won" value={member.closedDeals ?? 45} icon="🏆" />
          <StatChip label="Activities" value={member.totalActivities ?? 234} icon="⚡" />
          <StatChip label="Status"     value={member.isActive ? 'Active' : 'Inactive'} icon="🔵" />
        </div>

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
                         <stop offset="5%" stopColor={(ROLE_COLORS[member.role] || ROLE_COLORS.USER).bg} stopOpacity={0.8}/>
                         <stop offset="95%" stopColor={(ROLE_COLORS[member.role] || ROLE_COLORS.USER).bg} stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                     <XAxis dataKey="month" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                     <RechartsTooltip formatter={(val) => [`$${val.toLocaleString()}`, 'Pipeline']} labelStyle={{color: '#333'}} />
                     <Area type="monotone" dataKey="value" stroke={(ROLE_COLORS[member.role] || ROLE_COLORS.USER).bg} fillOpacity={1} fill="url(#colorValue)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
            
            <div className="team-drawer__chart-box" style={{ marginTop: '24px' }}>
               <h5>Weekly Activity Breakdown</h5>
               <div style={{ width: '100%', height: 200 }}>
                 <ResponsiveContainer>
                   <BarChart data={mockActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                     <XAxis dataKey="day" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                     <RechartsTooltip labelStyle={{color: '#333'}} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                     <Bar dataKey="calls" stackId="a" fill="#0ea5e9" name="Calls" radius={[0, 0, 4, 4]} />
                     <Bar dataKey="emails" stackId="a" fill="#8b5cf6" name="Emails" />
                     <Bar dataKey="meetings" stackId="a" fill="#10b981" name="Meetings" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>

        <div className="team-drawer__section">
          <div className="team-drawer__section-header">
            <h4>Profile Attributes</h4>
            {!editing && (
              <button className="team-drawer__edit-btn" onClick={() => setEditing(true)}>
                ✏️ Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="team-drawer__form">
              {[
                { label: 'Job Title',   name: 'jobTitle'   },
                { label: 'Department',  name: 'department' },
                { label: 'Phone',       name: 'phone'      },
                { label: 'Avatar URL',  name: 'avatarUrl'  },
              ].map(({ label, name }) => (
                <label key={name} className="team-form-field">
                  <span>{label}</span>
                  <input
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={label}
                    disabled={saving}
                  />
                </label>
              ))}
              <div className="team-form-actions">
                <button className="team-btn team-btn--ghost" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </button>
                <button className="team-btn team-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <dl className="team-drawer__details">
              {[
                ['Job Title',   member.jobTitle   || '—'],
                ['Department',  member.department || '—'],
                ['Phone',       member.phone      || '—'],
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { mode } = useThemeControl();
  const [members,  setMembers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchTeamMembers()
      .then(setMembers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = useCallback(updated => {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSelected(updated);
  }, []);

  const filtered = members.filter(m => {
    const matchRole   = roleFilter === 'ALL' || m.role === roleFilter;
    const matchSearch = !search || [m.displayName, m.email, m.jobTitle, m.department]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return matchRole && matchSearch;
  });

  const roles = ['ALL', ...Object.keys(ROLE_COLORS)];

  // ── Compute Analytics using members ────────────────────
  const totalUsers = members.length;
  const activeUsers = members.filter(m => m.isActive !== false).length;

  const departmentDistribution = [
    { name: 'Global', count: members.filter(m => ['Global Sales', 'Global'].includes(m.department)).length },
    { name: 'Inbound', count: members.filter(m => m.department === 'Inbound').length },
    { name: 'Mid-Mkt', count: members.filter(m => ['Mid-Market', 'Mid-Mkt'].includes(m.department)).length },
    { name: 'Other', count: members.filter(m => !['Global Sales', 'Global', 'Inbound', 'Mid-Market', 'Mid-Mkt'].includes(m.department)).length }
  ];

  const statusDistribution = [
    { name: 'Act', count: activeUsers },
    { name: 'Ina', count: members.filter(m => m.isActive === false).length },
    { name: 'Pen', count: 0 },
    { name: 'Arch', count: 0 }
  ];

  // Calculate online avatars (mocking 2 for now, or up to 2 active users)
  const onlineUsers = members.filter(m => m.isActive !== false).slice(0, 2);
  const onlineAvatars = onlineUsers.map(m =>
    m.avatarUrl || m.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.displayName || 'User')}&background=7c69ef&color=fff`
  );

  return (
    <div className={`team-page team-page--${mode}`}>
      {/* Page Header */}
      <div className="team-page__header">
        <div className="team-page__title-block">
          <h1 className="team-page__title">Team Management</h1>
          <p className="team-page__subtitle">
            {members.length} active members · {members.filter(m => m.openDeals > 0).length} with open deals
          </p>
        </div>

        {/* Analytics Row */}
        {!loading && members.length > 0 && (
          <section className="analytics-grid animate-slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '24px', width: '100%' }}>
            <AnalyticsCard title="Total Team Members" value={totalUsers.toLocaleString()} icon={LucideUsers} trend trendValue="12%" />
            <AnalyticsCard
              title="Users by Status"
              value=""
              icon={LucideActivity}
              color="primary"
              chartData={statusDistribution}
              chartType="bar"
              dataKey="count"
            />
            <AnalyticsCard
              title="Department"
              value=""
              icon={LucidePieChart}
              color="warning"
              chartData={departmentDistribution}
              chartType="pie"
              dataKey="count"
            />
            <AnalyticsCard
              title="Currently Online"
              value={onlineUsers.length}
              icon={LucideRadio}
              color="success"
              avatars={onlineAvatars}
            />
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
            {search && (
              <button className="team-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="team-role-filters">
            {roles.map(role => (
              <button
                key={role}
                className={`team-role-btn ${roleFilter === role ? 'active' : ''}`}
                style={roleFilter === role && role !== 'ALL'
                  ? { background: ROLE_COLORS[role]?.bg, color: '#fff', borderColor: 'transparent' }
                  : {}
                }
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
          <button className="team-btn team-btn--ghost" onClick={() => window.location.reload()}>
            Retry
          </button>
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
            <MemberCard
              key={member.id}
              member={member}
              onClick={setSelected}
            />
          ))}
        </div>
      )}

      {/* Profile Drawer */}
      {selected && (
        <ProfileDrawer
          member={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
