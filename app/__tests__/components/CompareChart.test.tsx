import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CompareChart } from '../../components/CompareChart';
import type { ResortSummary } from '../../lib/types';
import { TestWrapper } from '../test-utils';

const mk = (id: string, name: string, base: number, d24: number): ResortSummary => ({
  id, name, pass_type: 'epic', region: 'Colorado', state: 'CO',
  snow: { base_in: base, new_24h_in: d24, new_48h_in: d24 * 2, new_7d_in: d24 * 3, scraped_at: null, is_stale: false },
  snow_forecast: { next_24h_in: 1, next_48h_in: 2, next_72h_in: 3 },
  lifts: null, trails: { open: 10, total: 20 },
});
const resorts = ['A', 'B', 'C', 'D', 'E', 'F'].map((n, i) => mk(n.toLowerCase(), `Mtn ${n}`, 20 * (i + 1), i));

const renderChart = () => render(<CompareChart resorts={resorts} />, { wrapper: TestWrapper });

it('starts with three mountains and base depth', () => {
  const { getByTestId, queryByTestId, getByText } = renderChart();
  expect(getByTestId('bar-a')).toBeTruthy();
  expect(getByTestId('bar-c')).toBeTruthy();
  expect(queryByTestId('bar-d')).toBeNull();
  expect(getByText('60"')).toBeTruthy(); // Mtn C base
});

it('lets you add up to five and no more', () => {
  const { getByLabelText, queryByTestId, getByTestId } = renderChart();
  fireEvent.press(getByLabelText('Compare Mtn D'));
  fireEvent.press(getByLabelText('Compare Mtn E'));
  expect(getByTestId('bar-e')).toBeTruthy();
  fireEvent.press(getByLabelText('Compare Mtn F'));
  expect(queryByTestId('bar-f')).toBeNull();
});

it('switches the measure', () => {
  const { getByLabelText, getAllByText } = renderChart();
  fireEvent.press(getByLabelText('Compare Expected next 72h'));
  expect(getAllByText('3"')).toHaveLength(3);
});

it('removes a mountain', () => {
  const { getByLabelText, queryByTestId } = renderChart();
  fireEvent.press(getByLabelText('Remove Mtn A'));
  expect(queryByTestId('bar-a')).toBeNull();
});
