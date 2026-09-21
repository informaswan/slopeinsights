import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/index';
import MyMountainsScreen from '../../app/mine';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const BottomSheet = React.forwardRef(({ children }: any, _ref: any) => <View testID="bottom-sheet">{children}</View>);
  BottomSheet.displayName = 'BottomSheet';
  return { default: BottomSheet };
});
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: (props: any) => <View {...props} /> };
});
jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return {
    useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: jest.fn() }),
    ThemeProvider: ({ children }: any) => children,
  };
});
let mockFavoriteIds: string[] = [];
jest.mock('../../contexts/FavoritesContext', () => ({
  useFavorites: () => ({ favoriteIds: mockFavoriteIds, isLoaded: true, toggleFavorite: jest.fn() }),
}));

const mockResorts = [
  { id: 'vail', name: 'Vail', pass_type: 'epic', region: 'Colorado', state: 'CO',
    snow: { base_in: 40, new_24h_in: 5, scraped_at: null, is_stale: false },
    lifts: { open: 15, total: 31 }, trails: null, crowd: { current_level: 'medium', current_pct: 55, source: '' } },
  { id: 'mammoth', name: 'Mammoth', pass_type: 'ikon', region: 'California', state: 'CA',
    snow: null, lifts: null, trails: null, crowd: null },
];
const mockBest = { resorts: [mockResorts[0]], generated_at: '' };

beforeEach(() => {
  mockFavoriteIds = [];
  mockPush.mockClear();
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => mockResorts })
    .mockResolvedValueOnce({ ok: true, json: async () => mockBest });
});

it('shows loading spinner while data loads', () => {
  const { getByTestId } = render(<HomeScreen />);
  expect(getByTestId('loading-spinner')).toBeTruthy();
});

it('renders resort names after loading', async () => {
  const { findByText } = render(<HomeScreen />);
  expect(await findByText('Vail')).toBeTruthy();
  expect(await findByText('Mammoth')).toBeTruthy();
});

it('renders the Best conditions today banner', async () => {
  const { findByText } = render(<HomeScreen />);
  expect(await findByText('Best conditions today')).toBeTruthy();
});

it('filters to Epic resorts when Epic tab is pressed', async () => {
  const { findByText, queryByText, getByLabelText } = render(<HomeScreen />);
  await findByText('Vail');
  fireEvent.press(getByLabelText('Filter by Epic'));
  expect(queryByText('Mammoth')).toBeNull();
  expect(queryByText('Vail')).toBeTruthy();
});

it('filters to Ikon resorts when Ikon tab is pressed', async () => {
  const { findByText, queryByText, getByLabelText } = render(<HomeScreen />);
  await findByText('Vail');
  fireEvent.press(getByLabelText('Filter by Ikon'));
  expect(queryByText('Vail')).toBeNull();
  expect(queryByText('Mammoth')).toBeTruthy();
});

it('shows error state with retry on fetch failure', async () => {
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
  const { findByText } = render(<HomeScreen />);
  expect(await findByText('Tap to retry')).toBeTruthy();
});

it('titles the page All mountains and shows every resort even when some are starred', async () => {
  mockFavoriteIds = ['mammoth'];
  const { findByText } = render(<HomeScreen />);
  expect(await findByText('All mountains')).toBeTruthy();
  expect(await findByText('Vail')).toBeTruthy();
  expect(await findByText('Mammoth')).toBeTruthy();
});

it('has no account UI and no lift information', async () => {
  const { findByText, queryByText } = render(<HomeScreen />);
  await findByText('Vail');
  expect(queryByText('??')).toBeNull();
  expect(queryByText(/lift/i)).toBeNull();
});

describe('My mountains', () => {
  it('shows only starred resorts', async () => {
    mockFavoriteIds = ['mammoth'];
    const { findByText, queryByText } = render(<MyMountainsScreen />);
    expect(await findByText('My mountains')).toBeTruthy();
    expect(await findByText('Mammoth')).toBeTruthy();
    expect(queryByText('Vail')).toBeNull();
  });

  it('explains how to save mountains when none are saved', async () => {
    const { findByText, queryByText } = render(<MyMountainsScreen />);
    expect(await findByText('No saved mountains yet')).toBeTruthy();
    expect(queryByText('Vail')).toBeNull();
  });
});
