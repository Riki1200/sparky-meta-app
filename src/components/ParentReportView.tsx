import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReadingSessionResult, SupportedLanguage } from '../types';
import { getReadingHistory, getReadingStats, getUserProfile } from '../services/storageService';
import { speakWordPhonetically, playChime, speakText, stopSpeaking, getSparkyVoiceSample } from '../services/ttsService';
import { generateTutorSpokenFeedback } from '../services/metaApi';
import { getTranslation } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, DISPLAY_FONT } from '../styles/theme';

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
  const styles = useMemo(() => createStyles(theme), [theme]);
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
  const [readerName, setReaderName] = useState<string>(t.defaultReaderName);
  const [printModalVisible, setPrintModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentSession]);

  const loadData = async () => {
    const hist = await getReadingHistory();
    const st = await getReadingStats();
    const profile = await getUserProfile();
    setHistory(hist);
    setStats(st);
    // The stored default name is English; show the localized default instead
    if (profile.name) setReaderName(profile.name);
  };

  // Only real sessions are reported; with none yet the parent sees an empty state
  const activeSession: ReadingSessionResult | null = currentSession || history[0] || null;

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
        color: theme.badges.kpiAccuracyText,
        bg: themeMode === 'dark' ? 'rgba(22, 163, 74, 0.14)' : theme.badges.kpiAccuracyBg,
        note: t.fluencyOptimalDesc,
      };
    }
    if (wpm >= 45) {
      return {
        level: t.fluencyDeveloping,
        color: theme.badges.starBadgeText,
        bg: themeMode === 'dark' ? 'rgba(217, 119, 6, 0.14)' : theme.surfaceSecondary,
        note: t.fluencyDevelopingDesc,
      };
    }
    return {
      level: t.fluencySupport,
      color: theme.primary,
      bg: themeMode === 'dark' ? 'rgba(234, 88, 12, 0.14)' : theme.primaryLight,
      note: t.fluencySupportDesc,
    };
  };

  const handleShareReport = () => {
    if (!activeSession) return;
    const summaryText =
      `${t.reportTitle} - ${t.appName} (Meta AI)\n` +
      `${t.shareReportStory}: ${activeSession.pageTitle}\n` +
      `${t.timeLabel}: ${activeSession.date}\n` +
      `${t.shareReportSpeed}: ${activeSession.wordsPerMinute} WPM\n` +
      `${t.shareReportAccuracy}: ${activeSession.accuracyPercent}%\n` +
      `${t.shareReportWordsRead}: ${activeSession.totalWords}\n` +
      `${t.shareReportPractice}: ${activeSession.errors.map((e) => e.word).join(', ') || t.shareReportPerfect}`;

    playChime('sparkle');
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(summaryText)}`).catch(() => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(summaryText);
        setCopiedAlert(true);
        setTimeout(() => setCopiedAlert(false), 3000);
      } else {
        Alert.alert(t.shareReportBtn, summaryText);
      }
    });
  };

  if (!activeSession) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: theme.bg }]}>
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.headerIconCircle, { backgroundColor: theme.accentLight }]}>
            <Ionicons name="stats-chart" size={20} color={theme.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{t.reportEmptyTitle}</Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>{t.reportEmptyDesc}</Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              playChime('tap');
              onBackToReading();
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="book" size={16} color="#ffffff" />
            <Text style={styles.emptyButtonText}>{t.backToReadingBtn}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const evalInfo = getWpmEvaluation(activeSession.wordsPerMinute);

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
            <View style={[styles.headerIconCircle, { backgroundColor: theme.accentLight }]}>
              <Ionicons name="stats-chart" size={20} color={theme.accent} />
            </View>
            <View style={styles.flexText}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {t.reportTitle}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {activeSession ? `${activeSession.pageTitle} • ${activeSession.gradeLevel}` : t.reportSubtitle}
              </Text>
              {activeSession?.metaMuseTranscript ? (
                <View style={styles.museAuditBadge}>
                  <Ionicons name="sparkles" size={10} color={theme.primary} />
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

      {/* One phone, several readers */}
      <View style={[styles.studentSharedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.studentSharedHeader}>
          <View style={styles.studentSharedLeft}>
            <View style={[styles.headerIconCircle, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="phone-portrait-outline" size={18} color={theme.primary} />
            </View>
            <View style={styles.flexText}>
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
          <View style={[styles.studentPill, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
            <Ionicons name="person-circle" size={24} color={theme.primary} />
            <View>
              <Text style={[styles.studentName, { color: theme.primary }]}>{readerName}</Text>
              <Text style={[styles.studentGrade, { color: theme.textSecondary }]}>{activeSession.gradeLevel}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Reading pace summary */}
      <View style={[styles.benchmarkBanner, { backgroundColor: evalInfo.bg, borderColor: evalInfo.color }]}>
        <View style={styles.benchmarkLeft}>
          <Text style={[styles.benchmarkLevel, { color: evalInfo.color }]}>
            {evalInfo.level}
          </Text>
          <Text style={[styles.benchmarkDesc, { color: theme.textSecondary }]}>
            {activeSession.wordsPerMinute} WPM — {evalInfo.note}
          </Text>
        </View>
      </View>

      {/* Meta Muse Voice re-scoring: second opinion on the device's live score */}
      <View
        style={[
          styles.metaCheckCard,
          {
            backgroundColor: activeSession.metaVerifiedAccuracyPercent != null ? theme.accentLight : theme.surface,
            borderColor: activeSession.metaVerifiedAccuracyPercent != null ? theme.accent : theme.border,
          },
        ]}
      >
        <View style={styles.metaCheckHeader}>
          <Ionicons name="shield-checkmark" size={18} color={theme.accent} />
          <Text style={[styles.metaCheckTitle, { color: theme.text }]}>{t.metaCheckTitle}</Text>
          {activeSession.metaVerifiedAccuracyPercent != null && (
            <Text style={[styles.metaCheckValue, { color: theme.accent }]}>
              {activeSession.metaVerifiedAccuracyPercent}%
            </Text>
          )}
        </View>
        {activeSession.metaVerifiedAccuracyPercent != null ? (
          <>
            <Text style={[styles.metaCheckDesc, { color: theme.textSecondary }]}>
              {t.metaCheckResult
                .replace('{meta}', String(activeSession.metaVerifiedAccuracyPercent))
                .replace('{device}', String(activeSession.accuracyPercent))}
            </Text>
            {activeSession.metaMuseTranscript ? (
              <Text style={[styles.metaCheckTranscript, { color: theme.text }]} numberOfLines={3}>
                {t.metaCheckHeard}: "{activeSession.metaMuseTranscript}"
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={[styles.metaCheckDesc, { color: theme.textSecondary }]}>{t.metaCheckHint}</Text>
        )}
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
            <Ionicons name="speedometer-outline" size={17} color={theme.primary} />
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
            <Ionicons name="checkmark-done-circle-outline" size={17} color={theme.primary} />
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
            <Ionicons name="flame-outline" size={17} color={theme.primary} />
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
            <Ionicons name="book-outline" size={17} color={theme.primary} />
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
          <View style={[styles.breakdownBox, { backgroundColor: theme.words.correctBg, borderColor: theme.words.correctBorder }]}>
            <Text style={[styles.breakdownNumber, { color: theme.words.correctText }]}>
              {activeSession.correctWords}
            </Text>
            <Text style={styles.breakdownLabel}>{t.legendCorrect}</Text>
          </View>

          <View style={[styles.breakdownBox, { backgroundColor: theme.words.hesitationBg, borderColor: theme.words.hesitationBorder }]}>
            <Text style={[styles.breakdownNumber, { color: theme.words.hesitationText }]}>
              {activeSession.hesitationWords}
            </Text>
            <Text style={styles.breakdownLabel}>{t.legendHesitation}</Text>
          </View>

          <View style={[styles.breakdownBox, { backgroundColor: theme.words.mispronouncedBg, borderColor: theme.words.mispronouncedBorder }]}>
            <Text style={[styles.breakdownNumber, { color: theme.words.mispronouncedText }]}>
              {activeSession.mispronouncedWords}
            </Text>
            <Text style={styles.breakdownLabel}>{t.legendMispronounced}</Text>
          </View>

          <View style={[styles.breakdownBox, { backgroundColor: theme.accentLight, borderColor: theme.accent }]}>
            <Text style={[styles.breakdownNumber, { color: theme.accent }]}>
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
            backgroundColor: theme.surfaceSecondary,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.spokenHeaderRow}>
          <View style={styles.spokenHeaderLeft}>
            <View style={styles.spokenIconCircle}>
              <Ionicons name="chatbubble-ellipses" size={18} color={theme.primary} />
            </View>
            <View>
              <Text
                style={[
                  styles.spokenTitle,
                  { color: theme.primary },
                ]}
              >
                {t.spokenFeedbackTitle}
              </Text>
              <View style={styles.spokenMuseBadge}>
                <Ionicons name="sparkles" size={10} color={theme.primary} />
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
                { backgroundColor: isPlayingAudio ? theme.gradients.btnMicListening[0] : theme.primary },
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
                    theme.surfaceSecondary,
                },
              ]}
              onPress={handleRefreshFeedback}
              disabled={loadingFeedback}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {loadingFeedback ? (
          <View style={styles.feedbackLoadingBox}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text
              style={[
                styles.feedbackLoadingText,
                { color: theme.primary },
              ]}
            >
              {t.generatingCheer}
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.feedbackBodyText,
              { color: theme.text },
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
            <Ionicons name="star" size={36} color={theme.badges.starBadgeText} style={styles.emptyDeckIcon} />
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
                      <Ionicons name="volume-high" size={15} color={theme.primary} />
                      <Text style={styles.listenErrorBtnText}>
                        {t.listenWordBtn}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.explainErrorBtn}
                      onPress={() => onOpenWordExplainer(err.word, activeSession.pageTitle)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="sparkles" size={14} color={theme.primary} />
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

      {/* Practice tip */}
      <View style={styles.pedagogicalCard}>
        <View style={styles.pedagogicalHeaderRow}>
          <Ionicons name="bulb" size={24} color={theme.badges.starBadgeText} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pedagogicalTitle}>
              {t.parentPedagogicalTipTitle}
            </Text>
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
        <Ionicons name="arrow-back" size={16} color={theme.text} />
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
                  {t.printModalTitle}
                </Text>
                <Text style={styles.printHeaderSub}>
                  {t.printModalDesc}
                </Text>
              </View>
              <TouchableOpacity style={styles.printCloseCircle} onPress={() => setPrintModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.printModalBody} contentContainerStyle={styles.printModalContent}>
              <View style={styles.sheetPaperLook}>
                <View style={styles.sheetPaperTop}>
                  <Text style={styles.sheetSchoolName}>SPARKY READING PRACTICE</Text>
                  <Text style={styles.sheetDateRow}>
                    {`${readerName} (${activeSession.gradeLevel})`}
                    {'   •   '}
                    {activeSession ? activeSession.date : new Date().toLocaleDateString()}
                  </Text>
                  <Text style={styles.sheetBookTitle}>{activeSession?.pageTitle}</Text>
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
                        <View style={styles.sheetCheckRow}>
                          <View style={styles.sheetCheckSquare} />
                          <Text style={styles.sheetCheckBox}>{t.readSuccessfullyCheckBox}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.sheetWordRow}>
                      <Text style={styles.sheetTargetWord}>• hummingbird</Text>
                      <Text style={styles.sheetSyllableDots}>[ hum - ming - bird ]</Text>
                      <View style={styles.sheetCheckRow}>
                        <View style={styles.sheetCheckSquare} />
                        <Text style={styles.sheetCheckBox}>{t.readSuccessfullyCheckBox}</Text>
                      </View>
                    </View>
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

// Styles read storybook theme tokens, so light and night mode share one definition
const createStyles = (theme: ThemeColors) => {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surfaceSecondary,
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
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
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
  headerTitle: {
    ...DISPLAY_FONT,
    fontSize: 16,
    fontWeight: '900',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  shareTouch: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.badges.kpiAccuracyText,
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
    borderColor: theme.border,
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
    color: theme.textSecondary,
    marginTop: 1,
  },
  metaCheckCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
  },
  metaCheckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaCheckTitle: {
    ...DISPLAY_FONT,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  metaCheckValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  metaCheckDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  metaCheckTranscript: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  emptyContainer: {
    justifyContent: 'center',
    padding: 20,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  emptyTitle: {
    ...DISPLAY_FONT,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 6,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text,
  },
  kpiLabel: {
    fontSize: 11,
    color: theme.textSecondary,
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
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 10,
  },
  sectionTitle: {
    ...DISPLAY_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: theme.textSecondary,
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
    color: theme.textSecondary,
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
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  deckBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
  },
  emptyDeckBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  emptyDeckIcon: {
    marginBottom: 4,
  },
  emptyDeckTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.badges.kpiAccuracyText,
  },
  emptyDeckSubtitle: {
    fontSize: 11,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  errorsCardsList: {
    gap: 8,
  },
  errorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.border,
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
    ...DISPLAY_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    textTransform: 'capitalize',
  },
  errorTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hesitationTag: {
    backgroundColor: theme.surfaceSecondary,
  },
  hesitationTagText: {
    color: theme.text,
    fontSize: 9,
    fontWeight: '700',
  },
  mispronouncedTag: {
    backgroundColor: theme.words.mispronouncedBg,
  },
  mispronouncedTagText: {
    color: theme.text,
    fontSize: 9,
    fontWeight: '700',
  },
  errorTypeTagText: {},
  syllableBreakdown: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  syllableBold: {
    color: theme.text,
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
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  listenErrorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
  },
  explainErrorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  explainErrorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
  },
  pedagogicalCard: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: theme.border,
    gap: 6,
  },
  pedagogicalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pedagogicalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.text,
  },
  pedagogicalText: {
    fontSize: 11,
    color: theme.text,
    lineHeight: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.surface,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 4,
  },
  backButtonText: {
    color: theme.text,
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
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  printSheetText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '800',
  },
  studentPillActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  studentNameTextActive: {
    color: '#ffffff',
  },
  studentGradeTag: {
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  studentGradeTagActive: {
    backgroundColor: theme.primary,
  },
  studentGradeText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.textSecondary,
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
    borderBottomColor: theme.surfaceSecondary,
  },
  printHeaderLeft: {
    flex: 1,
  },
  printHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.text,
  },
  printHeaderSub: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  printCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.surfaceSecondary,
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
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    padding: 18,
    gap: 16,
  },
  sheetPaperTop: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 12,
    gap: 4,
  },
  sheetSchoolName: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textSecondary,
    letterSpacing: 1,
  },
  sheetDateRow: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
  sheetBookTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.text,
  },
  sheetSection: {
    gap: 8,
  },
  sheetSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.text,
  },
  sheetWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    flexWrap: 'wrap',
    gap: 6,
  },
  sheetTargetWord: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.text,
  },
  sheetSyllableDots: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
  },
  flexText: {
    flex: 1,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetCheckSquare: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: theme.text,
    borderRadius: 3,
  },
  sheetCheckBox: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  sheetLinedPaper: {
    gap: 12,
    paddingVertical: 6,
  },
  sheetLine: {
    height: 1,
    backgroundColor: theme.textMuted,
    borderStyle: 'dashed',
  },
  sheetSignRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  sheetSignCol: {
    alignItems: 'center',
    width: 140,
  },
  sheetSignLine: {
    width: '100%',
    height: 1,
    backgroundColor: theme.textSecondary,
    marginBottom: 6,
  },
  sheetSignText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  printModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.surfaceSecondary,
    backgroundColor: theme.surfaceSecondary,
  },
  printActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.badges.kpiAccuracyText,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomWidth: 3,
    borderBottomColor: theme.badges.kpiAccuracyText,
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
    color: theme.primary,
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
    color: theme.primary,
  },
});
};
