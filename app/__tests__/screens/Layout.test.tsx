import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-router', () => {
  const Stack = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Stack.Screen = ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return testID ? <View testID={testID} /> : null;
  };
  return { Stack, useRouter: jest.fn(() => ({ replace: jest.fn() })) };
});
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return { GestureHandlerRootView: View };
});
jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return {
    useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: jest.fn() }),
    ThemeProvider: ({ children }: any) => children,
  };
});

let mockAuthState = {
  isAuthenticated: true,
  isLoading: false,
  savedResortIds: ['vail'],
  user: { id: '1', name: 'Test', email: 'test@test.com', avatar_url: null },
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
  signOut: jest.fn(),
  refreshResorts: jest.fn(),
  updateResorts: jest.fn(),
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: any) => children,
}));

beforeEach(() => {
  jest.resetModules();
  AsyncStorage.clear();
  mockAuthState = {
    isAuthenticated: true,
    isLoading: false,
    savedResortIds: ['vail'],
    user: { id: '1', name: 'Test', email: 'test@test.com', avatar_url: null },
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signOut: jest.fn(),
    refreshResorts: jest.fn(),
    updateResorts: jest.fn(),
  };
});

describe('RootLayout', () => {
  it('shows a loading spinner before purchase check resolves', () => {
    const RootLayout = require('../../app/_layout').default;
    render(<RootLayout />);
    expect(screen.getByTestId('layout-loading')).toBeTruthy();
  });

  it('renders paywall Stack.Screen (not index) when not purchased', async () => {
    const RootLayout = require('../../app/_layout').default;
    render(<RootLayout />);
    await waitFor(() => expect(screen.queryByTestId('layout-loading')).toBeNull());
    expect(screen.getByTestId('stack-paywall')).toBeTruthy();
    expect(screen.queryByTestId('stack-index')).toBeNull();
  });

  it('renders index Stack.Screen (not paywall) when already purchased', async () => {
    await AsyncStorage.setItem('slopeinsights_purchased', 'true');
    const RootLayout = require('../../app/_layout').default;
    render(<RootLayout />);
    await waitFor(() => expect(screen.queryByTestId('layout-loading')).toBeNull());
    expect(screen.getByTestId('stack-index')).toBeTruthy();
    expect(screen.queryByTestId('stack-paywall')).toBeNull();
  });
});
