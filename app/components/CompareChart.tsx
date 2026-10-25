import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { ResortSummary } from '../lib/types';
import { METRICS, STAT_METRICS, MAX_COMPARE } from '../lib/cardMetrics';
import type { MetricKey } from '../lib/cardMetrics';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { touchPad, touchText } from '../constants/touch';
import { useTheme } from '../contexts/ThemeContext';

// One colour per mountain, picked to stay apart in both light and dark mode.
const SERIES = ['#3B82F6', '#F97316', '#10B981', '#A855F7', '#EF4444'];

// Side by side bars for up to five of your mountains, one measure at a time.
export function CompareChart({ resorts }: { resorts: ResortSummary[] }) {
  const { colors } = useTheme();
  const [picked, setPicked] = useState<string[]>(() => resorts.slice(0, 3).map((r) => r.id));
  const [metricKey, setMetricKey] = useState<MetricKey>('base');
  const metric = METRICS.find((m) => m.key === metricKey)!;

  const toggle = (id: string) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < MAX_COMPARE ? [...cur, id] : cur));

  const rows = useMemo(
    () => picked.map((id) => resorts.find((r) => r.id === id)).filter((r): r is ResortSummary => !!r),
    [picked, resorts],
  );
  const max = Math.max(1, ...rows.map((r) => metric.value(r) ?? 0));
  const full = picked.length >= MAX_COMPARE;

  return (
    <View testID="compare-chart" style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Compare mountains</Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>Pick up to {MAX_COMPARE} · {picked.length} chosen</Text>

      <View style={styles.chips}>
        {resorts.map((r) => {
          const on = picked.includes(r.id);
          const dot = SERIES[picked.indexOf(r.id)];
          const blocked = !on && full;
          return (
            <Pressable
              key={r.id}
              accessibilityLabel={`${on ? 'Remove' : 'Compare'} ${r.name}`}
              accessibilityState={{ disabled: blocked, selected: on }}
              disabled={blocked}
              onPress={() => toggle(r.id)}
              style={[styles.chip, { borderColor: on ? dot : colors.border, backgroundColor: on ? colors.surfaceAlt : 'transparent', opacity: blocked ? 0.4 : 1 }]}
            >
              {on && <View style={[styles.dot, { backgroundColor: dot }]} />}
              <Text style={[styles.chipText, { color: colors.text }]}>{r.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {STAT_METRICS.map((m) => {
          const on = m.key === metricKey;
          return (
            <Pressable
              key={m.key}
              accessibilityLabel={`Compare ${m.longLabel}`}
              onPress={() => setMetricKey(m.key)}
              style={[styles.tab, on && { borderBottomColor: colors.epic }]}
            >
              <Text style={[styles.tabText, { color: on ? colors.epic : colors.textMuted }, on && { fontWeight: '700' }]}>{m.longLabel}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {rows.length === 0 ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Choose a mountain above to see it here.</Text>
      ) : (
        <View style={styles.bars}>
          {rows.map((r, i) => {
            const v = metric.value(r);
            return (
              <View key={r.id} style={styles.barRow}>
                <View style={styles.barHead}>
                  <Text style={[styles.barName, { color: colors.text }]}>{r.name}</Text>
                  <Text style={[styles.barValue, { color: colors.text }]}>{metric.text(r)}</Text>
                </View>
                <View style={[styles.track, { backgroundColor: colors.borderSubtle }]}>
                  <View
                    testID={`bar-${r.id}`}
                    style={[styles.fill, { backgroundColor: SERIES[i], width: `${v == null ? 0 : Math.max(2, (v / max) * 100)}%` }]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  heading: { fontSize: FontSize.md, fontWeight: '700' },
  hint: { fontSize: FontSize.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.sm + 4, paddingVertical: Spacing.xs + 2 + touchPad },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: FontSize.sm + touchText },
  tabs: { gap: Spacing.md },
  tab: { paddingVertical: Spacing.xs + touchPad, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: FontSize.sm + touchText },
  bars: { gap: Spacing.sm },
  barRow: { gap: 4 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  barName: { flexShrink: 1, fontSize: FontSize.sm + touchText, fontWeight: '600' },
  barValue: { fontSize: FontSize.sm + touchText, fontVariant: ['tabular-nums'] },
  track: { height: 12, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
});
