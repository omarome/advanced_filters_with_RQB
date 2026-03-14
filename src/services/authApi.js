/**
 * Auth API client — handles login, register, refresh, logout, and profile.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * POST /api/auth/login
 */
export const loginApi = async (email, password) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Login failed: ${response.status}`);
  }
  return response.json();
};

/**
 * POST /api/auth/register
 */
export const registerApi = async (email, password, displayName) => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Registration failed: ${response.status}`);
  }
  return response.json();
};

/**
 * POST /api/auth/refresh
 */
export const refreshApi = async (refreshToken) => {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    throw new Error('Token refresh failed');
  }
  return response.json();
};

/**
 * POST /api/auth/logout
 */
export const logoutApi = async (refreshToken) => {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
};

/**
 * GET /api/auth/me
 */
export const getMeApi = async (accessToken) => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Not authenticated');
  }
  return response.json();
};

/**
 * PATCH /api/auth/profile
 */
export const updateProfileApi = async (accessToken, displayName) => {
  const response = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ displayName }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Update failed: ${response.status}`);
  }
  return response.json();
};

/**
 * DELETE /api/auth/account
 */
export const deleteAccountApi = async (accessToken) => {
  const response = await fetch(`${API_BASE}/auth/account`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Deletion failed: ${response.status}`);
  }
};
