import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
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
    setShowConfetti(true);

    const totalWords = finalTokens.length;
    const correctCount = finalTokens.filter((t) => t.status === 'correct').length;
    const hesitationCount = finalTokens.filter((t) => t.status === 'hesitation').length;
    const mispronouncedCount = finalTokens.filter((t) => t.status === 'mispronounced').length;
    const skippedCount = finalTokens.filter((t) => t.status === 'skipped').length;

    const finalAccuracy =
      totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 100;
    const finalWpm =
      elapsedSeconds > 2 ? Math.round((totalWords / elapsedSeconds) * 60) : 65;

    const sessionResult: ReadingSessionResult = {
      id: `session_${Date.now()}`,
      pageId: page.id,
      pageTitle: page.title,
      bookSource: page.source,
      language,
      date: new Date().toLocaleDateString(),
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
    }, 1500);
  };

  /**
   * Interactive Simulator for Hackathon & Demos:
   * Real-time read-along detecting pauses and mispronunciations.
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
    // Speak word aloud phonetically
    speakText(token.word, language, 0.85);
    // Open Meta Muse Spark explainer
    onOpenWordExplainer(token.word, page.text);
  };

  // Calculate live stats
  const correctCount = tokens.filter((t) => t.status === 'correct').length;
  const currentAccuracy =
    currentIndex > 0
      ? Math.round((correctCount / currentIndex) * 100)
      : 100;

  const getMascotMood = () => {
    if (showConfetti) return 'celebrating';
    if (isListening || isSimulating) return 'listening';
    return 'idle';
  };

  const getMascotPrompt = () => {
    if (showConfetti) {
      return language === 'es'
        ? '¡Increíble lectura! ¡Ganaste 10 estrellas! ⭐🎉'
        : language === 'fr'
        ? 'Lecture incroyable ! Tu as gagné 10 étoiles ! ⭐🎉'
        : language === 'pt'
        ? 'Leitura incrível! Você ganhou 10 estrelas! ⭐🎉'
        : 'Incredible reading! You earned 10 stars! ⭐🎉';
    }
    if (isListening || isSimulating) {
      return language === 'es'
        ? '¡Te estoy escuchando! Lee con voz clara... 🎧'
        : language === 'fr'
        ? "Je t'écoute ! Lis bien à voix haute... 🎧"
        : language === 'pt'
        ? 'Estou te ouvindo! Leia com voz clara... 🎧'
        : "I'm listening! Read aloud clearly... 🎧";
    }
    return language === 'es'
      ? '¡Toca cualquier palabra para escucharla o pulsa "Leer en Voz Alta"! 📖'
      : language === 'fr'
      ? 'Touche un mot pour l’écouter ou clique sur "Lire à voix haute" ! 📖'
      : language === 'pt'
      ? 'Toque em uma palavra para ouvi-la ou clique em "Ler em Voz Alta"! 📖'
      : 'Tap any word to hear how it sounds or press "Read Aloud"! 📖';
  };

  const progressPercent = tokens.length > 0 ? (currentIndex / tokens.length) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Celebration Confetti when page is completed */}
      <CelebrationConfetti active={showConfetti} />

      {/* Top Book Header & Live Gauges HUD */}
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

          <TouchableOpacity
            style={styles.scanPageIconBtn}
            onPress={onOpenScan}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={16} color="#ea580c" />
            <Text style={styles.scanPageIconText}>{t.navScan}</Text>
          </TouchableOpacity>
        </View>

        {/* Live Gauges Cards */}
        <View style={styles.gaugesRow}>
          <View style={styles.gaugeItem}>
            <View style={[styles.gaugeIconCircle, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="speedometer" size={15} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.gaugeValue}>{wpm || '--'}</Text>
              <Text style={styles.gaugeLabel}>{t.speedWpm}</Text>
            </View>
          </View>

          <View style={styles.gaugeItem}>
            <View style={[styles.gaugeIconCircle, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="checkmark-circle" size={15} color="#10b981" />
            </View>
            <View>
              <Text style={styles.gaugeValue}>{currentAccuracy}%</Text>
              <Text style={styles.gaugeLabel}>{t.accuracyLabel}</Text>
            </View>
          </View>

          <View style={styles.gaugeItem}>
            <View style={[styles.gaugeIconCircle, { backgroundColor: '#fff7ed' }]}>
              <Ionicons name="time" size={15} color="#ea580c" />
            </View>
            <View>
              <Text style={styles.gaugeValue}>{elapsedSeconds}s</Text>
              <Text style={styles.gaugeLabel}>{t.timeLabel}</Text>
            </View>
          </View>

          <View style={styles.gaugeItem}>
            <View style={[styles.gaugeIconCircle, { backgroundColor: '#faf5ff' }]}>
              <Ionicons name="book" size={15} color="#8b5cf6" />
            </View>
            <View>
              <Text style={styles.gaugeValue}>
                {currentIndex}/{tokens.length}
              </Text>
              <Text style={styles.gaugeLabel}>{t.wordsRead}</Text>
            </View>
          </View>
        </View>

        {/* Modern Progress Bar with Milestones */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
          <View style={styles.milestoneContainer}>
            <Text style={[styles.milestoneStar, progressPercent >= 50 && styles.milestoneStarActive]}>
              ⭐
            </Text>
            <Text style={[styles.milestoneStar, progressPercent >= 100 && styles.milestoneStarActive]}>
              🏆
            </Text>
          </View>
        </View>
      </View>

      {/* Main Reading Surface */}
      <ScrollView
        style={styles.paperScrollView}
        contentContainerStyle={styles.paperScrollContent}
      >
        {/* Animated Mascot Sparky Banner with speech bubble */}
        <View style={styles.mascotBannerContainer}>
          <SparkyMascot
            size="medium"
            mood={getMascotMood()}
            speechBubbleText={getMascotPrompt()}
            language={language}
          />
        </View>

        {/* Tactile Book Paper Surface */}
        <View style={styles.paperCard}>
          {/* Book Binding Top Ribbon */}
          <View style={styles.paperHeader}>
            <View style={styles.paperBookmark}>
              <Ionicons name="book" size={14} color="#6366f1" />
              <Text style={styles.paperBookmarkText}>{t.readAloudPrompt}</Text>
            </View>
            <View style={styles.paperTipBadge}>
              <Ionicons name="finger-print-outline" size={13} color="#64748b" />
              <Text style={styles.tapTip}>{t.readingTapHint}</Text>
            </View>
          </View>

          {/* Interactive Word Chips (Duolingo Tactile 3D Tiles) */}
          <View style={styles.tokensContainer}>
            {tokens.map((token, idx) => {
              const isCurrent = idx === currentIndex && (isListening || isSimulating);
              const isCorrect = token.status === 'correct';
              const isHesitation = token.status === 'hesitation';
              const isMispronounced = token.status === 'mispronounced';
              const isSkipped = token.status === 'skipped';

              return (
                <View key={token.id || idx} style={styles.tokenWrapper}>
                  {/* Floating Spark Indicator above Current Word */}
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

                    {/* Status Emojis for instant kid comprehension */}
                    {isHesitation && (
                      <View style={styles.miniHesitationTag}>
                        <Text style={styles.miniTagText}>⏳</Text>
                      </View>
                    )}
                    {isMispronounced && (
                      <View style={styles.miniMispronouncedTag}>
                        <Text style={styles.miniTagText}>👂</Text>
                      </View>
                    )}
                    {isCorrect && (
                      <View style={styles.miniCorrectTag}>
                        <Text style={styles.miniTagText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Friendly Visual Legend */}
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
            <Ionicons name="mic" size={16} color="#ea580c" />
            <Text style={styles.liveTranscriptText} numberOfLines={1}>
              {language === 'es' ? 'Escuchado: ' : language === 'fr' ? 'Entendu : ' : language === 'pt' ? 'Ouvido: ' : 'Heard: '}"{recentSpokenText}"
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom Sticky Control Dock (Duolingo 3D Tactile Buttons) */}
      <View style={styles.controlsDock}>
        {/* Restart Button */}
        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={() => {
            playChime('tap');
            resetPageReading();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={22} color="#64748b" />
        </TouchableOpacity>

        {/* Big Central Read Aloud Button */}
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
            name={isListening || isSimulating ? 'stop-circle' : 'mic'}
            size={26}
            color="#ffffff"
          />
          <Text style={styles.micButtonText}>
            {isListening || isSimulating
              ? t.stopReadingBtn
              : t.startReadingBtn}
          </Text>
          {(isListening || isSimulating) && (
            <View style={styles.livePillPulse}>
              <Text style={styles.livePillText}>LIVE</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Simulation / Hackathon Demo Button */}
        <TouchableOpacity
          style={[
            styles.simButton,
            isSimulating && styles.simButtonActive,
          ]}
          onPress={handleSimulateChildReading}
          activeOpacity={0.75}
        >
          <Ionicons
            name={isSimulating ? 'pause' : 'play-forward'}
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
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 4,
  },
  gradeBadgeText: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '800',
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '800',
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
    gap: 5,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
  },
  scanPageIconText: {
    color: '#c2410c',
    fontSize: 11,
    fontWeight: '800',
  },
  gaugesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    gap: 6,
  },
  gaugeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  gaugeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  gaugeLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  progressBarWrapper: {
    position: 'relative',
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  milestoneContainer: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '48%',
    pointerEvents: 'none',
  },
  milestoneStar: {
    fontSize: 11,
    opacity: 0.35,
  },
  milestoneStarActive: {
    opacity: 1,
  },
  paperScrollView: {
    flex: 1,
  },
  paperScrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  mascotBannerContainer: {
    marginBottom: 14,
  },
  paperCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  paperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexWrap: 'wrap',
    gap: 8,
  },
  paperBookmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  paperBookmarkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338ca',
  },
  paperTipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tapTip: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  tokensContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    lineHeight: 34,
  },
  tokenWrapper: {
    position: 'relative',
    margin: 4,
  },
  currentSparkIndicator: {
    position: 'absolute',
    top: -16,
    left: '35%',
    zIndex: 10,
  },
  sparkEmoji: {
    fontSize: 14,
  },
  wordButton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderBottomWidth: 3.5,
    borderBottomColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  wordCurrent: {
    backgroundColor: '#f5f3ff',
    borderColor: '#a5b4fc',
    borderBottomColor: '#6366f1',
    borderWidth: 2,
    borderBottomWidth: 4,
    shadowColor: '#6366f1',
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  wordCorrect: {
    backgroundColor: '#ecfdf5',
    borderColor: '#6ee7b7',
    borderBottomColor: '#10b981',
  },
  wordHesitation: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderBottomColor: '#f59e0b',
  },
  wordMispronounced: {
    backgroundColor: '#ffe4e6',
    borderColor: '#fecdd3',
    borderBottomColor: '#f43f5e',
  },
  wordSkipped: {
    backgroundColor: '#ede9fe',
    borderColor: '#ddd6fe',
    borderBottomColor: '#818cf8',
  },
  wordText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.4,
  },
  wordTextCurrent: {
    color: '#4338ca',
    fontWeight: '900',
  },
  wordTextCorrect: {
    color: '#047857',
  },
  wordTextHesitation: {
    color: '#b45309',
  },
  wordTextMispronounced: {
    color: '#be123c',
  },
  wordTextSkipped: {
    color: '#6366f1',
    textDecorationLine: 'line-through',
  },
  miniCorrectTag: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniHesitationTag: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  miniMispronouncedTag: {
    backgroundColor: '#ffe4e6',
    borderRadius: 8,
  },
  miniTagText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '800',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  liveTranscriptText: {
    fontSize: 12,
    color: '#9a3412',
    fontWeight: '700',
  },
  controlsDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  iconCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderBottomWidth: 3,
    borderBottomColor: '#cbd5e1',
  },
  micButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981', // Vibrant Emerald green
    paddingVertical: 12,
    borderRadius: 24,
    borderBottomWidth: 4,
    borderBottomColor: '#059669',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  micButtonListening: {
    backgroundColor: '#f43f5e', // Vibrant coral crimson
    borderBottomColor: '#be123c',
    shadowColor: '#f43f5e',
  },
  micButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  livePillPulse: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  livePillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    borderBottomWidth: 3,
    borderBottomColor: '#fdba74',
  },
  simButtonActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
    borderBottomColor: '#c2410c',
  },
  simButtonText: {
    color: '#ea580c',
    fontSize: 12,
    fontWeight: '800',
  },
  simButtonTextActive: {
    color: '#ffffff',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#4338ca',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  finishBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
