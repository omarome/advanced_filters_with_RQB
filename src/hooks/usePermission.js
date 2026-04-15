import { useAuth } from '../context/AuthProvider';

/**
 * Returns true when the current user holds the given permission.
 *
 * Uses the same `can()` helper defined in AuthProvider, which resolves
 * permissions via the PERMISSION_MIN_ROLE → role-hierarchy table.
 *
 * Usage:
 *   const canDelete = usePermission('OPPORTUNITIES_DELETE');
 *   {canDelete && <DeleteButton />}
 *
 * @param {string} permissionName  – SCREAMING_SNAKE_CASE key matching the
 *                                   backend Permission enum (e.g. 'OPPORTUNITIES_DELETE')
 * @returns {boolean}
 */
export function usePermission(permissionName) {
  const { can } = useAuth();
  return can(permissionName);
}
