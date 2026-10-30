import { WordToken, WordStatus, ReadingErrorDetail, SupportedLanguage } from '../types';
import { playChime } from './ttsService';
import { transcribeAudioWithMuseVoice } from './metaApi';
import { getCloudVoiceConsent } from './storageService';

export interface AlignmentResult {
  tokens: WordToken[];
  currentIndex: number;
  newError?: ReadingErrorDetail;
  isComplete: boolean;
}

const SPEECH_LANG_MAP: Record<SupportedLanguage, string> = {
  en: 'en-US',
  es: 'es-DO',
  fr: 'fr-FR',
  pt: 'pt-BR',
  de: 'de-DE',
  it: 'it-IT',
  nl: 'nl-NL',
  pl: 'pl-PL',
  tr: 'tr-TR',
};

export class SpeechRecognitionController {
  private recognition: any = null;
  private isListening: boolean = false;
  private language: SupportedLanguage = 'en';
  private mediaRecorder: any = null;
  private audioChunks: Blob[] = [];
  private lastWordTimestamp: number = 0;
  private hesitationTimer: any = null;

  public onWordSpoken?: (spokenText: string, isFinal: boolean) => void;
  public onHesitationDetected?: (wordIndex: number) => void;
  public onError?: (error: string) => void;
  public onEnd?: () => void;

  public isCloudFallback: boolean = false;

  constructor(language: SupportedLanguage = 'en') {
    this.language = language;
    this.initRecognition();
  }

  public setLanguage(lang: SupportedLanguage) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = SPEECH_LANG_MAP[lang] || 'en-US';
    }
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition API not available in this environment. Using Meta Muse Voice Transcribe fallback.');
      this.isCloudFallback = true;
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = SPEECH_LANG_MAP[this.language] || 'en-US';
      this.recognition.maxAlternatives = 2;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const activeText = finalTranscript.trim() || interimTranscript.trim();
        if (activeText && this.onWordSpoken) {
          this.onWordSpoken(activeText, !!finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition event warning:', event.error);
        if (event.error !== 'no-speech' && this.onError) {
          this.onError(event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Keep listening active continuously while reading
          try {
            this.recognition.start();
          } catch (e) {
            this.isListening = false;
            if (this.onEnd) this.onEnd();
          }
        } else {
          if (this.onEnd) this.onEnd();
        }
      };
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition:', e);
    }
  }

  public startListening() {
    this.isListening = true;
    this.lastWordTimestamp = Date.now();
    this.audioChunks = [];

    // Start Web Speech API
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        // May already be started
      }
    }

    // Record audio for the Meta Muse Voice check only when a parent allowed cloud voice
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      getCloudVoiceConsent()
        .then((allowed) => (allowed && this.isListening ? navigator.mediaDevices.getUserMedia({ audio: true }) : null))
        .then((stream) => {
          if (!stream) return;
          try {
            this.mediaRecorder = new MediaRecorder(stream);
            this.mediaRecorder.ondataavailable = (e: any) => {
              if (e.data && e.data.size > 0) {
                this.audioChunks.push(e.data);
              }
            };
            this.mediaRecorder.start(1000);
          } catch (err) {
            console.warn('MediaRecorder error:', err);
          }
        })
        .catch((err) => {
          console.warn('Microphone permission not granted:', err);
        });
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.hesitationTimer) {
      clearTimeout(this.hesitationTimer);
      this.hesitationTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // ignore
      }
    }
    // Release the microphone so the browser's recording indicator turns off
    this.mediaRecorder?.stream?.getTracks().forEach((track: any) => track.stop());

    // If device SpeechRecognition API is absent, transcribe recorded audio via Meta Muse Voice
    if (this.isCloudFallback && this.audioChunks.length > 0) {
      const blob = this.getAudioBlob();
      if (blob) {
        transcribeAudioWithMuseVoice(blob, this.language)
          .then((transcript) => {
            if (transcript && this.onWordSpoken) {
              this.onWordSpoken(transcript, true);
            }
          })
          .catch((err) => {
            console.warn('Muse Voice Transcribe fallback error:', err);
          });
      }
    }
  }

  public async transcribeCurrentAudio(): Promise<string> {
    // MediaRecorder delivers its last chunk asynchronously after stop()
    await new Promise((resolve) => setTimeout(resolve, 300));
    const blob = this.getAudioBlob();
    if (!blob) return '';
    return await transcribeAudioWithMuseVoice(blob, this.language);
  }

  public getAudioBlob(): Blob | null {
    if (this.audioChunks.length === 0) return null;
    return new Blob(this.audioChunks, { type: 'audio/webm' });
  }

  // Live word-by-word recognition needs the platform Web Speech API (Chrome, Edge, Safari)
  public hasLiveRecognition(): boolean {
    return !!this.recognition;
  }

  public isAvailable(): boolean {
    return !!this.recognition || (typeof navigator !== 'undefined' && !!navigator.mediaDevices);
  }
}

