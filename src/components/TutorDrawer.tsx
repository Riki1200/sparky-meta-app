import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ComprehensionQuestion, ReadingSessionResult, WordExplanation, SupportedLanguage } from '../types';
import {
  explainWordWithMuseSpark,
  generateTutorSpokenFeedback,
  generateComprehensionQuiz,
  transcribeAudioWithMuseVoice,
  answerChildVoiceQuestionWithSparky,
} from '../services/metaApi';
import { speakText, speakWordPhonetically, playChime, stopSpeaking, getSparkyVoiceSample } from '../services/ttsService';
import { addStars, getCloudVoiceConsent } from '../services/storageService';
import { SpeechRecognitionController } from '../services/speechService';
import { getTranslation } from '../i18n/translations';
import { getWordIllustration, toImageSource } from '../services/imageService';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, DISPLAY_FONT } from '../styles/theme';
import { SparkyMascot } from './SparkyMascot';

interface TutorDrawerProps {
  visible: boolean;
  mode: 'explain' | 'celebrate' | 'quiz' | 'ask';
  selectedWord?: string;
  sentenceContext?: string;
  sessionResult?: ReadingSessionResult;
  pageText?: string;
  language: SupportedLanguage;
  onClose: () => void;
  onViewReport?: () => void;
  onSwitchMode?: (newMode: 'explain' | 'celebrate' | 'quiz' | 'ask') => void;
}

