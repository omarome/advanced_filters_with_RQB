import { useAuth } from '../context/AuthProvider';

/**
 * Convenience hook for role and permission checks in components.
 *
 * Usage:
 *   const { role, can, hasMinRole, isAdmin } = useRole();
 *
 *   // Guard a button
 *   {can('automations.write') && <button>New Rule</button>}
 *
 *   // Guard a route (see RequireRole for route-level guarding)
 *   {hasMinRole('MANAGER') && <ManagerPanel />}
 */
export function useRole() {
  const { role, claims, hasRole, hasMinRole, can, isAdmin, isManager } = useAuth();

  return {
    role,
    claims,
    hasRole,
    hasMinRole,
    can,
    isAdmin,
    isManager,
    isSalesRep: () => hasMinRole('SALES_REP'),
    isViewer:   () => hasMinRole('VIEWER'),
  };
}
