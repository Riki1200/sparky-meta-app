import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SupportedLanguage } from "../types";
import { getTranslation } from "../i18n/translations";
import { playChime } from "../services/ttsService";

interface HeaderProps {
  language: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  activeTab: "reading" | "report" | "scan";
  onSelectTab: (tab: "reading" | "report" | "scan") => void;
  streakDays: number;
  starsCount?: number;
  onOpenPrivacy: () => void;
  onOpenScan?: () => void;
}

const AVAILABLE_LANGUAGES: { code: SupportedLanguage; label: string; flag: string; short: string }[] = [
  { code: "es", label: "Español", flag: "🇩🇴", short: "ES" },
  { code: "en", label: "English", flag: "🇺🇸", short: "EN" },
  { code: "fr", label: "Français", flag: "🇫🇷", short: "FR" },
  { code: "pt", label: "Português", flag: "🇧🇷", short: "PT" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", short: "DE" },
  { code: "it", label: "Italiano", flag: "🇮🇹", short: "IT" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", short: "NL" },
  { code: "pl", label: "Polski", flag: "🇵🇱", short: "PL" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", short: "TR" },
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
}) => {
  const t = getTranslation(language);

  const handleScanClick = () => {
    playChime("sparkle");
    if (onOpenScan) {
      onOpenScan();
    } else {
      onSelectTab("scan");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        {/* Brand / Logo */}
        <View style={styles.brandGroup}>
          <TouchableOpacity
            style={styles.mascotButton}
            onPress={() => playChime("sparkle")}
            activeOpacity={0.8}
          >
            <Text style={styles.mascotEmoji}>✨</Text>
            <View style={styles.mascotGlow} />
          </TouchableOpacity>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.appTitle}>
                {t.appName}
                <Text style={styles.appTitleHighlight}> {t.appTitleHighlight}</Text>
              </Text>
              <View style={styles.metaBadge}>
                <Ionicons name="sparkles" size={10} color="#4f46e5" />
                <Text style={styles.metaBadgeText}>Meta Muse Spark</Text>
              </View>
            </View>
            <Text style={styles.tagline}>{t.tagline}</Text>
          </View>
        </View>

        {/* Central Mode Switcher (Kid vs Parent/Tutor) */}
        <View style={styles.roleSwitcherContainer}>
          <TouchableOpacity
            style={[
              styles.roleTab,
              activeTab === "reading" && styles.roleTabActiveReading,
            ]}
            onPress={() => onSelectTab("reading")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === "reading" ? "book" : "book-outline"}
              size={17}
              color={activeTab === "reading" ? "#ffffff" : "#64748b"}
            />
            <Text
              style={[
                styles.roleTabText,
                activeTab === "reading" && styles.roleTabTextActive,
              ]}
            >
              {t.navReading}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleTab,
              activeTab === "report" && styles.roleTabActiveReport,
            ]}
            onPress={() => onSelectTab("report")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === "report" ? "stats-chart" : "stats-chart-outline"}
              size={17}
              color={activeTab === "report" ? "#ffffff" : "#64748b"}
            />
            <Text
              style={[
                styles.roleTabText,
                activeTab === "report" && styles.roleTabTextActive,
              ]}
            >
              {t.navReport}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Actions Toolbar */}
        <View style={styles.rightActions}>
          {/* Primary CTA: Scan Book */}
          <TouchableOpacity
            style={styles.scanCtaButton}
            onPress={handleScanClick}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={16} color="#ffffff" />
            <Text style={styles.scanCtaText}>{t.navScan}</Text>
            <View style={styles.ocrChip}>
              <Text style={styles.ocrChipText}>OCR</Text>
            </View>
          </TouchableOpacity>

                    {/* Stars / Points Badge */}
          {starsCount !== undefined && (
            <View style={styles.starsPill}>
              <Text style={styles.starsIcon}>⭐</Text>
              <Text style={styles.starsCount}>{starsCount}</Text>
            </View>
          )}
          {/* Streak Badge */}
          <View style={styles.streakPill}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakCount}>{streakDays}</Text>
            <Text style={styles.streakLabel}>{t.daysStreak}</Text>
          </View>

          {/* Privacy Shield */}
          <TouchableOpacity
            style={styles.privacyPill}
            onPress={onOpenPrivacy}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark" size={15} color="#059669" />
            <Text style={styles.privacyText}>{t.privacyBadge}</Text>
          </TouchableOpacity>

          {/* Language Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langList}
            style={styles.langScrollView}
          >
            {AVAILABLE_LANGUAGES.map((item) => {
              const isSelected = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.langPill, isSelected && styles.langPillSelected]}
                  onPress={() => {
                    if (!isSelected) {
                      playChime("tap");
                      onSelectLanguage(item.code);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langFlag, isSelected && styles.langFlagSelected]}>
                    {item.flag} {item.short}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 10,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mascotButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fed7aa",
    position: "relative",
  },
  mascotEmoji: {
    fontSize: 22,
  },
  mascotGlow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(251, 146, 60, 0.15)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.4,
  },
  appTitleHighlight: {
    color: "#ea580c",
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  metaBadgeText: {
    color: "#4f46e5",
    fontSize: 10,
    fontWeight: "800",
  },
  tagline: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 1,
  },
  roleSwitcherContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  roleTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleTabActiveReading: {
    backgroundColor: "#ea580c",
    shadowColor: "#ea580c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  roleTabActiveReport: {
    backgroundColor: "#0f172a",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  roleTabTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  scanCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ea580c",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#ea580c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  scanCtaText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  ocrChip: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  ocrChipText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
  },
  starsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fffbeb",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  starsIcon: {
    fontSize: 12,
  },
  starsCount: {
    fontSize: 13,
    fontWeight: "900",
    color: "#b45309",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff7ed",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  streakIcon: {
    fontSize: 13,
  },
  streakCount: {
    fontSize: 13,
    fontWeight: "900",
    color: "#ea580c",
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9a3412",
  },
  privacyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  privacyText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
  },
  langScrollView: {
    maxWidth: 240,
  },
  langList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingRight: 4,
  },
  langPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  langPillSelected: {
    backgroundColor: "#ffffff",
    borderColor: "#ea580c",
    borderWidth: 1.5,
    shadowColor: "#ea580c",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  langFlag: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  langFlagSelected: {
    color: "#ea580c",
    fontWeight: "800",
  },
});
