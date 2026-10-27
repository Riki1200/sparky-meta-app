import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ReadingSessionResult, ReadingErrorDetail, SupportedLanguage } from "../types";
import { getReadingHistory, getReadingStats } from "../services/storageService";
import { speakWordPhonetically, playChime } from "../services/ttsService";
import { getTranslation } from "../i18n/translations";

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
  const [studentName, setStudentName] = useState(language === "es" ? "Mateo (Lector)" : "Leo (Reader)");

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
      source: "Nature Tales for Young Readers",
      errors: [
        {
          word: "fluttered",
          display: "fluttered",
          errorType: "hesitation",
          hesitationSeconds: 1.9,
          syllables: ["flut", "tered"],
        },
        {
          word: "courage",
          display: "courage",
          errorType: "mispronounced",
          spokenWord: "curage",
          syllables: ["cour", "age"],
        },
      ],
    },
    es: {
      title: "El Gallito Cantor del Cibao",
      source: "Cuentos y Tradiciones Dominicanas",
      errors: [
        {
          word: "madrugada",
          display: "madrugada.",
          errorType: "hesitation",
          hesitationSeconds: 2.1,
          syllables: ["ma", "dru", "ga", "da"],
        },
        {
          word: "resplandor",
          display: "resplandor",
          errorType: "mispronounced",
          spokenWord: "resplandorando",
          syllables: ["res", "plan", "dor"],
        },
      ],
    },
    fr: {
      title: "Le Petit Colibri du Matin",
      source: "Contes de la Nature pour Enfants",
      errors: [
        {
          word: "agitait",
          display: "agitait",
          errorType: "hesitation",
          hesitationSeconds: 1.8,
          syllables: ["a", "gi", "tait"],
        },
        {
          word: "courage",
          display: "courage",
          errorType: "mispronounced",
          spokenWord: "curage",
          syllables: ["cou", "rage"],
        },
      ],
    },
    pt: {
      title: "O Pequeno Beija-Flor Dourado",
      source: "Contos da Natureza Infantil",
      errors: [
        {
          word: "coloridas",
          display: "coloridas",
          errorType: "hesitation",
          hesitationSeconds: 1.9,
          syllables: ["co", "lo", "ri", "das"],
        },
        {
          word: "coragem",
          display: "coragem",
          errorType: "mispronounced",
          spokenWord: "coragem",
          syllables: ["co", "ra", "gem"],
        },
      ],
    },
    de: {
      title: "Der kleine Kolibri und die Zauberblume",
      source: "Naturmärchen für Kinder",
      errors: [
        {
          word: "flatterte",
          display: "flatterte",
          errorType: "hesitation",
          hesitationSeconds: 1.9,
          syllables: ["flat", "ter", "te"],
        },
        {
          word: "friedlich",
          display: "friedlich",
          errorType: "mispronounced",
          spokenWord: "fridlich",
          syllables: ["fried", "lich"],
        },
      ],
    },
    it: {
      title: "Il Piccolo Colibrì e il Fiore d'Oro",
      source: "Fiabe della Natura per Bambini",
      errors: [
        {
          word: "sbatteva",
          display: "sbatteva",
          errorType: "hesitation",
          hesitationSeconds: 1.8,
          syllables: ["sbat", "te", "va"],
        },
        {
          word: "profumato",
          display: "profumato",
          errorType: "mispronounced",
          spokenWord: "profumate",
          syllables: ["pro", "fu", "ma", "to"],
        },
      ],
    },
    nl: {
      title: "De Kleine Kolibrie en de Bloem",
      source: "Natuurverhalen voor Jonge Lezers",
      errors: [
        {
          word: "fladderde",
          display: "fladderde",
          errorType: "hesitation",
          hesitationSeconds: 2.0,
          syllables: ["flad", "der", "de"],
        },
        {
          word: "kleurrijke",
          display: "kleurrijke",
          errorType: "mispronounced",
          spokenWord: "kleurrik",
          syllables: ["kleur", "rij", "ke"],
        },
      ],
    },
    pl: {
      title: "Mały Koliber i Kolorowy Ogród",
      source: "Bajki Przyrodnicze dla Dzieci",
      errors: [
        {
          word: "trzepotał",
          display: "trzepotał",
          errorType: "hesitation",
          hesitationSeconds: 1.9,
          syllables: ["trze", "po", "tał"],
        },
        {
          word: "skrzydełkami",
          display: "skrzydełkami",
          errorType: "mispronounced",
          spokenWord: "skrzydelkami",
          syllables: ["skrzy", "deł", "ka", "mi"],
        },
      ],
    },
    tr: {
      title: "Küçük Sinek Kuşunun Uçuşu",
      source: "Çocuklar İçin Doğa Masalları",
      errors: [
        {
          word: "kanatlarını",
          display: "kanatlarını",
          errorType: "hesitation",
          hesitationSeconds: 2.1,
          syllables: ["ka", "nat", "la", "rı", "nı"],
        },
        {
          word: "rengarenk",
          display: "rengarenk",
          errorType: "mispronounced",
          spokenWord: "rengarek",
          syllables: ["ren", "ga", "renk"],
        },
      ],
    },
  };

  const defaultDemoSession: ReadingSessionResult = {
    id: "demo_session_1",
    pageId: "default-page",
    pageTitle: demoTitles[language]?.title || demoTitles.en.title,
    bookSource: demoTitles[language]?.source || demoTitles.en.source,
    language,
    date: language === "es" ? "Hoy, 2:30 PM" : "Today, 2:30 PM",
    durationSeconds: 32,
    totalWords: 36,
    correctWords: 32,
    hesitationWords: 2,
    mispronouncedWords: 2,
    skippedWords: 0,
    accuracyPercent: 92,
    wordsPerMinute: 68,
    gradeLevel: language === "en" ? "Grade 1-2 (Early Reader)" : "1er - 2do Grado",
    errors: demoTitles[language]?.errors || demoTitles.en.errors,
  };

  const activeSession = currentSession || (history.length > 0 ? history[0] : defaultDemoSession);

  const getWpmEvaluation = (wpm: number) => {
    if (wpm >= 70) {
      return {
        level: language === "es" ? "Fluidez Óptima" : language === "fr" ? "Fluidité Optimale" : language === "pt" ? "Fluência Ótima" : "Optimal Fluency",
        color: "#059669",
        bg: "#ecfdf5",
        borderColor: "#a7f3d0",
        note: language === "es"
          ? "Por encima del promedio de grado (Meta UNESCO ERCE superada)"
          : language === "fr"
          ? "Au-dessus de la moyenne de sa classe"
          : language === "pt"
          ? "Acima da média para o ano escolar"
          : "Above target grade level (UNESCO ERCE benchmark)",
      };
    }
    if (wpm >= 45) {
      return {
        level: language === "es" ? "Fluidez en Desarrollo" : language === "fr" ? "Fluidité en Progrès" : language === "pt" ? "Fluência em Desenvolvimento" : "Developing Fluency",
        color: "#d97706",
        bg: "#fffbeb",
        borderColor: "#fde68a",
        note: language === "es"
          ? "Cerca de la meta de fluidez lectora (45-60 WPM)"
          : language === "fr"
          ? "Proche de l’objectif de fluidité"
          : language === "pt"
          ? "Perto da meta de fluência leitora"
          : "Approaching grade target (45-60 WPM)",
      };
    }
    return {
      level: language === "es" ? "Requiere Apoyo y Paciencia" : language === "fr" ? "Besoin d’Encouragement" : language === "pt" ? "Necessita de Apoio e Prática" : "Needs Support & Practice",
      color: "#ea580c",
      bg: "#fff7ed",
      borderColor: "#fed7aa",
      note: language === "es"
        ? "Práctica recomendada de 10 min/día con libros de papel"
        : language === "fr"
        ? "Pratique quotidienne de 10 min conseillée"
        : language === "pt"
        ? "Prática de 10 minutos ao dia recomendada"
        : "Recommended 10 min daily practice with physical books",
    };
  };

  const handleShareReport = () => {
    if (!activeSession) return;
    const summaryText =
      `📚 *Reporte de Lectura - Sparky Lector (Meta Muse Spark)*\n` +
      `👤 *Estudiante:* ${studentName}\n` +
      `📖 *Cuento:* ${activeSession.pageTitle}\n` +
      `⚡ *Velocidad:* ${activeSession.wordsPerMinute} WPM (Palabras por minuto)\n` +
      `🎯 *Precisión:* ${activeSession.accuracyPercent}%\n` +
      `⏱️ *Duración:* ${activeSession.durationSeconds}s (${activeSession.totalWords} palabras)\n` +
      `📝 *Palabras para practicar hoy:* ${activeSession.errors.map((e) => e.word).join(", ") || "¡Ninguna! Lectura perfecta"}\n\n` +
      `✨ *Enviado desde Sparky - Tutor IA para libros físicos escolares*`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopiedAlert(true);
      playChime("sparkle");
      setTimeout(() => setCopiedAlert(false), 3000);
    } else {
      Alert.alert(language === "es" ? "Reporte Copiado" : "Report Ready", summaryText);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 1. Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{t.reportTitle}</Text>
            <View style={styles.liveTag}>
              <View style={styles.liveTagDot} />
              <Text style={styles.liveTagText}>
                {language === "es" ? "ACTUALIZADO" : "UPDATED"}
              </Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>{t.reportSubtitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareReport}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-whatsapp" size={17} color="#ffffff" />
          <Text style={styles.shareButtonText}>
            {copiedAlert ? (language === "es" ? "¡Copiado para WhatsApp!" : "Copied!") : (language === "es" ? "Compartir con Maestro" : t.shareReportBtn)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Shared Device & Universal Access Banner (Responde a la duda: ¿Y si el niño no tiene teléfono?) */}
      <View style={styles.sharedDeviceCard}>
        <View style={styles.sharedDeviceIconCircle}>
          <Ionicons name="phone-portrait-outline" size={22} color="#0284c7" />
        </View>
        <View style={styles.sharedDeviceContent}>
          <View style={styles.sharedDeviceHeaderRow}>
            <Text style={styles.sharedDeviceTitle}>
              {language === "es"
                ? "U0001f4f1 Modo Dispositivo Familiar o Aula de Clases"
                : "U0001f4f1 Family-Shared Device or Classroom Station"}
            </Text>
            <View style={styles.noPhoneNeededBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#059669" />
              <Text style={styles.noPhoneNeededText}>
                {language === "es" ? "No requiere teléfono infantil" : "No child phone needed"}
              </Text>
            </View>
          </View>
          <Text style={styles.sharedDeviceDesc}>
            {language === "es"
              ? "Tu hijo no necesita un teléfono propio. Esta sesión se guarda localmente en este dispositivo compartido (teléfono de papá/mamá o laptop escolar) protegiendo su privacidad COPPA."
              : "Children do not need their own phone. Reading sessions are saved securely on this shared family or classroom device without child accounts."}
          </Text>
          <View style={styles.studentPillRow}>
            <Text style={styles.studentLabel}>{language === "es" ? "Perfil activo:" : "Active reader:"}</Text>
            <View style={styles.studentPill}>
              <Text style={styles.studentEmoji}>👦</Text>
              <Text style={styles.studentNameText}>{studentName}</Text>
            </View>
            <View style={styles.gradePill}>
              <Text style={styles.gradePillText}>{activeSession ? activeSession.gradeLevel : "1er - 2do Grado"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3. KPI Bento Grid */}
      <View style={styles.kpiGrid}>
        {/* Speed */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconCircle, { backgroundColor: "#eff6ff" }]}>
              <Ionicons name="speedometer" size={18} color="#2563eb" />
            </View>
            <Text style={styles.kpiBadgeLabel}>WPM</Text>
          </View>
          <Text style={styles.kpiValue}>
            {activeSession ? `${activeSession.wordsPerMinute}` : `${stats.avgWpm || 0}`}
          </Text>
          <Text style={styles.kpiLabel}>{t.speedometerLabel}</Text>
          <Text style={styles.kpiMiniSub}>
            {language === "es" ? "Meta de grado: 60-80 WPM" : "Grade target: 60-80 WPM"}
          </Text>
        </View>

        {/* Accuracy */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconCircle, { backgroundColor: "#ecfdf5" }]}>
              <Ionicons name="checkmark-done" size={18} color="#059669" />
            </View>
            <Text style={[styles.kpiBadgeLabel, { color: "#059669" }]}>%</Text>
          </View>
          <Text style={styles.kpiValue}>
            {activeSession ? `${activeSession.accuracyPercent}%` : `${stats.avgAccuracy || 0}%`}
          </Text>
          <Text style={styles.kpiLabel}>{t.summaryAccuracy}</Text>
          <Text style={styles.kpiMiniSub}>
            {language === "es" ? "Palabras correctas" : "Correct pronunciation"}
          </Text>
        </View>

        {/* Streak */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconCircle, { backgroundColor: "#fff7ed" }]}>
              <Ionicons name="flame" size={18} color="#ea580c" />
            </View>
            <Text style={[styles.kpiBadgeLabel, { color: "#ea580c" }]}>
              {t.daysStreak}
            </Text>
          </View>
          <Text style={styles.kpiValue}>{stats.streakDays}</Text>
          <Text style={styles.kpiLabel}>{t.daysStreak}</Text>
          <Text style={styles.kpiMiniSub}>
            {language === "es" ? "Constancia diaria" : "Daily reading habit"}
          </Text>
        </View>

        {/* Words Read */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconCircle, { backgroundColor: "#f5f3ff" }]}>
              <Ionicons name="book" size={18} color="#7c3aed" />
            </View>
            <Text style={[styles.kpiBadgeLabel, { color: "#7c3aed" }]}>TOTAL</Text>
          </View>
          <Text style={styles.kpiValue}>{stats.totalWords || (activeSession?.totalWords || 0)}</Text>
          <Text style={styles.kpiLabel}>{t.summaryWordsRead}</Text>
          <Text style={styles.kpiMiniSub}>
            {language === "es" ? "En libros reales" : "Across printed books"}
          </Text>
        </View>
      </View>

      {activeSession && (
        <>
          {/* 4. Grade Benchmark Evaluation Banner */}
          {(() => {
            const evalInfo = getWpmEvaluation(activeSession.wordsPerMinute);
            return (
              <View style={[styles.evalBanner, { backgroundColor: evalInfo.bg, borderColor: evalInfo.borderColor }]}>
                <View style={styles.evalLeft}>
                  <Text style={[styles.evalLevel, { color: evalInfo.color }]}>
                    U0001f4ca {evalInfo.level}
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

          {/* 5. Breakdown Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>{t.summarySpeed}</Text>
                <Text style={styles.sectionSubtitle}>
                  {activeSession.pageTitle} ({activeSession.totalWords} palabras, {activeSession.durationSeconds}s)
                </Text>
              </View>
            </View>

            <View style={styles.breakdownRow}>
              <View style={[styles.breakdownBox, { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }]}>
                <Text style={[styles.breakdownNumber, { color: "#047857" }]}>
                  {activeSession.correctWords}
                </Text>
                <Text style={styles.breakdownLabel}>{t.legendCorrect}</Text>
              </View>

              <View style={[styles.breakdownBox, { backgroundColor: "#fefce8", borderColor: "#fde047" }]}>
                <Text style={[styles.breakdownNumber, { color: "#a16207" }]}>
                  {activeSession.hesitationWords}
                </Text>
                <Text style={styles.breakdownLabel}>{t.legendHesitation}</Text>
              </View>

              <View style={[styles.breakdownBox, { backgroundColor: "#fff1f2", borderColor: "#fecdd3" }]}>
                <Text style={[styles.breakdownNumber, { color: "#be123c" }]}>
                  {activeSession.mispronouncedWords}
                </Text>
                <Text style={styles.breakdownLabel}>{t.legendMispronounced}</Text>
              </View>

              <View style={[styles.breakdownBox, { backgroundColor: "#f5f3ff", borderColor: "#ddd6fe" }]}>
                <Text style={[styles.breakdownNumber, { color: "#6d28d9" }]}>
                  {activeSession.skippedWords}
                </Text>
                <Text style={styles.breakdownLabel}>{t.legendSkipped}</Text>
              </View>
            </View>
          </View>

          {/* 6. Words to Practice Deck (Flashcards for Tutors/Parents) */}
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
                <Text style={styles.emptyErrorsEmoji}>U0001f31f</Text>
                <Text style={styles.emptyErrorsText}>
                  {language === "es"
                    ? "¡Lectura impecable! No se detectaron errores en esta página."
                    : "Flawless reading! No errors detected on this page."}
                </Text>
              </View>
            ) : (
              <View style={styles.errorsCardsList}>
                {activeSession.errors.map((err, idx) => {
                  const isHesitation = err.errorType === "hesitation";
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
                                ? (language === "es" ? `Pausa de ${err.hesitationSeconds || 1.8}s` : `Hesitation (${err.hesitationSeconds}s)`)
                                : (language === "es" ? `Dijo: "${err.spokenWord || "..."}"` : `Said: "${err.spokenWord || "..."}"`)}
                            </Text>
                          </View>
                        </View>

                        {err.syllables && (
                          <View style={styles.syllableContainer}>
                            <Text style={styles.syllableLabel}>{t.wordSyllables}:</Text>
                            <View style={styles.syllableChipsRow}>
                              {err.syllables.map((syl, sIdx) => (
                                <View key={sIdx} style={styles.syllableChip}>
                                  <Text style={styles.syllableChipText}>{syl}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
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
                          <Ionicons name="sparkles" size={15} color="#4f46e5" />
                          <Text style={styles.explainErrorBtnText}>{t.tabExplain}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* 7. Meta Muse Spark Pedagogical Note */}
          <View style={styles.pedagogicalCard}>
            <View style={styles.pedagogicalHeaderRow}>
              <Text style={styles.pedagogicalMascot}>✨</Text>
              <View>
                <Text style={styles.pedagogicalTitle}>
                  {language === "es" ? "Consejo Pedagógico para Padres (Meta Muse Spark)" : "Sparky Pedagogical Advice (Meta Muse Spark)"}
                </Text>
                <Text style={styles.pedagogicalSub}>
                  {t.tagline}
                </Text>
              </View>
            </View>
            <Text style={styles.pedagogicalText}>
              {language === "es"
                ? "U0001f4a1 Consejo práctico de 10 minutos: Pídele al niño que vuelva a leer esta misma página en voz alta. La primera lectura sirvió para descifrar el vocabulario; la segunda le permitirá concentrarse en el tono, las pausas y disfrutar la historia con total seguridad."
                : "U0001f4a1 10-Minute Parent Tip: Ask your child to re-read this page once more. The first pass allowed decoding unfamiliar vocabulary; the second pass allows them to focus on expression, rhythm, and joyful comprehension."}
            </Text>
          </View>
        </>
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
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 20,
    gap: 16,
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
  },
  headerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexWrap: "wrap",
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 260,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  liveTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 3,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#059669", // WhatsApp emerald green
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  shareButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
  },
  sharedDeviceCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "#f0f9ff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#bae6fd",
  },
  sharedDeviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  sharedDeviceContent: {
    flex: 1,
    gap: 6,
  },
  sharedDeviceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  sharedDeviceTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0369a1",
  },
  noPhoneNeededBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  noPhoneNeededText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065f46",
  },
  sharedDeviceDesc: {
    fontSize: 12,
    color: "#075985",
    lineHeight: 18,
  },
  studentPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  studentLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0284c7",
  },
  studentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  studentEmoji: {
    fontSize: 12,
  },
  studentNameText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
  },
  gradePill: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  gradePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  kpiTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  kpiIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiBadgeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "700",
    marginTop: 2,
  },
  kpiMiniSub: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "500",
    marginTop: 2,
  },
  evalBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    flexWrap: "wrap",
    gap: 10,
  },
  evalLeft: {
    flex: 1,
    minWidth: 220,
  },
  evalLevel: {
    fontSize: 16,
    fontWeight: "900",
  },
  evalNote: {
    fontSize: 12,
    color: "#334155",
    marginTop: 3,
  },
  benchmarkTargetPill: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  benchmarkTargetText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },
  breakdownRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  breakdownBox: {
    flex: 1,
    minWidth: 110,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
  },
  breakdownNumber: {
    fontSize: 22,
    fontWeight: "900",
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginTop: 2,
    textAlign: "center",
  },
  deckHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  deckCountBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  deckCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4f46e5",
  },
  emptyErrorsBox: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
  },
  emptyErrorsEmoji: {
    fontSize: 32,
  },
  emptyErrorsText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "700",
  },
  errorsCardsList: {
    gap: 10,
  },
  errorCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexWrap: "wrap",
    gap: 12,
  },
  errorCardLeft: {
    flex: 1,
    minWidth: 200,
    gap: 6,
  },
  errorWordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorWordTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "capitalize",
  },
  errorTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  hesitationTag: {
    backgroundColor: "#fef3c7",
  },
  hesitationTagText: {
    color: "#92400e",
    fontSize: 10,
    fontWeight: "800",
  },
  mispronouncedTag: {
    backgroundColor: "#fee2e2",
  },
  mispronouncedTagText: {
    color: "#991b1b",
    fontSize: 10,
    fontWeight: "800",
  },
  errorTypeTagText: {},
  syllableContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  syllableLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  syllableChipsRow: {
    flexDirection: "row",
    gap: 4,
  },
  syllableChip: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  syllableChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0f172a",
  },
  errorCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listenErrorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff7ed",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  listenErrorBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ea580c",
  },
  explainErrorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  explainErrorBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4f46e5",
  },
  pedagogicalCard: {
    backgroundColor: "#f5f3ff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#ddd6fe",
    gap: 8,
  },
  pedagogicalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pedagogicalMascot: {
    fontSize: 22,
  },
  pedagogicalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4338ca",
  },
  pedagogicalSub: {
    fontSize: 11,
    color: "#6366f1",
  },
  pedagogicalText: {
    fontSize: 12,
    color: "#312e81",
    lineHeight: 18,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginTop: 4,
    marginBottom: 24,
  },
  backButtonText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "800",
  },
});
