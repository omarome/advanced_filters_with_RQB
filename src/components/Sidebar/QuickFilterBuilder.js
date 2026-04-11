import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  LucidePlusCircle,
  LucideFilter,
  LucideTrash2,
  LucideX,
  LucideChevronDown,
  LucideCheck,
} from 'lucide-react';
import { buildFieldsFromVariables } from '../../config/queryConfig';
import { enhanceFieldWithValues } from '../../utils/fieldUtils';
import { fetchFieldsForEntity } from '../../services/crmQueryApi';
import { countRules } from '../../utils/queryUtils';
import QueryBuilderController from '../QueryBuilderController/QueryBuilderController';
import '../../styles/QuickFilterBuilder.less';

// ---------------------------------------------------------------------------
// Which quick-filter fields to show per entity type (order matters)
// ---------------------------------------------------------------------------
const QUICK_FILTERS_BY_ENTITY = {
  TEAM_MEMBER:  ['status', 'isOnline', 'department'],
  ORGANIZATION: ['industry'],
  CONTACT:      ['lifecycleStage'],
  OPPORTUNITY:  ['probability', 'stage'],
};

// Fields that support multi-value selection (stored as operator 'in')
const MULTI_SELECT_FIELDS = new Set(['status']);

// Probability heat zones
const PROB_ZONES = [
  { label: 'Cold',    range: '0–25',   operator: 'between', value: '0,25',   color: '#60a5fa' },
  { label: 'Warm',    range: '26–50',  operator: 'between', value: '26,50',  color: '#fb923c' },
  { label: 'Hot',     range: '51–75',  operator: 'between', value: '51,75',  color: '#f97316' },
  { label: 'Closing', range: '76–100', operator: 'between', value: '76,100', color: '#ef4444' },
];

// ---------------------------------------------------------------------------
// Portal dropdown — renders at document.body to escape sidebar stacking context
// ---------------------------------------------------------------------------
function SidebarDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const btnRef = useRef(null);

  const openMenu = () => {
    const rect = btnRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
    setOpen(true);
  };

  const selected = options.find(o => o.value === value);

  const dropdownPortal = open ? ReactDOM.createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        onClick={() => setOpen(false)}
      />
      <div className="sidebar-dropdown-menu" style={menuStyle}>
        {options.map(opt => (
          <button
            key={opt.value}
            className={`sidebar-dropdown-option ${opt.value === value ? 'is-selected' : ''}`}
            onClick={() => { onChange(opt.value); setOpen(false); }}
            type="button"
          >
            <span>{opt.label}</span>
            {opt.value === value && <LucideCheck size={13} className="option-check" />}
          </button>
        ))}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="sidebar-dropdown">
      <button
        ref={btnRef}
        className={`sidebar-dropdown-btn ${open ? 'is-open' : ''}`}
        onClick={open ? () => setOpen(false) : openMenu}
        type="button"
      >
        <span className={`sidebar-dropdown-value ${!value ? 'is-placeholder' : ''}`}>
          {selected?.label || placeholder}
        </span>
        <LucideChevronDown size={13} className="sidebar-dropdown-chevron" />
      </button>
      {dropdownPortal}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic quick-filter renderer — picks the right widget based on field config
