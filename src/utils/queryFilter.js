/**
 * Utility functions for filtering data based on query builder rules.
 *
 * Every operator defined in queryConfig.js MUST be handled here —
 * otherwise the filter silently passes through (returns true).
 */

const evaluateRule = (rule, item) => {
  const { field, operator, value } = rule;

  if (!field || !operator) return true; // Invalid rule, pass through

  const fieldValue = item[field];

  // ── Null / NotNull ──────────────────────────────────────────────
  if (operator === 'null') {
    return fieldValue === null || fieldValue === undefined;
  }
  if (operator === 'notNull') {
    return fieldValue !== null && fieldValue !== undefined;
  }

  // Treat empty values as "no-op" so partially filled rules don't exclude everything
  if (value === null || value === undefined || String(value).trim() === '') {
    return true;
  }

  // ── Boolean fields ──────────────────────────────────────────────
  if (typeof fieldValue === 'boolean') {
    const boolRuleValue =
      typeof value === 'boolean'
        ? value
        : String(value).toLowerCase() === 'true';

    switch (operator) {
      case '=':
        return fieldValue === boolRuleValue;
      case '!=':
        return fieldValue !== boolRuleValue;
      default:
        return true;
    }
  }

  // ── Comparable values (string / number) ─────────────────────────
  const itemValueStr = String(fieldValue ?? '').toLowerCase();
  const ruleValueStr = String(value ?? '').toLowerCase();

  switch (operator) {
    // Equality
    case '=':
      return String(fieldValue) === String(value);
    case '!=':
      return String(fieldValue) !== String(value);

    // Numeric comparisons
    case '<':
      return Number(fieldValue) < Number(value);
    case '>':
      return Number(fieldValue) > Number(value);
    case '<=':
      return Number(fieldValue) <= Number(value);
    case '>=':
      return Number(fieldValue) >= Number(value);

    // String operators
    case 'contains':
      return itemValueStr.includes(ruleValueStr);
    case 'doesNotContain':
      return !itemValueStr.includes(ruleValueStr);
    case 'beginsWith':
      return itemValueStr.startsWith(ruleValueStr);
    case 'doesNotBeginWith':
      return !itemValueStr.startsWith(ruleValueStr);
    case 'endsWith':
      return itemValueStr.endsWith(ruleValueStr);
    case 'doesNotEndWith':
      return !itemValueStr.endsWith(ruleValueStr);

    // Range operators (RQB sends "a,b" for between)
    case 'between': {
      const [lo, hi] = String(value).split(',').map(Number);
      const num = Number(fieldValue);
      return num >= lo && num <= hi;
    }
    case 'notBetween': {
      const [lo, hi] = String(value).split(',').map(Number);
      const num = Number(fieldValue);
      return num < lo || num > hi;
    }

    default:
      return true;
  }
};

const evaluateRuleGroup = (ruleGroup, item) => {
  if (!ruleGroup.rules || ruleGroup.rules.length === 0) {
    return true; // Empty group, pass through
  }

  const combinator = ruleGroup.combinator || 'and';
  const results = ruleGroup.rules.map((rule) => {
    if (rule.rules) {
      // Nested group
      return evaluateRuleGroup(rule, item);
    }
    return evaluateRule(rule, item);
  });

  let matches;
  if (combinator === 'and') {
    matches = results.every((r) => r === true);
  } else {
    // 'or' combinator
    matches = results.some((r) => r === true);
  }

  // Handle the "not" toggle — negate the result of this group
  const isNot = ruleGroup.not || false;
  return isNot ? !matches : matches;
};

export const filterData = (data, query) => {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  // If no query or no rules, return all data
  if (!query || !query.rules || query.rules.length === 0) {
    return data;
  }

  // evaluateRuleGroup handles the `not` flag at every level
  return data.filter((item) => evaluateRuleGroup(query, item));
};
