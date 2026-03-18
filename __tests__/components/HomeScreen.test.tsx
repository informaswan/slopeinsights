import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const BottomSheet = React.forwardRef(({ children }: any, _ref: any) => <View testID="bottom-sheet">{children}</View>);
  BottomSheet.displayName = 'BottomSheet';
  return { default: BottomSheet };
});

const mockResorts = [
  { id: 'vail', name: 'Vail', pass_type: 'epic', region: 'Colorado', state: 'CO',
    snow: { base_in: 40, new_24h_in: 5, scraped_at: null, is_stale: false },
    lifts: { open: 15, total: 31 }, trails: null, crowd: { current_level: 'medium', current_pct: 55, source: '' } },
  { id: 'mammoth', name: 'Mammoth', pass_type: 'ikon', region: 'California', state: 'CA',
    snow: null, lifts: null, trails: null, crowd: null },
];
const mockBest = { resorts: [mockResorts[0]], generated_at: '' };

beforeEach(() => {
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

it('renders Best Conditions Today banner', async () => {
  const { findByText } = render(<HomeScreen />);
  expect(await findByText('Best Conditions Today')).toBeTruthy();
});

it('filters to Epic resorts when Epic tab is pressed', async () => {
  const { findByText, queryByText } = render(<HomeScreen />);
  const epicTab = await findByText('Epic');
  fireEvent.press(epicTab);
  expect(queryByText('Mammoth')).toBeNull();
  expect(queryByText('Vail')).toBeTruthy();
});

it('filters to Ikon resorts when Ikon tab is pressed', async () => {
  const { findByText, queryByText } = render(<HomeScreen />);
  const ikonTab = await findByText('Ikon');
  fireEvent.press(ikonTab);
  expect(queryByText('Vail')).toBeNull();
  expect(queryByText('Mammoth')).toBeTruthy();
});

it('shows error state with retry on fetch failure', async () => {
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
  const { findByText } = render(<HomeScreen />);
  expect(await findByText('Tap to retry')).toBeTruthy();
});
