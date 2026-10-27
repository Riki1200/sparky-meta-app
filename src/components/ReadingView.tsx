import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookPage, WordToken, ReadingSessionResult, ReadingErrorDetail, SupportedLanguage } from '../types';
import {
  SpeechRecognitionController,
  matchSpokenWordToTokens,
} from '../services/speechService';
import { speakText, playChime } from '../services/ttsService';
import { saveReadingSession } from '../services/storageService';
import { getTranslation } from '../i18n/translations';

interface ReadingViewProps {
  page: BookPage;
  language: SupportedLanguage;
  onOpenWordExplainer: (word: string, contextSentence: string) => void;
  onPageCompleted: (result: ReadingSessionResult) => void;
  onOpenScan: () => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  page,
  language,
  onOpenWordExplainer,
  onPageCompleted,
  onOpenScan,
}) => {
  const t = getTranslation(language);

  const [tokens, setTokens] = useState<WordToken[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [errorsList, setErrorsList] = useState<ReadingErrorDetail[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [recentSpokenText, setRecentSpokenText] = useState<string>('');

  const speechControllerRef = useRef<SpeechRecognitionController | null>(null);
  const lastWordTimestampRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);
  const simulationTimerRef = useRef<any>(null);

  // Initialize tokens when page changes
  useEffect(() => {
    resetPageReading();
  }, [page]);

  // Setup speech controller
  useEffect(() => {
    speechControllerRef.current = new SpeechRecognitionController(language);

    speechControllerRef.current.onWordSpoken = (spokenText, isFinal) => {
      setRecentSpokenText(spokenText);
      handleSpeechInput(spokenText);
    };

    speechControllerRef.current.onEnd = () => {
      if (isListening) {
        setIsListening(false);
      }
    };

    return () => {
      if (speechControllerRef.current) {
        speechControllerRef.current.stopListening();
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    };
  }, [language]);

  const resetPageReading = () => {
    if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    setIsSimulating(false);
    setIsListening(false);
    if (speechControllerRef.current) speechControllerRef.current.stopListening();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const freshTokens = page.words.map((w, idx) => ({
      ...w,
      status: (idx === 0 ? 'current' : 'pending') as any,
    }));
    setTokens(freshTokens);
    setCurrentIndex(0);
    setStartTime(null);
    setElapsedSeconds(0);
    setWpm(0);
    setErrorsList([]);
    setRecentSpokenText('');
    lastWordTimestampRef.current = Date.now();
  };

  const startReadingSession = () => {
    if (!startTime) {
      setStartTime(Date.now());
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          return next;
        });
      }, 1000);
    }

    lastWordTimestampRef.current = Date.now();
    setIsListening(true);
    speechControllerRef.current?.startListening();
    playChime('tap');
  };

  const stopReadingSession = () => {
    setIsListening(false);
    speechControllerRef.current?.stopListening();
  };

  // Process live speech inputs
  const handleSpeechInput = (spokenPhrase: string) => {
    if (currentIndex >= tokens.length) return;

    const now = Date.now();
    const timeDelta = now - lastWordTimestampRef.current;

    const result = matchSpokenWordToTokens(
      spokenPhrase,
      tokens,
      currentIndex,
      language,
      timeDelta
    );

    if (result.nextIndex !== currentIndex) {
      lastWordTimestampRef.current = now;
      setCurrentIndex(result.nextIndex);
      setTokens(result.updatedTokens);

      if (result.error) {
        setErrorsList((prev) => [...prev, result.error!]);
      }

      // Check if page finished
      if (result.nextIndex >= tokens.length) {
        finishReadingSession(result.updatedTokens, [
          ...errorsList,
          ...(result.error ? [result.error] : []),
        ]);
      }
    }
  };

  // Recalculate WPM
  useEffect(() => {
    if (elapsedSeconds > 2 && currentIndex > 0) {
      const calculatedWpm = Math.round((currentIndex / elapsedSeconds) * 60);
      setWpm(calculatedWpm);
    }
  }, [elapsedSeconds, currentIndex]);

  const finishReadingSession = async (
    finalTokens: WordToken[],
    finalErrors: ReadingErrorDetail[]
  ) => {
    stopReadingSession();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    playChime('complete');

    const totalWords = finalTokens.length;
    const correctCount = finalTokens.filter((t) => t.status === 'correct').length;
    const hesitationCount = finalTokens.filter((t) => t.status === 'hesitation').length;
    const mispronouncedCount = finalTokens.filter((t) => t.status === 'mispronounced').length;
    const skippedCount = finalTokens.filter((t) => t.status === 'skipped').length;

    const finalAccuracy = Math.round(((correctCount + hesitationCount * 0.7) / totalWords) * 100) || 100;
    const finalDuration = isSimulating ? Math.max(Math.round(totalWords * 0.9), 28) : Math.max(elapsedSeconds, 5);
    const finalWpm = Math.round((totalWords / finalDuration) * 60);

    const sessionResult: ReadingSessionResult = {
      id: `session_${Date.now()}`,
      pageId: page.id,
      pageTitle: page.title,
      bookSource: page.source,
      language,
      date: new Date().toLocaleDateString(language === 'es' ? 'es-DO' : language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-BR' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      durationSeconds: finalDuration,
      totalWords,
      correctWords: correctCount,
      hesitationWords: hesitationCount,
      mispronouncedWords: mispronouncedCount,
      skippedWords: skippedCount,
      accuracyPercent: Math.min(100, Math.max(0, finalAccuracy)),
      wordsPerMinute: finalWpm,
      errors: finalErrors,
      gradeLevel: page.gradeLevel,
    };

    await saveReadingSession(sessionResult);
    onPageCompleted(sessionResult);
  };

  /**
   * Interactive Simulator:
   * Demonstrates the real-time AI read-along with correct, hesitation, and mispronounced detection.
   */
  const handleSimulateChildReading = () => {
    if (isSimulating) {
      if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
      setIsSimulating(false);
      return;
    }

    resetPageReading();
    setIsSimulating(true);
    setStartTime(Date.now());
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    let simIndex = 0;
    const allTokens = [...page.words];
    const simulatedErrors: ReadingErrorDetail[] = [];

    const stepSimulation = () => {
      if (simIndex >= allTokens.length) {
        setIsSimulating(false);
        finishReadingSession(allTokens, simulatedErrors);
        return;
      }

      const currentWord = allTokens[simIndex].word;
      let delay = 650; // comfortable child pace

      // Inject 1 hesitation at word index 2 or 3
      if (simIndex === 2 && allTokens.length > 4) {
        delay = 2100; // >1.8s hesitation pause
        allTokens[simIndex] = {
          ...allTokens[simIndex],
          status: 'hesitation',
          hesitationMs: 2100,
        };
        simulatedErrors.push({
          word: currentWord,
          display: allTokens[simIndex].display,
          errorType: 'hesitation',
          hesitationSeconds: 2.1,
          syllables: allTokens[simIndex].syllables,
        });
        playChime('tap');
      }
      // Inject 1 mispronunciation at word index 5
      else if (simIndex === 5 && allTokens.length > 6) {
        allTokens[simIndex] = {
          ...allTokens[simIndex],
          status: 'mispronounced',
          spokenWord: currentWord.slice(0, -2) + 'ando',
        };
        simulatedErrors.push({
          word: currentWord,
          display: allTokens[simIndex].display,
          spokenWord: currentWord.slice(0, -2) + 'ando',
          errorType: 'mispronounced',
          syllables: allTokens[simIndex].syllables,
        });
        playChime('tap');
      }
      // Standard correct word
      else {
        allTokens[simIndex] = {
          ...allTokens[simIndex],
          status: 'correct',
        };
        playChime('correct');
      }

      simIndex += 1;
      setCurrentIndex(simIndex);
      setTokens([...allTokens]);

      simulationTimerRef.current = setTimeout(stepSimulation, delay);
    };

    simulationTimerRef.current = setTimeout(stepSimulation, 800);
  };

  const handleWordTap = (token: WordToken) => {
    // Speak word aloud
    speakText(token.word, language, 0.85);
    // Open Sparky explainer
    onOpenWordExplainer(token.word, page.text);
  };

  // Calculate live stats
  const correctCount = tokens.filter((t) => t.status === 'correct').length;
  const currentAccuracy =
    currentIndex > 0
      ? Math.round((correctCount / currentIndex) * 100)
      : 100;

  return (
    <View style={styles.container}>
      {/* Top Book Header & Live HUD */}
      <View style={styles.hudCard}>
        <View style={styles.hudTopRow}>
          <View style={styles.bookMeta}>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeBadgeText}>{page.gradeLevel}</Text>
            </View>
            <Text style={styles.pageTitle} numberOfLines={1}>
              {page.title}
            </Text>
            <Text style={styles.pageSource} numberOfLines={1}>
              {page.source}
            </Text>
          </View>

          <TouchableOpacity style={styles.scanPageIconBtn} onPress={onOpenScan}>
            <Ionicons name="camera-outline" size={18} color="#ea580c" />
            <Text style={styles.scanPageIconText}>{t.navScan}</Text>
          </TouchableOpacity>
        </View>

        {/* Live Gauges */}
        <View style={styles.gaugesRow}>
          <View style={styles.gaugeItem}>
            <Ionicons name="speedometer-outline" size={16} color="#0284c7" />
            <Text style={styles.gaugeValue}>{wpm || '--'}</Text>
            <Text style={styles.gaugeLabel}>{t.speedWpm}</Text>
          </View>

          <View style={styles.gaugeDivider} />

          <View style={styles.gaugeItem}>
            <Ionicons name="checkmark-done-circle-outline" size={16} color="#16a34a" />
            <Text style={styles.gaugeValue}>{currentAccuracy}%</Text>
            <Text style={styles.gaugeLabel}>{t.accuracyLabel}</Text>
          </View>

          <View style={styles.gaugeDivider} />

          <View style={styles.gaugeItem}>
            <Ionicons name="time-outline" size={16} color="#ea580c" />
            <Text style={styles.gaugeValue}>{elapsedSeconds}s</Text>
            <Text style={styles.gaugeLabel}>{t.timeLabel}</Text>
          </View>

          <View style={styles.gaugeDivider} />

          <View style={styles.gaugeItem}>
            <Ionicons name="book-outline" size={16} color="#7c3aed" />
            <Text style={styles.gaugeValue}>
              {currentIndex}/{tokens.length}
            </Text>
            <Text style={styles.gaugeLabel}>{t.wordsRead}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${tokens.length > 0 ? (currentIndex / tokens.length) * 100 : 0}%` },
            ]}
          />
        </View>
      </View>

      {/* Main Reading Paper Surface */}
      <ScrollView
        style={styles.paperScrollView}
        contentContainerStyle={styles.paperScrollContent}
      >
        <View style={styles.paperCard}>
          {/* Subtle Book Binding Header */}
          <View style={styles.paperHeader}>
            <View style={styles.paperBookmark}>
              <Text style={styles.paperBookmarkText}>📖 {t.readAloudPrompt}</Text>
            </View>
            <Text style={styles.tapTip}>{t.readingTapHint}</Text>
          </View>

          {/* Tokens Flow */}
          <View style={styles.tokensContainer}>
            {tokens.map((token, idx) => {
              const isCurrent = idx === currentIndex && (isListening || isSimulating);
              const isCorrect = token.status === 'correct';
              const isHesitation = token.status === 'hesitation';
              const isMispronounced = token.status === 'mispronounced';
              const isSkipped = token.status === 'skipped';

              return (
                <View key={token.id || idx} style={styles.tokenWrapper}>
                  {/* Floating Mascot Spark above Current Word */}
                  {isCurrent && (
                    <View style={styles.currentSparkIndicator}>
                      <Text style={styles.sparkEmoji}>✨</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.wordButton,
                      isCurrent && styles.wordCurrent,
                      isCorrect && styles.wordCorrect,
                      isHesitation && styles.wordHesitation,
                      isMispronounced && styles.wordMispronounced,
                      isSkipped && styles.wordSkipped,
                    ]}
                    onPress={() => handleWordTap(token)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.wordText,
                        isCorrect && styles.wordTextCorrect,
                        isHesitation && styles.wordTextHesitation,
                        isMispronounced && styles.wordTextMispronounced,
                        isSkipped && styles.wordTextSkipped,
                        isCurrent && styles.wordTextCurrent,
                      ]}
                    >
                      {token.display}
                    </Text>

                    {/* Status Badge Tag for Child & Parent clarity */}
                    {isHesitation && (
                      <View style={styles.miniHesitationTag}>
                        <Text style={styles.miniTagText}>⏳</Text>
                      </View>
                    )}
                    {isMispronounced && (
                      <View style={styles.miniMispronouncedTag}>
                        <Text style={styles.miniTagText}>⚠️</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Legend Guide */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>{t.legendCorrect}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>{t.legendHesitation}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f43f5e' }]} />
              <Text style={styles.legendText}>{t.legendMispronounced}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#818cf8' }]} />
              <Text style={styles.legendText}>{t.legendSkipped}</Text>
            </View>
          </View>
        </View>

        {/* Live speech feedback pill */}
        {recentSpokenText ? (
          <View style={styles.liveTranscriptPill}>
            <Ionicons name="mic" size={14} color="#ea580c" />
            <Text style={styles.liveTranscriptText} numberOfLines={1}>
              {language === 'es' ? 'Escuchado: ' : language === 'fr' ? 'Entendu : ' : language === 'pt' ? 'Ouvido: ' : 'Heard: '}"{recentSpokenText}"
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom Sticky Control Dock */}
      <View style={styles.controlsDock}>
        {/* Restart Button */}
        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={resetPageReading}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color="#64748b" />
        </TouchableOpacity>

        {/* Big Mic / Read Along Button */}
        <TouchableOpacity
          style={[
            styles.micButton,
            (isListening || isSimulating) && styles.micButtonListening,
          ]}
          onPress={() => {
            if (isListening || isSimulating) {
              stopReadingSession();
              if (isSimulating) setIsSimulating(false);
            } else {
              startReadingSession();
            }
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isListening || isSimulating ? 'mic' : 'mic-outline'}
            size={28}
            color="#ffffff"
          />
          <Text style={styles.micButtonText}>
            {isListening || isSimulating
              ? t.stopReadingBtn
              : t.startReadingBtn}
          </Text>
        </TouchableOpacity>

        {/* Simulation / Hackathon Demo Button */}
        <TouchableOpacity
          style={[
            styles.simButton,
            isSimulating && styles.simButtonActive,
          ]}
          onPress={handleSimulateChildReading}
          activeOpacity={0.7}
        >
          <Ionicons
            name="play-forward"
            size={18}
            color={isSimulating ? '#ffffff' : '#ea580c'}
          />
          <Text
            style={[
              styles.simButtonText,
              isSimulating && styles.simButtonTextActive,
            ]}
          >
            {isSimulating ? 'Pause' : t.simulateDemoBtn}
          </Text>
        </TouchableOpacity>

        {/* Finish & Evaluate Button */}
        <TouchableOpacity
          style={styles.finishBtn}
          onPress={() => finishReadingSession(tokens, errorsList)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-done" size={20} color="#ffffff" />
          <Text style={styles.finishBtnText}>
            {t.tabFeedback}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  hudCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  hudTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookMeta: {
    flex: 1,
    marginRight: 10,
  },
  gradeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 3,
  },
  gradeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#c2410c',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  pageSource: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  scanPageIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  scanPageIconText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
  },
  gaugesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  gaugeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gaugeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  gaugeLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  gaugeDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#cbd5e1',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ea580c',
    borderRadius: 3,
  },
  paperScrollView: {
    flex: 1,
  },
  paperScrollContent: {
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  paperCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  paperBookmark: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paperBookmarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  tapTip: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  tokensContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    lineHeight: 44,
  },
  tokenWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  currentSparkIndicator: {
    position: 'absolute',
    top: -22,
    alignSelf: 'center',
    zIndex: 10,
  },
  sparkEmoji: {
    fontSize: 18,
  },
  wordButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wordText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  wordCurrent: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  wordTextCurrent: {
    color: '#78350f',
    fontWeight: '800',
  },
  wordCorrect: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  wordTextCorrect: {
    color: '#065f46',
    fontWeight: '700',
  },
  wordHesitation: {
    backgroundColor: '#fefce8',
    borderColor: '#fef08a',
  },
  wordTextHesitation: {
    color: '#854d0e',
    fontWeight: '700',
  },
  wordMispronounced: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  wordTextMispronounced: {
    color: '#9f1239',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  wordSkipped: {
    backgroundColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    borderStyle: 'dashed',
  },
  wordTextSkipped: {
    color: '#5b21b6',
    opacity: 0.7,
  },
  miniHesitationTag: {
    backgroundColor: '#fde047',
    borderRadius: 6,
    paddingHorizontal: 3,
  },
  miniMispronouncedTag: {
    backgroundColor: '#fca5a5',
    borderRadius: 6,
    paddingHorizontal: 3,
  },
  miniTagText: {
    fontSize: 9,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  liveTranscriptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  liveTranscriptText: {
    fontSize: 12,
    color: '#9a3412',
    fontStyle: 'italic',
  },
  controlsDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ea580c',
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  micButtonListening: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  micButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ed',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  simButtonActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  simButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c2410c',
  },
  simButtonTextActive: {
    color: '#ffffff',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  finishBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
