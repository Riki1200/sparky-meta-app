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
}) => {
  const t = getTranslation(language);
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
    <View style={styles.container}>
      {/* Top Main Bar: Brand + Quick Badges */}
      <View style={styles.topBar}>
        {/* Brand Identity */}
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => playChime("sparkle")}
          activeOpacity={0.8}
        >
          <View style={styles.mascotCircle}>
            <Text style={styles.mascotEmoji}>✨</Text>
          </View>
          <View>
            <View style={styles.titleWrap}>
              <Text style={styles.brandTitle}>
                Sparky<Text style={styles.brandAccent}>.</Text>
              </Text>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={10} color="#6366f1" />
                <Text style={styles.aiBadgeText}>Meta AI</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Right Status Actions */}
        <View style={styles.rightCluster}>
          {/* Stars Pill */}
          <View style={styles.miniPillGold}>
            <Text style={styles.pillIconSmall}>⭐</Text>
            <Text style={styles.goldNumber}>{starsCount}</Text>
          </View>

          {/* Streak Pill */}
          <View style={styles.miniPillFlame}>
            <Text style={styles.pillIconSmall}>🔥</Text>
            <Text style={styles.flameNumber}>{streakDays}</Text>
          </View>

          {/* Compact Language Picker Button */}
          <TouchableOpacity
            style={styles.langPickerButton}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.langPickerFlag}>{currentLangObj.flag}</Text>
            <Text style={styles.langPickerCode}>{currentLangObj.short}</Text>
            <Ionicons name="chevron-down" size={12} color="#64748b" />
          </TouchableOpacity>

          {/* Privacy Shield Button */}
          <TouchableOpacity
            style={styles.shieldButton}
            onPress={onOpenPrivacy}
            activeOpacity={0.7}
            accessibilityLabel="Child Privacy Shield"
          >
            <Ionicons name="shield-checkmark" size={16} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Segmented Controller: Kid Reading vs Parent/Teacher Report */}
      <View style={styles.segmentedRow}>
        <View style={styles.segmentedContainer}>
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
              color={activeTab === "reading" ? "#ffffff" : "#64748b"}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === "reading" && styles.segmentTextActive,
              ]}
            >
              {t.navReading}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentItem,
              activeTab === "report" && styles.segmentItemActiveTutor,
            ]}
            onPress={() => onSelectTab("report")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === "report" ? "stats-chart" : "stats-chart-outline"}
              size={15}
              color={activeTab === "report" ? "#ffffff" : "#64748b"}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === "report" && styles.segmentTextActive,
              ]}
            >
              {t.navReport}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick OCR Scan Button */}
        <TouchableOpacity
          style={styles.quickScanButton}
          onPress={handleScanClick}
          activeOpacity={0.85}
        >
          <Ionicons name="camera-outline" size={15} color="#ea580c" />
          <Text style={styles.quickScanText}>{t.navScan}</Text>
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
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="globe-outline" size={18} color="#0f172a" />
                <Text style={styles.modalTitle}>
                  {language === "es" ? "Seleccionar Idioma" : "Select Language"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setLangModalVisible(false)}
                style={styles.modalCloseCircle}
              >
                <Ionicons name="close" size={16} color="#64748b" />
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
                      isSelected && styles.langGridCardSelected,
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
                          isSelected && styles.langGridLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.langGridCountry}>{item.country}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#ea580c"
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
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
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
    backgroundColor: "#fff7ed",
    borderWidth: 1.5,
    borderColor: "#fed7aa",
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
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: "#ea580c",
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4338ca",
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
    backgroundColor: "#fffbeb",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fef08a",
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
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  flameNumber: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ea580c",
  },
  langPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  langPickerFlag: {
    fontSize: 13,
  },
  langPickerCode: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
  },
  shieldButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
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
    backgroundColor: "#f1f5f9",
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
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  segmentTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  quickScanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff7ed",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  quickScanText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ea580c",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
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
    borderBottomColor: "#f1f5f9",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
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
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  langGridCardSelected: {
    backgroundColor: "#fff7ed",
    borderColor: "#ea580c",
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
    color: "#0f172a",
  },
  langGridLabelSelected: {
    color: "#ea580c",
  },
  langGridCountry: {
    fontSize: 11,
    color: "#64748b",
  },
});
