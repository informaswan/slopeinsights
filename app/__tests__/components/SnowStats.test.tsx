// __tests__/components/SnowStats.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SnowStats } from '../../components/SnowStats';
import type { SnowDetail, TrailSummary } from '../../lib/types';
import { TestWrapper } from '../test-utils';

const snow: SnowDetail = {
  base_in: 42, new_24h_in: 8, new_48h_in: 14, new_7d_in: 22,
  surface: 'powder', scraped_at: '2026-03-16T10:00:00Z', is_stale: false,
};

const trails: TrailSummary = { open: 120, total: 195 };

it('renders all four snow stat labels', () => {
  const { getByText } = render(<SnowStats snow={snow} trails={null} />, { wrapper: TestWrapper });
  expect(getByText('Base')).toBeTruthy();
  expect(getByText('Past 24h')).toBeTruthy();
  expect(getByText('Past 48h')).toBeTruthy();
  expect(getByText('Past 72h')).toBeTruthy();
});

it('renders snow values in inches', () => {
  const { getByText } = render(<SnowStats snow={snow} trails={null} />, { wrapper: TestWrapper });
  expect(getByText('42"')).toBeTruthy();
  expect(getByText('8"')).toBeTruthy();
  expect(getByText('14"')).toBeTruthy();
  expect(getByText('22"')).toBeTruthy();
});

it('shows "Snow data unavailable" when snow is null', () => {
  const { getByText } = render(<SnowStats snow={null} trails={null} />, { wrapper: TestWrapper });
  expect(getByText('Snow data unavailable')).toBeTruthy();
});

it('shows stale indicator when is_stale is true', () => {
  const stale = { ...snow, is_stale: true };
  const { getByText } = render(<SnowStats snow={stale} trails={null} />, { wrapper: TestWrapper });
  expect(getByText(/Updated/)).toBeTruthy();
});

it('does not show stale indicator when is_stale is false', () => {
  const { queryByText } = render(<SnowStats snow={snow} trails={null} />, { wrapper: TestWrapper });
  expect(queryByText(/Updated/)).toBeNull();
});

it('renders trail count when trails is provided', () => {
  const { getByText } = render(<SnowStats snow={snow} trails={trails} />, { wrapper: TestWrapper });
  expect(getByText('120/195 trails open')).toBeTruthy();
});

it('omits trail count when trails is null', () => {
  const { queryByText } = render(<SnowStats snow={snow} trails={null} />, { wrapper: TestWrapper });
  expect(queryByText(/trails open/)).toBeNull();
});

it('omits trail count when trails.open is null', () => {
  const { queryByText } = render(<SnowStats snow={snow} trails={{ open: null as any, total: 195 }} />, { wrapper: TestWrapper });
  expect(queryByText(/trails open/)).toBeNull();
});

it('renders stale indicator with fallback when scraped_at is null', () => {
  const stale = { ...snow, is_stale: true, scraped_at: null as any };
  const { getByText } = render(<SnowStats snow={stale} trails={null} />, { wrapper: TestWrapper });
  expect(getByText(/Updated/)).toBeTruthy();
});

const forecast = { next_24h_in: 3.5, next_48h_in: 6, next_72h_in: 9.5, scraped_at: '2026-03-16T10:00:00Z', is_stale: false };

it('labels reported snow and forecast snow separately', () => {
  const { getByText } = render(<SnowStats snow={snow} trails={null} forecast={forecast} />, { wrapper: TestWrapper });
  expect(getByText('Fell (reported by the resort)')).toBeTruthy();
  expect(getByText('Expected (weather forecast)')).toBeTruthy();
});

it('shows expected snow for the next 24, 48 and 72 hours', () => {
  const { getByText } = render(<SnowStats snow={snow} trails={null} forecast={forecast} />, { wrapper: TestWrapper });
  expect(getByText('Next 24h')).toBeTruthy();
  expect(getByText('Next 48h')).toBeTruthy();
  expect(getByText('Next 72h')).toBeTruthy();
  expect(getByText('3.5"')).toBeTruthy();
  expect(getByText('6"')).toBeTruthy();
  expect(getByText('9.5"')).toBeTruthy();
});

it('says when there is no forecast for a mountain (e.g. outside the US)', () => {
  const { getByText } = render(<SnowStats snow={snow} trails={null} forecast={null} />, { wrapper: TestWrapper });
  expect(getByText('Snow forecast not available for this mountain')).toBeTruthy();
});

it('still shows the forecast when the resort has no snow report', () => {
  const { getByText } = render(<SnowStats snow={null} trails={null} forecast={forecast} />, { wrapper: TestWrapper });
  expect(getByText('Snow data unavailable')).toBeTruthy();
  expect(getByText('Next 24h')).toBeTruthy();
});
