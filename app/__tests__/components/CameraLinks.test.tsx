import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CameraLinks } from '../../components/CameraLinks';
import { TestWrapper } from '../test-utils';

jest.mock('expo-linking', () => ({ openURL: jest.fn() }));

const links = [
  { label: 'COtrip map: I-70 at Vail', url: 'https://www.cotrip.org/map?lat=39.6&lng=-106.3&zoom=11' },
  { label: 'COtrip: Colorado road conditions and cameras', url: 'https://www.cotrip.org/' },
];

it('lists every link by its label', () => {
  const { getByText } = render(<CameraLinks links={links} />, { wrapper: TestWrapper });
  expect(getByText('COtrip map: I-70 at Vail')).toBeTruthy();
  expect(getByText('COtrip: Colorado road conditions and cameras')).toBeTruthy();
});

it('opens the official page when a link is pressed', () => {
  const Linking = require('expo-linking');
  const { getByText } = render(<CameraLinks links={links} />, { wrapper: TestWrapper });
  fireEvent.press(getByText('COtrip map: I-70 at Vail'));
  expect(Linking.openURL).toHaveBeenCalledWith(links[0].url);
});

it('renders nothing when there are no links', () => {
  const { toJSON } = render(<CameraLinks links={[]} />, { wrapper: TestWrapper });
  expect(toJSON()).toBeNull();
});

it('marks each link so screen readers say it leaves the site', () => {
  const { getByLabelText } = render(<CameraLinks links={links} />, { wrapper: TestWrapper });
  expect(getByLabelText('COtrip map: I-70 at Vail (opens in a new tab)')).toBeTruthy();
});
