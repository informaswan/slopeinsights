import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { openExternalLink } from '../lib/openExternalLink';
import { useTheme } from '../contexts/ThemeContext';
import { useIsWide } from '../hooks/useIsWide';
import { Spacing, FontSize } from '../constants/theme';
import { DONATION_URL, VENMO_URL } from '../constants/links';

export default function AboutScreen() {
  const { colors } = useTheme();
  const isWide = useIsWide();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, padding: isWide ? Spacing.lg : Spacing.md }]}>
      <View style={styles.column}>
        <Text style={[styles.title, { color: colors.text }]}>About SlopeInsights</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          My brothers and I built SlopeInsights to put everything you need for deciding where to
          ski or ride, like snow, weather and road cameras, in one place, whether you're on Ikon, Epic,
          or neither. We're actively adding more mountains and features. If you want to help us
          get there faster, you can{' '}
          <Text style={[styles.link, { color: colors.epic }]} onPress={() => openExternalLink(DONATION_URL)}>
            buy us a coffee
          </Text>
          {' '}or{' '}
          <Text style={[styles.link, { color: colors.epic }]} onPress={() => openExternalLink(VENMO_URL)}>
            send a tip on Venmo
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  column: { maxWidth: 620, gap: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.4 },
  body: { fontSize: FontSize.md, lineHeight: 24 },
  link: { fontWeight: '700' },
});
