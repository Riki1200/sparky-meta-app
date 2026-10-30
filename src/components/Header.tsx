import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  onOpenTutorial?: () => void;
}

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
  const { width } = useWindowDimensions();
  const isCompact = width < 540;
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

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {/* Top Accent Gradient Shimmer Line */}
      <LinearGradient
        colors={theme.gradients.rainbow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topAccentLine}
      />

      {/* Top Main Bar: Brand + Quick Badges */}
      <View style={styles.topBar}>
        {/* Brand Identity */}
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => playChime("sparkle")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.gradients.sparkyMascot}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.mascotCircle, isCompact && styles.mascotCircleCompact]}
          >
            <Ionicons name="sparkles" size={isCompact ? 17 : 20} color="#ffffff" />
          </LinearGradient>
          <View style={[styles.titleWrap, isCompact && styles.titleWrapCompact]}>
            <Text style={[styles.brandTitle, isCompact && styles.brandTitleCompact, { color: theme.text }]}>
              Sparky<Text style={styles.brandAccent}>.</Text>
            </Text>
            <LinearGradient
              colors={theme.gradients.metaAi}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiBadge}
            >
              <Ionicons name="sparkles" size={10} color="#ffffff" />
              <Text style={styles.aiBadgeText}>Meta AI</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        {/* Right Status Actions */}
        <View style={styles.rightCluster}>
          {isCompact ? (
            /* Combined Stars + Streak Pill (saves space on phones) */
            <LinearGradient
              colors={theme.gradients.starPill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.miniPillGradient, { borderColor: theme.border }]}
            >
              <Ionicons name="star" size={12} color={theme.badges.starBadgeText} />
              <Text style={[styles.goldNumber, { color: theme.badges.starBadgeText }]}>{starsCount}</Text>
              <View style={[styles.pillDivider, { backgroundColor: theme.badges.starBadgeText }]} />
              <Ionicons name="flame" size={12} color={theme.badges.streakBadgeText} />
              <Text style={[styles.flameNumber, { color: theme.badges.streakBadgeText }]}>{streakDays}</Text>
            </LinearGradient>
          ) : (
            <>
              {/* Stars Pill with Radiant Gradient */}
              <LinearGradient
                colors={theme.gradients.starPill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.miniPillGradient, { borderColor: theme.border }]}
              >
                <Ionicons name="star" size={12} color={theme.badges.starBadgeText} />
                <Text style={[styles.goldNumber, { color: theme.badges.starBadgeText }]}>{starsCount}</Text>
              </LinearGradient>

              {/* Streak Pill with Fire Gradient */}
              <LinearGradient
                colors={theme.gradients.streakPill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.miniPillGradient, { borderColor: theme.borderActive }]}
              >
                <Ionicons name="flame" size={12} color={theme.badges.streakBadgeText} />
                <Text style={[styles.flameNumber, { color: theme.badges.streakBadgeText }]}>{streakDays}</Text>
              </LinearGradient>
            </>
          )}

          {isCompact ? (
            /* Compact Menu Button: keeps the active language flag visible */
            <TouchableOpacity
              style={[
                styles.langPickerButton,
                { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
              ]}
              onPress={() => {
                playChime("tap");
                setMenuVisible(true);
              }}
              activeOpacity={0.75}
              accessibilityLabel={t.selectLanguageTitle}
            >
              <Text style={[styles.langPickerCode, { color: theme.text }]}>{currentLangObj.short}</Text>
              <Ionicons name="menu" size={16} color={theme.text} />
            </TouchableOpacity>
          ) : (
            <>
              {/* Light / Dark Theme Toggle Button */}
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
                accessibilityLabel={t.themeToggleLabel}
              >
                <Ionicons name={themeMode === "light" ? "sunny" : "moon"} size={16} color={themeMode === "light" ? "#f59e0b" : "#a5b4fc"} />
              </TouchableOpacity>

              {/* Child Font & Reading Settings Button */}
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
                accessibilityLabel={t.settingsBtnLabel}
              >
                <Text style={[styles.fontBtnText, { color: theme.text }]}>Aa</Text>
              </TouchableOpacity>

              {/* Setup Wizard / Tutorial Button */}
              <TouchableOpacity
                style={[
                  styles.iconCircleBtn,
                  { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                ]}
                onPress={() => {
                  playChime("sparkle");
                  if (onOpenTutorial) onOpenTutorial();
                }}
                activeOpacity={0.75}
                accessibilityLabel={t.tutorialBtnLabel}
              >
                <Ionicons name="help" size={17} color={theme.text} />
              </TouchableOpacity>

              {/* Compact Language Picker Button */}
              <TouchableOpacity
                style={[
                  styles.langPickerButton,
                  { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                ]}
                onPress={() => setLangModalVisible(true)}
                activeOpacity={0.75}
                accessibilityLabel={t.selectLanguageTitle}
              >
                <Ionicons name="globe-outline" size={13} color={theme.textSecondary} />
                <Text style={[styles.langPickerCode, { color: theme.text }]}>{currentLangObj.short}</Text>
                <Ionicons name="chevron-down" size={12} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Privacy Shield Button */}
              <TouchableOpacity
                style={[styles.shieldButton, { backgroundColor: theme.badges.kpiAccuracyBg, borderColor: theme.border }]}
                onPress={onOpenPrivacy}
                activeOpacity={0.7}
                accessibilityLabel={t.privacyBadge}
              >
                <Ionicons name="shield-checkmark" size={16} color={theme.badges.kpiAccuracyText} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Bottom Segmented Controller: Kid Reading vs Parent/Teacher Report */}
      <View style={styles.segmentedRow}>
        <View style={[styles.segmentedContainer, { backgroundColor: theme.surfaceSecondary }]}>
          {/* Reading Room Segment */}
          <TouchableOpacity
            style={styles.segmentItemTouch}
            onPress={() => onSelectTab("reading")}
            activeOpacity={0.8}
          >
            {activeTab === "reading" ? (
              <LinearGradient
                colors={theme.gradients.tabActiveReading}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.segmentItemActiveGradient}
              >
                <Ionicons name="book" size={15} color="#ffffff" />
                <Text style={styles.segmentTextActive} numberOfLines={1}>{t.navReading}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.segmentItemInactive}>
                <Ionicons name="book-outline" size={15} color={theme.textSecondary} />
                <Text style={[styles.segmentText, { color: theme.textSecondary }]} numberOfLines={1}>{t.navReading}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Parent Report Segment */}
          <TouchableOpacity
            style={styles.segmentItemTouch}
            onPress={() => onSelectTab("report")}
            activeOpacity={0.8}
          >
            {activeTab === "report" ? (
              <LinearGradient
                colors={theme.gradients.tabActiveReport}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.segmentItemActiveGradient}
              >
                <Ionicons name="stats-chart" size={15} color="#ffffff" />
                <Text style={styles.segmentTextActive} numberOfLines={1}>{t.navReport}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.segmentItemInactive}>
                <Ionicons name="stats-chart-outline" size={15} color={theme.textSecondary} />
                <Text style={[styles.segmentText, { color: theme.textSecondary }]} numberOfLines={1}>{t.navReport}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick OCR Scan Button: solid sunset CTA (icon-only on phones) */}
        <TouchableOpacity
          style={styles.quickScanTouch}
          onPress={handleScanClick}
          activeOpacity={0.85}
          accessibilityLabel={t.navScan}
        >
          <LinearGradient
            colors={theme.gradients.btnMicIdle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.quickScanGradient, isCompact && styles.quickScanGradientCompact]}
          >
            <Ionicons name="camera" size={isCompact ? 19 : 15} color="#ffffff" />
            {!isCompact && <Text style={styles.quickScanText}>{t.navScan}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Compact Overflow Menu (phones) */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
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
                <View style={[styles.menuIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                  <Ionicons name={item.icon} size={17} color={theme.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: theme.text }]} numberOfLines={2}>
                  {item.label}
                </Text>
                {item.trailing ? (
                  <Text style={[styles.menuTrailing, { color: theme.textSecondary }]} numberOfLines={1}>
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
                  {t.selectLanguageTitle}
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
                    <View
                      style={[
                        styles.langCodeBadge,
                        { backgroundColor: isSelected ? theme.primary : theme.surface, borderColor: isSelected ? theme.primary : theme.border },
                      ]}
                    >
                      <Text style={[styles.langCodeBadgeText, { color: isSelected ? "#ffffff" : theme.textSecondary }]}>
                        {item.short}
                      </Text>
                    </View>
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
    paddingTop: 0,
    paddingBottom: 10,
    gap: 10,
    zIndex: 20,
    position: 'relative',
    ...(Platform.OS === "web"
      ? {
          position: "sticky" as any,
          top: 0,
          backdropFilter: "blur(16px)",
        }
      : {}),
  },
  topAccentLine: {
    height: 3,
    width: '100%',
    marginBottom: 8,
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
    alignItems: "center",
    justifyContent: "center",
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  mascotCircleCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  titleWrapCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 1,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  brandTitleCompact: {
    fontSize: 17,
    lineHeight: 20,
  },
  brandAccent: {
    color: "#ea580c",
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  rightCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniPillGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 4,
    opacity: 0.3,
  },
  goldNumber: {
    fontSize: 12,
    fontWeight: "900",
  },
  flameNumber: {
    fontSize: 12,
    fontWeight: "900",
  },
  iconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
  segmentItemTouch: {
    flex: 1,
  },
  segmentItemActiveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 6,
    height: 32,
    borderRadius: 13,
    shadowColor: "#ea580c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  segmentItemInactive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 6,
    height: 32,
    borderRadius: 13,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  segmentTextActive: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 12,
    flexShrink: 1,
  },
  quickScanTouch: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickScanGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  quickScanGradientCompact: {
    width: 44,
    paddingHorizontal: 0,
  },
  quickScanText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ffffff",
  },
  menuBackdrop: {
    flex: 1,
    alignItems: "flex-end",
    paddingTop: 64,
    paddingHorizontal: 12,
  },
  menuCard: {
    width: 300,
    maxWidth: "100%",
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  menuTrailing: {
    fontSize: 12,
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
  langCodeBadge: {
    width: 36,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  langCodeBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
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
