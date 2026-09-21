import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('expo-linking', () => ({ openURL: jest.fn() }));
const mockToggleTheme = jest.fn();
jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return {
    useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: mockToggleTheme }),
    ThemeProvider: ({ children }: any) => children,
  };
});
let mockFavoriteIds: string[] = [];
jest.mock('../../contexts/FavoritesContext', () => ({
  useFavorites: () => ({ favoriteIds: mockFavoriteIds, isLoaded: true, toggleFavorite: jest.fn() }),
}));

function renderAbout() {
  const AboutScreen = require('../../app/about').default;
  return render(<AboutScreen />);
}

beforeEach(() => {
  mockFavoriteIds = [];
  mockPush.mockClear();
});

describe('About screen', () => {
  it('renders the About SlopeInsights section', () => {
    const { getByText } = renderAbout();
    expect(getByText('About SlopeInsights')).toBeTruthy();
    expect(getByText(/My brothers and I built SlopeInsights/)).toBeTruthy();
  });

  it('opens the donation link when "buy us a coffee" is pressed', () => {
    const Linking = require('expo-linking');
    const { getByText } = renderAbout();
    fireEvent.press(getByText(/buy us a coffee/));
    expect(Linking.openURL).toHaveBeenCalledWith('https://buymeacoffee.com/slopeinsights');
  });

  it('opens the Venmo link when "send a tip on Venmo" is pressed', () => {
    const Linking = require('expo-linking');
    const { getByText } = renderAbout();
    fireEvent.press(getByText(/send a tip on Venmo/));
    expect(Linking.openURL).toHaveBeenCalledWith('https://venmo.com/u/Michael-Swanson-61');
  });

  it('has no account UI (no user name, sign out, or notifications stub)', () => {
    const { queryByText } = renderAbout();
    expect(queryByText('Sign Out')).toBeNull();
    expect(queryByText('Notifications')).toBeNull();
    expect(queryByText('Unknown')).toBeNull();
  });

  it('shows "Showing all" when nothing is starred and opens Explore', () => {
    const { getByText } = renderAbout();
    fireEvent.press(getByText(/Showing all/));
    expect(mockPush).toHaveBeenCalledWith('/explore');
  });

  it('shows how many mountains are starred', () => {
    mockFavoriteIds = ['vail', 'mammoth'];
    const { getByText } = renderAbout();
    expect(getByText(/2 starred/)).toBeTruthy();
  });

  it('toggles dark mode', () => {
    const { getByText } = renderAbout();
    expect(getByText('Dark Mode')).toBeTruthy();
  });
});
