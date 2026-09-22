// lib/utils.ts
import type { ThemeColors } from '../constants/theme';

export function formatAgo(isoString: string | null): string | null {
  if (!isoString) return null;
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 2) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function crowdColor(level: string | null, colors: ThemeColors): string {
  switch (level) {
    case 'low':    return colors.crowdLow;
    case 'medium': return colors.crowdMedium;
    case 'high':   return colors.crowdHigh;
    default:       return colors.textMuted;
  }
}

export function crowdLabel(level: string | null): string {
  switch (level) {
    case 'low':    return 'Low';
    case 'medium': return 'Medium';
    case 'high':   return 'High';
    default:       return '—';
  }
}
