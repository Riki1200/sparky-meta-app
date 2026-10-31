import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SupportedLanguage } from "../types";
import { useTheme } from "../context/ThemeContext";
import { DISPLAY_FONT } from "../styles/theme";
import { playChime } from "../services/ttsService";
import {
  getUserProfile,
  saveUserProfile,
  setOnboardingCompleted,
  hasConfirmedAdult,
  setAdultConfirmed,
  UserProfile,
} from "../services/storageService";

interface OnboardingWizardModalProps {
  visible: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
}

// Reader avatars are Ionicons glyph names (persisted in the user profile)
const AVATAR_OPTIONS: { id: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { id: "star", icon: "star" },
  { id: "paw", icon: "paw" },
  { id: "rocket", icon: "rocket" },
  { id: "planet", icon: "planet" },
  { id: "leaf", icon: "leaf" },
  { id: "heart", icon: "heart" },
];
const getAvatarIcon = (id: string) =>
  (AVATAR_OPTIONS.find((a) => a.id === id) || AVATAR_OPTIONS[0]).icon;

const I18N: Record<
  SupportedLanguage,
  {
    skip: string;
    stepOf: string;
    next: string;
    back: string;
    finish: string;
    step1Title: string;
    step1Subtitle: string;
    namePlaceholder: string;
    nameLabel: string;
    levelLabel: string;
    levelBeginner: string;
    levelBeginnerDesc: string;
    levelIntermediate: string;
    levelIntermediateDesc: string;
    levelAdvanced: string;
    levelAdvancedDesc: string;
    step2Title: string;
    step2Subtitle: string;
    howStep1Title: string;
    howStep1Desc: string;
    howStep2Title: string;
    howStep2Desc: string;
    howStep3Title: string;
    howStep3Desc: string;
    step3Title: string;
    step3Subtitle: string;
    fontPreviewLabel: string;
    fontPreviewText: string;
    fontLexend: string;
    fontComic: string;
    fontDyslexic: string;
    featureRuler: string;
    featureRulerDesc: string;
    featureSyllables: string;
    featureSyllablesDesc: string;
    step4Title: string;
    step4Subtitle: string;
    goalLabel: string;
    minutesUnit: string;
    unescoBadge: string;
    welcomeGiftTitle: string;
    welcomeGiftDesc: string;
    readyTitle: string;
    ageConfirm: string;
    ageRequired: string;
  }
