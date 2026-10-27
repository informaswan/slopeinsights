import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppShell } from '../../components/AppShell';

let mockIsWide = true;
jest.mock('../../hooks/useIsWide', () => ({ useIsWide: () => mockIsWide }));
jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return { useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: jest.fn() }) };
});
jest.mock('../../components/Sidebar', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    Sidebar: ({ onNavigate }: any) => (
      <View testID="sidebar">
        <Pressable onPress={onNavigate}><Text>go</Text></Pressable>
      </View>
    ),
  };
});

const page = <Text>page content</Text>;

describe('AppShell on a wide screen', () => {
  beforeEach(() => { mockIsWide = true; });

  it('keeps the sidebar next to the page content', () => {
    const { getByTestId, getByText, queryByLabelText } = render(<AppShell>{page}</AppShell>);
    expect(getByTestId('sidebar')).toBeTruthy();
    expect(getByText('page content')).toBeTruthy();
    expect(queryByLabelText('Open menu')).toBeNull();
  });
});

describe('AppShell on a narrow screen', () => {
  beforeEach(() => { mockIsWide = false; });

  it('shows a top bar and hides the sidebar until the menu is opened', () => {
    const { getByLabelText, getByText, queryByTestId } = render(<AppShell>{page}</AppShell>);
    expect(getByText('page content')).toBeTruthy();
    expect(queryByTestId('sidebar')).toBeNull();
    fireEvent.press(getByLabelText('Open menu'));
    expect(queryByTestId('sidebar')).toBeTruthy();
  });

  it('closes the menu after navigating', () => {
    const { getByLabelText, getByText, queryByTestId } = render(<AppShell>{page}</AppShell>);
    fireEvent.press(getByLabelText('Open menu'));
    fireEvent.press(getByText('go'));
    expect(queryByTestId('sidebar')).toBeNull();
  });

  it('closes the menu when the backdrop is pressed', () => {
    const { getByLabelText, queryByTestId } = render(<AppShell>{page}</AppShell>);
    fireEvent.press(getByLabelText('Open menu'));
    fireEvent.press(getByLabelText('Close menu'));
    expect(queryByTestId('sidebar')).toBeNull();
  });
});


describe('AppShell safe areas (phone)', () => {
  beforeEach(() => { mockIsWide = false; });

  const withInsets = (insets: any, ui: React.ReactElement) => (
    <SafeAreaInsetsContext.Provider value={insets}>{ui}</SafeAreaInsetsContext.Provider>
  );
  const flat = (style: any) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

  it('keeps the top bar below the status bar and the page above the gesture bar', () => {
    const { getByTestId } = render(
      withInsets({ top: 30, bottom: 20, left: 0, right: 0 }, <AppShell>{page}</AppShell>),
    );
    const bar = flat(getByTestId('top-bar').props.style);
    expect(bar.paddingTop).toBe(30);
    expect(bar.height).toBeGreaterThan(30 + 48); // room for the bar itself plus the status bar
    expect(flat(getByTestId('app-column').props.style).paddingBottom).toBe(20);
  });

  it('needs no provider (website, tests)', () => {
    const { getByText } = render(<AppShell>{page}</AppShell>);
    expect(getByText('page content')).toBeTruthy();
  });
});

describe('AppShell when the window switches between phone and browser widths', () => {
  // A screen with its own state, like the add-mountains mode, must not be rebuilt by the switch.
  function Counter() {
    const [n, setN] = React.useState(0);
    return <Pressable accessibilityLabel="bump" onPress={() => setN(n + 1)}><Text>count {n}</Text></Pressable>;
  }

  it('keeps the screen and its state', () => {
    mockIsWide = true;
    const view = render(<AppShell><Counter /></AppShell>);
    fireEvent.press(view.getByLabelText('bump'));
    fireEvent.press(view.getByLabelText('bump'));
    expect(view.getByText('count 2')).toBeTruthy();

    mockIsWide = false;
    view.rerender(<AppShell><Counter /></AppShell>);
    expect(view.getByText('count 2')).toBeTruthy();
    expect(view.getByTestId('top-bar')).toBeTruthy();

    mockIsWide = true;
    view.rerender(<AppShell><Counter /></AppShell>);
    expect(view.getByText('count 2')).toBeTruthy();
    expect(view.getByTestId('sidebar')).toBeTruthy();
  });
});