// ---------------------------------------------------------------------------
function SidebarQuickFilter({ field, query, onUpdate }) {
  const values = field.values || [];
  const isMulti = MULTI_SELECT_FIELDS.has(field.name);

  // ── Probability heat strip ──────────────────────────────────────────────
  if (field.chipType === 'probability-heat') {
    const currentRule = query?.rules?.find(r => r.field === field.name);
    return (
      <div>
        <p className="qf-label">{field.label}</p>
        <div className="qf-prob-strip">
          {PROB_ZONES.map(zone => {
            const isActive =
              currentRule?.operator === zone.operator &&
              currentRule?.value === zone.value;
            return (
              <button
                key={zone.label}
                type="button"
                className={`qf-prob-zone ${isActive ? 'is-active' : ''}`}
                style={{ '--zone-color': zone.color }}
                onClick={() => onUpdate(field.name, isActive ? null : zone, false)}
                title={`${zone.label}: ${zone.range}%`}
              >
                <span className="qf-prob-zone-label">{zone.label}</span>
                <span className="qf-prob-zone-range">{zone.range}%</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Pills (≤ 4 options) ────────────────────────────────────────────────
  if (values.length > 0 && values.length <= 4) {
    const currentRule = query?.rules?.find(r => r.field === field.name);
    const selectedValues = isMulti
      ? (currentRule?.value ? String(currentRule.value).split(',').map(v => v.trim()) : [])
      : [];
    const selectedSingle = !isMulti ? (currentRule?.value || null) : null;

    return (
      <div>
        <p className="qf-label">{field.label}</p>
        <div className="qf-pill-row">
          {values.map(v => {
            const isActive = isMulti
              ? selectedValues.includes(v.name)
              : selectedSingle === v.name;
            return (
              <button
                key={v.name}
                type="button"
                className={`qf-pill qf-pill--${v.name.toLowerCase().replace(/\s+/g, '-')} ${isActive ? 'is-active' : ''}`}
                onClick={() => onUpdate(field.name, v.name, isMulti)}
                title={v.label}
              >
                {v.dot && (
                  <span
                    className="qf-pill-dot"
                    style={{ background: v.dot }}
                  />
                )}
                {v.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Dropdown (> 4 options) ────────────────────────────────────────────
  if (values.length > 0) {
    const currentRule = query?.rules?.find(r => r.field === field.name);
    const currentValue = currentRule?.value || '';
    const placeholder = field.chipPlaceholder || `All ${field.label}s`;
    const options = [
      { value: '', label: placeholder },
      ...values.map(v => ({ value: v.name, label: v.label })),
    ];

    return (
      <div>
        <p className="qf-label">{field.label}</p>
        <SidebarDropdown
          value={currentValue}
          onChange={(val) => onUpdate(field.name, val || null, false)}
          options={options}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const QuickFilterBuilder = ({
  entityType, query, onQueryChange, onResetQuery,
  variables, users, savedViews = [], onSaveView,
  onDeleteView,
}) => {
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [entityFields, setEntityFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isSavedViewActive = useCallback((savedQueryJson) => {
    try {
      const savedQuery = JSON.parse(savedQueryJson);
      return JSON.stringify(query.rules) === JSON.stringify(savedQuery.rules) &&
        query.combinator === savedQuery.combinator;
    } catch { return false; }
  }, [query]);

  useEffect(() => {
    if (!entityType) return;
    setFieldsLoading(true);
    fetchFieldsForEntity(entityType)
      .then(setEntityFields)
      .catch(err => console.error(`Failed to load fields for ${entityType}`, err))
      .finally(() => setFieldsLoading(false));
  }, [entityType]);

  const fields = useMemo(() => {
    if (!entityFields.length) return [];
    return buildFieldsFromVariables(entityFields)
      .map(field => enhanceFieldWithValues(users || [], field));
  }, [entityFields, users]);

  // Fields to show as quick filters for this entity type
  const quickFilterFields = useMemo(() => {
    const fieldNames = QUICK_FILTERS_BY_ENTITY[entityType] || [];
    return fieldNames.map(name => fields.find(f => f.name === name)).filter(Boolean);
  }, [fields, entityType]);

  const filteredSavedViews = useMemo(() => savedViews.filter(view => {
    const matchesSearch = view.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEntity = view.entityType?.toUpperCase() === entityType?.toUpperCase() ||
      (entityType === 'TEAM_MEMBER' && !view.entityType);
    return matchesSearch && matchesEntity;
  }), [savedViews, searchQuery, entityType]);

  // Generic rule updater — handles multi-select, single-select, and zone objects
  const updateQuickRule = useCallback((fieldName, value, isMulti) => {
    const otherRules = (query?.rules || []).filter(r => r.field !== fieldName);

    // Clear
    if (!value || (Array.isArray(value) && value.length === 0)) {
      onQueryChange({ ...query, rules: otherRules });
      return;
    }

    // Zone object from probability strip: { operator, value }
    if (typeof value === 'object' && value.operator) {
      onQueryChange({
        ...query,
        rules: [...otherRules, { field: fieldName, operator: value.operator, value: value.value }],
      });
      return;
    }

    if (isMulti) {
      // Toggle multi-select — stored as 'in' operator with comma-joined values
      const existingRule = query?.rules?.find(r => r.field === fieldName);
      const currentValues = existingRule?.value
        ? String(existingRule.value).split(',').map(v => v.trim()).filter(Boolean)
        : [];
      const next = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      if (next.length === 0) {
        onQueryChange({ ...query, rules: otherRules });
      } else {
        onQueryChange({ ...query, rules: [...otherRules, { field: fieldName, operator: 'in', value: next.join(',') }] });
      }
      return;
    }

    // Single-select — toggle (clicking the same value clears it)
    const existingRule = query?.rules?.find(r => r.field === fieldName);
    if (existingRule?.value === value) {
      onQueryChange({ ...query, rules: otherRules });
    } else {
      onQueryChange({ ...query, rules: [...otherRules, { field: fieldName, operator: '=', value }] });
    }
  }, [query, onQueryChange]);

  const handleApplySavedView = useCallback((savedQueryJson) => {
    try {
      if (isSavedViewActive(savedQueryJson)) {
        onQueryChange({ combinator: 'and', rules: [] });
      } else {
        onQueryChange(JSON.parse(savedQueryJson));
      }
    } catch (e) { console.error('Failed to parse saved query', e); }
  }, [onQueryChange, isSavedViewActive]);

  // Count all active rules — quick filters (Industry, stage, etc.) + custom filter builder rules.
  // On mobile the sidebar is collapsed so the active pill state isn't visible;
  // the badge is the only indicator of how many filters are applied.
  const totalActiveCount = useMemo(() =>
    (query?.rules || []).filter(r => !r.rules).length,
  [query]);

  // Separate count for custom-builder-only rules (used for the "Build Filter" button label)
  const customRulesCount = useMemo(() => {
    const quickFieldNames = new Set(QUICK_FILTERS_BY_ENTITY[entityType] || []);
    return (query?.rules || []).filter(r => !r.rules && !quickFieldNames.has(r.field)).length;
  }, [query, entityType]);

  const hasActiveFilters = query?.rules?.length > 0;
  const hasQuickFilters = quickFilterFields.length > 0;

  return (
    <aside className="quick-filter-sidebar">

      {/* ── Section header — same style as nav-section-btn ── */}
      <button
        className={`nav-section-btn qf-toggle ${filtersCollapsed ? '' : 'is-open'}`}
        onClick={() => setFiltersCollapsed(p => !p)}
        aria-expanded={!filtersCollapsed}
      >
        <span>
          Quick Filters
          {hasActiveFilters && <span className="qf-active-dot" />}
        </span>
        <LucideChevronDown size={13} className="nav-section-chevron" />
      </button>

      {/* ── Collapsible content ── */}
      <div
        className={`nav-section-items qf-content ${filtersCollapsed ? '' : 'is-open'}`}
        aria-hidden={filtersCollapsed}
      >

        {/* Quick filter fields — rendered generically per entity type */}
        {hasQuickFilters && (
          <div className="qf-card">
            {quickFilterFields.map((field, i) => (
              <div key={field.name} className={i > 0 ? 'qf-filter-group' : undefined}>
                <SidebarQuickFilter
                  field={field}
                  query={query}
                  onUpdate={updateQuickRule}
                />
              </div>
            ))}
          </div>
        )}

        {/* Custom filter builder */}
        <div className="qf-card">
          <div className="qf-custom-header">
            <p className="qf-label">Custom Filter</p>
            {totalActiveCount > 0 && (
              <span className="qf-active-badge">{totalActiveCount} active</span>
            )}
          </div>
          {fieldsLoading ? (
            <div className="qf-loading">
              <div className="spinner-small" /> Loading fields…
            </div>
          ) : (
            <QueryBuilderController
              fields={fields}
              query={query}
              label="Build Filter"
              onQueryChange={onQueryChange}
              showCount={false}
            />
          )}

          {hasActiveFilters && (
            <button className="qf-clear-btn" onClick={onResetQuery}>
              <LucideX size={13} /> Clear all filters
            </button>
          )}
        </div>

        {/* Saved Filters card */}
        <div className="qf-card saved-filters-section">
          <div className="qf-card-header">
            <p className="qf-label" style={{ margin: 0 }}>Saved Filters</p>
            <button className="add-filter-btn" onClick={onSaveView} title="Save current view">
              <LucidePlusCircle size={15} />
            </button>
          </div>

          {savedViews.length > 0 && (
            <div className="saved-filters-search">
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>
          )}

          <nav className="saved-filters-nav custom-scrollbar">
            {savedViews.length === 0 ? (
              <p className="no-filters-msg">No saved views yet.</p>
            ) : filteredSavedViews.length === 0 ? (
              <p className="no-filters-msg">No match.</p>
            ) : filteredSavedViews.map(view => {
              const isActive = isSavedViewActive(view.queryJson);
              return (
                <div key={view.id} className={`nav-item-wrapper ${isActive ? 'active' : ''}`}>
                  <button className="nav-item-btn" onClick={() => handleApplySavedView(view.queryJson)} title={view.name}>
                    <div className="nav-label-group">
                      <LucideFilter size={13} />
                      <span className="truncate-text">{view.name}</span>
                    </div>
                  </button>
                  <div className="nav-item-actions">
                    {isActive && <span className="applied-pill">On</span>}
                    <button
                      className="delete-view-btn"
                      onClick={e => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${view.name}"?`)) onDeleteView?.(view.id);
                      }}
                      title="Delete"
                    >
                      <LucideTrash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

      </div>
    </aside>
  );
};

export default QuickFilterBuilder;
