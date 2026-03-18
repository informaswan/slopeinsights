// app/index.tsx
import React, { useRef, useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Text, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useResorts } from '../hooks/useResorts';
import { ResortCard } from '../components/ResortCard';
import { BestBanner } from '../components/BestBanner';
import { FilterSheet } from '../components/FilterSheet';
import type { FilterState } from '../components/FilterSheet';
import { sortResorts, applyFilters } from '../lib/sort';
import type { PassFilter } from '../lib/sort';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

const PASS_TABS: { label: string; value: PassFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Epic', value: 'epic' },
  { label: 'Ikon', value: 'ikon' },
];

export default function HomeScreen() {
  const { resorts, best, loading, error, refresh } = useResorts();
  const [passFilter, setPassFilter] = useState<PassFilter>('all');
  const [filterState, setFilterState] = useState<FilterState>({ selectedRegions: new Set<string>(), sort: 'snow' });
  const [refreshing, setRefreshing] = useState(false);
  const sheetRef = useRef<any>(null);

  const bestIds = useMemo(() => new Set(best.map(r => r.id)), [best]);

  const displayed = useMemo(() => {
    const filtered = applyFilters(resorts, passFilter, filterState.selectedRegions);
    const sorted = sortResorts(filtered, filterState.sort);
    // Exclude best-banner resorts from main list to avoid duplicate names
    return sorted.filter(r => !bestIds.has(r.id));
  }, [resorts, passFilter, filterState, bestIds]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (loading && resorts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator testID="loading-spinner" size="large" color={Colors.snowBlue} />
      </View>
    );
  }

  if (error && resorts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Unable to load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  const filteredBest = passFilter === 'all' ? best : best.filter(r => r.pass_type === passFilter);

  return (
    <View style={styles.root}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.tabs}>
          {PASS_TABS.map((tab) => {
            const isActive = passFilter === tab.value;
            const activeColor = tab.value === 'epic' ? Colors.epic : tab.value === 'ikon' ? Colors.ikon : Colors.snowBlue;
            return (
              <Pressable
                key={tab.value}
                style={[styles.tab, isActive && { backgroundColor: activeColor + '22', borderColor: activeColor }]}
                onPress={() => setPassFilter(tab.value)}
              >
                <Text style={[styles.tabText, isActive && { color: activeColor, fontWeight: '700' }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.filterButton} onPress={() => sheetRef.current?.expand()}>
          <Text style={styles.filterButtonText}>FILTER</Text>
          {(filterState.selectedRegions.size > 0 || filterState.sort !== 'snow') && (
            <View style={styles.filterDot} />
          )}
        </Pressable>
      </View>

      {/* Main list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.snowBlue}
            colors={[Colors.snowBlue]}
          />
        }
      >
        {filteredBest.length > 0 && <BestBanner resorts={filteredBest} />}
        <View style={styles.listBody}>
          {displayed.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏔</Text>
              <Text style={styles.emptyText}>No resorts match your filters</Text>
              <Text style={styles.emptySubtext}>Try changing the sort or region</Text>
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
  root: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  errorTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.epic,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSize.sm,
    letterSpacing: 0.3,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flex: 1,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  filterButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.snowBlue,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: Spacing.xl },
  listBody: { paddingTop: Spacing.sm },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
