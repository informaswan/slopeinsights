import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../lib/openExternalLink', () => ({ openExternalLink: jest.fn() }));
jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return {
    useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: jest.fn() }),
    ThemeProvider: ({ children }: any) => children,
  };
});

function renderAbout() {
  const AboutScreen = require('../../app/about').default;
  return render(<AboutScreen />);
}

describe('About screen', () => {
  it('renders the About SlopeInsights section', () => {
    const { getByText } = renderAbout();
    expect(getByText('About SlopeInsights')).toBeTruthy();
    expect(getByText(/My brothers and I built SlopeInsights/)).toBeTruthy();
  });

  it('does not promise lift information yet', () => {
    const { queryByText } = renderAbout();
    expect(queryByText(/lift/i)).toBeNull();
  });

  it('opens the donation link when "buy us a coffee" is pressed', () => {
    const { openExternalLink } = require('../../lib/openExternalLink');
    const { getByText } = renderAbout();
    fireEvent.press(getByText(/buy us a coffee/));
    expect(openExternalLink).toHaveBeenCalledWith('https://buymeacoffee.com/slopeinsights');
  });

  it('opens the Venmo link when "send a tip on Venmo" is pressed', () => {
    const { openExternalLink } = require('../../lib/openExternalLink');
    const { getByText } = renderAbout();
    fireEvent.press(getByText(/send a tip on Venmo/));
    expect(openExternalLink).toHaveBeenCalledWith('https://venmo.com/u/Michael-Swanson-61');
  });

  it('has no emoji in the copy', () => {
    const { toJSON } = renderAbout();
    expect(JSON.stringify(toJSON())).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});
