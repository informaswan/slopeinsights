import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useResortDetail } from '../../hooks/useResortDetail';
import { WebcamViewer } from '../../components/WebcamViewer';
import { SnowStats } from '../../components/SnowStats';
import { CrowdChart } from '../../components/CrowdChart';
import { WeatherRow } from '../../components/WeatherRow';
import { LiftList } from '../../components/LiftList';
import { ParkingSection } from '../../components/ParkingSection';
import { useTheme } from '../../contexts/ThemeContext';
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
  const navigation = useNavigation();

  React.useEffect(() => {
    if (resort) {
      navigation.setOptions({ title: resort.name });
    }
  }, [resort, navigation]);

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

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.resortName, { color: colors.text }]}>{resort.name}</Text>
        <View style={styles.headerMeta}>
          <View style={[styles.passBadge, { backgroundColor: passColor }]}>
            <Text style={styles.passBadgeText}>{passLabel}</Text>
          </View>
          <Text style={[styles.location, { color: colors.textSecondary }]}>{resort.region}{resort.state ? ` · ${resort.state}` : ''}</Text>
        </View>
      </View>

      {/* Webcams */}
      <WebcamViewer webcams={resort.webcams} />

      {/* Snow */}
      <View testID="snow-stats" style={[styles.section, { backgroundColor: colors.surface }]}>
        <SnowStats snow={resort.snow} trails={resort.trails} />
      </View>

      {/* Crowd */}
      <View testID="crowd-chart" style={[styles.section, { backgroundColor: colors.surface }]}>
        <CrowdChart crowd={resort.crowd} currentHourIndex={getCurrentHourIndex(resort.crowd)} />
      </View>

      {/* Weather */}
      <View testID="weather-row" style={[styles.section, { backgroundColor: colors.surface }]}>
        <WeatherRow weather={resort.weather} />
      </View>

      {/* Lifts */}
      <View testID="lift-list" style={[styles.section, { backgroundColor: colors.surface }]}>
        <LiftList lifts={resort.lifts} />
      </View>

      {/* Parking */}
      <View testID="parking-section" style={[styles.section, { backgroundColor: colors.surface }]}>
        <ParkingSection parking={resort.parking} />
      </View>

      {/* Resort info */}
      <View style={[styles.section, styles.infoSection, { backgroundColor: colors.surface }]}>
        {resort.summit_elevation_ft != null && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Summit Elevation</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{resort.summit_elevation_ft.toLocaleString()} ft</Text>
          </View>
        )}
        {resort.vertical_drop_ft != null && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vertical Drop</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{resort.vertical_drop_ft.toLocaleString()} ft</Text>
          </View>
        )}
        {resort.website && (
          <TouchableOpacity onPress={() => Linking.openURL(resort.website!)}>
            <Text style={[styles.websiteText, { color: colors.epic }]}>{resort.website.replace(/^https?:\/\//, '')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: Spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  errorText: { fontSize: FontSize.md, textAlign: 'center', marginBottom: Spacing.md },
  retryButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  retryText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  header: { padding: Spacing.md, borderBottomWidth: 1 },
  resortName: { fontSize: FontSize.xxl, fontWeight: '700', marginBottom: Spacing.xs },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  passBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  passBadgeText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  location: { fontSize: FontSize.sm },
  section: { marginTop: Spacing.sm },
  infoSection: { padding: Spacing.md, gap: Spacing.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: FontSize.sm },
  infoValue: { fontSize: FontSize.sm, fontWeight: '600' },
  websiteText: { fontSize: FontSize.sm, textDecorationLine: 'underline' },
});
