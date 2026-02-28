/**
 * Utility functions for field configuration and validation
 */
export const extractUniqueValues = (data, fieldName) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  const values = data
    .map(item => item[fieldName])
    .filter(value => value !== null && value !== undefined && value !== '')
    .map(value => String(value).trim());

  // Get unique values and sort
  const uniqueValues = [...new Set(values)].sort((a, b) => 
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  return uniqueValues.map(value => ({
    name: value,
    label: value,
    value: value,
  }));
};

export const createFieldValidator = (fieldName, fieldType = 'string') => {
  return (value, context) => {
    // Safely extract operator from context (context might be undefined)
    const operator = context?.operator;
    const fieldData = context?.fieldData;

    // Allow empty values for some operators (like null checks)
    if (operator === 'null' || operator === 'notNull') {
      return true;
    }

    // Check for empty value
    if (value === null || value === undefined || String(value).trim() === '') {
      return { valid: false, message: `${fieldName} cannot be empty` };
    }

    const stringValue = String(value).trim();

    switch (fieldType) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(stringValue)) {
          return { valid: false, message: 'Please enter a valid email address' };
        }
        break;

      case 'number':
        if (isNaN(Number(stringValue))) {
          return { valid: false, message: 'Please enter a valid number' };
        }
        // Additional validation for numeric operators
        if (operator && ['<', '>', '<=', '>='].includes(operator)) {
          const numValue = Number(stringValue);
          if (isNaN(numValue)) {
            return { valid: false, message: 'Please enter a valid number for comparison' };
          }
        }
        break;

      case 'string':
        // Basic string validation
        if (stringValue.length < 1) {
          return { valid: false, message: 'Value cannot be empty' };
        }
        if (stringValue.length > 255) {
          return { valid: false, message: 'Value is too long (max 255 characters)' };
        }
        break;

      default:
        break;
    }

    return true; // Valid
  };
};

export const enhanceFieldWithValues = (data, fieldConfig) => {
  const { name, label, type = 'string', values: customValues } = fieldConfig;

  // Boolean fields use radio buttons with True / False labels.
  // They don't need suggestion values or a custom validator.
  if (type === 'boolean') {
    return {
      ...fieldConfig,
      valueEditorType: 'radio',
      values: [
        { name: 'true', label: 'True' },
        { name: 'false', label: 'False' },
      ],
      defaultValue: 'true',
      operators: [{ name: '=', label: '=' }],
    };
  }

  // Use custom values if provided, otherwise extract from data
  const values = customValues || extractUniqueValues(data, name);

  // Create validator based on field type
  const validator = createFieldValidator(label || name, type);

  return {
    ...fieldConfig,
    values,
    validator,
    valueEditorType: 'text', // Will be handled by custom editor
  };
};
