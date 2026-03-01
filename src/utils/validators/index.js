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
export { detectDangerousInput } from './sanitize';
export { validateString } from './stringValidator';
export { validateNumber } from './numberValidator';
export { validateEmail } from './emailValidator';

import { detectDangerousInput } from './sanitize';
import { validateString } from './stringValidator';
import { validateNumber } from './numberValidator';
import { validateEmail } from './emailValidator';

/**
 * Type → validator mapping.
 * Each entry is a function: (value, fieldName, options) => result
 */
const typeValidators = {
  string: (value, fieldName) => validateString(value, fieldName),
  email: (value, fieldName) => validateEmail(value),
  number: (value, fieldName, opts) => validateNumber(value, fieldName, opts),
};

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
  return (rule) => {
    const value = rule?.value;
    const operator = rule?.operator;

    // 1. Operators that don't require a value
    if (operator === 'null' || operator === 'notNull') {
      return true;
    }

    // 2. Empty check
    if (value === null || value === undefined || String(value).trim() === '') {
      return { valid: false, message: `${fieldName} cannot be empty` };
    }

    const trimmed = String(value).trim();

    // 3. Sanitization (cross-cutting — all types)
    const dangerousMsg = detectDangerousInput(trimmed);
    if (dangerousMsg) {
      return { valid: false, message: dangerousMsg };
    }

    // 4. Type-specific validation
    const typeValidator = typeValidators[fieldType];
    if (typeValidator) {
      return typeValidator(trimmed, fieldName, options);
    }

    return true;
  };
};
