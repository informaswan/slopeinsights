import React from 'react';
import { render } from '@testing-library/react-native';
import { CrowdChart } from '../../components/CrowdChart';
import type { CrowdDetail } from '../../lib/types';

const crowd: CrowdDetail = {
  current_level: 'high',
  current_pct: 82,
  source: 'historical_pattern',
  label: 'Typically busiest 10am–2pm on Saturdays',
  hourly_start: '08:00',
  hourly: [10, 5, 40, 90, 100, 82, 70, 50, 30, 15],
};

it('renders "Crowd data unavailable" when crowd is null', () => {
  const { getByText } = render(<CrowdChart crowd={null} currentHourIndex={null} />);
  expect(getByText('Crowd data unavailable')).toBeTruthy();
});

it('renders the crowd label', () => {
  const { getByText } = render(<CrowdChart crowd={crowd} currentHourIndex={2} />);
  expect(getByText('Typically busiest 10am–2pm on Saturdays')).toBeTruthy();
});

it('renders the disclaimer', () => {
  const { getByText } = render(<CrowdChart crowd={crowd} currentHourIndex={null} />);
  expect(getByText('Based on typical crowd patterns — not a live count')).toBeTruthy();
});

it('renders 10 x-axis time labels', () => {
  const { getByText } = render(<CrowdChart crowd={crowd} currentHourIndex={null} />);
  expect(getByText('8a')).toBeTruthy();
  expect(getByText('12p')).toBeTruthy();
  expect(getByText('5p')).toBeTruthy();
});

it('renders 10 bar elements', () => {
  const { getAllByTestId } = render(<CrowdChart crowd={crowd} currentHourIndex={null} />);
  expect(getAllByTestId('crowd-bar')).toHaveLength(10);
});

it('marks the current hour bar as highlighted', () => {
  const { getAllByTestId } = render(<CrowdChart crowd={crowd} currentHourIndex={3} />);
  const bars = getAllByTestId('crowd-bar');
  expect(bars[3].props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ opacity: 1 })])
  );
});

it('omits label when crowd.label is null', () => {
  const noLabel = { ...crowd, label: null };
  const { queryByText } = render(<CrowdChart crowd={noLabel as any} currentHourIndex={null} />);
  expect(queryByText('Typically busiest')).toBeNull();
});
