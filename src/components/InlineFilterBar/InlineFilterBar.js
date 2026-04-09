import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LucideFilter, LucideX, LucideChevronDown } from 'lucide-react';
import QueryBuilderController from '../QueryBuilderController/QueryBuilderController';
import '../../styles/InlineFilterBar.less';

// ── Internal: reusable portal dropdown chip ───────────────────────────────────
function FilterDropdownChip({ value, options, onSelect, placeholder = 'All' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const chipRef = useRef(null);

  const openMenu = useCallback(() => {
    if (chipRef.current) {
      const rect = chipRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
    }
    setOpen(p => !p);
  }, []);

  return (
    <>
      <button
        ref={chipRef}
        className={`dept-chip ${value ? 'has-value' : ''}`}
        onClick={openMenu}
        aria-expanded={open}
      >
        <span>{value || placeholder}</span>
        <LucideChevronDown size={13} className={`chevron ${open ? 'open' : ''}`} />
      </button>

      {open && createPortal(
        <>
          <div className="dept-backdrop" onClick={() => setOpen(false)} />
          <div className="dept-menu" style={{ position: 'absolute', top: pos.top, left: pos.left }}>
            <button
              className={`dept-option ${!value ? 'is-selected' : ''}`}
              onClick={() => { onSelect(''); setOpen(false); }}
            >
              {placeholder}
            </button>
            {options.map(opt => (
              <button
                key={opt}
                className={`dept-option ${value === opt ? 'is-selected' : ''}`}
                onClick={() => { onSelect(opt === value ? '' : opt); setOpen(false); }}
              >
                {opt}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ── Internal: bucket pill row (employee count / deal value) ───────────────────
function BucketPills({ buckets, value, onChange }) {
  return (
    <div className="pill-group">
      {buckets.map(bucket => {
        const active = value?.label === bucket.label;
        return (
          <button
            key={bucket.label}
            className={`status-pill bucket-pill ${active ? 'is-active' : ''}`}
            onClick={() => onChange(active ? null : bucket)}
            aria-pressed={active}
          >
            {bucket.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Shared shell: label + divider + children + spacer + active summary ────────
function FilterShell({ activeCount, onClear, children }) {
  const hasFilters = activeCount > 0;
  return (
    <div className={`inline-filter-bar ${hasFilters ? 'has-active' : ''}`}>
      <span className="filter-label">
        <LucideFilter size={13} />
        Filters
      </span>
      <div className="filter-divider" />
      <div className="filter-content-wrapper">
        {children}
      </div>
      <div className="filter-spacer" />
      {hasFilters && (
        <div className="active-summary">
          <span className="active-badge">{activeCount} active</span>
          <button className="clear-btn" onClick={onClear} title="Clear all filters">
            <LucideX size={13} />
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

const InlineFilterBar = ({ query, onQueryChange, onResetQuery, fields = [] }) => {
  // ── Find "Hero" fields for quick chips (e.g. status, stage, industry) ─────
  const heroFieldConfigs = useMemo(() => {
    const targets = ['status', 'lifecycleStage', 'pipelineStage', 'department', 'industry'];
    return fields.filter(f => targets.includes(f.name));
  }, [fields]);

  // ── Handlers for dynamic chips ───────────────────────────────────────────
  const getRuleForField = useCallback((fieldName) => {
    return query?.rules?.find(r => r.field === fieldName);
  }, [query]);

  const updateRule = useCallback((field, value) => {
    const rules = [...(query?.rules || [])];
    const idx = rules.findIndex(r => r.field === field.name);

    if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
      if (idx > -1) rules.splice(idx, 1);
    } else {
      const operator = Array.isArray(value) || field.type === 'list' || field.type === 'multiselect' ? 'in' : '=';
      const val = Array.isArray(value) ? value.join(',') : value;
      if (idx > -1) rules[idx] = { ...rules[idx], operator, value: val };
      else rules.push({ field: field.name, operator, value: val });
    }
    onQueryChange({ ...query, rules });
  }, [query, onQueryChange]);

  const activeCount = (query?.rules?.length || 0);

  return (
    <FilterShell activeCount={activeCount} onClear={onResetQuery}>
      {heroFieldConfigs.map(field => {
        const rule = getRuleForField(field.name);
        // Handle both comma-separated strings and arrays
        const rawValue = rule?.value || '';
        const currentSelected = typeof rawValue === 'string' ? (rawValue ? rawValue.split(',') : []) : (Array.isArray(rawValue) ? rawValue : []);

        return (
          <React.Fragment key={field.name}>
            <div className="filter-group">
              <span className="group-label">{field.label}</span>
              <FilterDropdownChip
                value={Array.isArray(currentSelected) ? currentSelected[0] : currentSelected} // simplified for now
                options={field.options?.map(o => typeof o === 'string' ? o : o.value) || []}
                onSelect={(v) => updateRule(field, v)}
                placeholder={`All ${field.label}s`}
              />
            </div>
            <div className="filter-divider" />
          </React.Fragment>
        );
      })}

      <div className="filter-group custom-group">
        <QueryBuilderController
          fields={fields}
          query={query}
          onQueryChange={onQueryChange}
          label="Build Custom Filter"
        />
      </div>
    </FilterShell>
  );
};

export default InlineFilterBar;
