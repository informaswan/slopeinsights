import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { WeatherDetail, WeatherPeriod } from '../lib/types';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../constants/theme';

interface Props {
  weather: WeatherDetail | null;
}

function dayLabel(date: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const d = new Date(date + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function ForecastCard({ period, index, colors }: { period: WeatherPeriod; index: number; colors: ThemeColors }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
      <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{dayLabel(period.date, index)}</Text>
      <View style={styles.tempRow}>
        <Text style={[styles.highTemp, { color: colors.text }]}>{period.high_f ?? '—'}°</Text>
        <Text style={[styles.lowTemp, { color: colors.textMuted }]}>{period.low_f ?? '—'}°</Text>
      </View>
      <Text style={[styles.precip, { color: colors.snowBlue }]}>{period.precip_pct ?? '—'}%</Text>
      <Text style={[styles.wind, { color: colors.textMuted }]}>{period.wind_mph ?? '—'} mph</Text>
      {period.snow_in_forecast && <Text style={[styles.snowIcon, { color: colors.snowBlue }]}>Snow</Text>}
    </View>
  );
}

export function WeatherRow({ weather }: Props) {
  const { colors } = useTheme();

  if (!weather) {
    return <Text style={[styles.unavailable, { color: colors.textMuted }]}>Weather data unavailable</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {weather.is_stale && (
        <Text style={[styles.staleNote, { color: colors.warning }]}>Weather data may be outdated</Text>
      )}
      <View style={styles.row}>
        {weather.forecast.slice(0, 3).map((period, i) => (
          <ForecastCard key={period.date} period={period} index={i} colors={colors} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, borderRadius: Radius.md },
  unavailable: { fontSize: FontSize.md, padding: Spacing.md },
  staleNote: { fontSize: FontSize.xs, marginBottom: Spacing.sm, textAlign: 'center' },
  row: { flexDirection: 'row', gap: Spacing.sm },
  card: { flex: 1, borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
  dayLabel: { fontSize: FontSize.xs, fontWeight: '700', marginBottom: Spacing.xs },
  tempRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'baseline' },
  highTemp: { fontSize: FontSize.md, fontWeight: '700' },
  lowTemp: { fontSize: FontSize.sm },
  precip: { fontSize: FontSize.xs, marginTop: 2 },
  wind: { fontSize: FontSize.xs },
  snowIcon: { fontSize: FontSize.md, marginTop: 2 },
});
