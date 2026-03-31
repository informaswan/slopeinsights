import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import type { ParkingDetail, LiveLot, StaticLot } from '../lib/types';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../constants/theme';

interface Props {
  parking: ParkingDetail;
}

function statusPillColor(status: string | null, colors: ThemeColors): string {
  switch (status?.toLowerCase()) {
    case 'open':    return colors.crowdLow;
    case 'limited': return colors.crowdMedium;
    case 'full':    return colors.crowdHigh;
    default:        return colors.textMuted;
  }
}

function LiveLotRow({ lot, colors }: { lot: LiveLot; colors: ThemeColors }) {
  return (
    <View style={styles.lotRow}>
      <Text style={[styles.lotName, { color: colors.text }]}>{lot.name}</Text>
      <View style={[styles.statusPill, { backgroundColor: statusPillColor(lot.status, colors) }]}>
        <Text style={styles.statusText}>{lot.status ?? '—'}</Text>
      </View>
      {lot.capacity_pct != null && (
        <Text style={[styles.capacity, { color: colors.textSecondary }]}>{lot.capacity_pct}%</Text>
      )}
    </View>
  );
}

function StaticLotRow({ lot, colors }: { lot: StaticLot; colors: ThemeColors }) {
  return (
    <View style={styles.lotRow}>
      <View style={styles.staticInfo}>
        <Text style={[styles.lotName, { color: colors.text }]}>{lot.name}</Text>
        <View style={styles.staticDetails}>
          {lot.distance_ft != null && <Text style={[styles.detail, { color: colors.textMuted }]}>{lot.distance_ft} ft</Text>}
          {lot.cost != null && <Text style={[styles.detail, { color: colors.textMuted }]}>{lot.cost}</Text>}
        </View>
      </View>
      {lot.directions_url && (
        <Pressable
          style={[styles.directionsButton, { backgroundColor: colors.epic }]}
          onPress={() => Linking.openURL(lot.directions_url!)}
        >
          <Text style={styles.directionsText}>Get Directions</Text>
        </Pressable>
      )}
    </View>
  );
}

export function ParkingSection({ parking }: Props) {
  const { colors } = useTheme();
  const showNoInfo = !parking.has_live_data && parking.static_lots.length === 0;
  if (showNoInfo) {
    return <Text style={[styles.unavailable, { color: colors.textMuted }]}>No parking info available</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {parking.has_live_data && (
        <>
          {parking.is_stale && (
            <Text style={[styles.stale, { color: colors.warning }]}>Live parking data temporarily unavailable</Text>
          )}
          {!parking.is_stale && parking.live_lots.map((lot) => (
            <LiveLotRow key={lot.name} lot={lot} colors={colors} />
          ))}
        </>
      )}
      {!parking.has_live_data && parking.static_lots.length > 0 && (
        <>
          {parking.static_lots.map((lot) => (
            <StaticLotRow key={lot.name} lot={lot} colors={colors} />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: Radius.md, padding: Spacing.md },
  unavailable: { fontSize: FontSize.md, padding: Spacing.md },
  stale: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  lotRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, gap: Spacing.sm },
  lotName: { fontSize: FontSize.sm, flex: 1, fontWeight: '500' },
  statusPill: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  statusText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '600' },
  capacity: { fontSize: FontSize.xs },
  staticInfo: { flex: 1 },
  staticDetails: { flexDirection: 'row', gap: Spacing.sm, marginTop: 2 },
  detail: { fontSize: FontSize.xs },
  directionsButton: { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  directionsText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '600' },
  divider: { height: 1, marginVertical: Spacing.sm },
});
