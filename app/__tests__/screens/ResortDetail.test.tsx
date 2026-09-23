import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ id: 'jackson-hole' })),
  useRouter: jest.fn(() => ({ push: mockPush })),
}));
const mockToggleFavorite = jest.fn();
let mockFavoriteIds: string[] = [];
jest.mock('../../contexts/FavoritesContext', () => ({
  useFavorites: () => ({ favoriteIds: mockFavoriteIds, isLoaded: true, toggleFavorite: mockToggleFavorite }),
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
jest.mock('../../lib/openExternalLink', () => ({ openExternalLink: jest.fn() }));
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
  latitude: 43.5875, longitude: -110.8279,
  snow: { base_in: 42, new_24h_in: 12, new_48h_in: 18, new_7d_in: 26,
    surface: 'powder', scraped_at: '2026-03-15T10:00:00Z', is_stale: false },
  lifts: { open: 13, total: 18, scraped_at: '2026-03-15T10:05:00Z', is_stale: false,
    items: [{ name: 'Aerial Tram', status: 'open' as const }, { name: 'Thunder Express', status: 'closed' as const }] },
  trails: { open: 120, total: 131 },
  weather: { scraped_at: '2026-03-15T09:00:00Z', is_stale: false,
    forecast: [{ date: '2026-03-15', high_f: 28, low_f: 14, precip_pct: 20, snow_in_forecast: false, snow_amount_in: null, wind_mph: 12 }] },
  webcams: [{ label: 'Rendezvous Bowl', cam_type: 'hls' as const, url: 'https://example.com/stream.m3u8', is_alive: true }],
  traffic_cams: [
    { label: 'WYDOT: web cameras', url: 'https://www.wyoroad.info/highway/webcameras/webcameras.html' },
  ],
  traffic_cams_note: 'Improvements to road cameras coming soon.',
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

  it('shows a "feature wanted" note for crowd levels instead of fake data', () => {
    const { openExternalLink } = require('../../lib/openExternalLink');
    render(<ResortDetail />);
    expect(screen.getByTestId('crowds-wanted')).toBeTruthy();
    expect(screen.getByText('Crowd levels are a feature we want')).toBeTruthy();
    fireEvent.press(screen.getByText('Help us add it'));
    expect(openExternalLink).toHaveBeenCalledWith('https://buymeacoffee.com/slopeinsights');
  });

  it('renders weather section', () => {
    render(<ResortDetail />);
    expect(screen.getByTestId('weather-row')).toBeTruthy();
  });

  it('lists road camera links and opens the official page', () => {
    const { openExternalLink } = require('../../lib/openExternalLink');
    render(<ResortDetail />);
    expect(screen.getByText('Road cameras')).toBeTruthy();
    fireEvent.press(screen.getByText('WYDOT: web cameras'));
    expect(openExternalLink).toHaveBeenCalledWith('https://www.wyoroad.info/highway/webcameras/webcameras.html');
  });

  it('hides the road cameras panel when there are no links (or an older API omits them)', () => {
    (useResortDetail as jest.Mock).mockReturnValue({
      resort: { ...mockResort, traffic_cams: undefined }, loading: false, error: null, refresh: jest.fn(),
    });
    render(<ResortDetail />);
    expect(screen.queryByText('Road cameras')).toBeNull();
  });

  it('shows the coming-soon note on every mountain, specific link or not', () => {
    render(<ResortDetail />);
    expect(screen.getByText('Improvements to road cameras coming soon.')).toBeTruthy();
  });

  it('does not show any lift information yet', () => {
    render(<ResortDetail />);
    expect(screen.queryByTestId('lift-list')).toBeNull();
    expect(screen.queryByText(/lift/i)).toBeNull();
  });

  it('links back to all mountains', () => {
    render(<ResortDetail />);
    fireEvent.press(screen.getByLabelText('Back to all mountains'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('saves the resort to My mountains', () => {
    mockFavoriteIds = [];
    render(<ResortDetail />);
    fireEvent.press(screen.getByLabelText('Save Jackson Hole to My mountains'));
    expect(mockToggleFavorite).toHaveBeenCalledWith('jackson-hole');
  });

  it('shows Saved and offers removal when already saved', () => {
    mockFavoriteIds = ['jackson-hole'];
    render(<ResortDetail />);
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.getByLabelText('Remove Jackson Hole from My mountains')).toBeTruthy();
    mockFavoriteIds = [];
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

  it('shows a Live road cameras section when live_traffic_cams is non-empty', () => {
    (useResortDetail as jest.Mock).mockReturnValue({
      resort: {
        ...mockResort,
        live_traffic_cams: [{ label: 'I-70 East', cam_type: 'jpeg' as const, url: 'https://images.drivebc.ca/x.jpg', is_alive: true }],
      },
      loading: false, error: null, refresh: jest.fn(),
    });
    render(<ResortDetail />);
    expect(screen.getByText('Live road cameras')).toBeTruthy();
    // Both the mountain webcam viewer (1 cam) and the live-traffic-cam viewer (1 cam) render now.
    expect(screen.getAllByTestId('webcam-viewer')).toHaveLength(2);
    expect(screen.getAllByText('1 cams')).toHaveLength(2);
  });

  it('hides the Live road cameras section when live_traffic_cams is empty or missing', () => {
    render(<ResortDetail />);
    expect(screen.queryByText('Live road cameras')).toBeNull();
  });

  it('opens Google Maps at the resort\'s coordinates when "View on Google Maps" is pressed', () => {
    const { openExternalLink } = require('../../lib/openExternalLink');
    render(<ResortDetail />);
    fireEvent.press(screen.getByText('View on Google Maps'));
    expect(openExternalLink).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=43.5875,-110.8279'
    );
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
