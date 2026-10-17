// __tests__/hooks/useResortDetail.test.ts
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useResortDetail } from '../../hooks/useResortDetail';
import { writeCache, readCache } from '../../lib/cache';

const mockDetail = {
  id: 'vail', name: 'Vail', pass_type: 'epic' as const,
  region: 'Colorado', state: 'CO', country: 'US',
  summit_elevation_ft: 11570, vertical_drop_ft: 3450,
  website: 'https://www.vail.com',
  snow: null, lifts: null, trails: null, weather: null, webcams: [],
  parking: { has_live_data: false, scraped_at: null, is_stale: false, live_lots: [], static_lots: [] },
};

beforeEach(() => (global.fetch as jest.Mock).mockReset());

it('loads resort detail by id on mount', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockDetail });

  const { result } = renderHook(() => useResortDetail('vail'));
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.resort?.id).toBe('vail');
  expect(result.current.error).toBeNull();
});

it('sets error on API failure', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });

  const { result } = renderHook(() => useResortDetail('nonexistent'));
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.error).toBe('Failed to load resort');
  expect(result.current.resort).toBeNull();
});

it('refresh reloads detail from the API', async () => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => mockDetail })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockDetail, name: 'Vail Updated' }) });

  const { result } = renderHook(() => useResortDetail('vail'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.resort?.name).toBe('Vail');

  await act(async () => { await result.current.refresh(); });
  await waitFor(() => expect(result.current.resort?.name).toBe('Vail Updated'));
});

describe('offline cache', () => {
  const NOW = 1_800_000_000_000;
  afterEach(() => jest.restoreAllMocks());

  async function seed(id: string, savedAt = NOW - 5 * 60_000) {
    jest.spyOn(Date, 'now').mockReturnValue(savedAt);
    await writeCache(`resort:${id}`, { ...mockDetail, id });
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    return savedAt;
  }

  it('shows the cached detail while the network request is in flight', async () => {
    await seed('vail');
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useResortDetail('vail'));
    await waitFor(() => expect(result.current.resort?.id).toBe('vail'));
    expect(result.current.cachedAt).toBeNull();
  });

  it('keeps the cached detail and reports its age when the network fails', async () => {
    const savedAt = await seed('vail');
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useResortDetail('vail'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.resort?.id).toBe('vail');
    expect(result.current.error).toBeNull();
    expect(result.current.cachedAt).toBe(savedAt);
  });

  it('does not show one mountain\'s cache for another', async () => {
    await seed('vail');
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useResortDetail('mammoth'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.resort).toBeNull();
    expect(result.current.error).toBe('Failed to load resort');
  });

  it('saves each successful load for next time', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockDetail });

    const { result } = renderHook(() => useResortDetail('vail'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await waitFor(async () => expect((await readCache<any>('resort:vail'))?.data.id).toBe('vail'));
  });
});
