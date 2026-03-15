// [AI] AuthContext - Provides user, token, login(), logout(), isLoading
// Persists token in localStorage and loads user on mount.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authAPI from '../utils/auth';
import apiClient from '../utils/api';

const AuthContext = createContext(null);

/**
 * AuthProvider - Wraps app with auth state.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const t = localStorage.getItem('authToken');
    if (!t) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data?.user ?? response.data);
      setToken(t);
    } catch {
      localStorage.removeItem('authToken');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (username, password) => {
    const { data, error } = await authAPI.login(username, password);
    if (error) return { error };
    setToken(data.token);
    setUser(data.user ?? { username: data.username ?? username });
    return { data, error: null };
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout();
    setUser(null);
    setToken(null);
  }, []);

  const signup = useCallback(async (payload) => {
    const { data, error } = await authAPI.signup(payload);
    if (error) return { error };
    setToken(data.token);
    setUser(data.user ?? { username: data.username ?? payload.username });
    return { data, error: null };
  }, []);

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    signup,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth - Hook to access auth context.
 * @returns {object} Auth context value
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
