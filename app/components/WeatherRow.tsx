import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { WeatherDetail, WeatherPeriod } from '../lib/types';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { formatAgo } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../constants/theme';

interface Props {
  weather: WeatherDetail | null;
}

function parseDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// "Today"/"Tomorrow" only when the forecast date really is today/tomorrow, so an old
// forecast is never mislabeled as current.
function dayLabel(date: string): string {
  const d = parseDate(date);
  const now = new Date();
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function shortDate(date: string): string {
  return parseDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ForecastCard({ period, colors }: { period: WeatherPeriod; colors: ThemeColors }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
      <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{dayLabel(period.date)}</Text>
      <Text style={[styles.date, { color: colors.textMuted }]}>{shortDate(period.date)}</Text>
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

  const updated = formatAgo(weather.scraped_at);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {weather.is_stale && (
        <Text style={[styles.staleNote, { color: colors.warning }]}>Weather data may be outdated</Text>
      )}
      <View style={styles.row}>
        {weather.forecast.slice(0, 3).map((period) => (
          <ForecastCard key={period.date} period={period} colors={colors} />
        ))}
      </View>
      <Text style={[styles.updated, { color: weather.is_stale ? colors.warning : colors.textMuted }]}>
        {updated ? `Updated ${updated}` : 'Update time unknown'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, borderRadius: Radius.md },
  unavailable: { fontSize: FontSize.md, padding: Spacing.md },
  staleNote: { fontSize: FontSize.xs, marginBottom: Spacing.sm, textAlign: 'center' },
  row: { flexDirection: 'row', gap: Spacing.sm },
  card: { flex: 1, borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
  dayLabel: { fontSize: FontSize.xs, fontWeight: '700' },
  date: { fontSize: FontSize.xs, marginBottom: Spacing.xs },
  updated: { fontSize: FontSize.xs, marginTop: Spacing.sm, textAlign: 'center' },
  tempRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'baseline' },
  highTemp: { fontSize: FontSize.md, fontWeight: '700' },
  lowTemp: { fontSize: FontSize.sm },
  precip: { fontSize: FontSize.xs, marginTop: 2 },
  wind: { fontSize: FontSize.xs },
  snowIcon: { fontSize: FontSize.md, marginTop: 2 },
});
