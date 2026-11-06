import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { openExternalLink } from '../lib/openExternalLink';
import type { WebcamItem } from '../lib/types';
import { Spacing, FontSize } from '../constants/theme';

/** "Powered by <source>", linking to whoever really provides the cam. Nothing when the source is unknown. */
export function CamCredit({ cam }: { cam: WebcamItem }) {
  if (cam.cam_type === 'link' || !cam.source_name || !cam.source_url) return null;
  const url = cam.source_url;
  return (
    <TouchableOpacity
      testID="cam-credit"
      accessibilityRole="link"
      accessibilityLabel={`Camera powered by ${cam.source_name}`}
      style={styles.row}
      onPress={() => openExternalLink(url)}
    >
      <Text style={styles.text}>
        Powered by <Text style={styles.link}>{cam.source_name}</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md, alignItems: 'center' },
  text: { color: '#cbd5e1', fontSize: FontSize.xs },
  link: { color: '#cbd5e1', textDecorationLine: 'underline', fontWeight: '600' },
});
