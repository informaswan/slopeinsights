// __mocks__/react.js
// Ensures a single React instance survives jest.resetModules() calls.
// Components loaded after resetModules() would otherwise get a fresh React while
// @testing-library/react-native keeps the original, causing "Invalid hook call".
if (!global.__reactSingleton) {
  global.__reactSingleton = jest.requireActual('react');
}
module.exports = global.__reactSingleton;
