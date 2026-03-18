// components/SnowStats.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SnowDetail, TrailSummary } from '../lib/types';
import { formatAgo } from '../lib/utils';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

interface Props {
  snow: SnowDetail | null;
  trails: TrailSummary | null;
}

export function SnowStats({ snow, trails }: Props) {
  if (!snow) {
    return <Text style={styles.unavailable}>Snow data unavailable</Text>;
  }

  const stats = [
    { label: 'Base',   value: snow.base_in   },
    { label: '24h',    value: snow.new_24h_in },
    { label: '48h',    value: snow.new_48h_in },
    { label: '7-day',  value: snow.new_7d_in  },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCol}>
            <Text style={styles.value}>{s.value ?? '—'}"</Text>
            <Text style={styles.label}>{s.label}</Text>
          </View>
        ))}
      </View>
      {snow.is_stale && (
        <Text style={styles.stale}>❄ Updated {formatAgo(snow.scraped_at)}</Text>
      )}
      {trails != null && (
        <Text style={styles.trails}>{trails.open}/{trails.total} trails open</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  statCol: { alignItems: 'center', flex: 1 },
  value: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  stale: { fontSize: FontSize.xs, color: Colors.warning, marginTop: Spacing.sm, textAlign: 'center' },
  unavailable: { fontSize: FontSize.md, color: Colors.textMuted, padding: Spacing.md },
  trails: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
});
