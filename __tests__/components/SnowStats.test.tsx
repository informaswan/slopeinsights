// __tests__/components/SnowStats.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SnowStats } from '../../components/SnowStats';
import type { SnowDetail, TrailSummary } from '../../lib/types';

const snow: SnowDetail = {
  base_in: 42, new_24h_in: 8, new_48h_in: 14, new_7d_in: 22,
  surface: 'powder', scraped_at: '2026-03-16T10:00:00Z', is_stale: false,
};

const trails: TrailSummary = { open: 120, total: 195 };

it('renders all four snow stat labels', () => {
  const { getByText } = render(<SnowStats snow={snow} trails={null} />);
  expect(getByText('Base')).toBeTruthy();
  expect(getByText('24h')).toBeTruthy();
  expect(getByText('48h')).toBeTruthy();
  expect(getByText('7-day')).toBeTruthy();
});

it('renders snow values in inches', () => {
  const { getByText } = render(<SnowStats snow={snow} trails={null} />);
  expect(getByText('42"')).toBeTruthy();
  expect(getByText('8"')).toBeTruthy();
  expect(getByText('14"')).toBeTruthy();
  expect(getByText('22"')).toBeTruthy();
});

it('shows "Snow data unavailable" when snow is null', () => {
  const { getByText } = render(<SnowStats snow={null} trails={null} />);
  expect(getByText('Snow data unavailable')).toBeTruthy();
});

it('shows stale indicator when is_stale is true', () => {
  const stale = { ...snow, is_stale: true };
  const { getByText } = render(<SnowStats snow={stale} trails={null} />);
  expect(getByText(/Updated/)).toBeTruthy();
});

it('does not show stale indicator when is_stale is false', () => {
  const { queryByText } = render(<SnowStats snow={snow} trails={null} />);
  expect(queryByText(/Updated/)).toBeNull();
});

it('renders trail count when trails is provided', () => {
  const { getByText } = render(<SnowStats snow={snow} trails={trails} />);
  expect(getByText('120/195 trails open')).toBeTruthy();
});

it('omits trail count when trails is null', () => {
  const { queryByText } = render(<SnowStats snow={snow} trails={null} />);
  expect(queryByText(/trails open/)).toBeNull();
});
