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

export type PassType = 'epic' | 'ikon' | 'independent';

/** Label and accent color for a resort's pass type (Epic, Ikon, or an independent mountain). */
export function passBadge(passType: PassType, colors: ThemeColors): { label: string; color: string } {
  switch (passType) {
    case 'epic':        return { label: 'Epic', color: colors.epic };
    case 'ikon':        return { label: 'Ikon', color: colors.ikon };
    default:            return { label: 'Independent', color: colors.independent };
  }
}
