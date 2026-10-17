// lib/cache.ts
// Last-known-data cache for API responses, so the app still shows something with no signal.
// Never throws: a full disk, blocked storage or corrupt entry just means "nothing cached".
import AsyncStorage from '@react-native-async-storage/async-storage';

// Bump the version if a cached response's shape ever changes, so old entries are never misread.
const PREFIX = 'slopeinsights_cache_v1:';

// Older data is dropped rather than shown: stale lift status on a ski day can mislead.
export const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

export interface CacheEntry<T> {
  data: T;
  savedAt: number; // ms since epoch, when it was fetched
}

export function cacheStorageKey(key: string): string {
  return `${PREFIX}${key}`;
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, savedAt: Date.now() };
    await AsyncStorage.setItem(cacheStorageKey(key), JSON.stringify(entry));
  } catch {
    // Caching is best-effort.
  }
}

export async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheStorageKey(key));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.savedAt !== 'number' || !('data' in entry)) return null;
    if (Date.now() - entry.savedAt > MAX_CACHE_AGE_MS) return null;
    return entry as CacheEntry<T>;
  } catch {
    return null;
  }
}
