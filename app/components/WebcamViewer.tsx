import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { openExternalLink } from '../lib/openExternalLink';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { WebcamItem } from '../lib/types';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';
import { proxiedWebcamUrl, fetchPictureTime } from '../lib/webcam';
import { formatAgo } from '../lib/utils';
import { touchPad, touchText } from '../constants/touch';

const CAM_HEIGHT = 220;

function UnavailablePlaceholder({ message = 'Camera not available for this mountain' }: { message?: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{message}</Text>
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
  const [failed, setFailed] = useState(false);
  const [pictureTime, setPictureTime] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // A new picture is requested every 30 s, so look up its time and retry a failed load each time.
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    fetchPictureTime(url).then((t) => { if (!cancelled) setPictureTime(t); });
    return () => { cancelled = true; };
  }, [url, ts]);

  const ago = formatAgo(pictureTime);
  return (
    <>
      <View style={styles.media}>
        <Image
          testID="webcam-image"
          style={styles.media}
          source={{ uri: proxiedWebcamUrl(url, ts) }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
        {failed && (
          <View style={styles.errorOverlay}>
            <Text style={styles.placeholderText}>Couldn't load this picture</Text>
          </View>
        )}
      </View>
      {ago && <Text testID="webcam-updated" style={styles.updated}>Updated {ago}</Text>}
    </>
  );
}

function CamView({ cam }: { cam: WebcamItem }) {
  if (!cam.is_alive) return <UnavailablePlaceholder />;
  if (cam.cam_type === 'hls') {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.openCamContainer}>
          <TouchableOpacity style={styles.openCamButton} onPress={() => openExternalLink(cam.url)}>
            <Text style={styles.openCamText}>Open Cam</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return <HlsPlayer url={cam.url} />;
  }
  return <JpegCam url={cam.url} />;
}

export function WebcamViewer({ webcams: allWebcams }: { webcams: WebcamItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  // The backend marks a cam dead when it isn't showing a live picture (see
  // scrapers/webcam_health.py), so don't offer it as a tab at all.
  const webcams = allWebcams.filter((c) => c.is_alive);
  if (webcams.length === 0) {
    // Nothing configured for this mountain vs. cameras that exist but are offline right now.
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
  container: { height: CAM_HEIGHT, backgroundColor: '#000', overflow: 'hidden' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  placeholderText: { color: Colors.textMuted, fontSize: FontSize.sm },
  media: { flex: 1, width: '100%' },
  errorOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  updated: { color: '#cbd5e1', fontSize: FontSize.xs, textAlign: 'center', paddingVertical: 4, backgroundColor: '#0f172a' },
  // The tab bar sits above the image in normal flow (not overlaid on it), so it never hides part of the picture.
  tabBar: { flexGrow: 0, backgroundColor: '#0f172a' },
  tabBarContent: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs + 2, gap: Spacing.xs },
  tab: { paddingHorizontal: Spacing.sm + touchPad, paddingVertical: 4 + touchPad, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.12)' },
  tabActive: { backgroundColor: Colors.epic },
  tabText: { color: '#cbd5e1', fontSize: FontSize.xs + touchText },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  openCamContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  openCamButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.epic },
  openCamText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
});
