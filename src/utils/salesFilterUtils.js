/**
 * salesFilterUtils.js
 *
 * Shared constants and helpers for context-aware client-side filtering
 * across the Sales pages (Organizations, Contacts, Pipeline).
 *
 * Architecture note:
 * These utilities build a { combinator, rules } query object compatible
 * with the existing filterData() utility. When backend filter params are
 * ready, delete the useMemo that calls buildSalesQuery() in each page and
 * pass localFilters directly as fetch params — no other changes needed.
 */

// ── Pipeline stages ──────────────────────────────────────────────────────────
export const PIPELINE_STAGES = [
  { value: 'PROSPECTING',   label: 'Prospecting',   color: '#6366f1' },
  { value: 'QUALIFICATION', label: 'Qualification', color: '#8b5cf6' },
  { value: 'PROPOSAL',      label: 'Proposal',      color: '#f59e0b' },
  { value: 'NEGOTIATION',   label: 'Negotiation',   color: '#ef4444' },
  { value: 'CLOSED_WON',    label: 'Won',           color: '#10b981' },
  { value: 'CLOSED_LOST',   label: 'Lost',          color: '#6b7280' },
];

// ── Lifecycle stages for contacts ────────────────────────────────────────────
export const LIFECYCLE_STAGES = [
  { value: 'LEAD',      label: 'Lead',      color: '#6366f1' },
  { value: 'PROSPECT',  label: 'Prospect',  color: '#f59e0b' },
  { value: 'CUSTOMER',  label: 'Customer',  color: '#10b981' },
  { value: 'CHURNED',   label: 'Churned',   color: '#6b7280' },
];

// ── Employee count buckets ───────────────────────────────────────────────────
export const EMPLOYEE_BUCKETS = [
  { label: '1–50',    min: 1,    max: 50 },
  { label: '51–200',  min: 51,   max: 200 },
  { label: '201–1K',  min: 201,  max: 1000 },
  { label: '1K+',     min: 1001, max: Infinity },
];

// ── Deal value buckets ───────────────────────────────────────────────────────
export const DEAL_VALUE_BUCKETS = [
  { label: '<$10K',      min: 0,      max: 9999 },
  { label: '$10K–50K',   min: 10000,  max: 50000 },
  { label: '$50K–200K',  min: 50001,  max: 200000 },
  { label: '$200K+',     min: 200001, max: Infinity },
];

// ── Initial filter states ────────────────────────────────────────────────────
export const INITIAL_ORG_FILTERS = {
  industry:       '',
  country:        '',
  employeeBucket: null,   // one of EMPLOYEE_BUCKETS or null
};

export const INITIAL_CONTACT_FILTERS = {
  stages:           [],   // array of LIFECYCLE_STAGES values
  organizationName: '',
};

export const INITIAL_PIPELINE_FILTERS = {
  stages:          [],    // array of PIPELINE_STAGES values
  owner:           '',
  dealValueBucket: null,  // one of DEAL_VALUE_BUCKETS or null
};

// ── Derive dynamic dropdown options from the fetched dataset ─────────────────
export function deriveFilterOptions(data, variant) {
  if (!Array.isArray(data) || !data.length) return {};
  const unique = arr => [...new Set(arr.filter(Boolean))].sort();

  switch (variant) {
    case 'organizations':
      return {
        industries: unique(data.map(d => d.industry)),
        countries:  unique(data.map(d => d.country)),
      };
    case 'contacts':
      return {
        organizationNames: unique(data.map(d => d.organizationName)),
      };
    case 'pipeline':
      return {
        owners: unique(data.map(d => d.assignedToName)),
      };
    default:
      return {};
  }
}

// ── Convert flat filter state → filterData()-compatible query ────────────────
export function buildSalesQuery(filters, variant) {
  const rules = [];

  if (variant === 'organizations') {
    if (filters.industry) {
      rules.push({ field: 'industry', operator: '=', value: filters.industry });
    }
    if (filters.country) {
      rules.push({ field: 'country', operator: '=', value: filters.country });
    }
    if (filters.employeeBucket) {
      const { min, max } = filters.employeeBucket;
      if (max === Infinity) {
        rules.push({ field: 'employeeCount', operator: '>=', value: String(min) });
      } else {
        rules.push({ field: 'employeeCount', operator: 'between', value: `${min},${max}` });
      }
    }
  }

  if (variant === 'contacts') {
    if (filters.stages?.length > 0) {
      rules.push({ field: 'lifecycleStage', operator: 'in', value: filters.stages.join(',') });
    }
    if (filters.organizationName) {
      rules.push({ field: 'organizationName', operator: '=', value: filters.organizationName });
    }
  }

  if (variant === 'pipeline') {
    if (filters.stages?.length > 0) {
      rules.push({ field: 'stage', operator: 'in', value: filters.stages.join(',') });
    }
    if (filters.owner) {
      rules.push({ field: 'assignedToName', operator: '=', value: filters.owner });
    }
    if (filters.dealValueBucket) {
      const { min, max } = filters.dealValueBucket;
      if (max === Infinity) {
        rules.push({ field: 'amount', operator: '>=', value: String(min) });
      } else {
        rules.push({ field: 'amount', operator: 'between', value: `${min},${max}` });
      }
    }
  }

  return { combinator: 'and', rules };
}

// ── Count active filters (for the badge) ────────────────────────────────────
export function countSalesFilters(filters, variant) {
  if (variant === 'organizations') {
    return (filters.industry ? 1 : 0)
      + (filters.country ? 1 : 0)
      + (filters.employeeBucket ? 1 : 0);
  }
  if (variant === 'contacts') {
    return (filters.stages?.length > 0 ? 1 : 0)
      + (filters.organizationName ? 1 : 0);
  }
  if (variant === 'pipeline') {
    return (filters.stages?.length > 0 ? 1 : 0)
      + (filters.owner ? 1 : 0)
      + (filters.dealValueBucket ? 1 : 0);
  }
  return 0;
}
