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
    <Pressable
      style={({ pressed }) => [styles.card, { borderLeftColor: passColor }, pressed && styles.cardPressed]}
      onPress={() => router.push(`/resort/${resort.id}`)}
    >
      {/* Top section: name + pass badge */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{resort.name}</Text>
          <View style={[styles.passBadge, { backgroundColor: passColor }]}>
            <Text style={styles.passLabel}>{passLabel}</Text>
          </View>
        </View>
        {/* Render state as its own Text so getByText('CO') matches */}
        <Text style={styles.location}>
          {resort.state ?? resort.region ?? ''}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Snow hero metrics */}
      {resort.snow ? (
        <View style={styles.snowRow}>
          <View style={styles.snowMetric}>
            {/* Single Text wrapping number+"  so getByText('42"') works */}
            <Text style={styles.snowNumber}>
              {resort.snow.base_in ?? '—'}
              <Text style={styles.snowUnit}>"</Text>
            </Text>
            <Text style={styles.snowLabel}>BASE</Text>
          </View>
          <View style={styles.snowDivider} />
          <View style={styles.snowMetric}>
            <Text style={[styles.snowNumber, styles.snowNew]}>
              {resort.snow.new_24h_in ?? '—'}
              <Text style={[styles.snowUnit, styles.snowNew]}>"</Text>
            </Text>
            <Text style={styles.snowLabel}>24H NEW</Text>
          </View>
          {resort.snow.is_stale && (
            <Text style={styles.stale}>Updated {formatAgo(resort.snow.scraped_at)}</Text>
          )}
        </View>
      ) : (
        <Text style={styles.unavailable}>Snow data unavailable</Text>
      )}

      {/* Footer: lifts + crowd */}
      <View style={styles.footer}>
        {resort.lifts != null ? (
          <View style={styles.liftsRow}>
            {/* Single text node so getByText('18/31 lifts') matches */}
            <Text style={styles.liftsText}>{resort.lifts.open}/{resort.lifts.total} lifts</Text>
          </View>
        ) : (
          <View />
        )}
        <View style={[styles.crowdPill, { backgroundColor: crowdColor(level) + '22' }]}>
          <View style={[styles.crowdDot, { backgroundColor: crowdColor(level) }]} />
          <Text style={[styles.crowdText, { color: crowdColor(level) }]}>{crowdLabel(level)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderLeftWidth: 5,
    marginHorizontal: Spacing.md,
    marginVertical: 5,
    overflow: 'hidden',
    // subtle shadow on iOS
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardPressed: { opacity: 0.8 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 3,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
    letterSpacing: -0.3,
  },
  passBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  passLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  location: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  snowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  snowMetric: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  snowNumber: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textSecondary,
    lineHeight: FontSize.xl + 4,
  },
  snowNew: {
    color: Colors.snowBlue,
  },
  snowUnit: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
    lineHeight: FontSize.xl + 4,
  },
  snowLabel: {
    position: 'absolute',
    bottom: -14,
    left: 0,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  snowDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  stale: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    flex: 1,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  unavailable: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  liftsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  liftsText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  crowdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  crowdDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  crowdText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
