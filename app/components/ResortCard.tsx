import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { ResortSummary } from '../lib/types';
import { formatAgo, passBadge } from '../lib/utils';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { StarIcon } from './icons';
import { useCardPrefs } from '../contexts/CardPrefsContext';
import { STAT_METRICS } from '../lib/cardMetrics';
import { proxiedWebcamUrl } from '../lib/webcam';

interface Props { resort: ResortSummary; }

export function ResortCard({ resort }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.includes(resort.id);
  const { metrics } = useCardPrefs();
  const chosen = STAT_METRICS.filter((m) => metrics.includes(m.key));
  const cams = resort.cameras?.length ? resort.cameras : resort.camera_url ? [{ label: 'Camera', url: resort.camera_url }] : [];
  const [camIndex, setCamIndex] = useState(0);
  const cam = cams[camIndex % Math.max(cams.length, 1)];
  const showCamera = metrics.includes('camera') && cams.length > 0;
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
        <Text style={[styles.name, { color: colors.text }]}>{resort.name}</Text>
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

      {showCamera && (
        <View style={styles.cameraWrap}>
          <Image
            testID="card-camera"
            accessibilityLabel={`${resort.name} camera${cams.length > 1 ? `, ${cam.label}` : ''}`}
            source={{ uri: proxiedWebcamUrl(cam.url) }}
            style={[styles.camera, { backgroundColor: colors.surfaceAlt }]}
            resizeMode="cover"
          />
          {cams.length > 1 && (
            <>
              <Pressable accessibilityLabel="Previous camera" hitSlop={6} style={[styles.camArrow, styles.camPrev]} onPress={() => setCamIndex((camIndex + cams.length - 1) % cams.length)}>
                <Text style={styles.camArrowText}>‹</Text>
              </Pressable>
              <Pressable accessibilityLabel="Next camera" hitSlop={6} style={[styles.camArrow, styles.camNext]} onPress={() => setCamIndex((camIndex + 1) % cams.length)}>
                <Text style={styles.camArrowText}>›</Text>
              </Pressable>
              <View pointerEvents="none" style={styles.camDots}>
                {cams.map((c, i) => <View key={c.url} style={[styles.camDot, { opacity: i === camIndex ? 1 : 0.45 }]} />)}
              </View>
            </>
          )}
        </View>
      )}

      {resort.snow ? (
        <View style={styles.metricsRow}>
          {chosen.map((m) => (
            <View key={m.key} style={styles.metric}>
              <Text style={[styles.number, { color: m.key === 'past24' ? colors.snowBlue : colors.textSecondary }]}>
                {m.text(resort)}
              </Text>
              <Text style={[styles.label, { color: colors.textMuted }]}>{m.label}</Text>
            </View>
          ))}
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
  cameraWrap: { marginVertical: 2 },
  camera: { width: '100%', height: 120, borderRadius: Radius.sm },
  camArrow: { position: 'absolute', top: 44, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.55)' },
  camPrev: { left: 6 },
  camNext: { right: 6 },
  camArrowText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  camDots: { position: 'absolute', bottom: 6, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  camDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  cardPressed: { opacity: 0.8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { flex: 1, fontSize: FontSize.md, fontWeight: '700', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  location: { flexShrink: 0, fontSize: FontSize.xs, fontWeight: '500' },
  pass: { flexShrink: 0, fontSize: FontSize.xs, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.xs, columnGap: Spacing.md, marginTop: 2 },
  metric: { gap: 1 },
  number: { fontSize: FontSize.md, fontWeight: '700', fontVariant: ['tabular-nums'] },
  label: { fontSize: FontSize.xs },
  spacer: { flex: 1 },
  unavailable: { fontSize: FontSize.sm },
  stale: { fontSize: FontSize.xs },
});
