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
jest.mock('../../components/AppShell', () => {
  const { View } = require('react-native');
  return { AppShell: ({ children }: any) => <View testID="app-shell">{children}</View> };
});

describe('RootLayout', () => {
  it('renders every screen inside the shared app shell', () => {
    const RootLayout = require('../../app/_layout').default;
    render(<RootLayout />);
    const shell = screen.getByTestId('app-shell');
    expect(shell).toBeTruthy();
    for (const name of ['index', 'mine', 'resort/[id]', 'about']) {
      expect(screen.getByTestId(`screen-${name}`)).toBeTruthy();
    }
  });

  it('does not register paywall, login, onboarding or explore screens', () => {
    const RootLayout = require('../../app/_layout').default;
    render(<RootLayout />);
    for (const name of ['paywall', 'login', 'onboarding', 'explore']) {
      expect(screen.queryByTestId(`screen-${name}`)).toBeNull();
    }
  });
});
