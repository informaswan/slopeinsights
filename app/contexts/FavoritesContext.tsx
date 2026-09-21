import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'slopeinsights_favorites';

interface FavoritesContextValue {
  favoriteIds: string[];
  isLoaded: boolean;
  toggleFavorite: (resortId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favoriteIds: [],
  isLoaded: false,
  toggleFavorite: async () => {},
});

async function readStored(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    readStored().then(setFavoriteIds).finally(() => setIsLoaded(true));
  }, []);

  const toggleFavorite = useCallback(async (resortId: string) => {
    const next = favoriteIds.includes(resortId)
      ? favoriteIds.filter((id) => id !== resortId)
      : [...favoriteIds, resortId];
    setFavoriteIds(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isLoaded, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
