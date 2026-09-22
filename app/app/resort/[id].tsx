import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useResortDetail } from '../../hooks/useResortDetail';
import { WebcamViewer } from '../../components/WebcamViewer';
import { SnowStats } from '../../components/SnowStats';
import { CrowdChart } from '../../components/CrowdChart';
import { WeatherRow } from '../../components/WeatherRow';
import { ParkingSection } from '../../components/ParkingSection';
import { CameraLinks } from '../../components/CameraLinks';
import { useTheme } from '../../contexts/ThemeContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useIsWide } from '../../hooks/useIsWide';
import { ChevronLeftIcon, StarIcon } from '../../components/icons';
import { Spacing, FontSize, Radius } from '../../constants/theme';

function getCurrentHourIndex(crowd: { hourly_start: string; hourly: number[] } | null): number | null {
  if (!crowd) return null;
  const now = new Date();
  const [startH] = crowd.hourly_start.split(':').map(Number);
  const currentH = now.getHours();
  const index = currentH - startH;
  if (index < 0 || index >= crowd.hourly.length) return null;
  return index;
}

export default function ResortDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resort, loading, error, refresh } = useResortDetail(Array.isArray(id) ? id[0] : id);
  const { colors } = useTheme();
  const router = useRouter();
  const isWide = useIsWide();
  const { favoriteIds, toggleFavorite } = useFavorites();

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator testID="detail-loading" size="large" color={colors.epic} />
      </View>
    );
  }

  if (error || !resort) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error ?? 'Something went wrong'}</Text>
        <TouchableOpacity onPress={refresh} style={[styles.retryButton, { backgroundColor: colors.epic }]}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const passColor = resort.pass_type === 'epic' ? colors.epic : colors.ikon;
  const passLabel = resort.pass_type === 'epic' ? 'Epic' : 'Ikon';
  const isFavorite = favoriteIds.includes(resort.id);
  const panel = [styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }];

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: isWide ? Spacing.lg : Spacing.md }]}
    >
      <TouchableOpacity style={styles.back} onPress={() => router.push('/')} accessibilityLabel="Back to all mountains">
        <ChevronLeftIcon size={16} color={colors.textSecondary} />
        <Text style={[styles.backText, { color: colors.textSecondary }]}>All mountains</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.resortName, { color: colors.text }]}>{resort.name}</Text>
          <View style={styles.headerMeta}>
            <Text style={[styles.passText, { color: passColor }]}>{passLabel}</Text>
            <Text style={[styles.location, { color: colors.textSecondary }]}>{resort.region}{resort.state ? `, ${resort.state}` : ''}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
          accessibilityLabel={isFavorite ? `Remove ${resort.name} from My mountains` : `Save ${resort.name} to My mountains`}
          onPress={() => toggleFavorite(resort.id)}
        >
          <StarIcon size={15} filled={isFavorite} color={isFavorite ? colors.crowdMedium : colors.textSecondary} />
          <Text style={[styles.saveText, { color: colors.text }]}>{isFavorite ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.webcam}>
        <WebcamViewer webcams={resort.webcams} />
      </View>

      <View style={styles.grid}>
        <View testID="snow-stats" style={panel}>
          <Text style={[styles.panelTitle, { color: colors.textSecondary }]}>Snow</Text>
          <SnowStats snow={resort.snow} trails={resort.trails} />
        </View>
        <View testID="weather-row" style={panel}>
          <Text style={[styles.panelTitle, { color: colors.textSecondary }]}>Forecast</Text>
          <WeatherRow weather={resort.weather} />
        </View>
        <View testID="crowd-chart" style={panel}>
          <Text style={[styles.panelTitle, { color: colors.textSecondary }]}>Crowds</Text>
          <CrowdChart crowd={resort.crowd} currentHourIndex={getCurrentHourIndex(resort.crowd)} />
        </View>
        <View testID="parking-section" style={panel}>
          <Text style={[styles.panelTitle, { color: colors.textSecondary }]}>Parking</Text>
          <ParkingSection parking={resort.parking} />
        </View>
      </View>

      {resort.traffic_cams && resort.traffic_cams.length > 0 && (
        <View style={[styles.linkPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.panelTitle, { color: colors.textSecondary }]}>Road cameras</Text>
          <CameraLinks links={resort.traffic_cams} />
          {resort.traffic_cams_note && (
            <Text style={[styles.comingSoon, { color: colors.textMuted }]}>{resort.traffic_cams_note}</Text>
          )}
        </View>
      )}

      {(resort.summit_elevation_ft != null || resort.vertical_drop_ft != null || resort.website) && (
        <View style={[styles.panel, styles.infoPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {resort.summit_elevation_ft != null && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Summit elevation</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{resort.summit_elevation_ft.toLocaleString()} ft</Text>
            </View>
          )}
          {resort.vertical_drop_ft != null && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vertical drop</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{resort.vertical_drop_ft.toLocaleString()} ft</Text>
            </View>
          )}
          {resort.website && (
            <TouchableOpacity onPress={() => Linking.openURL(resort.website!)}>
              <Text style={[styles.websiteText, { color: colors.epic }]}>{resort.website.replace(/^https?:\/\//, '')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { gap: Spacing.md, maxWidth: 1100, width: '100%' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  errorText: { fontSize: FontSize.md, textAlign: 'center', marginBottom: Spacing.md },
  retryButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  retryText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 2 },
  backText: { fontSize: FontSize.sm + 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md },
  headerText: { flex: 1, gap: 2 },
  resortName: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.4 },
  headerMeta: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  passText: { fontSize: FontSize.sm, fontWeight: '700' },
  location: { fontSize: FontSize.sm },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.sm + 4, paddingVertical: 7,
  },
  saveText: { fontSize: FontSize.sm + 1, fontWeight: '600' },
  webcam: { borderRadius: Radius.md, overflow: 'hidden', maxWidth: 800, width: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  panel: { flexGrow: 1, flexBasis: 340, borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  panelTitle: { fontSize: FontSize.sm, fontWeight: '600', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm + 2 },
  comingSoon: { fontSize: FontSize.xs, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm + 2, fontStyle: 'italic' },
  linkPanel: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  infoPanel: { padding: Spacing.md, gap: Spacing.sm, flexBasis: 'auto' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: FontSize.sm },
  infoValue: { fontSize: FontSize.sm, fontWeight: '600' },
  websiteText: { fontSize: FontSize.sm, textDecorationLine: 'underline' },
});
