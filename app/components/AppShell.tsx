import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useIsWide } from '../hooks/useIsWide';
import { FontSize, Spacing } from '../constants/theme';
import { touchPad, touchText } from '../constants/touch';
import { useInsets } from '../hooks/useInsets';
import { Sidebar } from './Sidebar';
import { MenuIcon } from './icons';

export const SIDEBAR_WIDTH = 248;
const TOP_BAR_HEIGHT = 48 + touchPad * 2;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const isWide = useIsWide();
  const insets = useInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isWide) {
    return (
      <View style={[styles.row, { backgroundColor: colors.background }]}>
        <View style={[styles.sidebar, { backgroundColor: colors.sidebar, borderRightColor: colors.sidebarBorder }]}>
          <Sidebar />
        </View>
        <View style={styles.main}>{children}</View>
      </View>
    );
  }

  return (
    // The phone's status bar, gesture bar and on-screen buttons sit over the app, so keep clear of them.
    <View testID="app-column" style={[styles.column, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <View testID="top-bar" style={[styles.topBar, { backgroundColor: colors.sidebar, paddingTop: insets.top, height: TOP_BAR_HEIGHT + insets.top }]}>
        <Pressable accessibilityLabel="Open menu" onPress={() => setMenuOpen(true)} style={styles.menuButton}>
          <MenuIcon size={22 + touchPad * 2} color={colors.sidebarText} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: colors.sidebarText }]}>SlopeInsights</Text>
      </View>
      <View style={styles.main}>{children}</View>
      {menuOpen && (
        <View style={styles.overlay}>
          <View style={[styles.drawer, { backgroundColor: colors.sidebar, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </View>
          <Pressable style={styles.scrim} accessibilityLabel="Close menu" onPress={() => setMenuOpen(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row' },
  column: { flex: 1 },
  sidebar: { width: SIDEBAR_WIDTH, borderRightWidth: 1 },
  main: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm, height: TOP_BAR_HEIGHT },
  menuButton: { padding: Spacing.sm + touchPad },
  topBarTitle: { fontSize: FontSize.md + touchText, fontWeight: '700', letterSpacing: -0.2 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  drawer: { width: SIDEBAR_WIDTH + 32, maxWidth: '85%' },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
});
