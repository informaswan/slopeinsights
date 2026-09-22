import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { api } from '../lib/api';
import type { RoadCameraGroup } from '../lib/types';
import { CameraLinks } from '../components/CameraLinks';
import { useTheme } from '../contexts/ThemeContext';
import { useIsWide } from '../hooks/useIsWide';
import { FontSize, Radius, Spacing } from '../constants/theme';

export default function RoadCamerasScreen() {
  const { colors } = useTheme();
  const isWide = useIsWide();
  const [groups, setGroups] = useState<RoadCameraGroup[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    api.getRoadCameras().then((r) => setGroups(r.groups)).catch(() => setFailed(true));
  }, []);

  useEffect(load, [load]);

  if (failed) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to load road cameras</Text>
        <Pressable onPress={load} style={[styles.retry, { backgroundColor: colors.epic }]}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!groups) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.snowBlue} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { padding: isWide ? Spacing.lg : Spacing.md }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Road cameras</Text>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          These links open COtrip, Colorado's official traffic site, on a map centered on each stop.
          Cameras are available from the map's layers menu.
        </Text>
      </View>

      {groups.map((group) => (
        <View key={group.name} style={styles.group}>
          <View>
            <Text style={[styles.groupTitle, { color: colors.text }]}>{group.name}</Text>
            {group.note && <Text style={[styles.note, { color: colors.textMuted }]}>{group.note}</Text>}
          </View>
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CameraLinks links={group.stops.map((s) => ({ label: s.name, url: s.url }))} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  errorTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  retry: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  retryText: { color: '#fff', fontWeight: '600', fontSize: FontSize.md },
  content: { gap: Spacing.lg, maxWidth: 720, width: '100%' },
  header: { gap: Spacing.xs },
  title: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.4 },
  intro: { fontSize: FontSize.sm + 1, lineHeight: 20 },
  group: { gap: Spacing.sm },
  groupTitle: { fontSize: FontSize.md, fontWeight: '700' },
  note: { fontSize: FontSize.sm, marginTop: 2 },
  panel: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
});
