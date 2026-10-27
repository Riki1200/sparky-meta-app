import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComprehensionQuestion, ReadingSessionResult, WordExplanation, SupportedLanguage } from '../types';
import {
  explainWordWithMuseSpark,
  generateTutorSpokenFeedback,
  generateComprehensionQuiz,
} from '../services/metaApi';
import { speakText, speakWordPhonetically, playChime } from '../services/ttsService';
import { getTranslation } from '../i18n/translations';

interface TutorDrawerProps {
  visible: boolean;
  mode: 'explain' | 'celebrate' | 'quiz';
  selectedWord?: string;
  sentenceContext?: string;
  sessionResult?: ReadingSessionResult;
  pageText?: string;
  language: SupportedLanguage;
  onClose: () => void;
  onViewReport?: () => void;
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
}) => {
  const t = getTranslation(language);

  // Word Explainer state
  const [explanation, setExplanation] = useState<WordExplanation | null>(null);
  const [loadingWord, setLoadingWord] = useState(false);

  // Spoken feedback state
  const [spokenFeedback, setSpokenFeedback] = useState<string>('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState<ComprehensionQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

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
      // Speak tutor feedback with warm kid voice
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

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (selectedAnswers[questionIdx] !== undefined) return; // already answered
    const updated = { ...selectedAnswers, [questionIdx]: optionIdx };
    setSelectedAnswers(updated);

    const isCorrect = optionIdx === questions[questionIdx].correctIndex;
    if (isCorrect) {
      playChime('correct');
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Top Bar with Mascot */}
          <View style={styles.sheetHeader}>
            <View style={styles.tutorAvatarBadge}>
              <Text style={styles.avatarEmoji}>✨</Text>
              <View>
                <Text style={styles.tutorName}>{t.tutorTitle}</Text>
                <Text style={styles.modelPowered}>Meta Muse Spark 1.3</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} contentContainerStyle={styles.sheetContent}>
            {/* 1. WORD EXPLAINER MODE */}
            {mode === 'explain' && (
              <View style={styles.explainSection}>
                <View style={styles.wordHeaderCard}>
                  <Text style={styles.targetWordDisplay}>{selectedWord}</Text>
                  <TouchableOpacity
                    style={styles.listenWordButton}
                    onPress={() => selectedWord && speakWordPhonetically(selectedWord, language)}
                  >
                    <Ionicons name="volume-high" size={20} color="#ea580c" />
                    <Text style={styles.listenWordText}>{t.pronounceAudio}</Text>
                  </TouchableOpacity>
                </View>

                {loadingWord ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text style={styles.loadingText}>
                      {language === 'es'
                        ? 'Sparky está pensando la mejor explicación para ti...'
                        : language === 'fr'
                        ? "Sparky prépare la meilleure explication pour toi..."
                        : language === 'pt'
                        ? 'Sparky está preparando a melhor explicação...'
                        : 'Sparky is thinking of the best explanation for you...'}
                    </Text>
                  </View>
                ) : explanation ? (
                  <View style={styles.explanationCards}>
                    {/* Syllables */}
                    <View style={styles.syllablesCard}>
                      <Text style={styles.cardSmallLabel}>{t.wordSyllables.toUpperCase()}:</Text>
                      <Text style={styles.syllablesText}>{explanation.syllables}</Text>
                    </View>

                    {/* Simple Meaning */}
                    <View style={styles.meaningCard}>
                      <View style={styles.iconHeadingRow}>
                        <Ionicons name="bulb" size={18} color="#d97706" />
                        <Text style={styles.cardHeading}>{t.wordMeaning}</Text>
                      </View>
                      <Text style={styles.meaningText}>{explanation.simpleMeaning}</Text>
                    </View>

                    {/* Fun Example */}
                    <View style={styles.exampleCard}>
                      <View style={styles.iconHeadingRow}>
                        <Ionicons name="sparkles" size={18} color="#2563eb" />
                        <Text style={styles.cardHeading}>{t.wordExample}</Text>
                      </View>
                      <Text style={styles.exampleText}>"{explanation.funExample}"</Text>
                    </View>

                    {/* Encouragement */}
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
                </View>

                {/* Score Pills */}
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

                {/* Spoken Feedback Card */}
                <View style={styles.spokenFeedbackCard}>
                  <View style={styles.spokenHeaderRow}>
                    <View style={styles.spokenHeaderLeft}>
                      <Ionicons name="chatbubble-ellipses" size={20} color="#ea580c" />
                      <Text style={styles.spokenTitle}>{t.spokenFeedbackTitle}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.replayAudioBtn}
                      onPress={() => spokenFeedback && handlePlayVoice(spokenFeedback)}
                    >
                      <Ionicons
                        name={isPlayingAudio ? 'volume-high' : 'play'}
                        size={16}
                        color="#ea580c"
                      />
                      <Text style={styles.replayAudioText}>
                        {isPlayingAudio
                          ? '...'
                          : t.listenToSparky}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {loadingFeedback ? (
                    <ActivityIndicator size="small" color="#ea580c" />
                  ) : (
                    <Text style={styles.feedbackBodyText}>"{spokenFeedback}"</Text>
                  )}
                </View>

                {/* Next Steps Buttons */}
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
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text style={styles.loadingText}>
                      {language === 'es'
                        ? 'Sparky está creando preguntas entretenidas...'
                        : language === 'fr'
                        ? 'Sparky crée les questions du quiz...'
                        : language === 'pt'
                        ? 'Sparky está criando as perguntas...'
                        : 'Sparky is crafting fun questions...'}
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
                            {language === 'es' ? `Pregunta ${qIdx + 1}` : language === 'fr' ? `Question ${qIdx + 1}` : language === 'pt' ? `Pergunta ${qIdx + 1}` : `Question ${qIdx + 1}`}
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
                                  <Text style={styles.optionLetter}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </Text>
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
                          {language === 'es'
                            ? `¡Obtuviste ${quizScore} de ${questions.length} correctas!`
                            : language === 'fr'
                            ? `Tu as obtenu ${quizScore} sur ${questions.length} correctes !`
                            : language === 'pt'
                            ? `Você acertou ${quizScore} de ${questions.length}!`
                            : `You scored ${quizScore} out of ${questions.length}!`}
                        </Text>
                        <Text style={styles.quizScoreDesc}>
                          {quizScore === questions.length
                            ? t.quizPassed
                            : (language === 'es'
                              ? '¡Muy buen intento! La práctica diaria hace al maestro.'
                              : language === 'fr'
                              ? "Super effort ! La pratique quotidienne fait les grands lecteurs."
                              : language === 'pt'
                              ? 'Muito bem! A prática diária constrói uma leitura brilhante.'
                              : 'Great job! Daily practice builds reading comprehension.')}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tutorAvatarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarEmoji: {
    fontSize: 26,
    backgroundColor: '#fef3c7',
    padding: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modelPowered: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    flex: 1,
  },
  sheetContent: {
    padding: 20,
    gap: 16,
  },
  explainSection: {
    gap: 14,
  },
  wordHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
  },
  targetWordDisplay: {
    fontSize: 26,
    fontWeight: '900',
    color: '#9a3412',
    letterSpacing: -0.5,
    textTransform: 'capitalize',
  },
  listenWordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  listenWordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  explanationCards: {
    gap: 12,
  },
  syllablesCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardSmallLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  syllablesText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 3,
    marginTop: 4,
  },
  meaningCard: {
    backgroundColor: '#fefce8',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  iconHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  meaningText: {
    fontSize: 14,
    color: '#451a03',
    lineHeight: 20,
    fontWeight: '500',
  },
  exampleCard: {
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  exampleText: {
    fontSize: 14,
    color: '#1e3a8a',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  cheerCard: {
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  cheerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
    textAlign: 'center',
  },
  celebrateSection: {
    gap: 16,
    alignItems: 'center',
  },
  celebrateHeader: {
    alignItems: 'center',
    gap: 6,
  },
  celebrateEmoji: {
    fontSize: 32,
  },
  celebrateTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  celebrateSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  statsPillRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  statPill: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statPillValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  statPillLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  spokenFeedbackCard: {
    width: '100%',
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
  },
  spokenHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spokenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spokenTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9a3412',
  },
  replayAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  replayAudioText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
  },
  feedbackBodyText: {
    fontSize: 14,
    color: '#431407',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  quizActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ea580c',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  quizActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  reportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  reportActionText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  quizSection: {
    gap: 14,
  },
  quizHeader: {
    marginBottom: 4,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  questionNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ea580c',
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 21,
  },
  optionsList: {
    gap: 8,
  },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  optionBtn: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  optionBtnCorrect: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  optionBtnIncorrect: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  optionLetter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '800',
    fontSize: 12,
    color: '#334155',
  },
  optionLabel: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
  },
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginTop: 4,
  },
  explanationBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 16,
  },
  quizScoreCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    gap: 6,
  },
  quizScoreEmoji: {
    fontSize: 28,
  },
  quizScoreTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#78350f',
  },
  quizScoreDesc: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 17,
  },
});
