import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, getToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await authApi.me();
      setUser(u);
    } catch {
      localStorage.removeItem('cpb_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (username, password) => {
    const { token, user: u } = await authApi.login(username, password);
    localStorage.setItem('cpb_token', token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (username, password) => {
    const { token, user: u } = await authApi.register(username, password);
    localStorage.setItem('cpb_token', token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cpb_token');
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => loadUser(), [loadUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
