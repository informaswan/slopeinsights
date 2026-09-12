import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useResorts } from '../hooks/useResorts';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '../constants/theme';

type PassTab = 'epic' | 'ikon';

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { resorts } = useResorts();
  const { updateResorts } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PassTab>('epic');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const filtered = resorts.filter((r) => r.pass_type === activeTab);
    const groups: Record<string, typeof filtered> = {};
    for (const r of filtered) {
      const region = r.state || r.region || 'Other';
      if (!groups[region]) groups[region] = [];
      groups[region].push(r);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [resorts, activeTab]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      console.log('[Onboarding] Submitting resorts:', Array.from(selected));
      await updateResorts(Array.from(selected));
      console.log('[Onboarding] Success, navigating to home');
      router.replace('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save resorts';
      console.error('[Onboarding] Error:', msg);
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Pick Your Mountains</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select the resorts you want to track. You can change these anytime.
        </Text>
      </View>

      <View style={styles.tabs}>
        {(['epic', 'ikon'] as PassTab[]).map((tab) => {
          const isActive = activeTab === tab;
          const tabColor = tab === 'epic' ? colors.epic : colors.ikon;
          return (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                isActive
                  ? { backgroundColor: tabColor }
                  : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: isActive ? '#fff' : colors.textSecondary }]}>
                {tab === 'epic' ? 'Epic' : 'Ikon'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {grouped.map(([region, regionResorts]) => (
          <View key={region}>
            <Text style={[styles.regionLabel, { color: colors.textMuted }]}>{region.toUpperCase()}</Text>
            {regionResorts.map((resort) => {
              const isSelected = selected.has(resort.id);
              const passColor = resort.pass_type === 'epic' ? colors.epic : colors.ikon;
              return (
                <Pressable
                  key={resort.id}
                  style={[
                    styles.resortRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? passColor : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => toggle(resort.id)}
                >
                  <View>
                    <Text style={[styles.resortName, { color: colors.text }]}>{resort.name}</Text>
                    <Text style={[styles.resortLocation, { color: colors.textMuted }]}>
                      {resort.state ? `${resort.region}, ${resort.state}` : resort.region}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected
                        ? { backgroundColor: passColor }
                        : { borderWidth: 2, borderColor: colors.border },
                    ]}
                  >
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.bottomLeft}>
          <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
            {selected.size} resort{selected.size !== 1 ? 's' : ''} selected
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
        <Pressable
          style={[styles.submitButton, { opacity: selected.size === 0 || loading ? 0.5 : 1 }]}
          onPress={handleSubmit}
          disabled={selected.size === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>Let's Go</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: Spacing.lg, borderBottomWidth: 1 },
  title: { fontSize: FontSize.xl, fontWeight: '800' },
  subtitle: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  tabs: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, paddingBottom: 0 },
  tab: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full },
  tabText: { fontSize: FontSize.sm, fontWeight: '700' },
  list: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  regionLabel: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.md },
  resortRow: {
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  resortName: { fontSize: FontSize.md, fontWeight: '700' },
  resortLocation: { fontSize: FontSize.xs, marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderTopWidth: 1,
  },
  bottomLeft: { flex: 1 },
  selectedCount: { fontSize: FontSize.sm },
  errorText: { color: '#ef4444', fontSize: FontSize.xs, marginTop: 4 },
  submitButton: {
    backgroundColor: '#1e3a5f', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, minHeight: 40, justifyContent: 'center', alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
