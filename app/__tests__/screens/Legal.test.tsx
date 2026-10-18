import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockOpen = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../lib/openExternalLink', () => ({ openExternalLink: (u: string) => mockOpen(u) }));
jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return {
    useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: jest.fn() }),
    ThemeProvider: ({ children }: any) => children,
  };
});

beforeEach(() => jest.clearAllMocks());

describe('Privacy policy', () => {
  const screen = () => render(React.createElement(require('../../app/privacy').default));

  it('names the company and states the key facts', () => {
    const { getByText } = screen();
    expect(getByText('Privacy Policy')).toBeTruthy();
    expect(getByText(/operated by Swansites LLC/)).toBeTruthy();
    expect(getByText(/currently shows no ads/)).toBeTruthy();
  });

  it('opens a mail to the contact address', () => {
    const { getByText } = screen();
    fireEvent.press(getByText('michael.swanson@swan-sites.com'));
    expect(mockOpen).toHaveBeenCalledWith('mailto:michael.swanson@swan-sites.com');
  });
});

describe('Support page', () => {
  const screen = () => render(React.createElement(require('../../app/support').default));

  it('links to email and to the feedback form', () => {
    const { getByText } = screen();
    fireEvent.press(getByText('michael.swanson@swan-sites.com'));
    expect(mockOpen).toHaveBeenCalledWith('mailto:michael.swanson@swan-sites.com');
    fireEvent.press(getByText('feedback form'));
    expect(mockPush).toHaveBeenCalledWith('/feedback');
  });
});
