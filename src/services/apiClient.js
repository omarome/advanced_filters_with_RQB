/**
 * Shared API client for HumintFlow.
 *
 * Automatically injects:
 *  - Authorization: Bearer <token>      (from Firebase current user)
 *  - X-Workspace-Id: <workspaceId>     (from localStorage fallback / AuthContext)
 *
 * All service files import `apiFetch` from here instead of calling `fetch()` directly.
 * This is the single place to add headers, retry logic, or error normalisation.
 */

import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Returns the current Firebase ID token (force-refreshes if stale).
 * Falls back to the legacy access token stored in localStorage.
 */
async function getBearerToken() {
  try {
    const auth = getAuth();
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(false);
    }
  } catch {
    // Firebase not available — fall through to legacy token
  }
  return localStorage.getItem('accessToken') || null;
}

/**
 * Returns the active workspace ID from localStorage.
 * Set by AuthProvider whenever the user switches workspaces.
 */
function getActiveWorkspaceId() {
  return localStorage.getItem('activeWorkspaceId') || null;
}

/**
 * Drop-in replacement for fetch() that auto-injects auth and workspace headers.
 *
 * @param {string} path          API path (relative to /api), e.g. '/contacts'
 * @param {RequestInit} options  Standard fetch options (method, body, etc.)
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, options = {}) {
  const token       = await getBearerToken();
  const workspaceId = getActiveWorkspaceId();

  const headers = {
    'Content-Type': 'application/json',
    ...(token       ? { Authorization: `Bearer ${token}` } : {}),
    ...(workspaceId ? { 'X-Workspace-Id': workspaceId }    : {}),
    ...(options.headers || {}),
  };

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return fetch(url, { ...options, headers });
}

/**
 * Convenience wrapper: apiFetch + throw on non-2xx + parse JSON.
 */
export async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `API error ${res.status}`);
  }
  return res.json();
}
