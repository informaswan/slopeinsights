import React, { useRef, useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Text, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useResorts } from '../hooks/useResorts';
import { useIsWide } from '../hooks/useIsWide';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { ResortCard } from './ResortCard';
import { BestBanner } from './BestBanner';
import { FilterSheet } from './FilterSheet';
import type { FilterState } from './FilterSheet';
import { sortResorts, applyFilters } from '../lib/sort';
import type { PassFilter } from '../lib/sort';
import { passBadge } from '../lib/utils';
import { Spacing, FontSize, Radius } from '../constants/theme';

const PASS_TABS: { label: string; value: PassFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Epic', value: 'epic' },
  { label: 'Ikon', value: 'ikon' },
  { label: 'Independent', value: 'independent' },
];

interface Props {
  scope: 'all' | 'mine';
}

export function MountainsScreen({ scope }: Props) {
  const { colors } = useTheme();
  const isWide = useIsWide();
  const { favoriteIds, isLoaded: favoritesLoaded } = useFavorites();
  const { resorts, best, loading, error, refresh } = useResorts();
  const [passFilter, setPassFilter] = useState<PassFilter>('all');
  const [filterState, setFilterState] = useState<FilterState>({ selectedRegions: new Set<string>(), sort: 'snow' });
  const [refreshing, setRefreshing] = useState(false);
  const sheetRef = useRef<any>(null);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const inScope = (id: string) => scope === 'all' || favoriteSet.has(id);

  const bestShown = useMemo(
    () => best.filter((r) => inScope(r.id) && (passFilter === 'all' || r.pass_type === passFilter)),
    [best, scope, favoriteSet, passFilter],
  );

  const displayed = useMemo(() => {
    const scoped = resorts.filter((r) => inScope(r.id));
    const filtered = applyFilters(scoped, passFilter, filterState.selectedRegions);
    const bestIds = new Set(bestShown.map((r) => r.id));
    return sortResorts(filtered, filterState.sort).filter((r) => !bestIds.has(r.id));
  }, [resorts, scope, favoriteSet, passFilter, filterState, bestShown]);

  const freshPowderCount = useMemo(
    () => resorts.filter((r) => inScope(r.id) && r.snow && (r.snow.new_24h_in ?? 0) > 0).length,
    [resorts, scope, favoriteSet],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (!favoritesLoaded || (loading && resorts.length === 0)) {
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

  const noneSaved = scope === 'mine' && favoriteIds.length === 0;
  const title = scope === 'mine' ? 'My mountains' : 'All mountains';
  const subtitle = freshPowderCount > 0
    ? `${freshPowderCount} ${freshPowderCount === 1 ? 'mountain' : 'mountains'} got fresh powder overnight`
    : "Today's conditions";
  const filtersActive = filterState.selectedRegions.size > 0 || filterState.sort !== 'snow';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { padding: isWide ? Spacing.lg : Spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.snowBlue}
            colors={[colors.snowBlue]}
          />
        }
      >
        <View style={styles.pageHeader}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {!noneSaved && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>

        {noneSaved ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No saved mountains yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Tap the star on any mountain to keep it here.
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
              <View style={styles.tabs}>
                {PASS_TABS.map((tab) => {
                  const isActive = passFilter === tab.value;
                  const activeColor = tab.value === 'all' ? colors.text : passBadge(tab.value, colors).color;
                  return (
                    <Pressable
                      key={tab.value}
                      accessibilityLabel={`Filter by ${tab.label}`}
                      style={[styles.tab, isActive && { borderBottomColor: activeColor }]}
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
                <Text style={[styles.filterButtonText, { color: colors.textSecondary }]}>Filter</Text>
                {filtersActive && <View style={[styles.filterDot, { backgroundColor: colors.snowBlue }]} />}
              </Pressable>
            </View>

            <BestBanner resorts={bestShown} />

            {displayed.length === 0 ? (
              bestShown.length === 0 && (
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No mountains match your filters</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Try changing the sort or region.</Text>
                </View>
              )
            ) : (
              <View style={styles.grid}>
                {displayed.map((item) => <ResortCard key={item.id} resort={item} />)}
              </View>
            )}
          </>
        )}
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
  scroll: { flex: 1 },
  content: { gap: Spacing.lg, maxWidth: 1240, width: '100%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  errorTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  errorText: { fontSize: FontSize.sm, textAlign: 'center' },
  retryButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md, marginTop: Spacing.sm },
  retryText: { color: '#fff', fontWeight: '600', fontSize: FontSize.md },
  pageHeader: { gap: 2 },
  title: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: FontSize.sm },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  tabs: { flexDirection: 'row', gap: Spacing.md },
  tab: { paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabText: { fontSize: FontSize.sm + 1, fontWeight: '500' },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.sm },
  filterButtonText: { fontSize: FontSize.sm + 1, fontWeight: '500' },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm + 2 },
  empty: { paddingVertical: Spacing.xl, gap: Spacing.xs },
  emptyText: { fontSize: FontSize.md, fontWeight: '600' },
  emptySubtext: { fontSize: FontSize.sm },
});
