import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, ScrollView, Pressable, Text, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { OfflineBanner } from './OfflineBanner';
import { useResorts } from '../hooks/useResorts';
import { useIsWide } from '../hooks/useIsWide';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { ResortCard } from './ResortCard';
import { MountainFinder } from './MountainFinder';
import { CompareChart } from './CompareChart';
import { useCardPrefs } from '../contexts/CardPrefsContext';
import { METRICS } from '../lib/cardMetrics';
import { FilterSheet } from './FilterSheet';
import type { FilterState } from './FilterSheet';
import { sortResorts, applyFilters, topByConditions } from '../lib/sort';
import type { PassFilter } from '../lib/sort';
import { passBadge } from '../lib/utils';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { touchPad, touchText } from '../constants/touch';

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
  const { resorts, best, loading, error, cachedAt, refresh } = useResorts();
  const [passFilter, setPassFilter] = useState<PassFilter>('all');
  const [filterState, setFilterState] = useState<FilterState>({ selectedRegions: new Set<string>(), sort: 'snow' });
  const [refreshing, setRefreshing] = useState(false);
  const sheetRef = useRef<any>(null);
  // Adding mountains stays open until the person taps Done, so it doesn't vanish after the first one.
  const [adding, setAdding] = useState(false);
  const [panel, setPanel] = useState<'none' | 'customize' | 'compare'>('none');
  const { metrics, toggleMetric, reset } = useCardPrefs();
  useEffect(() => {
    if (scope === 'mine' && favoritesLoaded && favoriteIds.length === 0) setAdding(true);
  }, [scope, favoritesLoaded]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const inScope = (id: string) => scope === 'all' || favoriteSet.has(id);

  // In My mountains, "best" is the best of the saved ones, even if it isn't best site-wide.
  const bestShown = useMemo(() => {
    const passOk = (r: { pass_type: string }) => passFilter === 'all' || r.pass_type === passFilter;
    if (scope === 'mine') return topByConditions(resorts.filter((r) => favoriteSet.has(r.id) && passOk(r)), 3);
    return best.filter(passOk);
  }, [best, resorts, scope, favoriteSet, passFilter]);

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
  const showFinder = scope === 'mine' && (adding || noneSaved);
  const title = scope === 'all' ? 'All mountains' : showFinder ? 'Add mountains' : 'My mountains';
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
        <OfflineBanner cachedAt={cachedAt} />
        <View style={styles.pageHeader}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {!showFinder && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>

        {showFinder ? (
          <View style={styles.empty}>
            {noneSaved && <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No saved mountains yet</Text>}
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Find a mountain and tap Add to keep it here.
            </Text>
            <MountainFinder resorts={resorts} />
            {!noneSaved && (
              <Pressable
                accessibilityLabel="Done adding mountains"
                style={[styles.retryButton, { backgroundColor: colors.epic, alignSelf: 'flex-start' }]}
                onPress={() => setAdding(false)}
              >
                <Text style={styles.retryText}>Done</Text>
              </Pressable>
            )}
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

            <View style={styles.actions}>
              <Pressable
                accessibilityLabel="Customize cards"
                style={[styles.action, { borderColor: panel === 'customize' ? colors.epic : colors.border }]}
                onPress={() => setPanel(panel === 'customize' ? 'none' : 'customize')}
              >
                <Text style={[styles.actionText, { color: panel === 'customize' ? colors.epic : colors.textSecondary }]}>Customize cards</Text>
              </Pressable>
              {scope === 'mine' && favoriteIds.length >= 2 && (
                <Pressable
                  accessibilityLabel="Compare mountains"
                  style={[styles.action, { borderColor: panel === 'compare' ? colors.epic : colors.border }]}
                  onPress={() => setPanel(panel === 'compare' ? 'none' : 'compare')}
                >
                  <Text style={[styles.actionText, { color: panel === 'compare' ? colors.epic : colors.textSecondary }]}>Compare</Text>
                </Pressable>
              )}
            </View>

            {panel === 'customize' && (
              <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.panelTitle, { color: colors.text }]}>Show on each card</Text>
                {(['now', 'expected', 'extra'] as const).map((group) => (
                  <View key={group} style={styles.panelGroup}>
                    <Text style={[styles.panelLabel, { color: colors.textMuted }]}>{group === 'now' ? 'Right now' : group === 'expected' ? 'Expected (forecast)' : 'Picture'}</Text>
                    <View style={styles.panelChips}>
                      {METRICS.filter((m) => m.group === group).map((m) => {
                        const on = metrics.includes(m.key);
                        return (
                          <Pressable
                            key={m.key}
                            accessibilityLabel={`Show ${m.longLabel} on cards`}
                            accessibilityState={{ selected: on }}
                            onPress={() => toggleMetric(m.key)}
                            style={[styles.panelChip, { backgroundColor: on ? colors.epic : colors.surfaceAlt, borderColor: on ? colors.epic : colors.border }]}
                          >
                            <Text style={[styles.panelChipText, { color: on ? '#fff' : colors.text }, on && { fontWeight: '600' }]}>{m.longLabel}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
                <Pressable accessibilityLabel="Reset cards" onPress={reset}>
                  <Text style={[styles.panelReset, { color: colors.epic }]}>Reset to default</Text>
                </Pressable>
              </View>
            )}

            {panel === 'compare' && (
              <CompareChart resorts={resorts.filter((r) => favoriteSet.has(r.id))} />
            )}

            {displayed.length + bestShown.length === 0 ? (
              (
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No mountains match your filters</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Try changing the sort or region.</Text>
                </View>
              )
            ) : (
              <View style={styles.grid}>
                {bestShown.map((item, i) => <ResortCard key={item.id} resort={item} badge={scope === 'mine' ? `Best conditions #${i + 1}` : 'Best conditions'} />)}
                {displayed.map((item) => <ResortCard key={item.id} resort={item} />)}
              </View>
            )}

            {scope === 'mine' && (
              <Pressable
                accessibilityLabel="Add more mountains"
                style={[styles.retryButton, styles.browseButton, { borderColor: colors.epic, borderWidth: 1 }]}
                onPress={() => setAdding(true)}
              >
                <Text style={[styles.retryText, { color: colors.epic }]}>Add more mountains</Text>
              </Pressable>
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
  retryButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + touchPad, borderRadius: Radius.md, marginTop: Spacing.sm },
  retryText: { color: '#fff', fontWeight: '600', fontSize: FontSize.md },
  pageHeader: { gap: 2 },
  title: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: FontSize.sm },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  tabs: { flexDirection: 'row', gap: Spacing.md },
  tab: { paddingVertical: Spacing.sm + touchPad, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabText: { fontSize: FontSize.sm + 1 + touchText, fontWeight: '500' },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.sm + touchPad, paddingLeft: Spacing.sm + touchPad },
  filterButtonText: { fontSize: FontSize.sm + 1 + touchText, fontWeight: '500' },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  action: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 + touchPad },
  actionText: { fontSize: FontSize.sm + touchText, fontWeight: '600' },
  panel: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  panelTitle: { fontSize: FontSize.md, fontWeight: '700' },
  panelGroup: { gap: Spacing.xs },
  panelLabel: { fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  panelChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2 },
  panelChip: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.sm + 4, paddingVertical: Spacing.xs + 2 + touchPad },
  panelChipText: { fontSize: FontSize.sm + touchText },
  panelReset: { fontSize: FontSize.sm + touchText, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm + 2 },
  empty: { paddingVertical: Spacing.xl, gap: Spacing.xs },
  browseButton: { alignSelf: 'flex-start', marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.md, fontWeight: '600' },
  emptySubtext: { fontSize: FontSize.sm },
});
