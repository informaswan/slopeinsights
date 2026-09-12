import React, { useRef, useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Text, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useResorts } from '../hooks/useResorts';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ResortCard } from '../components/ResortCard';
import { BestBanner } from '../components/BestBanner';
import { FilterSheet } from '../components/FilterSheet';
import type { FilterState } from '../components/FilterSheet';
import { sortResorts, applyFilters } from '../lib/sort';
import type { PassFilter } from '../lib/sort';
import { MountainLogo } from '../components/MountainLogo';
import { Spacing, FontSize, Radius } from '../constants/theme';

const PASS_TABS: { label: string; value: PassFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Epic', value: 'epic' },
  { label: 'Ikon', value: 'ikon' },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, savedResortIds } = useAuth();
  const router = useRouter();
  const { resorts, best, loading, error, refresh } = useResorts();
  const [passFilter, setPassFilter] = useState<PassFilter>('all');
  const [filterState, setFilterState] = useState<FilterState>({ selectedRegions: new Set<string>(), sort: 'snow' });
  const [refreshing, setRefreshing] = useState(false);
  const sheetRef = useRef<any>(null);

  const savedSet = useMemo(() => new Set(savedResortIds), [savedResortIds]);
  const bestIds = useMemo(() => new Set(best.map(r => r.id)), [best]);

  const displayed = useMemo(() => {
    const saved = resorts.filter((r) => savedSet.has(r.id));
    const filtered = applyFilters(saved, passFilter, filterState.selectedRegions);
    const sorted = sortResorts(filtered, filterState.sort);
    return sorted.filter(r => !bestIds.has(r.id));
  }, [resorts, savedSet, passFilter, filterState, bestIds]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const freshPowderCount = useMemo(() => {
    return resorts.filter((r) => savedSet.has(r.id) && r.snow && (r.snow.new_24h_in ?? 0) > 0).length;
  }, [resorts, savedSet]);

  const initials = user
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  if (loading && resorts.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator testID="loading-spinner" size="large" color={colors.snowBlue} />
      </View>
    );
  }

  if (error && resorts.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to load</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        <Pressable onPress={refresh} style={[styles.retryButton, { backgroundColor: colors.epic }]}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  const filteredBest = passFilter === 'all'
    ? best.filter((r) => savedSet.has(r.id))
    : best.filter((r) => savedSet.has(r.id) && r.pass_type === passFilter);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.headerBar}
      >
        <View style={styles.headerLeft}>
          <MountainLogo size={28} color={colors.headerText} snowColor={colors.headerTextSecondary} />
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>SlopeInsights</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push('/explore')}>
            <Text style={{ color: colors.headerTextSecondary, fontSize: 20 }}>🔍</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/profile')} style={[styles.avatarSmall, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={{ color: colors.headerText, fontWeight: '700', fontSize: FontSize.sm }}>{initials}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={[styles.greeting, { backgroundColor: colors.background }]}>
        <Text style={[styles.greetingText, { color: colors.text }]}>
          Hey {user?.name?.split(' ')[0] ?? 'there'}
          {freshPowderCount > 0
            ? ` — ${freshPowderCount} of your mountains got fresh powder overnight`
            : ''}
        </Text>
      </View>

      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.tabs}>
          {PASS_TABS.map((tab) => {
            const isActive = passFilter === tab.value;
            const activeColor = tab.value === 'epic' ? colors.epic : tab.value === 'ikon' ? colors.ikon : colors.snowBlue;
            return (
              <Pressable
                key={tab.value}
                style={[styles.tab, { borderColor: colors.border }, isActive && { backgroundColor: activeColor + '22', borderColor: activeColor }]}
                onPress={() => setPassFilter(tab.value)}
              >
                <Text style={[styles.tabText, { color: colors.textMuted }, isActive && { color: activeColor, fontWeight: '700' }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.filterButton} onPress={() => sheetRef.current?.expand()}>
          <Text style={[styles.filterButtonText, { color: colors.textMuted }]}>FILTER</Text>
          {(filterState.selectedRegions.size > 0 || filterState.sort !== 'snow') && (
            <View style={[styles.filterDot, { backgroundColor: colors.snowBlue }]} />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.snowBlue}
            colors={[colors.snowBlue]}
          />
        }
      >
        {filteredBest.length > 0 && <BestBanner resorts={filteredBest} />}
        <View style={styles.listBody}>
          {displayed.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏔</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No resorts match your filters</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Try changing the sort or region</Text>
            </View>
          ) : (
            displayed.map((item) => <ResortCard key={item.id} resort={item} />)
          )}
        </View>
      </ScrollView>

      <FilterSheet
        ref={sheetRef}
        filterState={filterState}
        onApply={(state) => setFilterState(state)}
        filteredCount={displayed.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.sm,
  },
  errorTitle: { fontSize: FontSize.xl, fontWeight: '800', letterSpacing: -0.5 },
  errorText: { fontSize: FontSize.sm, textAlign: 'center', marginBottom: Spacing.md },
  retryButton: { borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm, letterSpacing: 0.3 },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, paddingTop: Spacing.xxl,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarSmall: {
    width: 32, height: 32, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  greeting: { paddingHorizontal: Spacing.md + 4, paddingVertical: Spacing.sm },
  greetingText: { fontSize: FontSize.md, fontWeight: '600' },
  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, gap: Spacing.sm,
  },
  tabs: { flexDirection: 'row', gap: Spacing.xs, flex: 1 },
  tab: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
  },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', letterSpacing: 0.2 },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 6 },
  filterButtonText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  list: { flex: 1 },
  listContent: { paddingBottom: Spacing.xl },
  listBody: { paddingTop: Spacing.sm },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: FontSize.md, fontWeight: '700' },
  emptySubtext: { fontSize: FontSize.sm },
});
