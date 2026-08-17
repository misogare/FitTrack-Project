import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await api.getProfile();
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  const login = async (credentials) => {
    const data = await api.login(credentials);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await api.logout(); } finally { setUser(null); }
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshProfile }), [user, loading, refreshProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
