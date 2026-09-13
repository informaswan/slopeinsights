import React from 'react';
import { View, Text, Pressable, Switch, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { DONATION_URL } from '../constants/links';

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, savedResortIds, signOut } = useAuth();
  const router = useRouter();

  const initials = user
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.profileHeader}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{user?.name ?? 'Unknown'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        </View>
      </LinearGradient>

      <View style={styles.settingsList}>
        <Pressable
          style={[styles.settingsRow, styles.rowFirst, { backgroundColor: colors.surface, borderBottomColor: colors.background }]}
          onPress={() => router.push('/explore')}
        >
          <Text style={[styles.settingsLabel, { color: colors.text }]}>My Resorts</Text>
          <Text style={[styles.settingsValue, { color: colors.textMuted }]}>
            {savedResortIds.length} selected ›
          </Text>
        </Pressable>

        <View style={[styles.settingsRow, { backgroundColor: colors.surface, borderBottomColor: colors.background }]}>
          <Text style={[styles.settingsLabel, { color: colors.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.epic }}
            thumbColor="#fff"
          />
        </View>

        <Pressable
          style={[styles.settingsRow, { backgroundColor: colors.surface, borderBottomColor: colors.background }]}
          onPress={() => Alert.alert('Coming Soon', 'Notifications will be available in a future update.')}
        >
          <Text style={[styles.settingsLabel, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.settingsValue, { color: colors.textMuted }]}>›</Text>
        </Pressable>

        <Pressable
          style={[styles.settingsRow, styles.rowLast, { backgroundColor: colors.surface }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.settingsLabel, { color: '#ef4444' }]}>Sign Out</Text>
          <Text style={[styles.settingsValue, { color: colors.textMuted }]}>›</Text>
        </Pressable>
      </View>

      <View style={[styles.aboutSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.aboutTitle, { color: colors.text }]}>About SlopeInsights</Text>
        <Text style={[styles.aboutBody, { color: colors.textMuted }]}>
          My brothers and I built SlopeInsights to put everything you need for deciding where to
          ski or ride — snow, weather, crowds, lifts — in one place, no matter if you're Ikon,
          Epic, or independent. We're actively adding more mountains and features. If you want to
          help us get there faster,{' '}
          <Text
            style={[styles.aboutLink, { color: colors.epic }]}
            onPress={() => Linking.openURL(DONATION_URL)}
          >
            buy us a coffee ☕
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  profileHeader: {
    padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: FontSize.lg },
  userName: { color: '#fff', fontWeight: '800', fontSize: FontSize.lg },
  userEmail: { color: '#a8d4f0', fontSize: FontSize.sm },
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
