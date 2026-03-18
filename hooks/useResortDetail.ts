// hooks/useResortDetail.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { ResortDetail } from '../lib/types';

interface UseResortDetailResult {
  resort: ResortDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useResortDetail(id: string): UseResortDetailResult {
  const [resort, setResort]   = useState<ResortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResort(await api.getResortDetail(id));
    } catch {
      setError('Failed to load resort');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { resort, loading, error, refresh: load };
}
