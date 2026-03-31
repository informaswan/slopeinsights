import React from 'react';
import { render } from '@testing-library/react-native';
import { BestBanner } from '../../components/BestBanner';
import type { ResortSummary } from '../../lib/types';
import { TestWrapper } from '../test-utils';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const resort: ResortSummary = {
  id: 'jackson-hole', name: 'Jackson Hole', pass_type: 'ikon', region: 'Wyoming', state: 'WY',
  snow: { base_in: 60, new_24h_in: 14, scraped_at: null, is_stale: false },
  lifts: { open: 13, total: 18 }, trails: null,
  crowd: { current_level: 'low', current_pct: 15, source: 'historical_pattern' },
};

it('renders "Best Conditions Today" heading', () => {
  const { getByText } = render(<BestBanner resorts={[resort]} />, { wrapper: TestWrapper });
  expect(getByText('Best Conditions Today')).toBeTruthy();
});

it('renders resort name in banner card', () => {
  const { getByText } = render(<BestBanner resorts={[resort]} />, { wrapper: TestWrapper });
  expect(getByText('Jackson Hole')).toBeTruthy();
});

it('renders snowfall in banner card', () => {
  const { getByText } = render(<BestBanner resorts={[resort]} />, { wrapper: TestWrapper });
  expect(getByText('14"')).toBeTruthy();
});

it('renders pass type label in banner card', () => {
  const { getByText } = render(<BestBanner resorts={[resort]} />, { wrapper: TestWrapper });
  expect(getByText('IKON')).toBeTruthy();
});

it('renders "No snow data" when new_24h_in is null', () => {
  const noSnow = { ...resort, snow: { base_in: null, new_24h_in: null, scraped_at: null, is_stale: false } };
  const { getByText } = render(<BestBanner resorts={[noSnow]} />, { wrapper: TestWrapper });
  expect(getByText('No snow data')).toBeTruthy();
});

it('returns null when resorts array is empty', () => {
  const { toJSON } = render(<BestBanner resorts={[]} />, { wrapper: TestWrapper });
  expect(toJSON()).toBeNull();
});
