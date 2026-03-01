import { useMemo } from 'react';

/**
 * Parses the `validation` prop that React Query Builder already computed
 * by calling `field.validator(rule)` internally.
 *
 * Instead of re-running the validator ourselves, we simply normalise
 * RQB's result into a consistent `{ isValid, error }` shape.
 *
 * @param {boolean|Object|undefined} validation — `props.validation` from RQB
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const useInputValidation = (validation) => {
  return useMemo(() => {
    // No validator assigned or not yet evaluated
    if (validation === undefined || validation === null) {
      return { isValid: true, error: null };
    }

    // Boolean result (field.validator returned true / false)
    if (validation === true) return { isValid: true, error: null };
    if (validation === false) return { isValid: false, error: null };

    // Object result { valid, message } (our createFieldValidator pattern)
    if (typeof validation === 'object') {
      return {
        isValid: validation.valid !== false,
        error: validation.message || null,
      };
    }

    return { isValid: true, error: null };
  }, [validation]);
};
