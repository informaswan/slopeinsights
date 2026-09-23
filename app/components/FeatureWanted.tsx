import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { openExternalLink } from '../lib/openExternalLink';
import { FontSize, Radius, Spacing } from '../constants/theme';

interface Props {
  title: string;
  body: string;
  actionLabel: string;
  url: string;
}

/** Placeholder for a feature we want to build but can't yet, with a way to help fund it. */
export function FeatureWanted({ title, body, actionLabel, url }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>
      <Pressable
        accessibilityLabel={`${actionLabel} (opens in a new tab)`}
        style={[styles.button, { borderColor: colors.epic }]}
        onPress={() => openExternalLink(url)}
      >
        <Text style={[styles.buttonText, { color: colors.epic }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, gap: Spacing.sm },
  title: { fontSize: FontSize.md, fontWeight: '700' },
  body: { fontSize: FontSize.sm + 1, lineHeight: 20 },
  button: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
  },
  buttonText: { fontSize: FontSize.sm, fontWeight: '600' },
});
