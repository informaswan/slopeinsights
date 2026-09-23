import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { ResortSummary } from '../lib/types';
import { formatAgo, passBadge } from '../lib/utils';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { StarIcon } from './icons';

interface Props { resort: ResortSummary; }

export function ResortCard({ resort }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.includes(resort.id);
  const { color: passColor, label: passLabel } = passBadge(resort.pass_type, colors);
  return (
    <Pressable
      style={({ pressed, hovered }: any) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: passColor },
        hovered && { borderColor: colors.textMuted, borderLeftColor: passColor },
        pressed && styles.cardPressed,
      ]}
      onPress={() => router.push(`/resort/${resort.id}`)}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{resort.name}</Text>
        <Pressable
          hitSlop={8}
          accessibilityLabel={isFavorite ? `Remove ${resort.name} from My mountains` : `Save ${resort.name} to My mountains`}
          onPress={() => toggleFavorite(resort.id)}
        >
          <StarIcon size={16} filled={isFavorite} color={isFavorite ? colors.crowdMedium : colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.location, { color: colors.textMuted }]}>{resort.state ?? resort.region ?? ''}</Text>
        <Text style={[styles.pass, { color: passColor }]}>{passLabel}</Text>
      </View>

      {resort.snow ? (
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={[styles.number, { color: colors.textSecondary }]}>
              {resort.snow.base_in ?? '—'}
              <Text style={styles.unit}>"</Text>
            </Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>base</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.number, { color: colors.snowBlue }]}>
              {resort.snow.new_24h_in ?? '—'}
              <Text style={styles.unit}>"</Text>
            </Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>24h</Text>
          </View>
        </View>
      ) : (
        <View style={styles.metricsRow}>
          <Text style={[styles.unavailable, { color: colors.textMuted }]}>Snow data unavailable</Text>
        </View>
      )}

      {resort.snow?.is_stale && (
        <Text style={[styles.stale, { color: colors.warning }]}>Updated {formatAgo(resort.snow.scraped_at)}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 240,
    minWidth: 220,
    maxWidth: 400,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    paddingHorizontal: Spacing.md - 2,
    paddingVertical: Spacing.sm + 2,
    gap: 4,
  },
  cardPressed: { opacity: 0.8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { flex: 1, fontSize: FontSize.md, fontWeight: '700', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  location: { fontSize: FontSize.xs, fontWeight: '500' },
  pass: { fontSize: FontSize.xs, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md, marginTop: 2 },
  metric: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  number: { fontSize: FontSize.lg, fontWeight: '700', fontVariant: ['tabular-nums'] },
  unit: { fontSize: FontSize.sm, fontWeight: '600' },
  label: { fontSize: FontSize.xs },
  spacer: { flex: 1 },
  unavailable: { fontSize: FontSize.sm },
  stale: { fontSize: FontSize.xs },
});
