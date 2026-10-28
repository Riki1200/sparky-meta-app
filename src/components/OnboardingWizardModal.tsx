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
import { playChime } from "../services/ttsService";
import {
  getUserProfile,
  saveUserProfile,
  setOnboardingCompleted,
  UserProfile,
} from "../services/storageService";

interface OnboardingWizardModalProps {
  visible: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
}

const AVATAR_OPTIONS = [
  { id: "star", emoji: "🌟", label: "Estrella" },
  { id: "lion", emoji: "🦁", label: "Leoncito" },
  { id: "rocket", emoji: "🚀", label: "Cosmonauta" },
  { id: "owl", emoji: "🦉", label: "Búho Sabio" },
  { id: "fox", emoji: "🦊", label: "Zorrito" },
  { id: "unicorn", emoji: "🦄", label: "Unicornio" },
];

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
  }
> = {
  es: {
    skip: "Saltar",
    stepOf: "Paso {current} de {total}",
    next: "Siguiente",
    back: "Atrás",
    finish: "¡Comenzar mi Aventura de Lectura! ✨",
    step1Title: "¡Hola! Soy Sparky ✨",
    step1Subtitle: "Tu tutor inteligente de lectura con IA de Meta. ¿Cómo te llamas?",
    nameLabel: "¿Quién va a leer hoy?",
    namePlaceholder: "Escribe tu nombre o apodo...",
    levelLabel: "Selecciona tu nivel de lectura:",
    levelBeginner: "🐣 Explorador (4 - 6 años)",
    levelBeginnerDesc: "Letras, sonidos de vocales y palabras cortas ilustradas.",
    levelIntermediate: "🌟 Aventurero (7 - 8 años)",
    levelIntermediateDesc: "Cuentos completos, ritmo y pronunciación fluida.",
    levelAdvanced: "🚀 Maestro Lector (9+ años)",
    levelAdvancedDesc: "Comprensión lectora, velocidad y vocabulario enriquecido.",
    step2Title: "¿Cómo Funciona Sparky?",
    step2Subtitle: "Lee libros reales de papel con la magia de la inteligencia artificial.",
    howStep1Title: "1. Escanea tu Libro Físico",
    howStep1Desc: "Toma una foto de cualquier página de papel con la cámara o elige uno de la biblioteca mágica.",
    howStep2Title: "2. Lee en Voz Alta",
    howStep2Desc: "El micrófono inteligente detecta tu voz en tiempo real: verde para aciertos, amarillo para repasar.",
    howStep3Title: "3. Toca Cualquier Palabra",
    howStep3Desc: "Si te trabas, tócala. Meta AI Tutor te la explicará en sílabas y te mostrará un dibujo ilustrado.",
    step3Title: "Lectura Cómoda y Accesible",
    step3Subtitle: "Personaliza la tipografía para que leer sea fácil y sin fatiga visual.",
    fontPreviewLabel: "Vista previa en vivo:",
    fontPreviewText: "El colibrí vuela entre las flores con alas veloces.",
    fontLexend: "Lexend Deca (Fluidez)",
    fontComic: "Comic (Infantil)",
    fontDyslexic: "OpenDyslexic (Fácil)",
    featureRuler: "Regla Guía de Enfoque",
    featureRulerDesc: "Resalta un solo renglón para no perder el hilo.",
    featureSyllables: "Separador de Sílabas",
    featureSyllablesDesc: "Divide palabras difíciles en trocitos fáciles (co-li-brí).",
    step4Title: "¡Todo Listo para Brillar!",
    step4Subtitle: "Fijemos tu primera meta diaria de lectura recomendada por UNESCO.",
    goalLabel: "Meta diaria recomendada:",
    minutesUnit: "min/día",
    unescoBadge: "🏆 Meta UNESCO ERCE para fluidez lectora",
    welcomeGiftTitle: "¡Regalo de Bienvenida!",
    welcomeGiftDesc: "Has recibido 45 Estrellas Mágicas 🌟 para desbloquear stickers y diplomas.",
    readyTitle: "¿Listo para empezar a leer tu primer cuento?",
  },
  en: {
    skip: "Skip",
    stepOf: "Step {current} of {total}",
    next: "Next",
    back: "Back",
    finish: "Start My Reading Adventure! ✨",
    step1Title: "Hi there! I am Sparky ✨",
    step1Subtitle: "Your Meta AI-powered smart reading tutor. What is your name?",
    nameLabel: "Who is reading today?",
    namePlaceholder: "Type your name or nickname...",
    levelLabel: "Select reading stage:",
    levelBeginner: "🐣 Early Reader (Ages 4 - 6)",
    levelBeginnerDesc: "Letters, phonics sounds, and short picture words.",
    levelIntermediate: "🌟 Story Adventurer (Ages 7 - 8)",
    levelIntermediateDesc: "Full storybooks, rhythm, and fluent pronunciation.",
    levelAdvanced: "🚀 Fluent Master (Ages 9+)",
    levelAdvancedDesc: "Comprehension, reading speed, and rich vocabulary.",
    step2Title: "How Sparky Works",
    step2Subtitle: "Read real physical paper books with the magic of artificial intelligence.",
    howStep1Title: "1. Scan Real Physical Books",
    howStep1Desc: "Snap a photo of any real page from home or school, or pick an illustrated classic.",
    howStep2Title: "2. Read Aloud to Sparky",
    howStep2Desc: "Smart speech recognition highlights words live: green for fluent, amber to practice.",
    howStep3Title: "3. Tap Any Tricky Word",
    howStep3Desc: "Stuck on a word? Tap it! Meta AI Tutor breaks it into syllables and shows picture cards.",
    step3Title: "Comfort & Accessibility",
    step3Subtitle: "Customize child typography for relaxed, dyslexia-friendly reading.",
    fontPreviewLabel: "Live font preview:",
    fontPreviewText: "The hummingbird hovers over colorful garden blossoms.",
    fontLexend: "Lexend Deca (Fluency)",
    fontComic: "Comic (Playful)",
    fontDyslexic: "OpenDyslexic (Dyslexia)",
    featureRuler: "Focus Reading Line",
    featureRulerDesc: "Keeps children locked onto the active line without skipping.",
    featureSyllables: "Syllable Phonics Splits",
    featureSyllablesDesc: "Splits long words into friendly chunks (hum-ming-bird).",
    step4Title: "You are Ready to Shine!",
    step4Subtitle: "Set your daily reading habit backed by UNESCO literacy benchmarks.",
    goalLabel: "Daily practice goal:",
    minutesUnit: "min/day",
    unescoBadge: "🏆 UNESCO ERCE recommended habit",
    welcomeGiftTitle: "Welcome Gift!",
    welcomeGiftDesc: "You earned 45 Magic Stars 🌟 to unlock collectible stickers and badges.",
    readyTitle: "Ready to dive into your first story?",
  },
  fr: {
    skip: "Passer",
    stepOf: "Étape {current} sur {total}",
    next: "Suivant",
    back: "Retour",
    finish: "Commencer l'Aventure de Lecture ! ✨",
    step1Title: "Bonjour ! Je suis Sparky ✨",
    step1Subtitle: "Ton tuteur de lecture intelligent propulsé par Meta AI.",
    nameLabel: "Comment t'appelles-tu ?",
    namePlaceholder: "Entre ton prénom...",
    levelLabel: "Niveau de lecture :",
    levelBeginner: "🐣 Débutant (4 - 6 ans)",
    levelBeginnerDesc: "Lettres et sons élémentaires.",
    levelIntermediate: "🌟 En progression (7 - 8 ans)",
    levelIntermediateDesc: "Contes illustrés et fluidité.",
    levelAdvanced: "🚀 Lecteur confirmé (9+ ans)",
    levelAdvancedDesc: "Compréhension et vocabulaire riche.",
    step2Title: "Comment fonctionne Sparky ?",
    step2Subtitle: "Lis de vrais livres papier avec l'aide de l'IA.",
    howStep1Title: "1. Scanne ton livre",
    howStep1Desc: "Prends en photo la page d'un livre papier.",
    howStep2Title: "2. Lis à voix haute",
    howStep2Desc: "Sparky écoute ta prononciation en direct.",
    howStep3Title: "3. Touche un mot difficile",
    howStep3Desc: "Le tuteur Meta AI t'explique le mot en syllabes avec des images.",
    step3Title: "Typographie & Confort",
    step3Subtitle: "Polices adaptées aux enfants et à la dyslexie.",
    fontPreviewLabel: "Aperçu de la police en direct :",
    fontPreviewText: "Le colibri vole joyeusement au-dessus des fleurs.",
    fontLexend: "Lexend (Fluidité)",
    fontComic: "Comic (Ludique)",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Guide de lecture",
    featureRulerDesc: "Aide à ne pas sauter de ligne.",
    featureSyllables: "Découpage syllabique",
    featureSyllablesDesc: "Découpe les mots longs.",
    step4Title: "Prêt à décoller !",
    step4Subtitle: "Fixe ton objectif quotidien de 10 minutes.",
    goalLabel: "Objectif quotidien :",
    minutesUnit: "min/jour",
    unescoBadge: "🏆 Recommandation UNESCO",
    welcomeGiftTitle: "Cadeau de Bienvenue !",
    welcomeGiftDesc: "45 Étoiles Magiques 🌟 offertes pour commencer.",
    readyTitle: "Prêt à lire ton premier conte ?",
  },
  pt: {
    skip: "Pular",
    stepOf: "Passo {current} de {total}",
    next: "Avançar",
    back: "Voltar",
    finish: "Começar Minha Aventura! ✨",
    step1Title: "Olá! Eu sou o Sparky ✨",
    step1Subtitle: "Seu tutor de leitura inteligente com IA da Meta.",
    nameLabel: "Quem vai ler hoje?",
    namePlaceholder: "Digite seu nome...",
    levelLabel: "Selecione o nível de leitura:",
    levelBeginner: "🐣 Leitor Inicial (4 - 6 anos)",
    levelBeginnerDesc: "Letras, fonemas e primeiras palavras.",
    levelIntermediate: "🌟 Aventureiro (7 - 8 anos)",
    levelIntermediateDesc: "Histórias completas e ritmo de voz.",
    levelAdvanced: "🚀 Mestre Leitor (9+ anos)",
    levelAdvancedDesc: "Velocidade, vocabulário e compreensão.",
    step2Title: "Como Funciona o Sparky?",
    step2Subtitle: "Leia livros reais de papel com auxílio de inteligência artificial.",
    howStep1Title: "1. Escaneie seu Livro Físico",
    howStep1Desc: "Tire uma foto de uma página real de livro.",
    howStep2Title: "2. Leia em Voz Alta",
    howStep2Desc: "O microfone ouve sua leitura palavra por palavra.",
    howStep3Title: "3. Toque em Palavras Difíceis",
    howStep3Desc: "O Meta AI Tutor divide em sílabas e mostra o dicionário visual.",
    step3Title: "Conforto e Acessibilidade",
    step3Subtitle: "Fontes especiais para dislexia e redução de cansaço visual.",
    fontPreviewLabel: "Pré-visualização em tempo real:",
    fontPreviewText: "O beija-flor voa ligeiro entre as flores coloridas.",
    fontLexend: "Lexend Deca",
    fontComic: "Comic Infantil",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Régua de Foco",
    featureRulerDesc: "Destaca uma linha por vez.",
    featureSyllables: "Divisão Silábica",
    featureSyllablesDesc: "Facilita palavras compridas.",
    step4Title: "Tudo Pronto!",
    step4Subtitle: "Estabeleça sua meta diária recomendada pela UNESCO.",
    goalLabel: "Meta diária:",
    minutesUnit: "min/dia",
    unescoBadge: "🏆 Padrão UNESCO ERCE",
    welcomeGiftTitle: "Presente de Boas-vindas!",
    welcomeGiftDesc: "Você ganhou 45 Estrelas Mágicas 🌟 para colecionar adesivos.",
    readyTitle: "Pronto para ler a primeira história?",
  },
  de: {
    skip: "Überspringen",
    stepOf: "Schritt {current} von {total}",
    next: "Weiter",
    back: "Zurück",
    finish: "Leseabenteuer starten! ✨",
    step1Title: "Hallo! Ich bin Sparky ✨",
    step1Subtitle: "Dein intelligenter Lesetutor mit Meta KI.",
    nameLabel: "Wer liest heute?",
    namePlaceholder: "Name eingeben...",
    levelLabel: "Lesestufe auswählen:",
    levelBeginner: "🐣 Leseanfänger (4 - 6 Jahre)",
    levelBeginnerDesc: "Buchstaben und erste Wörter.",
    levelIntermediate: "🌟 Fortgeschritten (7 - 8 Jahre)",
    levelIntermediateDesc: "Ganze Geschichten und flüssiges Lesen.",
    levelAdvanced: "🚀 Leseprofi (9+ Jahre)",
    levelAdvancedDesc: "Leseverständnis und Wortschatz.",
    step2Title: "So funktioniert Sparky",
    step2Subtitle: "Echte Papierbücher mit KI-Begleitung lesen.",
    howStep1Title: "1. Buchseite scannen",
    howStep1Desc: "Fotografiere eine Buchseite oder wähle eine Geschichte.",
    howStep2Title: "2. Laut vorlesen",
    howStep2Desc: "Sparky hört zu und markiert gelesene Wörter grün.",
    howStep3Title: "3. Schwierige Wörter antippen",
    howStep3Desc: "Meta KI Tutor erklärt Silben und zeigt Bildkarten.",
    step3Title: "Schrift & Komfort",
    step3Subtitle: "Kinderfreundliche und legastheniegerechte Schriftarten.",
    fontPreviewLabel: "Live-Schriftvorschau:",
    fontPreviewText: "Der Kolibri fliegt flink von Blüte zu Blüte.",
    fontLexend: "Lexend Deca",
    fontComic: "Comic Schrift",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Leselineal",
    featureRulerDesc: "Hält die Zeile im Blick.",
    featureSyllables: "Silbentrennung",
    featureSyllablesDesc: "Erleichtert lange Wörter.",
    step4Title: "Alles bereit!",
    step4Subtitle: "Tägliches Leseziel nach UNESCO-Empfehlung.",
    goalLabel: "Tägliches Ziel:",
    minutesUnit: "Min/Tag",
    unescoBadge: "🏆 UNESCO ERCE Standard",
    welcomeGiftTitle: "Willkommensgeschenk!",
    welcomeGiftDesc: "Du hast 45 Zaubersterne 🌟 erhalten.",
    readyTitle: "Bereit für deine erste Geschichte?",
  },
  it: {
    skip: "Salta",
    stepOf: "Passo {current} di {total}",
    next: "Avanti",
    back: "Indietro",
    finish: "Inizia l'Avventura di Lettura! ✨",
    step1Title: "Ciao! Sono Sparky ✨",
    step1Subtitle: "Il tuo tutor intelligente di lettura con Meta AI.",
    nameLabel: "Chi legge oggi?",
    namePlaceholder: "Scrivi il tuo nome...",
    levelLabel: "Seleziona il livello:",
    levelBeginner: "🐣 Primi Passi (4 - 6 anni)",
    levelBeginnerDesc: "Lettere, suoni e parole brevi.",
    levelIntermediate: "🌟 Avventuriero (7 - 8 anni)",
    levelIntermediateDesc: "Storie illustrate e ritmo.",
    levelAdvanced: "🚀 Lettore Esperto (9+ anni)",
    levelAdvancedDesc: "Comprensione e lessico arricchito.",
    step2Title: "Come Funziona Sparky?",
    step2Subtitle: "Leggi veri libri di carta con la magia dell'IA.",
    howStep1Title: "1. Scansiona il Libro",
    howStep1Desc: "Scatta una foto di una pagina cartacea.",
    howStep2Title: "2. Leggi ad Alta Voce",
    howStep2Desc: "Sparky ascolta la tua pronuncia in tempo reale.",
    howStep3Title: "3. Tocca le Parole Difficili",
    howStep3Desc: "Meta AI Tutor spiega le sillabe e mostra illustrazioni.",
    step3Title: "Caratteri & Accessibilità",
    step3Subtitle: "Font ad alta leggibilità per dislessia e bambini.",
    fontPreviewLabel: "Anteprima dal vivo:",
    fontPreviewText: "Il colibrì vola veloce tra i fiori profumati.",
    fontLexend: "Lexend Deca",
    fontComic: "Comic per Bambini",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Guida di Riga",
    featureRulerDesc: "Evita di saltare i righi.",
    featureSyllables: "Divisione in Sillabe",
    featureSyllablesDesc: "Facilita le parole lunghe.",
    step4Title: "Tutto Pronto!",
    step4Subtitle: "Imposta il tuo obiettivo giornaliero UNESCO.",
    goalLabel: "Obiettivo:",
    minutesUnit: "min/giorno",
    unescoBadge: "🏆 Raccomandazione UNESCO",
    welcomeGiftTitle: "Regalo di Benvenuto!",
    welcomeGiftDesc: "Hai ricevuto 45 Stelle Magiche 🌟.",
    readyTitle: "Pronto a leggere la tua prima storia?",
  },
  nl: {
    skip: "Overslaan",
    stepOf: "Stap {current} van {total}",
    next: "Volgende",
    back: "Terug",
    finish: "Start Leesavontuur! ✨",
    step1Title: "Hallo! Ik ben Sparky ✨",
    step1Subtitle: "Jouw slimme leestutor met Meta AI.",
    nameLabel: "Wie leest er vandaag?",
    namePlaceholder: "Typ je naam...",
    levelLabel: "Kies leesniveau:",
    levelBeginner: "🐣 Beginner (4 - 6 jaar)",
    levelBeginnerDesc: "Letters en eerste woorden.",
    levelIntermediate: "🌟 Lezer (7 - 8 jaar)",
    levelIntermediateDesc: "Verhalen en vlotheid.",
    levelAdvanced: "🚀 Gevorderd (9+ jaar)",
    levelAdvancedDesc: "Begrip en woordenschat.",
    step2Title: "Hoe werkt Sparky?",
    step2Subtitle: "Lees echte papieren boeken met slimme AI.",
    howStep1Title: "1. Scan een papieren boek",
    howStep1Desc: "Maak een foto van een pagina.",
    howStep2Title: "2. Lees hardop voor",
    howStep2Desc: "Sparky luistert en markeert woorden live.",
    howStep3Title: "3. Tik op moeilijke woorden",
    howStep3Desc: "Meta AI Tutor legt lettergrepen en plaatjes uit.",
    step3Title: "Lettertype & Comfort",
    step3Subtitle: "Dyslexie-vriendelijk en gemakkelijk leesbaar.",
    fontPreviewLabel: "Live lettertype voorbeeld:",
    fontPreviewText: "De kolibrie vliegt vrolijk langs de bloemen.",
    fontLexend: "Lexend Deca",
    fontComic: "Comic",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Leesliniaal",
    featureRulerDesc: "Voorkomt het overslaan van regels.",
    featureSyllables: "Lettergrepen",
    featureSyllablesDesc: "Verdeelt lange woorden.",
    step4Title: "Je bent er klaar voor!",
    step4Subtitle: "Kies je dagelijkse leesdoel.",
    goalLabel: "Dagelijks doel:",
    minutesUnit: "min/dag",
    unescoBadge: "🏆 UNESCO richtlijn",
    welcomeGiftTitle: "Welkomstcadeau!",
    welcomeGiftDesc: "Je hebt 45 Magische Sterren 🌟 ontvangen.",
    readyTitle: "Klaar voor je eerste verhaal?",
  },
  pl: {
    skip: "Pomiń",
    stepOf: "Krok {current} z {total}",
    next: "Dalej",
    back: "Wstecz",
    finish: "Rozpocznij Przygodę! ✨",
    step1Title: "Cześć! Jestem Sparky ✨",
    step1Subtitle: "Twój inteligentny korepetytor czytania z Meta AI.",
    nameLabel: "Kto dzisiaj czyta?",
    namePlaceholder: "Wpisz imię...",
    levelLabel: "Poziom czytania:",
    levelBeginner: "🐣 Początkujący (4 - 6 lat)",
    levelBeginnerDesc: "Litery i proste słowa.",
    levelIntermediate: "🌟 Odkrywca (7 - 8 lat)",
    levelIntermediateDesc: "Opowiadania i płynność.",
    levelAdvanced: "🚀 Mistrz Czytania (9+ lat)",
    levelAdvancedDesc: "Szybkość i bogate słownictwo.",
    step2Title: "Jak działa Sparky?",
    step2Subtitle: "Czytaj prawdziwe książki papierowe z pomocą AI.",
    howStep1Title: "1. Zeskanuj stronę",
    howStep1Desc: "Zrób zdjęcie strony papierowej książki.",
    howStep2Title: "2. Czytaj na głos",
    howStep2Desc: "Sparky słucha i podświetla słowa w czasie rzeczywistym.",
    howStep3Title: "3. Dotknij trudnego słowa",
    howStep3Desc: "Meta AI Tutor dzieli słowo na sylaby i pokazuje obrazek.",
    step3Title: "Czcionka i Wygoda",
    step3Subtitle: "Czcionki przyjazne dzieciom i osobom z dysleksją.",
    fontPreviewLabel: "Podgląd czcionki na żywo:",
    fontPreviewText: "Koliber szybuje zwinnie pośród kwiatów.",
    fontLexend: "Lexend Deca",
    fontComic: "Comic",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Linijka skupienia",
    featureRulerDesc: "Ułatwia śledzenie wersów.",
    featureSyllables: "Podział na sylaby",
    featureSyllablesDesc: "Ułatwia długie słowa.",
    step4Title: "Wszystko gotowe!",
    step4Subtitle: "Ustal dzienny cel czytania UNESCO.",
    goalLabel: "Dzienny cel:",
    minutesUnit: "min/dzień",
    unescoBadge: "🏆 Standard UNESCO ERCE",
    welcomeGiftTitle: "Prezent Powitalny!",
    welcomeGiftDesc: "Otrzymujesz 45 Magicznych Gwiazdek 🌟.",
    readyTitle: "Gotowy na pierwsze opowiadanie?",
  },
  tr: {
    skip: "Geç",
    stepOf: "Adım {current} / {total}",
    next: "İleri",
    back: "Geri",
    finish: "Okuma Macerasına Başla! ✨",
    step1Title: "Merhaba! Ben Sparky ✨",
    step1Subtitle: "Meta AI destekli akıllı okuma arkadaşın.",
    nameLabel: "Bugün kim okuyor?",
    namePlaceholder: "İsmini yaz...",
    levelLabel: "Okuma seviyesi:",
    levelBeginner: "🐣 Başlangıç (4 - 6 yaş)",
    levelBeginnerDesc: "Harfler, sesler ve kısa sözcükler.",
    levelIntermediate: "🌟 Gelişen Okur (7 - 8 yaş)",
    levelIntermediateDesc: "Resimli hikayeler ve akıcı tonlama.",
    levelAdvanced: "🚀 Usta Okur (9+ yaş)",
    levelAdvancedDesc: "Anlama, okuma hızı ve zengin kelimeler.",
    step2Title: "Sparky Nasıl Çalışır?",
    step2Subtitle: "Yapay zeka büyüsüyle gerçek basılı kitapları oku.",
    howStep1Title: "1. Gerçek Kitabını Tara",
    howStep1Desc: "Evdeki veya okuldaki kitabın sayfasını fotoğrafla.",
    howStep2Title: "2. Sesli Oku",
    howStep2Desc: "Sparky telaffuzunu anlık dinler ve kelimeleri yeşil yapar.",
    howStep3Title: "3. Zor Kelimeye Dokun",
    howStep3Desc: "Meta AI Tutor hecelere böler ve resimli kart gösterir.",
    step3Title: "Konfor & Erişilebilirlik",
    step3Subtitle: "Göz yormayan ve disleksi dostu yazı tipleri.",
    fontPreviewLabel: "Canlı yazı tipi önizlemesi:",
    fontPreviewText: "Küçük sinek kuşu renkli çiçekler arasında kanat çırpar.",
    fontLexend: "Lexend Deca",
    fontComic: "Çocukça Comic",
    fontDyslexic: "OpenDyslexic",
    featureRuler: "Odak Çizgisi",
    featureRulerDesc: "Satır atlamayı engeller.",
    featureSyllables: "Heceleme Desteği",
    featureSyllablesDesc: "Uzun kelimeleri kolayca böler.",
    step4Title: "Her Şey Hazır!",
    step4Subtitle: "UNESCO önerili günlük okuma hedefini belirle.",
    goalLabel: "Günlük hedef:",
    minutesUnit: "dk/gün",
    unescoBadge: "🏆 UNESCO ERCE Standardı",
    welcomeGiftTitle: "Hoş Geldin Hediyesi!",
    welcomeGiftDesc: "Koleksiyon için 45 Sihirli Yıldız 🌟 kazandın.",
    readyTitle: "İlk hikayene başlamaya hazır mısın?",
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
  const [selectedAvatar, setSelectedAvatar] = useState<string>("🌟");
  const [readingLevel, setReadingLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [selectedFont, setSelectedFont] = useState<"lexend" | "comic" | "dyslexic">("lexend");
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(10);
  const [focusRulerEnabled, setFocusRulerEnabled] = useState<boolean>(true);
  const [syllableSplitsEnabled, setSyllableSplitsEnabled] = useState<boolean>(true);

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
      if (p.avatar) setSelectedAvatar(p.avatar);
      if (p.level) setReadingLevel(p.level);
      if (p.dailyGoalMinutes) setDailyGoalMinutes(p.dailyGoalMinutes);
    } catch {}
  };

  const handleNext = () => {
    playChime("tap");
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
      name: readerName.trim() || (language === 'es' ? "Pequeño Lector" : "Young Reader"),
      avatar: selectedAvatar,
      level: readingLevel,
      dailyGoalMinutes,
    });
    await setOnboardingCompleted(true);
    onClose();
  };

  const handleSkip = async () => {
    playChime("tap");
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
                  <Text style={styles.mascotBigEmoji}>{selectedAvatar || "✨"}</Text>
                </LinearGradient>

                <Text style={[styles.stepTitle, { color: theme.text }]}>{t.step1Title}</Text>
                <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                  {t.step1Subtitle}
                </Text>

                {/* Avatar Picker */}
                <View style={styles.avatarRow}>
                  {AVATAR_OPTIONS.map((item) => {
                    const isSelected = selectedAvatar === item.emoji;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          playChime("tap");
                          setSelectedAvatar(item.emoji);
                        }}
                        style={[
                          styles.avatarOption,
                          {
                            backgroundColor: isSelected ? theme.badges.kpiAccuracyBg : theme.surfaceSecondary,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text style={styles.avatarOptionEmoji}>{item.emoji}</Text>
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
                  <Text style={styles.iconCircleBigEmoji}>📖</Text>
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
                      <Text style={styles.howCardIconText}>📸</Text>
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
                      <Text style={styles.howCardIconText}>🎙️</Text>
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
                      <Text style={styles.howCardIconText}>💡</Text>
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
                  <Text style={styles.iconCircleBigEmoji}>🔤</Text>
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
                        📏 {t.featureRuler}
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
                        🧩 {t.featureSyllables}
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
                  <Text style={styles.mascotBigEmoji}>🎉</Text>
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
                  <Text style={styles.giftEmoji}>🎁</Text>
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
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  mascotBigEmoji: {
    fontSize: 40,
  },
  iconCircleBig: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircleBigEmoji: {
    fontSize: 34,
  },
  stepTitle: {
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
  avatarOptionEmoji: {
    fontSize: 24,
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
  howCardIconText: {
    fontSize: 20,
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
  giftEmoji: {
    fontSize: 32,
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
