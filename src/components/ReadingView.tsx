import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookPage, WordToken, ReadingSessionResult, ReadingErrorDetail, SupportedLanguage } from '../types';
import {
  SpeechRecognitionController,
  matchSpokenWordToTokens,
} from '../services/speechService';
import { speakText, playChime } from '../services/ttsService';
import { saveReadingSession, addStars } from '../services/storageService';
import { getTranslation } from '../i18n/translations';
import { SparkyMascot } from './SparkyMascot';
import { CelebrationConfetti } from './CelebrationConfetti';

interface ReadingViewProps {
  page: BookPage;
  language: SupportedLanguage;
  onOpenWordExplainer: (word: string, contextSentence: string) => void;
  onPageCompleted: (result: ReadingSessionResult) => void;
  onOpenScan: () => void;
  onStarsEarned?: (newTotal: number) => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  page,
  language,
  onOpenWordExplainer,
  onPageCompleted,
  onOpenScan,
  onStarsEarned,
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
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const speechControllerRef = useRef<SpeechRecognitionController | null>(null);
  const lastWordTimestampRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);
  const simulationTimerRef = useRef<any>(null);

  useEffect(() => {
    resetPageReading();
  }, [page]);

  useEffect(() => {
    speechControllerRef.current = new SpeechRecognitionController(language);

    speechControllerRef.current.onWordSpoken = (spokenText) => {
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
    setShowConfetti(false);
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
        setElapsedSeconds((prev) => prev + 1);
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

      if (result.nextIndex >= tokens.length) {
        finishReadingSession(result.updatedTokens, [
          ...errorsList,
          ...(result.error ? [result.error] : []),
        ]);
      }
    }
  };

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
    setShowConfetti(true);

    const totalWords = finalTokens.length;
    const correctCount = finalTokens.filter((t) => t.status === 'correct').length;
    const hesitationCount = finalTokens.filter((t) => t.status === 'hesitation').length;
    const mispronouncedCount = finalTokens.filter((t) => t.status === 'mispronounced').length;
    const skippedCount = finalTokens.filter((t) => t.status === 'skipped').length;

    const finalAccuracy =
      totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 100;
    const finalWpm =
      elapsedSeconds > 2 ? Math.round((totalWords / elapsedSeconds) * 60) : 68;

    const sessionResult: ReadingSessionResult = {
      id: `session_${Date.now()}`,
      pageId: page.id,
      pageTitle: page.title,
      bookSource: page.source,
      language,
      date: new Date().toLocaleDateString(language === 'es' ? 'es-DO' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      durationSeconds: Math.max(1, elapsedSeconds),
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
    const newStars = await addStars(10);
    if (onStarsEarned) onStarsEarned(newStars);

    setTimeout(() => {
      onPageCompleted(sessionResult);
    }, 1400);
  };

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
      let delay = 650;

      if (simIndex === 2 && allTokens.length > 4) {
        delay = 2100;
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
      } else if (simIndex === 5 && allTokens.length > 6) {
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
      } else {
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
    speakText(token.word, language, 0.85);
    onOpenWordExplainer(token.word, page.text);
  };

  const correctCount = tokens.filter((t) => t.status === 'correct').length;
  const currentAccuracy =
    currentIndex > 0 ? Math.round((correctCount / currentIndex) * 100) : 100;

  const getMascotMood = () => {
    if (showConfetti) return 'celebrating';
    if (isListening || isSimulating) return 'listening';
    return 'idle';
  };

  const getMascotPrompt = () => {
    if (showConfetti) {
      return language === 'es'
        ? '¡Excelente lectura! ¡Ganaste 10 estrellas! ⭐🎉'
        : 'Incredible reading! You earned 10 stars! ⭐🎉';
    }
    if (isListening || isSimulating) {
      return language === 'es'
        ? '¡Te escucho! Lee con voz clara y tranquila... 🎧'
        : 'I am listening! Read aloud with confidence... 🎧';
    }
    return language === 'es'
      ? "Toca cualquier palabra para escucharla o pulsa 'Leer en Voz Alta' 📖"
      : "Tap any word to hear it or tap 'Read Aloud' 📖";
  };

  const progressPercent = tokens.length > 0 ? (currentIndex / tokens.length) * 100 : 0;

  return (
    <View style={styles.container}>
      <CelebrationConfetti active={showConfetti} />

      {/* Modern Compact Live HUD Bar (Only 38px, zero vertical waste) */}
      <View style={styles.miniHudBar}>
        <View style={styles.hudLeft}>
          <Text style={styles.hudCountText}>
            {currentIndex}/{tokens.length} {language === 'es' ? 'palabras' : 'words'}
          </Text>
          <View style={styles.hudProgressTrack}>
            <View style={[styles.hudProgressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        <View style={styles.hudRight}>
          <View style={styles.hudStatPillBlue}>
            <Ionicons name="speedometer-outline" size={12} color="#0284c7" />
            <Text style={styles.hudStatTextBlue}>{wpm || '--'} WPM</Text>
          </View>
          <View style={styles.hudStatPillGreen}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#059669" />
            <Text style={styles.hudStatTextGreen}>{currentAccuracy}%</Text>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sparky Friendly Tutor Banner */}
        <View style={styles.mascotRow}>
          <SparkyMascot
            size="small"
            mood={getMascotMood()}
            speechBubbleText={getMascotPrompt()}
            language={language}
          />
        </View>

        {/* Elevated Tactile Reading Paper Board */}
        <View style={styles.paperCard}>
          <View style={styles.tokensContainer}>
            {tokens.map((token, idx) => {
              const isCurrent = idx === currentIndex && (isListening || isSimulating);
              const isCorrect = token.status === 'correct';
              const isHesitation = token.status === 'hesitation';
              const isMispronounced = token.status === 'mispronounced';
              const isSkipped = token.status === 'skipped';

              return (
                <View key={token.id || idx} style={styles.tokenWrapper}>
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

                    {isHesitation && (
                      <View style={styles.miniTagHesitation}>
                        <Text style={styles.miniTagText}>⏳</Text>
                      </View>
                    )}
                    {isMispronounced && (
                      <View style={styles.miniTagMispronounced}>
                        <Text style={styles.miniTagText}>👂</Text>
                      </View>
                    )}
                    {isCorrect && (
                      <View style={styles.miniTagCorrect}>
                        <Text style={styles.miniTagText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Discreet Color Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendLabel}>{t.legendCorrect}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendLabel}>{t.legendHesitation}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f43f5e' }]} />
              <Text style={styles.legendLabel}>{t.legendMispronounced}</Text>
            </View>
          </View>
        </View>

        {/* Live speech heard transcript pill */}
        {recentSpokenText ? (
          <View style={styles.liveTranscriptBox}>
            <Ionicons name="mic" size={14} color="#ea580c" />
            <Text style={styles.liveTranscriptLabel}>
              {language === 'es' ? 'Escuchado: ' : 'Heard: '}
            </Text>
            <Text style={styles.liveTranscriptPhrase} numberOfLines={1}>
              "{recentSpokenText}"
            </Text>
          </View>
        ) : null}

        {/* Spacing for floating dock */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Modern Floating Action Dock */}
      <View style={styles.floatingDock}>
        {/* Reset / Restart */}
        <TouchableOpacity
          style={styles.dockIconCircle}
          onPress={() => {
            playChime('tap');
            resetPageReading();
          }}
          activeOpacity={0.7}
          accessibilityLabel="Reset reading page"
        >
          <Ionicons name="refresh" size={20} color="#64748b" />
        </TouchableOpacity>

        {/* Hero Mic Read-Aloud Button */}
        <TouchableOpacity
          style={[
            styles.heroMicButton,
            (isListening || isSimulating) && styles.heroMicButtonActive,
          ]}
          onPress={() => {
            if (isListening || isSimulating) {
              stopReadingSession();
              if (isSimulating) setIsSimulating(false);
            } else {
              startReadingSession();
            }
          }}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isListening || isSimulating ? 'stop-circle' : 'mic'}
            size={22}
            color="#ffffff"
          />
          <Text style={styles.heroMicText}>
            {isListening || isSimulating
              ? (language === 'es' ? 'Pausar' : 'Stop')
              : (language === 'es' ? 'Leer en Voz Alta' : 'Read Aloud')}
          </Text>
        </TouchableOpacity>

        {/* 1-Click Simulation Demo */}
        <TouchableOpacity
          style={[
            styles.dockSimButton,
            isSimulating && styles.dockSimButtonActive,
          ]}
          onPress={handleSimulateChildReading}
          activeOpacity={0.75}
        >
          <Ionicons
            name={isSimulating ? 'pause' : 'play-forward'}
            size={16}
            color={isSimulating ? '#ffffff' : '#ea580c'}
          />
          <Text
            style={[
              styles.dockSimText,
              isSimulating && styles.dockSimTextActive,
            ]}
          >
            {isSimulating ? 'Pausa' : 'Simular'}
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
    position: 'relative',
  },
  miniHudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    maxWidth: 240,
  },
  hudCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  hudProgressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  hudProgressFill: {
    height: '100%',
    backgroundColor: '#ea580c',
    borderRadius: 3,
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudStatPillBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  hudStatTextBlue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369a1',
  },
  hudStatPillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  hudStatTextGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  mascotRow: {
    marginVertical: 2,
  },
  paperCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tokensContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    lineHeight: 46,
    paddingVertical: 6,
  },
  tokenWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  currentSparkIndicator: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    zIndex: 10,
  },
  sparkEmoji: {
    fontSize: 16,
  },
  wordButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wordText: {
    fontSize: 23,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  wordCurrent: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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
  miniTagHesitation: {
    backgroundColor: '#fde047',
    borderRadius: 5,
    paddingHorizontal: 3,
  },
  miniTagMispronounced: {
    backgroundColor: '#fca5a5',
    borderRadius: 5,
    paddingHorizontal: 3,
  },
  miniTagCorrect: {
    backgroundColor: '#86efac',
    borderRadius: 5,
    paddingHorizontal: 3,
  },
  miniTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  liveTranscriptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
    alignSelf: 'center',
  },
  liveTranscriptLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
  },
  liveTranscriptPhrase: {
    fontSize: 11,
    color: '#9a3412',
    fontStyle: 'italic',
    maxWidth: 240,
  },
  floatingDock: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(16px)',
        }
      : {}),
  },
  dockIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ea580c',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 25,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  heroMicButtonActive: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  heroMicText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  dockSimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff7ed',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  dockSimButtonActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  dockSimText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ea580c',
  },
  dockSimTextActive: {
    color: '#ffffff',
  },
});