/**
 * Normalizes text for phonetic comparison.
 * In Spanish: handles accents (á -> a), eliminates punctuation, treats v/b, c/s/z flexibly.
 */
export function normalizeWord(word: string, language: SupportedLanguage = 'en'): string {
  if (!word) return '';
  let str = word.toLowerCase().trim();

  // Strip all punctuation
  str = str.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'¡¿«»]/g, '');

  // Standardize accents across Latin-based languages for phonetic matching
  str = str
    .replace(/[áàäâãą]/g, 'a')
    .replace(/[éèëêę]/g, 'e')
    .replace(/[íìïîı]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[çć]/g, 'c')
    .replace(/[ß]/g, 'ss')
    .replace(/[ł]/g, 'l')
    .replace(/[ń]/g, 'n')
    .replace(/[śş]/g, 's')
    .replace(/[źż]/g, 'z')
    .replace(/[ğ]/g, 'g');

  return str;
}

/**
 * Computes Levenshtein Distance similarity ratio (0.0 to 1.0)
 */
export function calculateSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeWord(s1);
  const norm2 = normalizeWord(s2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longerLength - editDistance) / longerLength;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Evaluates spoken phrase against current target word in book page.
 * Returns updated tokens, current index, and detected errors.
 */
export function matchSpokenWordToTokens(
  spokenPhrase: string,
  tokens: WordToken[],
  currentIndex: number,
  language: SupportedLanguage = 'en',
  timeSinceLastWordMs: number = 0
): { updatedTokens: WordToken[]; nextIndex: number; error?: ReadingErrorDetail } {
  if (currentIndex >= tokens.length) {
    return { updatedTokens: tokens, nextIndex: currentIndex };
  }

  const updated = [...tokens];
  const targetToken = updated[currentIndex];
  const targetWord = targetToken.word;

  // Split spoken phrase into individual spoken words (takes the latest spoken tokens)
  const spokenWords = spokenPhrase
    .trim()
    .split(/\s+/)
    .map((w) => normalizeWord(w, language))
    .filter(Boolean);

  if (spokenWords.length === 0) {
    return { updatedTokens: tokens, nextIndex: currentIndex };
  }

  const lastSpoken = spokenWords[spokenWords.length - 1];
  const similarity = calculateSimilarity(targetWord, lastSpoken);

  // Check hesitation (> 1800ms between words)
  const isHesitation = timeSinceLastWordMs > 1800;

  // 1. High match (Correct word)
  if (similarity >= 0.78) {
    if (isHesitation) {
      updated[currentIndex] = {
        ...targetToken,
        status: 'hesitation',
        spokenWord: lastSpoken,
        hesitationMs: timeSinceLastWordMs,
      };
      playChime('tap');
      return {
        updatedTokens: updated,
        nextIndex: currentIndex + 1,
        error: {
          word: targetToken.word,
          display: targetToken.display,
          errorType: 'hesitation',
          hesitationSeconds: Math.round(timeSinceLastWordMs / 100) / 10,
          syllables: targetToken.syllables,
        },
      };
    } else {
      updated[currentIndex] = {
        ...targetToken,
        status: 'correct',
        spokenWord: lastSpoken,
      };
      playChime('correct');
      return {
        updatedTokens: updated,
        nextIndex: currentIndex + 1,
      };
    }
  }

  // 2. Check if the child skipped ahead (matched next word or 2 words ahead)
  if (currentIndex + 1 < tokens.length) {
    const nextSim = calculateSimilarity(tokens[currentIndex + 1].word, lastSpoken);
    if (nextSim >= 0.8) {
      // Child skipped current word!
      updated[currentIndex] = {
        ...targetToken,
        status: 'skipped',
      };
      updated[currentIndex + 1] = {
        ...tokens[currentIndex + 1],
        status: 'correct',
        spokenWord: lastSpoken,
      };
      playChime('tap');
      return {
        updatedTokens: updated,
        nextIndex: currentIndex + 2,
        error: {
          word: targetToken.word,
          display: targetToken.display,
          errorType: 'skipped',
          syllables: targetToken.syllables,
        },
      };
    }
  }

  // 3. Child attempted word but mispronounced it (similarity between 0.35 and 0.77)
  if (similarity >= 0.35 && lastSpoken.length >= 2) {
    updated[currentIndex] = {
      ...targetToken,
      status: 'mispronounced',
      spokenWord: lastSpoken,
    };
    playChime('tap');
    return {
      updatedTokens: updated,
      nextIndex: currentIndex + 1,
      error: {
        word: targetToken.word,
        display: targetToken.display,
        spokenWord: lastSpoken,
        errorType: 'mispronounced',
        syllables: targetToken.syllables,
      },
    };
  }

  // No confident match yet, keep waiting
  return { updatedTokens: tokens, nextIndex: currentIndex };
}

