import { Platform } from 'react-native';

jest.mock('expo-linking', () => ({ openURL: jest.fn() }));

import { openExternalLink } from '../lib/openExternalLink';

describe('openExternalLink', () => {
  const originalOS = Platform.OS;
  afterEach(() => { Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true }); });

  it('opens a new browser tab on web instead of navigating the current one', () => {
    Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
    const openMock = jest.fn();
    (window as any).open = openMock;
    openExternalLink('https://example.com/page');
    expect(openMock).toHaveBeenCalledWith('https://example.com/page', '_blank', 'noopener,noreferrer');
    delete (window as any).open;
  });

  it('hands off to Linking.openURL on native, where a new tab has no meaning', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });
    const Linking = require('expo-linking');
    openExternalLink('https://example.com/page');
    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/page');
  });
});
