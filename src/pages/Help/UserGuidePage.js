import React from 'react';
import {
  LucideBuilding,
  LucideUsers,
  LucideKanban,
  LucideTable,
  LucideFilter,
  LucideZap,
  LucideBookmark,
  LucideDownload,
  LucideMail,
  LucideChevronRight,
} from 'lucide-react';
import './UserGuidePage.less';

const MODULES = [
  {
    icon: LucideTable,
    color: '#7c69ef',
    title: 'Employee Directory',
    route: '/directory',
    description: 'Browse and filter your internal team using the full React Query Builder engine with nested AND/OR logic.',
    tips: [
      'Use "Build Custom Filter" to combine multiple field rules with AND / OR logic',
      'Save any filter combination as a named view — accessible in the sidebar',
      'Export the filtered results to CSV with one click',
      'Sort any column by clicking its header',
    ],
  },
  {
    icon: LucideUsers,
    color: '#3b82f6',
    title: 'Team Management',
    route: '/team',
    description: 'View your sales reps, their deal ownership, activity counts, and performance at a glance.',
    tips: [
      'Click a team member to see their deals and recent activity',
      'Deal and activity counts update automatically as records change',
      'Team members are linked to Organizations and Contacts as deal owners',
    ],
  },
  {
    icon: LucideBuilding,
    color: '#10b981',
    title: 'Organizations',
    route: '/sales/organizations',
    description: 'Manage your customer company accounts — the top-level entity in the CRM hierarchy.',
    tips: [
      'Filter by Industry, Country, or Employee count using the inline filter bar',
      'Click any row to expand an inline detail panel, or open it as a full modal',
      'Save your current filter combination as a named view for quick re-use',
      '"Clear Filters" resets the table back to all organizations',
    ],
  },
  {
    icon: LucideUsers,
    color: '#f59e0b',
    title: 'Contacts',
    route: '/sales/contacts',
    description: 'Track the people at your customer accounts. Each contact links to an Organization and has a lifecycle stage.',
    tips: [
      'Filter by Lifecycle Stage (Lead, Prospect, Customer, Churned) using stage pills',
      'Filter by Organization name using the dropdown',
      'Log calls, emails, meetings, and notes from the contact detail panel',
      'Bulk-email selected contacts using the Email action',
    ],
  },
  {
    icon: LucideKanban,
    color: '#8b5cf6',
    title: 'Pipeline',
    route: '/sales/pipeline',
    description: 'Track deals through your sales pipeline. Switch between Table, Board, Calendar, and Dashboard views.',
    tips: [
      'Table view: sort, filter, and bulk-manage deals',
      'Board view: drag deals between pipeline stages (Kanban)',
      'Calendar view: see close dates and meetings on a grid',
      'Dashboard view: KPI cards — revenue, win rate, avg deal size',
      'Filter by Stage, Owner, or Deal Value range',
    ],
  },
  {
    icon: LucideFilter,
    color: '#ec4899',
    title: 'Segments',
    route: '/segments',
    description: 'Build advanced cross-entity queries using the full React Query Builder engine to create reusable CRM segments.',
    tips: [
      'Combine any number of field rules with nested AND / OR groups',
      'Select the entity type to query (Contacts, Organizations, Deals)',
      'Save segments for the team to use as shared filter presets',
      'Export segment results to CSV',
    ],
  },
  {
    icon: LucideZap,
    color: '#f97316',
    title: 'Automations',
    route: '/automations',
    description: 'Set up no-code trigger/action rules so repetitive tasks happen automatically when data changes.',
    tips: [
      'Trigger on deal stage changes, new contacts created, or overdue tasks',
      'Actions include: send notification, create task, update a field, send email',
      'Enable or disable individual rules without deleting them',
      'View recent automation execution history',
    ],
  },
  {
    icon: LucideBookmark,
    color: '#6366f1',
    title: 'Saved Views',
    description: 'Every table page supports saving the current filter state as a named view for quick access later.',
    tips: [
      'Click "Save View" in the table toolbar to name and save current filters',
      'Saved views appear in the sidebar under each page — click to apply instantly',
      'Click an applied view again to clear it back to the default state',
      'Delete views you no longer need from the sidebar list',
    ],
  },
];

const SHORTCUTS = [
  { label: 'Save View', action: 'Click "Save View" in any table toolbar' },
  { label: 'Clear Filters', action: 'Click "Clear Filters" button or reset from inline bar' },
  { label: 'Export CSV', action: 'Click "Export" in any table toolbar' },
  { label: 'Bulk Email', action: 'Select rows → click "Email" in the toolbar' },
  { label: 'Bulk Delete', action: 'Select rows → click "Delete" in the toolbar' },
  { label: 'Inline Detail', action: 'Click any row to expand the detail panel in-place' },
  { label: 'Full Detail', action: 'Expand a row → click the ↗ button to open as modal' },
  { label: 'Dark / Light mode', action: 'Click the moon/sun icon in the sidebar footer' },
];

export default function UserGuidePage() {
  return (
    <div className="user-guide-page">
      <div className="ug-header">
        <h1 className="page-title-gradient ug-title">User Guide</h1>
        <p className="ug-subtitle">
          Everything you need to get the most out of HumintFlow — from filtering contacts to automating your pipeline.
        </p>
      </div>

      <div className="ug-grid">
        {MODULES.map(({ icon: Icon, color, title, route, description, tips }) => (
          <div key={title} className="ug-card">
            <div className="ug-card-header">
              <div className="ug-card-icon" style={{ '--module-color': color }}>
                <Icon size={20} />
              </div>
              <div className="ug-card-meta">
                <h2 className="ug-card-title">{title}</h2>
                {route && (
                  <span className="ug-card-route">{route}</span>
                )}
              </div>
            </div>
            <p className="ug-card-desc">{description}</p>
            <ul className="ug-tips">
              {tips.map((tip, i) => (
                <li key={i} className="ug-tip">
                  <LucideChevronRight size={13} className="ug-tip-icon" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="ug-shortcuts-section">
        <h2 className="ug-shortcuts-title">Quick Reference</h2>
        <div className="ug-shortcuts-grid">
          {SHORTCUTS.map(({ label, action }) => (
            <div key={label} className="ug-shortcut-row">
              <span className="ug-shortcut-label">{label}</span>
              <span className="ug-shortcut-action">{action}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ug-footer">
        <p>
          Need more help? Contact your administrator or refer to the{' '}
          <a href="https://github.com" target="_blank" rel="noreferrer" className="ug-footer-link">
            project documentation
          </a>.
        </p>
        <p className="ug-version">HumintFlow CRM · © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
