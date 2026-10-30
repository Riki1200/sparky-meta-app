import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';
export type ChildFontFamily = 'lexend' | 'comic' | 'dyslexic' | 'system';
export type ChildFontSize = 'normal' | 'large' | 'extra';

export interface ThemeGradients {
  rainbow: [string, string, ...string[]];
  sparkyMascot: [string, string, ...string[]];
  metaAi: [string, string, ...string[]];
  tabActiveReading: [string, string, ...string[]];
  tabActiveReport: [string, string, ...string[]];
  kpiSpeed: [string, string, ...string[]];
  kpiAccuracy: [string, string, ...string[]];
  kpiStreak: [string, string, ...string[]];
  kpiWords: [string, string, ...string[]];
  shareWhatsApp: [string, string, ...string[]];
  btnSparkyReads: [string, string, ...string[]];
  btnMicIdle: [string, string, ...string[]];
  btnMicListening: [string, string, ...string[]];
  btnSimulate: [string, string, ...string[]];
  bookRibbon: [string, string, ...string[]];
  starPill: [string, string, ...string[]];
  streakPill: [string, string, ...string[]];
  scanBtn: [string, string, ...string[]];
  illustrationCard: [string, string, ...string[]];
}

export interface ThemeBadges {
  kpiSpeedBg: string;
  kpiSpeedText: string;
  kpiAccuracyBg: string;
  kpiAccuracyText: string;
  kpiStreakBg: string;
  kpiStreakText: string;
  kpiWordsBg: string;
  kpiWordsText: string;
  starBadgeText: string;
  streakBadgeText: string;
}

export interface ThemeWordStates {
  pendingBg: string;
  pendingText: string;
  pendingBorder: string;
  currentBg: string;
  currentText: string;
  currentBorder: string;
  correctBg: string;
  correctText: string;
  correctBorder: string;
  hesitationBg: string;
  hesitationText: string;
  hesitationBorder: string;
  mispronouncedBg: string;
  mispronouncedText: string;
  mispronouncedBorder: string;
}

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
  gradients: ThemeGradients;
  badges: ThemeBadges;
  words: ThemeWordStates;
}

// Storybook palette: warm paper, ink text and a single terracotta accent (the owl's orange).
// Gradient slots are kept for compatibility but are flat on purpose.
const flat = (color: string): [string, string] => [color, color];

const PAPER = {
  terracotta: '#D9622B',
  terracottaDeep: '#B44A1A',
  night: {
    terracotta: '#F08A55',
    terracottaDeep: '#D9622B',
  },
};

