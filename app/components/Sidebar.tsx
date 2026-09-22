import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, ScrollView, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter, usePathname } from 'expo-router';
import { api } from '../lib/api';
import type { ResortSummary } from '../lib/types';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { DONATION_URL, VENMO_URL } from '../constants/links';
import { FontSize, Radius, Spacing } from '../constants/theme';
import { MountainLogo } from './MountainLogo';
import { SearchIcon } from './icons';

interface Props {
  onNavigate?: () => void;
}

// The search box draws its own focus border; suppress the browser's default outline.
const noOutline = { outlineStyle: 'none', outlineWidth: 0 } as object;

export function Sidebar({ onNavigate }: Props) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { favoriteIds } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();
  const [resorts, setResorts] = useState<ResortSummary[]>([]);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    api.getResorts().then(setResorts).catch(() => {});
  }, []);

  const trimmed = query.trim();
  const matches = useMemo(() => {
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();
    return resorts.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 8);
  }, [resorts, trimmed]);

  const go = (path: string) => {
    setQuery('');
    router.push(path as any);
    onNavigate?.();
  };

  const navItems = [
    { label: 'All mountains', path: '/', count: null as number | null },
    { label: 'My mountains', path: '/mine', count: favoriteIds.length },
    { label: 'Road cameras', path: '/road-cameras', count: null as number | null },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.sidebar }}
      contentContainerStyle={styles.container}
    >
      <Pressable style={styles.brand} onPress={() => go('/')} accessibilityLabel="SlopeInsights home">
        <MountainLogo size={26} color={colors.sidebarText} snowColor={colors.sidebarAccent} />
        <Text style={[styles.brandText, { color: colors.sidebarText }]}>SlopeInsights</Text>
      </Pressable>

      <View style={[styles.searchBox, { borderColor: searchFocused ? colors.sidebarAccent : colors.sidebarBorder }]}>
        <SearchIcon size={15} color={colors.sidebarMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.sidebarText }, noOutline]}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search mountains"
          placeholderTextColor={colors.sidebarMuted}
          accessibilityLabel="Search mountains"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {trimmed !== '' && (
        <View style={styles.results}>
          {matches.length === 0 ? (
            <Text style={[styles.noResults, { color: colors.sidebarMuted }]}>No mountains match</Text>
          ) : (
            matches.map((r) => (
              <Pressable key={r.id} style={styles.resultRow} onPress={() => go(`/resort/${r.id}`)}>
                <Text style={[styles.resultName, { color: colors.sidebarText }]} numberOfLines={1}>{r.name}</Text>
                <Text style={[styles.resultMeta, { color: colors.sidebarMuted }]}>{r.state ?? r.region}</Text>
              </Pressable>
            ))
          )}
        </View>
      )}

      <View style={styles.nav}>
        {navItems.map((item) => {
          const active = pathname === item.path;
          return (
            <Pressable
              key={item.path}
              style={[
                styles.navItem,
                active && { backgroundColor: colors.sidebarActive, borderLeftColor: colors.sidebarAccent },
              ]}
              onPress={() => go(item.path)}
            >
              <Text style={[styles.navText, { color: active ? colors.sidebarText : colors.sidebarMuted }, active && styles.navTextActive]}>
                {item.label}
              </Text>
              {item.count != null && item.count > 0 && (
                <Text style={[styles.navCount, { color: colors.sidebarMuted }]}>{item.count}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.spacer} />

      <View style={[styles.support, { borderTopColor: colors.sidebarBorder }]}>
        <Text style={[styles.supportTitle, { color: colors.sidebarText }]}>Free to use</Text>
        <Text style={[styles.supportBody, { color: colors.sidebarMuted }]}>
          Help us add more mountains and features.
        </Text>
        <Pressable
          style={[styles.buttonPrimary, { backgroundColor: colors.sidebarText }]}
          onPress={() => Linking.openURL(DONATION_URL)}
        >
          <Text style={[styles.buttonPrimaryText, { color: colors.sidebar }]}>Buy us a coffee</Text>
        </Pressable>
        <Pressable
          style={[styles.buttonOutline, { borderColor: colors.sidebarMuted }]}
          onPress={() => Linking.openURL(VENMO_URL)}
        >
          <Text style={[styles.buttonOutlineText, { color: colors.sidebarText }]}>Tip on Venmo</Text>
        </Pressable>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.sidebarBorder }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.sidebarText }]}>Dark mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.sidebarBorder, true: colors.sidebarAccent }}
            thumbColor="#fff"
            {...({ activeThumbColor: '#fff' } as object)}
            accessibilityLabel="Dark mode"
          />
        </View>
        <Pressable onPress={() => go('/about')}>
          <Text style={[styles.aboutLink, { color: colors.sidebarMuted }]}>About</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: Spacing.md, paddingTop: Spacing.lg },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  brandText: { fontSize: FontSize.md + 1, fontWeight: '700', letterSpacing: -0.2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.sm + 2, height: 36,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm + 1, paddingVertical: 0 },
  results: { marginTop: Spacing.xs },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingVertical: 7, paddingHorizontal: Spacing.xs, gap: Spacing.sm,
  },
  resultName: { fontSize: FontSize.sm + 1, flexShrink: 1 },
  resultMeta: { fontSize: FontSize.xs },
  noResults: { fontSize: FontSize.sm, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs },
  nav: { marginTop: Spacing.lg, gap: 2 },
  navItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: Spacing.sm + 2, borderRadius: Radius.sm,
    borderLeftWidth: 2, borderLeftColor: 'transparent',
  },
  navText: { fontSize: FontSize.sm + 1, fontWeight: '500' },
  navTextActive: { fontWeight: '600' },
  navCount: { fontSize: FontSize.xs, fontWeight: '600' },
  spacer: { flex: 1, minHeight: Spacing.lg },
  support: { borderTopWidth: 1, paddingTop: Spacing.md, gap: Spacing.sm },
  supportTitle: { fontSize: FontSize.sm + 1, fontWeight: '600' },
  supportBody: { fontSize: FontSize.sm, lineHeight: 18, marginBottom: Spacing.xs },
  buttonPrimary: { borderRadius: Radius.md, paddingVertical: 9, alignItems: 'center' },
  buttonPrimaryText: { fontSize: FontSize.sm + 1, fontWeight: '600' },
  buttonOutline: { borderWidth: 1, borderRadius: Radius.md, paddingVertical: 8, alignItems: 'center' },
  buttonOutlineText: { fontSize: FontSize.sm + 1, fontWeight: '500' },
  footer: { borderTopWidth: 1, marginTop: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm + 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: FontSize.sm + 1 },
  aboutLink: { fontSize: FontSize.sm + 1 },
});
