// __tests__/hooks/useResortDetail.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useResortDetail } from '../../hooks/useResortDetail';

const mockDetail = {
  id: 'vail', name: 'Vail', pass_type: 'epic' as const,
  region: 'Colorado', state: 'CO', country: 'US',
  summit_elevation_ft: 11570, vertical_drop_ft: 3450,
  website: 'https://www.vail.com',
  snow: null, lifts: null, trails: null, crowd: null, weather: null, webcams: [],
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

  await result.current.refresh();
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.resort?.name).toBe('Vail Updated');
});
