import React, { useState, useEffect } from 'react';
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
import { speakText, speakWordPhonetically, playChime } from '../services/ttsService';
import { addStars } from '../services/storageService';
import { getTranslation } from '../i18n/translations';
import { getWordIllustrationUrl } from '../services/imageService';
import { useTheme } from '../context/ThemeContext';
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

  // Word Explainer state
  const [explanation, setExplanation] = useState<WordExplanation | null>(null);
  const [loadingWord, setLoadingWord] = useState(false);
  const [activeSyllable, setActiveSyllable] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

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

  useEffect(() => {
    if (!visible) return;

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
    setIsPlayingAudio(true);
    speakText(text, language, 0.88, () => setIsPlayingAudio(false));
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

  const startVoiceQuestionRecording = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('Microphone not supported on this device');
      return;
    }

    try {
      setUserQuestionTranscript('');
      setSparkyAnswerText('');
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
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== 'inactive') {
      try {
        voiceRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    setIsTranscribingQuestion(true);
    playChime('tap');

    setTimeout(async () => {
      try {
        const audioBlob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        const transcribedText = await transcribeAudioWithMuseVoice(audioBlob, language);

        setIsTranscribingQuestion(false);

        if (transcribedText) {
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
        } else {
          setUserQuestionTranscript('...');
          setSparkyAnswerText(
            language === 'es'
              ? '¡No pude escucharte bien! Intenta de nuevo hablando cerca del micrófono.'
              : 'I could not hear clearly! Try speaking closer to the microphone.'
          );
        }
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
                    <Ionicons name="sparkles" size={10} color="#6366f1" />
                    <Text style={styles.aiBadgeText}>
                      {mode === 'ask' ? 'Muse Voice + Spark' : 'Meta Muse Spark'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.modelPowered}>
                  {mode === 'ask'
                    ? 'Meta Model API • muse-voice-transcribe-1.0'
                    : 'Meta Model API • muse-spark-1.3'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation Header */}
          <View style={styles.tabBarRow}>
            {selectedWord && (
              <TouchableOpacity
                style={[styles.tabChip, mode === 'explain' && styles.tabChipActive]}
                onPress={() => onSwitchMode && onSwitchMode('explain')}
                activeOpacity={0.7}
              >
                <Ionicons name="book" size={12} color={mode === 'explain' ? '#ffffff' : '#64748b'} />
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
              <Ionicons name="mic" size={12} color={mode === 'ask' ? '#ffffff' : '#64748b'} />
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
                <Ionicons name="help-circle" size={12} color={mode === 'quiz' ? '#ffffff' : '#64748b'} />
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
                <Ionicons name="trophy" size={12} color={mode === 'celebrate' ? '#ffffff' : '#64748b'} />
                <Text style={[styles.tabChipText, mode === 'celebrate' && styles.tabChipTextActive]}>
                  {t.tabFeedback}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.sheetBody} contentContainerStyle={styles.sheetContent}>
            {/* 1. WORD EXPLAINER MODE */}
            {mode === 'explain' && (
              <View style={styles.explainSection}>
                {/* Word Banner with 3D Listen Button */}
                <View style={styles.wordHeaderCard}>
                  <View>
                    <Text style={styles.targetWordLabel}>Word Practice</Text>
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

                {/* 🎨 Visual Picture Dictionary / AI Storybook Illustration Card */}
                {selectedWord && !imageError && (
                  <View style={[styles.illustrationCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    <Image
                      source={{ uri: getWordIllustrationUrl(selectedWord, language, sentenceContext).url }}
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
                          ✨ {selectedWord}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                )}

                {loadingWord ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>
                      {language === 'es'
                        ? 'Sparky está preparando la mejor explicación para ti...'
                        : language === 'fr'
                        ? 'Sparky prépare la meilleure explication pour toi...'
                        : language === 'pt'
                        ? 'Sparky está preparando a melhor explicação...'
                        : language === 'de'
                        ? 'Sparky bereitet die beste Erklärung für dich vor...'
                        : language === 'it'
                        ? 'Sparky sta preparando la migliore spiegazione...'
                        : language === 'nl'
                        ? 'Sparky bereidt de beste uitleg voor...'
                        : language === 'pl'
                        ? 'Sparky przygotowuje najlepsze wyjaśnienie...'
                        : language === 'tr'
                        ? 'Sparky senin için en iyi açıklamayı hazırlıyor...'
                        : 'Sparky is thinking of the best kid-friendly explanation...'}
                    </Text>
                  </View>
                ) : explanation ? (
                  <View style={styles.explanationCards}>
                    {/* Interactive Syllable Chips */}
                    <View style={styles.syllablesCard}>
                      <Text style={styles.cardSmallLabel}>
                        🗣️ {t.wordSyllables.toUpperCase()} ({t.tapToHear}):
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
                        <View style={[styles.iconCircleMini, { backgroundColor: '#fef3c7' }]}>
                          <Ionicons name="bulb" size={16} color="#d97706" />
                        </View>
                        <Text style={styles.cardHeading}>{t.wordMeaning}</Text>
                      </View>
                      <Text style={styles.meaningText}>{explanation.simpleMeaning}</Text>
                    </View>

                    {/* Fun Example Analogy */}
                    <View style={styles.exampleCard}>
                      <View style={styles.iconHeadingRow}>
                        <View style={[styles.iconCircleMini, { backgroundColor: '#eff6ff' }]}>
                          <Ionicons name="sparkles" size={16} color="#2563eb" />
                        </View>
                        <Text style={styles.cardHeading}>{t.wordExample}</Text>
                      </View>
                      <Text style={styles.exampleText}>"{explanation.funExample}"</Text>
                    </View>

                    {/* Warm Encouragement Card */}
                    <View style={styles.cheerCard}>
                      <Text style={styles.cheerText}>🌟 {explanation.encouragement}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            {/* 2. CELEBRATION & COMPLETION MODE */}
            {mode === 'celebrate' && sessionResult && (
              <View style={styles.celebrateSection}>
                <View style={styles.celebrateHeader}>
                  <Text style={styles.celebrateEmoji}>🎉 🌟 🏆</Text>
                  <Text style={styles.celebrateTitle}>{t.celebrationTitle}</Text>
                  <Text style={styles.celebrateSubtitle}>
                    {t.celebrationSubtitle} ({sessionResult.totalWords} {t.wordsRead.toLowerCase()})
                  </Text>
                  <View style={styles.starsRewardPill}>
                    <Text style={styles.starsRewardText}>+10 Stars Added! ⭐</Text>
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
                </View>

                {/* Spoken Feedback from Meta Muse Spark */}
                <View style={styles.spokenFeedbackCard}>
                  <View style={styles.spokenHeaderRow}>
                    <View style={styles.spokenHeaderLeft}>
                      <Ionicons name="chatbubble-ellipses" size={20} color="#6366f1" />
                      <Text style={styles.spokenTitle}>{t.spokenFeedbackTitle}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.replayAudioBtn}
                      onPress={() => spokenFeedback && handlePlayVoice(spokenFeedback)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isPlayingAudio ? 'volume-high' : 'play'}
                        size={16}
                        color="#ffffff"
                      />
                      <Text style={styles.replayAudioText}>
                        {isPlayingAudio ? 'Speaking...' : t.listenToSparky}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {loadingFeedback ? (
                    <ActivityIndicator size="small" color="#6366f1" />
                  ) : (
                    <Text style={styles.feedbackBodyText}>"{spokenFeedback}"</Text>
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
                      <Ionicons name="bar-chart" size={18} color="#0f172a" />
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
                  <Text style={styles.quizTitle}>🧠 {t.quizTitle}</Text>
                  <Text style={styles.quizSubtitle}>{t.quizSubtitle}</Text>
                </View>

                {loadingQuiz ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>
                      {language === 'es'
                        ? 'Sparky está creando preguntas entretenidas...'
                        : language === 'fr'
                        ? 'Sparky crée les questions du quiz...'
                        : language === 'pt'
                        ? 'Sparky está criando as perguntas...'
                        : 'Sparky is crafting fun questions with Meta Muse Spark...'}
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
                                    <Ionicons name="checkmark-circle" size={20} color="#15803d" />
                                  )}
                                  {answered && isThisSelected && !isCorrect && (
                                    <Ionicons name="close-circle" size={20} color="#b91c1c" />
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {answered && (
                            <View style={styles.explanationBox}>
                              <Ionicons name="information-circle" size={16} color="#0369a1" />
                              <Text style={styles.explanationBoxText}>{q.explanation}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {quizScore !== null && (
                      <View style={styles.quizScoreCard}>
                        <Text style={styles.quizScoreEmoji}>
                          {quizScore === questions.length ? '🌟 🏆 🌟' : '👏 💡'}
                        </Text>
                        <Text style={styles.quizScoreTitle}>
                          You scored {quizScore} out of {questions.length}!
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
                    <Ionicons name="mic-circle" size={36} color="#6366f1" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.voiceHeroTitle, { color: theme.text }]}>
                        {t.askVoiceTitle}
                      </Text>
                      <Text style={[styles.voiceHeroSubtitle, { color: theme.textMuted }]}>
                        {t.askVoiceSubtitle}
                      </Text>
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
                      activeOpacity={0.8}
                      disabled={isTranscribingQuestion || isAnsweringQuestion}
                    >
                      <LinearGradient
                        colors={
                          isRecordingQuestion
                            ? ['#ef4444', '#dc2626']
                            : ['#6366f1', '#4f46e5']
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
                        <ActivityIndicator size="small" color="#6366f1" />
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
                          <Ionicons name="mic" size={13} color="#6366f1" />
                          <Text style={styles.bubbleAuthorTag}>{t.askVoiceYouAsked}</Text>
                        </View>
                        <Text style={styles.childQuestionText}>"{userQuestionTranscript}"</Text>
                      </View>

                      {/* Sparky response bubble */}
                      {sparkyAnswerText ? (
                        <View
                          style={[
                            styles.sparkyAnswerBubble,
                            { backgroundColor: themeMode === 'dark' ? '#1e1b4b' : '#f5f3ff' },
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
                              <Ionicons name="volume-high" size={15} color="#6366f1" />
                              <Text style={styles.bubbleListenText}>{t.pronounceAudio}</Text>
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
                              <Ionicons name="refresh" size={15} color="#475569" />
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
                        {language === 'es'
                          ? '💡 O toca una pregunta de ejemplo:'
                          : '💡 Or tap an example question:'}
                      </Text>
                      <View style={styles.presetChipsWrap}>
                        {(language === 'es'
                          ? [
                              '¿De qué trata este cuento?',
                              '¿Por qué es importante leer con atención?',
                              '¿Qué personaje te gusta más?',
                            ]
                          : [
                              'What is this story about?',
                              'Why is reading aloud helpful?',
                              'Who is the main character?',
                            ]
                        ).map((preset, pIdx) => (
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
                            <Text style={[styles.presetChipText, { color: theme.text }]}>💬 {preset}</Text>
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
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
    backgroundColor: '#cbd5e1',
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
    borderBottomColor: '#f1f5f9',
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
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  aiBadgeText: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: '800',
  },
  modelPowered: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
    fontWeight: '500',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  targetWordLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetWordDisplay: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1e293b',
    marginTop: 2,
  },
  listenWordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomWidth: 3,
    borderBottomColor: '#4338ca',
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
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 280,
  },
  explanationCards: {
    gap: 14,
  },
  syllablesCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  cardSmallLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 8,
  },
  syllablesChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  syllableChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    borderBottomWidth: 3,
    borderBottomColor: '#60a5fa',
  },
  syllableChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  syllableChipText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  syllableChipTextActive: {
    color: '#ffffff',
  },
  meaningCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#fde68a',
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
    color: '#0f172a',
  },
  meaningText: {
    fontSize: 15,
    color: '#78350f',
    lineHeight: 22,
    fontWeight: '600',
  },
  exampleCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  exampleText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#166534',
    lineHeight: 22,
    fontWeight: '600',
  },
  cheerCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e9d5ff',
    alignItems: 'center',
  },
  cheerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6b21a8',
    textAlign: 'center',
  },
  celebrateSection: {
    gap: 16,
  },
  celebrateHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  celebrateEmoji: {
    fontSize: 34,
    marginBottom: 6,
  },
  celebrateTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  celebrateSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  starsRewardPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  starsRewardText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#b45309',
  },
  statsPillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  statPillValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  spokenFeedbackCard: {
    backgroundColor: '#f5f3ff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ddd6fe',
  },
  spokenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  spokenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spokenTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338ca',
  },
  replayAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  replayAudioText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  feedbackBodyText: {
    fontSize: 15,
    color: '#312e81',
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
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#4338ca',
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
    backgroundColor: '#f1f5f9',
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  reportActionText: {
    color: '#0f172a',
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
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  quizSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  questionsList: {
    gap: 16,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  questionNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366f1',
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
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
    borderColor: '#e2e8f0',
    borderBottomColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  optionBtn: {},
  optionBtnCorrect: {
    backgroundColor: '#ecfdf5',
    borderColor: '#6ee7b7',
    borderBottomColor: '#10b981',
  },
  optionBtnIncorrect: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderBottomColor: '#ef4444',
  },
  optionLetterBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  optionLetter: {
    fontSize: 12,
    fontWeight: '900',
    color: '#334155',
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  explanationBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  explanationBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
    lineHeight: 16,
  },
  quizScoreCard: {
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 20,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fde68a',
  },
  quizScoreEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  quizScoreTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  quizScoreDesc: {
    fontSize: 13,
    color: '#78350f',
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
    backgroundColor: '#f1f5f9',
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
  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  tabChipActive: {
    backgroundColor: '#6366f1',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
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
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  voiceMicButtonPulsing: {
    shadowColor: '#ef4444',
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
    backgroundColor: '#ef4444',
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#6366f1',
    textTransform: 'uppercase',
  },
  childQuestionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    fontStyle: 'italic',
  },
  sparkyAnswerBubble: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  sparkyAuthorTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4f46e5',
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
    alignItems: 'center',
    gap: 10,
  },
  bubbleListenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bubbleListenText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338ca',
  },
  bubbleAskAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bubbleAskAnotherText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  presetQuestionsSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
