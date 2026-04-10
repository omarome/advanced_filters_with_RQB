import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LucideFilter, LucideX, LucideChevronDown, LucideChevronLeft, LucideChevronRight } from 'lucide-react';
import QueryBuilderController from '../QueryBuilderController/QueryBuilderController';
import '../../styles/InlineFilterBar.less';

// ── Internal: reusable portal dropdown chip ───────────────────────────────────
// options: array of { value, label } objects
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

  const selectedOpt = options.find(o => o.value === value);
  const selectedLabel = selectedOpt?.label || value;
  const selectedDot = selectedOpt?.dot;

  return (
    <>
      <button
        ref={chipRef}
        className={`dept-chip ${value ? 'has-value' : ''}`}
        onClick={openMenu}
        aria-expanded={open}
      >
        {value && selectedDot && (
          <span className="chip-dot" style={{ backgroundColor: selectedDot }} />
        )}
        <span>{value ? selectedLabel : placeholder}</span>
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
                key={opt.value}
                className={`dept-option ${value === opt.value ? 'is-selected' : ''}`}
                onClick={() => { onSelect(opt.value === value ? '' : opt.value); setOpen(false); }}
              >
                {opt.dot && <span className="option-dot" style={{ backgroundColor: opt.dot }} />}
                {opt.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ── Internal: probability heat-zone segments ──────────────────────────────────
const PROB_ZONES = [
  { key: 'low',  label: 'Low',  range: '< 25%',  operator: '<',       value: '25',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)'   },
  { key: 'fair', label: 'Fair', range: '25–50%', operator: 'between', value: '25,50', color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.35)'  },
  { key: 'good', label: 'Good', range: '50–75%', operator: 'between', value: '50,75', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)'  },
  { key: 'high', label: 'High', range: '> 75%',  operator: '>=',      value: '75',    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)'  },
];

function ProbabilityHeatChip({ rule, onSelect }) {
  const activeKey = rule ? PROB_ZONES.find(z => z.operator === rule.operator && z.value === rule.value)?.key : null;

  return (
    <div className="prob-heat-strip">
      {PROB_ZONES.map((zone, i) => {
        const active = activeKey === zone.key;
        return (
          <button
            key={zone.key}
            className={`prob-zone ${active ? 'is-active' : ''}`}
            style={{
              '--zone-color':  zone.color,
              '--zone-bg':     active ? zone.bg     : 'transparent',
              '--zone-border': active ? zone.border : 'transparent',
              borderRadius: i === 0 ? '6px 0 0 6px' : i === PROB_ZONES.length - 1 ? '0 6px 6px 0' : '0',
            }}
            onClick={() => onSelect(active ? null : zone)}
            aria-pressed={active}
            title={zone.range}
          >
            <span className="prob-zone__dot" />
            <span className="prob-zone__label">{zone.label}</span>
            <span className="prob-zone__range">{zone.range}</span>
          </button>
        );
      })}
    </div>
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
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollIndicators();
    el.addEventListener('scroll', updateScrollIndicators, { passive: true });
    const ro = new ResizeObserver(updateScrollIndicators);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollIndicators);
      ro.disconnect();
    };
  }, [updateScrollIndicators]);

  return (
    <div className={`inline-filter-bar ${hasFilters ? 'has-active' : ''}`}>
      <span className="filter-label">
        <LucideFilter size={13} />
        Filters
      </span>
      <div className="filter-divider" />
      <div className="filter-scroll-region">
        {canScrollLeft && (
          <div className="scroll-fade scroll-fade--left">
            <LucideChevronLeft size={13} className="scroll-arrow" />
          </div>
        )}
        <div className="filter-scroll-area" ref={scrollRef}>
          <div className="filter-content-wrapper">
            {children}
          </div>
        </div>
        {canScrollRight && (
          <div className="scroll-fade scroll-fade--right">
            <LucideChevronRight size={13} className="scroll-arrow" />
          </div>
        )}
      </div>
      {hasFilters && (
        <>
          <div className="filter-divider" />
          <div className="active-summary">
            <span className="active-badge">{activeCount} active</span>
            <button className="clear-btn" onClick={onClear} title="Clear all filters">
              <LucideX size={13} />
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const DEFAULT_QUICK_FILTERS = ['status', 'pipelineStage', 'department', 'isOnline'];

const InlineFilterBar = ({ query, onQueryChange, onResetQuery, fields = [], quickFilters = DEFAULT_QUICK_FILTERS }) => {
  // ── Find "Hero" fields for quick chips ────────────────────────────────────
  const heroFieldConfigs = useMemo(() => {
    const seen = new Set();
    // Preserve the order defined in quickFilters
    return quickFilters.reduce((acc, name) => {
      const field = fields.find(f => f.name === name);
      if (field && !seen.has(name)) {
        seen.add(name);
        acc.push(field);
      }
      return acc;
    }, []);
  }, [fields, quickFilters]);

  // ── Handlers for dynamic chips ───────────────────────────────────────────
  const getRuleForField = useCallback((fieldName) => {
    return query?.rules?.find(r => r.field === fieldName);
  }, [query]);

  const updateRule = useCallback((field, value) => {
    const rules = [...(query?.rules || [])];
    const idx = rules.findIndex(r => r.field === field.name);

    // value may be null/empty (clear) or a { operator, value } zone object (heat chip)
    if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
      if (idx > -1) rules.splice(idx, 1);
    } else if (typeof value === 'object' && value.operator) {
      const rule = { field: field.name, operator: value.operator, value: value.value };
      if (idx > -1) rules[idx] = rule;
      else rules.push(rule);
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

        if (field.chipType === 'probability-heat') {
          return (
            <React.Fragment key={field.name}>
              <div className="filter-group">
                <span className="group-label">{field.label}</span>
                <ProbabilityHeatChip rule={rule} onSelect={(zone) => updateRule(field, zone)} />
              </div>
              <div className="filter-divider" />
            </React.Fragment>
          );
        }

        const rawValue = rule?.value || '';
        const currentSelected = typeof rawValue === 'string' ? (rawValue ? rawValue.split(',') : []) : (Array.isArray(rawValue) ? rawValue : []);

        return (
          <React.Fragment key={field.name}>
            <div className="filter-group">
              <span className="group-label">{field.label}</span>
              <FilterDropdownChip
                value={Array.isArray(currentSelected) ? currentSelected[0] : currentSelected}
                options={(field.values || field.options)?.map(o =>
                  typeof o === 'string'
                    ? { value: o, label: o }
                    : { value: o.value || o.name, label: o.label || o.value || o.name, dot: o.dot }
                ) || []}
                onSelect={(v) => updateRule(field, v)}
                placeholder={field.chipPlaceholder || `All ${field.label}s`}
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
