import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { SupportedLanguage } from '../types';

let audioCtx: any = null;

const TTS_LANG_MAP: Record<SupportedLanguage, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  pt: 'pt-BR',
  de: 'de-DE',
  it: 'it-IT',
  nl: 'nl-NL',
  pl: 'pl-PL',
  tr: 'tr-TR',
};

function getAudioContext() {
  if (typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass && !audioCtx) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

let cachedVoices: SpeechSynthesisVoice[] = [];

if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Kid-friendly Text-to-Speech (TTS) engine.
 * Speaks naturally at a comfortable, warm pace for early readers.
 */
export async function speakText(
  text: string,
  language: SupportedLanguage = 'en',
  rate: number = 0.9,
  onDone?: () => void
): Promise<void> {
  const langCode = TTS_LANG_MAP[language] || 'en-US';

  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = rate; // Gentle, clear speed for kids
    utterance.pitch = 1.08; // Slightly higher, warm and friendly

    // Prefer a warm, natural voice if available
    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    const matchingVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(language.toLowerCase()) &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Paulina') ||
            v.name.includes('Luciana') ||
            v.name.includes('Mónica') ||
            v.name.includes('Diego') ||
            v.name.includes('Francisca'))
      ) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(language.toLowerCase())) ||
      voices.find((v) => v.lang.toLowerCase().includes(langCode.toLowerCase()));

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => {
      if (onDone) onDone();
    };
    utterance.onerror = () => {
      if (onDone) onDone();
    };

    window.speechSynthesis.speak(utterance);
    return;
  }

  // Native iOS / Android via Expo Speech
  try {
    Speech.stop();
    Speech.speak(text, {
      language: langCode,
      rate,
      pitch: 1.1,
      onDone,
    });
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onDone) onDone();
  }
}

/**
 * Kid-friendly voice sample preview for testing Sparky's voice.
 */
export function getSparkyVoiceSample(language: SupportedLanguage = 'en'): string {
  const samples: Record<SupportedLanguage, string> = {
    es: '¡Hola amiguito! Soy Sparky, tu tutor con Meta Muse Spark. ¡Juntos haremos que cada palabra sea una aventura mágica!',
    en: 'Hello superstar! I am Sparky, your reading tutor powered by Meta Muse Spark. Together we make every story an adventure!',
    fr: 'Bonjour petit champion ! Je suis Sparky, ton tuteur propulsé par Meta Muse Spark. Découvrons ensemble la magie des mots !',
    pt: 'Olá amiguinho! Sou o Sparky, seu tutor de leitura da Meta Muse Spark. Ler com você é uma grande aventura mágica!',
    de: 'Hallo Lesestar! Ich bin Sparky, dein Lesetutor mit Meta Muse Spark. Zusammen entdecken wir spannende Geschichten!',
    it: 'Ciao piccolo campione! Sono Sparky, il tuo tutor di lettura con Meta Muse Spark. Leggere insieme è un’avventura fantastica!',
    nl: 'Hallo superster! Ik ben Sparky, jouw leestutor met Meta Muse Spark. Samen maken we van elk verhaal een feestje!',
    pl: 'Cześć przyjacielu! Jestem Sparky, Twój czytelniczy pomocnik z Meta Muse Spark. Razem odkryjemy niesamowite historie!',
    tr: 'Merhaba minik okur! Ben Meta Muse Spark ile güçlendirilmiş eğitmenin Sparky. Birlikte okumak harika bir macera!',
  };
  return samples[language] || samples.en;
}

/**
 * Pronounce a single tricky word slowly and clearly.
 */
export async function speakWordPhonetically(
  word: string,
  language: SupportedLanguage = 'en'
): Promise<void> {
  await speakText(word, language, 0.75);
}

/**
 * Stop any current voice readout.
 */
export function stopSpeaking(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  } else {
    try {
      Speech.stop();
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Web Audio API synthesizer for child-friendly feedback chimes.
 * Generates sparkling tones without relying on external MP3 downloads.
 */
export function playChime(type: 'correct' | 'complete' | 'sparkle' | 'hesitation' | 'tap'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      // Gentle cheerful ding (E5 -> B5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'complete') {
      // Celebratory arpeggio fanfare (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.connect(g);
        g.connect(ctx.destination);
        const startTime = now + idx * 0.1;
        o.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(0.25, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        o.start(startTime);
        o.stop(startTime + 0.35);
      });
    } else if (type === 'sparkle') {
      // Mascot shimmer
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(1760, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'tap') {
      // Soft woodblock click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {
    // Audio context might be restricted before first gesture
  }
}
