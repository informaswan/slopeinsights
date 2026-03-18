// lib/utils.ts
import { Colors } from '../constants/theme';

export function formatAgo(isoString: string | null): string | null {
  if (!isoString) return null;
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 2) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

export function crowdColor(level: string | null): string {
  switch (level) {
    case 'low':    return Colors.crowdLow;
    case 'medium': return Colors.crowdMedium;
    case 'high':   return Colors.crowdHigh;
    default:       return Colors.textMuted;
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
