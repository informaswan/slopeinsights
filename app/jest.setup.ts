// jest.setup.ts
// Mock global fetch for all tests — real HTTP calls never happen in the test suite.
global.fetch = jest.fn();

// Pre-configure RNTL host component names to avoid auto-detection which fails
// when jest.resetModules() is called (causes multiple React instances with lazy-loaded Switch).
// In the jest/RN mock environment, native components resolve to string type names.
import { configureInternal } from '@testing-library/react-native/build/config';
configureInternal({
  hostComponentNames: {
    text: 'Text',
    textInput: 'TextInput',
    image: 'Image',
    switch: 'Switch',
    scrollView: 'ScrollView',
    modal: 'Modal',
  },
});



// The data hooks cache API responses in AsyncStorage. The mock is a process-wide singleton,
// so without this a response cached by one test would leak into the next.
import AsyncStorage from '@react-native-async-storage/async-storage';
beforeEach(async () => { await AsyncStorage.clear(); });
