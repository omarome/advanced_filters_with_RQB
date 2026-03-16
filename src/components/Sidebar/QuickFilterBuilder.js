import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { 
  LucideZap, 
  LucidePlusCircle, 
  LucideFilter, 
  LucideUsers, 
  LucideClock, 
  LucideTrendingDown, 
  LucideUserMinus,
  LucideArrowRight 
} from 'lucide-react';
import '../../styles/QuickFilterBuilder.less';

const QuickFilterBuilder = ({ query, onQueryChange }) => {
  // ── Local State for Sidebar ────────────────────────────
  const [localSelectedStatuses, setLocalSelectedStatuses] = useState([]);
  const [localAgeRange, setLocalAgeRange] = useState({ min: '', max: '' });
  const [localUserType, setLocalUserType] = useState('');

  // ── Sync with Global Query Prop ────────────────────────
  // When the query prop changes (e.g. from Advanced Filters), update local state
  useEffect(() => {
    // Extract statuses
    const statusRule = query.rules.find(r => r.field === 'status' && r.operator === 'in');
    const statuses = statusRule?.value ? String(statusRule.value).split(',').map(v => v.trim()) : [];
    setLocalSelectedStatuses(statuses);

    // Extract age range
    const ageRule = query.rules.find(r => r.field === 'age' && r.operator === 'between');
    if (ageRule?.value) {
      const [min, max] = String(ageRule.value).split(',');
      setLocalAgeRange({ min: min || '', max: max || '' });
    } else {
      setLocalAgeRange({ min: '', max: '' });
    }

    // Extract user type
    const userTypeRule = query.rules.find(r => r.field === 'userType' && r.operator === '=');
    setLocalUserType(userTypeRule?.value || '');
  }, [query]);

  // ── Reactive Update Helper ─────────────────────────────
  const updateGlobalQuery = useCallback((statuses, age, type) => {
    // Preserve rules that AREN'T handled by the Quick Filter sidebar
    const otherRules = query.rules.filter(r => 
      r.field !== 'status' && r.field !== 'age' && r.field !== 'userType'
    );
    const newRules = [...otherRules];

    // Add sidebar rules
    if (statuses.length > 0) {
      newRules.push({ field: 'status', operator: 'in', value: statuses.join(',') });
    }
    if (age.min !== '' || age.max !== '') {
      newRules.push({ field: 'age', operator: 'between', value: `${age.min},${age.max}` });
    }
    if (type !== '') {
      newRules.push({ field: 'userType', operator: '=', value: type });
    }

    onQueryChange({ ...query, rules: newRules });
  }, [query, onQueryChange]);

  // ── Local UI Handlers ──────────────────────────────────

  const handleStatusToggle = useCallback((status) => {
    const nextStatuses = localSelectedStatuses.includes(status)
      ? localSelectedStatuses.filter(s => s !== status)
      : [...localSelectedStatuses, status];
    
    setLocalSelectedStatuses(nextStatuses);
    updateGlobalQuery(nextStatuses, localAgeRange, localUserType);
  }, [localSelectedStatuses, localAgeRange, localUserType, updateGlobalQuery]);

  const handleAgeChange = useCallback((type, value) => {
    const nextAgeRange = { ...localAgeRange, [type]: value };
    setLocalAgeRange(nextAgeRange);
    updateGlobalQuery(localSelectedStatuses, nextAgeRange, localUserType);
  }, [localSelectedStatuses, localAgeRange, localUserType, updateGlobalQuery]);

  const handleUserTypeChange = useCallback((value) => {
    setLocalUserType(value);
    updateGlobalQuery(localSelectedStatuses, localAgeRange, value);
  }, [localSelectedStatuses, localAgeRange, updateGlobalQuery]);

  const isStatusChecked = (status) => localSelectedStatuses.includes(status);

  return (
    <aside className="quick-filter-sidebar">
      {/* Quick Filter Builder Card */}
      <div className="sidebar-card">
        <div className="card-header">
          <h2 className="card-title">Quick Filter Builder</h2>
          <LucideZap size={16} className="title-icon zap-icon" />
        </div>
        <div className="card-body">
          <div className="filter-field">
            <label className="field-label">User Status</label>
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
            <label className="field-label">Age Range</label>
            <div className="range-inputs">
              <input 
                type="number" 
                placeholder="Min" 
                className="filter-input" 
                value={localAgeRange.min}
                onChange={(e) => handleAgeChange('min', e.target.value)}
              />
              <span className="range-separator">-</span>
              <input 
                type="number" 
                placeholder="Max" 
                className="filter-input" 
                value={localAgeRange.max}
                onChange={(e) => handleAgeChange('max', e.target.value)}
              />
            </div>
          </div>


          <div className="filter-field">
            <label className="field-label">User Type</label>
            <select 
              className="filter-select" 
              value={localUserType}
              onChange={(e) => handleUserTypeChange(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="student">Student</option>
              <option value="employee">Employee</option>
              <option value="unemployed">Unemployed</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Saved Filters Card */}
      <div className="sidebar-card">
        <div className="card-header">
          <h2 className="card-title">Saved Filters</h2>
          <button className="add-filter-btn">
            <LucidePlusCircle size={16} />
          </button>
        </div>
        <nav className="saved-filters-nav">
          <button className="nav-item active">
            <div className="nav-label-group">
              <LucideFilter size={14} />
              <span className="badge badge-active">Active Users</span>
            </div>
            <span className="applied-pill">Applied</span>
          </button>
          <button className="nav-item">
            <div className="nav-label-group">
              <LucideUsers size={14} />
              <span>Marketing Leads</span>
            </div>
          </button>
          <button className="nav-item">
            <div className="nav-label-group">
              <LucideClock size={14} />
              <span>Recent Signups</span>
            </div>
          </button>
          <button className="nav-item">
            <div className="nav-label-group">
              <LucideTrendingDown size={14} />
              <span>Churn Risk (High)</span>
            </div>
          </button>
          <button className="nav-item">
            <div className="nav-label-group">
              <LucideUserMinus size={14} />
              <span className="badge badge-inactive">Inactive 30+ Days</span>
            </div>
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default QuickFilterBuilder;
