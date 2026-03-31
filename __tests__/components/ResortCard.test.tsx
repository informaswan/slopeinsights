import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ResortCard } from '../../components/ResortCard';
import type { ResortSummary } from '../../lib/types';
import { TestWrapper } from '../test-utils';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const base: ResortSummary = {
  id: 'vail', name: 'Vail', pass_type: 'epic', region: 'Colorado', state: 'CO',
  snow: { base_in: 42, new_24h_in: 8, scraped_at: '2026-03-16T10:00:00Z', is_stale: false },
  lifts: { open: 18, total: 31 }, trails: { open: 120, total: 195 },
  crowd: { current_level: 'medium', current_pct: 50, source: 'historical_pattern' },
};

beforeEach(() => mockPush.mockReset());

it('renders resort name and state', () => {
  const { getByText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  expect(getByText('Vail')).toBeTruthy();
  expect(getByText('CO')).toBeTruthy();
});

it('renders EPIC pass badge for epic resorts', () => {
  const { getByText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  expect(getByText('EPIC')).toBeTruthy();
});

it('renders IKON pass badge for ikon resorts', () => {
  const ikon = { ...base, pass_type: 'ikon' as const };
  const { getByText } = render(<ResortCard resort={ikon} />, { wrapper: TestWrapper });
  expect(getByText('IKON')).toBeTruthy();
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

it('renders lift counts when lifts are available', () => {
  const { getByText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  expect(getByText('18/31 lifts')).toBeTruthy();
});

it('omits lift counts when lifts is null', () => {
  const noLifts = { ...base, lifts: null };
  const { queryByText } = render(<ResortCard resort={noLifts} />, { wrapper: TestWrapper });
  expect(queryByText(/\d+\/\d+/)).toBeNull();
});

it('renders crowd pill with label', () => {
  const { getByText } = render(<ResortCard resort={base} />, { wrapper: TestWrapper });
  expect(getByText('Medium')).toBeTruthy();
});

it('renders em-dash crowd pill when crowd is null', () => {
  const noCrowd = { ...base, crowd: null };
  const { getByText } = render(<ResortCard resort={noCrowd} />, { wrapper: TestWrapper });
  expect(getByText('—')).toBeTruthy();
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
