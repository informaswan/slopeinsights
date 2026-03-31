import React from 'react';
import { render } from '@testing-library/react-native';
import { ParkingSection } from '../../components/ParkingSection';
import type { ParkingDetail } from '../../lib/types';
import { TestWrapper } from '../test-utils';

jest.mock('expo-linking', () => ({ openURL: jest.fn() }));

const parkingLive: ParkingDetail = {
  has_live_data: true,
  scraped_at: '2026-03-16T10:10:00Z',
  is_stale: false,
  live_lots: [
    { name: 'Lot A', status: 'open', capacity_pct: null },
    { name: 'Tram Garage', status: 'full', capacity_pct: 100 },
  ],
  static_lots: [
    { name: 'Lot A', distance_ft: 200, cost: 'Free', directions_url: 'https://maps.google.com/lotA' },
  ],
};

const parkingStatic: ParkingDetail = {
  has_live_data: false,
  scraped_at: null,
  is_stale: false,
  live_lots: [],
  static_lots: [
    { name: 'Main Lot', distance_ft: 400, cost: '$25', directions_url: 'https://maps.google.com/main' },
  ],
};

const parkingEmpty: ParkingDetail = {
  has_live_data: false,
  scraped_at: null,
  is_stale: false,
  live_lots: [],
  static_lots: [],
};

it('renders live lot names and statuses when has_live_data is true', () => {
  const { getByText } = render(<ParkingSection parking={parkingLive} />, { wrapper: TestWrapper });
  expect(getByText('Lot A')).toBeTruthy();
  expect(getByText('open')).toBeTruthy();
  expect(getByText('Tram Garage')).toBeTruthy();
  expect(getByText('full')).toBeTruthy();
});

it('renders capacity percentage when available', () => {
  const { getByText } = render(<ParkingSection parking={parkingLive} />, { wrapper: TestWrapper });
  expect(getByText('100%')).toBeTruthy();
});

it('shows stale warning when has_live_data and is_stale', () => {
  const stale = { ...parkingLive, is_stale: true };
  const { getByText } = render(<ParkingSection parking={stale} />, { wrapper: TestWrapper });
  expect(getByText('Live parking data temporarily unavailable')).toBeTruthy();
});

it('renders static lot info when has_live_data is false', () => {
  const { getByText } = render(<ParkingSection parking={parkingStatic} />, { wrapper: TestWrapper });
  expect(getByText('Main Lot')).toBeTruthy();
  expect(getByText('400 ft')).toBeTruthy();
  expect(getByText('$25')).toBeTruthy();
});

it('renders Get Directions button for static lots', () => {
  const { getByText } = render(<ParkingSection parking={parkingStatic} />, { wrapper: TestWrapper });
  expect(getByText('Get Directions')).toBeTruthy();
});

it('shows "No parking info available" when no live data and no static lots', () => {
  const { getByText } = render(<ParkingSection parking={parkingEmpty} />, { wrapper: TestWrapper });
  expect(getByText('No parking info available')).toBeTruthy();
});
