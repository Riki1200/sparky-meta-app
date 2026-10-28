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

export const COMMON_GRADIENTS = {
  rainbow: ['#FF6B35', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'] as [string, string, ...string[]],
  sparkyMascot: ['#FF8A00', '#FF6B35', '#EA580C'] as [string, string, ...string[]],
  metaAi: ['#4F46E5', '#7C3AED', '#EC4899'] as [string, string, ...string[]],
  tabActiveReading: ['#FF8A00', '#FF6B35', '#EA580C'] as [string, string, ...string[]],
  kpiSpeed: ['#0EA5E9', '#2563EB'] as [string, string, ...string[]],
  kpiAccuracy: ['#10B981', '#059669'] as [string, string, ...string[]],
  kpiStreak: ['#F97316', '#EF4444'] as [string, string, ...string[]],
  kpiWords: ['#8B5CF6', '#6366F1'] as [string, string, ...string[]],
  shareWhatsApp: ['#22C55E', '#16A34A', '#15803D'] as [string, string, ...string[]],
  btnSparkyReads: ['#6366F1', '#4F46E5'] as [string, string, ...string[]],
  btnMicIdle: ['#FF6B35', '#F97316', '#EA580C'] as [string, string, ...string[]],
  btnMicListening: ['#EF4444', '#DC2626', '#991B1B'] as [string, string, ...string[]],
  btnSimulate: ['#EA580C', '#C2410C'] as [string, string, ...string[]],
  bookRibbon: ['#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B'] as [string, string, ...string[]],
  illustrationCard: ['#EEF2FF', '#FAF5FF', '#FDF2F8'] as [string, string, ...string[]],
};

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
  gradients: {
    ...COMMON_GRADIENTS,
    tabActiveReport: ['#1E293B', '#0F172A'],
    starPill: ['#FEF3C7', '#FDE68A'],
    streakPill: ['#FFEDD5', '#FED7AA'],
    scanBtn: ['#FFF7ED', '#FFEDD5'],
    illustrationCard: ['#EEF2FF', '#FAF5FF', '#FDF2F8'],
  },
  badges: {
    kpiSpeedBg: '#E0F2FE',
    kpiSpeedText: '#0284C7',
    kpiAccuracyBg: '#ECFDF5',
    kpiAccuracyText: '#059669',
    kpiStreakBg: '#FFF7ED',
    kpiStreakText: '#EA580C',
    kpiWordsBg: '#F5F3FF',
    kpiWordsText: '#7C3AED',
    starBadgeText: '#B45309',
    streakBadgeText: '#C2410C',
  },
  words: {
    pendingBg: '#f8fafc',
    pendingText: '#1e293b',
    pendingBorder: 'transparent',
    currentBg: '#fff7ed',
    currentText: '#c2410c',
    currentBorder: '#ea580c',
    correctBg: '#ecfdf5',
    correctText: '#065f46',
    correctBorder: '#10b981',
    hesitationBg: '#fefce8',
    hesitationText: '#854d0e',
    hesitationBorder: '#facc15',
    mispronouncedBg: '#fff1f2',
    mispronouncedText: '#9f1239',
    mispronouncedBorder: '#f43f5e',
  },
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
  gradients: {
    ...COMMON_GRADIENTS,
    tabActiveReport: ['#312E81', '#1E1B4B'],
    starPill: ['#451A03', '#78350F'],
    streakPill: ['#431407', '#7C2D12'],
    scanBtn: ['#1E293B', '#0F172A'],
    illustrationCard: ['#1E1B4B', '#2E1065', '#3B0764'],
  },
  badges: {
    kpiSpeedBg: '#082F49',
    kpiSpeedText: '#38BDF8',
    kpiAccuracyBg: '#064E3B',
    kpiAccuracyText: '#34D399',
    kpiStreakBg: '#431407',
    kpiStreakText: '#FB923C',
    kpiWordsBg: '#2E1065',
    kpiWordsText: '#A78BFA',
    starBadgeText: '#FBBF24',
    streakBadgeText: '#FB923C',
  },
  words: {
    pendingBg: '#18243e',
    pendingText: '#e2e8f0',
    pendingBorder: 'transparent',
    currentBg: '#2c1e14',
    currentText: '#fdba74',
    currentBorder: '#fb923c',
    correctBg: '#064e3b',
    correctText: '#a7f3d0',
    correctBorder: '#34d399',
    hesitationBg: '#422006',
    hesitationText: '#fde047',
    hesitationBorder: '#facc15',
    mispronouncedBg: '#4c0519',
    mispronouncedText: '#fecdd3',
    mispronouncedBorder: '#fb7185',
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
