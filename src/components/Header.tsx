import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SupportedLanguage } from "../types";
import { getTranslation } from "../i18n/translations";
import { playChime } from "../services/ttsService";
import { useTheme } from "../context/ThemeContext";
import { FONTS } from "../styles/theme";

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
  onOpenTutorial?: () => void;
}

// Sparky the reading owl, same mark as the app icon
const OWL_MARK = require("../../assets/brand/owl-mark.png");

const AVAILABLE_LANGUAGES: { code: SupportedLanguage; label: string; short: string; country: string }[] = [
  { code: "es", label: "Español", short: "ES", country: "Rep. Dominicana" },
  { code: "en", label: "English", short: "EN", country: "United States" },
  { code: "fr", label: "Français", short: "FR", country: "France" },
  { code: "pt", label: "Português", short: "PT", country: "Brasil" },
  { code: "de", label: "Deutsch", short: "DE", country: "Deutschland" },
  { code: "it", label: "Italiano", short: "IT", country: "Italia" },
  { code: "nl", label: "Nederlands", short: "NL", country: "Nederland" },
  { code: "pl", label: "Polski", short: "PL", country: "Polska" },
  { code: "tr", label: "Türkçe", short: "TR", country: "Türkiye" },
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
  onOpenTutorial,
}) => {
  const t = getTranslation(language);
  const { themeMode, theme, toggleTheme } = useTheme();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

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

  const openFromMenu = (action?: () => void) => {
    setMenuVisible(false);
    // Let the menu modal finish dismissing before presenting the next one (required on iOS)
    setTimeout(() => action && action(), 250);
  };

  const menuItems: {
    key: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    trailing?: string;
    trailingIcon?: React.ComponentProps<typeof Ionicons>["name"];
    onPress: () => void;
  }[] = [
    {
      key: "language",
      icon: "globe-outline",
      label: t.selectLanguageTitle,
      trailing: currentLangObj.label,
      onPress: () => openFromMenu(() => setLangModalVisible(true)),
    },
    {
      key: "theme",
      icon: themeMode === "light" ? "moon-outline" : "sunny-outline",
      label: t.themeToggleLabel,
      trailingIcon: themeMode === "light" ? "sunny" : "moon",
      onPress: () => {
        playChime("tap");
        toggleTheme();
      },
    },
    {
      key: "settings",
      icon: "text-outline",
      label: t.settingsBtnLabel,
      onPress: () => openFromMenu(onOpenSettings),
    },
    {
      key: "tutorial",
      icon: "help-circle-outline",
      label: t.tutorialBtnLabel,
      onPress: () => openFromMenu(onOpenTutorial),
    },
    {
      key: "privacy",
      icon: "shield-checkmark-outline",
      label: t.privacyBadge,
      onPress: () => openFromMenu(onOpenPrivacy),
    },
  ];

  // Inline so the global UI font rule leaves the storybook heading font alone
  const displayFont = Platform.OS === "web" ? { fontFamily: FONTS.display } : null;

  const renderTab = (tab: "reading" | "report", label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={styles.tab}
        onPress={() => {
          playChime("tap");
          onSelectTab(tab);
        }}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[styles.tabText, { color: isActive ? theme.text : theme.textMuted }, isActive && styles.tabTextActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <View style={[styles.tabIndicator, { backgroundColor: isActive ? theme.primary : "transparent" }]} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
      {/* Brand + status */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.owlCircle, { backgroundColor: theme.primary }]}>
            <Image source={OWL_MARK} style={styles.owlMark} />
          </View>
          <View>
            <Text style={[styles.brandTitle, displayFont, { color: theme.text }]}>Sparky</Text>
            <Text style={[styles.brandSub, { color: theme.textMuted }]}>Meta AI</Text>
          </View>
        </View>

        <View style={styles.rightCluster}>
          {/* Stars and streak in one quiet chip */}
          <View style={[styles.statusChip, { backgroundColor: theme.surfaceSecondary }]}>
            <Ionicons name="star" size={13} color={theme.badges.starBadgeText} />
            <Text style={[styles.statusText, { color: theme.text }]}>{starsCount}</Text>
            <View style={[styles.statusDivider, { backgroundColor: theme.border }]} />
            <Ionicons name="flame" size={13} color={theme.badges.streakBadgeText} />
            <Text style={[styles.statusText, { color: theme.text }]}>{streakDays}</Text>
          </View>

          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.surfaceSecondary }]}
            onPress={() => {
              playChime("tap");
              setMenuVisible(true);
            }}
            activeOpacity={0.75}
            accessibilityLabel={t.selectLanguageTitle}
          >
            <Text style={[styles.menuLang, { color: theme.text }]}>{currentLangObj.short}</Text>
            <Ionicons name="menu" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reading and progress sections, plus the page scanner */}
      <View style={styles.tabsRow}>
        <View style={styles.tabs}>
          {renderTab("reading", t.navReading)}
          {renderTab("report", t.navReport)}
        </View>
        <TouchableOpacity
          style={[styles.scanButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
          onPress={handleScanClick}
          activeOpacity={0.8}
          accessibilityLabel={t.navScan}
        >
          <Ionicons name="camera-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Menu */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={[styles.menuBackdrop, { backgroundColor: theme.modalBackdrop }]}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.menuItem,
                  idx < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={19} color={theme.textSecondary} />
                <Text style={[styles.menuLabel, { color: theme.text }]} numberOfLines={2}>
                  {item.label}
                </Text>
                {item.trailing ? (
                  <Text style={[styles.menuTrailing, { color: theme.textMuted }]} numberOfLines={1}>
                    {item.trailing}
                  </Text>
                ) : (
                  <Ionicons
                    name={item.trailingIcon || "chevron-forward"}
                    size={item.trailingIcon ? 18 : 15}
                    color={item.trailingIcon ? theme.primary : theme.textMuted}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language picker */}
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
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, displayFont, { color: theme.text }]}>{t.selectLanguageTitle}</Text>
              <TouchableOpacity
                onPress={() => setLangModalVisible(false)}
                style={[styles.modalClose, { backgroundColor: theme.surfaceSecondary }]}
              >
                <Ionicons name="close" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {AVAILABLE_LANGUAGES.map((item, idx) => {
              const isSelected = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.langRow,
                    idx < AVAILABLE_LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
                  ]}
                  onPress={() => {
                    playChime("tap");
                    onSelectLanguage(item.code);
                    setLangModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langCode, { color: isSelected ? theme.primary : theme.textMuted }]}>
                    {item.short}
                  </Text>
                  <View style={styles.langCol}>
                    <Text style={[styles.langLabel, { color: theme.text }, isSelected && styles.langLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.langCountry, { color: theme.textMuted }]}>{item.country}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark" size={18} color={theme.primary} />}
                </TouchableOpacity>
              );
            })}
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
    paddingTop: 12,
    gap: 10,
    zIndex: 20,
    ...(Platform.OS === "web" ? { position: "sticky" as any, top: 0 } : {}),
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  owlCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  owlMark: {
    width: 28,
    height: 28,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  rightCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "800",
  },
  statusDivider: {
    width: 1,
    height: 14,
    marginHorizontal: 5,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
  },
  menuLang: {
    fontSize: 12,
    fontWeight: "800",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  tabs: {
    flexDirection: "row",
    gap: 22,
    flexShrink: 1,
  },
  tab: {
    paddingTop: 4,
    flexShrink: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "700",
    paddingBottom: 9,
  },
  tabTextActive: {
    fontWeight: "800",
  },
  tabIndicator: {
    height: 3,
    borderRadius: 2,
  },
  scanButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  menuBackdrop: {
    flex: 1,
    alignItems: "flex-end",
    paddingTop: 60,
    paddingHorizontal: 12,
  },
  menuCard: {
    width: 300,
    maxWidth: "100%",
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  menuTrailing: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: 110,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 11,
  },
  langCode: {
    width: 28,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  langCol: {
    flex: 1,
  },
  langLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  langLabelActive: {
    fontWeight: "800",
  },
  langCountry: {
    fontSize: 12,
  },
});
