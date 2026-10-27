import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { touchPad, touchText } from '../constants/touch';
import { useTheme } from '../contexts/ThemeContext';

// A pill pinned to the bottom of the screen, so it never has to be scrolled to.
export function FloatingDone({ label, accessibilityLabel, onPress }: { label: string; accessibilityLabel: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Pressable accessibilityLabel={accessibilityLabel} style={[styles.button, { backgroundColor: colors.epic }]} onPress={onPress}>
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </View>
  );
}

// Extra bottom padding for a scroll view, so the pill never covers its last rows.
export const FLOATING_DONE_CLEARANCE = 96;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: Spacing.lg, alignItems: 'center' },
  button: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2 + touchPad, borderRadius: Radius.full,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  text: { color: '#fff', fontSize: FontSize.md + touchText, fontWeight: '700' },
});
