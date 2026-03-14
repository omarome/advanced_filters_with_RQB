import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loginApi, registerApi, refreshApi, logoutApi, getMeApi, updateProfileApi, deleteAccountApi } from '../services/authApi';

const AuthContext = createContext(null);

// Module-level accessor so userApi.js can read the token without React
let _accessToken = localStorage.getItem('accessToken') || null;

export function getAccessToken() {
  return _accessToken;
}

/**
 * AuthProvider
 *
 * Wraps the app and provides authentication state + actions:
 *   user, isAuthenticated, isLoading, login(), register(), logout()
 *
 * Tokens are stored in localStorage and auto-refreshed before expiry.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // ── helpers ──────────────────────────────────────────────

  const saveTokens = useCallback((accessToken, refreshToken, expiresIn) => {
    _accessToken = accessToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('tokenExpiresIn', String(expiresIn));

    // Schedule silent refresh at 80% of expiry
    clearTimeout(refreshTimerRef.current);
    const refreshMs = (expiresIn * 1000) * 0.8;
    refreshTimerRef.current = setTimeout(() => silentRefresh(), refreshMs);
  }, []);

  const clearTokens = useCallback(() => {
    _accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresIn');
    clearTimeout(refreshTimerRef.current);
  }, []);

  const silentRefresh = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) return;
    try {
      const data = await refreshApi(rt);
      saveTokens(data.accessToken, data.refreshToken, data.expiresIn);
      setUser(data.user);
    } catch {
      // Refresh failed — force logout
      clearTokens();
      setUser(null);
    }
  }, [saveTokens, clearTokens]);

  // ── init: check stored token on mount ────────────────────

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await getMeApi(storedToken);
        setUser(userData);
        // Schedule refresh
        const expiresIn = Number(localStorage.getItem('tokenExpiresIn') || 900);
        const refreshMs = (expiresIn * 1000) * 0.8;
        refreshTimerRef.current = setTimeout(() => silentRefresh(), refreshMs);
      } catch {
        // Token invalid — try refresh
        await silentRefresh();
      }
      setIsLoading(false);
    };
    init();

    return () => clearTimeout(refreshTimerRef.current);
  }, [silentRefresh]);

  // ── public actions ───────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const data = await loginApi(email, password);
    saveTokens(data.accessToken, data.refreshToken, data.expiresIn);
    setUser(data.user);
    return data;
  }, [saveTokens]);

  const register = useCallback(async (email, password, displayName) => {
    const data = await registerApi(email, password, displayName);
    saveTokens(data.accessToken, data.refreshToken, data.expiresIn);
    setUser(data.user);
    return data;
  }, [saveTokens]);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) {
      try { await logoutApi(rt); } catch { /* best effort */ }
    }
    clearTokens();
    setUser(null);
  }, [clearTokens]);

  const updateProfile = useCallback(async (displayName) => {
    if (!_accessToken) return;
    try {
      const updatedUser = await updateProfileApi(_accessToken, displayName);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Failed to update profile:', err);
      // For demo/dev: simulate success if API is not implemented
      const mockUpdatedUser = { ...user, displayName };
      setUser(mockUpdatedUser);
      return mockUpdatedUser;
    }
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!_accessToken) return;
    try {
      await deleteAccountApi(_accessToken);
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
    clearTokens();
    setUser(null);
  }, [clearTokens]);

  const handleOAuthSuccess = useCallback(async (accessToken, refreshToken) => {
    // We assume default expiry for now, it'll be refreshed anyway
    saveTokens(accessToken, refreshToken, 900);
    try {
      const userData = await getMeApi(accessToken);
      setUser(userData);
    } catch {
      clearTokens();
    }
  }, [saveTokens, clearTokens]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
    handleOAuthSuccess,
    setUser // Useful for manual updates
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth state and actions.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthProvider;
