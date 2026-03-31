import React from 'react';
import { render, screen, act, Platform } from '@testing-library/react-native';
import type { WebcamItem } from '../../lib/types';
import { TestWrapper } from '../test-utils';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('expo-video', () => ({
  VideoView: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID ?? 'video-view'} />;
  },
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  })),
}));
jest.mock('expo-linking', () => ({ openURL: jest.fn() }));

import { Platform as RNPlatform } from 'react-native';
import { WebcamViewer } from '../../components/WebcamViewer';

const hlsCam: WebcamItem = { label: 'Summit', cam_type: 'hls', url: 'https://example.com/stream.m3u8', is_alive: true };
const jpegCam: WebcamItem = { label: 'Base', cam_type: 'jpeg', url: 'https://example.com/cam.jpg', is_alive: true };
const deadCam: WebcamItem = { label: 'Village', cam_type: 'jpeg', url: 'https://example.com/dead.jpg', is_alive: false };

describe('WebcamViewer — unavailable states', () => {
  it('shows placeholder when webcams array is empty', () => {
    render(<WebcamViewer webcams={[]} />, { wrapper: TestWrapper });
    expect(screen.getByText('📷 Camera temporarily unavailable')).toBeTruthy();
  });

  it('shows placeholder when all cams have is_alive=false', () => {
    render(<WebcamViewer webcams={[deadCam]} />, { wrapper: TestWrapper });
    expect(screen.getByText('📷 Camera temporarily unavailable')).toBeTruthy();
  });
});

describe('WebcamViewer — tab bar', () => {
  it('does not render a tab bar for a single cam', () => {
    render(<WebcamViewer webcams={[hlsCam]} />, { wrapper: TestWrapper });
    expect(screen.queryByTestId('webcam-tabs')).toBeNull();
  });

  it('renders a tab bar with labels when more than one cam is present', () => {
    render(<WebcamViewer webcams={[hlsCam, jpegCam]} />, { wrapper: TestWrapper });
    expect(screen.getByTestId('webcam-tabs')).toBeTruthy();
    expect(screen.getByText('Summit')).toBeTruthy();
    expect(screen.getByText('Base')).toBeTruthy();
  });
});

describe('WebcamViewer — native HLS', () => {
  it('renders VideoView for an alive HLS cam on native', () => {
    render(<WebcamViewer webcams={[hlsCam]} />, { wrapper: TestWrapper });
    expect(screen.getByTestId('webcam-video')).toBeTruthy();
  });
});

describe('WebcamViewer — JPEG cam', () => {
  it('renders an Image with a timestamp query param', () => {
    render(<WebcamViewer webcams={[jpegCam]} />, { wrapper: TestWrapper });
    const img = screen.getByTestId('webcam-image');
    expect(img.props.source.uri).toMatch(/\?t=\d+/);
  });

  it('refreshes the timestamp after 30 s', () => {
    jest.useFakeTimers();
    render(<WebcamViewer webcams={[jpegCam]} />, { wrapper: TestWrapper });
    const first = screen.getByTestId('webcam-image').props.source.uri;
    act(() => { jest.advanceTimersByTime(30_000); });
    const second = screen.getByTestId('webcam-image').props.source.uri;
    expect(second).not.toBe(first);
    jest.useRealTimers();
  });
});

describe('WebcamViewer — web HLS', () => {
  const originalOS = RNPlatform.OS;
  beforeAll(() => { Object.defineProperty(RNPlatform, 'OS', { value: 'web', writable: true }); });
  afterAll(() => { Object.defineProperty(RNPlatform, 'OS', { value: originalOS, writable: true }); });

  it('renders Open Cam button instead of VideoView on web', () => {
    render(<WebcamViewer webcams={[hlsCam]} />, { wrapper: TestWrapper });
    expect(screen.getByText('Open Cam')).toBeTruthy();
    expect(screen.queryByTestId('webcam-video')).toBeNull();
  });

  it('calls Linking.openURL when Open Cam is pressed', async () => {
    const Linking = require('expo-linking');
    const { fireEvent } = require('@testing-library/react-native');
    render(<WebcamViewer webcams={[hlsCam]} />, { wrapper: TestWrapper });
    await act(async () => { fireEvent.press(screen.getByText('Open Cam')); });
    expect(Linking.openURL).toHaveBeenCalledWith(hlsCam.url);
  });
});
