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
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredPages = SAMPLE_BOOK_PAGES.filter((p) => p.language === language);
  const displayPages = filteredPages.length > 0 ? filteredPages : SAMPLE_BOOK_PAGES.filter((p) => p.language === "en");
  const currentPage = displayPages.find((p) => p.id === currentPageId) || displayPages[0];

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      {/* The title lives on the story cover; this bar only opens the shelf */}
      <View style={styles.titleRow}>
        <View style={styles.titleCol}>
          <Ionicons name="library-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.bookMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {currentPage.gradeLevel}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.changeButton}
          onPress={() => {
            playChime("tap");
            setIsExpanded(!isExpanded);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.changeText, { color: theme.primary }]}>
            {isExpanded ? t.closeBtnShort : t.changeBookBtn}
          </Text>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Bookshelf */}
      {isExpanded && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>
          <TouchableOpacity
            style={[styles.book, styles.scanBook, { borderColor: theme.border }]}
            onPress={() => {
              playChime("tap");
              setIsExpanded(false);
              onOpenScan();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={26} color={theme.primary} />
            <Text style={[styles.scanText, { color: theme.text }]} numberOfLines={2}>
              {t.navScan}
            </Text>
          </TouchableOpacity>

          {displayPages.map((pageItem) => {
            const isSelected = pageItem.id === currentPage.id;
            return (
              <TouchableOpacity
                key={pageItem.id}
                style={styles.book}
                onPress={() => {
                  playChime("tap");
                  onSelectPage(pageItem);
                  setIsExpanded(false);
                }}
                activeOpacity={0.85}
              >
                <Image
                  source={toImageSource(pageItem.imageUrl)}
                  style={[
                    styles.cover,
                    { backgroundColor: theme.surfaceSecondary, borderColor: isSelected ? theme.primary : theme.border },
                    isSelected && styles.coverSelected,
                  ]}
                  resizeMode="cover"
                />
                <Text style={[styles.coverTitle, { color: theme.text }]} numberOfLines={2}>
                  {pageItem.title}
                </Text>
                <Text style={[styles.coverMeta, { color: theme.textMuted }]} numberOfLines={1}>
                  {pageItem.words.length} {t.wordsLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    maxWidth: 712,
    width: "100%",
    alignSelf: "center",
  },
  titleCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookMeta: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "800",
  },
  shelf: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  book: {
    width: 112,
    gap: 4,
  },
  scanBook: {
    height: 150,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
  },
  scanText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  cover: {
    width: 112,
    height: 112,
    borderRadius: 12,
    borderWidth: 1,
  },
  coverSelected: {
    borderWidth: 3,
  },
  coverTitle: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  coverMeta: {
    fontSize: 11,
    fontWeight: "600",
  },
});
