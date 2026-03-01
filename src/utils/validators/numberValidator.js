/**
 * Validation rules for number-type fields.
 *
 * Supports an `allowNegative` flag so unsigned PLC types (UDINT, UINT)
 * correctly reject negative values and decimals.
 */

/**
 * @param {string}  value         — trimmed input
 * @param {string}  fieldName     — human-readable name for error messages
 * @param {Object}  [options]
 * @param {boolean} [options.allowNegative=true]
 * @returns {{ valid: boolean, message: string } | true}
 */
export const validateNumber = (value, fieldName, { allowNegative = true } = {}) => {
  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, message: 'Please enter a valid number' };
  }

  if (!allowNegative && num < 0) {
    return { valid: false, message: `${fieldName} must be a non-negative number` };
  }

  // Unsigned integer types (UDINT / UINT) must be whole numbers
  if (!allowNegative && !Number.isInteger(num)) {
    return { valid: false, message: `${fieldName} must be a whole number` };
  }

  return true;
};