export interface TranscriptScore {
  correctWords: number;
  mispronouncedWords: number;
  skippedWords: number;
  accuracyPercent: number;
}

/**
 * Scores a full-session transcript (e.g. from Meta Muse Voice) against the page text.
 * Word-level edit-distance alignment: extra spoken words (repeats, self-corrections) are cheap
 * insertions, missing page words are skips, and aligned words that sound different are mispronunciations.
 */
export function scoreTranscriptAgainstPage(
  transcript: string,
  tokens: WordToken[],
  language: SupportedLanguage = 'en'
): TranscriptScore {
  const target = tokens.map((t) => normalizeWord(t.word, language));
  const spoken = transcript
    .split(/\s+/)
    .map((w) => normalizeWord(w, language))
    .filter(Boolean);
  const n = target.length;
  const m = spoken.length;
  const INSERT = 0.5;
  const SKIP = 1;
  const MISMATCH = 1;
  const isMatch = (i: number, j: number) => calculateSimilarity(target[i], spoken[j]) >= 0.78;

  // cost[i][j] = cheapest alignment of target[0..i) with spoken[0..j)
  const cost: number[][] = Array.from({ length: n + 1 }, (_, i) =>
    Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j * INSERT : j === 0 ? i * SKIP : 0))
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      cost[i][j] = Math.min(
        cost[i - 1][j - 1] + (isMatch(i - 1, j - 1) ? 0 : MISMATCH),
        cost[i - 1][j] + SKIP,
        cost[i][j - 1] + INSERT
      );
    }
  }

  let correct = 0;
  let mispronounced = 0;
  let skipped = 0;
  let i = n;
  let j = m;
  while (i > 0) {
    if (j > 0 && cost[i][j] === cost[i - 1][j - 1] + (isMatch(i - 1, j - 1) ? 0 : MISMATCH)) {
      if (isMatch(i - 1, j - 1)) correct += 1;
      else mispronounced += 1;
      i -= 1;
      j -= 1;
    } else if (cost[i][j] === cost[i - 1][j] + SKIP) {
      skipped += 1;
      i -= 1;
    } else {
      j -= 1;
    }
  }

  return {
    correctWords: correct,
    mispronouncedWords: mispronounced,
    skippedWords: skipped,
    accuracyPercent: n > 0 ? Math.round((correct / n) * 100) : 0,
  };
}
