// __tests__/utils.test.ts
import { formatAgo, crowdColor, crowdLabel } from '../lib/utils';
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

  it('returns null for null input', () => {
    expect(formatAgo(null)).toBeNull();
  });
});

describe('crowdColor', () => {
  it('returns green for low', () => expect(crowdColor('low', LightColors)).toBe(LightColors.crowdLow));
  it('returns amber for medium', () => expect(crowdColor('medium', LightColors)).toBe(LightColors.crowdMedium));
  it('returns red for high', () => expect(crowdColor('high', LightColors)).toBe(LightColors.crowdHigh));
  it('returns muted for null', () => expect(crowdColor(null, LightColors)).toBe(LightColors.textMuted));
  it('returns muted for closed', () => expect(crowdColor('closed', LightColors)).toBe(LightColors.textMuted));
});

describe('crowdLabel', () => {
  it('returns capitalized label for known levels', () => {
    expect(crowdLabel('low')).toBe('Low');
    expect(crowdLabel('medium')).toBe('Medium');
    expect(crowdLabel('high')).toBe('High');
  });
  it('returns em-dash for null or closed', () => {
    expect(crowdLabel(null)).toBe('—');
    expect(crowdLabel('closed')).toBe('—');
  });
});
