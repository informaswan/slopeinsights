import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { ResortSummary } from '../lib/types';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface Props { resorts: ResortSummary[]; }

export function BestBanner({ resorts }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  if (resorts.length === 0) return null;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.headingRow}>
        <View style={[styles.headingAccent, { backgroundColor: colors.snowBlue }]} />
        <Text style={[styles.heading, { color: colors.textMuted }]}>Best Conditions Today</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {resorts.map((r) => {
          const passColor = r.pass_type === 'epic' ? colors.epic : colors.ikon;
          const passLabel = r.pass_type === 'epic' ? 'EPIC' : 'IKON';
          const snow24h = r.snow?.new_24h_in;
          const baseIn = r.snow?.base_in;
          return (
            <Pressable
              key={r.id}
              style={({ pressed }) => [styles.card, { backgroundColor: colors.surfaceAlt, borderTopColor: passColor }, pressed && styles.cardPressed]}
              onPress={() => router.push(`/resort/${r.id}`)}
            >
              {/* Pass strip */}
              <View style={[styles.passStrip, { backgroundColor: passColor }]}>
                <Text style={styles.passLabel}>{passLabel}</Text>
              </View>

              {/* Snow hero — single Text node so getByText('14"') matches */}
              <View style={styles.heroRow}>
                {snow24h != null ? (
                  <Text style={[styles.heroNumber, { color: colors.snowBlue }]}>
                    {snow24h}<Text style={[styles.heroUnit, { color: colors.snowBlue }]}>"</Text>
                  </Text>
                ) : (
                  <Text style={[styles.heroFallback, { color: colors.textMuted }]}>No snow data</Text>
                )}
              </View>
              {snow24h != null && <Text style={[styles.heroLabel, { color: colors.textMuted }]}>NEW 24H</Text>}

              {/* Base */}
              {baseIn != null && (
                <Text style={[styles.base, { color: colors.textSecondary }]}>{baseIn}" base</Text>
              )}

              {/* Divider */}
              <View style={[styles.nameDivider, { backgroundColor: colors.border }]} />

              {/* Name */}
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{r.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headingAccent: {
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  heading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  card: {
    width: 120,
    borderRadius: Radius.md,
    borderTopWidth: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardPressed: { opacity: 0.75 },
  passStrip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignItems: 'flex-start',
  },
  passLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    gap: 1,
  },
  heroNumber: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    lineHeight: FontSize.hero + 4,
    letterSpacing: -1,
  },
  heroUnit: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    lineHeight: FontSize.hero + 4,
  },
  heroFallback: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    lineHeight: FontSize.hero + 4,
  },
  heroLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.sm,
    marginTop: 1,
    marginBottom: Spacing.xs,
  },
  base: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  nameDivider: {
    height: 1,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    letterSpacing: -0.1,
  },
});
