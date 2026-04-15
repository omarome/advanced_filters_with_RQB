import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import AccessDenied from './AccessDenied';
import { CircularProgress, Box } from '@mui/material';

// Hierarchy used to resolve "minimum role" checks.
// Must stay in sync with AuthProvider's ROLE_HIERARCHY.
const ROLE_HIERARCHY = ['GUEST', 'VIEWER', 'USER', 'SALES_REP', 'MANAGER', 'ADMIN', 'WORKSPACE_OWNER', 'SUPER_ADMIN'];

function roleIndex(role) {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx === -1 ? 0 : idx;
}

/**
 * Route-level role guard.
 *
 * Use as a layout route in your <Routes> tree:
 *
 *   <Route element={<RequireRole minRole="MANAGER" />}>
 *     <Route path="/automations" element={<AutomationsPage />} />
 *   </Route>
 *
 * Props:
 *   minRole     — minimum role required (hierarchy-based, inclusive)
 *   roles       — explicit allowlist of role strings (alternative to minRole)
 *   returnTo    — path shown on the AccessDenied "Go back" button
 *
 * Behaviour:
 *   • Still loading → spinner (never flash the denied screen prematurely)
 *   • Role not yet known (claims not in token yet) → treat as SALES_REP
 *   • Unauthorised → renders <AccessDenied> inline (not a redirect, user can see why)
 *   • Authorised → renders child routes via <Outlet>
 */
export default function RequireRole({ minRole, roles, returnTo }) {
  const { role, isLoading } = useAuth();

  // Never flash the denied screen while Firebase is still resolving the user
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: '#7c69ef' }} size={36} />
      </Box>
    );
  }

  const effectiveRole = role ?? 'SALES_REP';

  const isAllowed = roles
    ? roles.includes(effectiveRole)
    : roleIndex(effectiveRole) >= roleIndex(minRole ?? 'ADMIN');

  if (!isAllowed) {
    return <AccessDenied requiredRole={minRole ?? (roles ? roles[0] : 'ADMIN')} returnTo={returnTo} />;
  }

  return <Outlet />;
}
