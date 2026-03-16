/**
 * Utility functions for query operations
 */
export const countRules = (query) => {
  if (!query || !query.rules) return 0;

  let count = 0;
  const traverse = (rule) => {
    if (rule.rules) {
      // This is a rule group, traverse its children
      rule.rules.forEach(traverse);
    } else if (rule.field && rule.operator) {
      // Only count if it's a null-check OR has a non-empty value
      const isNullOperator = rule.operator === 'null' || rule.operator === 'notNull';
      const hasValue = rule.value !== undefined && 
                       rule.value !== null && 
                       String(rule.value).trim() !== '';
      
      if (isNullOperator || hasValue) {
        count++;
      }
    }
  };

  traverse(query);
  return count;
};

export const formatQueryString = (query) => {
  if (!query || !query.rules || query.rules.length === 0) {
    return 'No filters applied';
  }

  // This is a simplified formatter - you can enhance it based on your needs
  return JSON.stringify(query, null, 2);
};
