import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LiftDetail, LiftItem } from '../lib/types';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

interface Props {
  lifts: LiftDetail | null;
}

function isGondola(name: string): boolean {
  return name.includes('Gondola') || name.includes('Tram');
}

function statusColor(status: LiftItem['status']): string {
  switch (status) {
    case 'open':    return Colors.crowdLow;
    case 'on-hold': return Colors.crowdMedium;
    case 'closed':  return Colors.crowdHigh;
  }
}

export function LiftList({ lifts }: Props) {
  if (!lifts) {
    return <Text style={styles.unavailable}>Lift data unavailable</Text>;
  }

  const sorted = [...lifts.items].sort((a, b) => {
    const aG = isGondola(a.name);
    const bG = isGondola(b.name);
    if (aG && !bG) return -1;
    if (!aG && bG) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{lifts.open}/{lifts.total} lifts open</Text>
        {lifts.is_stale && <Text style={styles.stale}>Data may be outdated</Text>}
      </View>
      {sorted.map((item) => (
        <View key={item.name} testID="lift-item" style={styles.liftRow}>
          <View style={[styles.dot, { backgroundColor: statusColor(item.status) }]} />
          <Text style={styles.liftName}>{item.name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md },
  unavailable: { fontSize: FontSize.md, color: Colors.textMuted, padding: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  headerText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  stale: { fontSize: FontSize.xs, color: Colors.warning },
  liftRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, gap: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  liftName: { fontSize: FontSize.sm, color: Colors.text },
});
