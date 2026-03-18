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
        <ActivityIndicator testID="loading-spinner" size="large" color={Colors.epic} />
      </View>
    );
  }

  if (error && resorts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <View style={styles.tabs}>
          {PASS_TABS.map((tab) => (
            <Pressable key={tab.value} style={[styles.tab, passFilter === tab.value && styles.tabActive]} onPress={() => setPassFilter(tab.value)}>
              <Text style={[styles.tabText, passFilter === tab.value && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.filterIcon} onPress={() => sheetRef.current?.expand()}>
          <Text style={styles.filterIconText}>⚙</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {best.length > 0 && <BestBanner resorts={passFilter === 'all' ? best : best.filter(r => r.pass_type === passFilter)} />}
        {displayed.length === 0
          ? <Text style={styles.emptyText}>No resorts match your filters</Text>
          : displayed.map((item) => <ResortCard key={item.id} resort={item} />)
        }
      </View>
      <FilterSheet ref={sheetRef} filterState={filterState} onApply={(state) => setFilterState(state)} filteredCount={displayed.length} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabs: { flexDirection: 'row', gap: Spacing.xs, flex: 1 },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt },
  tabActive: { backgroundColor: Colors.epic },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  filterIcon: { padding: Spacing.xs },
  filterIconText: { fontSize: FontSize.lg },
  list: { paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.xl, fontSize: FontSize.md },
  errorText: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.md, textAlign: 'center' },
  retryButton: { backgroundColor: Colors.epic, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  retryText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
