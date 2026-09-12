import React from 'react';
import { render } from '@testing-library/react-native';
import { LiftList } from '../../components/LiftList';
import type { LiftDetail } from '../../lib/types';
import { TestWrapper } from '../test-utils';

const lifts: LiftDetail = {
  open: 13,
  total: 18,
  scraped_at: '2026-03-16T10:05:00Z',
  is_stale: false,
  items: [
    { name: 'Thunder Express', status: 'open' },
    { name: 'Bridger Gondola', status: 'open' },
    { name: 'Apres Vous', status: 'closed' },
    { name: 'Teewinot', status: 'on-hold' },
    { name: 'Aerial Tram', status: 'open' },
  ],
};

it('renders "Lift data unavailable" when lifts is null', () => {
  const { getByText } = render(<LiftList lifts={null} />, { wrapper: TestWrapper });
  expect(getByText('Lift data unavailable')).toBeTruthy();
});

it('renders open/total count in section header', () => {
  const { getByText } = render(<LiftList lifts={lifts} />, { wrapper: TestWrapper });
  expect(getByText('13/18 lifts open')).toBeTruthy();
});

it('renders all lift names', () => {
  const { getByText } = render(<LiftList lifts={lifts} />, { wrapper: TestWrapper });
  expect(getByText('Thunder Express')).toBeTruthy();
  expect(getByText('Bridger Gondola')).toBeTruthy();
  expect(getByText('Apres Vous')).toBeTruthy();
  expect(getByText('Teewinot')).toBeTruthy();
  expect(getByText('Aerial Tram')).toBeTruthy();
});

it('shows stale note when is_stale is true', () => {
  const stale = { ...lifts, is_stale: true };
  const { getByText } = render(<LiftList lifts={stale} />, { wrapper: TestWrapper });
  expect(getByText(/outdated/i)).toBeTruthy();
});

it('does not show stale note when is_stale is false', () => {
  const { queryByText } = render(<LiftList lifts={lifts} />, { wrapper: TestWrapper });
  expect(queryByText(/outdated/i)).toBeNull();
});

it('renders gondola lifts before non-gondola lifts', () => {
  const { getAllByTestId } = render(<LiftList lifts={lifts} />, { wrapper: TestWrapper });
  const items = getAllByTestId('lift-item');
  const names = items.map((el) => el.props.children?.[1]?.props?.children ?? '');
  const gondolaIdx = names.findIndex((n: string) => n.includes('Gondola') || n.includes('Tram'));
  const otherIdx = names.findIndex((n: string) => !n.includes('Gondola') && !n.includes('Tram'));
  expect(gondolaIdx).toBeLessThan(otherIdx);
});
