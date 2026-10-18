'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { browserApiClient, type AuthOwner } from '../lib/api';

type AuthContextValue = {
  owner: AuthOwner | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [owner, setOwner] = useState<AuthOwner | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const response = await browserApiClient.auth.session();
      setOwner(response.owner);
    } catch {
      setOwner(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (username: string, password: string) => {
      setLoading(true);

      try {
        await browserApiClient.auth.login({ username, password });
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await browserApiClient.auth.logout();
    setOwner(null);
  }, []);

  const value = useMemo(
    () => ({ owner, loading, login, logout, refresh }),
    [owner, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
