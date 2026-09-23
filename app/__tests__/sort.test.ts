// __tests__/sort.test.ts
import { sortResorts, applyFilters } from '../lib/sort';
import type { ResortSummary } from '../lib/types';

function makeResort(overrides: Partial<ResortSummary> & Pick<ResortSummary, 'id' | 'pass_type' | 'region'>): ResortSummary {
  return {
    name: overrides.id,
    state: 'CO',
    snow: null,
    lifts: null,
    trails: null,
    ...overrides,
  };
}

const resorts: ResortSummary[] = [
  makeResort({ id: 'a', pass_type: 'epic', region: 'Colorado',
    snow: { base_in: 30, new_24h_in: 3, scraped_at: null, is_stale: false },
    lifts: { open: 5, total: 10 } }),
  makeResort({ id: 'b', pass_type: 'ikon', region: 'Utah',
    snow: { base_in: 50, new_24h_in: 10, scraped_at: null, is_stale: false },
    lifts: { open: 8, total: 10 } }),
  makeResort({ id: 'c', pass_type: 'epic', region: 'California',
    snow: null, lifts: null }),
];

describe('sortResorts', () => {
  it('sorts by fresh snow descending (default)', () => {
    const sorted = sortResorts(resorts, 'snow');
    expect(sorted[0].id).toBe('b');
    expect(sorted[1].id).toBe('a');
    expect(sorted[2].id).toBe('c');
  });

  it('sorts by base depth descending', () => {
    const sorted = sortResorts(resorts, 'base');
    expect(sorted[0].id).toBe('b');
  });

  it('sorts by lifts open descending', () => {
    const sorted = sortResorts(resorts, 'lifts');
    expect(sorted[0].id).toBe('b');
  });

  it('does not mutate the input array', () => {
    const original = [...resorts];
    sortResorts(resorts, 'snow');
    expect(resorts.map(r => r.id)).toEqual(original.map(r => r.id));
  });
});

describe('applyFilters', () => {
  it('filters by pass type', () => {
    expect(applyFilters(resorts, 'epic', new Set()).map(r => r.id)).toEqual(['a', 'c']);
    expect(applyFilters(resorts, 'ikon', new Set()).map(r => r.id)).toEqual(['b']);
  });

  it('filters by region', () => {
    const result = applyFilters(resorts, 'all', new Set(['Colorado', 'Utah']));
    expect(result.map(r => r.id)).toEqual(['a', 'b']);
  });

  it('returns all when pass=all and no regions selected', () => {
    expect(applyFilters(resorts, 'all', new Set())).toHaveLength(3);
  });
});
