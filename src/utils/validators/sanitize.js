/**
 * Input sanitization — catches SQL injection patterns and dangerous characters.
 *
 * This is a cross-cutting concern that applies to ALL field types.
 * Kept separate from type-specific validation so it can be reused or
 * swapped independently.
 */

/** Characters that could be used for SQL injection or command chaining. */
const DANGEROUS_CHARS = /[;'"\\`]/;

/** Common SQL injection patterns (word-boundary-aware to avoid false positives). */
const SQL_PATTERNS = [
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|EXECUTE)\b/i,
  /\b(UNION\s+(ALL\s+)?SELECT)\b/i,
  /\b(OR|AND)\s+[\d'"].*=/i,
  /--/,
  /\/\*/,
];

/**
 * Returns an error message if the value contains dangerous input.
 * Returns `null` when the value is clean.
 *
 * @param {string} value — trimmed string to check
 * @returns {string|null}
 */
export const detectDangerousInput = (value) => {
  if (DANGEROUS_CHARS.test(value)) {
    const matched = value.match(DANGEROUS_CHARS);
    return `Character "${matched[0]}" is not allowed`;
  }

  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(value)) {
      return 'Value contains disallowed SQL keywords or patterns';
    }
  }

  return null;
};
