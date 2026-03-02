/**
 * Validator barrel — re-exports individual validators and provides
 * the `createFieldValidator` composer that builds a full validation
 * pipeline for a given field type.
 *
 * IMPORTANT: The returned validator follows the React Query Builder
 * convention — it receives the **full rule** object, not just the value:
 *
 *   validator(rule: RuleType) => true | { valid: false, message: string }
 *
 * This means RQB can call it internally and expose the result via
 * `props.validation` on the value editor — no need to re-run it.
 */
import { detectDangerousInput } from './sanitize';
import { validateString } from './stringValidator';
import { validateNumber } from './numberValidator';
import { validateEmail } from './emailValidator';

export { detectDangerousInput, validateString, validateNumber, validateEmail };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const typeValidators = {
  string: (value, fieldName) => validateString(value, fieldName),
  email: (value, fieldName) => validateEmail(value),
  number: (value, fieldName, opts) => validateNumber(value, fieldName, opts),
};

/** Operators that require no user-supplied value. */
const NO_VALUE_OPERATORS = new Set(['null', 'notNull']);

/** Operators whose value is a pair (lo, hi). RQB may send a comma string or an array. */
const MULTI_VALUE_OPERATORS = new Set(['between', 'notBetween']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalises a rule's value into an array of trimmed string parts.
 *
 * For multi-value operators (`between`, `notBetween`) RQB may deliver
 * a comma-separated string (`"10,20"`) *or* a real array (`[10, 20]`)
 * depending on the `listsAsArrays` prop.  This helper handles both.
 *
 * @returns {string[]} one element for single-value ops, two for multi-value
 */
const normaliseValueParts = (value, isMultiValue) => {
  if (!isMultiValue) return [String(value).trim()];
  return Array.isArray(value)
    ? value.map((v) => String(v).trim())
    : String(value).split(',').map((v) => v.trim());
};

// ---------------------------------------------------------------------------
// Main factory
// ---------------------------------------------------------------------------

/**
 * Creates a validator function for a field.
 *
 * The returned validator receives the **full rule** (RQB convention):
 *
 *   validator({ field, operator, value, ... }) => true | { valid: false, message: string }
 *
 * Pipeline:
 *   1. Skip validation for null/notNull operators
 *   2. Reject empty values
 *   3. Sanitize (SQL-injection check) — applies to ALL types
 *   4. Type-specific validation
 *
 * @param {string}  fieldName               — human-readable name (for error messages)
 * @param {string}  [fieldType='string']    — 'string' | 'number' | 'email' | 'boolean'
 * @param {Object}  [options]
 * @param {boolean} [options.allowNegative] — passed through to number validator
 * @returns {(rule: RuleType) => true | { valid: false, message: string }}
 */
export const createFieldValidator = (fieldName, fieldType = 'string', options = {}) => {
  const typeValidator = typeValidators[fieldType];

  return (rule) => {
    const { value, operator } = rule ?? {};

    // 1. Operators that don't require a value
    if (NO_VALUE_OPERATORS.has(operator)) {
      return true;
    }

    // 2. Empty check (before normalisation — catches null/undefined/blank)
    if (value === null || value === undefined || String(value).trim() === '') {
      return { valid: false, message: `${fieldName} cannot be empty` };
    }

    // 3. Normalise into parts (single-value → 1 element, between → 2)
    const isMultiValue = MULTI_VALUE_OPERATORS.has(operator);
    const parts = normaliseValueParts(value, isMultiValue);

    if (isMultiValue && parts.length !== 2) {
      return { valid: false, message: `${fieldName} requires exactly two values` };
    }

    for (const p of parts) {
      if (p === '') {
        return { valid: false, message: `${fieldName} cannot be empty` };
      }

      // 4. Sanitization (cross-cutting — all types)
      const dangerousMsg = detectDangerousInput(p);
      if (dangerousMsg) {
        return { valid: false, message: dangerousMsg };
      }

      // 5. Type-specific validation
      if (typeValidator) {
        const result = typeValidator(p, fieldName, options);
        if (result !== true) return result;
      }
    }

    return true;
  };
};
