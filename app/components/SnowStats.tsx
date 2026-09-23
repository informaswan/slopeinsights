// components/SnowStats.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SnowDetail, SnowForecastDetail, TrailSummary } from '../lib/types';
import { formatAgo } from '../lib/utils';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../constants/theme';

interface Props {
  snow: SnowDetail | null;
  trails: TrailSummary | null;
  forecast?: SnowForecastDetail | null;
}

function StatRow({ stats, colors }: { stats: { label: string; value: number | null }[]; colors: ThemeColors }) {
  return (
    <View style={styles.row}>
      {stats.map((s) => (
        <View key={s.label} style={styles.statCol}>
          <Text style={[styles.value, { color: colors.text }]}>{s.value ?? '—'}"</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function SnowStats({ snow, trails, forecast = null }: Props) {
  const { colors } = useTheme();

  if (!snow && !forecast) {
    return <Text style={[styles.unavailable, { color: colors.textMuted }]}>Snow data unavailable</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.section, { color: colors.textSecondary }]}>Fell (reported by the resort)</Text>
      {snow ? (
        <StatRow
          colors={colors}
          stats={[
            { label: 'Base', value: snow.base_in },
            { label: 'Past 24h', value: snow.new_24h_in },
            { label: 'Past 48h', value: snow.new_48h_in },
            { label: 'Past 72h', value: snow.new_7d_in },
          ]}
        />
      ) : (
        <Text style={[styles.unavailable, { color: colors.textMuted }]}>Snow data unavailable</Text>
      )}
      {snow?.is_stale && (
        <Text style={[styles.stale, { color: colors.warning }]}>Updated {formatAgo(snow.scraped_at) ?? 'recently'}</Text>
      )}

      <Text style={[styles.section, styles.sectionGap, { color: colors.textSecondary }]}>Expected (weather forecast)</Text>
      {forecast ? (
        <>
          <StatRow
            colors={colors}
            stats={[
              { label: 'Next 24h', value: forecast.next_24h_in },
              { label: 'Next 48h', value: forecast.next_48h_in },
              { label: 'Next 72h', value: forecast.next_72h_in },
            ]}
          />
          <Text style={[styles.note, { color: colors.textMuted }]}>
            National Weather Service forecast for the base area; higher terrain often gets more.
          </Text>
        </>
      ) : (
        <Text style={[styles.unavailable, { color: colors.textMuted }]}>Snow forecast not available for this mountain</Text>
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
  section: { fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: Spacing.xs },
  sectionGap: { marginTop: Spacing.md },
  note: { fontSize: FontSize.xs, marginTop: Spacing.xs, textAlign: 'center' },
});
