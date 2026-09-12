// hooks/useResorts.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { ResortSummary } from '../lib/types';

interface UseResortsResult {
  resorts: ResortSummary[];
  best: ResortSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useResorts(): UseResortsResult {
  const [resorts, setResorts] = useState<ResortSummary[]>([]);
  const [best, setBest]       = useState<ResortSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resortsData, bestData] = await Promise.all([
        api.getResorts(),
        api.getBestResorts(),
      ]);
      setResorts(resortsData);
      setBest(bestData.resorts);
    } catch {
      setError('Failed to load resorts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { resorts, best, loading, error, refresh: load };
}
