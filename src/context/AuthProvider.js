import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, googleProvider } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, signOut, onIdTokenChanged, getIdToken, getIdTokenResult, updateProfile as firebaseUpdateProfile, deleteUser } from 'firebase/auth';
import { deleteAccountApi } from '../services/authApi';
import { getMyWorkspaces, switchActiveWorkspace } from '../services/workspaceApi';

const AuthContext = createContext(null);

// ── Role hierarchy ────────────────────────────────────────────────────────────
// Lower index = less privilege.  Used by hasMinRole() to do ">= comparisons".
const ROLE_HIERARCHY = ['GUEST', 'VIEWER', 'USER', 'SALES_REP', 'MANAGER', 'ADMIN', 'WORKSPACE_OWNER', 'SUPER_ADMIN'];

// Permissions → minimum role required (inclusive upward in hierarchy).
// Keys use SCREAMING_SNAKE_CASE to match the backend Permission enum.
// Dotted aliases are kept for backward compatibility with legacy can() callers.
const PERMISSION_MIN_ROLE = {
  // ── Organizations ───────────────────────────────────────────────────────
  ORGANIZATIONS_READ:   'VIEWER',
  ORGANIZATIONS_CREATE: 'SALES_REP',
  ORGANIZATIONS_UPDATE: 'SALES_REP',
  ORGANIZATIONS_DELETE: 'MANAGER',

  // ── Contacts ────────────────────────────────────────────────────────────
  CONTACTS_READ:   'VIEWER',
  CONTACTS_CREATE: 'SALES_REP',
  CONTACTS_UPDATE: 'SALES_REP',
  CONTACTS_DELETE: 'MANAGER',

  // ── Opportunities ────────────────────────────────────────────────────────
  OPPORTUNITIES_READ:   'VIEWER',
  OPPORTUNITIES_CREATE: 'SALES_REP',
  OPPORTUNITIES_UPDATE: 'SALES_REP',
  OPPORTUNITIES_DELETE: 'ADMIN',

  // ── Activities ───────────────────────────────────────────────────────────
  ACTIVITIES_READ:   'VIEWER',
  ACTIVITIES_CREATE: 'SALES_REP',
  ACTIVITIES_UPDATE: 'SALES_REP',
  ACTIVITIES_DELETE: 'SALES_REP',   // own; Manager can delete team’s (enforced server-side)

  // ── Team ─────────────────────────────────────────────────────────────────
  TEAM_READ:        'GUEST',
  TEAM_READ_ALL:    'MANAGER',
  TEAM_EDIT:        'MANAGER',
  TEAM_ROLE_ASSIGN: 'ADMIN',

  // ── Automations ──────────────────────────────────────────────────────────
  AUTOMATIONS_READ:  'VIEWER',
  AUTOMATIONS_WRITE: 'MANAGER',

  // ── Saved views ──────────────────────────────────────────────────────────
  SAVED_VIEWS_READ:  'VIEWER',
  SAVED_VIEWS_WRITE: 'SALES_REP',

  // ── Variables / field metadata ────────────────────────────────────────────
  VARIABLES_READ: 'VIEWER',

  // ── CRM segmentation query engine ─────────────────────────────────────────
  SEGMENTS_READ: 'VIEWER',

  // ── Notifications ─────────────────────────────────────────────────────────
  NOTIFICATIONS_READ:   'VIEWER',
  NOTIFICATIONS_MANAGE: 'ADMIN',

  // ── Comments ──────────────────────────────────────────────────────────────
  COMMENTS_READ:  'VIEWER',
  COMMENTS_WRITE: 'SALES_REP',

  // ── Attachments ───────────────────────────────────────────────────────────
  ATTACHMENTS_READ:  'VIEWER',
  ATTACHMENTS_WRITE: 'SALES_REP',

  // ── Audit / history ───────────────────────────────────────────────────────
  AUDIT_READ: 'MANAGER',

  // ── Push / FCM ────────────────────────────────────────────────────────────
  PUSH_SEND:       'MANAGER',
  FCM_TOKEN_WRITE: 'VIEWER',

  // ── Global search ─────────────────────────────────────────────────────────
  GLOBAL_SEARCH: 'VIEWER',

  // ── Users (legacy) ────────────────────────────────────────────────────────
  USERS_READ: 'VIEWER',

  // ── Admin ─────────────────────────────────────────────────────────────────
  ADMIN_INVITE: 'ADMIN',
  ADMIN_MANAGE: 'ADMIN',

  // ── Legacy dotted-name aliases (backward compat) ──────────────────────────
  'automations.write': 'MANAGER',
  'users.manage':      'ADMIN',
  'users.invite':      'ADMIN',
  'users.deactivate':  'ADMIN',
  'team.edit':         'MANAGER',
  'deals.delete':      'ADMIN',
  'contacts.delete':   'MANAGER',
  'orgs.delete':       'MANAGER',
  'export.all':        'MANAGER',
  'audit.read':        'MANAGER',
};

function roleIndex(role) {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx === -1 ? 0 : idx;
}

let _accessToken = localStorage.getItem('accessToken') || null;