export const TutorDrawer: React.FC<TutorDrawerProps> = ({
  visible,
  mode,
  selectedWord,
  sentenceContext,
  sessionResult,
  pageText,
  language,
  onClose,
  onViewReport,
  onSwitchMode,
}) => {
  const t = getTranslation(language);
  const { theme, themeMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Word Explainer state
  const [explanation, setExplanation] = useState<WordExplanation | null>(null);
  const [loadingWord, setLoadingWord] = useState(false);
  const [activeSyllable, setActiveSyllable] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const wordPicture = selectedWord ? getWordIllustration(selectedWord) : null;

  // Spoken feedback state
  const [spokenFeedback, setSpokenFeedback] = useState<string>('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState<ComprehensionQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Voice Ask state (Meta Muse Voice Transcribe + Muse Spark)
  const [isRecordingQuestion, setIsRecordingQuestion] = useState(false);
  const [isTranscribingQuestion, setIsTranscribingQuestion] = useState(false);
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [userQuestionTranscript, setUserQuestionTranscript] = useState('');
  const [sparkyAnswerText, setSparkyAnswerText] = useState('');
  const voiceRecorderRef = React.useRef<any>(null);
  const voiceChunksRef = React.useRef<Blob[]>([]);
  const localRecognizerRef = React.useRef<SpeechRecognitionController | null>(null);
  const localQuestionTextRef = React.useRef<() => string>(() => '');
  const [cloudVoiceAllowed, setCloudVoiceAllowed] = useState(false);
  const usesMuseVoice = mode === 'ask' && cloudVoiceAllowed;

  useEffect(() => {
    if (!visible) {
      // Never keep the microphone open after the drawer closes
      localRecognizerRef.current?.stopListening();
      localRecognizerRef.current = null;
      setIsRecordingQuestion(false);
      return;
    }
    getCloudVoiceConsent().then(setCloudVoiceAllowed);

    if (mode === 'explain' && selectedWord) {
      loadWordExplanation();
    } else if (mode === 'celebrate' && sessionResult) {
      loadTutorCelebration();
    } else if (mode === 'quiz' && pageText) {
      loadQuiz();
    }
  }, [visible, mode, selectedWord, sessionResult, pageText, language]);

  const loadWordExplanation = async () => {
    if (!selectedWord) return;
    setLoadingWord(true);
    setExplanation(null);
    setActiveSyllable(null);
    setImageError(false);
    try {
      const res = await explainWordWithMuseSpark(selectedWord, sentenceContext || selectedWord, language);
      setExplanation(res);
      // Auto-pronounce word
      speakWordPhonetically(selectedWord, language);
    } catch (e) {
      console.warn('Word explanation error:', e);
    } finally {
      setLoadingWord(false);
    }
  };

  const loadTutorCelebration = async () => {
    if (!sessionResult) return;
    setLoadingFeedback(true);
    try {
      const feedback = await generateTutorSpokenFeedback(sessionResult);
      setSpokenFeedback(feedback);
      setIsPlayingAudio(true);
      speakText(feedback, language, 0.88, () => setIsPlayingAudio(false));
    } catch (e) {
      console.warn('Celebration feedback error:', e);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const loadQuiz = async () => {
    if (!pageText) return;
    setLoadingQuiz(true);
    setSelectedAnswers({});
    setQuizScore(null);
    try {
      const q = await generateComprehensionQuiz(pageText, language);
      setQuestions(q);
    } catch (e) {
      console.warn('Quiz generation error:', e);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectOption = async (questionIdx: number, optionIdx: number) => {
    if (selectedAnswers[questionIdx] !== undefined) return;
    const updated = { ...selectedAnswers, [questionIdx]: optionIdx };
    setSelectedAnswers(updated);

    const isCorrect = optionIdx === questions[questionIdx].correctIndex;
    if (isCorrect) {
      playChime('correct');
      await addStars(2); // +2 stars per correct quiz answer
    } else {
      playChime('tap');
    }

    // Check if quiz finished
    if (Object.keys(updated).length === questions.length) {
      let score = 0;
      questions.forEach((q, idx) => {
        if (updated[idx] === q.correctIndex) score += 1;
      });
      setQuizScore(score);
      if (score === questions.length) {
        playChime('complete');
      }
    }
  };

  const handlePlayVoice = (text: string) => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    speakText(text, language, 0.88, () => setIsPlayingAudio(false));
  };

  const handleRegenerateSpokenFeedback = async () => {
    if (!sessionResult) return;
    stopSpeaking();
    setIsPlayingAudio(false);
    setLoadingFeedback(true);
    playChime('sparkle');
    try {
      const feedback = await generateTutorSpokenFeedback(sessionResult);
      setSpokenFeedback(feedback);
      setIsPlayingAudio(true);
      speakText(feedback, language, 0.88, () => setIsPlayingAudio(false));
    } catch (e) {
      console.warn('Feedback regeneration error:', e);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleTapSyllable = (syl: string) => {
    setActiveSyllable(syl);
    playChime('tap');
    speakText(syl, language, 0.75);
    setTimeout(() => setActiveSyllable(null), 800);
  };

  const getSyllableList = (sylString: string) => {
    return sylString
      .split(/[·\-\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const answerVoiceQuestion = async (transcribedText: string) => {
    setIsTranscribingQuestion(false);

    if (!transcribedText) {
      setUserQuestionTranscript('...');
      setSparkyAnswerText(t.couldNotHearVoice);
      return;
    }

    setUserQuestionTranscript(transcribedText);
    setIsAnsweringQuestion(true);

    const answer = await answerChildVoiceQuestionWithSparky(
      transcribedText,
      pageText || sentenceContext || selectedWord || '',
      language
    );

    setSparkyAnswerText(answer);
    setIsAnsweringQuestion(false);
    playChime('sparkle');
    speakText(answer, language, 0.88);
  };

  const startVoiceQuestionRecording = async () => {
    setUserQuestionTranscript('');
    setSparkyAnswerText('');

    // Without parent permission for Meta Muse Voice, the question is recognized by the
    // device/browser speech service and no audio is sent to the cloud
    if (!(await getCloudVoiceConsent())) {
      const recognizer = new SpeechRecognitionController(language);
      const finalParts: string[] = [];
      let interimPart = '';
      localQuestionTextRef.current = () => [...finalParts, interimPart].join(' ').trim();
      recognizer.onWordSpoken = (text, isFinal) => {
        if (isFinal) {
          finalParts.push(text);
          interimPart = '';
        } else {
          interimPart = text;
        }
      };
      recognizer.startListening();
      localRecognizerRef.current = recognizer;
      setIsRecordingQuestion(true);
      playChime('tap');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('Microphone not supported on this device');
      return;
    }

    try {
      voiceChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceRecorderRef.current = recorder;

      recorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) {
          voiceChunksRef.current.push(e.data);
        }
      };

      recorder.start(500);
      setIsRecordingQuestion(true);
      playChime('tap');
    } catch (err) {
      console.warn('Could not start voice question recording:', err);
      setIsRecordingQuestion(false);
    }
  };

  const stopVoiceQuestionRecording = async () => {
    setIsRecordingQuestion(false);
    setIsTranscribingQuestion(true);
    playChime('tap');

    if (localRecognizerRef.current) {
      localRecognizerRef.current.stopListening();
      localRecognizerRef.current = null;
      // Give the speech service a moment to deliver its final result
      setTimeout(() => {
        answerVoiceQuestion(localQuestionTextRef.current()).catch((err) => {
          console.warn('Voice Q&A workflow error:', err);
          setIsTranscribingQuestion(false);
          setIsAnsweringQuestion(false);
        });
      }, 600);
      return;
    }

    const recorder = voiceRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch (e) {
        // ignore
      }
    }
    recorder?.stream?.getTracks().forEach((track: any) => track.stop());

    setTimeout(async () => {
      try {
        const audioBlob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        const transcribedText = await transcribeAudioWithMuseVoice(audioBlob, language);
        await answerVoiceQuestion(transcribedText);
      } catch (err) {
        console.warn('Voice Q&A workflow error:', err);
        setIsTranscribingQuestion(false);
        setIsAnsweringQuestion(false);
      }
    }, 400);
  };

  const getMascotMood = () => {
    if (mode === 'celebrate' || quizScore === questions.length) return 'celebrating';
    if (loadingWord || loadingQuiz || loadingFeedback || isTranscribingQuestion || isAnsweringQuestion) return 'thinking';
    if (isRecordingQuestion) return 'encouraging';
    return 'encouraging';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Top Grab Handle */}
          <View style={styles.handleBar} />

          {/* Top Bar with Sparky Mascot */}
          <View style={styles.sheetHeader}>
            <View style={styles.tutorAvatarBadge}>
              <SparkyMascot size="small" mood={getMascotMood()} onPress={() => playChime('sparkle')} />
              <View>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.tutorName}>{t.tutorTitle}</Text>
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={10} color={theme.primary} />
                    <Text style={styles.aiBadgeText}>
                      {usesMuseVoice ? 'Muse Voice + Spark' : 'Meta Muse Spark'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation Header */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabBarScroll}
            contentContainerStyle={styles.tabBarRow}
          >
            {selectedWord && (
              <TouchableOpacity
                style={[styles.tabChip, mode === 'explain' && styles.tabChipActive]}
                onPress={() => onSwitchMode && onSwitchMode('explain')}
                activeOpacity={0.7}
              >
                <Ionicons name="book" size={12} color={mode === 'explain' ? '#ffffff' : theme.textSecondary} />
                <Text style={[styles.tabChipText, mode === 'explain' && styles.tabChipTextActive]}>
                  {t.tabExplain}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.tabChip, mode === 'ask' && styles.tabChipActive]}
              onPress={() => onSwitchMode && onSwitchMode('ask')}
              activeOpacity={0.7}
            >
              <Ionicons name="mic" size={12} color={mode === 'ask' ? '#ffffff' : theme.textSecondary} />
              <Text style={[styles.tabChipText, mode === 'ask' && styles.tabChipTextActive]}>
                {t.tabAskVoice}
              </Text>
            </TouchableOpacity>
            {pageText && (
              <TouchableOpacity
                style={[styles.tabChip, mode === 'quiz' && styles.tabChipActive]}
                onPress={() => onSwitchMode && onSwitchMode('quiz')}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle" size={12} color={mode === 'quiz' ? '#ffffff' : theme.textSecondary} />
                <Text style={[styles.tabChipText, mode === 'quiz' && styles.tabChipTextActive]}>
                  {t.tabQuiz}
                </Text>
              </TouchableOpacity>
            )}
            {sessionResult && (
              <TouchableOpacity
                style={[styles.tabChip, mode === 'celebrate' && styles.tabChipActive]}
                onPress={() => onSwitchMode && onSwitchMode('celebrate')}
                activeOpacity={0.7}
              >
                <Ionicons name="trophy" size={12} color={mode === 'celebrate' ? '#ffffff' : theme.textSecondary} />
                <Text style={[styles.tabChipText, mode === 'celebrate' && styles.tabChipTextActive]}>
                  {t.tabFeedback}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <ScrollView style={styles.sheetBody} contentContainerStyle={styles.sheetContent}>
            {/* 1. WORD EXPLAINER MODE */}
            {mode === 'explain' && (
              <View style={styles.explainSection}>
                {/* Word Banner with 3D Listen Button */}
                <View style={styles.wordHeaderCard}>
                  <View>
                    <Text style={styles.targetWordLabel}>{t.wordPracticeLabel}</Text>
                    <Text style={styles.targetWordDisplay}>{selectedWord}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.listenWordButton}
                    onPress={() => selectedWord && speakWordPhonetically(selectedWord, language)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="volume-high" size={20} color="#ffffff" />
                    <Text style={styles.listenWordText}>{t.pronounceAudio}</Text>
                  </TouchableOpacity>
                </View>

                {/* Visual Picture Dictionary / AI Storybook Illustration Card */}
                {wordPicture && !imageError && (
                  <View style={[styles.illustrationCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    <Image
                      source={toImageSource(wordPicture)}
                      style={styles.illustrationImage}
                      resizeMode="cover"
                      onError={() => setImageError(true)}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(15, 23, 42, 0.82)']}
                      start={{ x: 0, y: 0.35 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.illustrationGradientOverlay}
                    >
                      <View style={styles.illustrationTagRow}>
                        <View style={styles.illustrationAiChip}>
                          <Ionicons name="color-palette" size={11} color="#ffffff" />
                          <Text style={styles.illustrationAiChipText}>
                            {t.aiPictureDictionary}
                          </Text>
                        </View>
                        <Text style={styles.illustrationWordCaption} numberOfLines={1}>
                          {selectedWord}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                )}

                {loadingWord ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>
                      {t.preparingExplanation}
                    </Text>
                  </View>
                ) : explanation ? (
                  <View style={styles.explanationCards}>
                    {/* Interactive Syllable Chips */}
                    <View style={styles.syllablesCard}>
                      <Text style={styles.cardSmallLabel}>
                        {t.wordSyllables.toUpperCase()} ({t.tapToHear}):
                      </Text>
                      <View style={styles.syllablesChipRow}>
                        {getSyllableList(explanation.syllables).map((syl, sIdx) => {
                          const isSylActive = activeSyllable === syl;
                          return (
                            <TouchableOpacity
                              key={sIdx}
                              style={[styles.syllableChip, isSylActive && styles.syllableChipActive]}
                              onPress={() => handleTapSyllable(syl)}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.syllableChipText,
                                  isSylActive && styles.syllableChipTextActive,
                                ]}
                              >
                                {syl}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Simple Kid Meaning */}
                    <View style={styles.meaningCard}>
                      <View style={styles.iconHeadingRow}>
                        <View style={[styles.iconCircleMini, { backgroundColor: theme.surfaceSecondary }]}>
                          <Ionicons name="bulb" size={16} color={theme.badges.starBadgeText} />
                        </View>
                        <Text style={styles.cardHeading}>{t.wordMeaning}</Text>
                      </View>
                      <Text style={styles.meaningText}>{explanation.simpleMeaning}</Text>
                    </View>

                    {/* Fun Example Analogy */}
                    <View style={styles.exampleCard}>
                      <View style={styles.iconHeadingRow}>
                        <View style={[styles.iconCircleMini, { backgroundColor: theme.surfaceSecondary }]}>
                          <Ionicons name="sparkles" size={16} color={theme.primary} />
                        </View>
                        <Text style={styles.cardHeading}>{t.wordExample}</Text>
                      </View>
                      <Text style={styles.exampleText}>"{explanation.funExample}"</Text>
                    </View>

                    {/* Warm Encouragement Card */}
                    <View style={styles.cheerCard}>
                      <Text style={styles.cheerText}>{explanation.encouragement}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            {/* 2. CELEBRATION & COMPLETION MODE */}
            {mode === 'celebrate' && sessionResult && (
              <View style={styles.celebrateSection}>
                <View style={styles.celebrateHeader}>
                  <LinearGradient
                    colors={[theme.badges.starBadgeText, theme.badges.starBadgeText, theme.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.celebrateIconCircle}
                  >
                    <Ionicons name="trophy" size={34} color="#ffffff" />
                  </LinearGradient>
                  <Text style={styles.celebrateTitle}>{t.celebrationTitle}</Text>
                  <Text style={styles.celebrateSubtitle}>
                    {t.celebrationSubtitle} ({sessionResult.totalWords} {t.wordsRead.toLowerCase()})
                  </Text>
                  <View style={styles.starsRewardPill}>
                    <Text style={styles.starsRewardText}>{t.starsAddedBadge}</Text>
                  </View>
                </View>

                {/* Score Gauges */}
                <View style={styles.statsPillRow}>
                  <View style={styles.statPill}>
                    <Text style={styles.statPillValue}>{sessionResult.accuracyPercent}%</Text>
                    <Text style={styles.statPillLabel}>{t.accuracyLabel}</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statPillValue}>{sessionResult.wordsPerMinute}</Text>
                    <Text style={styles.statPillLabel}>{t.speedWpm}</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statPillValue}>{sessionResult.correctWords}</Text>
                    <Text style={styles.statPillLabel}>{t.legendCorrect}</Text>
                  </View>
                  {sessionResult.metaVerifiedAccuracyPercent != null && (
                    <View style={[styles.statPill, { borderColor: theme.accent }]}>
                      <Text style={[styles.statPillValue, { color: theme.accent }]}>
                        {sessionResult.metaVerifiedAccuracyPercent}%
                      </Text>
                      <Text style={styles.statPillLabel}>{t.metaCheckShort}</Text>
                    </View>
                  )}
                </View>

                {/* Spoken Feedback from Meta Muse Spark */}
                <View style={styles.spokenFeedbackCard}>
                  <View style={styles.spokenHeaderRow}>
                    <View style={styles.spokenHeaderLeft}>
                      <Ionicons name="chatbubble-ellipses" size={20} color={theme.primary} />
                      <View style={styles.spokenTitleCol}>
                        <Text style={styles.spokenTitle}>{t.spokenFeedbackTitle}</Text>
                        <View style={styles.spokenMuseBadge}>
                          <Ionicons name="sparkles" size={10} color={theme.primary} />
                          <Text style={styles.spokenMuseBadgeText}>Meta Muse Spark 1.3 • Audio</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.spokenActionsGroup}>
                      <TouchableOpacity
                        style={[
                          styles.replayAudioBtn,
                          { backgroundColor: isPlayingAudio ? theme.gradients.btnMicListening[0] : theme.primary },
                        ]}
                        onPress={() => handlePlayVoice(spokenFeedback || getSparkyVoiceSample(language))}
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
                        style={styles.refreshSpokenBtn}
                        onPress={handleRegenerateSpokenFeedback}
                        disabled={loadingFeedback}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="refresh" size={13} color={theme.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {loadingFeedback ? (
                    <View style={styles.spokenLoadingRow}>
                      <ActivityIndicator size="small" color={theme.primary} />
                      <Text style={styles.spokenLoadingText}>
                        {t.generatingCheer}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.feedbackBodyText}>
                      "{spokenFeedback || getSparkyVoiceSample(language)}"
                    </Text>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsCol}>
                  <TouchableOpacity
                    style={styles.quizActionBtn}
                    onPress={() => loadQuiz()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="help-circle" size={20} color="#ffffff" />
                    <Text style={styles.quizActionText}>{t.quizTitle}</Text>
                  </TouchableOpacity>

                  {onViewReport && (
                    <TouchableOpacity
                      style={styles.reportActionBtn}
                      onPress={() => {
                        onClose();
                        onViewReport();
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="bar-chart" size={18} color={theme.text} />
                      <Text style={styles.reportActionText}>{t.viewReportBtn}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* 3. COMPREHENSION QUIZ MODE */}
            {(mode === 'quiz' || questions.length > 0) && (
              <View style={styles.quizSection}>
                <View style={styles.quizHeader}>
                  <Text style={styles.quizTitle}>{t.quizTitle}</Text>
                  <Text style={styles.quizSubtitle}>{t.quizSubtitle}</Text>
                </View>

                {loadingQuiz ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>
                      {t.craftingQuiz}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.questionsList}>
                    {questions.map((q, qIdx) => {
                      const answered = selectedAnswers[qIdx] !== undefined;
                      const selectedOpt = selectedAnswers[qIdx];

                      return (
                        <View key={q.id || qIdx} style={styles.questionCard}>
                          <Text style={styles.questionNumber}>
                            Question {qIdx + 1}
                          </Text>
                          <Text style={styles.questionText}>{q.question}</Text>

                          <View style={styles.optionsList}>
                            {q.options.map((opt, optIdx) => {
                              const isThisSelected = selectedOpt === optIdx;
                              const isCorrect = optIdx === q.correctIndex;

                              let optStyle = styles.optionBtn;
                              if (answered) {
                                if (isCorrect) optStyle = styles.optionBtnCorrect;
                                else if (isThisSelected) optStyle = styles.optionBtnIncorrect;
                              }

                              return (
                                <TouchableOpacity
                                  key={optIdx}
                                  style={[styles.optionBase, optStyle]}
                                  onPress={() => handleSelectOption(qIdx, optIdx)}
                                  disabled={answered}
                                  activeOpacity={0.8}
                                >
                                  <View style={styles.optionLetterBadge}>
                                    <Text style={styles.optionLetter}>
                                      {String.fromCharCode(65 + optIdx)}
                                    </Text>
                                  </View>
                                  <Text style={styles.optionLabel}>{opt}</Text>
                                  {answered && isCorrect && (
                                    <Ionicons name="checkmark-circle" size={20} color={theme.badges.kpiAccuracyText} />
                                  )}
                                  {answered && isThisSelected && !isCorrect && (
                                    <Ionicons name="close-circle" size={20} color={theme.gradients.btnMicListening[0]} />
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {answered && (
                            <View style={styles.explanationBox}>
                              <Ionicons name="information-circle" size={16} color={theme.primary} />
                              <Text style={styles.explanationBoxText}>{q.explanation}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {quizScore !== null && (
                      <View style={styles.quizScoreCard}>
                        <Ionicons
                          name={quizScore === questions.length ? 'trophy' : 'thumbs-up'}
                          size={34}
                          color={theme.badges.starBadgeText}
                          style={styles.quizScoreIcon}
                        />
                        <Text style={styles.quizScoreTitle}>
                          {t.quizScoreResult
                            .replace('{score}', String(quizScore))
                            .replace('{total}', String(questions.length))}
                        </Text>
                        <Text style={styles.quizScoreDesc}>
                          {quizScore === questions.length
                            ? t.quizPassed
                            : 'Great effort! Daily practice builds reading comprehension.'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* 4. VOICE ASK WITH SPARKY (Meta Muse Voice Transcribe + Muse Spark) */}
            {mode === 'ask' && (
              <View style={styles.voiceAskSection}>
                <View style={[styles.voiceHeroCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  <View style={styles.voiceHeroHeader}>
                    <Ionicons name="mic-circle" size={36} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.voiceHeroTitle, { color: theme.text }]}>
                        {t.askVoiceTitle}
                      </Text>
                      {cloudVoiceAllowed && (
                        <Text style={[styles.voiceHeroSubtitle, { color: theme.textMuted }]}>
                          {t.askVoiceSubtitle}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Big Microphone Recording Action */}
                  <View style={styles.voiceMicContainer}>
                    <TouchableOpacity
                      style={[
                        styles.voiceMicButtonTouch,
                        isRecordingQuestion && styles.voiceMicButtonPulsing,
                      ]}
                      onPress={isRecordingQuestion ? stopVoiceQuestionRecording : startVoiceQuestionRecording}
                      accessibilityLabel={isRecordingQuestion ? t.askVoiceStopBtn : t.tabAskVoice}
                      activeOpacity={0.8}
                      disabled={isTranscribingQuestion || isAnsweringQuestion}
                    >
                      <LinearGradient
                        colors={
                          isRecordingQuestion
                            ? [theme.gradients.btnMicListening[0], theme.gradients.btnMicListening[0]]
                            : [theme.primary, theme.primary]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.voiceMicGradient}
                      >
                        <Ionicons
                          name={isRecordingQuestion ? 'stop' : 'mic'}
                          size={36}
                          color="#ffffff"
                        />
                      </LinearGradient>
                    </TouchableOpacity>

                    <Text style={[styles.voiceMicInstruction, { color: theme.text }]}>
                      {isRecordingQuestion
                        ? t.askVoicePromptListening
                        : isTranscribingQuestion
                        ? t.askVoiceTranscribing
                        : isAnsweringQuestion
                        ? t.askVoiceThinking
                        : t.askVoicePromptIdle}
                    </Text>

                    {isRecordingQuestion && (
                      <TouchableOpacity
                        style={styles.voiceDoneButton}
                        onPress={stopVoiceQuestionRecording}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.voiceDoneButtonText}>{t.askVoiceStopBtn}</Text>
                      </TouchableOpacity>
                    )}

                    {(isTranscribingQuestion || isAnsweringQuestion) && (
                      <View style={styles.voiceLoadingRow}>
                        <ActivityIndicator size="small" color={theme.primary} />
                        <Text style={[styles.voiceLoadingText, { color: theme.textMuted }]}>
                          {isTranscribingQuestion
                            ? t.askVoiceTranscribing
                            : t.askVoiceThinking}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Dialogue Bubbles */}
                  {userQuestionTranscript ? (
                    <View style={styles.dialogueContainer}>
                      {/* Child question bubble */}
                      <View style={styles.childQuestionBubble}>
                        <View style={styles.bubbleTagRow}>
                          <Ionicons name="mic" size={13} color={theme.primary} />
                          <Text style={styles.bubbleAuthorTag}>{t.askVoiceYouAsked}</Text>
                        </View>
                        <Text style={styles.childQuestionText}>"{userQuestionTranscript}"</Text>
                      </View>

                      {/* Sparky response bubble */}
                      {sparkyAnswerText ? (
                        <View
                          style={[
                            styles.sparkyAnswerBubble,
                            { backgroundColor: theme.surfaceSecondary },
                          ]}
                        >
                          <View style={styles.bubbleTagRow}>
                            <SparkyMascot size="small" mood="encouraging" />
                            <Text style={styles.sparkyAuthorTag}>{t.askVoiceSparkyAnswered}</Text>
                          </View>
                          <Text style={[styles.sparkyAnswerText, { color: theme.text }]}>
                            {sparkyAnswerText}
                          </Text>

                          <View style={styles.bubbleActionsRow}>
                            <TouchableOpacity
                              style={styles.bubbleListenBtn}
                              onPress={() => speakText(sparkyAnswerText, language, 0.88)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="volume-high" size={15} color={theme.primary} />
                              <Text style={styles.bubbleListenText}>{t.listenToSparky}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.bubbleAskAnotherBtn}
                              onPress={() => {
                                setUserQuestionTranscript('');
                                setSparkyAnswerText('');
                                startVoiceQuestionRecording();
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="refresh" size={15} color={theme.textSecondary} />
                              <Text style={styles.bubbleAskAnotherText}>{t.askVoiceAskAnother}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {/* Quick example chips */}
                  {!isRecordingQuestion && !userQuestionTranscript && (
                    <View style={styles.presetQuestionsSection}>
                      <Text style={[styles.presetQuestionsTitle, { color: theme.textMuted }]}>
                        {t.exampleQuestionsTitle}
                      </Text>
                      <View style={styles.presetChipsWrap}>
                        {[t.exampleQ1, t.exampleQ2, t.exampleQ3].map((preset, pIdx) => (
                          <TouchableOpacity
                            key={pIdx}
                            style={[
                              styles.presetChip,
                              { backgroundColor: theme.surface, borderColor: theme.border },
                            ]}
                            onPress={async () => {
                              setUserQuestionTranscript(preset);
                              setIsAnsweringQuestion(true);
                              playChime('tap');
                              const answer = await answerChildVoiceQuestionWithSparky(
                                preset,
                                pageText || sentenceContext || selectedWord || '',
                                language
                              );
                              setSparkyAnswerText(answer);
                              setIsAnsweringQuestion(false);
                              playChime('sparkle');
                              speakText(answer, language, 0.88);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.presetChipText, { color: theme.text }]}>{preset}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Styles read storybook theme tokens, so light and night mode share one definition
const createStyles = (theme: ThemeColors) => {
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '88%',
    minHeight: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  tutorAvatarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tutorName: {
    ...DISPLAY_FONT,
    fontSize: 18,
    fontWeight: '900',
    color: theme.text,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  aiBadgeText: {
    color: theme.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  modelPowered: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 1,
    fontWeight: '500',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    flex: 1,
  },
  sheetContent: {
    padding: 22,
    paddingBottom: 40,
  },
  explainSection: {
    gap: 16,
  },
  wordHeaderCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  targetWordLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetWordDisplay: {
    ...DISPLAY_FONT,
    fontSize: 26,
    fontWeight: '900',
    color: theme.text,
    marginTop: 2,
  },
  listenWordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomWidth: 3,
    borderBottomColor: theme.primary,
  },
  listenWordText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 280,
  },
  explanationCards: {
    gap: 14,
  },
  syllablesCard: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  cardSmallLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 8,
  },
  syllablesChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  syllableChip: {
    backgroundColor: theme.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderBottomWidth: 3,
    borderBottomColor: theme.border,
  },
  syllableChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  syllableChipText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  syllableChipTextActive: {
    color: '#ffffff',
  },
  meaningCard: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  iconHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconCircleMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.text,
  },
  meaningText: {
    fontSize: 15,
    color: theme.text,
    lineHeight: 22,
    fontWeight: '600',
  },
  exampleCard: {
    backgroundColor: theme.badges.kpiAccuracyBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: theme.words.correctBorder,
  },
  exampleText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: theme.text,
    lineHeight: 22,
    fontWeight: '600',
  },
  cheerCard: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: theme.border,
    alignItems: 'center',
  },
  cheerText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
  },
  celebrateSection: {
    gap: 16,
  },
  celebrateHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  celebrateIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: theme.badges.starBadgeText,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  celebrateTitle: {
    ...DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '900',
    color: theme.text,
  },
  celebrateSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  starsRewardPill: {
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  starsRewardText: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.badges.starBadgeText,
  },
  statsPillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  statPillValue: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.text,
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textSecondary,
    marginTop: 2,
  },
  spokenFeedbackCard: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  spokenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  spokenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  spokenTitleCol: {
    flexShrink: 1,
  },
  spokenTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.primary,
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
  spokenActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replayAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  replayAudioText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  refreshSpokenBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spokenLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  spokenLoadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  feedbackBodyText: {
    fontSize: 15,
    color: theme.text,
    lineHeight: 22,
    fontWeight: '600',
  },
  actionButtonsCol: {
    gap: 10,
    marginTop: 6,
  },
  quizActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 20,
    borderBottomWidth: 4,
    borderBottomColor: theme.primary,
  },
  quizActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  reportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.surfaceSecondary,
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  reportActionText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '800',
  },
  quizSection: {
    gap: 16,
  },
  quizHeader: {
    marginBottom: 8,
  },
  quizTitle: {
    ...DISPLAY_FONT,
    fontSize: 18,
    fontWeight: '900',
    color: theme.text,
  },
  quizSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  questionsList: {
    gap: 16,
  },
  questionCard: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  questionNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.primary,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    marginVertical: 10,
    lineHeight: 22,
  },
  optionsList: {
    gap: 8,
  },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderColor: theme.border,
    borderBottomColor: theme.border,
    backgroundColor: theme.surfaceSecondary,
    gap: 10,
  },
  optionBtn: {},
  optionBtnCorrect: {
    backgroundColor: theme.badges.kpiAccuracyBg,
    borderColor: theme.words.correctBorder,
    borderBottomColor: theme.badges.kpiAccuracyText,
  },
  optionBtnIncorrect: {
    backgroundColor: theme.words.mispronouncedBg,
    borderColor: theme.words.mispronouncedBorder,
    borderBottomColor: theme.gradients.btnMicListening[0],
  },
  optionLetterBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionLetter: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.text,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  explanationBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: theme.surfaceSecondary,
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  explanationBoxText: {
    flex: 1,
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
    lineHeight: 16,
  },
  quizScoreCard: {
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
    padding: 20,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.border,
  },
  quizScoreIcon: {
    marginBottom: 6,
  },
  quizScoreTitle: {
    ...DISPLAY_FONT,
    fontSize: 18,
    fontWeight: '900',
    color: theme.text,
  },
  quizScoreDesc: {
    fontSize: 13,
    color: theme.text,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  illustrationCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 240,
    borderWidth: 1.5,
    position: 'relative',
    backgroundColor: theme.surfaceSecondary,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  illustrationGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  illustrationTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  illustrationAiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  illustrationAiChipText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  illustrationWordCaption: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  // Voice Ask Styles
  tabBarScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.surfaceSecondary,
  },
  tabChipActive: {
    backgroundColor: theme.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  tabChipTextActive: {
    color: '#ffffff',
  },
  voiceAskSection: {
    paddingVertical: 10,
  },
  voiceHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  voiceHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  voiceHeroTitle: {
    ...DISPLAY_FONT,
    fontSize: 18,
    fontWeight: '800',
  },
  voiceHeroSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  voiceMicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  voiceMicButtonTouch: {
    width: 76,
    height: 76,
    borderRadius: 38,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  voiceMicButtonPulsing: {
    shadowColor: theme.gradients.btnMicListening[0],
    transform: [{ scale: 1.08 }],
  },
  voiceMicGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceMicInstruction: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  voiceDoneButton: {
    marginTop: 12,
    backgroundColor: theme.gradients.btnMicListening[0],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  voiceDoneButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  voiceLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  voiceLoadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dialogueContainer: {
    marginTop: 16,
    gap: 12,
  },
  childQuestionBubble: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  bubbleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  bubbleAuthorTag: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.primary,
    textTransform: 'uppercase',
  },
  childQuestionText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    fontStyle: 'italic',
  },
  sparkyAnswerBubble: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sparkyAuthorTag: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.primary,
    textTransform: 'uppercase',
  },
  sparkyAnswerText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
  },
  bubbleActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  bubbleListenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bubbleListenText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.primary,
  },
  bubbleAskAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bubbleAskAnotherText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  presetQuestionsSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  presetQuestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  presetChipsWrap: {
    flexDirection: 'column',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
};