export const FONTS = {
  // Storybook headings; loaded from Google Fonts on web, falls back to a serif elsewhere
  display: "'Fraunces', Georgia, 'Times New Roman', serif",
  ui: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

// Storybook heading font for StyleSheet styles (web only; native keeps the system font)
export const DISPLAY_FONT = Platform.OS === 'web' ? { fontFamily: FONTS.display } : {};

export const LIGHT_THEME: ThemeColors = {
  mode: 'light',
  bg: '#F7F1E6',
  surface: '#FFFCF6',
  surfaceSecondary: '#F2EADC',
  surfaceElevated: '#FFFFFF',
  text: '#2B2620',
  textSecondary: '#6B5F52',
  textMuted: '#998C7C',
  border: '#E5D9C6',
  borderLight: '#EEE5D6',
  borderActive: PAPER.terracotta,
  primary: PAPER.terracotta,
  primaryLight: '#FBE8DB',
  primaryDark: PAPER.terracottaDeep,
  accent: '#7A5C45',
  accentLight: '#F1E6DA',
  cardShadow: 'rgba(80, 55, 30, 0.08)',
  paperCardBg: '#FFFCF6',
  paperCardBorder: '#E5D9C6',
  hudBg: '#F7F1E6',
  hudBorder: '#E5D9C6',
  dockBg: 'rgba(255, 252, 246, 0.97)',
  dockBorder: '#E5D9C6',
  modalBackdrop: 'rgba(43, 38, 32, 0.45)',
  wordBgPending: 'transparent',
  wordTextPending: '#2B2620',
  gradients: {
    rainbow: flat('#E5D9C6'),
    sparkyMascot: flat(PAPER.terracotta),
    metaAi: flat('#7A5C45'),
    tabActiveReading: flat(PAPER.terracotta),
    tabActiveReport: flat(PAPER.terracotta),
    kpiSpeed: flat('#F2EADC'),
    kpiAccuracy: flat('#F2EADC'),
    kpiStreak: flat('#F2EADC'),
    kpiWords: flat('#F2EADC'),
    shareWhatsApp: flat('#2F7D4F'),
    btnSparkyReads: flat('#7A5C45'),
    btnMicIdle: flat(PAPER.terracotta),
    btnMicListening: flat('#B33A2E'),
    btnSimulate: flat(PAPER.terracottaDeep),
    bookRibbon: flat('#E5D9C6'),
    starPill: flat('#F2EADC'),
    streakPill: flat('#F2EADC'),
    scanBtn: flat('#F2EADC'),
    illustrationCard: flat('#F2EADC'),
  },
  badges: {
    kpiSpeedBg: '#F2EADC',
    kpiSpeedText: '#6B5F52',
    kpiAccuracyBg: '#E6F0E3',
    kpiAccuracyText: '#3F7D4E',
    kpiStreakBg: '#FBE8DB',
    kpiStreakText: PAPER.terracottaDeep,
    kpiWordsBg: '#F2EADC',
    kpiWordsText: '#6B5F52',
    starBadgeText: '#A86A10',
    streakBadgeText: PAPER.terracottaDeep,
  },
  words: {
    pendingBg: 'transparent',
    pendingText: '#2B2620',
    pendingBorder: 'transparent',
    currentBg: '#FBE8DB',
    currentText: PAPER.terracottaDeep,
    currentBorder: PAPER.terracotta,
    correctBg: '#E6F0E3',
    correctText: '#2F6B3F',
    correctBorder: '#8DBB93',
    hesitationBg: '#FBF0D2',
    hesitationText: '#8A5A00',
    hesitationBorder: '#E2B54A',
    mispronouncedBg: '#F9E1DC',
    mispronouncedText: '#A3302A',
    mispronouncedBorder: '#E08A7E',
  },
};

export const DARK_THEME: ThemeColors = {
  mode: 'dark',
  bg: '#1D1B22',
  surface: '#26232C',
  surfaceSecondary: '#2F2B35',
  surfaceElevated: '#2B2831',
  text: '#F3ECDF',
  textSecondary: '#C4B9A8',
  textMuted: '#8E8475',
  border: '#3A3540',
  borderLight: '#312C37',
  borderActive: PAPER.night.terracotta,
  primary: PAPER.night.terracotta,
  primaryLight: '#3A2A22',
  primaryDark: PAPER.night.terracottaDeep,
  accent: '#CBAE92',
  accentLight: '#352D2B',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  paperCardBg: '#26232C',
  paperCardBorder: '#3A3540',
  hudBg: '#1D1B22',
  hudBorder: '#3A3540',
  dockBg: 'rgba(38, 35, 44, 0.97)',
  dockBorder: '#3A3540',
  modalBackdrop: 'rgba(10, 9, 12, 0.7)',
  wordBgPending: 'transparent',
  wordTextPending: '#F3ECDF',
  gradients: {
    rainbow: flat('#3A3540'),
    sparkyMascot: flat(PAPER.night.terracotta),
    metaAi: flat('#CBAE92'),
    tabActiveReading: flat(PAPER.night.terracotta),
    tabActiveReport: flat(PAPER.night.terracotta),
    kpiSpeed: flat('#2F2B35'),
    kpiAccuracy: flat('#2F2B35'),
    kpiStreak: flat('#2F2B35'),
    kpiWords: flat('#2F2B35'),
    shareWhatsApp: flat('#2F7D4F'),
    btnSparkyReads: flat('#CBAE92'),
    btnMicIdle: flat(PAPER.night.terracotta),
    btnMicListening: flat('#E0675B'),
    btnSimulate: flat(PAPER.night.terracottaDeep),
    bookRibbon: flat('#3A3540'),
    starPill: flat('#2F2B35'),
    streakPill: flat('#2F2B35'),
    scanBtn: flat('#2F2B35'),
    illustrationCard: flat('#2F2B35'),
  },
  badges: {
    kpiSpeedBg: '#2F2B35',
    kpiSpeedText: '#C4B9A8',
    kpiAccuracyBg: '#24382A',
    kpiAccuracyText: '#8FCB99',
    kpiStreakBg: '#3A2A22',
    kpiStreakText: PAPER.night.terracotta,
    kpiWordsBg: '#2F2B35',
    kpiWordsText: '#C4B9A8',
    starBadgeText: '#E9B95A',
    streakBadgeText: PAPER.night.terracotta,
  },
  words: {
    pendingBg: 'transparent',
    pendingText: '#F3ECDF',
    pendingBorder: 'transparent',
    currentBg: '#3A2A22',
    currentText: '#FFC9A8',
    currentBorder: PAPER.night.terracotta,
    correctBg: '#24382A',
    correctText: '#B5E0BC',
    correctBorder: '#5E9A69',
    hesitationBg: '#3A3020',
    hesitationText: '#F2D58C',
    hesitationBorder: '#C99A3A',
    mispronouncedBg: '#40242A',
    mispronouncedText: '#F5B5AB',
    mispronouncedBorder: '#C9655A',
  },
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
