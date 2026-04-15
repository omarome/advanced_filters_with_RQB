import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { LucideShieldX, LucideArrowLeft, LucideUser } from 'lucide-react';
import { useThemeControl } from '../../context/ThemeContext';

const ROLE_LABELS = {
  SUPER_ADMIN:     'Super Admin',
  WORKSPACE_OWNER: 'Workspace Owner',
  ADMIN:           'Admin',
  MANAGER:         'Manager',
  SALES_REP:       'Sales Rep',
  USER:            'User',
  VIEWER:          'Viewer',
  GUEST:           'Guest',
};

/**
 * Full-area "Access Denied" screen shown when a user navigates to a route
 * they don't have permission to access.
 *
 * Props:
 *   requiredRole  — the minimum role needed (shown as a hint)
 *   returnTo      — path for the "Go back" button (defaults to browser history)
 */
export default function AccessDenied({ requiredRole, returnTo }) {
  const navigate    = useNavigate();
  const { role, user } = useAuth();
  const { mode }    = useThemeControl();

  const isDark = mode === 'dark';

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight:      '70vh',
        padding:        '40px 24px',
        textAlign:      'center',
        gap:            '16px',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width:           80,
          height:          80,
          borderRadius:    '50%',
          background:      isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2',
          border:          `2px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fecaca'}`,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          marginBottom:    '8px',
        }}
      >
        <LucideShieldX size={38} color="#ef4444" strokeWidth={1.5} />
      </div>

      {/* Heading */}
      <h1
        style={{
          fontSize:   '1.75rem',
          fontWeight: 700,
          margin:     0,
          color:      isDark ? '#f1f5f9' : '#0f172a',
        }}
      >
        Access restricted
      </h1>

      {/* Sub-message */}
      <p
        style={{
          fontSize:  '1rem',
          color:     isDark ? '#94a3b8' : '#64748b',
          maxWidth:  420,
          lineHeight: 1.6,
          margin:    0,
        }}
      >
        You don't have permission to view this page.
        {requiredRole && (
          <>
            {' '}This area requires the{' '}
            <strong style={{ color: isDark ? '#c4b5fd' : '#7c3aed' }}>
              {ROLE_LABELS[requiredRole] ?? requiredRole}
            </strong>{' '}
            role or above.
          </>
        )}
      </p>

      {/* Current role pill */}
      {role && (
        <div
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           '6px',
            padding:       '6px 14px',
            borderRadius:  '999px',
            background:    isDark ? 'rgba(148,163,184,0.1)' : '#f1f5f9',
            border:        `1px solid ${isDark ? 'rgba(148,163,184,0.2)' : '#e2e8f0'}`,
            fontSize:      '0.85rem',
            color:         isDark ? '#94a3b8' : '#64748b',
          }}
        >
          <LucideUser size={13} />
          Signed in as <strong style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
            {user?.displayName || user?.email}
          </strong>
          &nbsp;·&nbsp;
          <strong style={{ color: isDark ? '#c4b5fd' : '#7c3aed' }}>
            {ROLE_LABELS[role] ?? role}
          </strong>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={handleBack}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '6px',
            padding:        '10px 22px',
            borderRadius:   '8px',
            border:         `1px solid ${isDark ? 'rgba(148,163,184,0.25)' : '#e2e8f0'}`,
            background:     'transparent',
            color:          isDark ? '#cbd5e1' : '#475569',
            fontSize:       '0.9rem',
            fontWeight:     500,
            cursor:         'pointer',
            transition:     'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LucideArrowLeft size={15} />
          Go back
        </button>

        <button
          onClick={() => navigate('/team')}
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '10px 22px',
            borderRadius: '8px',
            border:       'none',
            background:   'linear-gradient(135deg, #7c69ef 0%, #6c5ce7 100%)',
            color:        '#fff',
            fontSize:     '0.9rem',
            fontWeight:   500,
            cursor:       'pointer',
            boxShadow:    '0 2px 12px rgba(124,105,239,0.3)',
          }}
        >
          Go to Dashboard
        </button>
      </div>

      {/* Helper text */}
      <p
        style={{
          fontSize:  '0.8rem',
          color:     isDark ? '#64748b' : '#94a3b8',
          marginTop: '4px',
        }}
      >
        Contact your administrator if you believe this is a mistake.
      </p>
    </div>
  );
}
