import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ChildFontFamily, ChildFontSize } from '../styles/theme';
import { playChime, speakText, stopSpeaking, getSparkyVoiceSample } from '../services/ttsService';
import { getTranslation } from '../i18n/translations';
import { SupportedLanguage } from '../types';

interface ReadingSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  language: string;
}

export const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
  visible,
  onClose,
  language,
}) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const {
    themeMode,
    theme,
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
  } = useTheme();

  const supportedLang = (language as SupportedLanguage) || 'en';
  const t = getTranslation(supportedLang);

  const fonts: { id: ChildFontFamily; name: string; tag: string; description: string; sample: string }[] = [
    {
      id: 'lexend',
      name: 'Lexend',
      tag: t.fontRecommendedTag,
      description: t.fontRecommendedDesc,
      sample: 'Lexend ABC 123',
    },
    {
      id: 'comic',
      name: 'Comic & Nunito',
      tag: t.fontFriendlyTag,
      description: t.fontFriendlyDesc,
      sample: 'Comic Nunito ABC 123',
    },
    {
      id: 'dyslexic',
      name: t.fontDyslexiaTitle,
      tag: t.fontDyslexiaTag,
      description: t.fontDyslexiaDesc,
      sample: 'Dyslexic b d p q ABC',
    },
    {
      id: 'system',
      name: t.fontSystemTitle,
      tag: t.fontSystemTag,
      description: t.fontSystemDesc,
      sample: 'System Font ABC 123',
    },
  ];

  useEffect(() => {
    return () => {
      stopSpeaking();
      setIsPlayingVoice(false);
    };
  }, []);

  const handleToggleVoiceSample = () => {
    if (isPlayingVoice) {
      stopSpeaking();
      setIsPlayingVoice(false);
      return;
    }
    playChime('sparkle');
    setIsPlayingVoice(true);
    const sample = getSparkyVoiceSample(supportedLang);
    speakText(sample, supportedLang, 0.88, () => setIsPlayingVoice(false));
  };

  const handleCloseModal = () => {
    stopSpeaking();
    setIsPlayingVoice(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCloseModal}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.modalBackdrop }]}>
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="text" size={20} color={theme.primary} />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {t.settingsModalTitle}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {t.settingsModalSubtitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.surfaceSecondary }]}
              onPress={() => {
                playChime('tap');
                handleCloseModal();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Live Preview Box */}
            <View style={[styles.previewCard, { backgroundColor: theme.paperCardBg, borderColor: theme.borderActive }]}>
              <View style={styles.previewHeader}>
                <Text style={[styles.previewTag, { color: theme.primary }]}>
                  {t.livePreview}
                </Text>
                <Text style={[styles.previewMeta, { color: theme.textMuted }]}>
                  {fontFamily.toUpperCase()} • {fontSize.toUpperCase()} • {themeMode.toUpperCase()}
                </Text>
              </View>
              <Text
                style={[
                  styles.previewText,
                  {
                    color: theme.text,
                    fontSize: fontScale.size,
                    lineHeight: fontScale.lineHeight,
                    letterSpacing: fontScale.letterSpacing,
                    ...(Platform.OS === 'web' ? { fontFamily: activeFontFamilyCss } : {}),
                  },
                ]}
              >
                {t.previewSampleText}
              </Text>
            </View>

            {/* Section 1: Dark / Light Mode */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t.themeVisualTitle}
              </Text>
              <View style={styles.themeRow}>
                <TouchableOpacity
                  style={[
                    styles.themeOptionCard,
                    {
                      backgroundColor: themeMode === 'light' ? '#fff7ed' : theme.surfaceSecondary,
                      borderColor: themeMode === 'light' ? '#ea580c' : theme.border,
                    },
                  ]}
                  onPress={() => {
                    playChime('tap');
                    setThemeMode('light');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sunny" size={26} color="#f59e0b" />
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeLabel, { color: themeMode === 'light' ? '#9a3412' : theme.text }]}>
                      {t.lightModeTitle}
                    </Text>
                    <Text style={[styles.themeSub, { color: theme.textSecondary }]}>
                      {t.lightModeDesc}
                    </Text>
                  </View>
                  {themeMode === 'light' && (
                    <Ionicons name="checkmark-circle" size={22} color="#ea580c" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeOptionCard,
                    {
                      backgroundColor: themeMode === 'dark' ? '#1e293b' : theme.surfaceSecondary,
                      borderColor: themeMode === 'dark' ? '#fb923c' : theme.border,
                    },
                  ]}
                  onPress={() => {
                    playChime('tap');
                    setThemeMode('dark');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="moon" size={24} color="#818cf8" />
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeLabel, { color: themeMode === 'dark' ? '#fed7aa' : theme.text }]}>
                      {t.darkModeTitle}
                    </Text>
                    <Text style={[styles.themeSub, { color: theme.textSecondary }]}>
                      {t.darkModeDesc}
                    </Text>
                  </View>
                  {themeMode === 'dark' && (
                    <Ionicons name="checkmark-circle" size={22} color="#fb923c" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 2: Child Font Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t.fontFamilyTitle}
              </Text>
              <View style={styles.fontsList}>
                {fonts.map((f) => {
                  const isSelected = fontFamily === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.fontCard,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSecondary,
                          borderColor: isSelected ? theme.borderActive : theme.border,
                        },
                      ]}
                      onPress={() => {
                        playChime('tap');
                        setFontFamily(f.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.fontCardTop}>
                        <View style={styles.fontNameCol}>
                          <Text style={[styles.fontName, { color: theme.text }]}>{f.name}</Text>
                          <Text style={[styles.fontTag, { color: theme.primary }]}>{f.tag}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                        )}
                      </View>
                      <Text style={[styles.fontDesc, { color: theme.textSecondary }]}>{f.description}</Text>
                      <View style={[styles.fontSamplePill, { backgroundColor: theme.surface }]}>
                        <Text
                          style={[
                            styles.fontSampleText,
                            {
                              color: theme.text,
                              ...(Platform.OS === 'web'
                                ? { fontFamily: f.id === 'lexend' ? "'Lexend', sans-serif" : f.id === 'comic' ? "'Comic Neue', cursive" : "'Lexend', sans-serif" }
                                : {}),
                            },
                          ]}
                        >
                          "{f.sample}"
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Text Size */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t.fontSizeTitle}
              </Text>
              <View style={styles.sizeRow}>
                {(['normal', 'large', 'extra'] as ChildFontSize[]).map((sz) => {
                  const isSelected = fontSize === sz;
                  const label = sz === 'normal' ? t.sizeRegular : sz === 'large' ? t.sizeLarge : t.sizeExtraLarge;
                  return (
                    <TouchableOpacity
                      key={sz}
                      style={[
                        styles.sizeBtn,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surfaceSecondary,
                          borderColor: isSelected ? theme.primaryDark : theme.border,
                        },
                      ]}
                      onPress={() => {
                        playChime('tap');
                        setFontSize(sz);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.sizeLetter,
                          {
                            color: isSelected ? '#ffffff' : theme.text,
                            fontSize: sz === 'normal' ? 16 : sz === 'large' ? 20 : 25,
                          },
                        ]}
                      >
                        A
                      </Text>
                      <Text
                        style={[
                          styles.sizeLabel,
                          { color: isSelected ? '#ffffff' : theme.textSecondary },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 4: Visual Reading Aids */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t.visualAidsTitle}
              </Text>

              {/* Reading Ruler Toggle */}
              <TouchableOpacity
                style={[
                  styles.aidRow,
                  {
                    backgroundColor: readingRuler ? theme.primaryLight : theme.surfaceSecondary,
                    borderColor: readingRuler ? theme.borderActive : theme.border,
                  },
                ]}
                onPress={() => {
                  playChime('tap');
                  toggleReadingRuler();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.aidLeft}>
                  <Ionicons name="reorder-three" size={24} color={theme.primary} />
                  <View style={styles.aidTexts}>
                    <Text style={[styles.aidTitle, { color: theme.text }]}>
                      {t.focusRulerTitle}
                    </Text>
                    <Text style={[styles.aidSub, { color: theme.textSecondary }]}>
                      {t.focusRulerDesc}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={readingRuler ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={readingRuler ? theme.primary : theme.textMuted}
                />
              </TouchableOpacity>

              {/* Syllable Mode Toggle */}
              <TouchableOpacity
                style={[
                  styles.aidRow,
                  {
                    backgroundColor: syllableMode ? theme.primaryLight : theme.surfaceSecondary,
                    borderColor: syllableMode ? theme.borderActive : theme.border,
                  },
                ]}
                onPress={() => {
                  playChime('tap');
                  toggleSyllableMode();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.aidLeft}>
                  <Ionicons name="text" size={22} color={theme.primary} />
                  <View style={styles.aidTexts}>
                    <Text style={[styles.aidTitle, { color: theme.text }]}>
                      {t.syllablesTitle}
                    </Text>
                    <Text style={[styles.aidSub, { color: theme.textSecondary }]}>
                      {t.syllablesDesc}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={syllableMode ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={syllableMode ? theme.primary : theme.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Section 5: Voice & Speech Preview (Meta Muse Encouragement) */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t.sparkyVoicePreviewTitle}
              </Text>
              <View
                style={[
                  styles.voiceCard,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: isPlayingVoice ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={styles.voiceTopRow}>
                  <View style={styles.voiceInfoLeft}>
                    <View style={[styles.voiceAvatarBox, { backgroundColor: theme.primaryLight }]}>
                      <Ionicons name="sparkles" size={18} color={theme.primary} />
                    </View>
                    <View style={styles.voiceTitleCol}>
                      <Text style={[styles.voiceTitle, { color: theme.text }]}>
                        {t.sparkyVoiceTutorTitle}
                      </Text>
                      <Text style={[styles.voiceSubtitle, { color: theme.textSecondary }]}>
                        {t.sparkyVoiceTutorSub}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.voicePlayBtn,
                      { backgroundColor: isPlayingVoice ? '#ef4444' : theme.primary },
                    ]}
                    onPress={handleToggleVoiceSample}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isPlayingVoice ? 'stop' : 'volume-high'}
                      size={16}
                      color="#ffffff"
                    />
                    <Text style={styles.voicePlayBtnText}>
                      {isPlayingVoice ? t.stopVoiceBtn : t.testVoiceBtn}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.voiceQuoteBox, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.voiceQuoteText, { color: theme.text }]}>
                    "{getSparkyVoiceSample(supportedLang)}"
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={[styles.footer, { borderTopColor: theme.borderLight }]}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                playChime('sparkle');
                handleCloseModal();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-sharp" size={20} color="#ffffff" />
              <Text style={styles.saveBtnText}>
                {t.doneContinueReadingBtn}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  previewCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTag: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  previewMeta: {
    fontSize: 10,
    fontWeight: '700',
  },
  previewText: {
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOptionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  themeInfo: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  themeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  fontsList: {
    gap: 10,
  },
  fontCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
  },
  fontCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fontNameCol: {
    gap: 2,
  },
  fontName: {
    fontSize: 16,
    fontWeight: '800',
  },
  fontTag: {
    fontSize: 11,
    fontWeight: '800',
  },
  fontDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  fontSamplePill: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  fontSampleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sizeBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  sizeLetter: {
    fontWeight: '900',
  },
  sizeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  aidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  aidLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aidTexts: {
    flex: 1,
  },
  aidTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  aidSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  voiceCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  voiceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  voiceInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  voiceAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceTitleCol: {
    flex: 1,
  },
  voiceTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  voiceSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  voicePlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  voicePlayBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  voiceQuoteBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  voiceQuoteText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
