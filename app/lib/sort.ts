// lib/sort.ts
import type { ResortSummary } from './types';

export type SortOption = 'snow' | 'base' | 'lifts';
export type PassFilter = 'all' | 'epic' | 'ikon' | 'independent';

export const REGIONS = ['Colorado', 'Utah', 'California', 'Wyoming', 'Pacific NW', 'Northeast', 'Montana / Idaho', 'Canada', 'Other US'];

export function sortResorts(resorts: ResortSummary[], sort: SortOption): ResortSummary[] {
  return [...resorts].sort((a, b) => {
    switch (sort) {
      case 'snow':  return (b.snow?.new_24h_in  ?? -1) - (a.snow?.new_24h_in  ?? -1);
      case 'base':  return (b.snow?.base_in      ?? -1) - (a.snow?.base_in      ?? -1);
      case 'lifts': return (b.lifts?.open        ?? -1) - (a.lifts?.open        ?? -1);
    }
  });
}

export function applyFilters(
  resorts: ResortSummary[],
  passFilter: PassFilter,
  selectedRegions: Set<string>,
): ResortSummary[] {
  return resorts.filter((r) => {
    if (passFilter !== 'all' && r.pass_type !== passFilter) return false;
    if (selectedRegions.size > 0 && !selectedRegions.has(r.region)) return false;
    return true;
  });
}

// Client-side port of backend/app/scoring.py, so "best" can be ranked within a subset (e.g. My mountains).
function bestScore(r: ResortSummary): number | null {
  const snow = r.snow?.new_24h_in;
  const open = r.lifts?.open;
  if (snow == null || r.snow?.is_stale) return null; // lifts alone, or old data, can't make it "best"
  const total = r.lifts?.total;
  return Math.min((snow ?? 0) / 12, 1) * 0.7 + (total ? ((open ?? 0) / total) * 0.3 : 0);
}

export function topByConditions(resorts: ResortSummary[], n: number): ResortSummary[] {
  return resorts
    .map((r) => ({ r, score: bestScore(r) }))
    .filter((x): x is { r: ResortSummary; score: number } => x.score != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.r);
}
