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
jest.mock('../../lib/openExternalLink', () => ({ openExternalLink: jest.fn() }));
jest.mock('../../components/ZoomableImage', () => ({ ZoomableImage: () => null }));

import { Platform as RNPlatform } from 'react-native';
import { WebcamViewer } from '../../components/WebcamViewer';

const hlsCam: WebcamItem = { label: 'Summit', cam_type: 'hls', url: 'https://example.com/stream.m3u8', is_alive: true };
const jpegCam: WebcamItem = { label: 'Base', cam_type: 'jpeg', url: 'https://example.com/cam.jpg', is_alive: true };
const deadCam: WebcamItem = { label: 'Village', cam_type: 'jpeg', url: 'https://example.com/dead.jpg', is_alive: false };

describe('WebcamViewer — unavailable states', () => {
  it('says so when the mountain has no cameras', () => {
    render(<WebcamViewer webcams={[]} />, { wrapper: TestWrapper });
    expect(screen.getByText('Camera not available for this mountain')).toBeTruthy();
  });

  it('says the cameras are offline when they all are', () => {
    render(<WebcamViewer webcams={[deadCam]} />, { wrapper: TestWrapper });
    expect(screen.getByText('Cameras offline right now')).toBeTruthy();
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

describe('WebcamViewer — dead cams', () => {
  it('does not offer a tab for a cam that is not live', () => {
    render(<WebcamViewer webcams={[deadCam, jpegCam]} />, { wrapper: TestWrapper });
    expect(screen.queryByText('Village')).toBeNull();
    expect(screen.getByTestId('webcam-image')).toBeTruthy();
  });

  it('shows no tab bar when only one cam is live', () => {
    render(<WebcamViewer webcams={[deadCam, jpegCam]} />, { wrapper: TestWrapper });
    expect(screen.queryByTestId('webcam-tabs')).toBeNull();
  });
});

describe('WebcamViewer — native HLS', () => {
  it('renders VideoView for an alive HLS cam on native', () => {
    render(<WebcamViewer webcams={[hlsCam]} />, { wrapper: TestWrapper });
    expect(screen.getByTestId('webcam-video')).toBeTruthy();
  });
});

describe('WebcamViewer — JPEG cam', () => {
  it('loads the picture through our server with a timestamp query param', () => {
    render(<WebcamViewer webcams={[jpegCam]} />, { wrapper: TestWrapper });
    const img = screen.getByTestId('webcam-image');
    expect(img.props.source.uri).toContain('/api/webcam-proxy?url=' + encodeURIComponent(jpegCam.url));
    expect(img.props.source.uri).toMatch(/&t=\d+$/);
  });

  it('shows when the picture was taken, under it', async () => {
    const taken = new Date(Date.now() - 4 * 60_000).toISOString();
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ updated: taken }) } as any);
    render(<WebcamViewer webcams={[jpegCam]} />, { wrapper: TestWrapper });
    expect(await screen.findByText('Updated 4m ago')).toBeTruthy();
    spy.mockRestore();
  });

  it('shows no time line when the time is unknown', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ updated: null }) } as any);
    render(<WebcamViewer webcams={[jpegCam]} />, { wrapper: TestWrapper });
    await act(async () => {});
    expect(screen.queryByTestId('webcam-updated')).toBeNull();
    spy.mockRestore();
  });

  it('says so when the picture fails to load', () => {
    const { fireEvent } = require('@testing-library/react-native');
    render(<WebcamViewer webcams={[jpegCam]} />, { wrapper: TestWrapper });
    expect(screen.queryByText("Couldn't load this picture")).toBeNull();
    fireEvent(screen.getByTestId('webcam-image'), 'error');
    expect(screen.getByText("Couldn't load this picture")).toBeTruthy();
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

  it('calls openExternalLink when Open Cam is pressed', async () => {
    const { openExternalLink } = require('../../lib/openExternalLink');
    const { fireEvent } = require('@testing-library/react-native');
    render(<WebcamViewer webcams={[hlsCam]} />, { wrapper: TestWrapper });
    await act(async () => { fireEvent.press(screen.getByText('Open Cam')); });
    expect(openExternalLink).toHaveBeenCalledWith(hlsCam.url);
  });
});
