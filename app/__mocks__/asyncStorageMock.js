// Singleton async-storage mock that survives jest.resetModules() calls.
// This is mapped to '@react-native-async-storage/async-storage/jest/async-storage-mock'
// via moduleNameMapper. The singleton lives on global so resetModules doesn't clear it.
// Tests can call global.__asyncStorageMockSingleton.clear() to reset between tests.
if (!global.__asyncStorageMockSingleton) {
  const storage = {};

  const asMock = {
    __INTERNAL_MOCK_STORAGE__: storage,

    setItem: jest.fn(async (key, value) => {
      asMock.__INTERNAL_MOCK_STORAGE__[key] = value;
      return null;
    }),

    getItem: jest.fn(async (key) => {
      return asMock.__INTERNAL_MOCK_STORAGE__[key] ?? null;
    }),

    removeItem: jest.fn(async (key) => {
      delete asMock.__INTERNAL_MOCK_STORAGE__[key];
      return null;
    }),

    clear: jest.fn(async () => {
      const keys = Object.keys(asMock.__INTERNAL_MOCK_STORAGE__);
      keys.forEach((key) => { delete asMock.__INTERNAL_MOCK_STORAGE__[key]; });
      return null;
    }),

    getAllKeys: jest.fn(async () => Object.keys(asMock.__INTERNAL_MOCK_STORAGE__)),

    multiGet: jest.fn(async (keys) =>
      keys.map((key) => [key, asMock.__INTERNAL_MOCK_STORAGE__[key] ?? null])
    ),

    multiSet: jest.fn(async (pairs) => {
      pairs.forEach(([key, value]) => { asMock.__INTERNAL_MOCK_STORAGE__[key] = value; });
      return null;
    }),

    multiRemove: jest.fn(async (keys) => {
      keys.forEach((key) => { delete asMock.__INTERNAL_MOCK_STORAGE__[key]; });
      return null;
    }),

    flushGetRequests: jest.fn(),
  };

  global.__asyncStorageMockSingleton = asMock;
}

module.exports = global.__asyncStorageMockSingleton;
