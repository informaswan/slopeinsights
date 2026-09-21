import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
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
