import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BookPage, SupportedLanguage } from "../types";
import { SAMPLE_BOOK_PAGES } from "../data/sampleBooks";
import { getTranslation } from "../i18n/translations";
import { playChime } from "../services/ttsService";

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
  const filteredPages = SAMPLE_BOOK_PAGES.filter((p) => p.language === language);
  const displayPages = filteredPages.length > 0 ? filteredPages : SAMPLE_BOOK_PAGES.filter((p) => p.language === "en");

  return (
    <View style={styles.container}>
      {/* Shelf Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Text style={styles.shelfEmoji}>📚</Text>
          <View>
            <Text style={styles.sectionTitle}>{t.shelfTitle}</Text>
            <Text style={styles.sectionSubtitle}>{t.shelfSubtitle}</Text>
          </View>
        </View>
      </View>

      {/* Horizontal Book Shelf Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {/* Special "Scan Physical Book" Quick Card */}
        <TouchableOpacity
          style={styles.newScanCard}
          onPress={() => {
            playChime("sparkle");
            onOpenScan();
          }}
          activeOpacity={0.8}
        >
          <View style={styles.newScanIconCircle}>
            <Ionicons name="scan-outline" size={24} color="#ea580c" />
          </View>
          <View style={styles.scanBadge}>
            <Text style={styles.scanBadgeText}>OCR</Text>
          </View>
          <Text style={styles.newScanTitle}>{t.navScan}</Text>
          <Text style={styles.newScanDesc} numberOfLines={2}>
            {language === "es" ? "Pon tu libro escolar frente a la cámara" : "Point camera at any physical book"}
          </Text>
        </TouchableOpacity>

        {/* Book Cards */}
        {displayPages.map((page) => {
          const isSelected = page.id === currentPageId;
          const wordCount = page.words?.length || page.text.split(/\s+/).length;

          return (
            <TouchableOpacity
              key={page.id}
              style={[styles.bookCard, isSelected && styles.bookCardSelected]}
              onPress={() => {
                if (!isSelected) {
                  playChime("tap");
                  onSelectPage(page);
                }
              }}
              activeOpacity={0.85}
            >
              {page.imageUrl && (
                <View style={styles.coverWrapper}>
                  <Image source={{ uri: page.imageUrl }} style={styles.bookCover} />
                  <View style={styles.coverOverlay} />
                  <View style={styles.wordsCountPill}>
                    <Text style={styles.wordsCountText}>{wordCount} {t.wordsRead.toLowerCase()}</Text>
                  </View>
                </View>
              )}

              <View style={styles.bookInfo}>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{page.gradeLevel}</Text>
                </View>

                <Text style={styles.bookTitle} numberOfLines={2}>
                  {page.title}
                </Text>

                <Text style={styles.bookSource} numberOfLines={1}>
                  {page.source}
                </Text>
              </View>

              {isSelected && (
                <View style={styles.activePillIndicator}>
                  <Ionicons name="sparkles" size={11} color="#ffffff" />
                  <Text style={styles.activePillText}>
                    {language === "es" ? "LEYENDO AHORA" : "NOW READING"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shelfEmoji: {
    fontSize: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },
  scrollList: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: "stretch",
    paddingBottom: 4,
  },
  newScanCard: {
    width: 140,
    height: 180,
    borderRadius: 16,
    backgroundColor: "#fff7ed",
    borderWidth: 1.5,
    borderColor: "#fed7aa",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    position: "relative",
  },
  scanBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ea580c",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  scanBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
  },
  newScanIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  newScanTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9a3412",
    textAlign: "center",
  },
  newScanDesc: {
    fontSize: 10,
    color: "#c2410c",
    textAlign: "center",
    marginTop: 3,
    lineHeight: 13,
  },
  bookCard: {
    width: 150,
    height: 180,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: "relative",
    justifyContent: "space-between",
  },
  bookCardSelected: {
    borderColor: "#ea580c",
    borderWidth: 2,
    backgroundColor: "#fffbf7",
    shadowColor: "#ea580c",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  coverWrapper: {
    position: "relative",
    width: "100%",
    height: 75,
  },
  bookCover: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f1f5f9",
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  wordsCountPill: {
    position: "absolute",
    bottom: 5,
    right: 6,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  wordsCountText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
  },
  bookInfo: {
    padding: 10,
    flex: 1,
    justifyContent: "space-between",
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#475569",
  },
  bookTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 16,
    marginVertical: 4,
  },
  bookSource: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "500",
  },
  activePillIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#ea580c",
    paddingVertical: 3,
  },
  activePillText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
});