export function getAccessToken() {
  return _accessToken;
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null);   // string from Firebase custom claims
  const [claims, setClaims]   = useState({});     // full custom claims object
  const [isLoading, setIsLoading] = useState(true);

  // ── Workspace state ───────────────────────────────────────────────────────
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    () => localStorage.getItem('activeWorkspaceId')
      ? Number(localStorage.getItem('activeWorkspaceId'))
      : null
  );
  const [workspaces, setWorkspaces] = useState([]);
  const [isWorkspaceSwitching, setIsWorkspaceSwitching] = useState(false);

  useEffect(() => {
    // onIdTokenChanged fires on login, logout, and every silent token refresh (≈ every 55 min).
    // We use getIdTokenResult() (not just getIdToken()) to also pick up custom claims.
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const tokenResult = await getIdTokenResult(firebaseUser);
        _accessToken = tokenResult.token;
        localStorage.setItem('accessToken', tokenResult.token);

        // Custom claims set by FirebaseClaimsService (role, teamId, activeWorkspaceId, etc.)
        const userRole = tokenResult.claims.role || 'SALES_REP';
        setRole(userRole);
        setClaims(tokenResult.claims);
        setUser(firebaseUser);

        // Persist activeWorkspaceId from claims to localStorage
        const wsIdFromClaims = tokenResult.claims.activeWorkspaceId;
        if (wsIdFromClaims) {
          const wsId = Number(wsIdFromClaims);
          setActiveWorkspaceId(wsId);
          localStorage.setItem('activeWorkspaceId', String(wsId));
        }

        // Load workspace list (non-blocking)
        getMyWorkspaces().then(setWorkspaces).catch(() => {});
      } else {
        _accessToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('activeWorkspaceId');
        setUser(null);
        setRole(null);
        setClaims({});
        setActiveWorkspaceId(null);
        setWorkspaces([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
        await firebaseUpdateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return userCredential.user;
  }, []);

  const performLogout = useCallback(async () => {
    await signOut(auth);
    _accessToken = null;
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (displayName) => {
     // Optional: Call your backend to update it
  }, []);

  const deleteAccount = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Not authenticated');

    // Get a fresh token — deletion requires a recent sign-in
    const token = await getIdToken(firebaseUser, true);
    _accessToken = token;

    // 1. Delete from backend (clears DB records, refresh tokens, etc.)
    await deleteAccountApi(token);

    // 2. Delete from Firebase Auth
    await deleteUser(firebaseUser);

    // 3. Clear local state
    _accessToken = null;
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const handleOAuthSuccess = useCallback(async () => {}, []);

  const forceTokenRefresh = useCallback(async () => {
    if (auth.currentUser) {
      const tokenResult = await getIdTokenResult(auth.currentUser, /* forceRefresh */ true);
      _accessToken = tokenResult.token;
      localStorage.setItem('accessToken', tokenResult.token);
      // Re-read claims after forced refresh (e.g. after an admin role change or workspace switch)
      const newRole = tokenResult.claims.role || 'SALES_REP';
      setRole(newRole);
      setClaims(tokenResult.claims);

      // Also update workspace from refreshed claims
      const wsIdFromClaims = tokenResult.claims.activeWorkspaceId;
      if (wsIdFromClaims) {
        const wsId = Number(wsIdFromClaims);
        setActiveWorkspaceId(wsId);
        localStorage.setItem('activeWorkspaceId', String(wsId));
      }
    }
  }, []);

  /**
   * Switches the user's active workspace:
   *  1. Calls POST /api/me/active-workspace (updates Firebase claims)
   *  2. Force-refreshes the ID token so the new activeWorkspaceId claim is picked up
   *  3. Updates localStorage and React state immediately for instant UI response
   */
  const switchWorkspace = useCallback(async (workspaceId) => {
    if (workspaceId === activeWorkspaceId) return;
    setIsWorkspaceSwitching(true);
    try {
      await switchActiveWorkspace(workspaceId);
      localStorage.setItem('activeWorkspaceId', String(workspaceId));
      setActiveWorkspaceId(workspaceId);
      // Force-refresh token so the new claim propagates backend-side too
      await forceTokenRefresh();
    } finally {
      setIsWorkspaceSwitching(false);
    }
  }, [activeWorkspaceId, forceTokenRefresh]);

  // ── Role & permission helpers exposed on context ──────────────────────────

  /** True when the user's role exactly matches one of the provided roles. */
  const hasRole = useCallback((...roles) => {
    return role != null && roles.includes(role);
  }, [role]);

  /** True when the user's role is >= the required role in the hierarchy. */
  const hasMinRole = useCallback((minRole) => {
    return roleIndex(role) >= roleIndex(minRole);
  }, [role]);

  /** True when the user has the permission based on the permission → min-role table. */
  const can = useCallback((permission) => {
    const required = PERMISSION_MIN_ROLE[permission];
    if (!required) return true;   // unknown permission = not restricted
    return hasMinRole(required);
  }, [hasMinRole]);

  const value = {
    user,
    role,                         // e.g. 'ADMIN' | 'MANAGER' | 'SALES_REP' …
    claims,                       // full claims object for advanced checks
    isAuthenticated: !!user,
    isLoading,
    // Auth actions
    login,
    loginWithGoogle,
    register,
    logout: performLogout,
    updateProfile,
    deleteAccount,
    handleOAuthSuccess,
    forceTokenRefresh,
    setUser,
    // Role helpers
    hasRole,
    hasMinRole,
    can,
    isAdmin:   () => hasMinRole('ADMIN'),
    isManager: () => hasMinRole('MANAGER'),
    // Workspace
    activeWorkspaceId,
    workspaces,
    switchWorkspace,
    isWorkspaceSwitching,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthProvider;
