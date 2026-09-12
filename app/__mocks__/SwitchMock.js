// Simple hook-free Switch mock for jest tests.
// react-native exports Switch via a lazy getter (require at call time), which causes
// a React instance mismatch when jest.resetModules() is used in beforeEach — the
// freshly-required Switch uses a different React than the already-loaded test renderer.
// This static mock avoids that by never calling useRef/useState.
const React = require('react');

const Switch = (props) => React.createElement('Switch', props);
Switch.displayName = 'Switch';

module.exports = { default: Switch };
