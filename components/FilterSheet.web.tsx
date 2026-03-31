import React, { forwardRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import { View, Text, Pressable, ScrollView, Modal, StyleSheet } from 'react-native';
import type { SortOption, PassFilter } from '../lib/sort';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

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
  { value: 'crowd', label: 'Least crowded' },
  { value: 'lifts', label: 'Most lifts open' },
];

export const FilterSheet = forwardRef<any, Props>(
  ({ filterState, onApply, filteredCount }, ref) => {
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);
    const [localState, setLocalState] = useState<FilterState>(() => ({
      selectedRegions: new Set(filterState.selectedRegions),
      sort: filterState.sort,
    }));

    useImperativeHandle(ref, () => ({
      expand: () => setVisible(true),
      close:  () => setVisible(false),
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
      setVisible(false);
    }, [onApply, localState]);

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>Filter & Sort</Text>
              <Pressable onPress={() => setVisible(false)} style={styles.closeBtn}>
                <Text style={[styles.closeText, { color: colors.textMuted }]}>✕</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Sort By</Text>
              {SORT_OPTIONS.map((opt) => (
                <Pressable key={opt.value}
                  style={[styles.option, { backgroundColor: colors.surfaceAlt }, localState.sort === opt.value && { backgroundColor: colors.epic }]}
                  onPress={() => setLocalState((prev) => ({ ...prev, sort: opt.value }))}>
                  <Text style={[styles.optionText, { color: colors.text }, localState.sort === opt.value && styles.optionTextSelected]}>{opt.label}</Text>
                </Pressable>
              ))}
              <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: Spacing.lg }]}>Region</Text>
              <View style={styles.regionGrid}>
                {REGIONS.map((region) => {
                  const selected = localState.selectedRegions.has(region);
                  return (
                    <Pressable key={region}
                      style={[styles.regionChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, selected && { backgroundColor: colors.epic, borderColor: colors.epic }]}
                      onPress={() => toggleRegion(region)}>
                      <Text style={[styles.regionText, { color: colors.text }, selected && styles.regionTextSelected]}>{region}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable style={[styles.applyButton, { backgroundColor: colors.epic }]} onPress={handleApply}>
                <Text style={styles.applyText}>Show {filteredCount} Resorts</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }
);
FilterSheet.displayName = 'FilterSheet';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '80%',
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  title: { fontSize: FontSize.lg, fontWeight: '700' },
  closeBtn: { padding: Spacing.xs },
  closeText: { fontSize: FontSize.lg },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: '700', marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
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
