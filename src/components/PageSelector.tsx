import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BookPage, SupportedLanguage } from "../types";
import { SAMPLE_BOOK_PAGES } from "../data/sampleBooks";
import { getTranslation } from "../i18n/translations";
import { playChime } from "../services/ttsService";
import { toImageSource } from "../services/imageService";
import { useTheme } from "../context/ThemeContext";

interface PageSelectorProps {
  currentPageId: string;
  onSelectPage: (page: BookPage) => void;
  onOpenScan: () => void;
  language: SupportedLanguage;
}

export const PageSelector: React.FC<PageSelectorProps> = ({
  currentPageId,
  onSelectPage,
  onOpenScan,
  language,
}) => {
  const t = getTranslation(language);
  const { theme, themeMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredPages = SAMPLE_BOOK_PAGES.filter((p) => p.language === language);
  const displayPages = filteredPages.length > 0 ? filteredPages : SAMPLE_BOOK_PAGES.filter((p) => p.language === "en");
  const currentPage = displayPages.find((p) => p.id === currentPageId) || displayPages[0];

  return (
    <View style={styles.container}>
      {/* Sleek Mini Bar: Shows current book + "Change Book" toggle button */}
      <View style={[styles.compactBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.bookPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
          onPress={() => {
            playChime("tap");
            setIsExpanded(!isExpanded);
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.bookIconBadge, { backgroundColor: theme.primaryLight, borderColor: theme.borderActive }]}>
            <Ionicons name="book" size={14} color={theme.primary} />
          </View>
          <View style={styles.bookTitlesCol}>
            <Text style={[styles.currentBookTitle, { color: theme.text }]} numberOfLines={1}>
              {currentPage.title}
            </Text>
            <Text style={[styles.currentBookGrade, { color: theme.textSecondary }]}>
              {currentPage.gradeLevel} • {currentPage.source}
            </Text>
          </View>

          <View style={[styles.toggleBadge, { backgroundColor: theme.surface, borderColor: theme.border }, isExpanded && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
            <Text style={[styles.toggleBadgeText, { color: theme.text }, isExpanded && { color: "#ffffff" }]}>
              {isExpanded ? t.closeBtnShort : t.changeBookBtn}
            </Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={13}
              color={isExpanded ? "#ffffff" : theme.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Expandable Visual Carousel Shelf */}
      {isExpanded && (
        <View style={[styles.expandedDrawer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <View style={styles.drawerHeader}>
            <Text style={[styles.drawerTitle, { color: theme.text }]}>
              {t.shelfTitle}
            </Text>
            <Text style={[styles.drawerSubtitle, { color: theme.textSecondary }]}>
              {t.shelfSubtitle}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollList}
          >
            {/* 1. OCR Camera Scanner Card */}
            <TouchableOpacity
              style={[styles.newScanCard, { backgroundColor: theme.primaryLight, borderColor: theme.borderActive }]}
              onPress={() => {
                playChime("sparkle");
                setIsExpanded(false);
                onOpenScan();
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.scanBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.scanBadgeText}>OCR</Text>
              </View>
              <View style={[styles.newScanIconCircle, { backgroundColor: theme.surface }]}>
                <Ionicons name="camera" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.newScanTitle, { color: theme.primary }]}>
                {t.navScan}
              </Text>
              <Text style={[styles.newScanDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                {t.scanBookButton}
              </Text>
            </TouchableOpacity>

            {/* 2. Sample Stories in the active language */}
            {displayPages.map((pageItem) => {
              const isSelected = pageItem.id === currentPage.id;
              return (
                <TouchableOpacity
                  key={pageItem.id}
                  style={[
                    styles.bookCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelected && [styles.bookCardSelected, { borderColor: theme.primary }],
                  ]}
                  onPress={() => {
                    playChime("tap");
                    onSelectPage(pageItem);
                    setIsExpanded(false);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.coverWrapper}>
                    <Image
                      source={toImageSource(pageItem.imageUrl)}
                      style={styles.bookCover}
                      resizeMode="cover"
                    />
                    <View style={styles.coverOverlay} />
                    <View style={styles.wordsCountPill}>
                      <Text style={styles.wordsCountText}>
                        {pageItem.words.length} {t.wordsLabel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookInfo}>
                    <View style={[styles.difficultyBadge, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                      <Text style={[styles.difficultyText, { color: theme.textSecondary }]}>{pageItem.difficulty}</Text>
                    </View>
                    <Text style={[styles.bookCardTitle, { color: theme.text }]} numberOfLines={2}>
                      {pageItem.title}
                    </Text>
                    <Text style={[styles.bookCardSource, { color: theme.textSecondary }]} numberOfLines={1}>
                      {pageItem.gradeLevel}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={[styles.activePillIndicator, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark-sharp" size={10} color="#ffffff" />
                      <Text style={styles.activePillText}>
                        {t.currentReadingBadge}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  compactBar: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  bookPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 10,
  },
  bookIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bookTitlesCol: {
    flex: 1,
  },
  currentBookTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  currentBookGrade: {
    fontSize: 10,
    fontWeight: "500",
  },
  toggleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  expandedDrawer: {
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  drawerTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  drawerSubtitle: {
    fontSize: 11,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: "stretch",
    paddingTop: 4,
  },
  newScanCard: {
    width: 125,
    height: 155,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    position: "relative",
  },
  scanBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  scanBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
  },
  newScanIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  newScanTitle: {
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  newScanDesc: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 12,
  },
  bookCard: {
    width: 135,
    height: 155,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    justifyContent: "space-between",
  },
  bookCardSelected: {
    borderWidth: 2,
  },
  coverWrapper: {
    position: "relative",
    width: "100%",
    height: 65,
  },
  bookCover: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f1f5f9",
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  wordsCountPill: {
    position: "absolute",
    bottom: 4,
    right: 5,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  wordsCountText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "700",
  },
  bookInfo: {
    padding: 8,
    flex: 1,
    justifyContent: "space-between",
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 8,
    fontWeight: "800",
  },
  bookCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
    marginVertical: 2,
  },
  bookCardSource: {
    fontSize: 9,
    fontWeight: "500",
  },
  activePillIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 2,
  },
  activePillText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
  },
});
