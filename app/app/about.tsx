import React from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { DONATION_URL, VENMO_URL } from '../constants/links';

export default function AboutScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { favoriteIds } = useFavorites();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.settingsList}>
        <Pressable
          style={[styles.settingsRow, styles.rowFirst, { backgroundColor: colors.surface, borderBottomColor: colors.background }]}
          onPress={() => router.push('/explore')}
        >
          <Text style={[styles.settingsLabel, { color: colors.text }]}>My Mountains</Text>
          <Text style={[styles.settingsValue, { color: colors.textMuted }]}>
            {favoriteIds.length > 0 ? `${favoriteIds.length} starred ›` : 'Showing all ›'}
          </Text>
        </Pressable>

        <View style={[styles.settingsRow, styles.rowLast, { backgroundColor: colors.surface }]}>
          <Text style={[styles.settingsLabel, { color: colors.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.epic }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={[styles.aboutSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.aboutTitle, { color: colors.text }]}>About SlopeInsights</Text>
        <Text style={[styles.aboutBody, { color: colors.textMuted }]}>
          My brothers and I built SlopeInsights to put everything you need for deciding where to
          ski or ride — snow, weather, crowds, lifts — in one place, no matter if you're Ikon,
          Epic, or independent. We're actively adding more mountains and features. If you want to
          help us get there faster, you can{' '}
          <Text
            style={[styles.aboutLink, { color: colors.epic }]}
            onPress={() => Linking.openURL(DONATION_URL)}
          >
            buy us a coffee ☕
          </Text>
          {' '}or{' '}
          <Text
            style={[styles.aboutLink, { color: colors.epic }]}
            onPress={() => Linking.openURL(VENMO_URL)}
          >
            send a tip on Venmo 💵
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  settingsList: { padding: Spacing.md },
  settingsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1,
  },
  rowFirst: { borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  rowLast: { borderBottomLeftRadius: Radius.lg, borderBottomRightRadius: Radius.lg, borderBottomWidth: 0 },
  settingsLabel: { fontSize: FontSize.md, fontWeight: '600' },
  settingsValue: { fontSize: FontSize.sm },
  aboutSection: { margin: Spacing.md, marginTop: 0, padding: Spacing.md, borderRadius: Radius.lg },
  aboutTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.xs },
  aboutBody: { fontSize: FontSize.sm, lineHeight: 20 },
  aboutLink: { fontWeight: '700' },
});
