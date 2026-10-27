import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReadingSessionResult, ReadingErrorDetail, SupportedLanguage } from '../types';
import { getReadingHistory, getReadingStats } from '../services/storageService';
import { speakWordPhonetically, playChime } from '../services/ttsService';
import { getTranslation } from '../i18n/translations';

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

  useEffect(() => {
    loadData();
  }, [currentSession]);

  const loadData = async () => {
    const hist = await getReadingHistory();
    const st = await getReadingStats();
    setHistory(hist);
    setStats(st);
  };

  // Active session or most recent session, with rich baseline for demonstration
  const demoTitles: Record<SupportedLanguage, { title: string; source: string; errors: ReadingErrorDetail[] }> = {
    en: {
      title: "The Little Hummingbird's Flight",
      source: 'Nature Tales for Young Readers',
      errors: [
        {
          word: 'fluttered',
          display: 'fluttered',
          errorType: 'hesitation',
          hesitationSeconds: 1.9,
          syllables: ['flut', 'tered'],
        },
        {
          word: 'courage',
          display: 'courage',
          errorType: 'mispronounced',
          spokenWord: 'curage',
          syllables: ['cour', 'age'],
        },
      ],
    },
    es: {
      title: 'El Gallito Cantor del Cibao',
      source: 'Cuentos y Tradiciones Dominicanas',
      errors: [
        {
          word: 'madrugada',
          display: 'madrugada.',
          errorType: 'hesitation',
          hesitationSeconds: 2.1,
          syllables: ['ma', 'dru', 'ga', 'da'],
        },
        {
          word: 'resplandor',
          display: 'resplandor',
          errorType: 'mispronounced',
          spokenWord: 'resplandorando',
          syllables: ['res', 'plan', 'dor'],
        },
      ],
    },
    fr: {
      title: 'Le Petit Colibri du Matin',
      source: 'Contes de la Nature pour Enfants',
      errors: [
        {
          word: 'agitait',
          display: 'agitait',
          errorType: 'hesitation',
          hesitationSeconds: 1.8,
          syllables: ['a', 'gi', 'tait'],
        },
        {
          word: 'courage',
          display: 'courage',
          errorType: 'mispronounced',
          spokenWord: 'curage',
          syllables: ['cou', 'rage'],
        },
      ],
    },
    pt: {
      title: 'O Pequeno Beija-Flor Dourado',
      source: 'Contos da Natureza Infantil',
      errors: [
        {
          word: 'coloridas',
          display: 'coloridas',
          errorType: 'hesitation',
          hesitationSeconds: 1.9,
          syllables: ['co', 'lo', 'ri', 'das'],
        },
        {
          word: 'coragem',
          display: 'coragem',
          errorType: 'mispronounced',
          spokenWord: 'coragem',
          syllables: ['co', 'ra', 'gem'],
        },
      ],
    },
    de: {
      title: 'Der kleine Kolibri und die Zauberblume',
      source: 'Naturmärchen für Kinder',
      errors: [
        {
          word: 'flatterte',
          display: 'flatterte',
          errorType: 'hesitation',
          hesitationSeconds: 1.9,
          syllables: ['flat', 'ter', 'te'],
        },
        {
          word: 'friedlich',
          display: 'friedlich',
          errorType: 'mispronounced',
          spokenWord: 'fridlich',
          syllables: ['fried', 'lich'],
        },
      ],
    },
    it: {
      title: "Il Piccolo Colibrì e il Fiore d'Oro",
      source: 'Fiabe della Natura per Bambini',
      errors: [
        {
          word: 'sbatteva',
          display: 'sbatteva',
          errorType: 'hesitation',
          hesitationSeconds: 1.8,
          syllables: ['sbat', 'te', 'va'],
        },
        {
          word: 'profumato',
          display: 'profumato',
          errorType: 'mispronounced',
          spokenWord: 'profumate',
          syllables: ['pro', 'fu', 'ma', 'to'],
        },
      ],
    },
    nl: {
      title: 'De Kleine Kolibrie en de Bloem',
      source: 'Natuurverhalen voor Jonge Lezers',
      errors: [
        {
          word: 'fladderde',
          display: 'fladderde',
          errorType: 'hesitation',
          hesitationSeconds: 2.0,
          syllables: ['flad', 'der', 'de'],
        },
        {
          word: 'kleurrijke',
          display: 'kleurrijke',
          errorType: 'mispronounced',
          spokenWord: 'kleurrik',
          syllables: ['kleur', 'rij', 'ke'],
        },
      ],
    },
    pl: {
      title: 'Mały Koliber i Kolorowy Ogród',
      source: 'Bajki Przyrodnicze dla Dzieci',
      errors: [
        {
          word: 'trzepotał',
          display: 'trzepotał',
          errorType: 'hesitation',
          hesitationSeconds: 1.9,
          syllables: ['trze', 'po', 'tał'],
        },
        {
          word: 'skrzydełkami',
          display: 'skrzydełkami',
          errorType: 'mispronounced',
          spokenWord: 'skrzydelkami',
          syllables: ['skrzy', 'deł', 'ka', 'mi'],
        },
      ],
    },
    tr: {
      title: 'Küçük Sinek Kuşunun Uçuşu',
      source: 'Çocuklar İçin Doğa Masalları',
      errors: [
        {
          word: 'kanatlarını',
          display: 'kanatlarını',
          errorType: 'hesitation',
          hesitationSeconds: 2.1,
          syllables: ['ka', 'nat', 'la', 'rı', 'nı'],
        },
        {
          word: 'rengarenk',
          display: 'rengarenk',
          errorType: 'mispronounced',
          spokenWord: 'rengarek',
          syllables: ['ren', 'ga', 'renk'],
        },
      ],
    },
  };

  const defaultDemoSession: ReadingSessionResult = {
    id: 'demo_session_1',
    pageId: 'default-page',
    pageTitle: demoTitles[language]?.title || demoTitles.en.title,
    bookSource: demoTitles[language]?.source || demoTitles.en.source,
    language,
    date: language === 'es' ? 'Hoy, 2:30 PM' : 'Today, 2:30 PM',
    durationSeconds: 32,
    totalWords: 36,
    correctWords: 32,
    hesitationWords: 2,
    mispronouncedWords: 2,
    skippedWords: 0,
    accuracyPercent: 92,
    wordsPerMinute: 68,
    gradeLevel: language === 'en' ? 'Grade 1-2 (Early Reader)' : '1er - 2do Grado',
    errors: demoTitles[language]?.errors || demoTitles.en.errors,
  };

  const activeSession = currentSession || (history.length > 0 ? history[0] : defaultDemoSession);

  // Grade benchmark comparison
  const getWpmEvaluation = (wpm: number) => {
    if (wpm >= 70) {
      return {
        level: language === 'es' ? 'Fluidez Óptima' : language === 'fr' ? 'Fluidité Optimale' : language === 'pt' ? 'Fluência Ótima' : 'Optimal Fluency',
        color: '#16a34a',
        bg: '#ecfdf5',
        note: language === 'es'
          ? 'Por encima del promedio para su grado'
          : language === 'fr'
          ? 'Au-dessus de la moyenne de sa classe'
          : language === 'pt'
          ? 'Acima da média para o ano escolar'
          : 'Above target grade level',
      };
    }
    if (wpm >= 45) {
      return {
        level: language === 'es' ? 'Fluidez en Desarrollo' : language === 'fr' ? 'Fluidité en Progrès' : language === 'pt' ? 'Fluência em Desenvolvimento' : 'Developing Fluency',
        color: '#d97706',
        bg: '#fffbeb',
        note: language === 'es'
          ? 'Cerca de la meta de fluidez lectora'
          : language === 'fr'
          ? 'Proche de l’objectif de fluidité'
          : language === 'pt'
          ? 'Perto da meta de fluência leitora'
          : 'Approaching grade target',
      };
    }
    return {
      level: language === 'es' ? 'Requiere Apoyo y Paciencia' : language === 'fr' ? 'Besoin d’Encouragement' : language === 'pt' ? 'Necessita de Apoio e Prática' : 'Needs Support & Practice',
      color: '#ea580c',
      bg: '#fff7ed',
      note: language === 'es'
        ? 'Práctica recomendada de 10 min/día'
        : language === 'fr'
        ? 'Pratique quotidienne de 10 min conseillée'
        : language === 'pt'
        ? 'Prática de 10 minutos ao dia recomendada'
        : 'Recommended 10 min daily practice',
    };
  };

  const handleShareReport = () => {
    if (!activeSession) return;
    const summaryText =
      `📚 Reading Progress Report - Sparky Reader (Meta Muse Spark)\n` +
      `Book: ${activeSession.pageTitle}\n` +
      `Date: ${activeSession.date}\n` +
      `Speed: ${activeSession.wordsPerMinute} WPM\n` +
      `Accuracy: ${activeSession.accuracyPercent}%\n` +
      `Words to Practice: ${activeSession.errors.map((e) => e.word).join(', ') || 'None!'}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopiedAlert(true);
      playChime('sparkle');
      setTimeout(() => setCopiedAlert(false), 3000);
    } else {
      Alert.alert('Report Ready', summaryText);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{t.reportTitle}</Text>
          <Text style={styles.headerSubtitle}>{t.reportSubtitle}</Text>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShareReport} activeOpacity={0.8}>
          <Ionicons name="share-social-outline" size={18} color="#ffffff" />
          <Text style={styles.shareButtonText}>
            {copiedAlert ? 'Copied!' : t.shareReportBtn}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Global & Dominican Literacy Mission Note */}
      <View style={styles.missionCard}>
        <View style={styles.missionHeaderRow}>
          <Text style={styles.missionFlag}>🌍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.missionTitle}>{t.globalMissionTitle}</Text>
            <Text style={styles.missionSource}>UNESCO ERCE & Global Literacy Initiative</Text>
          </View>
        </View>
        <Text style={styles.missionBody}>{t.globalMissionDesc}</Text>
      </View>

      {/* KPI Overviews */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="speedometer" size={20} color="#2563eb" />
          </View>
          <Text style={styles.kpiValue}>
            {activeSession ? `${activeSession.wordsPerMinute}` : `${stats.avgWpm || 0}`}
          </Text>
          <Text style={styles.kpiLabel}>{t.speedometerLabel}</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="checkmark-done" size={20} color="#059669" />
          </View>
          <Text style={styles.kpiValue}>
            {activeSession ? `${activeSession.accuracyPercent}%` : `${stats.avgAccuracy || 0}%`}
          </Text>
          <Text style={styles.kpiLabel}>{t.summaryAccuracy}</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#fff7ed' }]}>
            <Ionicons name="flame" size={20} color="#ea580c" />
          </View>
          <Text style={styles.kpiValue}>{stats.streakDays} {t.daysStreak}</Text>
          <Text style={styles.kpiLabel}>{t.daysStreak}</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#f5f3ff' }]}>
            <Ionicons name="book" size={20} color="#7c3aed" />
          </View>
          <Text style={styles.kpiValue}>{stats.totalWords || (activeSession?.totalWords || 0)}</Text>
          <Text style={styles.kpiLabel}>{t.summaryWordsRead}</Text>
        </View>
      </View>

      {activeSession ? (
        <>
          {/* Grade Benchmark Evaluation */}
          {(() => {
            const evalInfo = getWpmEvaluation(activeSession.wordsPerMinute);
            return (
              <View style={[styles.evalBanner, { backgroundColor: evalInfo.bg }]}>
                <View style={styles.evalLeft}>
                  <Text style={[styles.evalLevel, { color: evalInfo.color }]}>
                    📊 {evalInfo.level}
                  </Text>
                  <Text style={styles.evalNote}>
                    {activeSession.wordsPerMinute} WPM — {evalInfo.note}
                  </Text>
                </View>
                <View style={styles.benchmarkTargetPill}>
                  <Text style={styles.benchmarkTargetText}>{t.benchmarkGoal}</Text>
                </View>
              </View>
            );
          })()}

          {/* Breakdown Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t.summarySpeed}</Text>
            <Text style={styles.sectionSubtitle}>
              {activeSession.pageTitle} ({activeSession.totalWords} words, {activeSession.durationSeconds}s)
            </Text>

            <View style={styles.breakdownRow}>
              <View style={[styles.breakdownBox, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                <Text style={[styles.breakdownNumber, { color: '#047857' }]}>
                  {activeSession.correctWords}
                </Text>
                <Text style={styles.breakdownLabel}>{t.legendCorrect}</Text>
              </View>

              <View style={[styles.breakdownBox, { backgroundColor: '#fefce8', borderColor: '#fde047' }]}>
                <Text style={[styles.breakdownNumber, { color: '#a16207' }]}>
                  {activeSession.hesitationWords}
                </Text>
                <Text style={styles.breakdownLabel}>{t.legendHesitation}</Text>
              </View>

              <View style={[styles.breakdownBox, { backgroundColor: '#fff1f2', borderColor: '#fecdd3' }]}>
                <Text style={[styles.breakdownNumber, { color: '#be123c' }]}>
                  {activeSession.mispronouncedWords}
                </Text>
                <Text style={styles.breakdownLabel}>{t.legendMispronounced}</Text>
              </View>

              <View style={[styles.breakdownBox, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
                <Text style={[styles.breakdownNumber, { color: '#6d28d9' }]}>
                  {activeSession.skippedWords}
                </Text>
                <Text style={styles.breakdownLabel}>{t.legendSkipped}</Text>
              </View>
            </View>
          </View>

          {/* Words to Practice Deck */}
          <View style={styles.sectionCard}>
            <View style={styles.deckHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>{t.practiceWordsTitle}</Text>
                <Text style={styles.sectionSubtitle}>{t.practiceWordsSubtitle}</Text>
              </View>
              <View style={styles.deckCountBadge}>
                <Text style={styles.deckCountText}>
                  {activeSession.errors.length} {t.wordsRead}
                </Text>
              </View>
            </View>

            {activeSession.errors.length === 0 ? (
              <View style={styles.emptyErrorsBox}>
                <Text style={styles.emptyErrorsEmoji}>🌟</Text>
                <Text style={styles.emptyErrorsText}>
                  Flawless reading! No errors were detected on this page.
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
                              {isHesitation ? t.legendHesitation : t.legendMispronounced}
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
                          <Ionicons name="volume-high" size={16} color="#ea580c" />
                          <Text style={styles.listenErrorBtnText}>{t.pronounceAudio}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.explainErrorBtn}
                          onPress={() => onOpenWordExplainer(err.word, activeSession.pageTitle)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="sparkles" size={15} color="#2563eb" />
                          <Text style={styles.explainErrorBtnText}>{t.tabExplain}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Meta Muse Spark Pedagogical Note */}
          <View style={styles.pedagogicalCard}>
            <View style={styles.pedagogicalHeaderRow}>
              <Text style={styles.pedagogicalMascot}>✨</Text>
              <View>
                <Text style={styles.pedagogicalTitle}>
                  Sparky Pedagogical Advice (Meta Muse Spark)
                </Text>
                <Text style={styles.pedagogicalSub}>
                  {t.tagline}
                </Text>
              </View>
            </View>
            <Text style={styles.pedagogicalText}>
              {language === 'es'
                ? '💡 Consejo pedagógico: Practica la lectura repetida de la misma página 2 veces seguidas. La primera vez sirve para decodificar las palabras nuevas; la segunda vez permite al niño concentrarse en la entonación y comprender el sentido de la historia con alegría.'
                : language === 'fr'
                ? "💡 Conseil pédagogique : Entraînez-vous à relire la même page deux fois. La première lecture permet de déchiffrer les mots nouveaux, tandis que la seconde favorise l'intonation et la compréhension joyeuse de l'histoire."
                : language === 'pt'
                ? '💡 Conselho pedagógico: Pratique a leitura repetida da mesma página 2 vezes. A primeira leitura ajuda a decodificar novas palavras; a segunda permite que a criança foque na entonação e na compreensão confiante.'
                : '💡 Pedagogical tip: Practice repeated reading of the same page twice. The first pass allows decoding unfamiliar vocabulary; the second pass allows the child to focus on expression, phrasing, and full comprehension.'}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.noSessionBox}>
          <Text style={styles.noSessionEmoji}>📖</Text>
          <Text style={styles.noSessionTitle}>
            No completed reading sessions yet
          </Text>
          <Text style={styles.noSessionText}>
            Pick a book and start reading aloud with Sparky to generate your first fluency report.
          </Text>
        </View>
      )}

      {/* Back to reading button */}
      <TouchableOpacity style={styles.backButton} onPress={onBackToReading} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={18} color="#0f172a" />
        <Text style={styles.backButtonText}>{t.backToReadingBtn}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    gap: 16,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 240,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  shareButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  missionCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
  },
  missionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  missionFlag: {
    fontSize: 24,
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9a3412',
  },
  missionSource: {
    fontSize: 11,
    color: '#c2410c',
    fontWeight: '600',
  },
  missionBody: {
    fontSize: 12,
    color: '#431407',
    lineHeight: 18,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'flex-start',
  },
  kpiIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  evalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 10,
  },
  evalLeft: {
    flex: 1,
    minWidth: 200,
  },
  evalLevel: {
    fontSize: 15,
    fontWeight: '800',
  },
  evalNote: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  benchmarkTargetPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  benchmarkTargetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  breakdownBox: {
    flex: 1,
    minWidth: 100,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  breakdownNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
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
  deckCountBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deckCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  emptyErrorsBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyErrorsEmoji: {
    fontSize: 32,
  },
  emptyErrorsText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
  errorsCardsList: {
    gap: 10,
  },
  errorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 10,
  },
  errorCardLeft: {
    flex: 1,
    minWidth: 180,
    gap: 4,
  },
  errorWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorWordTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  errorTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hesitationTag: {
    backgroundColor: '#fef3c7',
  },
  hesitationTagText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '700',
  },
  mispronouncedTag: {
    backgroundColor: '#fee2e2',
  },
  mispronouncedTagText: {
    color: '#991b1b',
    fontSize: 10,
    fontWeight: '700',
  },
  errorTypeTagText: {},
  syllableBreakdown: {
    fontSize: 11,
    color: '#64748b',
  },
  syllableBold: {
    color: '#0f172a',
    fontWeight: '700',
  },
  errorCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listenErrorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  listenErrorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
  },
  explainErrorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  explainErrorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  pedagogicalCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    gap: 8,
  },
  pedagogicalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pedagogicalMascot: {
    fontSize: 22,
  },
  pedagogicalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  pedagogicalSub: {
    fontSize: 11,
    color: '#3b82f6',
  },
  pedagogicalText: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
  },
  noSessionBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  noSessionEmoji: {
    fontSize: 40,
  },
  noSessionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  noSessionText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 360,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 8,
    marginBottom: 24,
  },
  backButtonText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
});
