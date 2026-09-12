// lib/sort.ts
import type { ResortSummary } from './types';

export type SortOption = 'snow' | 'base' | 'crowd' | 'lifts';
export type PassFilter = 'all' | 'epic' | 'ikon';

export function sortResorts(resorts: ResortSummary[], sort: SortOption): ResortSummary[] {
  return [...resorts].sort((a, b) => {
    switch (sort) {
      case 'snow':  return (b.snow?.new_24h_in  ?? -1) - (a.snow?.new_24h_in  ?? -1);
      case 'base':  return (b.snow?.base_in      ?? -1) - (a.snow?.base_in      ?? -1);
      case 'crowd': return (a.crowd?.current_pct ?? 101) - (b.crowd?.current_pct ?? 101);
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
