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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BookPage, WordToken, ReadingSessionResult, ReadingErrorDetail, SupportedLanguage } from '../types';
import {
  SpeechRecognitionController,
  matchSpokenWordToTokens,
  scoreTranscriptAgainstPage,
} from '../services/speechService';
import { speakText, stopSpeaking, playChime } from '../services/ttsService';
import { saveReadingSession, addStars, getCloudVoiceConsent } from '../services/storageService';
import { getTranslation } from '../i18n/translations';
import { toImageSource } from '../services/imageService';
import { getStoryTint } from '../data/sampleBooks';
import { SparkyMascot } from './SparkyMascot';
import { CelebrationConfetti } from './CelebrationConfetti';
import { useTheme } from '../context/ThemeContext';
import { FONTS } from '../styles/theme';

const OWL_MARK = require('../../assets/brand/owl-mark.png');

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
  const [voiceNotice, setVoiceNotice] = useState<string>('');
  const [moreVisible, setMoreVisible] = useState<boolean>(false);

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

  const startReadingSession = async () => {
    // Without live recognition only a consented Muse Voice transcript can score the reading
    const controller = speechControllerRef.current;
    if (controller && !controller.hasLiveRecognition() && !(await getCloudVoiceConsent())) {
      setVoiceNotice(t.voiceUnavailable);
      playChime('tap');
      return;
    }
    setVoiceNotice('');

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
      metaVerifiedAccuracyPercent: metaTranscript
        ? scoreTranscriptAgainstPage(metaTranscript, finalTokens, language).accuracyPercent
        : undefined,
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
    if (voiceNotice) {
      return voiceNotice;
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

  // Sparky flies along the progress line as words are read
  const flight = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(flight, { toValue: progressPercent, duration: 350, useNativeDriver: false }).start();
  }, [progressPercent]);
  const flightWidth = flight.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  // Pulsing ring around the mic so children can see Sparky is listening
  const micPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isReadingActive) {
      micPulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(micPulse, { toValue: 1, duration: 1400, useNativeDriver: Platform.OS !== 'web' })
    );
    loop.start();
    return () => loop.stop();
  }, [isReadingActive]);

  const renderDockAction = (action: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    accessibilityLabel: string;
    onPress: () => void;
    active?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.dockItem}
      onPress={action.onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
    >
      <View
        style={[
          styles.dockIconCircle,
          { backgroundColor: action.active ? theme.text : theme.surfaceSecondary },
        ]}
      >
        <Ionicons name={action.icon} size={20} color={action.active ? theme.bg : theme.text} />
      </View>
      <Text style={[styles.dockLabel, { color: theme.textSecondary }]} numberOfLines={1}>
        {action.label}
      </Text>
    </TouchableOpacity>
  );

  const sceneSource = page.imageUrl ? toImageSource(page.imageUrl) : null;
  const showArt = !!sceneSource && showSceneIllustration;
  const tint = getStoryTint(page) ?? theme.primary;
  const displayFont = Platform.OS === 'web' ? { fontFamily: FONTS.display } : null;
  const hasStarted = isReadingActive || currentIndex > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <CelebrationConfetti active={showConfetti} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Story cover: the illustration with the title on it, tinted in the story's own color */}
        <View style={[styles.hero, { backgroundColor: tint, height: showArt ? (isCompact ? 230 : 330) : undefined }]}>
          {showArt && sceneSource && (
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => setIsImageZoomed(true)}
              activeOpacity={0.95}
              accessibilityLabel={t.tapToEnlarge}
            >
              <Image source={sceneSource} style={styles.sceneImage} resizeMode="cover" />
            </TouchableOpacity>
          )}
          {showArt && (
            <LinearGradient
              pointerEvents="none"
              colors={['transparent', `${tint}F2`]}
              start={{ x: 0, y: 0.35 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {sceneSource && (
            <View style={styles.sceneActions}>
              <TouchableOpacity
                style={styles.sceneIconButton}
                onPress={() => {
                  playChime('tap');
                  setShowSceneIllustration(!showSceneIllustration);
                }}
                activeOpacity={0.8}
                accessibilityLabel={showSceneIllustration ? t.hideSceneArt : t.viewSceneArt}
              >
                <Ionicons name={showSceneIllustration ? 'eye-off-outline' : 'image-outline'} size={16} color="#ffffff" />
              </TouchableOpacity>
              {showArt && (
                <TouchableOpacity
                  style={styles.sceneIconButton}
                  onPress={() => setIsImageZoomed(true)}
                  activeOpacity={0.8}
                  accessibilityLabel={t.tapToEnlarge}
                >
                  <Ionicons name="expand-outline" size={16} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View pointerEvents="none" style={[styles.heroCaption, !showArt && styles.heroCaptionStatic]}>
            <Text style={[styles.heroTitle, displayFont]} numberOfLines={2}>
              {page.title}
            </Text>
            <Text style={styles.heroMeta} numberOfLines={1}>
              {page.source}
            </Text>
          </View>
        </View>

        {/* The page: paper laid over the cover; words only take color once they are read */}
        <View style={[styles.page, { backgroundColor: theme.paperCardBg, borderColor: theme.paperCardBorder }]}>
          <SparkyMascot
            size="small"
            mood={getMascotMood()}
            speechBubbleText={getMascotPrompt()}
            language={language}
            accent={tint}
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
                <TouchableOpacity
                  key={token.id || idx}
                  style={[
                    styles.word,
                    isCorrect && { backgroundColor: w.correctBg },
                    isHesitation && { backgroundColor: w.hesitationBg },
                    isMispronounced && { backgroundColor: w.mispronouncedBg },
                    isSkipped && [styles.wordSkipped, { borderColor: w.mispronouncedBorder }],
                    isCurrent && { backgroundColor: w.currentBg, borderBottomColor: w.currentBorder },
                    isCurrent && styles.wordCurrent,
                    readingRuler && isCurrent && styles.wordRuler,
                  ]}
                  onPress={() => handleWordTap(token)}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.wordText,
                      {
                        color: w.pendingText,
                        fontSize: fontScale.size,
                        lineHeight: fontScale.lineHeight,
                        letterSpacing: fontScale.letterSpacing,
                        ...(Platform.OS === 'web' ? { fontFamily: activeFontFamilyCss } : {}),
                      },
                      isCorrect && { color: w.correctText },
                      isHesitation && { color: w.hesitationText },
                      isMispronounced && [styles.wordTextMispronounced, { color: w.mispronouncedText }],
                      isSkipped && [styles.wordTextSkipped, { color: w.mispronouncedText }],
                      isCurrent && { color: w.currentText },
                    ]}
                  >
                    {displayWord}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Progress, with live stats once the child starts */}
          <View style={[styles.pageFooter, { borderTopColor: theme.borderLight }]}>
            <View style={styles.flightPath}>
              <View style={[styles.progressTrack, { backgroundColor: theme.surfaceSecondary }]}>
                <Animated.View style={[styles.progressFill, { width: flightWidth, backgroundColor: tint }]} />
              </View>
              <Animated.View style={[styles.flightOwl, { left: flightWidth, backgroundColor: tint, borderColor: theme.paperCardBg }]}>
                <Image source={OWL_MARK} style={styles.flightOwlImage} />
              </Animated.View>
              <View style={[styles.flightGoal, { borderColor: tint, backgroundColor: theme.paperCardBg }]}>
                <Ionicons name="star" size={12} color={progressPercent >= 100 ? tint : theme.textMuted} />
              </View>
            </View>
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>
                {currentIndex}/{tokens.length} {t.wordsLabel}
              </Text>
              {hasStarted && !isSparkyReading && (
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                  {wpm || '--'} WPM · {currentAccuracy}%
                </Text>
              )}
            </View>
            {hasStarted && (
              <View style={styles.legendRow}>
                {[
                  { color: theme.words.correctBorder, label: t.legendCorrect },
                  { color: theme.words.hesitationBorder, label: t.legendHesitation },
                  { color: theme.words.mispronouncedBorder, label: t.legendMispronounced },
                ].map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendLabel, { color: theme.textMuted }]}>{item.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* What the speech service heard, while listening */}
        {recentSpokenText && isListening ? (
          <Text style={[styles.heardText, { color: theme.textMuted }]} numberOfLines={1}>
            {t.sparkyHeard} "{recentSpokenText}"
          </Text>
        ) : null}

        {/* Spacing for the floating dock */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Dock: Listen · Read · Ask, with Demo and Restart under More */}
      <View style={[styles.dock, { backgroundColor: theme.dockBg, borderColor: theme.dockBorder }]}>
        {renderDockAction({
          icon: isSparkyReading ? 'stop' : 'volume-high-outline',
          label: isSparkyReading ? t.dockStop : t.dockListen,
          accessibilityLabel: isSparkyReading ? t.pauseBtn : t.sparkyReadsBtn,
          onPress: handleSparkyReadAloud,
          active: isSparkyReading,
        })}

        {/* Read: the one big action, with a pulsing ring while listening */}
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => {
            if (isReadingActive) {
              stopReadingSession();
              if (isSimulating) setIsSimulating(false);
            } else {
              startReadingSession();
            }
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isReadingActive ? t.stopReadingBtn : t.startReadingBtn}
        >
          <View style={styles.micWrap}>
            {isReadingActive && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.micPulse,
                  {
                    borderColor: theme.gradients.btnMicListening[0],
                    opacity: micPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                    transform: [{ scale: micPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
                  },
                ]}
              />
            )}
            <View
              style={[
                styles.micButton,
                {
                  backgroundColor: isReadingActive ? theme.gradients.btnMicListening[0] : tint,
                  borderColor: theme.bg,
                },
              ]}
            >
              <Ionicons name={isReadingActive ? 'stop' : 'mic'} size={28} color="#ffffff" />
            </View>
          </View>
          <Text style={[styles.micLabel, { color: theme.text }]} numberOfLines={1}>
            {isReadingActive ? t.dockStop : t.dockRead}
          </Text>
        </TouchableOpacity>

        {onOpenVoiceAsk &&
          renderDockAction({
            icon: 'chatbubble-ellipses-outline',
            label: t.dockAsk,
            accessibilityLabel: t.askVoiceBtnLabel,
            onPress: onOpenVoiceAsk,
          })}

        {renderDockAction({
          icon: 'ellipsis-horizontal',
          label: t.dockMore,
          accessibilityLabel: t.dockMore,
          onPress: () => {
            playChime('tap');
            setMoreVisible(true);
          },
        })}
      </View>

      {/* More: secondary actions kept out of the child's way */}
      <Modal visible={moreVisible} transparent animationType="fade" onRequestClose={() => setMoreVisible(false)}>
        <TouchableOpacity
          style={[styles.sheetBackdrop, { backgroundColor: theme.modalBackdrop }]}
          activeOpacity={1}
          onPress={() => setMoreVisible(false)}
        >
          <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {[
              {
                icon: isSimulating ? ('pause' as const) : ('play-forward-outline' as const),
                label: isSimulating ? t.pauseBtn : t.simulateDemoBtn,
                onPress: handleSimulateChildReading,
              },
              {
                icon: 'refresh' as const,
                label: t.resetBtn,
                onPress: () => {
                  playChime('tap');
                  resetPageReading();
                },
              },
            ].map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.sheetItem, idx === 0 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight }]}
                onPress={() => {
                  setMoreVisible(false);
                  item.onPress();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={20} color={theme.text} />
                <Text style={[styles.sheetLabel, { color: theme.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Fullscreen illustration */}
      <Modal visible={isImageZoomed} transparent animationType="fade" onRequestClose={() => setIsImageZoomed(false)}>
        <View style={styles.lightboxBackdrop}>
          <TouchableOpacity style={styles.lightboxCloseBtn} onPress={() => setIsImageZoomed(false)} activeOpacity={0.8}>
            <Ionicons name="close" size={26} color="#ffffff" />
          </TouchableOpacity>
          {sceneSource && <Image source={sceneSource} style={styles.lightboxImage} resizeMode="contain" />}
          <Text style={[styles.lightboxTitle, displayFont]}>
            {page.title}
          </Text>
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  sceneImage: {
    width: '100%',
    height: '100%',
  },
  sceneActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  sceneIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(20, 17, 14, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCaption: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 52,
  },
  heroCaptionStatic: {
    paddingTop: 22,
    paddingRight: 110,
  },
  heroTitle: {
    color: '#FFFCF6',
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '700',
  },
  heroMeta: {
    color: 'rgba(255, 252, 246, 0.82)',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  page: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 16,
    marginTop: -52,
    marginHorizontal: 10,
    shadowColor: '#2B2620',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  tokensContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 2,
    rowGap: 4,
  },
  word: {
    paddingHorizontal: 5,
    borderRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  wordCurrent: {
    borderBottomWidth: 3,
  },
  wordRuler: {
    borderBottomWidth: 4,
  },
  wordSkipped: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  wordText: {
    fontWeight: '600',
  },
  wordTextMispronounced: {
    textDecorationLine: 'underline',
  },
  wordTextSkipped: {
    opacity: 0.75,
  },
  pageFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  flightPath: {
    height: 30,
    justifyContent: 'center',
    marginHorizontal: 13,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  flightOwl: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightOwlImage: {
    width: 20,
    height: 20,
  },
  flightGoal: {
    position: 'absolute',
    right: -13,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
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
  legendLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  heardText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  dock: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    maxWidth: 440,
    marginHorizontal: 'auto',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 24,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(14px)' } : {}),
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  dockIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  micWrap: {
    marginTop: -28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micPulse: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
  },
  micButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micLabel: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 110,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
  },
  sheetLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 17, 14, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  lightboxImage: {
    width: '100%',
    height: '72%',
    borderRadius: 18,
  },
  lightboxTitle: {
    color: '#F3ECDF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
});
