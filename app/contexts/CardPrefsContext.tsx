import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { METRICS, DEFAULT_METRICS } from '../lib/cardMetrics';
import type { MetricKey } from '../lib/cardMetrics';

const STORAGE_KEY = 'slopeinsights_card_metrics';
const VALID = new Set<string>(METRICS.map((m) => m.key));

interface CardPrefsValue {
  metrics: MetricKey[];                 // always in the order METRICS lists them
  toggleMetric: (key: MetricKey) => void;
  reset: () => void;
}

const CardPrefsContext = createContext<CardPrefsValue>({
  metrics: DEFAULT_METRICS,
  toggleMetric: () => {},
  reset: () => {},
});

const inOrder = (keys: Iterable<string>): MetricKey[] => {
  const set = new Set(keys);
  return METRICS.map((m) => m.key).filter((k) => set.has(k));
};

export function CardPrefsProvider({ children }: { children: React.ReactNode }) {
  const [metrics, setMetrics] = useState<MetricKey[]>(DEFAULT_METRICS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) setMetrics(inOrder(parsed.filter((k) => VALID.has(k))));
      })
      .catch(() => {});
  }, []);

  const save = (next: MetricKey[]) => {
    setMetrics(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const toggleMetric = useCallback((key: MetricKey) => {
    save(metrics.includes(key) ? metrics.filter((k) => k !== key) : inOrder([...metrics, key]));
  }, [metrics]);
  const reset = useCallback(() => save(DEFAULT_METRICS), []);

  return <CardPrefsContext.Provider value={{ metrics, toggleMetric, reset }}>{children}</CardPrefsContext.Provider>;
}

export function useCardPrefs() {
  return useContext(CardPrefsContext);
}
