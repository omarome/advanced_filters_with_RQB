import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LucideBuilding, LucideUsers, LucideUser,
  LucideZap, LucideLayoutDashboard, LucideKanban, LucideFilter, LucideTable,
  LucideMoon, LucideSun, LucideLogOut, LucideSettings, LucideLifeBuoy,
  LucideChevronDown, LucideLock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { useRole } from '../../hooks/useRole';
import { useThemeControl } from '../../context/ThemeContext';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import './SidebarNavigation.less';

const ROLE_DISPLAY = {
  SUPER_ADMIN:     { label: 'Super Admin',     color: '#ef4444' },
  WORKSPACE_OWNER: { label: 'Workspace Owner', color: '#f97316' },
  ADMIN:           { label: 'Admin',           color: '#7c3aed' },
  MANAGER:         { label: 'Manager',         color: '#0ea5e9' },
  SALES_REP:       { label: 'Sales Rep',       color: '#10b981' },
  USER:            { label: 'User',            color: '#64748b' },
  VIEWER:          { label: 'Viewer',          color: '#94a3b8' },
  GUEST:           { label: 'Guest',           color: '#cbd5e1' },
};

const SALES_ROUTES = ['/sales/organizations', '/sales/contacts', '/sales/pipeline', '/sales/dashboard'];
const TOOLS_ROUTES = ['/automations', '/segments'];

const SidebarNavigation = ({ children, onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { role, can }    = useRole();
  const { mode, toggleTheme } = useThemeControl();
  const navigate = useNavigate();
  const location = useLocation();

  const canUseAutomations = can('automations.write');
  const roleDisplay = ROLE_DISPLAY[role] ?? ROLE_DISPLAY.SALES_REP;

  const isInSales = SALES_ROUTES.some(r => location.pathname.startsWith(r));
  const isInTools = TOOLS_ROUTES.some(r => location.pathname.startsWith(r));

  // Auto-expand the section containing the active route; collapse the other
  const [salesOpen, setSalesOpen] = useState(isInSales || !isInTools);
  const [toolsOpen, setToolsOpen] = useState(isInTools);

  const avatarUrl = user?.photoURL || user?.avatarUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'Admin User')}&background=7c69ef&color=fff`;

  return (
    <div className="sidebar-navigation">
      <div className="sidebar-brand">
        <LucideZap size={24} className="brand-icon" />
        <span className="brand-name">HumintFlow</span>
        <span className="brand-badge">AI</span>
      </div>

      <WorkspaceSwitcher />

      <nav className="nav-menu">
        <NavLink to="/directory" style={{ '--nav-icon-color': '#7c69ef' }} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <LucideTable size={18} />
          <span>Employee Directory</span>
        </NavLink>
        <NavLink to="/team" style={{ '--nav-icon-color': '#3b82f6' }} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <LucideUsers size={18} />
          <span>Team Management</span>
        </NavLink>

        {/* ── Sales Workspace (collapsible) ─────────────────── */}
        <button
          className={`nav-section-btn ${salesOpen ? 'is-open' : ''}`}
          onClick={() => setSalesOpen(v => !v)}
          aria-expanded={salesOpen}
        >
          <span>Sales Workspace</span>
          <LucideChevronDown size={13} className="nav-section-chevron" />
        </button>
        <div className={`nav-section-items ${salesOpen ? 'is-open' : ''}`} aria-hidden={!salesOpen}>
          <NavLink to="/sales/organizations" style={{ '--nav-icon-color': '#10b981' }} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LucideBuilding size={18} />
            <span>Organizations</span>
          </NavLink>
          <NavLink to="/sales/contacts" style={{ '--nav-icon-color': '#f59e0b' }} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LucideUser size={18} />
            <span>Contacts</span>
          </NavLink>
          <NavLink to="/sales/pipeline" style={{ '--nav-icon-color': '#8b5cf6' }} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LucideKanban size={18} />
            <span>Pipeline</span>
          </NavLink>
          <NavLink to="/sales/dashboard" style={{ '--nav-icon-color': '#0ea5e9' }} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LucideLayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* ── Tools (collapsible) ───────────────────────────── */}
        <button
          className={`nav-section-btn ${toolsOpen ? 'is-open' : ''}`}
          onClick={() => setToolsOpen(v => !v)}
          aria-expanded={toolsOpen}
        >
          <span>Tools</span>
          <LucideChevronDown size={13} className="nav-section-chevron" />
        </button>
        <div className={`nav-section-items ${toolsOpen ? 'is-open' : ''}`} aria-hidden={!toolsOpen}>
          {canUseAutomations ? (
            <NavLink to="/automations" style={{ '--nav-icon-color': '#f97316' }} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <LucideZap size={18} />
              <span>Automations</span>
            </NavLink>
          ) : (
            /* Locked item — visible but clearly unavailable; tooltip explains why */
            <div
              className="nav-item nav-item--locked"
              title="Automations require Manager or Admin access"
              aria-label="Automations — requires higher role"
              style={{ '--nav-icon-color': '#f97316', opacity: 0.45, cursor: 'not-allowed' }}
            >
              <LucideZap size={18} />
              <span>Automations</span>
              <LucideLock size={12} style={{ marginLeft: 'auto', flexShrink: 0 }} />
            </div>
          )}
          <NavLink to="/segments" style={{ '--nav-icon-color': '#ec4899' }} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LucideFilter size={18} />
            <span>Segments</span>
          </NavLink>
        </div>
      </nav>

      {children && (
        <div className="sidebar-content-wrapper">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { onToggleSidebar, isSidebarOpen });
            }
            return child;
          })}
        </div>
      )}

      {/* Sidebar Footer — user profile + actions */}
      <div className="sidebar-footer">
        <button
          className="sidebar-user"
          onClick={() => navigate('/settings/account')}
          title="Profile settings"
        >
          <img src={avatarUrl} alt="Profile" className="sidebar-avatar" />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.displayName || user?.email || 'User'}</span>
            <span
              className="sidebar-user-role"
              style={{ color: roleDisplay.color }}
            >
              {roleDisplay.label}
            </span>
          </div>
        </button>

        <div className="sidebar-footer-actions">
          <button className="sidebar-icon-btn" onClick={() => navigate('/help')} title="User guide">
            <LucideLifeBuoy size={16} />
          </button>
          <button
            className="sidebar-icon-btn"
            onClick={toggleTheme}
            title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {mode === 'light' ? <LucideMoon size={16} /> : <LucideSun size={16} />}
          </button>
          <button className="sidebar-icon-btn" onClick={() => navigate('/settings/account')} title="Settings">
            <LucideSettings size={16} />
          </button>
          <button className="sidebar-icon-btn sidebar-logout-btn" onClick={logout} title="Sign out">
            <LucideLogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarNavigation;
