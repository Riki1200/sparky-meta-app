import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReadingSessionResult, ReadingErrorDetail, SupportedLanguage } from '../types';
import { getReadingHistory, getReadingStats } from '../services/storageService';
import { speakWordPhonetically, playChime, speakText, stopSpeaking, getSparkyVoiceSample } from '../services/ttsService';
import { generateTutorSpokenFeedback } from '../services/metaApi';
import { getTranslation } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';

interface ParentReportViewProps {
  currentSession?: ReadingSessionResult | null;
  language: SupportedLanguage;
  onBackToReading: () => void;
  onOpenWordExplainer: (word: string, contextSentence: string) => void;
}

export const ParentReportView: React.FC<ParentReportViewProps> = ({
  currentSession,
  language,
  onBackToReading,
  onOpenWordExplainer,
}) => {
  const t = getTranslation(language);
  const { theme, themeMode } = useTheme();
  const [history, setHistory] = useState<ReadingSessionResult[]>([]);
  const [stats, setStats] = useState<any>({
    totalMinutes: 0,
    totalWords: 0,
    avgAccuracy: 0,
    streakDays: 1,
    sessionsCount: 0,
    avgWpm: 0,
  });
  const [copiedAlert, setCopiedAlert] = useState(false);
  const studentsList = [
    { name: 'Leo', emoji: '👦', grade: t.grade1 },
    { name: 'Sofía', emoji: '👧', grade: t.grade2 },
    { name: 'Mateo', emoji: '🧒', grade: t.grade3 },
  ];
  const [selectedStudent, setSelectedStudent] = useState(studentsList[0]);
  const [printModalVisible, setPrintModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentSession]);

  const loadData = async () => {
    const hist = await getReadingHistory();
    const st = await getReadingStats();
    setHistory(hist);
    setStats(st);
  };

  const demoTitles: Record<SupportedLanguage, { title: string; source: string; errors: ReadingErrorDetail[] }> = {
    en: {
      title: "The Little Hummingbird's Flight",
      source: 'Nature Tales for Young Readers',
      errors: [
        {
          word: 'fluttered',
          display: 'fluttered',
          errorType: 'hesitation',
          hesitationSeconds: 1.9,
          syllables: ['flut', 'tered'],
        },
        {
          word: 'courage',
          display: 'courage',
          errorType: 'mispronounced',
          spokenWord: 'curage',
          syllables: ['cour', 'age'],
        },
      ],
    },
    es: {
      title: 'El Gallito Cantor del Cibao',
      source: 'Cuentos y Tradiciones Dominicanas',
      errors: [
        {
          word: 'madrugada',
          display: 'madrugada.',
          errorType: 'hesitation',
          hesitationSeconds: 2.1,
          syllables: ['ma', 'dru', 'ga', 'da'],
        },
        {
          word: 'resplandor',
          display: 'resplandor',
          errorType: 'mispronounced',
          spokenWord: 'resplandorando',
          syllables: ['res', 'plan', 'dor'],
        },
      ],
    },
    fr: {
      title: 'Le Petit Colibri du Matin',
      source: 'Contes de la Nature pour Enfants',
      errors: [
        {
          word: 'agitait',
          display: 'agitait',
          errorType: 'hesitation',
          hesitationSeconds: 1.8,
          syllables: ['a', 'gi', 'tait'],
        },
        {
          word: 'courage',
          display: 'courage',
          errorType: 'mispronounced',
          spokenWord: 'curage',
          syllables: ['cou', 'rage'],
        },
      ],
    },
    pt: {
      title: 'O Pequeno Beija-Flor Dourado',
      source: 'Contos da Natureza Infantil',
      errors: [
        {
          word: 'coloridas',
          display: 'coloridas',
          errorType: 'hesitation',
          hesitationSeconds: 1.9,
          syllables: ['co', 'lo', 'ri', 'das'],
        },
        {
          word: 'coragem',
          display: 'coragem',
          errorType: 'mispronounced',
          spokenWord: 'coragem',
          syllables: ['co', 'ra', 'gem'],
        },
      ],
    },
    de: {
      title: 'Der kleine Kolibri und die Zauberblume',
      source: 'Naturmärchen für Kinder',
      errors: [
        {
          word: 'flatterte',
          display: 'flatterte',
          errorType: 'hesitation',
          hesitationSeconds: 1.9,
          syllables: ['flat', 'ter', 'te'],
        },
        {
          word: 'friedlich',
          display: 'friedlich',
          errorType: 'mispronounced',
          spokenWord: 'fridlich',
          syllables: ['fried', 'lich'],
        },
      ],
    },
    it: {
      title: "Il Piccolo Colibrì e il Fiore d'Oro",
      source: 'Fiabe della Natura per Bambini',
      errors: [
        {
          word: 'sbatteva',
          display: 'sbatteva',
          errorType: 'hesitation',
          hesitationSeconds: 1.8,
          syllables: ['sbat', 'te', 'va'],
        },
        {
          word: 'profumato',
          display: 'profumato',
          errorType: 'mispronounced',
          spokenWord: 'profumate',
          syllables: ['pro', 'fu', 'ma', 'to'],
        },
      ],
    },
    nl: {
      title: 'De Kleine Kolibrie en de Bloem',
      source: 'Natuurverhalen voor Jonge Lezers',
      errors: [
        {
          word: 'fladderde',
          display: 'fladderde',
          errorType: 'hesitation',
          hesitationSeconds: 2.0,
          syllables: ['flad', 'der', 'de'],
        },
        {
          word: 'kleurrijke',
          display: 'kleurrijke',
          errorType: 'mispronounced',
          spokenWord: 'kleurrik',
          syllables: ['kleur', 'rij', 'ke'],
        },
      ],
    },
    pl: {
      title: 'Mały Koliber i Kolorowy Ogród',
      source: 'Bajki Przyrodnicze dla Dzieci',
      errors: [
        {
          word: 'trzepotał',
          display: 'trzepotał',
          errorType: 'hesitation',
          hesitationSeconds: 1.9,
          syllables: ['trze', 'po', 'tał'],
        },
        {
          word: 'skrzydełkami',
          display: 'skrzydełkami',
          errorType: 'mispronounced',
          spokenWord: 'skrzydelkami',
          syllables: ['skrzy', 'deł', 'ka', 'mi'],
        },
      ],
    },
    tr: {
      title: 'Küçük Sinek Kuşunun Uçuşu',
      source: 'Çocuklar İçin Doğa Masalları',
      errors: [
        {
          word: 'kanatlarını',
          display: 'kanatlarını',
          errorType: 'hesitation',
          hesitationSeconds: 2.1,
          syllables: ['ka', 'nat', 'la', 'rı', 'nı'],
        },
        {
          word: 'rengarenk',
          display: 'rengarenk',
          errorType: 'mispronounced',
          spokenWord: 'rengarek',
          syllables: ['ren', 'ga', 'renk'],
        },
      ],
    },
  };

  const defaultDemoSession: ReadingSessionResult = {
    id: 'demo_session_1',
    pageId: 'default-page',
    pageTitle: demoTitles[language]?.title || demoTitles.en.title,
    bookSource: demoTitles[language]?.source || demoTitles.en.source,
    language,
    date: t.todayLabel,
    durationSeconds: 32,
    totalWords: 36,
    correctWords: 32,
    hesitationWords: 2,
    mispronouncedWords: 2,
    skippedWords: 0,
    accuracyPercent: 92,
    wordsPerMinute: 68,
    gradeLevel: t.grade12Label,
    errors: demoTitles[language]?.errors || demoTitles.en.errors,
  };

  const activeSession = currentSession || (history.length > 0 ? history[0] : defaultDemoSession);

  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [spokenFeedbackText, setSpokenFeedbackText] = useState<string>('');
  const [loadingFeedback, setLoadingFeedback] = useState<boolean>(false);

  useEffect(() => {
    if (activeSession) {
      if (activeSession.tutorFeedback) {
        setSpokenFeedbackText(activeSession.tutorFeedback);
      } else {
        setLoadingFeedback(true);
        generateTutorSpokenFeedback(activeSession)
          .then((fb) => setSpokenFeedbackText(fb))
          .catch(() => setSpokenFeedbackText(getSparkyVoiceSample(language)))
          .finally(() => setLoadingFeedback(false));
      }
    }
    return () => {
      stopSpeaking();
      setIsPlayingAudio(false);
    };
  }, [activeSession?.id, language]);

  const handleToggleEncouragementVoice = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }
    const textToSpeak = spokenFeedbackText || activeSession?.tutorFeedback || getSparkyVoiceSample(language);
    setIsPlayingAudio(true);
    speakText(textToSpeak, language, 0.88, () => setIsPlayingAudio(false));
  };

  const handleRefreshFeedback = async () => {
    if (!activeSession) return;
    stopSpeaking();
    setIsPlayingAudio(false);
    setLoadingFeedback(true);
    playChime('sparkle');
    try {
      const newFeedback = await generateTutorSpokenFeedback(activeSession);
      setSpokenFeedbackText(newFeedback);
      setIsPlayingAudio(true);
      speakText(newFeedback, language, 0.88, () => setIsPlayingAudio(false));
    } catch (e) {
      console.warn('Feedback refresh error:', e);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const getWpmEvaluation = (wpm: number) => {
    if (wpm >= 70) {
      return {
        level: t.fluencyOptimal,
        color: '#16a34a',
        bg: '#ecfdf5',
        note: t.fluencyOptimalDesc,
      };
    }
    if (wpm >= 45) {
      return {
        level: t.fluencyDeveloping,
        color: '#d97706',
        bg: '#fffbeb',
        note: t.fluencyDevelopingDesc,
      };
    }
    return {
      level: t.fluencySupport,
      color: '#ea580c',
      bg: '#fff7ed',
      note: t.fluencySupportDesc,
    };
  };

  const handleShareReport = () => {
    if (!activeSession) return;
    const summaryText =
      `📚 ${t.reportTitle} - ${t.appName} (Meta AI)\n` +
      `${t.shareReportStory}: ${activeSession.pageTitle}\n` +
      `${t.timeLabel}: ${activeSession.date}\n` +
      `${t.shareReportSpeed}: ${activeSession.wordsPerMinute} WPM\n` +
      `${t.shareReportAccuracy}: ${activeSession.accuracyPercent}%\n` +
      `${t.shareReportWordsRead}: ${activeSession.totalWords}\n` +
      `${t.shareReportPractice}: ${activeSession.errors.map((e) => e.word).join(', ') || t.shareReportPerfect}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopiedAlert(true);
      playChime('sparkle');
      setTimeout(() => setCopiedAlert(false), 3000);
    } else {
      Alert.alert(t.shareReportBtn, summaryText);
    }
  };

  const evalInfo = getWpmEvaluation(activeSession ? activeSession.wordsPerMinute : 65);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Modern Dashboard Header */}
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerEmoji}>📊</Text>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {t.reportTitle}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {activeSession ? `${activeSession.pageTitle} • ${activeSession.gradeLevel}` : t.reportSubtitle}
              </Text>
              {activeSession?.metaMuseTranscript ? (
                <View style={styles.museAuditBadge}>
                  <Ionicons name="sparkles" size={10} color="#6366f1" />
                  <Text style={styles.museAuditBadgeText}>
                    Meta Muse Voice Transcribe
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.shareTouch}
          onPress={handleShareReport}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.gradients.shareWhatsApp}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shareButtonGradient}
          >
            <Ionicons
              name={copiedAlert ? 'checkmark-circle' : 'share-social-outline'}
              size={16}
              color="#ffffff"
            />
            <Text style={styles.shareButtonText}>
              {copiedAlert
                ? t.copiedToast
                : t.shareReportAction}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 1 Phone in the Family: Student Profile Switcher & Shared Device Banner */}
      <View style={[styles.studentSharedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.studentSharedHeader}>
          <View style={styles.studentSharedLeft}>
            <Text style={styles.studentSharedEmoji}>📱</Text>
            <View>
              <Text style={[styles.studentSharedTitle, { color: theme.text }]}>
                {t.sharedDeviceModeTitle}
              </Text>
              <Text style={[styles.studentSharedSub, { color: theme.textSecondary }]}>
                {t.sharedDeviceModeSub}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.printOfflinePill, { backgroundColor: theme.primaryLight, borderColor: theme.borderActive }]}
            onPress={() => {
              playChime('tap');
              setPrintModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="print-outline" size={14} color={theme.primary} />
            <Text style={[styles.printOfflineText, { color: theme.primary }]}>
              {t.printableWorksheetBtn}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.studentsRow}>
          {studentsList.map((st) => {
            const isSelected = selectedStudent.name === st.name;
            return (
              <TouchableOpacity
                key={st.name}
                style={[
                  styles.studentPill,
                  {
                    backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSecondary,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => {
                  playChime('tap');
                  setSelectedStudent(st);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.studentEmoji}>{st.emoji}</Text>
                <View>
                  <Text style={[styles.studentName, { color: isSelected ? theme.primary : theme.text }]}>
                    {st.name}
                  </Text>
                  <Text style={[styles.studentGrade, { color: theme.textSecondary }]}>
                    {st.grade}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={15} color={theme.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* UNESCO Literacy Benchmark Banner */}
      <View style={[styles.benchmarkBanner, { backgroundColor: evalInfo.bg }]}>
        <View style={styles.benchmarkLeft}>
          <Text style={[styles.benchmarkLevel, { color: evalInfo.color }]}>
            {evalInfo.level}
          </Text>
          <Text style={styles.benchmarkDesc}>
            {activeSession.wordsPerMinute} WPM — {evalInfo.note}
          </Text>
        </View>
        <View style={styles.benchmarkTargetChip}>
          <Text style={styles.benchmarkTargetText}>UNESCO: 60-80 WPM</Text>
        </View>
      </View>

      {/* 4 Bento-Grid KPI Cards with Dynamic Gradients */}
      <View style={styles.kpiGrid}>
        {/* KPI 1: Speed */}
        <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LinearGradient
            colors={theme.gradients.kpiSpeed}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.kpiGradientCircle}
          >
            <Ionicons name="speedometer-outline" size={17} color="#ffffff" />
          </LinearGradient>
          <Text style={[styles.kpiValue, { color: theme.text }]}>{activeSession.wordsPerMinute}</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>{t.speedometerLabel}</Text>
          <View style={[styles.kpiBadgePill, { backgroundColor: theme.badges.kpiSpeedBg }]}>
            <Text style={[styles.kpiBadgeText, { color: theme.badges.kpiSpeedText }]}>WPM</Text>
          </View>
        </View>

        {/* KPI 2: Accuracy */}
        <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LinearGradient
            colors={theme.gradients.kpiAccuracy}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.kpiGradientCircle}
          >
            <Ionicons name="checkmark-done-circle-outline" size={17} color="#ffffff" />
          </LinearGradient>
          <Text style={[styles.kpiValue, { color: theme.text }]}>{activeSession.accuracyPercent}%</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>{t.summaryAccuracy}</Text>
          <View style={[styles.kpiBadgePill, { backgroundColor: theme.badges.kpiAccuracyBg }]}>
            <Text style={[styles.kpiBadgeText, { color: theme.badges.kpiAccuracyText }]}>
              {t.accuracyLabel}
            </Text>
          </View>
        </View>

        {/* KPI 3: Streak */}
        <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LinearGradient
            colors={theme.gradients.kpiStreak}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.kpiGradientCircle}
          >
            <Ionicons name="flame-outline" size={17} color="#ffffff" />
          </LinearGradient>
          <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.streakDays}</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>{t.daysStreak}</Text>
          <View style={[styles.kpiBadgePill, { backgroundColor: theme.badges.kpiStreakBg }]}>
            <Text style={[styles.kpiBadgeText, { color: theme.badges.kpiStreakText }]}>
              {t.daysUnit}
            </Text>
          </View>
        </View>

        {/* KPI 4: Total Words */}
        <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LinearGradient
            colors={theme.gradients.kpiWords}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.kpiGradientCircle}
          >
            <Ionicons name="book-outline" size={17} color="#ffffff" />
          </LinearGradient>
          <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.totalWords || activeSession.totalWords}</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>{t.summaryWordsRead}</Text>
          <View style={[styles.kpiBadgePill, { backgroundColor: theme.badges.kpiWordsBg }]}>
            <Text style={[styles.kpiBadgeText, { color: theme.badges.kpiWordsText }]}>
              {t.wordsUnit}
            </Text>
          </View>
        </View>
      </View>

      {/* Session Breakdown Bar */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {t.sessionBreakdownTitle}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {activeSession.totalWords} {t.sessionBreakdownDesc} {activeSession.durationSeconds}s
        </Text>

        <View style={styles.breakdownRow}>
          <View style={[styles.breakdownBox, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
            <Text style={[styles.breakdownNumber, { color: '#047857' }]}>
              {activeSession.correctWords}
            </Text>
            <Text style={styles.breakdownLabel}>{t.legendCorrect}</Text>
          </View>

          <View style={[styles.breakdownBox, { backgroundColor: '#fefce8', borderColor: '#fde047' }]}>
            <Text style={[styles.breakdownNumber, { color: '#a16207' }]}>
              {activeSession.hesitationWords}
            </Text>
            <Text style={styles.breakdownLabel}>{t.legendHesitation}</Text>
          </View>

          <View style={[styles.breakdownBox, { backgroundColor: '#fff1f2', borderColor: '#fecdd3' }]}>
            <Text style={[styles.breakdownNumber, { color: '#be123c' }]}>
              {activeSession.mispronouncedWords}
            </Text>
            <Text style={styles.breakdownLabel}>{t.legendMispronounced}</Text>
          </View>

          <View style={[styles.breakdownBox, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
            <Text style={[styles.breakdownNumber, { color: '#6d28d9' }]}>
              {activeSession.skippedWords}
            </Text>
            <Text style={styles.breakdownLabel}>{t.legendSkipped}</Text>
          </View>
        </View>
      </View>

      {/* Spoken Tutor Encouragement from Meta Muse Spark */}
      <View
        style={[
          styles.spokenFeedbackCard,
          {
            backgroundColor: themeMode === 'dark' ? '#1e1b4b' : '#f5f3ff',
            borderColor: themeMode === 'dark' ? '#3730a3' : '#c7d2fe',
          },
        ]}
      >
        <View style={styles.spokenHeaderRow}>
          <View style={styles.spokenHeaderLeft}>
            <View style={styles.spokenIconCircle}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#6366f1" />
            </View>
            <View>
              <Text
                style={[
                  styles.spokenTitle,
                  { color: themeMode === 'dark' ? '#c7d2fe' : '#4338ca' },
                ]}
              >
                {t.spokenFeedbackTitle}
              </Text>
              <View style={styles.spokenMuseBadge}>
                <Ionicons name="sparkles" size={10} color="#6366f1" />
                <Text style={styles.spokenMuseBadgeText}>
                  Meta Muse Spark 1.3 • Audio
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.spokenActionButtons}>
            <TouchableOpacity
              style={[
                styles.replayAudioBtn,
                { backgroundColor: isPlayingAudio ? '#ef4444' : '#6366f1' },
              ]}
              onPress={handleToggleEncouragementVoice}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlayingAudio ? 'stop-circle' : 'volume-high'}
                size={16}
                color="#ffffff"
              />
              <Text style={styles.replayAudioText}>
                {isPlayingAudio ? t.stopVoiceBtn : t.listenToSparky}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.refreshFeedbackBtn,
                {
                  backgroundColor:
                    themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e7ff',
                },
              ]}
              onPress={handleRefreshFeedback}
              disabled={loadingFeedback}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={14} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        {loadingFeedback ? (
          <View style={styles.feedbackLoadingBox}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text
              style={[
                styles.feedbackLoadingText,
                { color: themeMode === 'dark' ? '#a5b4fc' : '#6366f1' },
              ]}
            >
              {t.generatingCheer}
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.feedbackBodyText,
              { color: themeMode === 'dark' ? '#e0e7ff' : '#312e81' },
            ]}
          >
            "{spokenFeedbackText || getSparkyVoiceSample(language)}"
          </Text>
        )}
      </View>

      {/* Interactive Practice Flashcards Deck */}
      <View style={styles.sectionCard}>
        <View style={styles.deckHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>{t.practiceWordsTitle}</Text>
            <Text style={styles.sectionSubtitle}>
              {t.practiceWordsSubtitle}
            </Text>
          </View>
          <View style={styles.deckBadge}>
            <Text style={styles.deckBadgeText}>
              {activeSession.errors.length} {t.wordsUnit}
            </Text>
          </View>
        </View>

        {activeSession.errors.length === 0 ? (
          <View style={styles.emptyDeckBox}>
            <Text style={styles.emptyDeckEmoji}>🌟</Text>
            <Text style={styles.emptyDeckTitle}>
              {t.flawlessReadingTitle}
            </Text>
            <Text style={styles.emptyDeckSubtitle}>
              {t.flawlessReadingSubtitle}
            </Text>
          </View>
        ) : (
          <View style={styles.errorsCardsList}>
            {activeSession.errors.map((err, idx) => {
              const isHesitation = err.errorType === 'hesitation';
              return (
                <View key={idx} style={styles.errorCard}>
                  <View style={styles.errorCardLeft}>
                    <View style={styles.errorWordRow}>
                      <Text style={styles.errorWordTitle}>{err.display}</Text>
                      <View
                        style={[
                          styles.errorTypeTag,
                          isHesitation ? styles.hesitationTag : styles.mispronouncedTag,
                        ]}
                      >
                        <Text
                          style={[
                            styles.errorTypeTagText,
                            isHesitation ? styles.hesitationTagText : styles.mispronouncedTagText,
                          ]}
                        >
                          {isHesitation ? `${t.hesitationBadge} (${err.hesitationSeconds || 1.9}s)` : t.pronunciationBadge}
                        </Text>
                      </View>
                    </View>

                    {err.syllables && (
                      <Text style={styles.syllableBreakdown}>
                        {t.wordSyllables}:{' '}
                        <Text style={styles.syllableBold}>{err.syllables.join(' • ')}</Text>
                      </Text>
                    )}
                  </View>

                  <View style={styles.errorCardActions}>
                    <TouchableOpacity
                      style={styles.listenErrorBtn}
                      onPress={() => speakWordPhonetically(err.word, language)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="volume-high" size={15} color="#ea580c" />
                      <Text style={styles.listenErrorBtnText}>
                        {t.listenWordBtn}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.explainErrorBtn}
                      onPress={() => onOpenWordExplainer(err.word, activeSession.pageTitle)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="sparkles" size={14} color="#2563eb" />
                      <Text style={styles.explainErrorBtnText}>
                        {t.explainWordBtn}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Meta AI Pedagogical Advice Card */}
      <View style={styles.pedagogicalCard}>
        <View style={styles.pedagogicalHeaderRow}>
          <Text style={styles.pedagogicalMascot}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pedagogicalTitle}>
              {t.parentPedagogicalTipTitle}
            </Text>
            <Text style={styles.pedagogicalSub}>Meta Muse Spark 1.3</Text>
          </View>
        </View>
        <Text style={styles.pedagogicalText}>
          {t.parentTipDeveloping}
        </Text>
      </View>

      {/* Back to Reading Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBackToReading}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={16} color="#0f172a" />
        <Text style={styles.backButtonText}>
          {t.backToReadingBtn}
        </Text>
      </TouchableOpacity>

      {/* 8. Printable Offline Activity Sheet Modal ("Sparky en Papel") */}
      <Modal visible={printModalVisible} animationType="slide" transparent onRequestClose={() => setPrintModalVisible(false)}>
        <View style={styles.printModalBackdrop}>
          <View style={styles.printModalCard}>
            <View style={styles.printModalHeader}>
              <View style={styles.printHeaderLeft}>
                <Text style={styles.printHeaderTitle}>
                  📄 {t.printModalTitle}
                </Text>
                <Text style={styles.printHeaderSub}>
                  {t.printModalDesc}
                </Text>
              </View>
              <TouchableOpacity style={styles.printCloseCircle} onPress={() => setPrintModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.printModalBody} contentContainerStyle={styles.printModalContent}>
              <View style={styles.sheetPaperLook}>
                <View style={styles.sheetPaperTop}>
                  <Text style={styles.sheetSchoolName}>SPARKY READING INITIATIVE • UNESCO ERCE</Text>
                  <Text style={styles.sheetDateRow}>
                    `${selectedStudent.name} (${selectedStudent.grade})`
                    {'   •   '}
                    {activeSession ? activeSession.date : new Date().toLocaleDateString()}
                  </Text>
                  <Text style={styles.sheetBookTitle}>📖 {activeSession?.pageTitle}</Text>
                </View>

                {/* Exercise 1: Syllable breakdown */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>
                    {t.printExercise1}
                  </Text>
                  {activeSession?.errors && activeSession.errors.length > 0 ? (
                    activeSession.errors.map((err, eIdx) => (
                      <View key={eIdx} style={styles.sheetWordRow}>
                        <Text style={styles.sheetTargetWord}>• {err.word}</Text>
                        <Text style={styles.sheetSyllableDots}>
                          [ {err.syllables ? err.syllables.join(' - ') : err.word} ]
                        </Text>
                        <Text style={styles.sheetCheckBox}>☐ {t.readSuccessfullyCheckBox}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.sheetWordRow}>• hummingbird [ hum - ming - bird ]  ☐ {t.readSuccessfullyCheckBox}</Text>
                  )}
                </View>

                {/* Exercise 2: Sentence Comprehension */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>
                    {t.printExercise2}
                  </Text>
                  <View style={styles.sheetLinedPaper}>
                    <View style={styles.sheetLine} />
                    <View style={styles.sheetLine} />
                    <View style={styles.sheetLine} />
                  </View>
                </View>

                {/* Exercise 3: Tutor Signature */}
                <View style={styles.sheetSignRow}>
                  <View style={styles.sheetSignCol}>
                    <View style={styles.sheetSignLine} />
                    <Text style={styles.sheetSignText}>
                      {t.printParentSignature}
                    </Text>
                  </View>
                  <View style={styles.sheetSignCol}>
                    <View style={styles.sheetSignLine} />
                    <Text style={styles.sheetSignText}>
                      {t.printTeacherSignature}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.printModalFooter}>
              <TouchableOpacity
                style={styles.printActionBtn}
                onPress={() => {
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    window.print();
                  } else {
                    Alert.alert('Ficha Generada', 'Puedes imprimir esta ficha o compartirla por WhatsApp.');
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="print" size={18} color="#ffffff" />
                <Text style={styles.printActionBtnText}>
                  {t.printActionBtn}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    gap: 14,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 220,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  shareTouch: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  shareButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  studentSharedCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  studentSharedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  studentSharedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 200,
  },
  studentSharedEmoji: {
    fontSize: 22,
  },
  studentSharedTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  studentSharedSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  printOfflinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  printOfflineText: {
    fontSize: 11,
    fontWeight: '800',
  },
  studentsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  studentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  studentEmoji: {
    fontSize: 18,
  },
  studentName: {
    fontSize: 12,
    fontWeight: '800',
  },
  studentGrade: {
    fontSize: 10,
  },
  benchmarkBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 8,
  },
  benchmarkLeft: {
    flex: 1,
    minWidth: 180,
  },
  benchmarkLevel: {
    fontSize: 14,
    fontWeight: '800',
  },
  benchmarkDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  benchmarkTargetChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  benchmarkTargetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiGradientCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  kpiBadgePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  breakdownBox: {
    flex: 1,
    minWidth: 80,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  breakdownNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
    textAlign: 'center',
  },
  deckHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  deckBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  deckBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  emptyDeckBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  emptyDeckEmoji: {
    fontSize: 28,
  },
  emptyDeckTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  emptyDeckSubtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  errorsCardsList: {
    gap: 8,
  },
  errorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorCardLeft: {
    flex: 1,
    minWidth: 160,
    gap: 3,
  },
  errorWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorWordTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  errorTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hesitationTag: {
    backgroundColor: '#fef3c7',
  },
  hesitationTagText: {
    color: '#92400e',
    fontSize: 9,
    fontWeight: '700',
  },
  mispronouncedTag: {
    backgroundColor: '#fee2e2',
  },
  mispronouncedTagText: {
    color: '#991b1b',
    fontSize: 9,
    fontWeight: '700',
  },
  errorTypeTagText: {},
  syllableBreakdown: {
    fontSize: 11,
    color: '#64748b',
  },
  syllableBold: {
    color: '#0f172a',
    fontWeight: '700',
  },
  errorCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listenErrorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  listenErrorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
  },
  explainErrorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  explainErrorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  pedagogicalCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    gap: 6,
  },
  pedagogicalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pedagogicalMascot: {
    fontSize: 20,
  },
  pedagogicalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  pedagogicalSub: {
    fontSize: 10,
    color: '#3b82f6',
  },
  pedagogicalText: {
    fontSize: 11,
    color: '#1e3a8a',
    lineHeight: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 4,
  },
  backButtonText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  printSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  printSheetText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '800',
  },
  studentPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  studentNameTextActive: {
    color: '#ffffff',
  },
  studentGradeTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  studentGradeTagActive: {
    backgroundColor: '#0369a1',
  },
  studentGradeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  studentGradeTextActive: {
    color: '#ffffff',
  },
  printModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  printModalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  printModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  printHeaderLeft: {
    flex: 1,
  },
  printHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  printHeaderSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  printCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printModalBody: {
    flex: 1,
  },
  printModalContent: {
    padding: 16,
  },
  sheetPaperLook: {
    backgroundColor: '#fffdfa',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    padding: 18,
    gap: 16,
  },
  sheetPaperTop: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    gap: 4,
  },
  sheetSchoolName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  sheetDateRow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  sheetBookTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  sheetSection: {
    gap: 8,
  },
  sheetSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  sheetWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 6,
  },
  sheetTargetWord: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetSyllableDots: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  sheetCheckBox: {
    fontSize: 11,
    color: '#64748b',
  },
  sheetLinedPaper: {
    gap: 12,
    paddingVertical: 6,
  },
  sheetLine: {
    height: 1,
    backgroundColor: '#94a3b8',
    borderStyle: 'dashed',
  },
  sheetSignRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sheetSignCol: {
    alignItems: 'center',
    width: 140,
  },
  sheetSignLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#64748b',
    marginBottom: 6,
  },
  sheetSignText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  printModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  printActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomWidth: 3,
    borderBottomColor: '#059669',
  },
  printActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  spokenFeedbackCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    marginVertical: 4,
    gap: 12,
  },
  spokenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  spokenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 160,
  },
  spokenIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spokenTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  spokenMuseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  spokenMuseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366f1',
  },
  spokenActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replayAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  replayAudioText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  refreshFeedbackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  feedbackLoadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedbackBodyText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  museAuditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  museAuditBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366f1',
  },
});

