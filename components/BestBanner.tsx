import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { ResortSummary } from '../lib/types';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

interface Props { resorts: ResortSummary[]; }

export function BestBanner({ resorts }: Props) {
  const router = useRouter();
  if (resorts.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.headingAccent} />
        <Text style={styles.heading}>Best Conditions Today</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {resorts.map((r) => {
          const passColor = r.pass_type === 'epic' ? Colors.epic : Colors.ikon;
          const passLabel = r.pass_type === 'epic' ? 'EPIC' : 'IKON';
          const snow24h = r.snow?.new_24h_in;
          const baseIn = r.snow?.base_in;
          return (
            <Pressable
              key={r.id}
              style={({ pressed }) => [styles.card, { borderTopColor: passColor }, pressed && styles.cardPressed]}
              onPress={() => router.push(`/resort/${r.id}`)}
            >
              {/* Pass strip */}
              <View style={[styles.passStrip, { backgroundColor: passColor }]}>
                <Text style={styles.passLabel}>{passLabel}</Text>
              </View>

              {/* Snow hero — single Text node so getByText('14"') matches */}
              <View style={styles.heroRow}>
                {snow24h != null ? (
                  <Text style={styles.heroNumber}>
                    {snow24h}<Text style={styles.heroUnit}>"</Text>
                  </Text>
                ) : (
                  <Text style={styles.heroFallback}>No snow data</Text>
                )}
              </View>
              {snow24h != null && <Text style={styles.heroLabel}>NEW 24H</Text>}

              {/* Base */}
              {baseIn != null && (
                <Text style={styles.base}>{baseIn}" base</Text>
              )}

              {/* Divider */}
              <View style={styles.nameDivider} />

              {/* Name */}
              <Text style={styles.name} numberOfLines={2}>{r.name}</Text>
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
    borderBottomColor: Colors.border,
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
    backgroundColor: Colors.snowBlue,
    borderRadius: 2,
  },
  heading: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  card: {
    width: 120,
    backgroundColor: Colors.surfaceAlt,
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
    color: Colors.snowBlue,
    lineHeight: FontSize.hero + 4,
    letterSpacing: -1,
  },
  heroUnit: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.snowBlue,
    lineHeight: FontSize.hero + 4,
  },
  heroFallback: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textMuted,
    lineHeight: FontSize.hero + 4,
  },
  heroLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.sm,
    marginTop: 1,
    marginBottom: Spacing.xs,
  },
  base: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  nameDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    letterSpacing: -0.1,
  },
});
