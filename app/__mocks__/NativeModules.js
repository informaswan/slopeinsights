'use strict';

// Custom mock for react-native/Libraries/BatchedBridge/NativeModules.
// jest-expo 53 setup.js does require(...NativeModules).default, so we must
// export both the flat object AND a .default property pointing to it.

const obj = {
  AlertManager: { alertWithArgs: jest.fn() },
  AsyncLocalStorage: {
    multiGet: jest.fn((keys, cb) => process.nextTick(() => cb(null, []))),
    multiSet: jest.fn((entries, cb) => process.nextTick(() => cb(null))),
    multiRemove: jest.fn((keys, cb) => process.nextTick(() => cb(null))),
    multiMerge: jest.fn((entries, cb) => process.nextTick(() => cb(null))),
    clear: jest.fn(cb => process.nextTick(() => cb(null))),
    getAllKeys: jest.fn(cb => process.nextTick(() => cb(null, []))),
  },
  DeviceInfo: {
    getConstants() {
      return {
        Dimensions: {
          window: { fontScale: 2, height: 1334, scale: 2, width: 750 },
          screen: { fontScale: 2, height: 1334, scale: 2, width: 750 },
        },
      };
    },
  },
  DevSettings: { addMenuItem: jest.fn(), reload: jest.fn() },
  ImageLoader: {
    prefetchImage: jest.fn(),
    getSize: jest.fn((uri, success) => process.nextTick(() => success(320, 240))),
  },
  ImageViewManager: {
    prefetchImage: jest.fn(),
    getSize: jest.fn((uri, success) => process.nextTick(() => success(320, 240))),
  },
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    openSettings: jest.fn(),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
    getInitialURL: jest.fn(() => Promise.resolve(null)),
    sendIntent: jest.fn(),
  },
  NativeUnimoduleProxy: {
    modulesConstants: {
      mockDefinition: {
        ExponentConstants: {
          experienceUrl: { mock: 'exp://192.168.1.200:8081' },
        },
      },
    },
    viewManagersMetadata: {},
    callMethod: jest.fn(),
    viewManagersNames: [],
  },
  PlatformConstants: {
    getConstants() {
      return {
        reactNativeVersion: { major: 0, minor: 76, patch: 9, preRelease: null },
        isTesting: true,
        isDisableAnimations: true,
      };
    },
  },
  SettingsManager: {
    getConstants: jest.fn(() => ({ settings: {} })),
    setValues: jest.fn(),
    deleteValues: jest.fn(),
  },
  StatusBarManager: {
    getHeight: jest.fn(),
    setStyle: jest.fn(),
    setHidden: jest.fn(),
    setNetworkActivityIndicatorVisible: jest.fn(),
    setBackgroundColor: jest.fn(),
    setTranslucent: jest.fn(),
    HEIGHT: 20,
  },
  Timing: { createTimer: jest.fn(), deleteTimer: jest.fn() },
  UIManager: {
    getViewManagerConfig: jest.fn(() => ({})),
    hasViewManagerConfig: jest.fn(() => false),
    measure: jest.fn(),
    measureInWindow: jest.fn(),
    measureLayout: jest.fn(),
    updateView: jest.fn(),
    dispatchViewManagerCommand: jest.fn(),
    setJSResponder: jest.fn(),
    clearJSResponder: jest.fn(),
    configureNextLayoutAnimation: jest.fn(),
    blur: jest.fn(),
    focus: jest.fn(),
  },
};

// Jest-expo setup.js does `require(...NativeModules).default`
// so we export the object as both the module itself AND as `.default`
module.exports = obj;
module.exports.default = obj;
