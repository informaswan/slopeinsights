import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ExploreScreen from '../../app/explore';

jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return {
    useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: jest.fn() }),
    ThemeProvider: ({ children }: any) => children,
  };
});
jest.mock('../../hooks/useResorts', () => ({
  useResorts: () => ({
    resorts: [
      { id: 'vail', name: 'Vail', pass_type: 'epic', region: 'Colorado', state: 'CO' },
      { id: 'mammoth', name: 'Mammoth', pass_type: 'ikon', region: 'California', state: 'CA' },
    ],
  }),
}));
const mockToggleFavorite = jest.fn();
let mockFavoriteIds: string[] = [];
jest.mock('../../contexts/FavoritesContext', () => ({
  useFavorites: () => ({
    favoriteIds: mockFavoriteIds, isLoaded: true, toggleFavorite: mockToggleFavorite,
  }),
}));

beforeEach(() => {
  mockFavoriteIds = [];
  mockToggleFavorite.mockClear();
});

it('offers to add resorts that are not starred', () => {
  const { getAllByText } = render(<ExploreScreen />);
  expect(getAllByText('+ Add')).toHaveLength(2);
});

it('offers to remove resorts that are starred', () => {
  mockFavoriteIds = ['vail'];
  const { getAllByText, getByText } = render(<ExploreScreen />);
  expect(getByText('Remove')).toBeTruthy();
  expect(getAllByText('+ Add')).toHaveLength(1);
});

it('toggles a favorite when its button is pressed', () => {
  const { getAllByText } = render(<ExploreScreen />);
  fireEvent.press(getAllByText('+ Add')[0]);
  expect(mockToggleFavorite).toHaveBeenCalledTimes(1);
  expect(['vail', 'mammoth']).toContain(mockToggleFavorite.mock.calls[0][0]);
});