> = {
  es: {
    skip: "Saltar",
    stepOf: "Paso {current} de {total}",
    next: "Siguiente",
    back: "Atrás",
    finish: "Empezar a leer",
    step1Title: "¡Hola! Soy Sparky",
    step1Subtitle: "Tu tutor inteligente de lectura con IA de Meta. ¿Cómo te llamas?",
    nameLabel: "¿Quién va a leer hoy?",
    namePlaceholder: "Escribe tu nombre o apodo...",
    levelLabel: "Selecciona tu nivel de lectura:",
    levelBeginner: "Primeros pasos",
    levelBeginnerDesc: "Letras, sonidos y palabras cortas y comunes.",
    levelIntermediate: "Ganando fluidez",
    levelIntermediateDesc: "Textos cortos, ritmo constante y pronunciación clara.",
    levelAdvanced: "Lector con confianza",
    levelAdvancedDesc: "Textos más largos, comprensión y vocabulario nuevo.",
    step2Title: "¿Cómo Funciona Sparky?",
    step2Subtitle: "Practica con páginas impresas reales, con la guía de Meta AI.",
    howStep1Title: "1. Escanea tu Libro Físico",
    howStep1Desc: "Toma una foto de cualquier página impresa (un libro, una carta, un aviso) o elige un texto de muestra.",
    howStep2Title: "2. Lee en Voz Alta",
    howStep2Desc: "El micrófono inteligente detecta tu voz en tiempo real: verde para aciertos, amarillo para repasar.",
    howStep3Title: "3. Toca Cualquier Palabra",
    howStep3Desc: "¿Te trabas en una palabra? Tócala. Sparky la separa en sílabas, la pronuncia y te la explica.",
    step3Title: "Lectura Cómoda y Accesible",
    step3Subtitle: "Ajusta el texto para leer con comodidad, con opciones para dislexia.",
    fontPreviewLabel: "Vista previa en vivo:",
    fontPreviewText: "El colibrí vuela entre las flores con alas veloces.",
    fontLexend: "Lexend Deca (Fluidez)",
    fontComic: "Comic (Redondeada)",
    fontDyslexic: "OpenDyslexic (Fácil)",
    featureRuler: "Regla Guía de Enfoque",
    featureRulerDesc: "Resalta la palabra actual para que no pierdas el lugar.",
    featureSyllables: "Separador de Sílabas",
    featureSyllablesDesc: "Divide palabras difíciles en trocitos fáciles (co-li-brí).",
    step4Title: "Todo listo",
    step4Subtitle: "Fija una pequeña meta diaria de lectura. La práctica corta y constante mejora la fluidez.",
    goalLabel: "Meta diaria recomendada:",
    minutesUnit: "min/día",
    unescoBadge: "Hábito diario de lectura",
    welcomeGiftTitle: "¡Regalo de Bienvenida!",
    welcomeGiftDesc: "Empiezas con 45 estrellas y ganas más cada vez que terminas una página.",
    ageConfirm: "Confirmo que tengo 18 años o más",
    ageRequired: "Sparky está pensado para adultos (18+). Confirma tu edad para continuar.",
    readyTitle: "¿Listo para leer tu primera página?",
  },
  en: {
    skip: "Skip",
    stepOf: "Step {current} of {total}",
    next: "Next",
    back: "Back",
    finish: "Start reading",
    step1Title: "Hi there! I am Sparky",
    step1Subtitle: "Your Meta AI-powered smart reading tutor. What is your name?",
    nameLabel: "Who is reading today?",
    namePlaceholder: "Type your name or nickname...",
    levelLabel: "Select reading stage:",
    levelBeginner: "First steps",
    levelBeginnerDesc: "Letters, sounds and short, common words.",
    levelIntermediate: "Building fluency",
    levelIntermediateDesc: "Short texts, a steady pace and clear pronunciation.",
    levelAdvanced: "Confident reader",
    levelAdvancedDesc: "Longer texts, comprehension and new vocabulary.",
    step2Title: "How Sparky Works",
    step2Subtitle: "Practice with real printed pages, guided by Meta AI.",
    howStep1Title: "1. Scan Real Physical Books",
    howStep1Desc: "Take a photo of any printed page (a book, a letter, a notice) or pick a sample text.",
    howStep2Title: "2. Read Aloud to Sparky",
    howStep2Desc: "Smart speech recognition highlights words live: green for fluent, amber to practice.",
    howStep3Title: "3. Tap Any Tricky Word",
    howStep3Desc: "Stuck on a word? Tap it. Sparky splits it into syllables, says it aloud and explains it.",
    step3Title: "Comfort & Accessibility",
    step3Subtitle: "Adjust the text so reading is comfortable, including dyslexia-friendly options.",
    fontPreviewLabel: "Live font preview:",
    fontPreviewText: "The hummingbird hovers over colorful garden blossoms.",
    fontLexend: "Lexend Deca (Fluency)",
    fontComic: "Comic (Rounded)",
    fontDyslexic: "OpenDyslexic (Dyslexia)",
    featureRuler: "Focus Reading Line",
    featureRulerDesc: "Highlights the current word so you do not lose your place.",
    featureSyllables: "Syllable Phonics Splits",
    featureSyllablesDesc: "Splits long words into friendly chunks (hum-ming-bird).",
    step4Title: "All set",
    step4Subtitle: "Set a small daily reading goal. Short, regular practice builds fluency.",
    goalLabel: "Daily practice goal:",
    minutesUnit: "min/day",
    unescoBadge: "Daily reading habit",
    welcomeGiftTitle: "Welcome Gift!",
    welcomeGiftDesc: "You start with 45 stars and earn more each time you finish a page.",
    ageConfirm: "I confirm I am 18 or older",
    ageRequired: "Sparky is designed for adults (18+). Confirm your age to continue.",
    readyTitle: "Ready to read your first page?",
  },
  fr: {
    skip: "Passer",
    stepOf: "Étape {current} sur {total}",
    next: "Suivant",
    back: "Retour",
    finish: "Commencer à lire",
    step1Title: "Bonjour ! Je suis Sparky",
    step1Subtitle: "Ton tuteur de lecture intelligent propulsé par Meta AI.",
    nameLabel: "Comment t'appelles-tu ?",
    namePlaceholder: "Entre ton prénom...",
    levelLabel: "Niveau de lecture :",
    levelBeginner: "Premiers pas",
    levelBeginnerDesc: "Lettres, sons et mots courts et courants.",
    levelIntermediate: "Gagner en fluidité",
    levelIntermediateDesc: "Textes courts, rythme régulier et prononciation claire.",
    levelAdvanced: "Lecteur confiant",
    levelAdvancedDesc: "Textes plus longs, compréhension et nouveau vocabulaire.",
    step2Title: "Comment fonctionne Sparky ?",
    step2Subtitle: "Entraîne-toi sur de vraies pages imprimées, guidé par Meta AI.",
    howStep1Title: "1. Scanne ton livre",
    howStep1Desc: "Prends en photo une page imprimée (un livre, une lettre, un avis) ou choisis un texte d'exemple.",
    howStep2Title: "2. Lis à voix haute",
    howStep2Desc: "Sparky écoute ta prononciation en direct.",
    howStep3Title: "3. Touche un mot difficile",
    howStep3Desc: "Bloqué sur un mot ? Touche-le. Sparky le découpe en syllabes, le prononce et l'explique.",
    step3Title: "Typographie & Confort",
    step3Subtitle: "Ajuste le texte pour lire confortablement, avec des options adaptées à la dyslexie.",
    fontPreviewLabel: "Aperçu de la police en direct :",
    fontPreviewText: "Le colibri vole joyeusement au-dessus des fleurs.",
    fontLexend: "Lexend (Fluidité)",
    fontComic: "Comic (Arrondie)",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Guide de lecture",
    featureRulerDesc: "Met en évidence le mot en cours pour ne pas perdre le fil.",
    featureSyllables: "Découpage syllabique",
    featureSyllablesDesc: "Découpe les mots longs.",
    step4Title: "Tout est prêt",
    step4Subtitle: "Fixe un petit objectif de lecture quotidien. Une pratique courte et régulière améliore la fluidité.",
    goalLabel: "Objectif quotidien :",
    minutesUnit: "min/jour",
    unescoBadge: "Habitude de lecture quotidienne",
    welcomeGiftTitle: "Cadeau de Bienvenue !",
    welcomeGiftDesc: "Tu commences avec 45 étoiles et tu en gagnes à chaque page terminée.",
    ageConfirm: "Je confirme avoir 18 ans ou plus",
    ageRequired: "Sparky est conçu pour les adultes (18+). Confirme ton âge pour continuer.",
    readyTitle: "Prêt à lire ta première page ?",
  },
  pt: {
    skip: "Pular",
    stepOf: "Passo {current} de {total}",
    next: "Avançar",
    back: "Voltar",
    finish: "Começar a ler",
    step1Title: "Olá! Eu sou o Sparky",
    step1Subtitle: "Seu tutor de leitura inteligente com IA da Meta.",
    nameLabel: "Quem vai ler hoje?",
    namePlaceholder: "Digite seu nome...",
    levelLabel: "Selecione o nível de leitura:",
    levelBeginner: "Primeiros passos",
    levelBeginnerDesc: "Letras, sons e palavras curtas e comuns.",
    levelIntermediate: "Ganhando fluência",
    levelIntermediateDesc: "Textos curtos, ritmo constante e pronúncia clara.",
    levelAdvanced: "Leitor confiante",
    levelAdvancedDesc: "Textos mais longos, compreensão e vocabulário novo.",
    step2Title: "Como Funciona o Sparky?",
    step2Subtitle: "Pratique com páginas impressas reais, com a ajuda da Meta AI.",
    howStep1Title: "1. Escaneie seu Livro Físico",
    howStep1Desc: "Tire uma foto de qualquer página impressa (um livro, uma carta, um aviso) ou escolha um texto de exemplo.",
    howStep2Title: "2. Leia em Voz Alta",
    howStep2Desc: "O microfone ouve sua leitura palavra por palavra.",
    howStep3Title: "3. Toque em Palavras Difíceis",
    howStep3Desc: "Travou em uma palavra? Toque nela. Sparky separa em sílabas, pronuncia e explica.",
    step3Title: "Conforto e Acessibilidade",
    step3Subtitle: "Ajuste o texto para ler com conforto, com opções para dislexia.",
    fontPreviewLabel: "Pré-visualização em tempo real:",
    fontPreviewText: "O beija-flor voa ligeiro entre as flores coloridas.",
    fontLexend: "Lexend Deca",
    fontComic: "Comic (Arredondada)",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Régua de Foco",
    featureRulerDesc: "Destaca a palavra atual para você não perder o lugar.",
    featureSyllables: "Divisão Silábica",
    featureSyllablesDesc: "Facilita palavras compridas.",
    step4Title: "Tudo pronto",
    step4Subtitle: "Defina uma pequena meta diária de leitura. Prática curta e regular melhora a fluência.",
    goalLabel: "Meta diária:",
    minutesUnit: "min/dia",
    unescoBadge: "Hábito diário de leitura",
    welcomeGiftTitle: "Presente de Boas-vindas!",
    welcomeGiftDesc: "Você começa com 45 estrelas e ganha mais a cada página concluída.",
    ageConfirm: "Confirmo que tenho 18 anos ou mais",
    ageRequired: "Sparky foi feito para adultos (18+). Confirme sua idade para continuar.",
    readyTitle: "Pronto para ler sua primeira página?",
  },
  de: {
    skip: "Überspringen",
    stepOf: "Schritt {current} von {total}",
    next: "Weiter",
    back: "Zurück",
    finish: "Lesen beginnen",
    step1Title: "Hallo! Ich bin Sparky",
    step1Subtitle: "Dein intelligenter Lesetutor mit Meta KI.",
    nameLabel: "Wer liest heute?",
    namePlaceholder: "Name eingeben...",
    levelLabel: "Lesestufe auswählen:",
    levelBeginner: "Erste Schritte",
    levelBeginnerDesc: "Buchstaben, Laute und kurze, häufige Wörter.",
    levelIntermediate: "Flüssiger werden",
    levelIntermediateDesc: "Kurze Texte, gleichmäßiges Tempo und klare Aussprache.",
    levelAdvanced: "Sicher lesen",
    levelAdvancedDesc: "Längere Texte, Textverständnis und neuer Wortschatz.",
    step2Title: "So funktioniert Sparky",
    step2Subtitle: "Übe mit echten gedruckten Seiten, begleitet von Meta AI.",
    howStep1Title: "1. Buchseite scannen",
    howStep1Desc: "Fotografiere eine gedruckte Seite (ein Buch, einen Brief, einen Aushang) oder wähle einen Beispieltext.",
    howStep2Title: "2. Laut vorlesen",
    howStep2Desc: "Sparky hört zu und markiert gelesene Wörter grün.",
    howStep3Title: "3. Schwierige Wörter antippen",
    howStep3Desc: "Hängst du an einem Wort? Tippe darauf. Sparky teilt es in Silben, spricht es vor und erklärt es.",
    step3Title: "Schrift & Komfort",
    step3Subtitle: "Passe den Text an, damit Lesen bequem ist, auch mit Optionen bei Legasthenie.",
    fontPreviewLabel: "Live-Schriftvorschau:",
    fontPreviewText: "Der Kolibri fliegt flink von Blüte zu Blüte.",
    fontLexend: "Lexend Deca",
    fontComic: "Comic (Abgerundet)",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Leselineal",
    featureRulerDesc: "Hebt das aktuelle Wort hervor, damit du die Stelle nicht verlierst.",
    featureSyllables: "Silbentrennung",
    featureSyllablesDesc: "Erleichtert lange Wörter.",
    step4Title: "Alles bereit",
    step4Subtitle: "Setze dir ein kleines tägliches Leseziel. Kurzes, regelmäßiges Üben stärkt den Lesefluss.",
    goalLabel: "Tägliches Ziel:",
    minutesUnit: "Min/Tag",
    unescoBadge: "Tägliche Lesegewohnheit",
    welcomeGiftTitle: "Willkommensgeschenk!",
    welcomeGiftDesc: "Du startest mit 45 Sternen und bekommst mehr für jede gelesene Seite.",
    ageConfirm: "Ich bestätige, dass ich 18 Jahre oder älter bin",
    ageRequired: "Sparky ist für Erwachsene (18+) gedacht. Bestätige dein Alter, um fortzufahren.",
    readyTitle: "Bereit für deine erste Seite?",
  },
  it: {
    skip: "Salta",
    stepOf: "Passo {current} di {total}",
    next: "Avanti",
    back: "Indietro",
    finish: "Inizia a leggere",
    step1Title: "Ciao! Sono Sparky",
    step1Subtitle: "Il tuo tutor intelligente di lettura con Meta AI.",
    nameLabel: "Chi legge oggi?",
    namePlaceholder: "Scrivi il tuo nome...",
    levelLabel: "Seleziona il livello:",
    levelBeginner: "Primi passi",
    levelBeginnerDesc: "Lettere, suoni e parole brevi e comuni.",
    levelIntermediate: "Più scorrevolezza",
    levelIntermediateDesc: "Testi brevi, ritmo costante e pronuncia chiara.",
    levelAdvanced: "Lettore sicuro",
    levelAdvancedDesc: "Testi più lunghi, comprensione e nuovo vocabolario.",
    step2Title: "Come Funziona Sparky?",
    step2Subtitle: "Esercitati su vere pagine stampate, con la guida di Meta AI.",
    howStep1Title: "1. Scansiona il Libro",
    howStep1Desc: "Scatta una foto di una pagina stampata (un libro, una lettera, un avviso) o scegli un testo di esempio.",
    howStep2Title: "2. Leggi ad Alta Voce",
    howStep2Desc: "Sparky ascolta la tua pronuncia in tempo reale.",
    howStep3Title: "3. Tocca le Parole Difficili",
    howStep3Desc: "Bloccato su una parola? Toccala. Sparky la divide in sillabe, la pronuncia e la spiega.",
    step3Title: "Caratteri & Accessibilità",
    step3Subtitle: "Regola il testo per leggere comodamente, con opzioni per la dislessia.",
    fontPreviewLabel: "Anteprima dal vivo:",
    fontPreviewText: "Il colibrì vola veloce tra i fiori profumati.",
    fontLexend: "Lexend Deca",
    fontComic: "Comic (Arrotondato)",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Guida di Riga",
    featureRulerDesc: "Evidenzia la parola corrente per non perdere il segno.",
    featureSyllables: "Divisione in Sillabe",
    featureSyllablesDesc: "Facilita le parole lunghe.",
    step4Title: "Tutto pronto",
    step4Subtitle: "Imposta un piccolo obiettivo di lettura quotidiano. Una pratica breve e costante migliora la fluidità.",
    goalLabel: "Obiettivo:",
    minutesUnit: "min/giorno",
    unescoBadge: "Abitudine di lettura quotidiana",
    welcomeGiftTitle: "Regalo di Benvenuto!",
    welcomeGiftDesc: "Inizi con 45 stelle e ne guadagni altre per ogni pagina completata.",
    ageConfirm: "Confermo di avere 18 anni o più",
    ageRequired: "Sparky è pensato per adulti (18+). Conferma la tua età per continuare.",
    readyTitle: "Pronto a leggere la tua prima pagina?",
  },
  nl: {
    skip: "Overslaan",
    stepOf: "Stap {current} van {total}",
    next: "Volgende",
    back: "Terug",
    finish: "Begin met lezen",
    step1Title: "Hallo! Ik ben Sparky",
    step1Subtitle: "Jouw slimme leestutor met Meta AI.",
    nameLabel: "Wie leest er vandaag?",
    namePlaceholder: "Typ je naam...",
    levelLabel: "Kies leesniveau:",
    levelBeginner: "Eerste stappen",
    levelBeginnerDesc: "Letters, klanken en korte, veelgebruikte woorden.",
    levelIntermediate: "Vlotter lezen",
    levelIntermediateDesc: "Korte teksten, een rustig tempo en duidelijke uitspraak.",
    levelAdvanced: "Zelfverzekerd lezen",
    levelAdvancedDesc: "Langere teksten, begrip en nieuwe woorden.",
    step2Title: "Hoe werkt Sparky?",
    step2Subtitle: "Oefen met echte gedrukte pagina's, begeleid door Meta AI.",
    howStep1Title: "1. Scan een papieren boek",
    howStep1Desc: "Maak een foto van een gedrukte pagina (een boek, een brief, een mededeling) of kies een voorbeeldtekst.",
    howStep2Title: "2. Lees hardop voor",
    howStep2Desc: "Sparky luistert en markeert woorden live.",
    howStep3Title: "3. Tik op moeilijke woorden",
    howStep3Desc: "Vast bij een woord? Tik erop. Sparky splitst het in lettergrepen, spreekt het uit en legt het uit.",
    step3Title: "Lettertype & Comfort",
    step3Subtitle: "Pas de tekst aan zodat lezen prettig is, ook met opties bij dyslexie.",
    fontPreviewLabel: "Live lettertype voorbeeld:",
    fontPreviewText: "De kolibrie vliegt vrolijk langs de bloemen.",
    fontLexend: "Lexend Deca",
    fontComic: "Comic (Afgerond)",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Leesliniaal",
    featureRulerDesc: "Markeert het huidige woord zodat je je plek niet kwijtraakt.",
    featureSyllables: "Lettergrepen",
    featureSyllablesDesc: "Verdeelt lange woorden.",
    step4Title: "Alles klaar",
    step4Subtitle: "Stel een klein dagelijks leesdoel. Kort en regelmatig oefenen verbetert de leesvloeiendheid.",
    goalLabel: "Dagelijks doel:",
    minutesUnit: "min/dag",
    unescoBadge: "Dagelijkse leesgewoonte",
    welcomeGiftTitle: "Welkomstcadeau!",
    welcomeGiftDesc: "Je begint met 45 sterren en verdient er meer bij elke voltooide pagina.",
    ageConfirm: "Ik bevestig dat ik 18 jaar of ouder ben",
    ageRequired: "Sparky is bedoeld voor volwassenen (18+). Bevestig je leeftijd om verder te gaan.",
    readyTitle: "Klaar om je eerste pagina te lezen?",
  },
  pl: {
    skip: "Pomiń",
    stepOf: "Krok {current} z {total}",
    next: "Dalej",
    back: "Wstecz",
    finish: "Zacznij czytać",
    step1Title: "Cześć! Jestem Sparky",
    step1Subtitle: "Twój inteligentny korepetytor czytania z Meta AI.",
    nameLabel: "Kto dzisiaj czyta?",
    namePlaceholder: "Wpisz imię...",
    levelLabel: "Poziom czytania:",
    levelBeginner: "Pierwsze kroki",
    levelBeginnerDesc: "Litery, dźwięki i krótkie, częste słowa.",
    levelIntermediate: "Coraz płynniej",
    levelIntermediateDesc: "Krótkie teksty, równe tempo i wyraźna wymowa.",
    levelAdvanced: "Pewny czytelnik",
    levelAdvancedDesc: "Dłuższe teksty, rozumienie i nowe słownictwo.",
    step2Title: "Jak działa Sparky?",
    step2Subtitle: "Ćwicz na prawdziwych drukowanych stronach z pomocą Meta AI.",
    howStep1Title: "1. Zeskanuj stronę",
    howStep1Desc: "Zrób zdjęcie dowolnej drukowanej strony (książki, listu, ogłoszenia) albo wybierz przykładowy tekst.",
    howStep2Title: "2. Czytaj na głos",
    howStep2Desc: "Sparky słucha i podświetla słowa w czasie rzeczywistym.",
    howStep3Title: "3. Dotknij trudnego słowa",
    howStep3Desc: "Utknąłeś na słowie? Dotknij go. Sparky podzieli je na sylaby, wymówi i wyjaśni.",
    step3Title: "Czcionka i Wygoda",
    step3Subtitle: "Dostosuj tekst, aby czytało się wygodnie, także z opcjami przy dysleksji.",
    fontPreviewLabel: "Podgląd czcionki na żywo:",
    fontPreviewText: "Koliber szybuje zwinnie pośród kwiatów.",
    fontLexend: "Lexend Deca",
    fontComic: "Comic (Zaokrąglona)",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Linijka skupienia",
    featureRulerDesc: "Podświetla bieżące słowo, aby nie zgubić miejsca.",
    featureSyllables: "Podział na sylaby",
    featureSyllablesDesc: "Ułatwia długie słowa.",
    step4Title: "Wszystko gotowe",
    step4Subtitle: "Ustal mały dzienny cel czytania. Krótka, regularna praktyka poprawia płynność.",
    goalLabel: "Dzienny cel:",
    minutesUnit: "min/dzień",
    unescoBadge: "Codzienny nawyk czytania",
    welcomeGiftTitle: "Prezent Powitalny!",
    welcomeGiftDesc: "Zaczynasz z 45 gwiazdkami i zdobywasz kolejne za każdą ukończoną stronę.",
    ageConfirm: "Potwierdzam, że mam co najmniej 18 lat",
    ageRequired: "Sparky jest przeznaczony dla dorosłych (18+). Potwierdź wiek, aby kontynuować.",
    readyTitle: "Gotowy, by przeczytać pierwszą stronę?",
  },
  tr: {
    skip: "Geç",
    stepOf: "Adım {current} / {total}",
    next: "İleri",
    back: "Geri",
    finish: "Okumaya başla",
    step1Title: "Merhaba! Ben Sparky",
    step1Subtitle: "Meta AI destekli akıllı okuma arkadaşın.",
    nameLabel: "Bugün kim okuyor?",
    namePlaceholder: "İsmini yaz...",
    levelLabel: "Okuma seviyesi:",
    levelBeginner: "İlk adımlar",
    levelBeginnerDesc: "Harfler, sesler ve kısa, sık kullanılan kelimeler.",
    levelIntermediate: "Akıcılık kazanma",
    levelIntermediateDesc: "Kısa metinler, düzenli tempo ve net telaffuz.",
    levelAdvanced: "Kendinden emin okur",
    levelAdvancedDesc: "Daha uzun metinler, anlama ve yeni kelimeler.",
    step2Title: "Sparky Nasıl Çalışır?",
    step2Subtitle: "Meta AI rehberliğinde gerçek basılı sayfalarla pratik yap.",
    howStep1Title: "1. Gerçek Kitabını Tara",
    howStep1Desc: "Herhangi bir basılı sayfanın (kitap, mektup, duyuru) fotoğrafını çek ya da örnek bir metin seç.",
    howStep2Title: "2. Sesli Oku",
    howStep2Desc: "Sparky telaffuzunu anlık dinler ve kelimeleri yeşil yapar.",
    howStep3Title: "3. Zor Kelimeye Dokun",
    howStep3Desc: "Bir kelimede mi takıldın? Ona dokun. Sparky onu hecelere ayırır, seslendirir ve açıklar.",
    step3Title: "Konfor & Erişilebilirlik",
    step3Subtitle: "Rahat okumak için metni ayarla; disleksiye uygun seçenekler de var.",
    fontPreviewLabel: "Canlı yazı tipi önizlemesi:",
    fontPreviewText: "Küçük sinek kuşu renkli çiçekler arasında kanat çırpar.",
    fontLexend: "Lexend Deca",
    fontComic: "Comic (Yuvarlak)",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Odak Çizgisi",
    featureRulerDesc: "Yerini kaybetmemen için o anki kelimeyi vurgular.",
    featureSyllables: "Heceleme Desteği",
    featureSyllablesDesc: "Uzun kelimeleri kolayca böler.",
    step4Title: "Her şey hazır",
    step4Subtitle: "Küçük bir günlük okuma hedefi belirle. Kısa ve düzenli pratik akıcılığı geliştirir.",
    goalLabel: "Günlük hedef:",
    minutesUnit: "dk/gün",
    unescoBadge: "Günlük okuma alışkanlığı",
    welcomeGiftTitle: "Hoş Geldin Hediyesi!",
    welcomeGiftDesc: "45 yıldızla başlarsın ve bitirdiğin her sayfada daha fazlasını kazanırsın.",
    ageConfirm: "18 yaşında veya daha büyük olduğumu onaylıyorum",
    ageRequired: "Sparky yetişkinler (18+) için tasarlandı. Devam etmek için yaşını onayla.",
    readyTitle: "İlk sayfanı okumaya hazır mısın?",
  },
};

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  visible,
  onClose,
  language,
}) => {
  const { theme } = useTheme();
  const t = I18N[language] || I18N.en;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  // Profile setup state
  const [readerName, setReaderName] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("star");
  const [readingLevel, setReadingLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [selectedFont, setSelectedFont] = useState<"lexend" | "comic" | "dyslexic">("lexend");
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(10);
  const [focusRulerEnabled, setFocusRulerEnabled] = useState<boolean>(true);
  const [syllableSplitsEnabled, setSyllableSplitsEnabled] = useState<boolean>(true);
  // Adults only (18+): nothing past step 1 until the reader confirms their age
  const [adultConfirmed, setAdultConfirmedState] = useState<boolean>(false);
  const [showAgeWarning, setShowAgeWarning] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setCurrentStep(1);
      loadExisting();
    }
  }, [visible]);

  const loadExisting = async () => {
    try {
      const p = await getUserProfile();
      if (p.name) setReaderName(p.name);
      // Older profiles stored an emoji here; fall back to the default avatar id
      if (p.avatar) setSelectedAvatar(AVATAR_OPTIONS.some((a) => a.id === p.avatar) ? p.avatar : "star");
      if (p.level) setReadingLevel(p.level);
      if (p.dailyGoalMinutes) setDailyGoalMinutes(p.dailyGoalMinutes);
      setAdultConfirmedState(await hasConfirmedAdult());
    } catch {}
  };

  const requireAdult = () => {
    if (adultConfirmed) return true;
    setCurrentStep(1);
    setShowAgeWarning(true);
    return false;
  };

  const toggleAdultConfirmed = () => {
    playChime("tap");
    const next = !adultConfirmed;
    setAdultConfirmedState(next);
    setAdultConfirmed(next);
    if (next) setShowAgeWarning(false);
  };

  const handleNext = () => {
    playChime("tap");
    if (!requireAdult()) return;
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    playChime("tap");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    playChime("complete");
    await saveUserProfile({
      // An empty name falls back to the localized default wherever it is shown
      name: readerName.trim(),
      avatar: selectedAvatar,
      level: readingLevel,
      dailyGoalMinutes,
    });
    await setOnboardingCompleted(true);
    onClose();
  };

  const handleSkip = async () => {
    playChime("tap");
    if (!requireAdult()) return;
    await setOnboardingCompleted(true);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleSkip}>
      <View style={styles.backdropOverlay}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {/* Top Progress Ribbon */}
          <LinearGradient
            colors={theme.gradients.rainbow}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rainbowTopLine}
          />

          {/* Top Bar with Step Dots and Skip */}
          <View style={styles.headerRow}>
            <View style={styles.stepBadge}>
              <Text style={[styles.stepBadgeText, { color: theme.primary }]}>
                {t.stepOf.replace("{current}", String(currentStep)).replace("{total}", String(totalSteps))}
              </Text>
            </View>

            {/* Dots */}
            <View style={styles.dotsRow}>
              {[1, 2, 3, 4].map((step) => {
                const isActive = step === currentStep;
                const isPassed = step < currentStep;
                return (
                  <View
                    key={step}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isActive
                          ? theme.primary
                          : isPassed
                          ? theme.badges.kpiAccuracyText
                          : theme.border,
                        width: isActive ? 24 : 8,
                      },
                    ]}
                  />
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleSkip}
              style={[styles.skipBtn, { backgroundColor: theme.surfaceSecondary }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.skipBtnText, { color: theme.textSecondary }]}>{t.skip}</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Body Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* STEP 1: Meet Sparky & Reader Setup */}
            {currentStep === 1 && (
              <View style={styles.stepContainer}>
                <LinearGradient
                  colors={theme.gradients.sparkyMascot}
                  style={styles.mascotBigBadge}
                >
                  <Ionicons name={getAvatarIcon(selectedAvatar)} size={40} color="#ffffff" />
                </LinearGradient>

                <Text style={[styles.stepTitle, { color: theme.text }]}>{t.step1Title}</Text>
                <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                  {t.step1Subtitle}
                </Text>

                {/* Age confirmation (18+) */}
                <TouchableOpacity
                  onPress={toggleAdultConfirmed}
                  style={[
                    styles.ageRow,
                    {
                      backgroundColor: adultConfirmed ? theme.primaryLight : theme.surfaceSecondary,
                      borderColor: showAgeWarning ? theme.words.mispronouncedBorder : adultConfirmed ? theme.primary : theme.border,
                    },
                  ]}
                  activeOpacity={0.8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: adultConfirmed }}
                >
                  <Ionicons
                    name={adultConfirmed ? "checkbox" : "square-outline"}
                    size={22}
                    color={adultConfirmed ? theme.primary : theme.textSecondary}
                  />
                  <Text style={[styles.ageText, { color: theme.text }]}>{t.ageConfirm}</Text>
                </TouchableOpacity>
                {showAgeWarning && (
                  <Text style={[styles.ageWarning, { color: theme.words.mispronouncedText }]}>{t.ageRequired}</Text>
                )}

                {/* Avatar Picker */}
                <View style={styles.avatarRow}>
                  {AVATAR_OPTIONS.map((item) => {
                    const isSelected = selectedAvatar === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          playChime("tap");
                          setSelectedAvatar(item.id);
                        }}
                        style={[
                          styles.avatarOption,
                          {
                            backgroundColor: isSelected ? theme.badges.kpiAccuracyBg : theme.surfaceSecondary,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Ionicons name={item.icon} size={24} color={isSelected ? theme.primary : theme.textSecondary} />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Name Input */}
                <View style={styles.inputWrap}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>{t.nameLabel}</Text>
                  <View
                    style={[
                      styles.textInputBox,
                      { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderActive },
                    ]}
                  >
                    <Ionicons name="person-outline" size={20} color={theme.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                      value={readerName}
                      onChangeText={setReaderName}
                      placeholder={t.namePlaceholder}
                      placeholderTextColor={theme.textMuted}
                      style={[styles.textInputField, { color: theme.text }]}
                      maxLength={24}
                    />
                  </View>
                </View>

                {/* Reading Level Selector */}
                <Text style={[styles.inputLabel, { color: theme.text, marginTop: 12 }]}>{t.levelLabel}</Text>
                <View style={styles.levelsList}>
                  {[
                    { key: "beginner", title: t.levelBeginner, desc: t.levelBeginnerDesc },
                    { key: "intermediate", title: t.levelIntermediate, desc: t.levelIntermediateDesc },
                    { key: "advanced", title: t.levelAdvanced, desc: t.levelAdvancedDesc },
                  ].map((lvl) => {
                    const isSelected = readingLevel === lvl.key;
                    return (
                      <TouchableOpacity
                        key={lvl.key}
                        onPress={() => {
                          playChime("tap");
                          setReadingLevel(lvl.key as any);
                        }}
                        style={[
                          styles.levelCard,
                          {
                            backgroundColor: isSelected ? theme.badges.kpiAccuracyBg : theme.surfaceSecondary,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.levelCardTitle,
                              { color: isSelected ? theme.badges.kpiAccuracyText : theme.text },
                            ]}
                          >
                            {lvl.title}
                          </Text>
                          <Text style={[styles.levelCardDesc, { color: theme.textSecondary }]}>
                            {lvl.desc}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 2: How Sparky Works (The Magic Cycle) */}
            {currentStep === 2 && (
              <View style={styles.stepContainer}>
                <View style={[styles.iconCircleBig, { backgroundColor: theme.badges.kpiAccuracyBg }]}>
                  <Ionicons name="book" size={32} color={theme.badges.kpiAccuracyText} />
                </View>

                <Text style={[styles.stepTitle, { color: theme.text }]}>{t.step2Title}</Text>
                <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                  {t.step2Subtitle}
                </Text>

                {/* 3 Step Magic Cards */}
                <View style={styles.howCardsCol}>
                  {/* Card 1 */}
                  <View style={[styles.howCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    <LinearGradient
                      colors={theme.gradients.btnSparkyReads}
                      style={styles.howCardIconBadge}
                    >
                      <Ionicons name="camera" size={20} color="#ffffff" />
                    </LinearGradient>
                    <View style={styles.howCardContent}>
                      <Text style={[styles.howCardTitle, { color: theme.text }]}>
                        {t.howStep1Title}
                      </Text>
                      <Text style={[styles.howCardDesc, { color: theme.textSecondary }]}>
                        {t.howStep1Desc}
                      </Text>
                    </View>
                  </View>

                  {/* Card 2 */}
                  <View style={[styles.howCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    <LinearGradient
                      colors={theme.gradients.starPill}
                      style={styles.howCardIconBadge}
                    >
                      <Ionicons name="mic" size={20} color="#ffffff" />
                    </LinearGradient>
                    <View style={styles.howCardContent}>
                      <Text style={[styles.howCardTitle, { color: theme.text }]}>
                        {t.howStep2Title}
                      </Text>
                      <Text style={[styles.howCardDesc, { color: theme.textSecondary }]}>
                        {t.howStep2Desc}
                      </Text>
                    </View>
                  </View>

                  {/* Card 3 */}
                  <View style={[styles.howCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    <LinearGradient
                      colors={theme.gradients.sparkyMascot}
                      style={styles.howCardIconBadge}
                    >
                      <Ionicons name="bulb" size={20} color="#ffffff" />
                    </LinearGradient>
                    <View style={styles.howCardContent}>
                      <Text style={[styles.howCardTitle, { color: theme.text }]}>
                        {t.howStep3Title}
                      </Text>
                      <Text style={[styles.howCardDesc, { color: theme.textSecondary }]}>
                        {t.howStep3Desc}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* STEP 3: Typography & Accessibility */}
            {currentStep === 3 && (
              <View style={styles.stepContainer}>
                <View style={[styles.iconCircleBig, { backgroundColor: theme.badges.kpiSpeedBg }]}>
                  <Ionicons name="text" size={32} color={theme.badges.kpiSpeedText} />
                </View>

                <Text style={[styles.stepTitle, { color: theme.text }]}>{t.step3Title}</Text>
                <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                  {t.step3Subtitle}
                </Text>

                {/* Font Live Preview */}
                <View
                  style={[
                    styles.fontPreviewCard,
                    { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderActive },
                  ]}
                >
                  <Text style={[styles.fontPreviewLabel, { color: theme.textMuted }]}>
                    {t.fontPreviewLabel}
                  </Text>
                  <Text
                    style={[
                      styles.fontPreviewSample,
                      {
                        color: theme.text,
                        fontFamily:
                          selectedFont === "lexend"
                            ? Platform.select({ web: "'Lexend Deca', sans-serif", default: "sans-serif" })
                            : selectedFont === "comic"
                            ? Platform.select({ web: "'Comic Sans MS', 'Chalkboard SE', cursive", default: "sans-serif" })
                            : Platform.select({ web: "'OpenDyslexic', sans-serif", default: "sans-serif" }),
                      },
                    ]}
                  >
                    "{t.fontPreviewText}"
                  </Text>
                </View>

                {/* Font Options */}
                <View style={styles.fontBtnsRow}>
                  {[
                    { id: "lexend", label: t.fontLexend },
                    { id: "comic", label: t.fontComic },
                    { id: "dyslexic", label: t.fontDyslexic },
                  ].map((f) => {
                    const isSelected = selectedFont === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() => {
                          playChime("tap");
                          setSelectedFont(f.id as any);
                        }}
                        style={[
                          styles.fontBtn,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.surfaceSecondary,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.fontBtnText,
                            { color: isSelected ? "#ffffff" : theme.text },
                          ]}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Feature Toggles */}
                <View style={styles.togglesCol}>
                  <TouchableOpacity
                    onPress={() => {
                      playChime("tap");
                      setFocusRulerEnabled(!focusRulerEnabled);
                    }}
                    style={[
                      styles.toggleRowCard,
                      { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleRowTitle, { color: theme.text }]}>
                        {t.featureRuler}
                      </Text>
                      <Text style={[styles.toggleRowDesc, { color: theme.textSecondary }]}>
                        {t.featureRulerDesc}
                      </Text>
                    </View>
                    <Ionicons
                      name={focusRulerEnabled ? "checkbox" : "square-outline"}
                      size={24}
                      color={focusRulerEnabled ? theme.primary : theme.textMuted}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      playChime("tap");
                      setSyllableSplitsEnabled(!syllableSplitsEnabled);
                    }}
                    style={[
                      styles.toggleRowCard,
                      { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleRowTitle, { color: theme.text }]}>
                        {t.featureSyllables}
                      </Text>
                      <Text style={[styles.toggleRowDesc, { color: theme.textSecondary }]}>
                        {t.featureSyllablesDesc}
                      </Text>
                    </View>
                    <Ionicons
                      name={syllableSplitsEnabled ? "checkbox" : "square-outline"}
                      size={24}
                      color={syllableSplitsEnabled ? theme.primary : theme.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 4: Goal & Confetti Finish */}
            {currentStep === 4 && (
              <View style={styles.stepContainer}>
                <LinearGradient
                  colors={theme.gradients.sparkyMascot}
                  style={styles.mascotBigBadge}
                >
                  <Ionicons name="trophy" size={40} color="#ffffff" />
                </LinearGradient>

                <Text style={[styles.stepTitle, { color: theme.text }]}>{t.step4Title}</Text>
                <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                  {t.step4Subtitle}
                </Text>

                {/* Daily Goal Selection */}
                <Text style={[styles.inputLabel, { color: theme.text, marginTop: 8 }]}>
                  {t.goalLabel}
                </Text>
                <View style={styles.goalRow}>
                  {[5, 10, 15].map((mins) => {
                    const isSelected = dailyGoalMinutes === mins;
                    return (
                      <TouchableOpacity
                        key={mins}
                        onPress={() => {
                          playChime("tap");
                          setDailyGoalMinutes(mins);
                        }}
                        style={[
                          styles.goalOption,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.surfaceSecondary,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.goalNumber,
                            { color: isSelected ? "#ffffff" : theme.text },
                          ]}
                        >
                          {mins}
                        </Text>
                        <Text
                          style={[
                            styles.goalUnit,
                            { color: isSelected ? "#ffffff" : theme.textSecondary },
                          ]}
                        >
                          {t.minutesUnit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* UNESCO Badge */}
                <View
                  style={[
                    styles.unescoCard,
                    { backgroundColor: theme.badges.kpiAccuracyBg, borderColor: theme.borderActive },
                  ]}
                >
                  <Text style={[styles.unescoCardText, { color: theme.badges.kpiAccuracyText }]}>
                    {t.unescoBadge}
                  </Text>
                </View>

                {/* Welcome Gift Box */}
                <LinearGradient
                  colors={theme.gradients.starPill}
                  style={styles.welcomeGiftCard}
                >
                  <Ionicons name="gift" size={30} color={theme.badges.starBadgeText} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.giftTitle}>{t.welcomeGiftTitle}</Text>
                    <Text style={styles.giftDesc}>{t.welcomeGiftDesc}</Text>
                  </View>
                </LinearGradient>
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions Row */}
          <View style={[styles.bottomBar, { borderTopColor: theme.border }]}>
            {currentStep > 1 ? (
              <TouchableOpacity
                onPress={handleBack}
                style={[styles.backBtn, { borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color={theme.text} style={{ marginRight: 4 }} />
                <Text style={[styles.backBtnText, { color: theme.text }]}>{t.back}</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 80 }} />
            )}

            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextTouchWrap}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  currentStep === totalSteps
                    ? theme.gradients.btnMicListening
                    : theme.gradients.tabActiveReading
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtnGradient}
              >
                <Text style={styles.nextBtnText}>
                  {currentStep === totalSteps ? t.finish : t.next}
                </Text>
                {currentStep < totalSteps && (
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdropOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 15, 30, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 580,
    maxHeight: "92%",
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 20,
    display: "flex",
    flexDirection: "column",
  },
  rainbowTopLine: {
    height: 6,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(100, 120, 240, 0.12)",
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  stepContainer: {
    alignItems: "center",
    paddingTop: 8,
  },
  mascotBigBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#2B2620",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircleBig: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  stepTitle: {
    ...DISPLAY_FONT,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  avatarRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  ageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "stretch",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  ageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  ageWarning: {
    alignSelf: "stretch",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  inputWrap: {
    width: "100%",
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  textInputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 46,
  },
  textInputField: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    outlineStyle: "none" as any,
  },
  levelsList: {
    width: "100%",
    gap: 8,
  },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  levelCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  levelCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  howCardsCol: {
    width: "100%",
    gap: 10,
  },
  howCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  howCardIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  howCardContent: {
    flex: 1,
  },
  howCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  howCardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  fontPreviewCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
  },
  fontPreviewLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fontPreviewSample: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
    textAlign: "center",
  },
  fontBtnsRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 14,
  },
  fontBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  fontBtnText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  togglesCol: {
    width: "100%",
    gap: 8,
  },
  toggleRowCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  toggleRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  toggleRowDesc: {
    fontSize: 12,
  },
  goalRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 12,
  },
  goalOption: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: "center",
  },
  goalNumber: {
    fontSize: 22,
    fontWeight: "800",
  },
  goalUnit: {
    fontSize: 11,
    fontWeight: "600",
  },
  unescoCard: {
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 12,
  },
  unescoCardText: {
    fontSize: 12,
    fontWeight: "700",
  },
  welcomeGiftCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  giftTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 2,
  },
  giftDesc: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 16,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  nextTouchWrap: {
    flex: 1,
  },
  nextBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
});
