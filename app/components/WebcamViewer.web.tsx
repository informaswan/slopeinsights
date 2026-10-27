import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { openExternalLink } from '../lib/openExternalLink';
import type { WebcamItem } from '../lib/types';
import { isTrustedStream } from '../lib/streamHost';
import { ZoomFrame } from './ZoomFrame';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
function proxied(url: string) {
  return `${API_BASE}/api/webcam-proxy?url=${encodeURIComponent(url)}`;
}

const CAM_HEIGHT = 360; // fallback for RN styles only

function UnavailablePlaceholder({ message = 'Camera not available for this mountain' }: { message?: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{message}</Text>
    </View>
  );
}

function JpegCam({ url }: { url: string }) {
  const [ts, setTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return <ZoomFrame uri={`${proxied(url)}&t=${ts}`} />;
}

// A cam with a live stream plays it by default (muted); the picture is one tap away. Only the open tab's stream loads.
function StreamCam({ cam }: { cam: WebcamItem }) {
  const [live, setLive] = useState(true);
  useEffect(() => { setLive(true); }, [cam.url]);
  return (
    <View>
      {live ? (
        // @ts-ignore: react-native-web renders DOM elements
        <iframe
          title={`${cam.label} live`}
          src={cam.stream_url!}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          style={{ width: '100%', aspectRatio: '16 / 9', border: 0, display: 'block' }}
        />
      ) : (
        <JpegCam url={cam.url} />
      )}
      <TouchableOpacity
        style={styles.liveToggle}
        accessibilityLabel={live ? 'Show picture' : 'Watch live'}
        onPress={() => setLive(!live)}
      >
        <Text style={styles.liveToggleText}>{live ? 'Show picture' : '● Watch live'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function CamView({ cam }: { cam: WebcamItem }) {
  if (!cam.is_alive) return <UnavailablePlaceholder />;
  if (isTrustedStream(cam.stream_url)) return <StreamCam cam={cam} />;
  if (cam.cam_type === 'hls') {
    return (
      <View style={styles.openCamContainer}>
        <TouchableOpacity style={styles.openCamButton} onPress={() => openExternalLink(cam.url)}>
          <Text style={styles.openCamText}>Open Cam</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return <JpegCam url={cam.url} />;
}

export function WebcamViewer({ webcams: allWebcams }: { webcams: WebcamItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  // The backend marks a cam dead when it isn't showing a live picture (see
  // scrapers/webcam_health.py), so don't offer it as a tab at all.
  const webcams = allWebcams.filter((c) => c.is_alive);
  if (webcams.length === 0) {
    const message = allWebcams.length === 0 ? undefined : 'Cameras offline right now';
    return <View style={styles.container}><UnavailablePlaceholder message={message} /></View>;
  }

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
  // The tab bar sits above the image in normal flow (not overlaid on it), so it never hides part of the picture.
  tabBar: { flexGrow: 0, backgroundColor: '#0f172a' },
  tabBarContent: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs + 2, gap: Spacing.xs },
  tab: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.12)' },
  tabActive: { backgroundColor: Colors.epic },
  tabText: { color: '#cbd5e1', fontSize: FontSize.xs },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  liveToggle: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, backgroundColor: 'rgba(0,0,0,0.65)' },
  liveToggleText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  openCamContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  openCamButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.epic },
  openCamText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
});
