// hooks/useResortDetail.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { readCache, writeCache } from '../lib/cache';
import type { ResortDetail } from '../lib/types';

interface UseResortDetailResult {
  resort: ResortDetail | null;
  loading: boolean;
  error: string | null;
  /** When the network failed and what's shown is saved data: when it was fetched (ms). Otherwise null. */
  cachedAt: number | null;
  refresh: () => Promise<void>;
}

export function useResortDetail(id: string): UseResortDetailResult {
  const [resort, setResort]   = useState<ResortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  // When the data we're holding was fetched; null while we hold nothing.
  const heldSince = useRef<number | null>(null);

  // Different mountain: forget what we were holding for the previous one.
  useEffect(() => {
    heldSince.current = null;
    setResort(null);
    setCachedAt(null);
  }, [id]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (heldSince.current === null) {
      const cached = await readCache<ResortDetail>(`resort:${id}`);
      if (cached && heldSince.current === null) {
        setResort(cached.data);
        heldSince.current = cached.savedAt;
      }
    }

    try {
      const fresh = await api.getResortDetail(id);
      setResort(fresh);
      heldSince.current = Date.now();
      setCachedAt(null);
      writeCache(`resort:${id}`, fresh);
    } catch {
      if (heldSince.current !== null) {
        setCachedAt(heldSince.current);
      } else {
        setError('Failed to load resort');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Never hand back another mountain's data while this one's request is starting.
  return { resort: resort?.id === id ? resort : null, loading, error, cachedAt, refresh: load };
}
