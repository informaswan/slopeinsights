import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ id: 'jackson-hole' })),
  useRouter: jest.fn(() => ({ back: jest.fn() })),
  useNavigation: jest.fn(() => ({ setOptions: jest.fn() })),
  Stack: { Screen: () => null },
}));
jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return {
    useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: jest.fn() }),
    ThemeProvider: ({ children }: any) => children,
  };
});
jest.mock('expo-video', () => ({
  VideoView: () => null,
  useVideoPlayer: jest.fn(() => ({ play: jest.fn(), addListener: jest.fn(() => ({ remove: jest.fn() })) })),
}));
jest.mock('expo-linking', () => ({ openURL: jest.fn() }));
jest.mock('../../components/WebcamViewer', () => ({
  WebcamViewer: ({ webcams }: any) => {
    const { View, Text } = require('react-native');
    return <View testID="webcam-viewer"><Text>{webcams?.length ?? 0} cams</Text></View>;
  },
}));
jest.mock('../../hooks/useResortDetail', () => ({ useResortDetail: jest.fn() }));

import { useResortDetail } from '../../hooks/useResortDetail';
import ResortDetail from '../../app/resort/[id]';

const mockResort = {
  id: 'jackson-hole', name: 'Jackson Hole', pass_type: 'ikon' as const,
  region: 'Wyoming', state: 'WY', country: 'US',
  summit_elevation_ft: 10450, vertical_drop_ft: 4139,
  website: 'https://www.jacksonhole.com',
  snow: { base_in: 42, new_24h_in: 12, new_48h_in: 18, new_7d_in: 26,
    surface: 'powder', scraped_at: '2026-03-15T10:00:00Z', is_stale: false },
  lifts: { open: 13, total: 18, scraped_at: '2026-03-15T10:05:00Z', is_stale: false,
    items: [{ name: 'Aerial Tram', status: 'open' as const }, { name: 'Thunder Express', status: 'closed' as const }] },
  trails: { open: 120, total: 131 },
  crowd: { current_level: 'high', current_pct: 82, source: 'historical_pattern',
    label: 'Typically busiest 10am–2pm on Saturdays', hourly_start: '08:00',
    hourly: [10, 5, 40, 90, 100, 82, 70, 50, 30, 15] },
  weather: { scraped_at: '2026-03-15T09:00:00Z', is_stale: false,
    forecast: [{ date: '2026-03-15', high_f: 28, low_f: 14, precip_pct: 20, snow_in_forecast: false, wind_mph: 12 }] },
  webcams: [{ label: 'Rendezvous Bowl', cam_type: 'hls' as const, url: 'https://example.com/stream.m3u8', is_alive: true }],
  parking: { has_live_data: true, scraped_at: '2026-03-15T10:10:00Z', is_stale: false,
    live_lots: [{ name: 'Lot A', status: 'open', capacity_pct: null }],
    static_lots: [{ name: 'Lot A', distance_ft: 200, cost: 'Free', directions_url: 'https://maps.google.com/' }] },
};

describe('ResortDetail screen — loaded', () => {
  beforeEach(() => {
    (useResortDetail as jest.Mock).mockReturnValue({ resort: mockResort, loading: false, error: null, refresh: jest.fn() });
  });

  it('renders resort name, pass badge, and region in header', () => {
    render(<ResortDetail />);
    expect(screen.getByText('Jackson Hole')).toBeTruthy();
    expect(screen.getByText('Ikon')).toBeTruthy();
    expect(screen.getByText(/Wyoming/)).toBeTruthy();
  });

  it('renders snow stats section', () => {
    render(<ResortDetail />);
    expect(screen.getByTestId('snow-stats')).toBeTruthy();
  });

  it('renders crowd chart section', () => {
    render(<ResortDetail />);
    expect(screen.getByTestId('crowd-chart')).toBeTruthy();
  });

  it('renders weather section', () => {
    render(<ResortDetail />);
    expect(screen.getByTestId('weather-row')).toBeTruthy();
  });

  it('renders lift list section', () => {
    render(<ResortDetail />);
    expect(screen.getByTestId('lift-list')).toBeTruthy();
  });

  it('renders parking section', () => {
    render(<ResortDetail />);
    expect(screen.getByTestId('parking-section')).toBeTruthy();
  });

  it('renders summit elevation, vertical drop, and website in resort info', () => {
    render(<ResortDetail />);
    expect(screen.getByText(/10,450/)).toBeTruthy();
    expect(screen.getByText(/4,139/)).toBeTruthy();
    expect(screen.getByText(/jacksonhole\.com/)).toBeTruthy();
  });
});

describe('ResortDetail screen — loading + error states', () => {
  it('shows ActivityIndicator while loading', () => {
    (useResortDetail as jest.Mock).mockReturnValue({ resort: null, loading: true, error: null, refresh: jest.fn() });
    render(<ResortDetail />);
    expect(screen.getByTestId('detail-loading')).toBeTruthy();
  });

  it('shows error message and Tap to retry button on error', () => {
    (useResortDetail as jest.Mock).mockReturnValue({ resort: null, loading: false, error: 'Failed to load resort', refresh: jest.fn() });
    render(<ResortDetail />);
    expect(screen.getByText('Failed to load resort')).toBeTruthy();
    expect(screen.getByText('Tap to retry')).toBeTruthy();
  });

  it('calls refresh when retry is tapped', () => {
    const mockRefresh = jest.fn();
    (useResortDetail as jest.Mock).mockReturnValue({ resort: null, loading: false, error: 'Failed to load resort', refresh: mockRefresh });
    render(<ResortDetail />);
    fireEvent.press(screen.getByText('Tap to retry'));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
