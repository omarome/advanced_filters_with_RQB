/**
 * Field enhancement utilities.
 *
 * This module is responsible for two things:
 *   1. Extracting autocomplete suggestion values from API data
 *   2. Wiring the correct validator onto each field config
 *
 * Validation logic itself lives in `./validators/` — this file only
 * composes those pieces onto field configs.
 */
import { createFieldValidator } from './validators';

// ---------------------------------------------------------------------------
// Autocomplete suggestions
// ---------------------------------------------------------------------------

/**
 * Extracts sorted, unique display values for a given field from the dataset.
 * Used to populate the autocomplete suggestion list.
 */
export const extractUniqueValues = (data, fieldName) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  const values = data
    .map((item) => item[fieldName])
    .filter((v) => v !== null && v !== undefined && v !== '')
    .map((v) => String(v).trim());

  const unique = [...new Set(values)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  return unique.map((value) => ({ name: value, label: value, value }));
};

// ---------------------------------------------------------------------------
// Field enhancement
// ---------------------------------------------------------------------------

/**
 * Enhances a field config with:
 *   • suggestion values extracted from the API data
 *   • a validator function based on the field type
 *
 * Fields with a non-text editor type (radio, checkbox, etc.) still receive
 * a validator but skip autocomplete-value extraction.
 */
export const enhanceFieldWithValues = (data, fieldConfig) => {
  const {
    name,
    label,
    type = 'string',
    values: existingValues,
    valueEditorType,
    allowNegative,
  } = fieldConfig;

  // Build validator (applies to ALL field types)
  const validator = createFieldValidator(label || name, type, { allowNegative });

  // Non-text editors (radio, checkbox, select, …) are already fully
  // configured — just attach the validator.
  if (valueEditorType && valueEditorType !== 'text') {
    return { ...fieldConfig, validator };
  }

  // Text-based fields get autocomplete suggestions + validator
  const values = existingValues || extractUniqueValues(data, name);

  return {
    ...fieldConfig,
    values,
    validator,
    valueEditorType: 'text',
  };
};
