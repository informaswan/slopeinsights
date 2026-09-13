import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: (props: any) => <View {...props} /> };
});
jest.mock('expo-linking', () => ({ openURL: jest.fn() }));
jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return {
    useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: jest.fn() }),
    ThemeProvider: ({ children }: any) => children,
  };
});
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@test.com', avatar_url: null },
    isAuthenticated: true,
    isLoading: false,
    savedResortIds: ['vail'],
    signOut: jest.fn(),
    refreshResorts: jest.fn(),
    updateResorts: jest.fn(),
  }),
}));

describe('Profile screen About section', () => {
  it('renders the About SlopeInsights section', () => {
    const ProfileScreen = require('../../app/profile').default;
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('About SlopeInsights')).toBeTruthy();
    expect(getByText(/My brothers and I built SlopeInsights/)).toBeTruthy();
  });

  it('opens the donation link when "buy us a coffee" is pressed', () => {
    const Linking = require('expo-linking');
    const ProfileScreen = require('../../app/profile').default;
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText(/buy us a coffee/));
    expect(Linking.openURL).toHaveBeenCalledWith('https://buymeacoffee.com/slopeinsights');
  });

  it('opens the Venmo link when "send a tip on Venmo" is pressed', () => {
    const Linking = require('expo-linking');
    const ProfileScreen = require('../../app/profile').default;
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText(/send a tip on Venmo/));
    expect(Linking.openURL).toHaveBeenCalledWith('https://venmo.com/u/Michael-Swanson-61');
  });
});
