import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { ResortSummary } from '../lib/types';
import { applyFilters, REGIONS } from '../lib/sort';
import type { PassFilter } from '../lib/sort';
import { passBadge } from '../lib/utils';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { touchPad, touchText } from '../constants/touch';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { SearchIcon } from './icons';

const PASSES: { label: string; value: PassFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Epic', value: 'epic' },
  { label: 'Ikon', value: 'ikon' },
  { label: 'Independent', value: 'independent' },
];

const noOutline = { outlineStyle: 'none', outlineWidth: 0 } as object;

// Shown to someone with no saved mountains: search by name, narrow by pass or region, star what you ski.
export function MountainFinder({ resorts }: { resorts: ResortSummary[] }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState('');
  const [pass, setPass] = useState<PassFilter>('all');
  const [regions, setRegions] = useState<Set<string>>(new Set());

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applyFilters(resorts, pass, regions)
      .filter((r) => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [resorts, query, pass, regions]);

  const toggleRegion = (region: string) =>
    setRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region); else next.add(region);
      return next;
    });

  const chip = (selected: boolean) => [
    styles.chip,
    { backgroundColor: selected ? colors.epic : colors.surfaceAlt, borderColor: selected ? colors.epic : colors.border },
  ];
  const chipText = (selected: boolean) => [styles.chipText, { color: selected ? '#fff' : colors.text }, selected && styles.chipTextOn];

  return (
    <View style={styles.root}>
      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <SearchIcon size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }, noOutline]}
          placeholder="Search mountains"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Find a mountain"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.chips}>
        {PASSES.map((p) => (
          <Pressable key={p.value} accessibilityLabel={`Show ${p.label} mountains`} style={chip(pass === p.value)} onPress={() => setPass(p.value)}>
            <Text style={chipText(pass === p.value)}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.chips}>
        {REGIONS.map((region) => (
          <Pressable key={region} accessibilityLabel={`Region ${region}`} style={chip(regions.has(region))} onPress={() => toggleRegion(region)}>
            <Text style={chipText(regions.has(region))}>{region}</Text>
          </Pressable>
        ))}
      </View>

      {shown.length === 0 ? (
        <Text style={[styles.none, { color: colors.textSecondary }]}>No mountains match</Text>
      ) : (
        <View style={[styles.list, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {shown.map((r, i) => {
            const saved = favoriteIds.includes(r.id);
            const { label, color } = passBadge(r.pass_type, colors);
            return (
              <Pressable
                key={r.id}
                style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}
                onPress={() => router.push(`/resort/${r.id}`)}
              >
                <View style={styles.rowText}>
                  <Text style={[styles.name, { color: colors.text }]}>{r.name}</Text>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>
                    {r.state ?? r.region} · <Text style={{ color }}>{label}</Text>
                  </Text>
                </View>
                <Pressable
                  hitSlop={8}
                  style={[styles.addButton, saved ? { borderColor: colors.border, backgroundColor: colors.surfaceAlt } : { borderColor: colors.epic, backgroundColor: colors.epic }]}
                  accessibilityLabel={saved ? `Remove ${r.name} from My mountains` : `Save ${r.name} to My mountains`}
                  onPress={() => toggleFavorite(r.id)}
                >
                  <Text style={[styles.addText, { color: saved ? colors.textSecondary : '#fff' }]}>{saved ? 'Added' : 'Add'}</Text>
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.sm, marginTop: Spacing.sm },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.sm + 2 },
  searchInput: { flex: 1, paddingVertical: Spacing.sm + touchPad, fontSize: FontSize.md + touchText },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2 },
  chip: { flexShrink: 0, borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.sm + 4, paddingVertical: Spacing.xs + 2 + touchPad },
  chipText: { flexShrink: 0, fontSize: FontSize.sm + touchText },
  chipTextOn: { fontWeight: '600' },
  list: { borderWidth: 1, borderRadius: Radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + touchPad },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: FontSize.md + touchText, fontWeight: '600' },
  meta: { fontSize: FontSize.sm },
  addButton: { flexShrink: 0, borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 + touchPad },
  addText: { fontSize: FontSize.sm + touchText, fontWeight: '600' },
  none: { fontSize: FontSize.md, paddingVertical: Spacing.lg },
});
