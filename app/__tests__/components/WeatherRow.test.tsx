import React from 'react';
import { render } from '@testing-library/react-native';
import { WeatherRow } from '../../components/WeatherRow';
import type { WeatherDetail } from '../../lib/types';
import { TestWrapper } from '../test-utils';

// Pin "now" to Monday 2026-03-16 noon (local) so date-based labels are deterministic.
const NOW = new Date(2026, 2, 16, 12, 0, 0);
beforeEach(() => jest.useFakeTimers({ now: NOW }));
afterEach(() => jest.useRealTimers());

const weather: WeatherDetail = {
  scraped_at: new Date(2026, 2, 16, 11, 35, 0).toISOString(),
  is_stale: false,
  forecast: [
    { date: '2026-03-16', high_f: 28, low_f: 14, precip_pct: 20, snow_in_forecast: false, wind_mph: 12 },
    { date: '2026-03-17', high_f: 22, low_f: 8,  precip_pct: 80, snow_in_forecast: true,  wind_mph: 25 },
    { date: '2026-03-18', high_f: 30, low_f: 18, precip_pct: 10, snow_in_forecast: false, wind_mph: 8  },
  ],
};

it('renders "Weather data unavailable" when weather is null', () => {
  const { getByText } = render(<WeatherRow weather={null} />, { wrapper: TestWrapper });
  expect(getByText('Weather data unavailable')).toBeTruthy();
});

it('renders high and low temps for each forecast day', () => {
  const { getByText } = render(<WeatherRow weather={weather} />, { wrapper: TestWrapper });
  expect(getByText('28°')).toBeTruthy();
  expect(getByText('14°')).toBeTruthy();
  expect(getByText('22°')).toBeTruthy();
});

it('renders precipitation percentages', () => {
  const { getByText } = render(<WeatherRow weather={weather} />, { wrapper: TestWrapper });
  expect(getByText('20%')).toBeTruthy();
  expect(getByText('80%')).toBeTruthy();
});

it('renders wind speeds', () => {
  const { getByText } = render(<WeatherRow weather={weather} />, { wrapper: TestWrapper });
  expect(getByText('12 mph')).toBeTruthy();
  expect(getByText('25 mph')).toBeTruthy();
});

it('flags only the days with snow in the forecast', () => {
  const { getAllByText } = render(<WeatherRow weather={weather} />, { wrapper: TestWrapper });
  expect(getAllByText('Snow')).toHaveLength(1);
});

it('renders "Today" label for the first forecast card', () => {
  const { getByText } = render(<WeatherRow weather={weather} />, { wrapper: TestWrapper });
  expect(getByText('Today')).toBeTruthy();
});

it('renders "Tomorrow" label for the second forecast card', () => {
  const { getByText } = render(<WeatherRow weather={weather} />, { wrapper: TestWrapper });
  expect(getByText('Tomorrow')).toBeTruthy();
});

it('shows stale warning note when is_stale is true', () => {
  const stale = { ...weather, is_stale: true };
  const { getByText } = render(<WeatherRow weather={stale} />, { wrapper: TestWrapper });
  expect(getByText('Weather data may be outdated')).toBeTruthy();
});

it('does not show stale note when is_stale is false', () => {
  const { queryByText } = render(<WeatherRow weather={weather} />, { wrapper: TestWrapper });
  expect(queryByText('Weather data may be outdated')).toBeNull();
});

it('shows the real date on every forecast day', () => {
  const { getByText } = render(<WeatherRow weather={weather} />, { wrapper: TestWrapper });
  expect(getByText('Mar 16')).toBeTruthy();
  expect(getByText('Mar 17')).toBeTruthy();
  expect(getByText('Mar 18')).toBeTruthy();
});

it('uses the weekday for days after tomorrow', () => {
  const { getByText } = render(<WeatherRow weather={weather} />, { wrapper: TestWrapper });
  expect(getByText('Wed')).toBeTruthy();
});

it('never labels an old forecast as Today or Tomorrow', () => {
  jest.setSystemTime(new Date(2026, 2, 20, 12, 0, 0));
  const { queryByText, getByText } = render(<WeatherRow weather={weather} />, { wrapper: TestWrapper });
  expect(queryByText('Today')).toBeNull();
  expect(queryByText('Tomorrow')).toBeNull();
  expect(getByText('Mon')).toBeTruthy();
  expect(getByText('Mar 16')).toBeTruthy();
});

it('shows when the forecast was last updated', () => {
  const { getByText } = render(<WeatherRow weather={weather} />, { wrapper: TestWrapper });
  expect(getByText('Updated 25m ago')).toBeTruthy();
});

it('shows how old the data is, in days, when it is far out of date', () => {
  const old = { ...weather, is_stale: true, scraped_at: new Date(2026, 2, 13, 12, 0, 0).toISOString() };
  const { getByText } = render(<WeatherRow weather={old} />, { wrapper: TestWrapper });
  expect(getByText('Updated 3d ago')).toBeTruthy();
  expect(getByText('Weather data may be outdated')).toBeTruthy();
});

it('says so when the update time is unknown', () => {
  const unknown = { ...weather, scraped_at: null };
  const { getByText } = render(<WeatherRow weather={unknown} />, { wrapper: TestWrapper });
  expect(getByText('Update time unknown')).toBeTruthy();
});
