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
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredPages = SAMPLE_BOOK_PAGES.filter((p) => p.language === language);
  const displayPages = filteredPages.length > 0 ? filteredPages : SAMPLE_BOOK_PAGES.filter((p) => p.language === "en");
  const currentPage = displayPages.find((p) => p.id === currentPageId) || displayPages[0];

  return (
    <View style={styles.container}>
      {/* Sleek Mini Bar: Shows current book + "Change Book" toggle button */}
      <View style={styles.compactBar}>
        <TouchableOpacity
          style={styles.bookPill}
          onPress={() => {
            playChime("tap");
            setIsExpanded(!isExpanded);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.bookIconBadge}>
            <Ionicons name="book" size={14} color="#ea580c" />
          </View>
          <View style={styles.bookTitlesCol}>
            <Text style={styles.currentBookTitle} numberOfLines={1}>
              {currentPage.title}
            </Text>
            <Text style={styles.currentBookGrade}>
              {currentPage.gradeLevel} • {currentPage.source}
            </Text>
          </View>

          <View style={[styles.toggleBadge, isExpanded && styles.toggleBadgeActive]}>
            <Text style={[styles.toggleBadgeText, isExpanded && styles.toggleBadgeTextActive]}>
              {isExpanded ? (language === "es" ? "Cerrar" : "Close") : (language === "es" ? "Cambiar" : "Change")}
            </Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={13}
              color={isExpanded ? "#ffffff" : "#64748b"}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Expandable Visual Carousel Shelf */}
      {isExpanded && (
        <View style={styles.expandedDrawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>
              {language === "es" ? "Biblioteca de Cuentos" : "Story Library"}
            </Text>
            <Text style={styles.drawerSubtitle}>
              {language === "es"
                ? "Elige una lectura o escanea una página de tu libro de texto escolar"
                : "Choose a story or scan a page from your school book"}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollList}
          >
            {/* 1. OCR Camera Scanner Card */}
            <TouchableOpacity
              style={styles.newScanCard}
              onPress={() => {
                playChime("sparkle");
                setIsExpanded(false);
                onOpenScan();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.newScanIconCircle}>
                <Ionicons name="camera-outline" size={24} color="#ea580c" />
              </View>
              <View style={styles.scanBadge}>
                <Text style={styles.scanBadgeText}>OCR</Text>
              </View>
              <Text style={styles.newScanTitle}>{t.navScan}</Text>
              <Text style={styles.newScanDesc} numberOfLines={2}>
                {language === "es" ? "Usa tu libro escolar real" : "Scan physical book"}
              </Text>
            </TouchableOpacity>

            {/* 2. Available Book Cards */}
            {displayPages.map((page) => {
              const isSelected = page.id === currentPageId;
              const wordCount = page.words?.length || page.text.split(/\s+/).length;

              return (
                <TouchableOpacity
                  key={page.id}
                  style={[styles.bookCard, isSelected && styles.bookCardSelected]}
                  onPress={() => {
                    playChime("tap");
                    onSelectPage(page);
                    setIsExpanded(false);
                  }}
                  activeOpacity={0.85}
                >
                  {page.imageUrl && (
                    <View style={styles.coverWrapper}>
                      <Image source={{ uri: page.imageUrl }} style={styles.bookCover} />
                      <View style={styles.coverOverlay} />
                      <View style={styles.wordsCountPill}>
                        <Text style={styles.wordsCountText}>
                          {wordCount} {t.wordsRead.toLowerCase()}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.bookInfo}>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyText}>{page.gradeLevel}</Text>
                    </View>

                    <Text style={styles.bookCardTitle} numberOfLines={2}>
                      {page.title}
                    </Text>

                    <Text style={styles.bookCardSource} numberOfLines={1}>
                      {page.source}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={styles.activePillIndicator}>
                      <Ionicons name="checkmark-circle" size={11} color="#ffffff" />
                      <Text style={styles.activePillText}>
                        {language === "es" ? "ACTIVO" : "ACTIVE"}
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
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  compactBar: {
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  bookPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  bookIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    alignItems: "center",
    justifyContent: "center",
  },
  bookTitlesCol: {
    flex: 1,
  },
  currentBookTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  currentBookGrade: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "500",
  },
  toggleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  toggleBadgeActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  toggleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  toggleBadgeTextActive: {
    color: "#ffffff",
  },
  expandedDrawer: {
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  drawerHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  drawerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  drawerSubtitle: {
    fontSize: 11,
    color: "#64748b",
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
    backgroundColor: "#fff7ed",
    borderWidth: 1.5,
    borderColor: "#fed7aa",
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
    backgroundColor: "#ea580c",
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
    backgroundColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  newScanTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9a3412",
    textAlign: "center",
  },
  newScanDesc: {
    fontSize: 9,
    color: "#c2410c",
    textAlign: "center",
    marginTop: 2,
    lineHeight: 12,
  },
  bookCard: {
    width: 135,
    height: 155,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    justifyContent: "space-between",
  },
  bookCardSelected: {
    borderColor: "#ea580c",
    borderWidth: 2,
    backgroundColor: "#fffbf7",
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
    backgroundColor: "#f8fafc",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  difficultyText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#475569",
  },
  bookCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 14,
    marginVertical: 2,
  },
  bookCardSource: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "500",
  },
  activePillIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: "#ea580c",
    paddingVertical: 2,
  },
  activePillText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
  },
});
