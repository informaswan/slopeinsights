import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatAgo } from '../lib/utils';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  /** When the data on screen was fetched (ms), if the network failed and it's saved data. Null = live. */
  cachedAt: number | null;
}

export function OfflineBanner({ cachedAt }: Props) {
  const { colors } = useTheme();
  if (cachedAt == null) return null;
  const ago = formatAgo(new Date(cachedAt).toISOString());

  return (
    <View
      testID="offline-banner"
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.crowdMediumBg, borderColor: colors.warning }]}
    >
      <Text style={[styles.text, { color: colors.text }]}>
        Offline — showing saved data from {ago}. Conditions may have changed.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  text: { fontSize: FontSize.sm },
});
