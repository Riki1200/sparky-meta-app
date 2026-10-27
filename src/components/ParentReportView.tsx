import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
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
  const studentsList = [
    { name: 'Leo', emoji: '👦', grade: language === 'es' ? '1er Grado' : '1st Grade' },
    { name: 'Sofía', emoji: '👧', grade: language === 'es' ? '2do Grado' : '2nd Grade' },
    { name: 'Mateo', emoji: '🧒', grade: language === 'es' ? '3er Grado' : '3rd Grade' },
  ];
  const [selectedStudent, setSelectedStudent] = useState(studentsList[0]);
  const [printModalVisible, setPrintModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentSession]);

  const loadData = async () => {
    const hist = await getReadingHistory();
    const st = await getReadingStats();
    setHistory(hist);
    setStats(st);
  };

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

  const getWpmEvaluation = (wpm: number) => {
    if (wpm >= 70) {
      return {
        level: language === 'es' ? 'Fluidez Óptima' : 'Optimal Fluency',
        color: '#16a34a',
        bg: '#ecfdf5',
        note: language === 'es' ? 'Por encima de la meta de su grado' : 'Above target grade level',
      };
    }
    if (wpm >= 45) {
      return {
        level: language === 'es' ? 'Fluidez en Desarrollo' : 'Developing Fluency',
        color: '#d97706',
        bg: '#fffbeb',
        note: language === 'es' ? 'Cerca de la meta de fluidez lectora' : 'Approaching grade target',
      };
    }
    return {
      level: language === 'es' ? 'Requiere Apoyo y Paciencia' : 'Needs Support & Practice',
      color: '#ea580c',
      bg: '#fff7ed',
      note: language === 'es' ? 'Práctica recomendada de 10 min/día' : 'Recommended 10 min daily practice',
    };
  };

  const handleShareReport = () => {
    if (!activeSession) return;
    const summaryText =
      `📚 Reporte de Progreso de Lectura - Sparky Lector (Meta AI)\n` +
      `Cuento: ${activeSession.pageTitle}\n` +
      `Fecha: ${activeSession.date}\n` +
      `Velocidad: ${activeSession.wordsPerMinute} Palabras por minuto (WPM)\n` +
      `Precisión: ${activeSession.accuracyPercent}%\n` +
      `Palabras leídas: ${activeSession.totalWords}\n` +
      `Palabras para reforzar en casa: ${activeSession.errors.map((e) => e.word).join(', ') || '¡Ninguna! Lectura perfecta'}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopiedAlert(true);
      playChime('sparkle');
      setTimeout(() => setCopiedAlert(false), 3000);
    } else {
      Alert.alert('Reporte Listo para Compartir', summaryText);
    }
  };

  const evalInfo = getWpmEvaluation(activeSession ? activeSession.wordsPerMinute : 65);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Modern Dashboard Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerEmoji}>📊</Text>
            <View>
              <Text style={styles.headerTitle}>
                {language === 'es' ? 'Reporte para Padres y Maestros' : t.reportTitle}
              </Text>
              <Text style={styles.headerSubtitle}>
                {activeSession ? `${activeSession.pageTitle} • ${activeSession.gradeLevel}` : t.reportSubtitle}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareReport}
          activeOpacity={0.85}
        >
          <Ionicons
            name={copiedAlert ? 'checkmark-circle' : 'share-social-outline'}
            size={16}
            color="#ffffff"
          />
          <Text style={styles.shareButtonText}>
            {copiedAlert
              ? (language === 'es' ? '¡Copiado!' : 'Copied!')
              : (language === 'es' ? 'Compartir por WhatsApp' : 'Share Report')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* UNESCO Literacy Benchmark Banner */}
      <View style={[styles.benchmarkBanner, { backgroundColor: evalInfo.bg }]}>
        <View style={styles.benchmarkLeft}>
          <Text style={[styles.benchmarkLevel, { color: evalInfo.color }]}>
            {evalInfo.level}
          </Text>
          <Text style={styles.benchmarkDesc}>
            {activeSession.wordsPerMinute} WPM — {evalInfo.note}
          </Text>
        </View>
        <View style={styles.benchmarkTargetChip}>
          <Text style={styles.benchmarkTargetText}>UNESCO: 60-80 WPM</Text>
        </View>
      </View>

      {/* 4 Bento-Grid KPI Cards */}
      <View style={styles.kpiGrid}>
        {/* KPI 1: Speed */}
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="speedometer-outline" size={18} color="#2563eb" />
          </View>
          <Text style={styles.kpiValue}>{activeSession.wordsPerMinute}</Text>
          <Text style={styles.kpiLabel}>{t.speedometerLabel}</Text>
        </View>

        {/* KPI 2: Accuracy */}
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="checkmark-done-circle-outline" size={18} color="#059669" />
          </View>
          <Text style={styles.kpiValue}>{activeSession.accuracyPercent}%</Text>
          <Text style={styles.kpiLabel}>{t.summaryAccuracy}</Text>
        </View>

        {/* KPI 3: Streak */}
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#fff7ed' }]}>
            <Ionicons name="flame-outline" size={18} color="#ea580c" />
          </View>
          <Text style={styles.kpiValue}>{stats.streakDays}</Text>
          <Text style={styles.kpiLabel}>{t.daysStreak}</Text>
        </View>

        {/* KPI 4: Total Words */}
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#faf5ff' }]}>
            <Ionicons name="book-outline" size={18} color="#7c3aed" />
          </View>
          <Text style={styles.kpiValue}>{stats.totalWords || activeSession.totalWords}</Text>
          <Text style={styles.kpiLabel}>{t.summaryWordsRead}</Text>
        </View>
      </View>

      {/* Session Breakdown Bar */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {language === 'es' ? 'Desglose de la Sesión' : 'Session Breakdown'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {activeSession.totalWords} {language === 'es' ? 'palabras totales leídas en' : 'words read in'} {activeSession.durationSeconds}s
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

      {/* Interactive Practice Flashcards Deck */}
      <View style={styles.sectionCard}>
        <View style={styles.deckHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>{t.practiceWordsTitle}</Text>
            <Text style={styles.sectionSubtitle}>
              {language === 'es'
                ? 'Palabras sugeridas por la IA para practicar en voz alta hoy'
                : t.practiceWordsSubtitle}
            </Text>
          </View>
          <View style={styles.deckBadge}>
            <Text style={styles.deckBadgeText}>
              {activeSession.errors.length} {language === 'es' ? 'palabras' : 'words'}
            </Text>
          </View>
        </View>

        {activeSession.errors.length === 0 ? (
          <View style={styles.emptyDeckBox}>
            <Text style={styles.emptyDeckEmoji}>🌟</Text>
            <Text style={styles.emptyDeckTitle}>
              {language === 'es' ? '¡Lectura Impecable!' : 'Flawless Reading!'}
            </Text>
            <Text style={styles.emptyDeckSubtitle}>
              {language === 'es'
                ? 'No se detectaron vacilaciones ni errores de pronunciación en esta página.'
                : 'No errors were detected on this page.'}
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
                          {isHesitation
                            ? (language === 'es' ? `Pausa (${err.hesitationSeconds || 1.9}s)` : `Hesitation (${err.hesitationSeconds || 1.9}s)`)
                            : (language === 'es' ? 'Pronunciación' : 'Practice Needed')}
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
                      <Ionicons name="volume-high" size={15} color="#ea580c" />
                      <Text style={styles.listenErrorBtnText}>
                        {language === 'es' ? 'Escuchar' : 'Listen'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.explainErrorBtn}
                      onPress={() => onOpenWordExplainer(err.word, activeSession.pageTitle)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="sparkles" size={14} color="#2563eb" />
                      <Text style={styles.explainErrorBtnText}>
                        {language === 'es' ? 'Explicar' : 'Explain'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Meta AI Pedagogical Advice Card */}
      <View style={styles.pedagogicalCard}>
        <View style={styles.pedagogicalHeaderRow}>
          <Text style={styles.pedagogicalMascot}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pedagogicalTitle}>
              {language === 'es' ? 'Consejo Pedagógico para Padres' : 'Parent Pedagogical Tip'}
            </Text>
            <Text style={styles.pedagogicalSub}>Meta Muse Spark 1.3</Text>
          </View>
        </View>
        <Text style={styles.pedagogicalText}>
          {language === 'es'
            ? 'Practica la lectura repetida de la misma página 2 veces seguidas. La primera vez sirve para decodificar las palabras nuevas; la segunda vez permite al niño concentrarse en la entonación y comprender el sentido de la historia con alegría.'
            : 'Practice repeated reading of the same page twice. The first pass allows decoding unfamiliar vocabulary; the second pass allows the child to focus on expression, phrasing, and full comprehension.'}
        </Text>
      </View>

      {/* Back to Reading Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBackToReading}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={16} color="#0f172a" />
        <Text style={styles.backButtonText}>
          {language === 'es' ? 'Volver a la Sala de Lectura' : t.backToReadingBtn}
        </Text>
      </TouchableOpacity>

      {/* 8. Printable Offline Activity Sheet Modal ("Sparky en Papel") */}
      <Modal visible={printModalVisible} animationType="slide" transparent onRequestClose={() => setPrintModalVisible(false)}>
        <View style={styles.printModalBackdrop}>
          <View style={styles.printModalCard}>
            <View style={styles.printModalHeader}>
              <View style={styles.printHeaderLeft}>
                <Text style={styles.printHeaderTitle}>
                  {language === 'es' ? '📄 Ficha de Práctica Offline' : '📄 Printable Activity Sheet'}
                </Text>
                <Text style={styles.printHeaderSub}>
                  {language === 'es' ? 'Para practicar en papel y cuaderno sin pantalla' : 'For screen-free physical book practice'}
                </Text>
              </View>
              <TouchableOpacity style={styles.printCloseCircle} onPress={() => setPrintModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.printModalBody} contentContainerStyle={styles.printModalContent}>
              <View style={styles.sheetPaperLook}>
                <View style={styles.sheetPaperTop}>
                  <Text style={styles.sheetSchoolName}>SPARKY READING INITIATIVE • UNESCO ERCE</Text>
                  <Text style={styles.sheetDateRow}>
                    {language === 'es' ? `Estudiante: ${selectedStudent.name} (${selectedStudent.grade})` : `Student: ${selectedStudent.name} (${selectedStudent.grade})`}
                    {'   •   '}
                    {activeSession ? activeSession.date : new Date().toLocaleDateString()}
                  </Text>
                  <Text style={styles.sheetBookTitle}>📖 {activeSession?.pageTitle}</Text>
                </View>

                {/* Exercise 1: Syllable breakdown */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>
                    {language === 'es' ? '1. Divide en sílabas y lee en voz alta:' : '1. Syllable division & read aloud:'}
                  </Text>
                  {activeSession?.errors && activeSession.errors.length > 0 ? (
                    activeSession.errors.map((err, eIdx) => (
                      <View key={eIdx} style={styles.sheetWordRow}>
                        <Text style={styles.sheetTargetWord}>• {err.word}</Text>
                        <Text style={styles.sheetSyllableDots}>
                          [ {err.syllables ? err.syllables.join(' - ') : err.word} ]
                        </Text>
                        <Text style={styles.sheetCheckBox}>☐ Leído con éxito</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.sheetWordRow}>• hummingbird [ hum - ming - bird ]  ☐ Leído con éxito</Text>
                  )}
                </View>

                {/* Exercise 2: Sentence Comprehension */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>
                    {language === 'es' ? '2. Escribe una oración con tu palabra favorita:' : '2. Write a sentence with your favorite word:'}
                  </Text>
                  <View style={styles.sheetLinedPaper}>
                    <View style={styles.sheetLine} />
                    <View style={styles.sheetLine} />
                    <View style={styles.sheetLine} />
                  </View>
                </View>

                {/* Exercise 3: Tutor Signature */}
                <View style={styles.sheetSignRow}>
                  <View style={styles.sheetSignCol}>
                    <View style={styles.sheetSignLine} />
                    <Text style={styles.sheetSignText}>
                      {language === 'es' ? 'Firma del Padre / Tutor' : 'Parent / Tutor Signature'}
                    </Text>
                  </View>
                  <View style={styles.sheetSignCol}>
                    <View style={styles.sheetSignLine} />
                    <Text style={styles.sheetSignText}>
                      {language === 'es' ? 'Firma del Maestro' : 'Teacher Signature'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.printModalFooter}>
              <TouchableOpacity
                style={styles.printActionBtn}
                onPress={() => {
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    window.print();
                  } else {
                    Alert.alert('Ficha Generada', 'Puedes imprimir esta ficha o compartirla por WhatsApp.');
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="print" size={18} color="#ffffff" />
                <Text style={styles.printActionBtnText}>
                  {language === 'es' ? 'Imprimir Ficha' : 'Print to Paper (PDF)'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    gap: 14,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 220,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  shareButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  benchmarkBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 8,
  },
  benchmarkLeft: {
    flex: 1,
    minWidth: 180,
  },
  benchmarkLevel: {
    fontSize: 14,
    fontWeight: '800',
  },
  benchmarkDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  benchmarkTargetChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  benchmarkTargetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
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
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  breakdownBox: {
    flex: 1,
    minWidth: 80,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  breakdownNumber: {
    fontSize: 18,
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
  deckBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  deckBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  emptyDeckBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  emptyDeckEmoji: {
    fontSize: 28,
  },
  emptyDeckTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  emptyDeckSubtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  errorsCardsList: {
    gap: 8,
  },
  errorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorCardLeft: {
    flex: 1,
    minWidth: 160,
    gap: 3,
  },
  errorWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorWordTitle: {
    fontSize: 15,
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
    fontSize: 9,
    fontWeight: '700',
  },
  mispronouncedTag: {
    backgroundColor: '#fee2e2',
  },
  mispronouncedTagText: {
    color: '#991b1b',
    fontSize: 9,
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
    gap: 6,
  },
  listenErrorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
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
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
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
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    gap: 6,
  },
  pedagogicalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pedagogicalMascot: {
    fontSize: 20,
  },
  pedagogicalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  pedagogicalSub: {
    fontSize: 10,
    color: '#3b82f6',
  },
  pedagogicalText: {
    fontSize: 11,
    color: '#1e3a8a',
    lineHeight: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 4,
  },
  backButtonText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  printSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  printSheetText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '800',
  },
  studentPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  studentNameTextActive: {
    color: '#ffffff',
  },
  studentGradeTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  studentGradeTagActive: {
    backgroundColor: '#0369a1',
  },
  studentGradeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  studentGradeTextActive: {
    color: '#ffffff',
  },
  printModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  printModalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  printModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  printHeaderLeft: {
    flex: 1,
  },
  printHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  printHeaderSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  printCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printModalBody: {
    flex: 1,
  },
  printModalContent: {
    padding: 16,
  },
  sheetPaperLook: {
    backgroundColor: '#fffdfa',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    padding: 18,
    gap: 16,
  },
  sheetPaperTop: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    gap: 4,
  },
  sheetSchoolName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  sheetDateRow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  sheetBookTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  sheetSection: {
    gap: 8,
  },
  sheetSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  sheetWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 6,
  },
  sheetTargetWord: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetSyllableDots: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  sheetCheckBox: {
    fontSize: 11,
    color: '#64748b',
  },
  sheetLinedPaper: {
    gap: 12,
    paddingVertical: 6,
  },
  sheetLine: {
    height: 1,
    backgroundColor: '#94a3b8',
    borderStyle: 'dashed',
  },
  sheetSignRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sheetSignCol: {
    alignItems: 'center',
    width: 140,
  },
  sheetSignLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#64748b',
    marginBottom: 6,
  },
  sheetSignText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  printModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  printActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomWidth: 3,
    borderBottomColor: '#059669',
  },
  printActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

