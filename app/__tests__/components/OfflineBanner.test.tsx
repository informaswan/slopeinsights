import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OfflineBanner } from '../../components/OfflineBanner';
import { TestWrapper } from '../test-utils';

const NOW = 1_800_000_000_000;
beforeEach(() => jest.spyOn(Date, 'now').mockReturnValue(NOW));
afterEach(() => jest.restoreAllMocks());

it('renders nothing when the data is live', () => {
  render(<OfflineBanner cachedAt={null} />, { wrapper: TestWrapper });
  expect(screen.queryByTestId('offline-banner')).toBeNull();
});

it('says the data is saved and how old it is', () => {
  render(<OfflineBanner cachedAt={NOW - 20 * 60_000} />, { wrapper: TestWrapper });
  expect(screen.getByTestId('offline-banner')).toBeTruthy();
  expect(screen.getByText(/Offline — showing saved data from 20m ago/)).toBeTruthy();
});

it('handles data saved hours ago', () => {
  render(<OfflineBanner cachedAt={NOW - 3 * 3_600_000} />, { wrapper: TestWrapper });
  expect(screen.getByText(/from 3h ago/)).toBeTruthy();
});
