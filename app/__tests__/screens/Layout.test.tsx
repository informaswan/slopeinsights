import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const Stack = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Stack.Screen = ({ name }: { name: string }) => {
    const { View } = require('react-native');
    return <View testID={`screen-${name}`} />;
  };
  return { Stack };
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
jest.mock('../../contexts/FavoritesContext', () => ({
  FavoritesProvider: ({ children }: any) => children,
}));

describe('RootLayout', () => {
  it('renders the app screens immediately, with no paywall or login gate', () => {
    const RootLayout = require('../../app/_layout').default;
    render(<RootLayout />);
    expect(screen.getByTestId('screen-index')).toBeTruthy();
    expect(screen.getByTestId('screen-resort/[id]')).toBeTruthy();
    expect(screen.getByTestId('screen-explore')).toBeTruthy();
    expect(screen.getByTestId('screen-about')).toBeTruthy();
  });

  it('does not register paywall, login or onboarding screens', () => {
    const RootLayout = require('../../app/_layout').default;
    render(<RootLayout />);
    expect(screen.queryByTestId('screen-paywall')).toBeNull();
    expect(screen.queryByTestId('screen-login')).toBeNull();
    expect(screen.queryByTestId('screen-onboarding')).toBeNull();
  });
});
