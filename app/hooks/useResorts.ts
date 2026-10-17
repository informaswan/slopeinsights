// hooks/useResorts.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { readCache, writeCache } from '../lib/cache';
import type { ResortSummary } from '../lib/types';

interface UseResortsResult {
  resorts: ResortSummary[];
  best: ResortSummary[];
  loading: boolean;
  error: string | null;
  /** When the network failed and what's shown is saved data: when it was fetched (ms). Otherwise null. */
  cachedAt: number | null;
  refresh: () => Promise<void>;
}

export function useResorts(): UseResortsResult {
  const [resorts, setResorts] = useState<ResortSummary[]>([]);
  const [best, setBest]       = useState<ResortSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  // When the data we're holding was fetched; null while we hold nothing.
  const heldSince = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (heldSince.current === null) {
      // Show the last saved data straight away instead of a spinner.
      const [cachedResorts, cachedBest] = await Promise.all([
        readCache<ResortSummary[]>('resorts'),
        readCache<ResortSummary[]>('resorts-best'),
      ]);
      if (cachedResorts && cachedBest && heldSince.current === null) {
        setResorts(cachedResorts.data);
        setBest(cachedBest.data);
        heldSince.current = Math.min(cachedResorts.savedAt, cachedBest.savedAt);
      }
    }

    try {
      const [resortsData, bestData] = await Promise.all([
        api.getResorts(),
        api.getBestResorts(),
      ]);
      setResorts(resortsData);
      setBest(bestData.resorts);
      heldSince.current = Date.now();
      setCachedAt(null);
      writeCache('resorts', resortsData);
      writeCache('resorts-best', bestData.resorts);
    } catch {
      if (heldSince.current !== null) {
        setCachedAt(heldSince.current); // offline, but we have something to show
      } else {
        setError('Failed to load resorts');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { resorts, best, loading, error, cachedAt, refresh: load };
}
