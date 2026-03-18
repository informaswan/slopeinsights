// __tests__/api.test.ts
import { api } from '../lib/api';

const mockResort = {
  id: 'vail', name: 'Vail', pass_type: 'epic', region: 'Colorado', state: 'CO',
  snow: null, lifts: null, trails: null, crowd: null,
};

beforeEach(() => (global.fetch as jest.Mock).mockReset());

it('getResorts sends X-API-Key header and returns parsed data', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockResort] });
  const result = await api.getResorts();
  expect(result).toHaveLength(1);
  const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
  expect(url).toContain('/api/resorts');
  expect((opts as RequestInit).headers).toMatchObject({ 'X-API-Key': expect.any(String) });
});

it('getBestResorts returns the resorts array from the response envelope', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true, json: async () => ({ resorts: [mockResort], generated_at: '' }),
  });
  const result = await api.getBestResorts();
  expect(result.resorts).toHaveLength(1);
});

it('getResortDetail constructs correct URL', async () => {
  const mockDetail = { ...mockResort, country: 'US', summit_elevation_ft: null,
    vertical_drop_ft: null, website: null, snow: null, lifts: null, trails: null,
    crowd: null, weather: null, webcams: [],
    parking: { has_live_data: false, scraped_at: null, is_stale: false, live_lots: [], static_lots: [] } };
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockDetail });
  await api.getResortDetail('jackson-hole');
  const [url] = (global.fetch as jest.Mock).mock.calls[0];
  expect(url).toContain('/api/resorts/jackson-hole');
});

it('throws on non-ok HTTP response', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });
  await expect(api.getResorts()).rejects.toThrow('API error 401');
});
