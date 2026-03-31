import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LiftDetail, LiftItem } from '../lib/types';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../constants/theme';

interface Props {
  lifts: LiftDetail | null;
}

function isGondola(name: string): boolean {
  return name.includes('Gondola') || name.includes('Tram');
}

function statusColor(status: LiftItem['status'], colors: ThemeColors): string {
  switch (status) {
    case 'open':    return colors.crowdLow;
    case 'on-hold': return colors.crowdMedium;
    case 'closed':  return colors.crowdHigh;
  }
}

export function LiftList({ lifts }: Props) {
  const { colors } = useTheme();

  if (!lifts) {
    return <Text style={[styles.unavailable, { color: colors.textMuted }]}>Lift data unavailable</Text>;
  }

  const sorted = [...lifts.items].sort((a, b) => {
    const aG = isGondola(a.name);
    const bG = isGondola(b.name);
    if (aG && !bG) return -1;
    if (!aG && bG) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.text }]}>{lifts.open}/{lifts.total} lifts open</Text>
        {lifts.is_stale && <Text style={[styles.stale, { color: colors.warning }]}>Data may be outdated</Text>}
      </View>
      {sorted.map((item) => (
        <View key={item.name} testID="lift-item" style={styles.liftRow}>
          <View style={[styles.dot, { backgroundColor: statusColor(item.status, colors) }]} />
          <Text style={[styles.liftName, { color: colors.text }]}>{item.name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: Radius.md, padding: Spacing.md },
  unavailable: { fontSize: FontSize.md, padding: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  headerText: { fontSize: FontSize.md, fontWeight: '700' },
  stale: { fontSize: FontSize.xs },
  liftRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, gap: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  liftName: { fontSize: FontSize.sm },
});
