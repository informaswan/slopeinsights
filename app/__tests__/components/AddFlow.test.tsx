import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../app/index';
import AllMountainsScreen from '../../app/all';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoritesProvider } from '../../contexts/FavoritesContext';

const FAVORITES_KEY = 'slopeinsights_favorites';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const BottomSheet = React.forwardRef(({ children }: any, _ref: any) => <View>{children}</View>);
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

const resort = (id: string, name: string) => ({
  id, name, pass_type: 'epic', region: 'Colorado', state: 'CO',
  snow: null, lifts: null, trails: null,
});
const resorts = [resort('vail', 'Vail'), resort('keystone', 'Keystone'), resort('breckenridge', 'Breckenridge')];

jest.setTimeout(40000);

beforeEach(() => mockPush.mockClear());

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => resorts })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ resorts: [], generated_at: '' }) });
});

it('keeps the finder open after the first Add, so several can be picked, until Done', async () => {
  const { findByLabelText, queryByLabelText, getByText } = render(<FavoritesProvider><HomeScreen /></FavoritesProvider>);
  fireEvent.press(await findByLabelText('Save Vail to My mountains', {}, { timeout: 10000 }));
  await waitFor(() => expect(queryByLabelText('Remove Vail from My mountains')).toBeTruthy());
  expect(getByText('Done · 1 added')).toBeTruthy(); // floating Done, always on screen
  // still in the finder: the other mountains can be added too
  fireEvent.press(await findByLabelText('Save Keystone to My mountains'));
  await waitFor(() => expect(queryByLabelText('Remove Keystone from My mountains')).toBeTruthy());
  expect(queryByLabelText('Find a mountain')).toBeTruthy();
  expect(getByText('Done · 2 added')).toBeTruthy();
  fireEvent.press(await findByLabelText('Done adding mountains'));
  expect(queryByLabelText('Find a mountain')).toBeNull();
});

it('on All mountains, shows a floating Done once something is added, and it goes to My mountains', async () => {
  const { findByLabelText, queryByLabelText, getByText } = render(<FavoritesProvider><AllMountainsScreen /></FavoritesProvider>);
  expect(queryByLabelText('Done adding mountains')).toBeNull(); // nothing added yet
  fireEvent.press(await findByLabelText('Save Vail to My mountains', {}, { timeout: 10000 }));
  await waitFor(() => expect(getByText('Done · 1 added')).toBeTruthy());
  fireEvent.press(await findByLabelText('Save Keystone to My mountains'));
  await waitFor(() => expect(getByText('Done · 2 added')).toBeTruthy());
  fireEvent.press(await findByLabelText('Done adding mountains'));
  expect(mockPush).toHaveBeenCalledWith('/');
});

it('keeps the finder open after the first Add even when My mountains was emptied after an earlier visit', async () => {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(['vail']));
  const { findByLabelText, queryByLabelText, getByText } = render(<FavoritesProvider><HomeScreen /></FavoritesProvider>);
  // one saved mountain: the dashboard, not the finder
  fireEvent.press(await findByLabelText('Remove Vail from My mountains', {}, { timeout: 10000 }));
  // now nothing is saved, so the finder is back; adding the first one must not close it
  fireEvent.press(await findByLabelText('Save Keystone to My mountains', {}, { timeout: 10000 }));
  await waitFor(() => expect(getByText('Done · 1 added')).toBeTruthy());
  fireEvent.press(await findByLabelText('Save Vail to My mountains'));
  await waitFor(() => expect(getByText('Done · 2 added')).toBeTruthy());
  expect(queryByLabelText('Find a mountain')).toBeTruthy();
});
