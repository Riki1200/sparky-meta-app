import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ThemeColors,
  ThemeMode,
  ChildFontFamily,
  ChildFontSize,
  LIGHT_THEME,
  DARK_THEME,
  FONT_MAP,
  FONT_SCALE_MAP,
} from '../styles/theme';

interface ThemeContextType {
  themeMode: ThemeMode;
  theme: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  fontFamily: ChildFontFamily;
  setFontFamily: (font: ChildFontFamily) => void;
  fontSize: ChildFontSize;
  setFontSize: (size: ChildFontSize) => void;
  readingRuler: boolean;
  toggleReadingRuler: () => void;
  syllableMode: boolean;
  toggleSyllableMode: () => void;
  activeFontFamilyCss: string;
  fontScale: { size: number; lineHeight: number; letterSpacing: number };
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  theme: LIGHT_THEME,
  toggleTheme: () => {},
  setThemeMode: () => {},
  fontFamily: 'lexend',
  setFontFamily: () => {},
  fontSize: 'normal',
  setFontSize: () => {},
  readingRuler: false,
  toggleReadingRuler: () => {},
  syllableMode: false,
  toggleSyllableMode: () => {},
  activeFontFamilyCss: FONT_MAP.lexend,
  fontScale: FONT_SCALE_MAP.normal,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [fontFamily, setFontFamilyState] = useState<ChildFontFamily>('lexend');
  const [fontSize, setFontSizeState] = useState<ChildFontSize>('normal');
  const [readingRuler, setReadingRulerState] = useState<boolean>(false);
  const [syllableMode, setSyllableModeState] = useState<boolean>(false);

  useEffect(() => {
    // Inject child-friendly reading fonts dynamically in Web environment
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fontLinkId = 'sparky-reading-fonts';
      if (!document.getElementById(fontLinkId)) {
        const link = document.createElement('link');
        link.id = fontLinkId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Lexend:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap';
        document.head.appendChild(link);
      }
    }

    // Load persisted settings
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('sparky_theme_mode');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeModeState(savedTheme);
        }
        const savedFont = await AsyncStorage.getItem('sparky_font_family');
        if (savedFont && ['lexend', 'comic', 'dyslexic', 'system'].includes(savedFont)) {
          setFontFamilyState(savedFont as ChildFontFamily);
        }
        const savedSize = await AsyncStorage.getItem('sparky_font_size');
        if (savedSize && ['normal', 'large', 'extra'].includes(savedSize)) {
          setFontSizeState(savedSize as ChildFontSize);
        }
        const savedRuler = await AsyncStorage.getItem('sparky_reading_ruler');
        if (savedRuler !== null) {
          setReadingRulerState(savedRuler === 'true');
        }
      } catch (err) {
        // Fallback to defaults
      }
    })();
  }, []);

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeModeState(next);
    AsyncStorage.setItem('sparky_theme_mode', next).catch(() => {});
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem('sparky_theme_mode', mode).catch(() => {});
  };

  const setFontFamily = (font: ChildFontFamily) => {
    setFontFamilyState(font);
    AsyncStorage.setItem('sparky_font_family', font).catch(() => {});
  };

  const setFontSize = (size: ChildFontSize) => {
    setFontSizeState(size);
    AsyncStorage.setItem('sparky_font_size', size).catch(() => {});
  };

  const toggleReadingRuler = () => {
    const next = !readingRuler;
    setReadingRulerState(next);
    AsyncStorage.setItem('sparky_reading_ruler', String(next)).catch(() => {});
  };

  const toggleSyllableMode = () => {
    setSyllableModeState((prev) => !prev);
  };

  const currentTheme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;
  const activeFontFamilyCss = FONT_MAP[fontFamily] || FONT_MAP.lexend;
  const fontScale = FONT_SCALE_MAP[fontSize] || FONT_SCALE_MAP.normal;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        theme: currentTheme,
        toggleTheme,
        setThemeMode,
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        readingRuler,
        toggleReadingRuler,
        syllableMode,
        toggleSyllableMode,
        activeFontFamilyCss,
        fontScale,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
