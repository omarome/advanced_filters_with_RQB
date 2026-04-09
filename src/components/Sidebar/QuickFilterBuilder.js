import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  LucideZap,
  LucidePlusCircle,
  LucideFilter,
  LucideUsers,
  LucideClock,
  LucideTrendingDown,
  LucideUserMinus,
  LucideArrowRight,
  LucideTrash2,
  LucideX,
  LucideChevronUp,
  LucideChevronDown,
} from 'lucide-react';
import { buildFieldsFromVariables } from '../../config/queryConfig';
import { enhanceFieldWithValues } from '../../utils/fieldUtils';
import { fetchFieldsForEntity } from '../../services/crmQueryApi';
import QueryBuilderController from '../QueryBuilderController/QueryBuilderController';
import '../../styles/QuickFilterBuilder.less';

const QuickFilterBuilder = ({ entityType, query, onQueryChange, onResetQuery, variables, users, savedViews = [], onSaveView, onDeleteView, onToggleSidebar, isSidebarOpen }) => {
  // ── Local State for Sidebar ────────────────────────────
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [entityFields, setEntityFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [localSelectedStatuses, setLocalSelectedStatuses] = useState([]);

  const [localDepartment, setLocalDepartment] = useState('');

  // Helper to determine if a saved view is "active" based on current query
  const isSavedViewActive = (savedQueryJson) => {
    try {
      const savedQuery = JSON.parse(savedQueryJson);
      // Simple stringify comparison for exact match
      return JSON.stringify(query.rules) === JSON.stringify(savedQuery.rules) &&
        query.combinator === savedQuery.combinator;
    } catch (e) {
      return false;
    }
  };

  // ── Sync with Global Query Prop ────────────────────────
  // When the query prop changes (e.g. from Advanced Filters), update local state
  useEffect(() => {
    // Extract statuses
    const statusRule = query.rules.find(r => r.field === 'status' && r.operator === 'in');
    const statuses = statusRule?.value ? String(statusRule.value).split(',').map(v => v.trim()) : [];
    setLocalSelectedStatuses(statuses);

    // Extract user type
    const departmentRule = query.rules.find(r => r.field === 'department' && r.operator === '=');
    setLocalDepartment(departmentRule?.value || '');
  }, [query]);

  // ── Fetch Entity Specific Fields ───────────────────────
  useEffect(() => {
    if (!entityType) return;
    
    // For TEAM_MEMBER, we can fallback to variables prop if needed, 
    // but the query/fields endpoint is more robust for RQB.
    setFieldsLoading(true);
    fetchFieldsForEntity(entityType)
      .then(setEntityFields)
      .catch(err => console.error(`Failed to load fields for ${entityType}`, err))
      .finally(() => setFieldsLoading(false));
  }, [entityType]);

  // ── Reactive Update Helper ─────────────────────────────
  const updateGlobalQuery = useCallback((statuses, department) => {
    // Preserve rules that AREN'T handled by the Quick Filter sidebar
    const otherRules = query.rules.filter(r =>
      r.field !== 'status' && r.field !== 'department'
    );
    const newRules = [...otherRules];

    // Add sidebar rules
    if (statuses.length > 0) {
      newRules.push({ field: 'status', operator: 'in', value: statuses.join(',') });
    }

    if (department !== '') {
      newRules.push({ field: 'department', operator: '=', value: department });
    }

    onQueryChange({ ...query, rules: newRules });
  }, [query, onQueryChange]);

  // ── Local UI Handlers ──────────────────────────────────

  const handleStatusToggle = useCallback((status) => {
    const nextStatuses = localSelectedStatuses.includes(status)
      ? localSelectedStatuses.filter(s => s !== status)
      : [...localSelectedStatuses, status];

    setLocalSelectedStatuses(nextStatuses);
    updateGlobalQuery(nextStatuses, localDepartment);
  }, [localSelectedStatuses, localDepartment, updateGlobalQuery]);



  const handleDepartmentChange = useCallback((value) => {
    setLocalDepartment(value);
    updateGlobalQuery(localSelectedStatuses, value);
  }, [localSelectedStatuses, updateGlobalQuery]);

  const handleApplySavedView = useCallback((savedQueryJson) => {
    try {
      if (isSavedViewActive(savedQueryJson)) {
        // If it's already active, clicking it again should clear it
        onQueryChange({ combinator: 'and', rules: [] });
      } else {
        // Otherwise, apply it
        const savedQuery = JSON.parse(savedQueryJson);
        onQueryChange(savedQuery);
      }
    } catch (e) {
      console.error("Failed to parse saved query", e);
    }
  }, [onQueryChange, query]);

  const isStatusChecked = (status) => localSelectedStatuses.includes(status);

  // ── QueryBuilder Fields Array ──────────────────────────
  const fields = useMemo(() => {
    if (!entityFields.length) return [];
    const baseFields = buildFieldsFromVariables(entityFields);
    return baseFields.map((field) => enhanceFieldWithValues(users || [], field));
  }, [entityFields, users]);

  const [searchQuery, setSearchQuery] = useState('');

  // Filter saved views based on search query AND entityType
  const filteredSavedViews = useMemo(() => {
    return savedViews.filter(view => {
      const matchesSearch = view.name.toLowerCase().includes(searchQuery.toLowerCase());
      try {
        const saved = JSON.parse(view.queryJson);
        // Only show views for this entity
        const matchesEntity = String(saved.entityType).toUpperCase() === String(entityType).toUpperCase() || 
                             (entityType === 'TEAM_MEMBER' && !saved.entityType); // legacy views
        return matchesSearch && matchesEntity;
      } catch {
        return matchesSearch; // fallback
      }
    });
  }, [savedViews, searchQuery, entityType]);

  return (

    <aside className="quick-filter-sidebar">
      {/* Filter Panel Collapse Toggle */}
      <div className="sidebar-collapse-container">
        <button
          onClick={() => setFiltersCollapsed(p => !p)}
          className="sidebar-collapse-btn"
          title={filtersCollapsed ? 'Expand filters' : 'Collapse filters'}
        >
          {filtersCollapsed
            ? <><LucideChevronDown size={16} /> Show Filters</>
            : <><LucideChevronUp size={16} /> Hide Filters</>
          }
        </button>
      </div>

      {!filtersCollapsed && <>
      {/* Quick Filter Builder Card */}
      <div className="sidebar-card">
        <div className="card-header">
          <h2 className="card-title">Quick Filter Builder</h2>
          <LucideZap size={16} className="title-icon zap-icon" />
        </div>
        <div className="card-body">
          {entityType === 'TEAM_MEMBER' && (
            <>
              <div className="filter-field">
                <label className="field-label">Account Status</label>
                <div className="checkbox-group">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={isStatusChecked('Active')}
                      onChange={() => handleStatusToggle('Active')}
                    />
                    <span className="badge badge-active">Active</span>
                  </label>
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={isStatusChecked('Inactive')}
                      onChange={() => handleStatusToggle('Inactive')}
                    />
                    <span className="badge badge-inactive">Inactive</span>
                  </label>
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={isStatusChecked('Pending')}
                      onChange={() => handleStatusToggle('Pending')}
                    />
                    <span className="badge badge-pending">Pending</span>
                  </label>
                </div>
              </div>

              <div className="filter-field">
                <label className="field-label">Department</label>
                <select
                  className="filter-select"
                  value={localDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="Global Sales">Global Sales</option>
                  <option value="Inbound">Inbound</option>
                  <option value="Mid-Market">Mid-Market</option>
                </select>
              </div>
            </>
          )}

          {/* Build Custom Filter */}
          <div className="filter-field" style={{ marginTop: entityType === 'TEAM_MEMBER' ? '24px' : '0' }}>
            {fieldsLoading ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                 <div className="spinner-small" /> Loading fields...
               </div>
            ) : (
              <QueryBuilderController
                fields={fields}
                query={query}
                label="Build Custom Filter"
                onQueryChange={onQueryChange}
              />
            )}
          </div>

          <button
            className="clear-filters-btn"
            onClick={onResetQuery}
            disabled={!query || query.rules.length === 0}
            title="Clear all filters"
            style={{ width: '100%', marginTop: '16px' }}
          >
            <LucideX size={16} /> Clear Filters
          </button>
        </div>
      </div>

      {/* Saved Filters Card */}
      <div className="sidebar-card saved-filters-section">
        <div className="card-header">
          <h2 className="card-title">Saved Filters</h2>
          <button className="add-filter-btn" onClick={onSaveView} title="Save Current View">
            <LucidePlusCircle size={16} />
          </button>
        </div>

        {savedViews.length > 0 && (
          <div className="saved-filters-search">
            <input
              type="text"
              placeholder="Search saved filters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
            />
          </div>
        )}

        <nav className="saved-filters-nav custom-scrollbar">
          {savedViews.length === 0 ? (
            <div className="no-filters-msg">No saved views yet.</div>
          ) : filteredSavedViews.length === 0 ? (
            <div className="no-filters-msg">No filters match your search.</div>
          ) : (
            filteredSavedViews.map((view) => {
              const isActive = isSavedViewActive(view.queryJson);
              return (
                <div key={view.id} className={`nav-item-wrapper ${isActive ? 'active' : ''}`}>
                  <button
                    className="nav-item-btn"
                    onClick={() => handleApplySavedView(view.queryJson)}
                    title={view.name}
                  >
                    <div className="nav-label-group">
                      <LucideFilter size={14} />
                      <span className="truncate-text">{view.name}</span>
                    </div>
                  </button>
                  <div className="nav-item-actions">
                    {isActive && <span className="applied-pill">Applied</span>}
                    <button
                      className="delete-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete "${view.name}"?`)) {
                          onDeleteView && onDeleteView(view.id);
                        }
                      }}
                      title="Delete saved filter"
                    >
                      <LucideTrash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </nav>
      </div>
      </>}
    </aside>
  );
};

export default QuickFilterBuilder;
