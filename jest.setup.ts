// jest.setup.ts
// Mock global fetch for all tests — real HTTP calls never happen in the test suite.
global.fetch = jest.fn();
