import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BookPage, WordToken, ReadingSessionResult, ReadingErrorDetail, SupportedLanguage } from '../types';
import {
  SpeechRecognitionController,
  matchSpokenWordToTokens,
} from '../services/speechService';
import { speakText, stopSpeaking, playChime } from '../services/ttsService';
import { saveReadingSession, addStars } from '../services/storageService';
import { getTranslation } from '../i18n/translations';
import { getStorySceneIllustrationUrl } from '../services/imageService';
import { SparkyMascot } from './SparkyMascot';
import { CelebrationConfetti } from './CelebrationConfetti';
import { useTheme } from '../context/ThemeContext';

interface ReadingViewProps {
  page: BookPage;
  language: SupportedLanguage;
  onOpenWordExplainer: (word: string, contextSentence: string) => void;
  onPageCompleted: (result: ReadingSessionResult) => void;
  onOpenScan: () => void;
  onStarsEarned?: (newTotal: number) => void;
  onOpenSettings?: () => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  page,
  language,
  onOpenWordExplainer,
  onPageCompleted,
  onOpenScan,
  onStarsEarned,
  onOpenSettings,
}) => {
  const t = getTranslation(language);
  const { width } = useWindowDimensions();
  const isCompact = width < 540;

  const {
    theme,
    themeMode,
    activeFontFamilyCss,
    fontScale,
    readingRuler,
    syllableMode,
  } = useTheme();

  const [tokens, setTokens] = useState<WordToken[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSparkyReading, setIsSparkyReading] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [errorsList, setErrorsList] = useState<ReadingErrorDetail[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [recentSpokenText, setRecentSpokenText] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [showSceneIllustration, setShowSceneIllustration] = useState<boolean>(false);

  const speechControllerRef = useRef<SpeechRecognitionController | null>(null);
  const lastWordTimestampRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);
  const simulationTimerRef = useRef<any>(null);
  const sparkyCancelRef = useRef<boolean>(false);

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
      stopSpeaking();
      sparkyCancelRef.current = true;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    };
  }, [language]);

  const resetPageReading = () => {
    if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    sparkyCancelRef.current = true;
    stopSpeaking();
    setIsSparkyReading(false);
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
    if (isSparkyReading) {
      sparkyCancelRef.current = true;
      stopSpeaking();
      setIsSparkyReading(false);
    }

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
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const handleSparkyReadAloud = async () => {
    if (isSparkyReading) {
      sparkyCancelRef.current = true;
      stopSpeaking();
      setIsSparkyReading(false);
      return;
    }

    // Stop child mic or simulation if active
    if (isListening) stopReadingSession();
    if (isSimulating) {
      clearTimeout(simulationTimerRef.current);
      setIsSimulating(false);
    }

    setIsSparkyReading(true);
    sparkyCancelRef.current = false;
    playChime('sparkle');

    for (let i = 0; i < tokens.length; i++) {
      if (sparkyCancelRef.current) break;
      setCurrentIndex(i);
      setTokens((prev) =>
        prev.map((t, idx) => ({
          ...t,
          status: idx === i ? 'current' : idx < i ? 'correct' : 'pending',
        }))
      );

      await new Promise<void>((resolve) => {
        speakText(tokens[i].word, language, 0.85, () => resolve());
      });
      await new Promise((r) => setTimeout(r, 110));
    }

    setIsSparkyReading(false);
    if (!sparkyCancelRef.current) {
      playChime('complete');
      speakText(
        language === 'es'
          ? '¡Excelente! Ahora te toca a ti leerlo en voz alta.'
          : 'Great job listening! Now it is your turn to read aloud.',
        language
      );
    }
  };

  const handleSpeechInput = (spokenText: string) => {
    if (tokens.length === 0 || currentIndex >= tokens.length) return;

    const hesitationMs = Date.now() - lastWordTimestampRef.current;
    const match = matchSpokenWordToTokens(spokenText, tokens, currentIndex, language, hesitationMs);
    if (!match || match.nextIndex === currentIndex) return;

    lastWordTimestampRef.current = Date.now();
    const updated = match.updatedTokens;
    const newErrors = match.error ? [...errorsList, match.error] : errorsList;

    setTokens(updated);
    setCurrentIndex(match.nextIndex);
    setErrorsList(newErrors);

    if (startTime) {
      const seconds = (Date.now() - startTime) / 1000;
      if (seconds > 0) {
        const wordsRead = match.nextIndex;
        const currentWpm = Math.round((wordsRead / seconds) * 60);
        setWpm(currentWpm);
      }
    }

    if (match.nextIndex >= updated.length) {
      finishReadingSession(updated, newErrors);
    }
  };

  const finishReadingSession = async (finalTokens: WordToken[], finalErrors: ReadingErrorDetail[]) => {
    stopReadingSession();
    setIsSimulating(false);
    setShowConfetti(true);
    playChime('complete');

    const durationSec = elapsedSeconds || Math.max(1, Math.round(((Date.now() - (startTime || Date.now())) / 1000)));
    const totalWords = finalTokens.length;
    const correctCount = finalTokens.filter((t) => t.status === 'correct').length;
    const hesitationCount = finalTokens.filter((t) => t.status === 'hesitation').length;
    const mispronouncedCount = finalTokens.filter((t) => t.status === 'mispronounced').length;
    const skippedCount = finalTokens.filter((t) => t.status === 'skipped').length;
    const accuracy = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 100;
    const calcWpm = durationSec > 0 ? Math.round((totalWords / durationSec) * 60) : wpm;

    const result: ReadingSessionResult = {
      id: 'session-' + Date.now(),
      pageId: page.id,
      pageTitle: page.title,
      bookSource: page.source,
      language,
      date: new Date().toISOString(),
      durationSeconds: durationSec,
      totalWords,
      correctWords: correctCount,
      hesitationWords: hesitationCount,
      mispronouncedWords: mispronouncedCount,
      skippedWords: skippedCount,
      accuracyPercent: accuracy,
      wordsPerMinute: calcWpm,
      errors: finalErrors,
      gradeLevel: page.gradeLevel,
    };

    await saveReadingSession(result);
    const newStars = await addStars(10);
    if (onStarsEarned) {
      onStarsEarned(newStars);
    }

    setTimeout(() => {
      onPageCompleted(result);
    }, 1800);
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
    const allTokens = [...page.words.map((w, idx) => ({ ...w, status: (idx === 0 ? 'current' : 'pending') as any }))];
    const simulatedErrors: ReadingErrorDetail[] = [];

    const stepSimulation = () => {
      if (simIndex >= allTokens.length) {
        finishReadingSession(allTokens, simulatedErrors);
        return;
      }

      const currentWord = allTokens[simIndex].word;
      setRecentSpokenText(currentWord);

      const isTricky = simIndex === 2 || (simIndex === 5 && allTokens.length > 6);
      const delay = isTricky ? 1400 : 700;

      if (simIndex === 2) {
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
    if (isSparkyReading) return 'thinking';
    if (isListening || isSimulating) return 'listening';
    return 'idle';
  };

  const getMascotPrompt = () => {
    if (showConfetti) {
      return language === 'es'
        ? '¡Excelente lectura! ¡Ganaste 10 estrellas! ⭐🎉'
        : 'Incredible reading! You earned 10 stars! ⭐🎉';
    }
    if (isSparkyReading) {
      return language === 'es'
        ? 'Escucha con atención cómo suena cada palabra... 🎧📖'
        : 'Listen carefully to how each word is pronounced... 🎧📖';
    }
    if (isListening || isSimulating) {
      return language === 'es'
        ? '¡Te escucho! Lee con voz clara y tranquila... 🎧'
        : 'I am listening! Read aloud with confidence... 🎧';
    }
    return language === 'es'
      ? "Toca cualquier palabra para escucharla o pulsa 'Sparky Lee' / 'Leer en Voz Alta' 📖"
      : "Tap any word to hear it or tap 'Sparky Reads' / 'Read Aloud' 📖";
  };

  const progressPercent = tokens.length > 0 ? (currentIndex / tokens.length) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <CelebrationConfetti active={showConfetti} />

      {/* Modern Compact Live HUD Bar with Direct Aa Quick Button */}
      <View style={[styles.miniHudBar, { backgroundColor: theme.hudBg, borderBottomColor: theme.hudBorder }]}>
        <View style={styles.hudLeft}>
          <Text style={[styles.hudCountText, { color: theme.textSecondary }]}>
            {currentIndex}/{tokens.length} {language === 'es' ? 'palabras' : 'words'}
          </Text>
          <View style={[styles.hudProgressTrack, { backgroundColor: theme.borderLight }]}>
            <View style={[styles.hudProgressFill, { width: `${progressPercent}%`, backgroundColor: theme.primary }]} />
          </View>
        </View>

        <View style={styles.hudRight}>
          <View style={[styles.hudStatPillBlue, { backgroundColor: themeMode === 'dark' ? '#082f49' : '#f0f9ff', borderColor: '#38bdf8' }]}>
            <Ionicons name="speedometer-outline" size={12} color="#0284c7" />
            <Text style={styles.hudStatTextBlue}>{wpm || '--'} WPM</Text>
          </View>
          <View style={[styles.hudStatPillGreen, { backgroundColor: themeMode === 'dark' ? '#064e3b' : '#ecfdf5', borderColor: '#34d399' }]}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#059669" />
            <Text style={styles.hudStatTextGreen}>{currentAccuracy}%</Text>
          </View>

          {/* Direct Quick Aa Typography Button in HUD */}
          {onOpenSettings && (
            <TouchableOpacity
              style={[styles.hudAaBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
              onPress={() => {
                playChime('tap');
                onOpenSettings();
              }}
              activeOpacity={0.7}
              accessibilityLabel="Ajustes de Fuente y Tamaño"
            >
              <Text style={[styles.hudAaText, { color: theme.text }]}>Aa</Text>
            </TouchableOpacity>
          )}
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

        {/* Toggleable Story Scene Illustration Bar */}
        <View style={styles.sceneToggleRow}>
          <TouchableOpacity
            style={[
              styles.sceneToggleBtn,
              {
                backgroundColor: showSceneIllustration ? theme.primaryLight : theme.surfaceSecondary,
                borderColor: showSceneIllustration ? theme.primary : theme.border,
              },
            ]}
            onPress={() => {
              playChime('tap');
              setShowSceneIllustration((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showSceneIllustration ? 'image' : 'image-outline'}
              size={15}
              color={showSceneIllustration ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.sceneToggleBtnText,
                { color: showSceneIllustration ? theme.primary : theme.textSecondary },
              ]}
            >
              {showSceneIllustration
                ? (language === 'es' ? 'Ocultar Ilustración' : 'Hide Scene Art')
                : (language === 'es' ? '🎨 Ver Ilustración del Cuento' : '🎨 View Story Scene Art')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Story Scene Illustration Hero Banner */}
        {showSceneIllustration && (
          <View style={[styles.storySceneCard, { borderColor: theme.border }]}>
            <Image
              source={{ uri: getStorySceneIllustrationUrl(page.title, page.text, page.imageUrl) }}
              style={styles.storySceneImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(15, 23, 42, 0.82)']}
              style={styles.storySceneGradient}
            >
              <Text style={styles.storySceneCaption} numberOfLines={1}>
                📖 {page.title}
              </Text>
              <Text style={styles.storySceneSub}>
                {language === 'es' ? 'Ilustración artística generada para apoyar la comprensión visual' : 'Visual story scaffolding for dual-coding comprehension'}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Elevated Tactile Reading Paper Board */}
        <View
          style={[
            styles.paperCard,
            {
              backgroundColor: theme.paperCardBg,
              borderColor: theme.paperCardBorder,
              shadowColor: themeMode === 'dark' ? '#000000' : '#0f172a',
            },
          ]}
        >
          {/* Magic Book Top Accent Ribbon */}
          <LinearGradient
            colors={theme.gradients.bookRibbon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.magicBookRibbon}
          />

          <View style={styles.tokensContainer}>
            {tokens.map((token, idx) => {
              const isCurrent = idx === currentIndex && (isListening || isSimulating || isSparkyReading);
              const isCorrect = token.status === 'correct';
              const isHesitation = token.status === 'hesitation';
              const isMispronounced = token.status === 'mispronounced';
              const isSkipped = token.status === 'skipped';

              // Format word for syllable mode
              const displayWord =
                syllableMode && token.syllables && token.syllables.length > 1
                  ? token.syllables.join(' • ')
                  : token.display;

              return (
                <View
                  key={token.id || idx}
                  style={[
                    styles.tokenWrapper,
                    readingRuler && isCurrent && styles.tokenWrapperRuler,
                  ]}
                >
                  {isCurrent && (
                    <View style={styles.currentSparkIndicator}>
                      <Text style={styles.sparkEmoji}>✨</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.wordButton,
                      { backgroundColor: theme.wordBgPending },
                      isCurrent && [styles.wordCurrent, { borderColor: theme.borderActive, backgroundColor: themeMode === 'dark' ? '#3b220c' : '#fef3c7' }],
                      isCorrect && styles.wordCorrect,
                      isHesitation && styles.wordHesitation,
                      isMispronounced && styles.wordMispronounced,
                      isSkipped && styles.wordSkipped,
                      readingRuler && isCurrent && styles.wordButtonRulerActive,
                    ]}
                    onPress={() => handleWordTap(token)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.wordText,
                        {
                          color: theme.wordTextPending,
                          fontSize: fontScale.size,
                          letterSpacing: fontScale.letterSpacing,
                          ...(Platform.OS === 'web' ? { fontFamily: activeFontFamilyCss } : {}),
                        },
                        isCorrect && styles.wordTextCorrect,
                        isHesitation && styles.wordTextHesitation,
                        isMispronounced && styles.wordTextMispronounced,
                        isSkipped && styles.wordTextSkipped,
                        isCurrent && [styles.wordTextCurrent, { color: themeMode === 'dark' ? '#fed7aa' : '#78350f' }],
                      ]}
                    >
                      {displayWord}
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

                  {/* Reading Focus Ruler Line */}
                  {readingRuler && isCurrent && (
                    <View style={[styles.rulerBar, { backgroundColor: theme.primary }]} />
                  )}
                </View>
              );
            })}
          </View>

          {/* Discreet Color Legend */}
          <View style={[styles.legendRow, { borderTopColor: theme.borderLight }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{t.legendCorrect}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{t.legendHesitation}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f43f5e' }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{t.legendMispronounced}</Text>
            </View>
            {syllableMode && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.legendLabel, { color: theme.primary }]}>
                  {language === 'es' ? 'Silabeo Activo' : 'Syllables Active'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Live speech heard transcript pill */}
        {recentSpokenText ? (
          <View style={[styles.liveTranscriptBox, { backgroundColor: theme.primaryLight, borderColor: theme.borderActive }]}>
            <Ionicons name="mic-circle" size={16} color={theme.primary} />
            <Text style={[styles.liveTranscriptLabel, { color: theme.primary }]}>
              {language === 'es' ? 'Escuché:' : 'Heard:'}
            </Text>
            <Text style={[styles.liveTranscriptPhrase, { color: theme.text }]} numberOfLines={1}>
              "{recentSpokenText}"
            </Text>
          </View>
        ) : null}

        {/* Spacing for floating dock */}
        <View style={{ height: 95 }} />
      </ScrollView>

      {/* Modern Floating Action Dock */}
      <View
        style={[
          styles.floatingDock,
          {
            backgroundColor: theme.dockBg,
            borderColor: theme.dockBorder,
            shadowColor: themeMode === 'dark' ? '#000000' : '#0f172a',
          },
        ]}
      >
        {/* Reset / Restart */}
        <TouchableOpacity
          style={[styles.dockIconCircle, { backgroundColor: theme.surfaceSecondary }]}
          onPress={() => {
            playChime('tap');
            resetPageReading();
          }}
          activeOpacity={0.7}
          accessibilityLabel="Reset reading page"
        >
          <Ionicons name="refresh" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Sparky Lee para Mí (Echo Reading / Phonics Modeling) */}
        <TouchableOpacity
          style={styles.dockButtonTouch}
          onPress={handleSparkyReadAloud}
          activeOpacity={0.8}
          accessibilityLabel="Escuchar a Sparky leer la página"
        >
          <LinearGradient
            colors={isSparkyReading ? theme.gradients.btnSparkyReads : (themeMode === 'dark' ? ['#1E1B4B', '#312E81'] : ['#EEF2FF', '#E0E7FF'])}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.dockSparkyListenBtn,
              isCompact && styles.dockSparkyListenBtnCompact,
              { borderColor: isSparkyReading ? '#818CF8' : theme.border },
            ]}
          >
            <Ionicons
              name={isSparkyReading ? 'stop-circle' : 'volume-high'}
              size={18}
              color={isSparkyReading ? '#ffffff' : '#6366f1'}
            />
            <Text
              style={[
                styles.dockSparkyListenText,
                { color: isSparkyReading ? '#ffffff' : (themeMode === 'dark' ? '#C7D2FE' : '#4338CA') },
                isCompact && styles.dockSparkyListenTextCompact,
              ]}
            >
              {isSparkyReading ? (language === 'es' ? 'Pausa' : 'Pause') : (isCompact ? (language === 'es' ? 'Oír' : 'Hear') : (language === 'es' ? 'Sparky Lee' : 'Sparky Reads'))}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Hero Mic Read-Aloud Button with Radiant Sunset Gradient */}
        <TouchableOpacity
          style={styles.heroMicTouch}
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
          <LinearGradient
            colors={isListening || isSimulating ? theme.gradients.btnMicListening : theme.gradients.btnMicIdle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroMicButton,
              (isListening || isSimulating) && styles.heroMicButtonActive,
              isCompact && styles.heroMicButtonCompact,
            ]}
          >
            <Ionicons
              name={isListening || isSimulating ? 'stop-circle' : 'mic'}
              size={20}
              color="#ffffff"
            />
            <Text style={[styles.heroMicText, isCompact && styles.heroMicTextCompact]}>
              {isListening || isSimulating
                ? (language === 'es' ? 'Pausar' : 'Stop')
                : (isCompact
                  ? (language === 'es' ? 'Leer' : 'Read')
                  : (language === 'es' ? 'Leer en Voz Alta' : 'Read Aloud'))}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 1-Click Simulation Demo with Amber Sunset Gradient */}
        <TouchableOpacity
          style={styles.dockButtonTouch}
          onPress={handleSimulateChildReading}
          activeOpacity={0.75}
        >
          <LinearGradient
            colors={isSimulating ? theme.gradients.btnSimulate : (themeMode === 'dark' ? ['#431407', '#2A0C03'] : ['#FFF7ED', '#FFEDD5'])}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.dockSimButton,
              { borderColor: theme.borderActive },
              isCompact && styles.dockSimButtonCompact,
            ]}
          >
            <Ionicons
              name={isSimulating ? 'pause' : 'play-forward'}
              size={15}
              color={isSimulating ? '#ffffff' : theme.primary}
            />
            <Text
              style={[
                styles.dockSimText,
                { color: isSimulating ? '#ffffff' : '#ea580c' },
                isCompact && styles.dockSimTextCompact,
              ]}
            >
              {isSimulating ? (language === 'es' ? 'Pausa' : 'Pause') : (language === 'es' ? 'Simular' : 'Sim')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  miniHudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
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
  },
  hudProgressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  hudProgressFill: {
    height: '100%',
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
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  hudStatTextBlue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
  },
  hudStatPillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  hudStatTextGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  hudAaBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudAaText: {
    fontSize: 11,
    fontWeight: '900',
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
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tokensContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 6,
  },
  tokenWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  tokenWrapperRuler: {
    zIndex: 5,
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
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wordButtonRulerActive: {
    borderBottomWidth: 3,
  },
  rulerBar: {
    position: 'absolute',
    bottom: -4,
    left: 4,
    right: 4,
    height: 3,
    borderRadius: 2,
  },
  wordText: {
    fontWeight: '600',
  },
  wordCurrent: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  wordTextCurrent: {
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
    fontWeight: '600',
  },
  liveTranscriptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'center',
  },
  liveTranscriptLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  liveTranscriptPhrase: {
    fontSize: 11,
    fontStyle: 'italic',
    maxWidth: 240,
  },
  floatingDock: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 30,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: '96%',
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(16px)',
        }
      : {}),
  },
  dockIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  magicBookRibbon: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    marginBottom: 12,
  },
  dockButtonTouch: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroMicTouch: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  dockSparkyListenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 20,
    borderWidth: 1,
  },
  dockSparkyListenBtnCompact: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dockSparkyListenText: {
    fontSize: 12,
    fontWeight: '800',
  },
  dockSparkyListenTextCompact: {
    fontSize: 11,
  },
  heroMicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  heroMicButtonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  heroMicButtonActive: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  heroMicText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  heroMicTextCompact: {
    fontSize: 12,
  },
  dockSimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 20,
    borderWidth: 1,
  },
  dockSimButtonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dockSimText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dockSimTextCompact: {
    fontSize: 10,
  },
  sceneToggleRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  sceneToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  sceneToggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  storySceneCard: {
    width: '100%',
    height: 180,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    marginVertical: 6,
    position: 'relative',
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  storySceneImage: {
    width: '100%',
    height: '100%',
  },
  storySceneGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  storySceneCaption: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  storySceneSub: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
});
