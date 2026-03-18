import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { WebcamItem } from '../lib/types';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

const CAM_HEIGHT = 220;

function UnavailablePlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>📷 Camera temporarily unavailable</Text>
    </View>
  );
}

function HlsPlayer({ url }: { url: string }) {
  const [hasError, setHasError] = useState(false);
  const player = useVideoPlayer(url, (p) => { p.play(); });
  useEffect(() => {
    const sub = player.addListener('statusChange', (e: { status: string }) => {
      if (e.status === 'error') setHasError(true);
    });
    return () => sub.remove();
  }, [player]);
  if (hasError) return <UnavailablePlaceholder />;
  return <VideoView testID="webcam-video" player={player} style={styles.media} contentFit="cover" nativeControls={false} />;
}

function JpegCam({ url }: { url: string }) {
  const [ts, setTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return <Image testID="webcam-image" style={styles.media} source={{ uri: `${url}?t=${ts}` }} resizeMode="cover" />;
}

function CamView({ cam }: { cam: WebcamItem }) {
  if (!cam.is_alive) return <UnavailablePlaceholder />;
  if (cam.cam_type === 'hls') {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.openCamContainer}>
          <TouchableOpacity style={styles.openCamButton} onPress={() => Linking.openURL(cam.url)}>
            <Text style={styles.openCamText} onPress={() => Linking.openURL(cam.url)}>Open Cam</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return <HlsPlayer url={cam.url} />;
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
  container: { height: CAM_HEIGHT, backgroundColor: '#000', overflow: 'hidden' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
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
