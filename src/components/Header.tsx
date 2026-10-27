import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playChime } from '../services/ttsService';
import { SupportedLanguage } from '../types';
import { getTranslation } from '../i18n/translations';

interface HeaderProps {
  language: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  activeTab: 'reading' | 'report' | 'scan';
  onSelectTab: (tab: 'reading' | 'report' | 'scan') => void;
  streakDays: number;
  onOpenPrivacy: () => void;
}

const AVAILABLE_LANGUAGES: { code: SupportedLanguage; label: string; short: string; flag: string }[] = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇺🇸' },
  { code: 'es', label: 'Español', short: 'ES', flag: '🇩🇴' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', short: 'PT', flag: '🇧🇷' },
  { code: 'de', label: 'Deutsch', short: 'DE', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', short: 'IT', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands', short: 'NL', flag: '🇳🇱' },
  { code: 'pl', label: 'Polski', short: 'PL', flag: '🇵🇱' },
  { code: 'tr', label: 'Türkçe', short: 'TR', flag: '🇹🇷' },
];

export const Header: React.FC<HeaderProps> = ({
  language,
  onSelectLanguage,
  activeTab,
  onSelectTab,
  streakDays,
  onOpenPrivacy,
}) => {
  const t = getTranslation(language);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <TouchableOpacity
            style={styles.mascotButton}
            onPress={() => playChime('sparkle')}
            activeOpacity={0.8}
          >
            <Text style={styles.mascotEmoji}>✨</Text>
          </TouchableOpacity>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.appTitle}>
                {t.appName}
                <Text style={styles.appTitleHighlight}> {t.appTitleHighlight}</Text>
              </Text>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>Meta Muse Spark</Text>
              </View>
            </View>
            <Text style={styles.tagline}>{t.tagline}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {/* Streak badge */}
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streakDays} {t.daysStreak}</Text>
          </View>

          {/* Privacy badge */}
          <TouchableOpacity
            style={styles.privacyButton}
            onPress={onOpenPrivacy}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark" size={15} color="#10b981" />
            <Text style={styles.privacyText}>{t.privacyBadge}</Text>
          </TouchableOpacity>

          {/* Multi-Language selector segmented control */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langSegment}
            style={styles.langScrollWrapper}
          >
            {AVAILABLE_LANGUAGES.map((item) => {
              const isActive = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.langChoice, isActive && styles.langChoiceActive]}
                  onPress={() => {
                    if (!isActive) {
                      playChime('tap');
                      onSelectLanguage(item.code);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langChoiceText, isActive && styles.langChoiceTextActive]}>
                    {item.flag} {item.short}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'reading' && styles.tabButtonActive]}
          onPress={() => onSelectTab('reading')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'reading' ? 'book' : 'book-outline'}
            size={18}
            color={activeTab === 'reading' ? '#ffffff' : '#64748b'}
          />
          <Text
            style={[styles.tabText, activeTab === 'reading' && styles.tabTextActive]}
          >
            {t.navReading}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'report' && styles.tabButtonActive]}
          onPress={() => onSelectTab('report')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'report' ? 'stats-chart' : 'stats-chart-outline'}
            size={18}
            color={activeTab === 'report' ? '#ffffff' : '#64748b'}
          />
          <Text
            style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}
          >
            {t.navReport}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, styles.tabScanButton]}
          onPress={() => onSelectTab('scan')}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={18} color="#ffffff" />
          <Text style={[styles.tabText, styles.tabScanText]}>
            {t.navScan}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mascotButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fde68a',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  mascotEmoji: {
    fontSize: 22,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  appTitleHighlight: {
    color: '#ea580c',
  },
  metaBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  metaBadgeText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  streakBadge: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  privacyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
  },
  langScrollWrapper: {
    maxWidth: 520,
  },
  langSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 2,
  },
  langChoice: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
  },
  langChoiceActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  langChoiceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  langChoiceTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabScanButton: {
    backgroundColor: '#4f46e5',
  },
  tabScanText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
});
