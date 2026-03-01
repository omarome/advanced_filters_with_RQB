/**
 * Validation rules for string-type fields.
 */

const MAX_LENGTH = 255;

/**
 * @param {string} value  — trimmed input
 * @param {string} fieldName — human-readable name for error messages
 * @returns {{ valid: boolean, message: string } | true}
 */
export const validateString = (value, fieldName) => {
  if (value.length < 1) {
    return { valid: false, message: `${fieldName} cannot be empty` };
  }

  if (value.length > MAX_LENGTH) {
    return { valid: false, message: `Value is too long (max ${MAX_LENGTH} characters)` };
  }

  return true;
};
