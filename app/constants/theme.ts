// constants/theme.ts — Alpine Morning (light) + Deep Ocean (dark)

export const LightColors = {
  headerGradientStart: '#1e3a5f',
  headerGradientEnd: '#2d5a87',
  background: '#f0f4f8',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  text: '#1e3a5f',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  epic: '#3B82F6',
  epicBg: 'rgba(59,130,246,0.1)',
  ikon: '#F97316',
  ikonBg: 'rgba(249,115,22,0.1)',
  crowdLow: '#059669',
  crowdLowBg: 'rgba(52,211,153,0.1)',
  crowdMedium: '#d97706',
  crowdMediumBg: 'rgba(251,191,36,0.1)',
  crowdHigh: '#ef4444',
  crowdHighBg: 'rgba(239,68,68,0.1)',
  snowBlue: '#3B82F6',
  warning: '#d97706',
  headerText: '#ffffff',
  headerTextSecondary: '#a8d4f0',
  sidebar: '#12304d',
  sidebarText: '#e6eef6',
  sidebarMuted: '#8fb0cc',
  sidebarBorder: 'rgba(255,255,255,0.12)',
  sidebarActive: 'rgba(255,255,255,0.10)',
  sidebarAccent: '#7cb8f7',
};

export const DarkColors = {
  headerGradientStart: '#0f2942',
  headerGradientEnd: '#163d5e',
  background: '#0c1f33',
  surface: '#132d47',
  surfaceAlt: '#1a3550',
  text: '#e0eaf5',
  textSecondary: '#6a94b8',
  textMuted: '#4a7a9e',
  border: 'rgba(106,148,184,0.2)',
  borderSubtle: 'rgba(106,148,184,0.1)',
  epic: '#7cb8f7',
  epicBg: 'rgba(59,130,246,0.2)',
  ikon: '#fb923c',
  ikonBg: 'rgba(249,115,22,0.2)',
  crowdLow: '#6ee7b7',
  crowdLowBg: 'rgba(52,211,153,0.12)',
  crowdMedium: '#fcd34d',
  crowdMediumBg: 'rgba(251,191,36,0.12)',
  crowdHigh: '#fca5a5',
  crowdHighBg: 'rgba(239,68,68,0.12)',
  snowBlue: '#7cb8f7',
  warning: '#fcd34d',
  headerText: '#c8dff0',
  headerTextSecondary: '#5a9bc4',
  sidebar: '#091827',
  sidebarText: '#dbe7f2',
  sidebarMuted: '#6a94b8',
  sidebarBorder: 'rgba(255,255,255,0.08)',
  sidebarActive: 'rgba(255,255,255,0.08)',
  sidebarAccent: '#7cb8f7',
};

export type ThemeColors = typeof LightColors;

// Keep legacy export for backward compatibility during migration
export const Colors = LightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 30,
  hero: 40,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 14,
  xl: 20,
  full: 999,
};
