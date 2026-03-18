import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { ResortSummary } from '../lib/types';
import { crowdColor, crowdLabel, formatAgo } from '../lib/utils';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

interface Props { resort: ResortSummary; }

export function ResortCard({ resort }: Props) {
  const router = useRouter();
  const passColor = resort.pass_type === 'epic' ? Colors.epic : Colors.ikon;
  const passLabel = resort.pass_type === 'epic' ? 'EPIC' : 'IKON';
  const level = resort.crowd?.current_level ?? null;

  return (
    <Pressable style={[styles.card, { borderLeftColor: passColor }]} onPress={() => router.push(`/resort/${resort.id}`)}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{resort.name}</Text>
          <View style={[styles.passBadge, { backgroundColor: passColor }]}>
            <Text style={styles.passLabel}>{passLabel}</Text>
          </View>
        </View>
        <Text style={styles.state}>{resort.state}</Text>
      </View>

      {resort.snow ? (
        <View style={styles.snowRow}>
          <View style={styles.snowItem}>
            <Text style={styles.snowLabel}>Base</Text>
            <Text style={styles.snowValue}>{resort.snow.base_in ?? '—'}"</Text>
          </View>
          <View style={styles.snowItem}>
            <Text style={styles.snowLabel}>New 24h</Text>
            <Text style={styles.snowValue}>{resort.snow.new_24h_in ?? '—'}"</Text>
          </View>
          {resort.snow.is_stale && (
            <Text style={styles.stale}>❄ Updated {formatAgo(resort.snow.scraped_at)}</Text>
          )}
        </View>
      ) : (
        <Text style={styles.unavailable}>Snow data unavailable</Text>
      )}

      <View style={styles.footer}>
        {resort.lifts != null && (
          <Text style={styles.lifts}>{resort.lifts.open}/{resort.lifts.total} lifts</Text>
        )}
        <View style={[styles.crowdPill, { backgroundColor: crowdColor(level) }]}>
          <Text style={styles.crowdText}>{crowdLabel(level)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderLeftWidth: 4, marginHorizontal: Spacing.md, marginVertical: Spacing.xs, padding: Spacing.md, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  header: { marginBottom: Spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, flex: 1 },
  passBadge: { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  passLabel: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  state: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  snowRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  snowItem: { alignItems: 'center' },
  snowLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  snowValue: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  stale: { fontSize: FontSize.xs, color: Colors.warning, flex: 1, textAlign: 'right' },
  unavailable: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  lifts: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  crowdPill: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  crowdText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '600' },
});
