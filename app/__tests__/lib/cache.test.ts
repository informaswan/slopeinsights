// __tests__/lib/cache.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readCache, writeCache, MAX_CACHE_AGE_MS, cacheStorageKey } from '../../lib/cache';

const NOW = 1_800_000_000_000;

afterEach(() => jest.restoreAllMocks());

it('returns what was written, with the time it was saved', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  await writeCache('resorts', [{ id: 'vail' }]);
  expect(await readCache('resorts')).toEqual({ data: [{ id: 'vail' }], savedAt: NOW });
});

it('returns null when nothing is cached', async () => {
  expect(await readCache('resorts')).toBeNull();
});

it('keeps separate entries per key', async () => {
  await writeCache('resort:vail', { id: 'vail' });
  expect(await readCache('resort:mammoth')).toBeNull();
});

it('ignores an entry older than 24 hours', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  await writeCache('resorts', ['old']);
  (Date.now as jest.Mock).mockReturnValue(NOW + MAX_CACHE_AGE_MS + 1);
  expect(await readCache('resorts')).toBeNull();
});

it('still returns an entry just inside the 24 hour limit', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  await writeCache('resorts', ['ok']);
  (Date.now as jest.Mock).mockReturnValue(NOW + MAX_CACHE_AGE_MS);
  expect(await readCache('resorts')).not.toBeNull();
});

it('ignores corrupt JSON', async () => {
  await AsyncStorage.setItem(cacheStorageKey('resorts'), '{not json');
  expect(await readCache('resorts')).toBeNull();
});

it('ignores an entry that is not in the expected shape', async () => {
  await AsyncStorage.setItem(cacheStorageKey('resorts'), JSON.stringify({ data: [1] }));
  expect(await readCache('resorts')).toBeNull();
});

it('does not throw when storage is unavailable', async () => {
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValue(new Error('disk full'));
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('unavailable'));
  await expect(writeCache('resorts', [])).resolves.toBeUndefined();
  await expect(readCache('resorts')).resolves.toBeNull();
});
