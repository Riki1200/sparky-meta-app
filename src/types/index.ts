export type SupportedLanguage = 'en' | 'es' | 'fr' | 'pt' | 'de' | 'it' | 'nl' | 'pl' | 'tr';

export type WordStatus = 'pending' | 'current' | 'correct' | 'hesitation' | 'mispronounced' | 'skipped';

export interface WordToken {
  id: string;
  word: string;
  display: string;
  status: WordStatus;
  spokenWord?: string;
  hesitationMs?: number;
  timestamp?: number;
  syllables?: string[];
  explanation?: string;
}

// Remote image URL, or a bundled asset from require() (a number on native, { uri, width, height } on web)
export type ImageRef = string | number | { uri: string; width?: number; height?: number };

export interface BookPage {
  id: string;
  title: string;
  source: string;
  language: SupportedLanguage;
  text: string;
  imageUrl?: ImageRef;
  words: WordToken[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Principiante' | 'Intermedio' | 'Avanzado' | string;
  gradeLevel: string;
}

export interface ReadingErrorDetail {
  word: string;
  display: string;
  errorType: 'mispronounced' | 'hesitation' | 'skipped';
  spokenWord?: string;
  hesitationSeconds?: number;
  syllables?: string[];
}

export interface ReadingSessionResult {
  id: string;
  pageId: string;
  pageTitle: string;
  bookSource: string;
  language: SupportedLanguage;
  date: string;
  durationSeconds: number;
  totalWords: number;
  correctWords: number;
  hesitationWords: number;
  mispronouncedWords: number;
  skippedWords: number;
  accuracyPercent: number;
  wordsPerMinute: number;
  errors: ReadingErrorDetail[];
  tutorFeedback?: string;
  gradeLevel: string;
  metaMuseTranscript?: string;
  // Accuracy re-scored by aligning the Meta Muse Voice transcript with the page text
  metaVerifiedAccuracyPercent?: number;
  evaluatedBy?: 'meta-muse-voice' | 'hybrid' | 'device';
}

export interface ComprehensionQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface WordExplanation {
  word: string;
  simpleMeaning: string;
  funExample: string;
  syllables: string;
  encouragement: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  words: string[];
}

export type MascotMood = 'idle' | 'listening' | 'celebrating' | 'thinking' | 'encouraging';

