import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MountainFinder } from '../../components/MountainFinder';
import type { ResortSummary } from '../../lib/types';

const mockPush = jest.fn();
const mockToggle = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return {
    useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: jest.fn() }),
    ThemeProvider: ({ children }: any) => children,
  };
});
let mockFavoriteIds: string[] = [];
jest.mock('../../contexts/FavoritesContext', () => ({
  useFavorites: () => ({ favoriteIds: mockFavoriteIds, isLoaded: true, toggleFavorite: mockToggle }),
}));

const r = (id: string, name: string, pass_type: ResortSummary['pass_type'], region: string, state: string): ResortSummary =>
  ({ id, name, pass_type, region, state, snow: null, lifts: null, trails: null });
const resorts = [
  r('vail', 'Vail', 'epic', 'Colorado', 'CO'),
  r('alta', 'Alta', 'ikon', 'Utah', 'UT'),
  r('monarch', 'Monarch Mountain', 'independent', 'Colorado', 'CO'),
  r('stowe', 'Stowe', 'epic', 'Northeast', 'VT'),
];

beforeEach(() => { mockPush.mockClear(); mockToggle.mockClear(); mockFavoriteIds = []; });

it('lists every mountain by name to start with', () => {
  const { getByText } = render(<MountainFinder resorts={resorts} />);
  for (const n of ['Alta', 'Monarch Mountain', 'Stowe', 'Vail']) expect(getByText(n)).toBeTruthy();
});

it('searches by name, ignoring case', () => {
  const { getByLabelText, queryByText, getByText } = render(<MountainFinder resorts={resorts} />);
  fireEvent.changeText(getByLabelText('Find a mountain'), 'mon');
  expect(getByText('Monarch Mountain')).toBeTruthy();
  expect(queryByText('Vail')).toBeNull();
});

it('narrows by pass', () => {
  const { getByLabelText, queryByText, getByText } = render(<MountainFinder resorts={resorts} />);
  fireEvent.press(getByLabelText('Show Epic mountains'));
  expect(getByText('Vail')).toBeTruthy();
  expect(getByText('Stowe')).toBeTruthy();
  expect(queryByText('Alta')).toBeNull();
  fireEvent.press(getByLabelText('Show All mountains'));
  expect(getByText('Alta')).toBeTruthy();
});

it('narrows by region, and combines region with pass', () => {
  const { getByLabelText, queryByText, getByText } = render(<MountainFinder resorts={resorts} />);
  fireEvent.press(getByLabelText('Region Colorado'));
  expect(getByText('Vail')).toBeTruthy();
  expect(getByText('Monarch Mountain')).toBeTruthy();
  expect(queryByText('Alta')).toBeNull();
  fireEvent.press(getByLabelText('Show Epic mountains'));
  expect(queryByText('Monarch Mountain')).toBeNull();
  expect(getByText('Vail')).toBeTruthy();
});

it('says when nothing matches', () => {
  const { getByLabelText, getByText } = render(<MountainFinder resorts={resorts} />);
  fireEvent.changeText(getByLabelText('Find a mountain'), 'zzz');
  expect(getByText('No mountains match')).toBeTruthy();
});

it('saves a mountain with its star without opening it', () => {
  const { getByLabelText } = render(<MountainFinder resorts={resorts} />);
  fireEvent.press(getByLabelText('Save Vail to My mountains'));
  expect(mockToggle).toHaveBeenCalledWith('vail');
  expect(mockPush).not.toHaveBeenCalled();
});

it('opens a mountain when its row is tapped', () => {
  const { getByText } = render(<MountainFinder resorts={resorts} />);
  fireEvent.press(getByText('Vail'));
  expect(mockPush).toHaveBeenCalledWith('/resort/vail');
});

it('shows a saved mountain as saved', () => {
  mockFavoriteIds = ['alta'];
  const { getByLabelText } = render(<MountainFinder resorts={resorts} />);
  expect(getByLabelText('Remove Alta from My mountains')).toBeTruthy();
});
