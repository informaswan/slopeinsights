import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Sidebar } from '../../components/Sidebar';

const mockPush = jest.fn();
let mockPathname = '/';
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));
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
jest.mock('../../lib/api', () => ({
  api: {
    getResorts: jest.fn(async () => [
      { id: 'vail', name: 'Vail', pass_type: 'epic', region: 'Colorado', state: 'CO' },
      { id: 'mammoth', name: 'Mammoth Mountain', pass_type: 'ikon', region: 'California', state: 'CA' },
    ]),
  },
}));

beforeEach(() => {
  mockPush.mockClear();
  mockToggleTheme.mockClear();
  mockFavoriteIds = [];
  mockPathname = '/';
});

describe('Sidebar', () => {
  it('shows navigation, support links, dark mode and About', () => {
    const { getByText, getByLabelText } = render(<Sidebar />);
    expect(getByText('SlopeInsights')).toBeTruthy();
    expect(getByText('All mountains')).toBeTruthy();
    expect(getByText('My mountains')).toBeTruthy();
    expect(getByText('Road cameras')).toBeTruthy();
    expect(getByText('Buy us a coffee')).toBeTruthy();
    expect(getByText('Tip on Venmo')).toBeTruthy();
    expect(getByLabelText('Dark mode')).toBeTruthy();
    expect(getByText('About')).toBeTruthy();
  });

  it('shows how many mountains are saved, and hides the count when none are', () => {
    const { queryByText, rerender } = render(<Sidebar />);
    expect(queryByText('2')).toBeNull();
    mockFavoriteIds = ['vail', 'mammoth'];
    rerender(<Sidebar />);
    expect(queryByText('2')).toBeTruthy();
  });

  it('navigates from the nav items and reports the navigation', () => {
    const onNavigate = jest.fn();
    const { getByText } = render(<Sidebar onNavigate={onNavigate} />);
    fireEvent.press(getByText('My mountains'));
    expect(mockPush).toHaveBeenCalledWith('/mine');
    fireEvent.press(getByText('All mountains'));
    expect(mockPush).toHaveBeenCalledWith('/');
    fireEvent.press(getByText('Road cameras'));
    expect(mockPush).toHaveBeenCalledWith('/road-cameras');
    fireEvent.press(getByText('About'));
    expect(mockPush).toHaveBeenCalledWith('/about');
    expect(onNavigate).toHaveBeenCalledTimes(4);
  });

  it('searches mountains by name and opens the one you pick', async () => {
    const { getByLabelText, findByText, queryByText } = render(<Sidebar />);
    fireEvent.changeText(getByLabelText('Search mountains'), 'vai');
    fireEvent.press(await findByText('Vail'));
    expect(mockPush).toHaveBeenCalledWith('/resort/vail');
    expect(queryByText('Mammoth Mountain')).toBeNull();
  });

  it('says so when nothing matches', async () => {
    const { getByLabelText, findByText } = render(<Sidebar />);
    fireEvent.changeText(getByLabelText('Search mountains'), 'zzz');
    expect(await findByText('No mountains match')).toBeTruthy();
  });

  it('hides search results once a mountain is picked', async () => {
    const { getByLabelText, findByText, queryByText } = render(<Sidebar />);
    fireEvent.changeText(getByLabelText('Search mountains'), 'mammoth');
    fireEvent.press(await findByText('Mammoth Mountain'));
    await waitFor(() => expect(queryByText('Mammoth Mountain')).toBeNull());
  });

  it('opens the donation links', () => {
    const Linking = require('expo-linking');
    const { getByText } = render(<Sidebar />);
    fireEvent.press(getByText('Buy us a coffee'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://buymeacoffee.com/slopeinsights');
    fireEvent.press(getByText('Tip on Venmo'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://venmo.com/u/Michael-Swanson-61');
  });

  it('toggles dark mode', () => {
    const { getByLabelText } = render(<Sidebar />);
    fireEvent(getByLabelText('Dark mode'), 'valueChange', true);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('has no emoji', () => {
    const { toJSON } = render(<Sidebar />);
    expect(JSON.stringify(toJSON())).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});
