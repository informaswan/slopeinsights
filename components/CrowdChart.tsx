import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CrowdDetail } from '../lib/types';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

interface Props {
  crowd: CrowdDetail | null;
  currentHourIndex: number | null;
}

const X_LABELS = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p'];
const BAR_MAX_HEIGHT = 80;

function barColor(value: number): string {
  if (value < 33) return Colors.crowdLow;
  if (value <= 66) return Colors.crowdMedium;
  return Colors.crowdHigh;
}

export function CrowdChart({ crowd, currentHourIndex }: Props) {
  if (!crowd) {
    return <Text style={styles.unavailable}>Crowd data unavailable</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        {crowd.hourly.map((value, i) => {
          const isCurrent = i === currentHourIndex;
          const height = Math.max(4, (value / 100) * BAR_MAX_HEIGHT);
          return (
            <View key={i} style={styles.barCol}>
              <View
                testID="crowd-bar"
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: isCurrent ? Colors.text : barColor(value),
                    opacity: isCurrent ? 1 : 0.7,
                  },
                ]}
              />
              <Text style={styles.xLabel}>{X_LABELS[i]}</Text>
            </View>
          );
        })}
      </View>
      {crowd.label && <Text style={styles.crowdLabel}>{crowd.label}</Text>}
      <Text style={styles.disclaimer}>Based on typical crowd patterns — not a live count</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md },
  unavailable: { fontSize: FontSize.md, color: Colors.textMuted, padding: Spacing.md },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: BAR_MAX_HEIGHT + 24, gap: 2 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 2 },
  xLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 2 },
  crowdLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
  disclaimer: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs, textAlign: 'center' },
});
