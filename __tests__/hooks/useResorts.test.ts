// __tests__/hooks/useResorts.test.ts
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useResorts } from '../../hooks/useResorts';

const mockResorts = [
  { id: 'vail', name: 'Vail', pass_type: 'epic' as const, region: 'Colorado',
    state: 'CO', snow: null, lifts: null, trails: null, crowd: null },
  { id: 'mammoth', name: 'Mammoth', pass_type: 'ikon' as const, region: 'California',
    state: 'CA', snow: null, lifts: null, trails: null, crowd: null },
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
