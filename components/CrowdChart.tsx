import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CrowdDetail } from '../lib/types';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../constants/theme';

interface Props {
  crowd: CrowdDetail | null;
  currentHourIndex: number | null;
}

const X_LABELS = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p'];
const BAR_MAX_HEIGHT = 80;

function barColor(value: number, colors: ThemeColors): string {
  if (value < 33) return colors.crowdLow;
  if (value <= 66) return colors.crowdMedium;
  return colors.crowdHigh;
}

export function CrowdChart({ crowd, currentHourIndex }: Props) {
  const { colors } = useTheme();

  if (!crowd) {
    return <Text style={[styles.unavailable, { color: colors.textMuted }]}>Crowd data unavailable</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.chartArea}>
        {crowd.hourly.slice(0, 10).map((value, i) => {
          const isCurrent = i === currentHourIndex;
          const height = Math.max(4, (value / 100) * BAR_MAX_HEIGHT);
          return (
            <View key={X_LABELS[i]} style={styles.barCol}>
              <View
                testID="crowd-bar"
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: isCurrent ? colors.text : barColor(value, colors),
                    opacity: isCurrent ? 1 : 0.7,
                  },
                ]}
              />
              <Text style={[styles.xLabel, { color: colors.textMuted }]}>{X_LABELS[i]}</Text>
            </View>
          );
        })}
      </View>
      {crowd.label && <Text style={[styles.crowdLabel, { color: colors.textSecondary }]}>{crowd.label}</Text>}
      <Text style={[styles.disclaimer, { color: colors.textMuted }]}>Based on typical crowd patterns — not a live count</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, borderRadius: Radius.md },
  unavailable: { fontSize: FontSize.md, padding: Spacing.md },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: BAR_MAX_HEIGHT + 24, gap: 2 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 2 },
  xLabel: { fontSize: FontSize.xs, marginTop: 2 },
  crowdLabel: { fontSize: FontSize.sm, marginTop: Spacing.sm, textAlign: 'center' },
  disclaimer: { fontSize: FontSize.xs, marginTop: Spacing.xs, textAlign: 'center' },
});
