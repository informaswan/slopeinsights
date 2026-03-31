import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { getToken, setToken, clearToken } from '../lib/tokenStorage';
import type { UserProfile } from '../lib/types';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  savedResortIds: string[];
  signInDev: () => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithApple: (identityToken: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshResorts: () => Promise<void>;
  updateResorts: (ids: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  savedResortIds: [],
  signInDev: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
  refreshResorts: async () => {},
  updateResorts: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedResortIds, setSavedResortIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          const me = await api.getMe();
          setUser(me);
          const resorts = await api.getUserResorts();
          setSavedResortIds(resorts.resort_ids);
        } catch {
          await clearToken();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const signInDev = useCallback(async () => {
    const resp = await api.authDev();
    await setToken(resp.token);
    setUser(resp.user);
    try {
      const resorts = await api.getUserResorts();
      setSavedResortIds(resorts.resort_ids);
    } catch {
      setSavedResortIds([]);
    }
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    const resp = await api.authGoogle(idToken);
    await setToken(resp.token);
    setUser(resp.user);
    const resorts = await api.getUserResorts();
    setSavedResortIds(resorts.resort_ids);
  }, []);

  const signInWithApple = useCallback(async (identityToken: string, name?: string) => {
    const resp = await api.authApple(identityToken, name);
    await setToken(resp.token);
    setUser(resp.user);
    const resorts = await api.getUserResorts();
    setSavedResortIds(resorts.resort_ids);
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
    setSavedResortIds([]);
  }, []);

  const refreshResorts = useCallback(async () => {
    const resorts = await api.getUserResorts();
    setSavedResortIds(resorts.resort_ids);
  }, []);

  const updateResorts = useCallback(async (ids: string[]) => {
    const resp = await api.updateUserResorts(ids);
    setSavedResortIds(resp.resort_ids);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, isAuthenticated: !!user, isLoading, savedResortIds,
        signInDev, signInWithGoogle, signInWithApple, signOut, refreshResorts, updateResorts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
