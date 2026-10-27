import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Header } from './src/components/Header';
import { PageSelector } from './src/components/PageSelector';
import { ReadingView } from './src/components/ReadingView';
import { ParentReportView } from './src/components/ParentReportView';
import { CameraCaptureModal } from './src/components/CameraCaptureModal';
import { TutorDrawer } from './src/components/TutorDrawer';
import { PrivacyBadgeModal } from './src/components/PrivacyBadgeModal';
import { BookPage, ReadingSessionResult, SupportedLanguage } from './src/types';
import { SAMPLE_BOOK_PAGES } from './src/data/sampleBooks';
import { getReadingStats } from './src/services/storageService';

export default function App() {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<'reading' | 'report' | 'scan'>('reading');
  const [currentPage, setCurrentPage] = useState<BookPage>(SAMPLE_BOOK_PAGES[0]);
  const [streakDays, setStreakDays] = useState<number>(3);

  // Modals state
  const [cameraModalVisible, setCameraModalVisible] = useState<boolean>(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState<boolean>(false);
  const [tutorDrawerVisible, setTutorDrawerVisible] = useState<boolean>(false);
  const [tutorMode, setTutorMode] = useState<'explain' | 'celebrate' | 'quiz'>('explain');
  const [selectedWordForTutor, setSelectedWordForTutor] = useState<string>('');
  const [contextSentenceForTutor, setContextSentenceForTutor] = useState<string>('');
  const [currentSessionResult, setCurrentSessionResult] = useState<ReadingSessionResult | null>(null);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    const stats = await getReadingStats();
    if (stats.streakDays) {
      setStreakDays(stats.streakDays);
    }
  };

  const handleSelectLanguage = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    // Find matching sample page in the selected language
    const match = SAMPLE_BOOK_PAGES.find((p) => p.language === newLang) || SAMPLE_BOOK_PAGES[0];
    setCurrentPage(match);
  };

  const handleSelectPage = (page: BookPage) => {
    setCurrentPage(page);
    setActiveTab('reading');
  };

  const handlePageCreated = (newPage: BookPage) => {
    setCurrentPage(newPage);
    setActiveTab('reading');
  };

  const handleOpenWordExplainer = (word: string, contextSentence: string) => {
    setSelectedWordForTutor(word);
    setContextSentenceForTutor(contextSentence);
    setTutorMode('explain');
    setTutorDrawerVisible(true);
  };

  const handlePageCompleted = (result: ReadingSessionResult) => {
    setCurrentSessionResult(result);
    setTutorMode('celebrate');
    setTutorDrawerVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appContainer}>
        {/* Persistent Top Navigation Bar */}
        <Header
          language={language}
          onSelectLanguage={handleSelectLanguage}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'scan') {
              setCameraModalVisible(true);
            } else {
              setActiveTab(tab);
            }
          }}
          streakDays={streakDays}
          onOpenPrivacy={() => setPrivacyModalVisible(true)}
        />

        {/* Tab 1: Reading Room */}
        {activeTab === 'reading' && (
          <View style={styles.mainView}>
            {/* Shelf Carousel */}
            <PageSelector
              currentPageId={currentPage.id}
              onSelectPage={handleSelectPage}
              onOpenScan={() => setCameraModalVisible(true)}
              language={language}
            />

            {/* Reading Board */}
            <ReadingView
              key={currentPage.id}
              page={currentPage}
              language={language}
              onOpenWordExplainer={handleOpenWordExplainer}
              onPageCompleted={handlePageCompleted}
              onOpenScan={() => setCameraModalVisible(true)}
            />
          </View>
        )}

        {/* Tab 2: Parent & Teacher Progress Report */}
        {activeTab === 'report' && (
          <View style={styles.mainView}>
            <ParentReportView
              currentSession={currentSessionResult}
              language={language}
              onBackToReading={() => setActiveTab('reading')}
              onOpenWordExplainer={handleOpenWordExplainer}
            />
          </View>
        )}

        {/* Camera / OCR Scanner Modal */}
        <CameraCaptureModal
          visible={cameraModalVisible}
          onClose={() => setCameraModalVisible(false)}
          onPageCreated={handlePageCreated}
          language={language}
        />

        {/* Meta Muse Spark AI Tutor Drawer */}
        <TutorDrawer
          visible={tutorDrawerVisible}
          mode={tutorMode}
          selectedWord={selectedWordForTutor}
          sentenceContext={contextSentenceForTutor}
          sessionResult={currentSessionResult || undefined}
          pageText={currentPage.text}
          language={language}
          onClose={() => setTutorDrawerVisible(false)}
          onViewReport={() => {
            setTutorDrawerVisible(false);
            setActiveTab('report');
          }}
        />

        {/* Child Safety & Privacy Modal */}
        <PrivacyBadgeModal
          visible={privacyModalVisible}
          onClose={() => setPrivacyModalVisible(false)}
          language={language}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    ...(Platform.OS === 'web'
      ? {
          height: '100vh' as any,
          display: 'flex',
          flexDirection: 'column',
        }
      : {}),
  },
  mainView: {
    flex: 1,
  },
});
