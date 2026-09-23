// __tests__/utils.test.ts
import { formatAgo, passBadge } from '../lib/utils';
import { LightColors } from '../constants/theme';

describe('formatAgo', () => {
  it('returns "just now" for timestamps under 2 minutes ago', () => {
    const now = new Date().toISOString();
    expect(formatAgo(now)).toBe('just now');
  });

  it('returns minutes for recent timestamps', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatAgo(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours for older timestamps', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatAgo(twoHoursAgo)).toBe('2h ago');
  });

  it('returns days once data is a day or more old', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatAgo(threeDaysAgo)).toBe('3d ago');
  });

  it('returns null for null input', () => {
    expect(formatAgo(null)).toBeNull();
  });
});

describe('passBadge', () => {
  it('labels and colors each pass type', () => {
    expect(passBadge('epic', LightColors)).toEqual({ label: 'Epic', color: LightColors.epic });
    expect(passBadge('ikon', LightColors)).toEqual({ label: 'Ikon', color: LightColors.ikon });
    expect(passBadge('independent', LightColors)).toEqual({ label: 'Independent', color: LightColors.independent });
  });
});
