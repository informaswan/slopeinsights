import type { ResortSummary } from './types';

export type MetricKey = 'camera' | 'base' | 'past24' | 'past48' | 'past7d' | 'trails' | 'next24' | 'next48' | 'next72';

export interface Metric {
  key: MetricKey;
  label: string;        // short caption under the number on a card
  longLabel: string;    // name in the Customize panel and the Compare chart
  group: 'now' | 'expected' | 'extra';
  /** The number behind the value, used by the Compare chart. */
  value: (r: ResortSummary) => number | null;
  /** How the value reads on a card ("42\"" or "120/195"). */
  text: (r: ResortSummary) => string;
}

const inches = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v * 10) / 10}"`);
const num = (v: number | null | undefined) => (v == null ? null : v);

export const METRICS: Metric[] = [
  // Not a number: shows the mountain's camera picture on the card.
  { key: 'camera', label: 'camera', longLabel: 'Camera picture', group: 'extra',
    value: () => null, text: () => '' },
  { key: 'base', label: 'base', longLabel: 'Base depth', group: 'now',
    value: (r) => num(r.snow?.base_in), text: (r) => inches(r.snow?.base_in) },
  { key: 'past24', label: '24h', longLabel: 'Past 24h', group: 'now',
    value: (r) => num(r.snow?.new_24h_in), text: (r) => inches(r.snow?.new_24h_in) },
  { key: 'past48', label: '48h', longLabel: 'Past 48h', group: 'now',
    value: (r) => num(r.snow?.new_48h_in), text: (r) => inches(r.snow?.new_48h_in) },
  { key: 'past7d', label: '7 days', longLabel: 'Past 7 days', group: 'now',
    value: (r) => num(r.snow?.new_7d_in), text: (r) => inches(r.snow?.new_7d_in) },
  { key: 'trails', label: 'trails open', longLabel: 'Trails open', group: 'now',
    value: (r) => num(r.trails?.open),
    text: (r) => (r.trails?.open == null ? '—' : r.trails.total ? `${r.trails.open}/${r.trails.total}` : `${r.trails.open}`) },
  { key: 'next24', label: 'next 24h', longLabel: 'Expected next 24h', group: 'expected',
    value: (r) => num(r.snow_forecast?.next_24h_in), text: (r) => inches(r.snow_forecast?.next_24h_in) },
  { key: 'next48', label: 'next 48h', longLabel: 'Expected next 48h', group: 'expected',
    value: (r) => num(r.snow_forecast?.next_48h_in), text: (r) => inches(r.snow_forecast?.next_48h_in) },
  { key: 'next72', label: 'next 72h', longLabel: 'Expected next 72h', group: 'expected',
    value: (r) => num(r.snow_forecast?.next_72h_in), text: (r) => inches(r.snow_forecast?.next_72h_in) },
];

// What's there now is what most people want, so the forecast is available but off to start with.
export const DEFAULT_METRICS: MetricKey[] = ['base', 'past24', 'past48', 'past7d', 'trails'];

/** The stats that are numbers (everything but the camera picture). */
export const STAT_METRICS = METRICS.filter((m) => m.key !== 'camera');

export const MAX_COMPARE = 5;
