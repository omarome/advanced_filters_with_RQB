/**
 * Utility functions for filtering data based on query builder rules
 */
const evaluateRule = (rule, item) => {
  const { field, operator, value } = rule;
  
  if (!field || !operator) return true; // Invalid rule, pass through

   // Treat empty values as "no-op" so partially filled rules don't exclude everything
  if (value === null || value === undefined || String(value).trim() === '') {
    return true;
  }
  
  const fieldValue = item[field];
  const ruleValue = value;

  // Handle boolean fields (checkbox value comes as true/false or "true"/"false")
  if (typeof fieldValue === 'boolean') {
    const boolRuleValue = typeof ruleValue === 'boolean'
      ? ruleValue
      : String(ruleValue).toLowerCase() === 'true';

    switch (operator) {
      case '=':
        return fieldValue === boolRuleValue;
      case '!=':
        return fieldValue !== boolRuleValue;
      default:
        return true;
    }
  }

  // Convert to string for comparison if needed
  const itemValueStr = String(fieldValue || '').toLowerCase();
  const ruleValueStr = String(ruleValue || '').toLowerCase();
  
  switch (operator) {
    case '=':
      return String(fieldValue) === String(ruleValue);
    case '!=':
      return String(fieldValue) !== String(ruleValue);
    case '<':
      return Number(fieldValue) < Number(ruleValue);
    case '>':
      return Number(fieldValue) > Number(ruleValue);
    case '<=':
      return Number(fieldValue) <= Number(ruleValue);
    case '>=':
      return Number(fieldValue) >= Number(ruleValue);
    case 'contains':
      return itemValueStr.includes(ruleValueStr);
    case 'beginsWith':
      return itemValueStr.startsWith(ruleValueStr);
    case 'endsWith':
      return itemValueStr.endsWith(ruleValueStr);
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
      // This is a nested group
      return evaluateRuleGroup(rule, item);
    } else {
      // This is a rule
      return evaluateRule(rule, item);
    }
  });
  
  if (combinator === 'and') {
    return results.every((result) => result === true);
  } else {
    // 'or' combinator
    return results.some((result) => result === true);
  }
};

export const filterData = (data, query) => {
  if (!data || !Array.isArray(data)) {
    return [];
  }
  
  // If no query or no rules, return all data
  if (!query || !query.rules || query.rules.length === 0) {
    return data;
  }
  
  // Filter data based on query
  return data.filter((item) => {
    // Handle 'not' combinator
    const isNot = query.not || false;
    const matches = evaluateRuleGroup(query, item);
    return isNot ? !matches : matches;
  });
};
