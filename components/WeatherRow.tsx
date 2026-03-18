import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { WeatherDetail, WeatherPeriod } from '../lib/types';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

interface Props {
  weather: WeatherDetail | null;
}

function dayLabel(date: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const d = new Date(date + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function ForecastCard({ period, index }: { period: WeatherPeriod; index: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.dayLabel}>{dayLabel(period.date, index)}</Text>
      <View style={styles.tempRow}>
        <Text style={styles.highTemp}>{period.high_f ?? '—'}°</Text>
        <Text style={styles.lowTemp}>{period.low_f ?? '—'}°</Text>
      </View>
      <Text style={styles.precip}>{period.precip_pct ?? '—'}%</Text>
      <Text style={styles.wind}>{period.wind_mph ?? '—'} mph</Text>
      {period.snow_in_forecast && <Text style={styles.snowIcon}>❄</Text>}
    </View>
  );
}

export function WeatherRow({ weather }: Props) {
  if (!weather) {
    return <Text style={styles.unavailable}>Weather data unavailable</Text>;
  }

  return (
    <View style={styles.container}>
      {weather.is_stale && (
        <Text style={styles.staleNote}>Weather data may be outdated</Text>
      )}
      <View style={styles.row}>
        {weather.forecast.slice(0, 3).map((period, i) => (
          <ForecastCard key={period.date} period={period} index={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md },
  unavailable: { fontSize: FontSize.md, color: Colors.textMuted, padding: Spacing.md },
  staleNote: { fontSize: FontSize.xs, color: Colors.warning, marginBottom: Spacing.sm, textAlign: 'center' },
  row: { flexDirection: 'row', gap: Spacing.sm },
  card: { flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
  dayLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.xs },
  tempRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'baseline' },
  highTemp: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  lowTemp: { fontSize: FontSize.sm, color: Colors.textMuted },
  precip: { fontSize: FontSize.xs, color: Colors.snowBlue, marginTop: 2 },
  wind: { fontSize: FontSize.xs, color: Colors.textMuted },
  snowIcon: { fontSize: FontSize.md, color: Colors.snowBlue, marginTop: 2 },
});
