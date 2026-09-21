import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ResortCard } from '../../components/ResortCard';
import type { ResortSummary } from '../../lib/types';
import { TestWrapper } from '../test-utils';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
const mockToggleFavorite = jest.fn();
let mockFavoriteIds: string[] = [];
jest.mock('../../contexts/FavoritesContext', () => ({
  useFavorites: () => ({ favoriteIds: mockFavoriteIds, isLoaded: true, toggleFavorite: mockToggleFavorite }),
}));

const base: ResortSummary = {
  id: 'vail', name: 'Vail', pass_type: 'epic', region: 'Colorado', state: 'CO',
  snow: { base_in: 42, new_24h_in: 8, scraped_at: '2026-03-16T10:00:00Z', is_stale: false },
  lifts: { open: 18, total: 31 }, trails: { open: 120, total: 195 },
  crowd: { current_level: 'medium', current_pct: 50, source: 'historical_pattern' },
};

beforeEach(() => {
  mockPush.mockReset();
  mockToggleFavorite.mockReset();
  mockFavoriteIds = [];
});

it('renders resort name and state', () => {
  const { getByText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  expect(getByText('Vail')).toBeTruthy();
  expect(getByText('CO')).toBeTruthy();
});

it('renders the Epic pass label for epic resorts', () => {
  const { getByText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  expect(getByText('Epic')).toBeTruthy();
});

it('renders the Ikon pass label for ikon resorts', () => {
  const ikon = { ...base, pass_type: 'ikon' as const };
  const { getByText } = render(<ResortCard resort={ikon} />, { wrapper: TestWrapper });
  expect(getByText('Ikon')).toBeTruthy();
});

it('renders snow data when available', () => {
  const { getByText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  expect(getByText('42"')).toBeTruthy();
  expect(getByText('8"')).toBeTruthy();
});

it('renders "Snow data unavailable" when snow is null', () => {
  const noSnow = { ...base, snow: null };
  const { getByText } = render(<ResortCard resort={noSnow} />, { wrapper: TestWrapper });
  expect(getByText('Snow data unavailable')).toBeTruthy();
});

it('does not show lift counts, even when the API returns them', () => {
  const { queryByText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  expect(queryByText(/lifts/i)).toBeNull();
});

it('offers to save a mountain that is not saved yet', () => {
  const { getByLabelText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  fireEvent.press(getByLabelText('Save Vail to My mountains'));
  expect(mockToggleFavorite).toHaveBeenCalledWith('vail');
  expect(mockPush).not.toHaveBeenCalled();
});

it('offers to remove a mountain that is already saved', () => {
  mockFavoriteIds = ['vail'];
  const { getByLabelText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  fireEvent.press(getByLabelText('Remove Vail from My mountains'));
  expect(mockToggleFavorite).toHaveBeenCalledWith('vail');
});

it('renders crowd pill with label', () => {
  const { getByText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  expect(getByText('Medium')).toBeTruthy();
});

it('hides the crowd pill when there is no crowd data', () => {
  const noCrowd = { ...base, crowd: null };
  const { queryByText } = render(<ResortCard resort={noCrowd} />, { wrapper: TestWrapper });
  expect(queryByText('Medium')).toBeNull();
  expect(queryByText('—')).toBeNull();
});

it('hides the crowd pill when the resort is closed (no meaningful level)', () => {
  const closed = { ...base, crowd: { ...base.crowd!, current_level: 'closed' as any } };
  const { queryByText } = render(<ResortCard resort={closed} />, { wrapper: TestWrapper });
  expect(queryByText('—')).toBeNull();
});

it('shows stale indicator when snow.is_stale is true', () => {
  const stale = { ...base, snow: { ...base.snow!, is_stale: true } };
  const { getByText } = render(<ResortCard resort={stale} />, { wrapper: TestWrapper });
  expect(getByText(/Updated/)).toBeTruthy();
});

it('navigates to resort detail on press', () => {
  const { getByText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  fireEvent.press(getByText('Vail'));
  expect(mockPush).toHaveBeenCalledWith('/resort/vail');
});
