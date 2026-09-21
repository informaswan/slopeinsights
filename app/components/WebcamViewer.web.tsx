import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import type { WebcamItem } from '../lib/types';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
function proxied(url: string) {
  return `${API_BASE}/api/webcam-proxy?url=${encodeURIComponent(url)}`;
}

const CAM_HEIGHT = 360; // fallback for RN styles only

function UnavailablePlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Camera temporarily unavailable</Text>
    </View>
  );
}

function JpegCam({ url }: { url: string }) {
  const [ts, setTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ width: '100%', height: 'min(56vh, 440px)', overflow: 'hidden', flexShrink: 0 }}>
      <img
        alt=""
        src={`${proxied(url)}&t=${ts}`}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  );
}

function CamView({ cam }: { cam: WebcamItem }) {
  if (!cam.is_alive) return <UnavailablePlaceholder />;
  if (cam.cam_type === 'hls') {
    return (
      <View style={styles.openCamContainer}>
        <TouchableOpacity style={styles.openCamButton} onPress={() => Linking.openURL(cam.url)}>
          <Text style={styles.openCamText}>Open Cam</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return <JpegCam url={cam.url} />;
}

export function WebcamViewer({ webcams }: { webcams: WebcamItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const allDead = webcams.length === 0 || webcams.every((c) => !c.is_alive);
  if (allDead) return <View style={styles.container}><UnavailablePlaceholder /></View>;

  const showTabs = webcams.length > 1;
  const activeCam = webcams[activeIndex] ?? webcams[0];

  return (
    <View style={styles.container}>
      {showTabs && (
        <ScrollView testID="webcam-tabs" horizontal showsHorizontalScrollIndicator={false}
          style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
          {webcams.map((cam, i) => (
            <TouchableOpacity key={cam.label}
              style={[styles.tab, i === activeIndex && styles.tabActive]}
              onPress={() => setActiveIndex(i)}>
              <Text style={[styles.tabText, i === activeIndex && styles.tabTextActive]}>{cam.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <CamView cam={activeCam} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#000', overflow: 'hidden', position: 'relative' },
  placeholder: { flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  placeholderText: { color: Colors.textMuted, fontSize: FontSize.sm },
  media: { flex: 1, width: '100%' },
  tabBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, maxHeight: 36 },
  tabBarContent: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.xs, gap: Spacing.xs },
  tab: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, backgroundColor: 'rgba(0,0,0,0.5)' },
  tabActive: { backgroundColor: Colors.epic },
  tabText: { color: '#cbd5e1', fontSize: FontSize.xs },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  openCamContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  openCamButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.epic },
  openCamText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
});
