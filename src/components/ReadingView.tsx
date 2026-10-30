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
  Modal,
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
import { getStorySceneIllustrationUrl, toImageSource } from '../services/imageService';
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
  onOpenVoiceAsk?: () => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  page,
  language,
  onOpenWordExplainer,
  onPageCompleted,
  onOpenScan,
  onStarsEarned,
  onOpenSettings,
  onOpenVoiceAsk,
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
  const [wpm, setWpm] = useState<number>(0);
  const [errorsList, setErrorsList] = useState<ReadingErrorDetail[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [recentSpokenText, setRecentSpokenText] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [showSceneIllustration, setShowSceneIllustration] = useState<boolean>(true);
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);

  const speechControllerRef = useRef<SpeechRecognitionController | null>(null);
  const lastWordTimestampRef = useRef<number>(Date.now());
  const simulationTimerRef = useRef<any>(null);
  const sparkyCancelRef = useRef<boolean>(false);
  // Session start lives in a ref so timer callbacks (simulation, speech) never read a stale value
  const startTimeRef = useRef<number | null>(null);
  // Speech callbacks are registered once per language, so they must always call the latest handler
  const speechInputHandlerRef = useRef<(spokenText: string, isFinal: boolean) => void>(() => {});
  // How many words of the phrase the speech service is still refining have already been scored
  const consumedPhraseWordsRef = useRef<number>(0);

  useEffect(() => {
    resetPageReading();
  }, [page]);

  useEffect(() => {
    speechControllerRef.current = new SpeechRecognitionController(language);

    speechControllerRef.current.onWordSpoken = (spokenText, isFinal) => {
      setRecentSpokenText(spokenText);
      speechInputHandlerRef.current(spokenText, isFinal);
    };

    speechControllerRef.current.onEnd = () => {
      setIsListening(false);
    };

    return () => {
      if (speechControllerRef.current) {
        speechControllerRef.current.stopListening();
      }
      stopSpeaking();
      sparkyCancelRef.current = true;
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

    const freshTokens = page.words.map((w, idx) => ({
      ...w,
      status: (idx === 0 ? 'current' : 'pending') as any,
    }));
    setTokens(freshTokens);
    setCurrentIndex(0);
    setStartTime(null);
    startTimeRef.current = null;
    setWpm(0);
    setErrorsList([]);
    setRecentSpokenText('');
    consumedPhraseWordsRef.current = 0;
    lastWordTimestampRef.current = Date.now();
  };

  const startReadingSession = () => {
    if (isSparkyReading) {
      sparkyCancelRef.current = true;
      stopSpeaking();
      setIsSparkyReading(false);
    }

    if (!startTime) {
      const now = Date.now();
      startTimeRef.current = now;
      setStartTime(now);
    }

    lastWordTimestampRef.current = Date.now();
    consumedPhraseWordsRef.current = 0;
    setIsListening(true);
    speechControllerRef.current?.startListening();
    playChime('tap');
  };

  const stopReadingSession = () => {
    setIsListening(false);
    speechControllerRef.current?.stopListening();
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
    // Modeling is not the child's reading: restore a fresh page for their turn
    setTokens(page.words.map((w, idx) => ({ ...w, status: idx === 0 ? 'current' : 'pending' })));
    setCurrentIndex(0);
    if (!sparkyCancelRef.current) {
      playChime('complete');
      speakText(t.yourTurnToRead, language);
    }
  };

  const handleSpeechInput = (spokenText: string, isFinal: boolean) => {
    if (tokens.length === 0 || currentIndex >= tokens.length) return;

    const spokenWords = spokenText.trim().split(/\s+/).filter(Boolean);
    // An interim phrase's last word may still be growing ("humming" -> "hummingbird"), so score it later
    const stableCount = isFinal ? spokenWords.length : spokenWords.length - 1;
    let consumed = Math.min(consumedPhraseWordsRef.current, stableCount);

    let updated = tokens;
    let index = currentIndex;
    let newErrors = errorsList;
    let advanced = false;

    while (consumed < stableCount && index < updated.length) {
      const hesitationMs = advanced ? 0 : Date.now() - lastWordTimestampRef.current;
      const match = matchSpokenWordToTokens(spokenWords[consumed], updated, index, language, hesitationMs);
      consumed += 1;
      if (match.nextIndex === index) continue;

      updated = match.updatedTokens;
      index = match.nextIndex;
      advanced = true;
      if (match.error) newErrors = [...newErrors, match.error];
    }

    // A final result closes the phrase; the next one starts from zero
    consumedPhraseWordsRef.current = isFinal ? 0 : consumed;
    if (!advanced) return;

    lastWordTimestampRef.current = Date.now();
    setTokens(updated);
    setCurrentIndex(index);
    setErrorsList(newErrors);

    if (startTimeRef.current) {
      const seconds = (Date.now() - startTimeRef.current) / 1000;
      if (seconds > 0) {
        setWpm(Math.round((index / seconds) * 60));
      }
    }

    if (index >= updated.length) {
      finishReadingSession(updated, newErrors);
    }
  };
  speechInputHandlerRef.current = handleSpeechInput;

  const finishReadingSession = async (finalTokens: WordToken[], finalErrors: ReadingErrorDetail[]) => {
    stopReadingSession();
    setIsSimulating(false);
    setShowConfetti(true);
    playChime('complete');

    const sessionStart = startTimeRef.current || Date.now();
    const durationSec = Math.max(1, Math.round((Date.now() - sessionStart) / 1000));
    const totalWords = finalTokens.length;
    const correctCount = finalTokens.filter((t) => t.status === 'correct').length;
    const hesitationCount = finalTokens.filter((t) => t.status === 'hesitation').length;
    const mispronouncedCount = finalTokens.filter((t) => t.status === 'mispronounced').length;
    const skippedCount = finalTokens.filter((t) => t.status === 'skipped').length;
    const accuracy = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 100;
    const calcWpm = durationSec > 0 ? Math.round((totalWords / durationSec) * 60) : wpm;

    let metaTranscript = '';
    if (speechControllerRef.current) {
      try {
        metaTranscript = await speechControllerRef.current.transcribeCurrentAudio();
      } catch (e) {
        console.warn('Meta Muse session transcription error:', e);
      }
    }

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
      metaMuseTranscript: metaTranscript || undefined,
      evaluatedBy: metaTranscript ? 'meta-muse-voice' : 'hybrid',
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
    startTimeRef.current = Date.now();
    setStartTime(startTimeRef.current);

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
      if (startTimeRef.current) {
        const seconds = (Date.now() - startTimeRef.current) / 1000;
        if (seconds > 0) setWpm(Math.round((simIndex / seconds) * 60));
      }

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
      return t.promptCelebration;
    }
    if (isSparkyReading) {
      return t.promptSparkyReads;
    }
    if (isListening || isSimulating) {
      return t.promptListening;
    }
    return t.promptIdle;
  };

  const progressPercent = tokens.length > 0 ? (currentIndex / tokens.length) * 100 : 0;
  const isReadingActive = isListening || isSimulating;

  const renderDockAction = (action: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress: () => void;
    colors: [string, string, ...string[]];
    tint: string;
    borderColor: string;
    showLabel?: boolean;
  }) => {
    const showLabel = !isCompact && action.showLabel !== false;
    return (
      <TouchableOpacity
        style={styles.dockButtonTouch}
        onPress={action.onPress}
        activeOpacity={0.75}
        accessibilityLabel={action.label}
      >
        <LinearGradient
          colors={action.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.dockAction,
            !showLabel && styles.dockActionIconOnly,
            { borderColor: action.borderColor },
          ]}
        >
          <Ionicons name={action.icon} size={showLabel ? 16 : 19} color={action.tint} />
          {showLabel && (
            <Text style={[styles.dockActionText, { color: action.tint }]} numberOfLines={1}>
              {action.label}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <CelebrationConfetti active={showConfetti} />

      {/* Modern Compact Live HUD Bar with Direct Aa Quick Button */}
      <View style={[styles.miniHudBar, { backgroundColor: theme.hudBg, borderBottomColor: theme.hudBorder }]}>
        <View style={styles.hudLeft}>
          <Text style={[styles.hudCountText, { color: theme.textSecondary }]}>
            {currentIndex}/{tokens.length} {t.wordsLabel}
          </Text>
          <View style={[styles.hudProgressTrack, { backgroundColor: theme.borderLight }]}>
            <View style={[styles.hudProgressFill, { width: `${progressPercent}%`, backgroundColor: theme.primary }]} />
          </View>
        </View>

        <View style={styles.hudRight}>
          <View style={[styles.hudStatPill, { backgroundColor: theme.badges.kpiSpeedBg }]}>
            <Ionicons name="speedometer-outline" size={12} color={theme.badges.kpiSpeedText} />
            <Text style={[styles.hudStatText, { color: theme.badges.kpiSpeedText }]}>{wpm || '--'} WPM</Text>
          </View>
          <View style={[styles.hudStatPill, { backgroundColor: theme.badges.kpiAccuracyBg }]}>
            <Ionicons name="checkmark-circle-outline" size={12} color={theme.badges.kpiAccuracyText} />
            <Text style={[styles.hudStatText, { color: theme.badges.kpiAccuracyText }]}>{currentAccuracy}%</Text>
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
              accessibilityLabel={t.settingsBtnLabel}
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

        {/* Collapsed Scene Art: slim chip so the page text stays above the fold */}
        {!showSceneIllustration && (
          <View style={styles.sceneToggleRow}>
            <TouchableOpacity
              style={[styles.sceneToggleBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
              onPress={() => {
                playChime('tap');
                setShowSceneIllustration(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="image-outline" size={15} color={theme.textSecondary} />
              <Text style={[styles.sceneToggleBtnText, { color: theme.textSecondary }]}>{t.viewSceneArt}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Story Scene Illustration Hero Banner */}
        {showSceneIllustration && (
          <TouchableOpacity
            style={[
              styles.storySceneCard,
              { borderColor: theme.border, height: isCompact ? 180 : 300 },
            ]}
            onPress={() => setIsImageZoomed(true)}
            activeOpacity={0.92}
          >
            <Image
              source={toImageSource(getStorySceneIllustrationUrl(page.title, page.imageUrl))}
              style={styles.storySceneImage}
              resizeMode="cover"
            />
            {/* Top Left Hide Pill */}
            <TouchableOpacity
              style={[styles.sceneExpandBadge, styles.sceneHideBadge]}
              onPress={() => {
                playChime('tap');
                setShowSceneIllustration(false);
              }}
              activeOpacity={0.8}
              accessibilityLabel={t.hideSceneArt}
            >
              <Ionicons name="eye-off-outline" size={14} color="#ffffff" />
            </TouchableOpacity>

            {/* Top Right Zoom Pill */}
            <View style={styles.sceneExpandBadge}>
              <Ionicons name="expand" size={13} color="#ffffff" />
              <Text style={styles.sceneExpandText}>
                {t.tapToEnlarge}
              </Text>
            </View>

            <LinearGradient
              colors={['transparent', 'rgba(15, 23, 42, 0.88)']}
              style={styles.storySceneGradient}
            >
              <Text style={[styles.storySceneCaption, isCompact && styles.storySceneCaptionCompact]} numberOfLines={1}>
                {page.title}
              </Text>
              <Text style={styles.storySceneSub} numberOfLines={1}>
                {t.sceneArtDesc}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
              const w = theme.words;

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
                      <Ionicons name="sparkles" size={15} color={w.currentBorder} />
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.wordButton,
                      { backgroundColor: w.pendingBg },
                      isCorrect && { backgroundColor: w.correctBg, borderColor: w.correctBorder },
                      isHesitation && { backgroundColor: w.hesitationBg, borderColor: w.hesitationBorder },
                      isMispronounced && { backgroundColor: w.mispronouncedBg, borderColor: w.mispronouncedBorder },
                      isSkipped && [styles.wordSkipped, { borderColor: theme.accent }],
                      isCurrent && [styles.wordCurrent, { borderColor: w.currentBorder, backgroundColor: w.currentBg }],
                      readingRuler && isCurrent && styles.wordButtonRulerActive,
                    ]}
                    onPress={() => handleWordTap(token)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.wordText,
                        {
                          color: w.pendingText,
                          fontSize: fontScale.size,
                          letterSpacing: fontScale.letterSpacing,
                          ...(Platform.OS === 'web' ? { fontFamily: activeFontFamilyCss } : {}),
                        },
                        isCorrect && [styles.wordTextStatus, { color: w.correctText }],
                        isHesitation && [styles.wordTextStatus, { color: w.hesitationText }],
                        isMispronounced && [styles.wordTextMispronounced, { color: w.mispronouncedText }],
                        isSkipped && [styles.wordTextSkipped, { color: theme.accent }],
                        isCurrent && [styles.wordTextCurrent, { color: w.currentText }],
                      ]}
                    >
                      {displayWord}
                    </Text>

                    {isHesitation && (
                      <View style={[styles.miniTag, { backgroundColor: w.hesitationBorder }]}>
                        <Ionicons name="time" size={10} color="#ffffff" />
                      </View>
                    )}
                    {isMispronounced && (
                      <View style={[styles.miniTag, { backgroundColor: w.mispronouncedBorder }]}>
                        <Ionicons name="ear" size={10} color="#ffffff" />
                      </View>
                    )}
                    {isCorrect && (
                      <View style={[styles.miniTag, { backgroundColor: w.correctBorder }]}>
                        <Ionicons name="checkmark" size={10} color="#ffffff" />
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
              <View style={[styles.legendDot, { backgroundColor: theme.words.correctBorder }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{t.legendCorrect}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.words.hesitationBorder }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{t.legendHesitation}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.words.mispronouncedBorder }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{t.legendMispronounced}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{t.legendSkipped}</Text>
            </View>
            {syllableMode && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.legendLabel, { color: theme.primary }]}>
                  {t.syllablesActive}
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
              {t.sparkyHeard}
            </Text>
            <Text style={[styles.liveTranscriptPhrase, { color: theme.text }]} numberOfLines={1}>
              "{recentSpokenText}"
            </Text>
          </View>
        ) : null}

        {/* Spacing for floating dock */}
        <View style={{ height: 95 }} />
      </ScrollView>

      {/* Modern Floating Action Dock: icon-only secondary actions on phones, labelled pills on wide screens */}
      <View
        style={[
          styles.floatingDock,
          isCompact && styles.floatingDockCompact,
          {
            backgroundColor: theme.dockBg,
            borderColor: theme.dockBorder,
            shadowColor: themeMode === 'dark' ? '#000000' : '#0f172a',
          },
        ]}
      >
        {/* Reset / Restart */}
        {renderDockAction({
          icon: 'refresh',
          label: t.resetBtn,
          onPress: () => {
            playChime('tap');
            resetPageReading();
          },
          colors: [theme.surfaceSecondary, theme.surfaceSecondary],
          tint: theme.textSecondary,
          borderColor: theme.border,
          showLabel: false,
        })}

        {/* Sparky Reads for Me (Echo Reading / Phonics Modeling) */}
        {renderDockAction({
          icon: isSparkyReading ? 'stop-circle' : 'volume-high',
          label: isSparkyReading ? t.pauseBtn : t.sparkyReadsBtn,
          onPress: handleSparkyReadAloud,
          colors: isSparkyReading
            ? theme.gradients.btnSparkyReads
            : themeMode === 'dark' ? ['#1E1B4B', '#312E81'] : ['#EEF2FF', '#E0E7FF'],
          tint: isSparkyReading ? '#ffffff' : themeMode === 'dark' ? '#C7D2FE' : '#4338CA',
          borderColor: isSparkyReading ? '#818CF8' : theme.border,
        })}

        {/* Hero Mic Read-Aloud Button with Radiant Sunset Gradient */}
        <TouchableOpacity
          style={[styles.heroMicTouch, isCompact && styles.heroMicTouchCompact]}
          onPress={() => {
            if (isReadingActive) {
              stopReadingSession();
              if (isSimulating) setIsSimulating(false);
            } else {
              startReadingSession();
            }
          }}
          activeOpacity={0.85}
          accessibilityLabel={isReadingActive ? t.stopReadingBtn : t.startReadingBtn}
        >
          <LinearGradient
            colors={isReadingActive ? theme.gradients.btnMicListening : theme.gradients.btnMicIdle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroMicButton,
              isReadingActive && styles.heroMicButtonActive,
              isCompact && styles.heroMicButtonCompact,
            ]}
          >
            <Ionicons name={isReadingActive ? 'stop-circle' : 'mic'} size={isCompact ? 20 : 22} color="#ffffff" />
            <Text style={[styles.heroMicText, isCompact && styles.heroMicTextCompact]} numberOfLines={1}>
              {isReadingActive ? t.stopReadingBtn : t.startReadingBtn}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 1-Click Simulation Demo with Amber Sunset Gradient */}
        {renderDockAction({
          icon: isSimulating ? 'pause' : 'play-forward',
          label: isSimulating ? t.pauseBtn : t.simulateDemoBtn,
          onPress: handleSimulateChildReading,
          colors: isSimulating
            ? theme.gradients.btnSimulate
            : themeMode === 'dark' ? ['#431407', '#2A0C03'] : ['#FFF7ED', '#FFEDD5'],
          tint: isSimulating ? '#ffffff' : theme.primary,
          borderColor: theme.borderActive,
        })}

        {/* Ask Sparky Voice Q&A Button (Meta Muse Voice Transcribe) */}
        {onOpenVoiceAsk &&
          renderDockAction({
            icon: 'sparkles',
            label: t.askVoiceBtnLabel,
            onPress: onOpenVoiceAsk,
            colors: themeMode === 'dark' ? ['#312e81', '#1e1b4b'] : ['#e0e7ff', '#ede9fe'],
            tint: themeMode === 'dark' ? '#C7D2FE' : '#4f46e5',
            borderColor: '#818cf8',
          })}
      </View>
      {/* Fullscreen Illustration Lightbox Modal */}
      <Modal
        visible={isImageZoomed}
        transparent
        animationType="fade"
        onRequestClose={() => setIsImageZoomed(false)}
      >
        <View style={styles.lightboxBackdrop}>
          <TouchableOpacity
            style={styles.lightboxCloseBtn}
            onPress={() => setIsImageZoomed(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={26} color="#ffffff" />
          </TouchableOpacity>
          <Image
            source={toImageSource(getStorySceneIllustrationUrl(page.title, page.imageUrl))}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
          <View style={styles.lightboxCaptionBox}>
            <Text style={styles.lightboxTitle}>{page.title}</Text>
            <Text style={styles.lightboxSubtitle}>{t.sceneArtDesc}</Text>
          </View>
        </View>
      </Modal>
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
  hudStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  hudStatText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
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
    top: -8,
    right: -6,
    zIndex: 10,
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
  wordTextStatus: {
    fontWeight: '700',
  },
  wordTextMispronounced: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  wordSkipped: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  wordTextSkipped: {
    opacity: 0.75,
  },
  miniTag: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  floatingDockCompact: {
    left: 12,
    right: 12,
    maxWidth: undefined,
    justifyContent: 'space-between',
    gap: 5,
    paddingHorizontal: 6,
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
  magicBookRibbon: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    marginBottom: 12,
  },
  dockButtonTouch: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  dockAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
  },
  dockActionIconOnly: {
    width: 40,
    height: 40,
    paddingHorizontal: 0,
  },
  dockActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroMicTouch: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  heroMicTouchCompact: {
    flex: 1,
  },
  heroMicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 28,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  heroMicButtonCompact: {
    paddingHorizontal: 10,
    gap: 5,
  },
  heroMicButtonActive: {
    shadowColor: '#dc2626',
  },
  heroMicText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  heroMicTextCompact: {
    fontSize: 12,
  },
  sceneToggleRow: {
    alignItems: 'center',
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
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    position: 'relative',
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  storySceneImage: {
    width: '100%',
    height: '100%',
  },
  sceneExpandBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  sceneHideBadge: {
    right: undefined,
    left: 14,
    width: 32,
    height: 32,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
    borderRadius: 16,
  },
  sceneExpandText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  storySceneGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  storySceneCaption: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  storySceneCaptionCompact: {
    fontSize: 15,
  },
  storySceneSub: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  lightboxImage: {
    width: '100%',
    height: '75%',
    borderRadius: 18,
  },
  lightboxCaptionBox: {
    marginTop: 16,
    alignItems: 'center',
  },
  lightboxTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  lightboxSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
});
