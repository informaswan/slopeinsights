import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useIsWide } from '../hooks/useIsWide';
import { Spacing, FontSize } from '../constants/theme';

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

// Plain long-form page (privacy policy, support) in the same look as About.
export function LegalPage({ title, updated, sections }: { title: string; updated?: string; sections: LegalSection[] }) {
  const { colors } = useTheme();
  const isWide = useIsWide();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.root, { padding: isWide ? Spacing.lg : Spacing.md }]}
    >
      <View style={styles.column}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>
        {updated && <Text style={[styles.body, { color: colors.textSecondary }]}>Last updated {updated}</Text>}
        {sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{s.heading}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{s.body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1 },
  column: { maxWidth: 620, gap: Spacing.sm },
  section: { gap: Spacing.xs, marginTop: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: FontSize.lg, fontWeight: '700' },
  body: { fontSize: FontSize.md, lineHeight: 24 },
});
