import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SupportedLanguage } from "../types";
import { getTranslation } from "../i18n/translations";
import { playChime } from "../services/ttsService";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  language: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  activeTab: "reading" | "report" | "scan";
  onSelectTab: (tab: "reading" | "report" | "scan") => void;
  streakDays: number;
  starsCount?: number;
  onOpenPrivacy: () => void;
  onOpenScan?: () => void;
  onOpenSettings?: () => void;
}

const AVAILABLE_LANGUAGES: { code: SupportedLanguage; label: string; flag: string; short: string; country: string }[] = [
  { code: "es", label: "Español", flag: "🇩🇴", short: "ES", country: "Rep. Dominicana" },
  { code: "en", label: "English", flag: "🇺🇸", short: "EN", country: "United States" },
  { code: "fr", label: "Français", flag: "🇫🇷", short: "FR", country: "France" },
  { code: "pt", label: "Português", flag: "🇧🇷", short: "PT", country: "Brasil" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", short: "DE", country: "Deutschland" },
  { code: "it", label: "Italiano", flag: "🇮🇹", short: "IT", country: "Italia" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", short: "NL", country: "Nederland" },
  { code: "pl", label: "Polski", flag: "🇵🇱", short: "PL", country: "Polska" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", short: "TR", country: "Türkiye" },
];

export const Header: React.FC<HeaderProps> = ({
  language,
  onSelectLanguage,
  activeTab,
  onSelectTab,
  streakDays,
  starsCount = 45,
  onOpenPrivacy,
  onOpenScan,
  onOpenSettings,
}) => {
  const t = getTranslation(language);
  const { themeMode, theme, toggleTheme } = useTheme();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const currentLangObj =
    AVAILABLE_LANGUAGES.find((item) => item.code === language) || AVAILABLE_LANGUAGES[0];

  const handleScanClick = () => {
    playChime("sparkle");
    if (onOpenScan) {
      onOpenScan();
    } else {
      onSelectTab("scan");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {/* Top Main Bar: Brand + Quick Badges */}
      <View style={styles.topBar}>
        {/* Brand Identity */}
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => playChime("sparkle")}
          activeOpacity={0.8}
        >
          <View style={[styles.mascotCircle, { backgroundColor: theme.primaryLight, borderColor: theme.borderActive }]}>
            <Text style={styles.mascotEmoji}>✨</Text>
          </View>
          <View>
            <View style={styles.titleWrap}>
              <Text style={[styles.brandTitle, { color: theme.text }]}>
                Sparky<Text style={styles.brandAccent}>.</Text>
              </Text>
              <View style={[styles.aiBadge, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="sparkles" size={10} color={theme.accent} />
                <Text style={[styles.aiBadgeText, { color: theme.accent }]}>Meta AI</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Right Status Actions */}
        <View style={styles.rightCluster}>
          {/* Stars Pill */}
          <View style={[styles.miniPillGold, { backgroundColor: themeMode === 'dark' ? '#261b07' : '#fffbeb', borderColor: '#fef08a' }]}>
            <Text style={styles.pillIconSmall}>⭐</Text>
            <Text style={styles.goldNumber}>{starsCount}</Text>
          </View>

          {/* Streak Pill */}
          <View style={[styles.miniPillFlame, { backgroundColor: themeMode === 'dark' ? '#2c1e14' : '#fff7ed', borderColor: '#fed7aa' }]}>
            <Text style={styles.pillIconSmall}>🔥</Text>
            <Text style={styles.flameNumber}>{streakDays}</Text>
          </View>

          {/* ☀️ / 🌙 Theme Toggle Button */}
          <TouchableOpacity
            style={[
              styles.iconCircleBtn,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
            ]}
            onPress={() => {
              playChime("tap");
              toggleTheme();
            }}
            activeOpacity={0.75}
            accessibilityLabel="Alternar Modo Claro / Oscuro"
          >
            <Text style={styles.themeEmojiText}>
              {themeMode === "light" ? "☀️" : "🌙"}
            </Text>
          </TouchableOpacity>

          {/* 🔤 Child Font & Reading Settings Button */}
          <TouchableOpacity
            style={[
              styles.iconCircleBtn,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
            ]}
            onPress={() => {
              playChime("tap");
              if (onOpenSettings) onOpenSettings();
            }}
            activeOpacity={0.75}
            accessibilityLabel="Ajustes de Fuente Infantil y Accesibilidad"
          >
            <Text style={[styles.fontBtnText, { color: theme.text }]}>Aa</Text>
          </TouchableOpacity>

          {/* Compact Language Picker Button */}
          <TouchableOpacity
            style={[
              styles.langPickerButton,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
            ]}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.langPickerFlag}>{currentLangObj.flag}</Text>
            <Text style={[styles.langPickerCode, { color: theme.text }]}>{currentLangObj.short}</Text>
            <Ionicons name="chevron-down" size={12} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Privacy Shield Button */}
          <TouchableOpacity
            style={[styles.shieldButton, { backgroundColor: themeMode === 'dark' ? '#064e3b' : '#ecfdf5', borderColor: '#a7f3d0' }]}
            onPress={onOpenPrivacy}
            activeOpacity={0.7}
            accessibilityLabel="Child Privacy Shield"
          >
            <Ionicons name="shield-checkmark" size={16} color="#10b981" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Segmented Controller: Kid Reading vs Parent/Teacher Report */}
      <View style={styles.segmentedRow}>
        <View style={[styles.segmentedContainer, { backgroundColor: theme.surfaceSecondary }]}>
          <TouchableOpacity
            style={[
              styles.segmentItem,
              activeTab === "reading" && styles.segmentItemActiveKid,
            ]}
            onPress={() => onSelectTab("reading")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === "reading" ? "book" : "book-outline"}
              size={15}
              color={activeTab === "reading" ? "#ffffff" : theme.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === "reading" ? "#ffffff" : theme.textSecondary },
                activeTab === "reading" && styles.segmentTextActive,
              ]}
            >
              {t.navReading}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentItem,
              activeTab === "report" && (themeMode === 'dark' ? styles.segmentItemActiveTutorDark : styles.segmentItemActiveTutor),
            ]}
            onPress={() => onSelectTab("report")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === "report" ? "stats-chart" : "stats-chart-outline"}
              size={15}
              color={activeTab === "report" ? "#ffffff" : theme.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === "report" ? "#ffffff" : theme.textSecondary },
                activeTab === "report" && styles.segmentTextActive,
              ]}
            >
              {t.navReport}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick OCR Scan Button */}
        <TouchableOpacity
          style={[styles.quickScanButton, { backgroundColor: theme.primaryLight, borderColor: theme.borderActive }]}
          onPress={handleScanClick}
          activeOpacity={0.85}
        >
          <Ionicons name="camera-outline" size={15} color={theme.primary} />
          <Text style={[styles.quickScanText, { color: theme.primary }]}>{t.navScan}</Text>
        </TouchableOpacity>
      </View>

      {/* Language Modal Grid */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity
          style={[styles.modalBackdrop, { backgroundColor: theme.modalBackdrop }]}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderLight }]}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="globe-outline" size={18} color={theme.text} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {language === "es" ? "Seleccionar Idioma" : "Select Language"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setLangModalVisible(false)}
                style={[styles.modalCloseCircle, { backgroundColor: theme.surfaceSecondary }]}
              >
                <Ionicons name="close" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.langGrid}>
              {AVAILABLE_LANGUAGES.map((item) => {
                const isSelected = language === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.langGridCard,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSecondary,
                        borderColor: isSelected ? theme.borderActive : theme.border,
                      },
                    ]}
                    onPress={() => {
                      playChime("tap");
                      onSelectLanguage(item.code);
                      setLangModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.langGridFlag}>{item.flag}</Text>
                    <View style={styles.langGridCol}>
                      <Text
                        style={[
                          styles.langGridLabel,
                          { color: isSelected ? theme.primary : theme.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={[styles.langGridCountry, { color: theme.textSecondary }]}>{item.country}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={theme.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
    zIndex: 20,
    ...(Platform.OS === "web"
      ? {
          position: "sticky" as any,
          top: 0,
          backdropFilter: "blur(12px)",
        }
      : {}),
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mascotCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  mascotEmoji: {
    fontSize: 20,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: "#ea580c",
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  rightCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniPillGold: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillIconSmall: {
    fontSize: 11,
  },
  goldNumber: {
    fontSize: 12,
    fontWeight: "900",
    color: "#b45309",
  },
  miniPillFlame: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  flameNumber: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ea580c",
  },
  iconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  themeEmojiText: {
    fontSize: 15,
  },
  fontBtnText: {
    fontSize: 13,
    fontWeight: "900",
  },
  langPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  langPickerFlag: {
    fontSize: 13,
  },
  langPickerCode: {
    fontSize: 11,
    fontWeight: "800",
  },
  shieldButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  segmentedContainer: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 16,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 7,
    borderRadius: 13,
  },
  segmentItemActiveKid: {
    backgroundColor: "#ea580c",
    shadowColor: "#ea580c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentItemActiveTutor: {
    backgroundColor: "#0f172a",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentItemActiveTutorDark: {
    backgroundColor: "#334155",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  quickScanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickScanText: {
    fontSize: 12,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  langGrid: {
    gap: 8,
  },
  langGridCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  langGridFlag: {
    fontSize: 22,
  },
  langGridCol: {
    flex: 1,
  },
  langGridLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  langGridCountry: {
    fontSize: 11,
  },
});
