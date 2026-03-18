import React from 'react';
import { render } from '@testing-library/react-native';
import { WeatherRow } from '../../components/WeatherRow';
import type { WeatherDetail } from '../../lib/types';

const weather: WeatherDetail = {
  scraped_at: '2026-03-16T09:00:00Z',
  is_stale: false,
  forecast: [
    { date: '2026-03-16', high_f: 28, low_f: 14, precip_pct: 20, snow_in_forecast: false, wind_mph: 12 },
    { date: '2026-03-17', high_f: 22, low_f: 8,  precip_pct: 80, snow_in_forecast: true,  wind_mph: 25 },
    { date: '2026-03-18', high_f: 30, low_f: 18, precip_pct: 10, snow_in_forecast: false, wind_mph: 8  },
  ],
};

it('renders "Weather data unavailable" when weather is null', () => {
  const { getByText } = render(<WeatherRow weather={null} />);
  expect(getByText('Weather data unavailable')).toBeTruthy();
});

it('renders high and low temps for each forecast day', () => {
  const { getByText } = render(<WeatherRow weather={weather} />);
  expect(getByText('28°')).toBeTruthy();
  expect(getByText('14°')).toBeTruthy();
  expect(getByText('22°')).toBeTruthy();
});

it('renders precipitation percentages', () => {
  const { getByText } = render(<WeatherRow weather={weather} />);
  expect(getByText('20%')).toBeTruthy();
  expect(getByText('80%')).toBeTruthy();
});

it('renders wind speeds', () => {
  const { getByText } = render(<WeatherRow weather={weather} />);
  expect(getByText('12 mph')).toBeTruthy();
  expect(getByText('25 mph')).toBeTruthy();
});

it('renders snow icon ❄ only on days with snow in forecast', () => {
  const { getAllByText } = render(<WeatherRow weather={weather} />);
  expect(getAllByText('❄')).toHaveLength(1);
});

it('renders "Today" label for the first forecast card', () => {
  const { getByText } = render(<WeatherRow weather={weather} />);
  expect(getByText('Today')).toBeTruthy();
});

it('renders "Tomorrow" label for the second forecast card', () => {
  const { getByText } = render(<WeatherRow weather={weather} />);
  expect(getByText('Tomorrow')).toBeTruthy();
});

it('shows stale warning note when is_stale is true', () => {
  const stale = { ...weather, is_stale: true };
  const { getByText } = render(<WeatherRow weather={stale} />);
  expect(getByText('Weather data may be outdated')).toBeTruthy();
});

it('does not show stale note when is_stale is false', () => {
  const { queryByText } = render(<WeatherRow weather={weather} />);
  expect(queryByText('Weather data may be outdated')).toBeNull();
});
