import React, { forwardRef, useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import _BottomSheet from '@gorhom/bottom-sheet';
import type { SortOption, PassFilter } from '../lib/sort';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
// Handle CJS/ESM interop for bottom-sheet (supports jest mock without __esModule flag)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BottomSheet: any = (_BottomSheet as any).default ?? _BottomSheet;

export type { SortOption, PassFilter };

export interface FilterState {
  selectedRegions: Set<string>;
  sort: SortOption;
}

interface Props {
  filterState: FilterState;
  onApply: (state: FilterState) => void;
  filteredCount: number;
}

const REGIONS = ['Colorado', 'Utah', 'California', 'Wyoming', 'Pacific NW', 'Northeast', 'Montana / Idaho', 'Canada', 'Other US'];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'snow',  label: 'Most fresh snow' },
  { value: 'base',  label: 'Deepest base' },
];

const SNAP_POINTS = ['60%', '85%'];

export const FilterSheet = forwardRef<any, Props>(
  ({ filterState, onApply, filteredCount }, ref) => {
    const { colors } = useTheme();
    const [localState, setLocalState] = useState<FilterState>(() => ({
      selectedRegions: new Set(filterState.selectedRegions),
      sort: filterState.sort,
    }));

    useEffect(() => {
      setLocalState({ selectedRegions: new Set(filterState.selectedRegions), sort: filterState.sort });
    }, [filterState]);

    const toggleRegion = useCallback((region: string) => {
      setLocalState((prev) => {
        const next = new Set(prev.selectedRegions);
        if (next.has(region)) next.delete(region); else next.add(region);
        return { ...prev, selectedRegions: next };
      });
    }, []);

    const handleApply = useCallback(() => {
      onApply(localState);
      (ref as React.RefObject<any>)?.current?.close();
    }, [onApply, localState, ref]);

    return (
      <BottomSheet ref={ref} snapPoints={SNAP_POINTS} enablePanDownToClose index={-1}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Sort By</Text>
          {SORT_OPTIONS.map((opt) => (
            <Pressable key={opt.value} style={[styles.option, { backgroundColor: colors.surfaceAlt }, localState.sort === opt.value && { backgroundColor: colors.epic }]}
              onPress={() => setLocalState((prev) => ({ ...prev, sort: opt.value }))}>
              <Text style={[styles.optionText, { color: colors.text }, localState.sort === opt.value && styles.optionTextSelected]}>{opt.label}</Text>
            </Pressable>
          ))}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.lg }]}>Region</Text>
          <View style={styles.regionGrid}>
            {REGIONS.map((region) => {
              const selected = localState.selectedRegions.has(region);
              return (
                <Pressable key={region} style={[styles.regionChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, selected && { backgroundColor: colors.epic, borderColor: colors.epic }]} onPress={() => toggleRegion(region)}>
                  <Text style={[styles.regionText, { color: colors.text }, selected && styles.regionTextSelected]}>{region}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable style={[styles.applyButton, { backgroundColor: colors.epic }]} onPress={handleApply}>
            <Text style={styles.applyText}>Show {filteredCount} Resorts</Text>
          </Pressable>
        </ScrollView>
      </BottomSheet>
    );
  }
);
FilterSheet.displayName = 'FilterSheet';

const styles = StyleSheet.create({
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 },
  option: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.xs },
  optionText: { fontSize: FontSize.md },
  optionTextSelected: { color: '#fff', fontWeight: '600' },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  regionChip: { borderRadius: Radius.full, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderWidth: 1 },
  regionText: { fontSize: FontSize.sm },
  regionTextSelected: { color: '#fff', fontWeight: '600' },
  applyButton: { borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  applyText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
