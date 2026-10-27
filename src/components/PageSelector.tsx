import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookPage, SupportedLanguage } from '../types';
import { SAMPLE_BOOK_PAGES } from '../data/sampleBooks';
import { getTranslation } from '../i18n/translations';

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
  // Fallback if no pages match
  const displayPages = filteredPages.length > 0 ? filteredPages : SAMPLE_BOOK_PAGES.filter((p) => p.language === 'en');

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>{t.shelfTitle}</Text>
          <Text style={styles.sectionSubtitle}>{t.shelfSubtitle}</Text>
        </View>

        {/* Scan Button */}
        <TouchableOpacity style={styles.scanButton} onPress={onOpenScan} activeOpacity={0.8}>
          <Ionicons name="camera" size={17} color="#ffffff" />
          <Text style={styles.scanButtonText}>{t.scanBookButton}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {/* Custom Scanned Book Card Shortcut */}
        <TouchableOpacity
          style={styles.newScanCard}
          onPress={onOpenScan}
          activeOpacity={0.8}
        >
          <View style={styles.newScanIconCircle}>
            <Ionicons name="add" size={26} color="#ea580c" />
          </View>
          <Text style={styles.newScanTitle}>{t.navScan}</Text>
          <Text style={styles.newScanDesc}>{t.cameraSubtitle.slice(0, 40)}...</Text>
        </TouchableOpacity>

        {displayPages.map((page) => {
          const isSelected = page.id === currentPageId;
          return (
            <TouchableOpacity
              key={page.id}
              style={[styles.bookCard, isSelected && styles.bookCardSelected]}
              onPress={() => onSelectPage(page)}
              activeOpacity={0.8}
            >
              {page.imageUrl && (
                <Image source={{ uri: page.imageUrl }} style={styles.bookCover} />
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
                <View style={styles.activeCheckmark}>
                  <Ionicons name="checkmark-circle" size={20} color="#ea580c" />
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
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ea580c',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollList: {
    paddingHorizontal: 20,
    gap: 14,
    alignItems: 'stretch',
  },
  newScanCard: {
    width: 140,
    height: 180,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#fed7aa',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  newScanIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  newScanTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9a3412',
    textAlign: 'center',
  },
  newScanDesc: {
    fontSize: 10,
    color: '#c2410c',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  bookCard: {
    width: 150,
    height: 180,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  bookCardSelected: {
    borderColor: '#ea580c',
    borderWidth: 2.5,
    shadowColor: '#ea580c',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  bookCover: {
    width: '100%',
    height: 70,
    backgroundColor: '#cbd5e1',
  },
  bookInfo: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  bookTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 16,
  },
  bookSource: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  activeCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
});
