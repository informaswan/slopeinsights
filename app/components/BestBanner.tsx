import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { ResortSummary } from '../lib/types';
import { passBadge } from '../lib/utils';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface Props { resorts: ResortSummary[]; }

export function BestBanner({ resorts }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  if (resorts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.text }]}>Best conditions today</Text>
      <View style={styles.row}>
        {resorts.map((r) => {
          const { color: passColor, label: passLabel } = passBadge(r.pass_type, colors);
          const snow24h = r.snow?.new_24h_in;
          const baseIn = r.snow?.base_in;
          return (
            <Pressable
              key={r.id}
              style={({ pressed, hovered }: any) => [
                styles.tile,
                { backgroundColor: colors.surface, borderColor: colors.border, borderTopColor: passColor },
                hovered && { borderColor: colors.textMuted, borderTopColor: passColor },
                pressed && styles.tilePressed,
              ]}
              onPress={() => router.push(`/resort/${r.id}`)}
            >
              <View style={styles.tileHeader}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{r.name}</Text>
                <Text style={[styles.pass, { color: passColor }]}>{passLabel}</Text>
              </View>
              {snow24h != null ? (
                <View style={styles.snowRow}>
                  <Text style={[styles.hero, { color: colors.snowBlue }]}>
                    {snow24h}<Text style={styles.heroUnit}>"</Text>
                  </Text>
                  <Text style={[styles.heroLabel, { color: colors.textMuted }]}>new in 24h</Text>
                </View>
              ) : (
                <Text style={[styles.fallback, { color: colors.textMuted }]}>No snow data</Text>
              )}
              {baseIn != null && (
                <Text style={[styles.base, { color: colors.textSecondary }]}>{baseIn}" base</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  heading: { fontSize: FontSize.sm + 1, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    width: 156,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderTopWidth: 2,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  tilePressed: { opacity: 0.8 },
  tileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: Spacing.xs },
  name: { flexShrink: 1, fontSize: FontSize.sm, fontWeight: '700' },
  pass: { fontSize: FontSize.xs, fontWeight: '700' },
  snowRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  hero: { fontSize: FontSize.xl, fontWeight: '700', fontVariant: ['tabular-nums'] },
  heroUnit: { fontSize: FontSize.md, fontWeight: '600' },
  heroLabel: { fontSize: FontSize.xs },
  fallback: { fontSize: FontSize.sm, paddingVertical: 4 },
  base: { fontSize: FontSize.xs },
});
