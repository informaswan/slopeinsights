import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FontSize, Spacing } from '../constants/theme';
import { ExternalLinkIcon } from './icons';
import { openExternalLink } from '../lib/openExternalLink';

interface Props {
  links: { label: string; url: string }[];
}

export function CameraLinks({ links }: Props) {
  const { colors } = useTheme();
  if (links.length === 0) return null;

  return (
    <View>
      {links.map((link, i) => (
        <Pressable
          key={link.url}
          accessibilityLabel={`${link.label} (opens in a new tab)`}
          style={({ hovered }: any) => [
            styles.row,
            i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderSubtle },
            hovered && { backgroundColor: colors.surfaceAlt },
          ]}
          onPress={() => openExternalLink(link.url)}
        >
          <Text style={[styles.label, { color: colors.text }]}>{link.label}</Text>
          <ExternalLinkIcon size={14} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 3,
  },
  label: { flex: 1, fontSize: FontSize.sm + 1 },
});
