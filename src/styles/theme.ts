export type ThemeMode = 'light' | 'dark';
export type ChildFontFamily = 'lexend' | 'comic' | 'dyslexic' | 'system';
export type ChildFontSize = 'normal' | 'large' | 'extra';

export interface ThemeColors {
  mode: ThemeMode;
  bg: string;
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  borderActive: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  cardShadow: string;
  paperCardBg: string;
  paperCardBorder: string;
  hudBg: string;
  hudBorder: string;
  dockBg: string;
  dockBorder: string;
  modalBackdrop: string;
  wordBgPending: string;
  wordTextPending: string;
}

export const LIGHT_THEME: ThemeColors = {
  mode: 'light',
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',
  surfaceElevated: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderActive: '#ea580c',
  primary: '#ea580c',
  primaryLight: '#fff7ed',
  primaryDark: '#c2410c',
  accent: '#6366f1',
  accentLight: '#e0e7ff',
  cardShadow: 'rgba(15, 23, 42, 0.06)',
  paperCardBg: '#ffffff',
  paperCardBorder: '#e2e8f0',
  hudBg: '#ffffff',
  hudBorder: '#e2e8f0',
  dockBg: 'rgba(255, 255, 255, 0.96)',
  dockBorder: '#e2e8f0',
  modalBackdrop: 'rgba(15, 23, 42, 0.65)',
  wordBgPending: '#f8fafc',
  wordTextPending: '#1e293b',
};

export const DARK_THEME: ThemeColors = {
  mode: 'dark',
  bg: '#080d1a',
  surface: '#111a2e',
  surfaceSecondary: '#18243e',
  surfaceElevated: '#1a2744',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: '#1e293b',
  borderLight: '#152238',
  borderActive: '#fb923c',
  primary: '#fb923c',
  primaryLight: '#2c1e14',
  primaryDark: '#ea580c',
  accent: '#818cf8',
  accentLight: '#1e1e38',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  paperCardBg: '#0f172a',
  paperCardBorder: '#1e293b',
  hudBg: '#0d1527',
  hudBorder: '#1e293b',
  dockBg: 'rgba(13, 21, 39, 0.96)',
  dockBorder: '#1e293b',
  modalBackdrop: 'rgba(2, 6, 23, 0.85)',
  wordBgPending: '#18243e',
  wordTextPending: '#e2e8f0',
};

export const FONT_MAP: Record<ChildFontFamily, string> = {
  lexend: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  comic: "'Comic Neue', 'Nunito', 'Chalkboard SE', cursive, sans-serif",
  dyslexic: "'Lexend', 'OpenDyslexic', -apple-system, sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export const FONT_SCALE_MAP: Record<ChildFontSize, { size: number; lineHeight: number; letterSpacing: number }> = {
  normal: { size: 23, lineHeight: 44, letterSpacing: -0.2 },
  large: { size: 28, lineHeight: 52, letterSpacing: 0.2 },
  extra: { size: 34, lineHeight: 62, letterSpacing: 0.6 },
};
