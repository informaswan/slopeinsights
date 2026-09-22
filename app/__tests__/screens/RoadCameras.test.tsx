import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-linking', () => ({ openURL: jest.fn() }));
jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return { useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: jest.fn() }) };
});
const mockGetRoadCameras = jest.fn();
jest.mock('../../lib/api', () => ({ api: { getRoadCameras: () => mockGetRoadCameras() } }));

const groups = {
  note: 'Improvements to road cameras coming soon.',
  groups: [
    { name: 'I-70: Denver to the mountains', note: 'Listed from Denver heading west.', stops: [
      { name: 'Denver metro (I-70 at C-470)', url: 'https://www.cotrip.org/map?lat=39.7&lng=-105.1&zoom=10' },
      { name: 'Vail', url: 'https://www.cotrip.org/map?lat=39.6&lng=-106.3&zoom=11' },
    ] },
    { name: 'Colorado mountain passes', note: 'Roads to the ski areas that are worth checking before you drive.', stops: [
      { name: 'Loveland Pass (US-6)', url: 'https://www.cotrip.org/map?lat=39.6&lng=-105.8&zoom=11' },
    ] },
  ],
};

function renderScreen() {
  const RoadCameras = require('../../app/road-cameras').default;
  return render(<RoadCameras />);
}

beforeEach(() => mockGetRoadCameras.mockReset());

// react-native-svg's icons make this screen the heaviest render in the suite; its very first
// mount does a one-time module warm-up that can take longer than Jest's default 5s in a slow
// (e.g. cross-filesystem) environment. Every later test in this file mounts the same screen
// in well under a second once that cost is paid.
it('shows the I-70 corridor and the passes, listed from Denver heading west', async () => {
  mockGetRoadCameras.mockResolvedValue(groups);
  const { getByText } = renderScreen();
  // Plain sleep + synchronous query, not findByText/waitFor: this screen's icons make
  // react-native-svg's one-time module init happen inside the state update after the mocked
  // fetch resolves, and that init is a single long blocking call. waitFor's own timeout is a
  // real setTimeout racing that same blocked JS thread, so it can fire the instant the thread
  // frees up regardless of how large a timeout you give it. A plain sleep has nothing to race:
  // by the time it resolves, the blocking render is long done.
  await new Promise((r) => setTimeout(r, 3000));
  expect(getByText('Road cameras')).toBeTruthy();
  expect(getByText('I-70: Denver to the mountains')).toBeTruthy();
  expect(getByText('Denver metro (I-70 at C-470)')).toBeTruthy();
  expect(getByText('Vail')).toBeTruthy();
  expect(getByText('Colorado mountain passes')).toBeTruthy();
  expect(getByText('Loveland Pass (US-6)')).toBeTruthy();
  expect(getByText(/from Denver heading west/i)).toBeTruthy();
}, 30000);

it('opens the official map for a stop', async () => {
  const Linking = require('expo-linking');
  mockGetRoadCameras.mockResolvedValue(groups);
  const { findByText } = renderScreen();
  fireEvent.press(await findByText('Vail'));
  expect(Linking.openURL).toHaveBeenCalledWith('https://www.cotrip.org/map?lat=39.6&lng=-106.3&zoom=11');
});

it('says where the links go', async () => {
  mockGetRoadCameras.mockResolvedValue(groups);
  const { findByText } = renderScreen();
  expect(await findByText(/COtrip/)).toBeTruthy();
});

it('shows the coming-soon note', async () => {
  mockGetRoadCameras.mockResolvedValue(groups);
  const { findByText } = renderScreen();
  expect(await findByText('Improvements to road cameras coming soon.')).toBeTruthy();
});

it('shows a loading indicator, then an error with a retry', async () => {
  mockGetRoadCameras.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(groups);
  const { findByText, getByText } = renderScreen();
  expect(await findByText('Unable to load road cameras')).toBeTruthy();
  fireEvent.press(getByText('Tap to retry'));
  await waitFor(() => expect(getByText('Vail')).toBeTruthy());
});

it('has no emoji', async () => {
  mockGetRoadCameras.mockResolvedValue(groups);
  const { findByText, toJSON } = renderScreen();
  await findByText('Vail');
  expect(JSON.stringify(toJSON())).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});
