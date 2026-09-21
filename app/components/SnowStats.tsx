// components/SnowStats.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SnowDetail, TrailSummary } from '../lib/types';
import { formatAgo } from '../lib/utils';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  snow: SnowDetail | null;
  trails: TrailSummary | null;
}

export function SnowStats({ snow, trails }: Props) {
  const { colors } = useTheme();

  if (!snow) {
    return <Text style={[styles.unavailable, { color: colors.textMuted }]}>Snow data unavailable</Text>;
  }

  const stats = [
    { label: 'Base',   value: snow.base_in   },
    { label: '24h',    value: snow.new_24h_in },
    { label: '48h',    value: snow.new_48h_in },
    { label: '7-day',  value: snow.new_7d_in  },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCol}>
            <Text style={[styles.value, { color: colors.text }]}>{s.value ?? '—'}"</Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>
      {snow.is_stale && (
        <Text style={[styles.stale, { color: colors.warning }]}>Updated {formatAgo(snow.scraped_at) ?? 'recently'}</Text>
      )}
      {trails != null && trails.open != null && trails.total != null && (
        <Text style={[styles.trails, { color: colors.textSecondary }]}>{trails.open}/{trails.total} trails open</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, borderRadius: Radius.md },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  statCol: { alignItems: 'center', flex: 1 },
  value: { fontSize: FontSize.lg + 2, fontWeight: '700', fontVariant: ['tabular-nums'] },
  label: { fontSize: FontSize.xs, marginTop: 2 },
  stale: { fontSize: FontSize.xs, marginTop: Spacing.sm, textAlign: 'center' },
  unavailable: { fontSize: FontSize.md, padding: Spacing.md },
  trails: { fontSize: FontSize.sm, marginTop: Spacing.sm, textAlign: 'center' },
});
