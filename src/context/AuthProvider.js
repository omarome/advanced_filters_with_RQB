import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, googleProvider } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, signOut, onIdTokenChanged, getIdToken, updateProfile as firebaseUpdateProfile } from 'firebase/auth';

const AuthContext = createContext(null);

let _accessToken = localStorage.getItem('accessToken') || null;

export function getAccessToken() {
  return _accessToken;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Expose backend auth context (e.g., getting claims or creating user data in backend via API)
  const syncWithBackend = async (token) => {
    try {
      // If we had a specific backend sync logic, we can call it here.
      // E.g. getMeApi or something. But FirebaseTokenFilter creates it.
      // We assume user is good.
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // onIdTokenChanged provides the user + automatically refreshes ID tokens!
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Force refresh to ensure latest claims? Not necessarily needed on every state change unless we specifically want it.
        const token = await firebaseUser.getIdToken();
        _accessToken = token;
        localStorage.setItem('accessToken', token);
        setUser(firebaseUser); // Store firebase user 
      } else {
        _accessToken = null;
        localStorage.removeItem('accessToken');
        setUser(null);
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
     // Keep empty or call backend then auth.currentUser.delete()
  }, []);

  const handleOAuthSuccess = useCallback(async () => {}, []);

  const forceTokenRefresh = useCallback(async () => {
      if (auth.currentUser) {
          const token = await getIdToken(auth.currentUser, true);
          _accessToken = token;
          localStorage.setItem('accessToken', token);
      }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout: performLogout,
    updateProfile,
    deleteAccount,
    handleOAuthSuccess,
    forceTokenRefresh,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthProvider;
