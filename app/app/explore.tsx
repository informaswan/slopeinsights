import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useResorts } from '../hooks/useResorts';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '../constants/theme';

type PassTab = 'all' | 'epic' | 'ikon';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { resorts } = useResorts();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [search, setSearch] = useState('');
  const [passTab, setPassTab] = useState<PassTab>('all');

  const savedSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const grouped = useMemo(() => {
    let filtered = resorts;
    if (passTab !== 'all') filtered = filtered.filter((r) => r.pass_type === passTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(q));
    }
    const groups: Record<string, typeof filtered> = {};
    for (const r of filtered) {
      const region = r.state || r.region || 'Other';
      if (!groups[region]) groups[region] = [];
      groups[region].push(r);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [resorts, passTab, search]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Explore Resorts</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={{ color: colors.textMuted }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search resorts..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={styles.passTabs}>
          {(['all', 'epic', 'ikon'] as PassTab[]).map((tab) => {
            const isActive = passTab === tab;
            const tabColor = tab === 'epic' ? colors.epic : tab === 'ikon' ? colors.ikon : colors.textSecondary;
            return (
              <Pressable
                key={tab}
                style={[
                  styles.passTab,
                  isActive
                    ? { backgroundColor: tab === 'epic' ? colors.epicBg : tab === 'ikon' ? colors.ikonBg : colors.background }
                    : { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
                ]}
                onPress={() => setPassTab(tab)}
              >
                <Text style={[styles.passTabText, { color: isActive ? tabColor : colors.textMuted }]}>
                  {tab === 'all' ? 'All' : tab === 'epic' ? 'Epic' : 'Ikon'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {grouped.map(([region, regionResorts]) => (
          <View key={region}>
            <Text style={[styles.regionLabel, { color: colors.textMuted }]}>{region.toUpperCase()}</Text>
            {regionResorts.map((resort) => {
              const isSaved = savedSet.has(resort.id);
              const passColor = resort.pass_type === 'epic' ? colors.epic : colors.ikon;
              return (
                <View key={resort.id} style={[styles.resortRow, { backgroundColor: colors.surface }]}>
                  <View style={styles.resortInfo}>
                    <View style={[styles.passBar, { backgroundColor: passColor }]} />
                    <View>
                      <Text style={[styles.resortName, { color: colors.text }]}>{resort.name}</Text>
                      <Text style={[styles.resortLocation, { color: colors.textMuted }]}>
                        {resort.state ? `${resort.region}, ${resort.state}` : resort.region}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={[
                      styles.actionButton,
                      isSaved ? { backgroundColor: '#fee2e2' } : { backgroundColor: '#1e3a5f' },
                    ]}
                    onPress={() => toggleFavorite(resort.id)}
                  >
                    <Text style={[styles.actionText, { color: isSaved ? '#ef4444' : '#fff' }]}>
                      {isSaved ? 'Remove' : '+ Add'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: Spacing.md, borderBottomWidth: 1 },
  title: { fontSize: FontSize.xl, fontWeight: '800', marginBottom: Spacing.sm },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm + 2, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.md },
  passTabs: { flexDirection: 'row', gap: Spacing.sm },
  passTab: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full },
  passTabText: { fontSize: FontSize.sm, fontWeight: '700' },
  list: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  regionLabel: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.md },
  resortRow: {
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  resortInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  passBar: { width: 4, height: 32, borderRadius: 2 },
  resortName: { fontSize: FontSize.md, fontWeight: '700' },
  resortLocation: { fontSize: FontSize.xs, marginTop: 2 },
  actionButton: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.md },
  actionText: { fontSize: FontSize.sm, fontWeight: '700' },
});
