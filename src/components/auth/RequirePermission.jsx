import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import AccessDenied from './AccessDenied';
import { CircularProgress, Box } from '@mui/material';

// Maps permission constants → the minimum role label to show in AccessDenied.
// This is purely cosmetic: "requires Manager role" reads better than "requires AUTOMATIONS_WRITE".
const PERM_TO_MIN_ROLE = {
  ORGANIZATIONS_READ:    'SALES_REP',
  ORGANIZATIONS_CREATE:  'SALES_REP',
  ORGANIZATIONS_UPDATE:  'SALES_REP',
  ORGANIZATIONS_DELETE:  'MANAGER',
  CONTACTS_READ:         'SALES_REP',
  CONTACTS_CREATE:       'SALES_REP',
  CONTACTS_UPDATE:       'SALES_REP',
  CONTACTS_DELETE:       'MANAGER',
  OPPORTUNITIES_READ:    'SALES_REP',
  OPPORTUNITIES_CREATE:  'SALES_REP',
  OPPORTUNITIES_UPDATE:  'SALES_REP',
  OPPORTUNITIES_DELETE:  'ADMIN',
  ACTIVITIES_READ:       'SALES_REP',
  TEAM_READ:             'GUEST',
  TEAM_READ_ALL:         'MANAGER',
  TEAM_EDIT:             'MANAGER',
  TEAM_ROLE_ASSIGN:      'ADMIN',
  AUTOMATIONS_READ:      'SALES_REP',
  AUTOMATIONS_WRITE:     'MANAGER',
  SAVED_VIEWS_READ:      'SALES_REP',
  SAVED_VIEWS_WRITE:     'SALES_REP',
  VARIABLES_READ:        'SALES_REP',
  SEGMENTS_READ:         'SALES_REP',
  AUDIT_READ:            'MANAGER',
  ADMIN_INVITE:          'ADMIN',
  ADMIN_MANAGE:          'ADMIN',
};

/**
 * Route-level permission guard.
 *
 * Usage:
 *   <Route element={<RequirePermission perm="AUTOMATIONS_WRITE" returnTo="/team" />}>
 *     <Route path="/automations" element={<AutomationsPage />} />
 *   </Route>
 *
 * Shows a user-friendly AccessDenied page with the minimum role required
 * rather than the raw permission string.
 */
export default function RequirePermission({ perm, returnTo }) {
  const { can, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: '#7c69ef' }} size={36} />
      </Box>
    );
  }

  if (!can(perm)) {
    const minRole = PERM_TO_MIN_ROLE[perm] ?? 'ADMIN';
    return <AccessDenied requiredRole={minRole} returnTo={returnTo} />;
  }

  return <Outlet />;
}
