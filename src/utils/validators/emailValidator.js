/**
 * Validation rules for email-type fields.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {string} value — trimmed input
 * @returns {{ valid: boolean, message: string } | true}
 */
export const validateEmail = (value) => {
  if (!EMAIL_REGEX.test(value)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }

  return true;
};
