// __tests__/hooks/useResorts.test.ts
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useResorts } from '../../hooks/useResorts';
import { readCache, writeCache, MAX_CACHE_AGE_MS } from '../../lib/cache';

const mockResorts = [
  { id: 'vail', name: 'Vail', pass_type: 'epic' as const, region: 'Colorado',
    state: 'CO', snow: null, lifts: null, trails: null },
  { id: 'mammoth', name: 'Mammoth', pass_type: 'ikon' as const, region: 'California',
    state: 'CA', snow: null, lifts: null, trails: null },
];
const mockBest = { resorts: [mockResorts[0]], generated_at: '2026-03-16T10:00:00Z' };

beforeEach(() => (global.fetch as jest.Mock).mockReset());

it('loads resorts and best on mount', async () => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => mockResorts })
    .mockResolvedValueOnce({ ok: true, json: async () => mockBest });

  const { result } = renderHook(() => useResorts());
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.resorts).toHaveLength(2);
  expect(result.current.best).toHaveLength(1);
  expect(result.current.error).toBeNull();
});

it('sets error message on fetch failure', async () => {
  (global.fetch as jest.Mock)
    .mockRejectedValue(new Error('Network error'));

  const { result } = renderHook(() => useResorts());
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.error).toBe('Failed to load resorts');
  expect(result.current.resorts).toHaveLength(0);
});

it('refresh reloads data from the API', async () => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => mockResorts })
    .mockResolvedValueOnce({ ok: true, json: async () => mockBest })
    .mockResolvedValueOnce({ ok: true, json: async () => [mockResorts[0]] })
    .mockResolvedValueOnce({ ok: true, json: async () => mockBest });

  const { result } = renderHook(() => useResorts());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.resorts).toHaveLength(2);

  await act(async () => { await result.current.refresh(); });
  await waitFor(() => expect(result.current.resorts).toHaveLength(1));
});

describe('offline cache', () => {
  const NOW = 1_800_000_000_000;
  afterEach(() => jest.restoreAllMocks());

  async function seedCache(savedAt = NOW - 20 * 60_000) {
    jest.spyOn(Date, 'now').mockReturnValue(savedAt);
    await writeCache('resorts', mockResorts);
    await writeCache('resorts-best', mockBest.resorts);
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    return savedAt;
  }

  it('shows cached resorts while the network request is still in flight', async () => {
    await seedCache();
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useResorts());
    await waitFor(() => expect(result.current.resorts).toHaveLength(2));

    expect(result.current.best).toHaveLength(1);
    expect(result.current.cachedAt).toBeNull(); // not offline: we just haven't heard back yet
  });

  it('keeps the cached data and reports its age when the network fails', async () => {
    const savedAt = await seedCache();
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useResorts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.resorts).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(result.current.cachedAt).toBe(savedAt);
  });

  it('replaces the cache and clears the offline flag when the network succeeds', async () => {
    await seedCache();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [mockResorts[1]] })
      .mockResolvedValueOnce({ ok: true, json: async () => mockBest });

    const { result } = renderHook(() => useResorts());
    await waitFor(() => expect(result.current.resorts).toHaveLength(1));

    expect(result.current.cachedAt).toBeNull();
    await waitFor(async () => expect((await readCache<any[]>('resorts'))?.data).toHaveLength(1));
  });

  it('falls back to the cache when a refresh fails after a good load', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockResorts })
      .mockResolvedValueOnce({ ok: true, json: async () => mockBest })
      .mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useResorts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.refresh(); });

    expect(result.current.resorts).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(result.current.cachedAt).not.toBeNull();
  });

  it('shows the error, not stale data, when the cache is older than 24 hours', async () => {
    await seedCache(NOW - MAX_CACHE_AGE_MS - 1);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useResorts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.resorts).toHaveLength(0);
    expect(result.current.error).toBe('Failed to load resorts');
    expect(result.current.cachedAt).toBeNull();
  });
});
